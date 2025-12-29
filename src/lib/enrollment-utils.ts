/**
 * Utilitários para trabalhar com relacionamentos de Enrollment
 * Centraliza a lógica de busca e validação de relacionamentos
 */

import { Enrollment } from './mock-data'
import { School, Turma, AnoLetivo } from './mock-data'

/**
 * Busca a turma relacionada a um Enrollment
 * Prioriza classroomId, faz fallback para match por nome
 */
export function getClassroomFromEnrollment(
  enrollment: Enrollment,
  schools: School[],
): Turma | undefined {
  // Prioridade 1: Usar classroomId se disponível
  if (enrollment.classroomId) {
    for (const school of schools) {
      for (const year of school.academicYears || []) {
        const turmas = year.turmas || []
        const classroom = turmas.find(
          (c) => c.id === enrollment.classroomId,
        )
        if (classroom) return classroom
      }
    }
  }

  // Fallback: Buscar por nome (compatibilidade com dados antigos)
  if (enrollment.grade) {
    for (const school of schools) {
      if (school.id !== enrollment.schoolId) continue

      for (const year of school.academicYears || []) {
        // Verificar se o ano corresponde
        const yearMatches =
          enrollment.academicYearId === year.id ||
          year.name === enrollment.year.toString() ||
          year.name.includes(enrollment.year.toString())

        if (yearMatches) {
          // Usa turmas (com fallback para classes apenas durante migração)
          const turmas = year.turmas || year.classes || []
          const classroom = turmas.find(
            (c) => c.name === enrollment.grade,
          )
          if (classroom) return classroom
        }
      }
    }
  }

  return undefined
}

/**
 * Busca o ano letivo relacionado a um Enrollment
 * Prioriza academicYearId, faz fallback para match por nome/número
 */
export function getAcademicYearFromEnrollment(
  enrollment: Enrollment,
  schools: School[],
): AnoLetivo | undefined {
  // Prioridade 1: Usar academicYearId se disponível
  if (enrollment.academicYearId) {
    for (const school of schools) {
      if (school.id !== enrollment.schoolId) continue
      const year = school.academicYears?.find(
        (y) => y.id === enrollment.academicYearId,
      )
      if (year) return year
    }
  }

  // Fallback: Buscar por nome/número (compatibilidade com dados antigos)
  for (const school of schools) {
    if (school.id !== enrollment.schoolId) continue

    const year = school.academicYears?.find(
      (y) =>
        y.name === enrollment.year.toString() ||
        y.name.includes(enrollment.year.toString()),
    )
    if (year) return year
  }

  return undefined
}

/**
 * Busca alunos de uma turma específica
 * Usa classroomId quando disponível, faz fallback para match por nome
 */
export function getStudentsByClassroom(
  students: any[],
  classroomId: string,
  classroomName: string,
  schoolId: string,
  academicYearId?: string,
  academicYearName?: string,
): any[] {
  return students.filter((student) => {
    const activeEnrollment = student.enrollments?.find(
      (e: Enrollment) => e.status === 'Cursando',
    )

    if (!activeEnrollment) return false

    // Prioridade 1: Match por IDs
    if (
      activeEnrollment.classroomId === classroomId &&
      activeEnrollment.schoolId === schoolId
    ) {
      if (academicYearId) {
        return activeEnrollment.academicYearId === academicYearId
      }
      return true
    }

    // Fallback: Match por nome (compatibilidade)
    if (
      activeEnrollment.schoolId === schoolId &&
      activeEnrollment.grade === classroomName
    ) {
      if (academicYearName) {
        return (
          activeEnrollment.year.toString() === academicYearName ||
          activeEnrollment.academicYearId === academicYearId
        )
      }
      return true
    }

    return false
  })
}

/**
 * Valida se um Enrollment tem relacionamentos válidos
 */
export function validateEnrollment(
  enrollment: Enrollment,
  schools: School[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validar escola existe
  const school = schools.find((s) => s.id === enrollment.schoolId)
  if (!school) {
    errors.push(`Escola com ID ${enrollment.schoolId} não encontrada`)
  }

  // Validar ano letivo
  if (enrollment.academicYearId) {
    const year = school?.academicYears?.find(
      (y) => y.id === enrollment.academicYearId,
    )
    if (!year) {
      errors.push(
        `Ano letivo com ID ${enrollment.academicYearId} não encontrado`,
      )
    }
  }

  // Validar turma
  if (enrollment.classroomId) {
    const classroom = getClassroomFromEnrollment(enrollment, schools)
    if (!classroom) {
      errors.push(`Turma com ID ${enrollment.classroomId} não encontrada`)
    } else {
      // Validar que a turma pertence à escola e ano letivo corretos
      if (classroom && school) {
        const year = school.academicYears?.find(
          (y) => (y.turmas || []).some((c) => c.id === enrollment.classroomId),
        )
        if (year && enrollment.academicYearId && year.id !== enrollment.academicYearId) {
          errors.push(
            'Turma não pertence ao ano letivo especificado na matrícula',
          )
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

