/**
 * Validador de CPF e CNPJ
 * Implementa algoritmos de validação dos dígitos verificadores
 */

export interface ValidationResult {
  valid: boolean
  formatted?: string
  error?: string
}

/**
 * Remove caracteres não numéricos
 */
function cleanDocument(document: string): string {
  return document.replace(/\D/g, '')
}

/**
 * Valida formato básico (tamanho)
 */
function validateFormat(document: string, expectedLength: number): boolean {
  const cleaned = cleanDocument(document)
  return cleaned.length === expectedLength
}

/**
 * Verifica se todos os dígitos são iguais (CPF/CNPJ inválido)
 */
function allDigitsSame(document: string): boolean {
  const cleaned = cleanDocument(document)
  return /^(\d)\1+$/.test(cleaned)
}

/**
 * Calcula dígito verificador do CPF
 */
function calculateCPFDigit(cpf: string, position: number): number {
  let sum = 0
  let weight = position + 1

  for (let i = 0; i < position; i++) {
    sum += parseInt(cpf[i]) * weight
    weight--
  }

  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

/**
 * Valida CPF (Cadastro de Pessoa Física)
 * @param cpf - CPF com ou sem formatação
 * @returns Resultado da validação
 */
export function validateCPF(cpf: string): ValidationResult {
  if (!cpf || typeof cpf !== 'string') {
    return { valid: false, error: 'CPF inválido' }
  }

  const cleaned = cleanDocument(cpf)

  // Verificar formato
  if (!validateFormat(cleaned, 11)) {
    return { valid: false, error: 'CPF deve conter 11 dígitos' }
  }

  // Verificar se todos os dígitos são iguais
  if (allDigitsSame(cleaned)) {
    return { valid: false, error: 'CPF inválido (todos os dígitos são iguais)' }
  }

  // Calcular primeiro dígito verificador
  const firstDigit = calculateCPFDigit(cleaned, 9)
  if (firstDigit !== parseInt(cleaned[9])) {
    return { valid: false, error: 'CPF inválido (dígito verificador incorreto)' }
  }

  // Calcular segundo dígito verificador
  const secondDigit = calculateCPFDigit(cleaned, 10)
  if (secondDigit !== parseInt(cleaned[10])) {
    return { valid: false, error: 'CPF inválido (dígito verificador incorreto)' }
  }

  // Formatar CPF (XXX.XXX.XXX-XX)
  const formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`

  return { valid: true, formatted }
}

/**
 * Calcula dígito verificador do CNPJ
 */
function calculateCNPJDigit(cnpj: string, position: number): number {
  const weights = position === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < position; i++) {
    sum += parseInt(cnpj[i]) * weights[i]
  }

  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

/**
 * Valida CNPJ (Cadastro Nacional de Pessoa Jurídica)
 * @param cnpj - CNPJ com ou sem formatação
 * @returns Resultado da validação
 */
export function validateCNPJ(cnpj: string): ValidationResult {
  if (!cnpj || typeof cnpj !== 'string') {
    return { valid: false, error: 'CNPJ inválido' }
  }

  const cleaned = cleanDocument(cnpj)

  // Verificar formato
  if (!validateFormat(cleaned, 14)) {
    return { valid: false, error: 'CNPJ deve conter 14 dígitos' }
  }

  // Verificar se todos os dígitos são iguais
  if (allDigitsSame(cleaned)) {
    return { valid: false, error: 'CNPJ inválido (todos os dígitos são iguais)' }
  }

  // Calcular primeiro dígito verificador
  const firstDigit = calculateCNPJDigit(cleaned, 12)
  if (firstDigit !== parseInt(cleaned[12])) {
    return { valid: false, error: 'CNPJ inválido (dígito verificador incorreto)' }
  }

  // Calcular segundo dígito verificador
  const secondDigit = calculateCNPJDigit(cleaned, 13)
  if (secondDigit !== parseInt(cleaned[13])) {
    return { valid: false, error: 'CNPJ inválido (dígito verificador incorreto)' }
  }

  // Formatar CNPJ (XX.XXX.XXX/XXXX-XX)
  const formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`

  return { valid: true, formatted }
}

/**
 * Valida CPF ou CNPJ automaticamente
 * @param document - CPF ou CNPJ
 * @returns Resultado da validação
 */
export function validateCPForCNPJ(document: string): ValidationResult {
  if (!document) {
    return { valid: false, error: 'Documento não informado' }
  }

  const cleaned = cleanDocument(document)

  if (cleaned.length === 11) {
    return validateCPF(document)
  } else if (cleaned.length === 14) {
    return validateCNPJ(document)
  }

  return { valid: false, error: 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)' }
}

/**
 * Formata CPF (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanDocument(cpf)
  if (cleaned.length !== 11) return cpf
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`
}

/**
 * Formata CNPJ (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanDocument(cnpj)
  if (cleaned.length !== 14) return cnpj
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`
}

