import { Assessment, EvaluationRule, Period, AssessmentType } from './mock-data'

export interface PeriodCalculationResult {
  periodId: string
  periodName: string
  regularAverage: number
  recoveryGrade: number | null
  finalPeriodGrade: number
  isRecoveryUsed: boolean
  logs: string[]
}

export interface SubjectCalculationResult {
  finalGrade: number
  isPassing: boolean
  status: 'Aprovado' | 'Reprovado' | 'Dependência' | 'Cursando'
  periodResults: PeriodCalculationResult[]
  ruleName: string
  formulaUsed: string
  rawFinalGrade: number
}

/**
 * Calculates student grades based on evaluation rules, assessments and periods.
 * Provides a detailed breakdown of the calculation process.
 */
export function calculateGrades(
  studentAssessments: Assessment[],
  rule: EvaluationRule,
  periods: Period[],
  assessmentTypes: AssessmentType[],
): SubjectCalculationResult {
  const periodResults: PeriodCalculationResult[] = []

  // 1. Calculate Grade per Period
  for (const period of periods) {
    const periodLog: string[] = []

    // Filter assessments for this period
    const pAssessments = studentAssessments.filter(
      (a) => a.periodId === period.id,
    )

    // Separate Regular and Recuperation
    const regularAssessments = pAssessments.filter(
      (a) => (a.category || 'regular') === 'regular',
    )
    const recoveryAssessments = pAssessments.filter(
      (a) => a.category === 'recuperation',
    )

    let regularAverage = 0

    // Check for Type Weights
    if (rule.typeWeights && Object.keys(rule.typeWeights).length > 0) {
      periodLog.push('Cálculo: Média Ponderada por Tipo de Avaliação.')
      let weightedSum = 0
      let totalWeight = 0

      for (const [typeId, weight] of Object.entries(rule.typeWeights)) {
        const typeName =
          assessmentTypes.find((t) => t.id === typeId)?.name || 'Desconhecido'
        const typeAssessments = regularAssessments.filter(
          (a) => a.assessmentTypeId === typeId,
        )

        if (typeAssessments.length > 0) {
          // Average for this type
          const sum = typeAssessments.reduce(
            (acc, curr) => acc + Number(curr.value),
            0,
          )
          const avg = sum / typeAssessments.length

          weightedSum += avg * (weight / 100)
          totalWeight += weight
          periodLog.push(
            `• ${typeName}: Média ${avg.toFixed(2)} (Peso ${weight}%) -> Contribuição: ${(avg * (weight / 100)).toFixed(2)}`,
          )
        } else {
          periodLog.push(
            `• ${typeName}: Nenhuma nota lançada (Peso ${weight}%)`,
          )
        }
      }

      // If weights don't sum to 100, we typically treat the configured weights as absolute contributions
      // Alternatively, we could normalize. For this system, let's assume absolute contribution to final grade (0-10).
      regularAverage = weightedSum
    } else {
      // Simple Average
      // Filter out excluded types (e.g. 'Simulado Extra' marked as excludeFromAverage)
      const validAssessments = regularAssessments.filter((a) => {
        const type = assessmentTypes.find((t) => t.id === a.assessmentTypeId)
        if (type?.excludeFromAverage) {
          periodLog.push(
            `Nota ${a.value} ignorada (Tipo: ${type.name} não contabiliza na média)`,
          )
          return false
        }
        return true
      })

      if (validAssessments.length > 0) {
        let values = validAssessments.map((a) => Number(a.value))

        // Handle Exclusions (Drop lowest)
        if (rule.allowedExclusions && values.length > 1) {
          const minVal = Math.min(...values)
          periodLog.push(
            `Regra de Exclusão Ativa: Removendo a menor nota (${minVal}) do cálculo.`,
          )
          // Remove only one instance of minVal
          const minIndex = values.indexOf(minVal)
          if (minIndex > -1) values.splice(minIndex, 1)
        }

        const sum = values.reduce((acc, v) => acc + v, 0)
        regularAverage = sum / values.length
        periodLog.push(
          `Média Aritmética: Soma (${sum}) / Qtd (${values.length}) = ${regularAverage.toFixed(2)}`,
        )
      } else {
        regularAverage = 0
        periodLog.push('Nenhuma avaliação regular válida para cálculo.')
      }
    }

    // Handle Recovery
    let finalPeriodGrade = regularAverage
    let recoveryGrade: number | null = null
    let isRecoveryUsed = false

    if (recoveryAssessments.length > 0) {
      // Take max recovery grade
      const maxRecovery = Math.max(
        ...recoveryAssessments.map((a) => Number(a.value)),
      )
      recoveryGrade = maxRecovery

      if (maxRecovery > regularAverage) {
        finalPeriodGrade = maxRecovery
        isRecoveryUsed = true
        periodLog.push(
          `Recuperação (${maxRecovery}) é maior que a média regular (${regularAverage.toFixed(2)}). Nota substituída.`,
        )
      } else {
        periodLog.push(
          `Recuperação (${maxRecovery}) não superou a média regular (${regularAverage.toFixed(2)}). Mantida a nota original.`,
        )
      }
    }

    periodResults.push({
      periodId: period.id,
      periodName: period.name,
      regularAverage,
      recoveryGrade,
      finalPeriodGrade,
      isRecoveryUsed,
      logs: periodLog,
    })
  }

  // 2. Calculate Final Grade
  let finalGrade = 0
  let formulaUsed = 'Média Aritmética dos Períodos'

  if (rule.formula) {
    formulaUsed = rule.formula
    try {
      // Construct context
      const context: Record<string, number> = {}
      periodResults.forEach((res, index) => {
        context[`eval${index + 1}`] = res.finalPeriodGrade
      })

      // Parse formula (Simple naive parser for demo: replace vars and eval)
      let expression = rule.formula

      // Check if we have enough periods for the formula
      // Assume formula uses eval1..evalN
      Object.keys(context).forEach((key) => {
        expression = expression.replace(
          new RegExp(key, 'g'),
          context[key].toString(),
        )
      })

      // Replace remaining evals with 0 if not yet happened (future periods)
      expression = expression.replace(/eval\d+/g, '0')

      // Safety check: only allow digits, operators, parens, dots, spaces
      if (/^[\d.+\-*/()\s]+$/.test(expression)) {
        // eslint-disable-next-line no-new-func
        finalGrade = new Function(`return ${expression}`)()
      } else {
        console.error('Caracteres inválidos na fórmula', expression)
        finalGrade = 0
      }
    } catch (e) {
      console.error('Erro ao calcular fórmula', e)
      finalGrade = 0
    }
  } else {
    // Default: Average of periods
    if (periodResults.length > 0) {
      const sum = periodResults.reduce((acc, p) => acc + p.finalPeriodGrade, 0)
      // Usually divide by periodCount defined in Rule
      const divisor = rule.periodCount || 4
      finalGrade = sum / divisor
      formulaUsed = `Soma das notas (${sum.toFixed(1)}) / Total de períodos (${divisor})`
    }
  }

  // Round final grade
  const rawFinalGrade = finalGrade
  finalGrade = parseFloat(finalGrade.toFixed(1))

  // 3. Determine Status
  let status: SubjectCalculationResult['status'] = 'Cursando'

  const passingGrade = rule.passingGrade || 6.0
  const minDependency = rule.minDependencyGrade || 4.0

  // Only consider Approved/Failed if we have data for periods (at least one)
  // Or simply calculate based on current accumulation vs passing
  // Ideally we check if all periods are closed, but for this simpler version:
  if (finalGrade >= passingGrade) {
    status = 'Aprovado'
  } else if (finalGrade >= minDependency) {
    status = 'Dependência'
  } else {
    status = 'Reprovado'
  }

  return {
    finalGrade,
    rawFinalGrade,
    isPassing: finalGrade >= passingGrade,
    status,
    periodResults,
    ruleName: rule.name,
    formulaUsed,
  }
}
