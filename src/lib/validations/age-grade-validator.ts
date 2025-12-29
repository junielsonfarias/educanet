/**
 * Validador de Idade vs Série/Ano
 * Valida se a idade do aluno está adequada para a série/ano
 */

import { differenceInYears, parse } from 'date-fns'

export interface AgeGradeValidationResult {
  valid: boolean
  error?: string
  warning?: string
  age?: number
  expectedAge?: { min: number; max: number }
  distortion?: 'none' | 'low' | 'medium' | 'high'
}

/**
 * Regras de idade por série/ano (Censo Escolar)
 * Data de corte: 31 de março
 */
export const AGE_RULES_BY_GRADE: Record<string, { min: number; max: number; ideal: number }> = {
  '1': { min: 6, max: 7, ideal: 6 }, // 1º Ano - 6 anos (pode ter 7 se nasceu antes de 31/03)
  '2': { min: 7, max: 8, ideal: 7 }, // 2º Ano
  '3': { min: 8, max: 9, ideal: 8 }, // 3º Ano
  '4': { min: 9, max: 10, ideal: 9 }, // 4º Ano
  '5': { min: 10, max: 11, ideal: 10 }, // 5º Ano
  '6': { min: 11, max: 12, ideal: 11 }, // 6º Ano
  '7': { min: 12, max: 13, ideal: 12 }, // 7º Ano
  '8': { min: 13, max: 14, ideal: 13 }, // 8º Ano
  '9': { min: 14, max: 15, ideal: 14 }, // 9º Ano
}

/**
 * Calcula idade considerando data de corte (31 de março)
 * @param birthDate - Data de nascimento (DD/MM/YYYY ou ISO)
 * @param referenceDate - Data de referência (padrão: hoje)
 * @returns Idade calculada
 */
export function calculateAge(
  birthDate: string | Date,
  referenceDate: Date = new Date(),
): number {
  let birth: Date

  if (typeof birthDate === 'string') {
    // Tentar parsear diferentes formatos
    if (birthDate.includes('/')) {
      // Formato DD/MM/YYYY
      birth = parse(birthDate, 'dd/MM/yyyy', new Date())
    } else {
      // Formato ISO
      birth = new Date(birthDate)
    }
  } else {
    birth = birthDate
  }

  if (isNaN(birth.getTime())) {
    throw new Error('Data de nascimento inválida')
  }

  // Ajustar data de referência para considerar corte de 31 de março
  const currentYear = referenceDate.getFullYear()
  const cutoffDate = new Date(currentYear, 2, 31) // 31 de março

  // Se a data de referência é antes do corte, usar ano anterior
  const effectiveYear = referenceDate < cutoffDate ? currentYear - 1 : currentYear
  const effectiveDate = new Date(effectiveYear, 11, 31) // 31 de dezembro do ano efetivo

  return differenceInYears(effectiveDate, birth)
}

/**
 * Valida idade vs série/ano
 * @param birthDate - Data de nascimento
 * @param gradeNumber - Número da série/ano (1-9)
 * @param allowExceptions - Permitir exceções justificadas
 * @returns Resultado da validação
 */
export function validateAgeGrade(
  birthDate: string | Date,
  gradeNumber: number | string,
  allowExceptions: boolean = false,
): AgeGradeValidationResult {
  try {
    const age = calculateAge(birthDate)
    const grade = typeof gradeNumber === 'string' ? parseInt(gradeNumber) : gradeNumber
    const gradeStr = grade.toString()

    if (!AGE_RULES_BY_GRADE[gradeStr]) {
      return {
        valid: false,
        error: `Série/ano ${grade} não possui regras de idade definidas`,
        age,
      }
    }

    const rule = AGE_RULES_BY_GRADE[gradeStr]
    const { min, max, ideal } = rule

    // Idade ideal (sem distorção)
    if (age === ideal) {
      return {
        valid: true,
        age,
        expectedAge: { min, max },
        distortion: 'none',
      }
    }

    // Idade dentro da faixa aceitável
    if (age >= min && age <= max) {
      const distortion = age === ideal ? 'none' : age > ideal ? 'low' : 'low'
      return {
        valid: true,
        age,
        expectedAge: { min, max },
        distortion,
        warning: age > ideal ? `Aluno com ${age} anos na ${grade}ª série (idade ideal: ${ideal} anos)` : undefined,
      }
    }

    // Idade fora da faixa (distorção)
    if (age < min) {
      const distortion = age < min - 2 ? 'high' : 'medium'
      return {
        valid: allowExceptions,
        age,
        expectedAge: { min, max },
        distortion,
        error: allowExceptions
          ? undefined
          : `Idade insuficiente: ${age} anos (mínimo: ${min} anos para ${grade}ª série)`,
        warning: allowExceptions
          ? `Aluno com ${age} anos na ${grade}ª série (idade mínima recomendada: ${min} anos). Requer justificativa.`
          : undefined,
      }
    }

    // Idade acima do máximo (distorção idade-série)
    const ageDiff = age - max
    let distortion: 'medium' | 'high' = 'medium'
    if (ageDiff > 2) {
      distortion = 'high'
    }

    return {
      valid: true, // Permitir, mas alertar
      age,
      expectedAge: { min, max },
      distortion,
      warning: `Distorção idade-série detectada: aluno com ${age} anos na ${grade}ª série (idade máxima recomendada: ${max} anos). Diferença: ${ageDiff} anos.`,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erro ao calcular idade',
    }
  }
}

/**
 * Calcula distorção idade-série
 * @param birthDate - Data de nascimento
 * @param gradeNumber - Número da série/ano
 * @returns Nível de distorção
 */
export function calculateAgeGradeDistortion(
  birthDate: string | Date,
  gradeNumber: number | string,
): 'none' | 'low' | 'medium' | 'high' {
  const validation = validateAgeGrade(birthDate, gradeNumber, true)
  return validation.distortion || 'none'
}

/**
 * Verifica se há distorção idade-série
 */
export function hasAgeGradeDistortion(
  birthDate: string | Date,
  gradeNumber: number | string,
): boolean {
  const distortion = calculateAgeGradeDistortion(birthDate, gradeNumber)
  return distortion !== 'none'
}

