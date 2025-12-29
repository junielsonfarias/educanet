/**
 * Validador de Relacionamentos
 * Valida relacionamentos entre entidades conforme regras do INEP
 */

import type { Turma, EtapaEnsino, SerieAno, Subject, School, AnoLetivo, Teacher } from '@/lib/mock-data'

export interface RelationshipValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Valida que turma pertence à escola
 */
export function validateTurmaBelongsToSchool(
  turma: Turma,
  schoolId: string,
): RelationshipValidationResult {
  if (turma.schoolId !== schoolId) {
    return {
      valid: false,
      errors: ['Turma não pertence à escola selecionada'],
    }
  }

  return { valid: true, errors: [] }
}

/**
 * Valida que turma pertence ao ano letivo
 */
export function validateTurmaBelongsToAcademicYear(
  turma: Turma,
  academicYear: AnoLetivo,
): RelationshipValidationResult {
  const turmas = academicYear.turmas || []
  const turmaExists = turmas.some((t) => t.id === turma.id)

  if (!turmaExists) {
    return {
      valid: false,
      errors: ['Turma não pertence ao ano letivo selecionado'],
    }
  }

  return { valid: true, errors: [] }
}

/**
 * Valida que série/ano pertence à etapa de ensino
 */
export function validateSerieAnoBelongsToEtapaEnsino(
  serieAnoId: string,
  etapaEnsino: EtapaEnsino,
): RelationshipValidationResult {
  const seriesAnos = etapaEnsino.seriesAnos || []
  const serieAnoExists = seriesAnos.some((s) => s.id === serieAnoId)

  if (!serieAnoExists) {
    return {
      valid: false,
      errors: ['Série/Ano não pertence à etapa de ensino selecionada'],
    }
  }

  return { valid: true, errors: [] }
}

/**
 * Valida que disciplina pertence à série/ano
 */
export function validateSubjectBelongsToSerieAno(
  subjectId: string,
  serieAno: SerieAno,
): RelationshipValidationResult {
  const subjects = serieAno.subjects || []
  const subjectExists = subjects.some((s) => s.id === subjectId)

  if (!subjectExists) {
    return {
      valid: false,
      errors: ['Disciplina não pertence à série/ano selecionada'],
    }
  }

  return { valid: true, errors: [] }
}

/**
 * Valida que professor está habilitado para disciplina
 */
export function validateTeacherEnabledForSubject(
  teacher: Teacher,
  subjectId: string,
): RelationshipValidationResult {
  const enabledSubjects = teacher.enabledSubjects || []
  const isEnabled = enabledSubjects.includes(subjectId)

  if (!isEnabled) {
    return {
      valid: false,
      errors: ['Professor não está habilitado para esta disciplina'],
    }
  }

  return { valid: true, errors: [] }
}

/**
 * Valida que aluno está na série/ano correta
 */
export function validateStudentInCorrectGrade(
  studentGrade: string,
  turmaSerieAnoId: string,
  etapasEnsino: EtapaEnsino[],
): RelationshipValidationResult {
  // Buscar série/ano da turma
  let turmaSerieAno: SerieAno | undefined

  for (const etapa of etapasEnsino) {
    const serieAno = (etapa.seriesAnos || []).find((s) => s.id === turmaSerieAnoId)
    if (serieAno) {
      turmaSerieAno = serieAno
      break
    }
  }

  if (!turmaSerieAno) {
    return {
      valid: false,
      errors: ['Série/Ano da turma não encontrada'],
    }
  }

  // Verificar se o nome da série/ano corresponde
  if (turmaSerieAno.name !== studentGrade) {
    return {
      valid: false,
      errors: [`Aluno está na série/ano incorreta. Esperado: ${turmaSerieAno.name}, Informado: ${studentGrade}`],
    }
  }

  return { valid: true, errors: [] }
}

/**
 * Valida que avaliação pertence à turma/disciplina
 */
export function validateAssessmentBelongsToClassroomAndSubject(
  assessmentClassroomId: string,
  assessmentSubjectId: string,
  classroomId: string,
  subjectId: string,
): RelationshipValidationResult {
  const errors: string[] = []

  if (assessmentClassroomId !== classroomId) {
    errors.push('Avaliação não pertence à turma selecionada')
  }

  if (assessmentSubjectId !== subjectId) {
    errors.push('Avaliação não pertence à disciplina selecionada')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validação completa de relacionamentos de uma turma
 */
export function validateTurmaRelationships(
  turma: Turma,
  school: School,
  academicYear: AnoLetivo,
  etapasEnsino: EtapaEnsino[],
): RelationshipValidationResult {
  const errors: string[] = []

  // Validar que turma pertence à escola
  const schoolCheck = validateTurmaBelongsToSchool(turma, school.id)
  if (!schoolCheck.valid) {
    errors.push(...schoolCheck.errors)
  }

  // Validar que turma pertence ao ano letivo
  const yearCheck = validateTurmaBelongsToAcademicYear(turma, academicYear)
  if (!yearCheck.valid) {
    errors.push(...yearCheck.errors)
  }

  // Validar que série/ano pertence à etapa de ensino
  if (turma.serieAnoId) {
    const etapaEnsino = etapasEnsino.find((e) => e.id === turma.etapaEnsinoId)
    if (etapaEnsino) {
      const serieAnoCheck = validateSerieAnoBelongsToEtapaEnsino(turma.serieAnoId, etapaEnsino)
      if (!serieAnoCheck.valid) {
        errors.push(...serieAnoCheck.errors)
      }
    } else {
      errors.push('Etapa de ensino não encontrada')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

