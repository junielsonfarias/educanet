/**
 * Validador de Códigos INEP
 * Valida códigos conforme especificações do Censo Escolar
 */

export interface INEPCodeValidationResult {
  valid: boolean
  error?: string
  code?: string
  description?: string
}

/**
 * Códigos de Etapa de Ensino (Censo Escolar)
 */
export const ETAPA_ENSINO_CODES: Record<string, { code: string; name: string }> = {
  '01': { code: '01', name: 'Educação Infantil - Creche' },
  '02': { code: '02', name: 'Educação Infantil - Pré-escola' },
  '03': { code: '03', name: 'Ensino Fundamental - Anos Iniciais' },
  '04': { code: '04', name: 'Ensino Fundamental - Anos Finais' },
  '05': { code: '05', name: 'Ensino Médio' },
  '06': { code: '06', name: 'Educação de Jovens e Adultos - EJA' },
  '07': { code: '07', name: 'Educação Especial' },
  '08': { code: '08', name: 'Educação Profissional' },
  '09': { code: '09', name: 'Educação Indígena' },
  '10': { code: '10', name: 'Educação Quilombola' },
  '11': { code: '11', name: 'Educação do Campo' },
  '12': { code: '12', name: 'Educação Ambiental' },
  '13': { code: '13', name: 'Educação Digital' },
  '14': { code: '14', name: 'Educação Bilíngue' },
  '15': { code: '15', name: 'Educação Integral' },
}

/**
 * Códigos de Modalidade de Ensino
 */
export const MODALIDADE_CODES: Record<string, { code: string; name: string }> = {
  '01': { code: '01', name: 'Regular' },
  '02': { code: '02', name: 'Educação Especial - Exclusiva' },
  '03': { code: '03', name: 'Educação de Jovens e Adultos' },
  '04': { code: '04', name: 'Educação Profissional' },
  '05': { code: '05', name: 'Educação Indígena' },
  '06': { code: '06', name: 'Educação Quilombola' },
  '07': { code: '07', name: 'Educação do Campo' },
  '08': { code: '08', name: 'Educação Ambiental' },
  '09': { code: '09', name: 'Educação Digital' },
  '10': { code: '10', name: 'Educação Bilíngue' },
}

/**
 * Códigos de Tipo de Regime
 */
export const TIPO_REGIME_CODES: Record<string, { code: string; name: string }> = {
  '01': { code: '01', name: 'Seriado' },
  '02': { code: '02', name: 'Não Seriado' },
  '03': { code: '03', name: 'Semi-presencial' },
  '04': { code: '04', name: 'EAD' },
}

/**
 * Valida código INEP da escola (8 dígitos)
 */
export function validateSchoolINEPCode(code: string): INEPCodeValidationResult {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Código INEP não informado' }
  }

  const cleaned = code.replace(/\D/g, '')

  if (cleaned.length !== 8) {
    return { valid: false, error: 'Código INEP da escola deve conter 8 dígitos' }
  }

  if (!/^\d{8}$/.test(cleaned)) {
    return { valid: false, error: 'Código INEP deve conter apenas números' }
  }

  return { valid: true, code: cleaned }
}

/**
 * Valida código de Etapa de Ensino (01-15)
 */
export function validateEtapaEnsinoCode(code: string): INEPCodeValidationResult {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Código de etapa de ensino não informado' }
  }

  const cleaned = code.padStart(2, '0')

  if (!ETAPA_ENSINO_CODES[cleaned]) {
    return {
      valid: false,
      error: `Código de etapa de ensino inválido. Códigos válidos: ${Object.keys(ETAPA_ENSINO_CODES).join(', ')}`,
    }
  }

  return {
    valid: true,
    code: cleaned,
    description: ETAPA_ENSINO_CODES[cleaned].name,
  }
}

/**
 * Valida código de Modalidade de Ensino (01-10)
 */
export function validateModalidadeCode(code: string): INEPCodeValidationResult {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Código de modalidade não informado' }
  }

  const cleaned = code.padStart(2, '0')

  if (!MODALIDADE_CODES[cleaned]) {
    return {
      valid: false,
      error: `Código de modalidade inválido. Códigos válidos: ${Object.keys(MODALIDADE_CODES).join(', ')}`,
    }
  }

  return {
    valid: true,
    code: cleaned,
    description: MODALIDADE_CODES[cleaned].name,
  }
}

/**
 * Valida código de Tipo de Regime (01-04)
 */
export function validateTipoRegimeCode(code: string): INEPCodeValidationResult {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Código de tipo de regime não informado' }
  }

  const cleaned = code.padStart(2, '0')

  if (!TIPO_REGIME_CODES[cleaned]) {
    return {
      valid: false,
      error: `Código de tipo de regime inválido. Códigos válidos: ${Object.keys(TIPO_REGIME_CODES).join(', ')}`,
    }
  }

  return {
    valid: true,
    code: cleaned,
    description: TIPO_REGIME_CODES[cleaned].name,
  }
}

/**
 * Obtém nome da etapa de ensino pelo código
 */
export function getEtapaEnsinoName(code: string): string | undefined {
  const cleaned = code.padStart(2, '0')
  return ETAPA_ENSINO_CODES[cleaned]?.name
}

/**
 * Obtém nome da modalidade pelo código
 */
export function getModalidadeName(code: string): string | undefined {
  const cleaned = code.padStart(2, '0')
  return MODALIDADE_CODES[cleaned]?.name
}

/**
 * Obtém nome do tipo de regime pelo código
 */
export function getTipoRegimeName(code: string): string | undefined {
  const cleaned = code.padStart(2, '0')
  return TIPO_REGIME_CODES[cleaned]?.name
}

