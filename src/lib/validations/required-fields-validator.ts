/**
 * Validador de Campos Obrigatórios
 * Valida campos obrigatórios conforme especificações do Censo Escolar
 */

import type { Student, Teacher, School, Turma, EtapaEnsino } from '@/lib/mock-data'

export interface RequiredFieldsValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
  missingFields: string[]
}

/**
 * Campos obrigatórios para Aluno (Censo Escolar)
 */
const STUDENT_REQUIRED_FIELDS = [
  { field: 'name', message: 'Nome do aluno é obrigatório' },
  { field: 'birthDate', message: 'Data de nascimento é obrigatória' },
  { field: 'guardian', message: 'Nome do responsável é obrigatório' },
  { field: 'registration', message: 'Número de matrícula é obrigatório' },
  { field: 'street', message: 'Rua é obrigatória' },
  { field: 'number', message: 'Número do endereço é obrigatório' },
  { field: 'neighborhood', message: 'Bairro é obrigatório' },
  { field: 'city', message: 'Cidade é obrigatória' },
  { field: 'state', message: 'Estado é obrigatório' },
]

/**
 * Campos obrigatórios para Professor (Censo Escolar)
 */
const TEACHER_REQUIRED_FIELDS = [
  { field: 'name', message: 'Nome do professor é obrigatório' },
  { field: 'email', message: 'E-mail é obrigatório' },
  { field: 'phone', message: 'Telefone é obrigatório' },
  { field: 'subject', message: 'Disciplina é obrigatória' },
  { field: 'role', message: 'Cargo/Função é obrigatório' },
  { field: 'admissionDate', message: 'Data de admissão é obrigatória' },
]

/**
 * Campos obrigatórios para Escola (Censo Escolar)
 */
const SCHOOL_REQUIRED_FIELDS = [
  { field: 'name', message: 'Nome da escola é obrigatório' },
  { field: 'code', message: 'Código da escola é obrigatório' },
  { field: 'inepCode', message: 'Código INEP é obrigatório' },
  { field: 'director', message: 'Nome do diretor é obrigatório' },
  { field: 'address', message: 'Endereço é obrigatório' },
  { field: 'phone', message: 'Telefone é obrigatório' },
  { field: 'administrativeDependency', message: 'Dependência administrativa é obrigatória' },
  { field: 'locationType', message: 'Localização (Urbana/Rural) é obrigatória' },
]

/**
 * Campos obrigatórios para Turma (Censo Escolar)
 */
const TURMA_REQUIRED_FIELDS = [
  { field: 'name', message: 'Nome da turma é obrigatório' },
  { field: 'shift', message: 'Turno é obrigatório' },
  { field: 'etapaEnsinoId', message: 'Etapa de Ensino é obrigatória' },
  { field: 'serieAnoId', message: 'Série/Ano é obrigatória (exceto multissérie)' },
  { field: 'schoolId', message: 'Escola é obrigatória' },
  { field: 'yearId', message: 'Ano letivo é obrigatório' },
]

/**
 * Campos obrigatórios para Etapa de Ensino
 */
const ETAPA_ENSINO_REQUIRED_FIELDS = [
  { field: 'name', message: 'Nome da etapa de ensino é obrigatório' },
  { field: 'codigoCenso', message: 'Código do Censo Escolar é obrigatório' },
]

/**
 * Valida campos obrigatórios de um aluno
 */
export function validateStudentRequiredFields(
  student: Partial<Student>,
): RequiredFieldsValidationResult {
  const errors: Array<{ field: string; message: string }> = []
  const missingFields: string[] = []

  STUDENT_REQUIRED_FIELDS.forEach(({ field, message }) => {
    const value = (student as any)[field]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push({ field, message })
      missingFields.push(field)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
  }
}

/**
 * Valida campos obrigatórios de um professor
 */
export function validateTeacherRequiredFields(
  teacher: Partial<Teacher>,
): RequiredFieldsValidationResult {
  const errors: Array<{ field: string; message: string }> = []
  const missingFields: string[] = []

  TEACHER_REQUIRED_FIELDS.forEach(({ field, message }) => {
    const value = (teacher as any)[field]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push({ field, message })
      missingFields.push(field)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
  }
}

/**
 * Valida campos obrigatórios de uma escola
 */
export function validateSchoolRequiredFields(
  school: Partial<School>,
): RequiredFieldsValidationResult {
  const errors: Array<{ field: string; message: string }> = []
  const missingFields: string[] = []

  SCHOOL_REQUIRED_FIELDS.forEach(({ field, message }) => {
    const value = (school as any)[field]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push({ field, message })
      missingFields.push(field)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
  }
}

/**
 * Valida campos obrigatórios de uma turma
 */
export function validateTurmaRequiredFields(
  turma: Partial<Turma>,
  isMultiGrade: boolean = false,
): RequiredFieldsValidationResult {
  const errors: Array<{ field: string; message: string }> = []
  const missingFields: string[] = []

  TURMA_REQUIRED_FIELDS.forEach(({ field, message }) => {
    // Série/Ano não é obrigatória para turmas multissérie
    if (field === 'serieAnoId' && isMultiGrade) {
      return
    }

    const value = (turma as any)[field]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push({ field, message })
      missingFields.push(field)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
  }
}

/**
 * Valida campos obrigatórios de uma etapa de ensino
 */
export function validateEtapaEnsinoRequiredFields(
  etapaEnsino: Partial<EtapaEnsino>,
): RequiredFieldsValidationResult {
  const errors: Array<{ field: string; message: string }> = []
  const missingFields: string[] = []

  ETAPA_ENSINO_REQUIRED_FIELDS.forEach(({ field, message }) => {
    const value = (etapaEnsino as any)[field]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push({ field, message })
      missingFields.push(field)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
  }
}

/**
 * Validação genérica de campos obrigatórios
 */
export function validateRequiredFields(
  entity: Record<string, any>,
  requiredFields: Array<{ field: string; message: string }>,
): RequiredFieldsValidationResult {
  const errors: Array<{ field: string; message: string }> = []
  const missingFields: string[] = []

  requiredFields.forEach(({ field, message }) => {
    const value = entity[field]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push({ field, message })
      missingFields.push(field)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
  }
}

