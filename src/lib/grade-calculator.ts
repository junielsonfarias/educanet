import { Assessment, EvaluationRule, Period, AssessmentType } from './mock-data'

export interface CalculatedAssessment extends Assessment {
  originalValue?: number
  isRecovered?: boolean
  recoveryValue?: number
  recoveryDate?: string
}

export interface PeriodCalculationResult {
  periodId: string
  periodName: string
  regularAverage: number
  recoveryGrade: number | null
  finalPeriodGrade: number
  isRecoveryUsed: boolean
  logs: string[]
  assessments: CalculatedAssessment[] // Detailed breakdown of assessments for this period
}

export interface SubjectCalculationResult {
  finalGrade: number
  isPassing: boolean
  status: 'Aprovado' | 'Reprovado' | 'Dependência' | 'Cursando'
  periodResults: PeriodCalculationResult[]
  ruleName: string
  formulaUsed: string
  rawFinalGrade: number
  recoveryStrategyApplied: string
}

/**
 * Calculates student grades based on evaluation rules, assessments and periods.
 * Provides a detailed breakdown of the calculation process including individual recovery linkage.
 */
export function calculateGrades(
  studentAssessments: Assessment[],
  rule: EvaluationRule,
  periods: Period[],
  assessmentTypes: AssessmentType[],
  defaultStrategy:
    | 'replace_if_higher'
    | 'always_replace'
    | 'average' = 'replace_if_higher',
): SubjectCalculationResult {
  const periodResults: PeriodCalculationResult[] = []
  const activeStrategy = rule.recoveryStrategy || defaultStrategy

  // 1. Calculate Grade per Period
  for (const period of periods) {
    const periodLog: string[] = []

    // Filter assessments for this period (comparação flexível)
    const pAssessments = studentAssessments.filter(
      (a) => String(a.periodId) === String(period.id),
    )

    // Separate Regular and Recuperation
    const regularAssessments = pAssessments.filter(
      (a) => (a.category || 'regular') === 'regular',
    )
    const recoveryAssessments = pAssessments.filter(
      (a) => a.category === 'recuperation',
    )

    // Process Individual Linked Recoveries (comparação flexível)
    const effectiveAssessments: CalculatedAssessment[] = regularAssessments.map(
      (reg) => {
        const linkedRecovery = recoveryAssessments.find(
          (rec) => String(rec.relatedAssessmentId) === String(reg.id),
        )
        let effectiveValue = Number(reg.value)
        const originalValue = Number(reg.value)
        let isRecovered = false
        let recoveryValue: number | undefined
        let recoveryDate: string | undefined

        if (linkedRecovery) {
          const recVal = Number(linkedRecovery.value)
          recoveryValue = recVal
          recoveryDate = linkedRecovery.date
          isRecovered = true

          if (activeStrategy === 'always_replace') {
            effectiveValue = recVal
            periodLog.push(
              `Recuperação Individual: Avaliação (${originalValue}) substituída por (${recVal}) [Sempre Substituir].`,
            )
          } else if (activeStrategy === 'average') {
            effectiveValue = (originalValue + recVal) / 2
            periodLog.push(
              `Recuperação Individual: Média entre (${originalValue}) e (${recVal}) = ${effectiveValue.toFixed(2)}.`,
            )
          } else {
            // Default: replace_if_higher
            if (recVal > originalValue) {
              effectiveValue = recVal
              periodLog.push(
                `Recuperação Individual: Avaliação (${originalValue}) substituída por (${recVal}) [Maior Nota].`,
              )
            } else {
              periodLog.push(
                `Recuperação Individual: Recuperação (${recVal}) não superou original (${originalValue}). Mantida original.`,
              )
            }
          }
        }
        return {
          ...reg,
          value: effectiveValue, // Override value for calculation
          originalValue,
          isRecovered,
          recoveryValue,
          recoveryDate,
        }
      },
    )

    let regularAverage = 0

    // Check for Type Weights
    if (rule.typeWeights && Object.keys(rule.typeWeights).length > 0) {
      periodLog.push('Cálculo: Média Ponderada por Tipo de Avaliação.')
      let weightedSum = 0
      let totalWeight = 0

      for (const [typeId, weight] of Object.entries(rule.typeWeights)) {
        const typeName =
          assessmentTypes.find((t) => String(t.id) === String(typeId))?.name || 'Desconhecido'
        // Filter effective assessments by type (comparação flexível)
        const typeAssessments = effectiveAssessments.filter(
          (a) => String(a.assessmentTypeId) === String(typeId),
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

      regularAverage = weightedSum
    } else {
      // Simple Average
      // Filter out excluded types (comparação flexível)
      const validAssessments = effectiveAssessments.filter((a) => {
        const type = assessmentTypes.find((t) => String(t.id) === String(a.assessmentTypeId))
        if (type?.excludeFromAverage) {
          periodLog.push(
            `Nota ${a.value} ignorada (Tipo: ${type?.name} não contabiliza na média)`,
          )
          return false
        }
        return true
      })

      if (validAssessments.length > 0) {
        const values = validAssessments.map((a) => Number(a.value))

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

    // Handle Period Recovery (Unlinked Assessments)
    const unlinkedRecoveryAssessments = recoveryAssessments.filter(
      (a) => !a.relatedAssessmentId,
    )

    let finalPeriodGrade = regularAverage
    let recoveryGrade: number | null = null
    let isRecoveryUsed = false

    if (unlinkedRecoveryAssessments.length > 0) {
      // Take max recovery grade
      const maxRecovery = Math.max(
        ...unlinkedRecoveryAssessments.map((a) => Number(a.value)),
      )
      recoveryGrade = maxRecovery

      if (activeStrategy === 'always_replace') {
        finalPeriodGrade = maxRecovery
        isRecoveryUsed = true
        periodLog.push(
          `Recuperação Periódica (Sempre Substituir): Nota de recuperação (${maxRecovery}) substitui a média (${regularAverage.toFixed(2)}).`,
        )
      } else if (activeStrategy === 'average') {
        finalPeriodGrade = (regularAverage + maxRecovery) / 2
        isRecoveryUsed = true
        periodLog.push(
          `Recuperação Periódica (Média): Média entre original (${regularAverage.toFixed(2)}) e recuperação (${maxRecovery}) = ${finalPeriodGrade.toFixed(2)}.`,
        )
      } else {
        // Default: replace_if_higher
        if (maxRecovery > regularAverage) {
          finalPeriodGrade = maxRecovery
          isRecoveryUsed = true
          periodLog.push(
            `Recuperação Periódica (Maior Nota): Recuperação (${maxRecovery}) é maior que a média regular (${regularAverage.toFixed(2)}). Nota substituída.`,
          )
        } else {
          periodLog.push(
            `Recuperação Periódica (Maior Nota): Recuperação (${maxRecovery}) não superou a média regular (${regularAverage.toFixed(2)}). Mantida a nota original.`,
          )
        }
      }
    }

    // Combine effective assessments and unlinked recoveries for display
    const displayAssessments = [
      ...effectiveAssessments,
      ...unlinkedRecoveryAssessments,
    ]

    periodResults.push({
      periodId: period.id,
      periodName: period.name,
      regularAverage,
      recoveryGrade,
      finalPeriodGrade,
      isRecoveryUsed,
      logs: periodLog,
      assessments: displayAssessments,
    })
  }

  // 2. Calculate Final Grade
  let finalGrade = 0
  let formulaUsed = 'Média Aritmética dos Períodos'

  if (rule.formula && rule.formula.trim() !== '') {
    formulaUsed = rule.formula
    try {
      // Normalize formula: replace 'x' with '*' and handle spaces
      // Using global replace for 'x' to allow users to type 'eval1 x 2' or 'eval1x2'
      let expression = rule.formula.toLowerCase().replace(/x/g, '*')

      // Construct context
      const context: Record<string, number> = {}
      periodResults.forEach((res, index) => {
        context[`eval${index + 1}`] = res.finalPeriodGrade
      })

      // Parse formula
      // Replace known variables with values using word boundaries
      Object.keys(context).forEach((key) => {
        expression = expression.replace(
          new RegExp(`\\b${key}\\b`, 'g'),
          context[key].toString(),
        )
      })

      // Replace any remaining evalN variables (that had no data) with 0
      expression = expression.replace(/\beval\d+\b/g, '0')

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
    if (periodResults.length > 0) {
      const sum = periodResults.reduce((acc, p) => acc + p.finalPeriodGrade, 0)
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
    recoveryStrategyApplied: activeStrategy,
  }
}
