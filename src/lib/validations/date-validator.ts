/**
 * Validador de Datas
 * Valida datas conforme regras do INEP e lógica escolar
 */

import { parse, isValid, isBefore, isAfter, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface DateValidationResult {
  valid: boolean
  error?: string
  formatted?: string
}

/**
 * Valida formato de data (DD/MM/YYYY)
 */
export function validateDateFormat(
  dateString: string,
  formatPattern: string = 'dd/MM/yyyy',
): DateValidationResult {
  if (!dateString || typeof dateString !== 'string') {
    return { valid: false, error: 'Data não informada' }
  }

  try {
    const parsed = parse(dateString, formatPattern, new Date())
    if (!isValid(parsed)) {
      return { valid: false, error: 'Formato de data inválido. Use DD/MM/YYYY' }
    }

    const formatted = format(parsed, 'dd/MM/yyyy', { locale: ptBR })
    return { valid: true, formatted }
  } catch (error) {
    return { valid: false, error: 'Erro ao processar data' }
  }
}

/**
 * Valida datas lógicas (nascimento < matrícula)
 */
export function validateDateLogic(
  birthDate: string | Date,
  enrollmentDate: string | Date,
): DateValidationResult {
  try {
    const birth = typeof birthDate === 'string' ? parse(birthDate, 'dd/MM/yyyy', new Date()) : birthDate
    const enrollment =
      typeof enrollmentDate === 'string' ? parse(enrollmentDate, 'dd/MM/yyyy', new Date()) : enrollmentDate

    if (!isValid(birth) || !isValid(enrollment)) {
      return { valid: false, error: 'Datas inválidas' }
    }

    if (!isBefore(birth, enrollment)) {
      return {
        valid: false,
        error: 'Data de nascimento deve ser anterior à data de matrícula',
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Erro ao validar datas' }
  }
}

/**
 * Valida período letivo (início < fim)
 */
export function validateAcademicPeriod(
  startDate: string | Date,
  endDate: string | Date,
): DateValidationResult {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate

    if (!isValid(start) || !isValid(end)) {
      return { valid: false, error: 'Datas inválidas' }
    }

    if (!isBefore(start, end)) {
      return {
        valid: false,
        error: 'Data de início deve ser anterior à data de fim',
      }
    }

    // Validar que período não é muito longo (máximo 2 anos)
    const diffInDays = Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (diffInDays > 730) {
      return {
        valid: false,
        error: 'Período letivo não pode ser superior a 2 anos',
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Erro ao validar período letivo' }
  }
}

/**
 * Valida se data está dentro do período letivo
 */
export function validateDateInPeriod(
  date: string | Date,
  periodStart: string | Date,
  periodEnd: string | Date,
): DateValidationResult {
  try {
    const checkDate = typeof date === 'string' ? new Date(date) : date
    const start = typeof periodStart === 'string' ? new Date(periodStart) : periodStart
    const end = typeof periodEnd === 'string' ? new Date(periodEnd) : periodEnd

    if (!isValid(checkDate) || !isValid(start) || !isValid(end)) {
      return { valid: false, error: 'Datas inválidas' }
    }

    if (isBefore(checkDate, start)) {
      return {
        valid: false,
        error: `Data (${format(checkDate, 'dd/MM/yyyy')}) é anterior ao início do período (${format(start, 'dd/MM/yyyy')})`,
      }
    }

    if (isAfter(checkDate, end)) {
      return {
        valid: false,
        error: `Data (${format(checkDate, 'dd/MM/yyyy')}) é posterior ao fim do período (${format(end, 'dd/MM/yyyy')})`,
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Erro ao validar data no período' }
  }
}

/**
 * Valida data de corte para idade (31 de março)
 */
export function validateAgeCutoffDate(
  birthDate: string | Date,
  referenceYear: number = new Date().getFullYear(),
): DateValidationResult {
  try {
    const birth = typeof birthDate === 'string' ? parse(birthDate, 'dd/MM/yyyy', new Date()) : birthDate
    if (!isValid(birth)) {
      return { valid: false, error: 'Data de nascimento inválida' }
    }

    const cutoffDate = new Date(referenceYear, 2, 31) // 31 de março
    const birthInYear = new Date(referenceYear, birth.getMonth(), birth.getDate())

    if (isAfter(birthInYear, cutoffDate)) {
      return {
        valid: false,
        error: `Data de nascimento após 31 de março de ${referenceYear}. Aluno deve ter nascido até 31/03/${referenceYear} para este ano letivo.`,
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Erro ao validar data de corte' }
  }
}

/**
 * Valida se data não é futura
 */
export function validateNotFutureDate(date: string | Date): DateValidationResult {
  try {
    const checkDate = typeof date === 'string' ? parse(date, 'dd/MM/yyyy', new Date()) : date
    if (!isValid(checkDate)) {
      return { valid: false, error: 'Data inválida' }
    }

    const today = new Date()
    today.setHours(23, 59, 59, 999) // Fim do dia de hoje

    if (isAfter(checkDate, today)) {
      return {
        valid: false,
        error: 'Data não pode ser futura',
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Erro ao validar data' }
  }
}

/**
 * Valida se data não é muito antiga (antes de 1900)
 */
export function validateNotTooOldDate(date: string | Date): DateValidationResult {
  try {
    const checkDate = typeof date === 'string' ? parse(date, 'dd/MM/yyyy', new Date()) : date
    if (!isValid(checkDate)) {
      return { valid: false, error: 'Data inválida' }
    }

    const minDate = new Date(1900, 0, 1)

    if (isBefore(checkDate, minDate)) {
      return {
        valid: false,
        error: 'Data muito antiga (antes de 1900)',
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Erro ao validar data' }
  }
}

/**
 * Validação completa de data
 */
export function validateDateComplete(
  date: string | Date,
  options: {
    format?: string
    notFuture?: boolean
    notTooOld?: boolean
    minDate?: Date
    maxDate?: Date
  } = {},
): DateValidationResult {
  const { format: dateFormat = 'dd/MM/yyyy', notFuture = false, notTooOld = false, minDate, maxDate } = options

  // Validar formato
  if (typeof date === 'string') {
    const formatCheck = validateDateFormat(date, dateFormat)
    if (!formatCheck.valid) {
      return formatCheck
    }
  }

  const checkDate = typeof date === 'string' ? parse(date, dateFormat, new Date()) : date

  if (!isValid(checkDate)) {
    return { valid: false, error: 'Data inválida' }
  }

  // Validar não é futura
  if (notFuture) {
    const futureCheck = validateNotFutureDate(checkDate)
    if (!futureCheck.valid) {
      return futureCheck
    }
  }

  // Validar não é muito antiga
  if (notTooOld) {
    const oldCheck = validateNotTooOldDate(checkDate)
    if (!oldCheck.valid) {
      return oldCheck
    }
  }

  // Validar data mínima
  if (minDate && isBefore(checkDate, minDate)) {
    return {
      valid: false,
      error: `Data deve ser posterior a ${format(minDate, 'dd/MM/yyyy')}`,
    }
  }

  // Validar data máxima
  if (maxDate && isAfter(checkDate, maxDate)) {
    return {
      valid: false,
      error: `Data deve ser anterior a ${format(maxDate, 'dd/MM/yyyy')}`,
    }
  }

  return { valid: true, formatted: format(checkDate, 'dd/MM/yyyy', { locale: ptBR }) }
}

