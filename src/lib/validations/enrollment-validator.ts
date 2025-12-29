/**
 * Validador de Matrículas
 * Valida matrículas conforme regras do INEP
 */

import type { Student, Enrollment, School, AnoLetivo, Turma } from '@/lib/mock-data'

export interface EnrollmentValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Valida se há matrícula duplicada (mesmo aluno, mesmo ano letivo)
 */
export function validateDuplicateEnrollment(
  studentId: string,
  academicYearId: string,
  enrollments: Enrollment[],
  excludeEnrollmentId?: string,
): { valid: boolean; error?: string } {
  const duplicate = enrollments.find(
    (e) =>
      e.studentId === studentId &&
      e.academicYearId === academicYearId &&
      e.status === 'Cursando' &&
      e.id !== excludeEnrollmentId,
  )

  if (duplicate) {
    return {
      valid: false,
      error: 'Aluno já possui matrícula ativa neste ano letivo',
    }
  }

  return { valid: true }
}

/**
 * Valida se há matrícula simultânea em múltiplas escolas
 */
export function validateSimultaneousEnrollments(
  studentId: string,
  schoolId: string,
  enrollments: Enrollment[],
  excludeEnrollmentId?: string,
): { valid: boolean; error?: string; warning?: string } {
  const activeEnrollments = enrollments.filter(
    (e) =>
      e.studentId === studentId &&
      e.status === 'Cursando' &&
      e.id !== excludeEnrollmentId,
  )

  const otherSchools = activeEnrollments.filter((e) => e.schoolId !== schoolId)

  if (otherSchools.length > 0) {
    return {
      valid: false,
      error: `Aluno possui matrícula ativa em outra escola. Remova a matrícula anterior antes de criar nova.`,
    }
  }

  return { valid: true }
}

/**
 * Valida relacionamentos da matrícula
 */
export function validateEnrollmentRelationships(
  enrollment: Partial<Enrollment>,
  schools: School[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validar que escola existe
  const school = schools.find((s) => s.id === enrollment.schoolId)
  if (!school) {
    errors.push('Escola não encontrada')
  }

  // Validar que ano letivo pertence à escola
  if (enrollment.academicYearId && school) {
    const academicYear = school.academicYears?.find((y) => y.id === enrollment.academicYearId)
    if (!academicYear) {
      errors.push('Ano letivo não pertence à escola selecionada')
    }

    // Validar que turma pertence ao ano letivo
    if (enrollment.classroomId && academicYear) {
      const turmas = academicYear.turmas || []
      const turma = turmas.find((t) => t.id === enrollment.classroomId)
      if (!turma) {
        errors.push('Turma não pertence ao ano letivo selecionado')
      }

      // Validar que turma pertence à escola
      if (turma && turma.schoolId !== enrollment.schoolId) {
        errors.push('Turma não pertence à escola selecionada')
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valida capacidade da turma
 */
export function validateClassroomCapacity(
  classroomId: string,
  academicYearId: string,
  schoolId: string,
  enrollments: Enrollment[],
  schools: School[],
): { valid: boolean; error?: string; currentCount?: number; maxCapacity?: number } {
  const school = schools.find((s) => s.id === schoolId)
  if (!school) {
    return { valid: false, error: 'Escola não encontrada' }
  }

  const academicYear = school.academicYears?.find((y) => y.id === academicYearId)
  if (!academicYear) {
    return { valid: false, error: 'Ano letivo não encontrado' }
  }

  const turmas = academicYear.turmas || []
  const turma = turmas.find((t) => t.id === classroomId)
  if (!turma) {
    return { valid: false, error: 'Turma não encontrada' }
  }

  const maxCapacity = turma.maxCapacity || 30
  const currentCount = enrollments.filter(
    (e) =>
      e.classroomId === classroomId &&
      e.academicYearId === academicYearId &&
      e.status === 'Cursando',
  ).length

  if (currentCount >= maxCapacity) {
    return {
      valid: false,
      error: `Turma atingiu capacidade máxima (${maxCapacity} alunos). Atualmente: ${currentCount} alunos.`,
      currentCount,
      maxCapacity,
    }
  }

  return {
    valid: true,
    currentCount,
    maxCapacity,
  }
}

/**
 * Valida período de matrícula (dentro do ano letivo)
 */
export function validateEnrollmentPeriod(
  enrollmentDate: string | Date,
  academicYearId: string,
  schoolId: string,
  schools: School[],
): { valid: boolean; error?: string } {
  const school = schools.find((s) => s.id === schoolId)
  if (!school) {
    return { valid: false, error: 'Escola não encontrada' }
  }

  const academicYear = school.academicYears?.find((y) => y.id === academicYearId)
  if (!academicYear) {
    return { valid: false, error: 'Ano letivo não encontrado' }
  }

  const enrollment = typeof enrollmentDate === 'string' ? new Date(enrollmentDate) : enrollmentDate
  const yearStart = new Date(academicYear.startDate)
  const yearEnd = new Date(academicYear.endDate)

  if (enrollment < yearStart) {
    return {
      valid: false,
      error: `Data de matrícula (${enrollment.toLocaleDateString('pt-BR')}) é anterior ao início do ano letivo (${yearStart.toLocaleDateString('pt-BR')})`,
    }
  }

  if (enrollment > yearEnd) {
    return {
      valid: false,
      error: `Data de matrícula (${enrollment.toLocaleDateString('pt-BR')}) é posterior ao fim do ano letivo (${yearEnd.toLocaleDateString('pt-BR')})`,
    }
  }

  return { valid: true }
}

/**
 * Validação completa de matrícula
 */
export function validateEnrollmentComplete(
  enrollment: Partial<Enrollment>,
  studentId: string,
  enrollments: Enrollment[],
  schools: School[],
  excludeEnrollmentId?: string,
): EnrollmentValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validar matrícula duplicada
  if (enrollment.academicYearId) {
    const duplicateCheck = validateDuplicateEnrollment(
      studentId,
      enrollment.academicYearId,
      enrollments,
      excludeEnrollmentId,
    )
    if (!duplicateCheck.valid) {
      errors.push(duplicateCheck.error || 'Matrícula duplicada')
    }
  }

  // Validar matrícula simultânea
  if (enrollment.schoolId) {
    const simultaneousCheck = validateSimultaneousEnrollments(
      studentId,
      enrollment.schoolId,
      enrollments,
      excludeEnrollmentId,
    )
    if (!simultaneousCheck.valid) {
      errors.push(simultaneousCheck.error || 'Matrícula simultânea detectada')
    }
    if (simultaneousCheck.warning) {
      warnings.push(simultaneousCheck.warning)
    }
  }

  // Validar relacionamentos
  const relationshipCheck = validateEnrollmentRelationships(enrollment, schools)
  if (!relationshipCheck.valid) {
    errors.push(...relationshipCheck.errors)
  }

  // Validar capacidade da turma
  if (enrollment.classroomId && enrollment.academicYearId && enrollment.schoolId) {
    const capacityCheck = validateClassroomCapacity(
      enrollment.classroomId,
      enrollment.academicYearId,
      enrollment.schoolId,
      enrollments,
      schools,
    )
    if (!capacityCheck.valid) {
      errors.push(capacityCheck.error || 'Capacidade da turma excedida')
    } else if (capacityCheck.currentCount && capacityCheck.maxCapacity) {
      const remaining = capacityCheck.maxCapacity - capacityCheck.currentCount
      if (remaining <= 3) {
        warnings.push(
          `Turma quase lotada: ${remaining} vaga(s) restante(s) de ${capacityCheck.maxCapacity}`,
        )
      }
    }
  }

  // Validar período de matrícula
  if (enrollment.enrollmentDate && enrollment.academicYearId && enrollment.schoolId) {
    const periodCheck = validateEnrollmentPeriod(
      enrollment.enrollmentDate,
      enrollment.academicYearId,
      enrollment.schoolId,
      schools,
    )
    if (!periodCheck.valid) {
      errors.push(periodCheck.error || 'Período de matrícula inválido')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

