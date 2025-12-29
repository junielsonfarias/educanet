/**
 * Relatório de Inconsistências
 * Identifica e reporta inconsistências nos dados conforme regras do INEP
 */

import type {
  School,
  Student,
  Teacher,
  Turma,
  AnoLetivo,
  EtapaEnsino,
  Enrollment,
} from '@/lib/mock-data'
import {
  validateCPF,
  validateCNPJ,
  validateSchoolINEPCode,
  validateEtapaEnsinoCode,
  validateAgeGrade,
  validateEnrollmentComplete,
  validateStudentRequiredFields,
  validateTeacherRequiredFields,
  validateSchoolRequiredFields,
  validateTurmaRequiredFields,
  validateTurmaRelationships,
} from '@/lib/validations'

export interface Inconsistency {
  type: 'error' | 'warning' | 'info'
  entity: 'school' | 'student' | 'teacher' | 'classroom' | 'enrollment'
  entityId: string
  entityName: string
  field?: string
  message: string
  suggestion?: string
}

export interface InconsistencyReport {
  totalErrors: number
  totalWarnings: number
  totalInfo: number
  inconsistencies: Inconsistency[]
  summary: {
    schools: { errors: number; warnings: number; info: number }
    students: { errors: number; warnings: number; info: number }
    teachers: { errors: number; warnings: number; info: number }
    classrooms: { errors: number; warnings: number; info: number }
    enrollments: { errors: number; warnings: number; info: number }
  }
}

/**
 * Valida escolas e retorna inconsistências
 */
function validateSchools(
  schools: School[],
  etapasEnsino: EtapaEnsino[],
): Inconsistency[] {
  const inconsistencies: Inconsistency[] = []

  for (const school of schools) {
    // Validar código INEP
    if (school.inepCode) {
      const inepValidation = validateSchoolINEPCode(school.inepCode)
      if (!inepValidation.valid) {
        inconsistencies.push({
          type: 'error',
          entity: 'school',
          entityId: school.id,
          entityName: school.name,
          field: 'inepCode',
          message: inepValidation.error || 'Código INEP inválido',
          suggestion: 'Verifique o código INEP da escola',
        })
      }
    } else {
      inconsistencies.push({
        type: 'error',
        entity: 'school',
        entityId: school.id,
        entityName: school.name,
        field: 'inepCode',
        message: 'Código INEP não cadastrado',
        suggestion: 'Cadastre o código INEP da escola',
      })
    }

    // Validar campos obrigatórios
    const requiredFields = validateSchoolRequiredFields(school)
    if (!requiredFields.valid) {
      requiredFields.errors.forEach((error) => {
        inconsistencies.push({
          type: 'error',
          entity: 'school',
          entityId: school.id,
          entityName: school.name,
          field: error.field,
          message: error.message,
          suggestion: `Preencha o campo ${error.field}`,
        })
      })
    }

    // Validar turmas
    const academicYears = school.academicYears || []
    for (const year of academicYears) {
      const turmas = year.turmas || []
      for (const turma of turmas) {
        const relationshipValidation = validateTurmaRelationships(
          turma,
          school,
          year,
          etapasEnsino,
        )
        if (!relationshipValidation.valid) {
          relationshipValidation.errors.forEach((error) => {
            inconsistencies.push({
              type: 'error',
              entity: 'classroom',
              entityId: turma.id,
              entityName: turma.name,
              field: 'relationships',
              message: error,
              suggestion: 'Verifique os relacionamentos da turma',
            })
          })
        }
      }
    }
  }

  return inconsistencies
}

/**
 * Valida alunos e retorna inconsistências
 */
function validateStudents(
  students: Student[],
  schools: School[],
  enrollments: Enrollment[],
): Inconsistency[] {
  const inconsistencies: Inconsistency[] = []

  for (const student of students) {
    // Validar CPF
    if (student.cpf) {
      const cpfValidation = validateCPF(student.cpf)
      if (!cpfValidation.valid) {
        inconsistencies.push({
          type: 'error',
          entity: 'student',
          entityId: student.id,
          entityName: student.name,
          field: 'cpf',
          message: cpfValidation.error || 'CPF inválido',
          suggestion: 'Verifique o CPF do aluno',
        })
      }
    }

    // Validar campos obrigatórios
    const requiredFields = validateStudentRequiredFields(student)
    if (!requiredFields.valid) {
      requiredFields.errors.forEach((error) => {
        inconsistencies.push({
          type: 'error',
          entity: 'student',
          entityId: student.id,
          entityName: student.name,
          field: error.field,
          message: error.message,
          suggestion: `Preencha o campo ${error.field}`,
        })
      })
    }

    // Validar idade vs série/ano
    const activeEnrollment = (student.enrollments || []).find(
      (e) => e.status === 'Cursando',
    )
    if (activeEnrollment && student.birthDate) {
      const school = schools.find((s) => s.id === activeEnrollment.schoolId)
      const academicYear = school?.academicYears?.find(
        (y) => y.id === activeEnrollment.academicYearId,
      )
      const turma = (academicYear?.turmas || []).find(
        (t) => t.id === activeEnrollment.classroomId,
      )

      if (turma?.serieAnoName) {
        const gradeNumber = parseInt(turma.serieAnoName.replace(/\D/g, ''))
        if (gradeNumber) {
          const ageValidation = validateAgeGrade(student.birthDate, gradeNumber, true)
          if (!ageValidation.valid && ageValidation.error) {
            inconsistencies.push({
              type: 'error',
              entity: 'student',
              entityId: student.id,
              entityName: student.name,
              field: 'birthDate',
              message: ageValidation.error,
              suggestion: 'Verifique a data de nascimento e a série do aluno',
            })
          } else if (ageValidation.warning) {
            inconsistencies.push({
              type: 'warning',
              entity: 'student',
              entityId: student.id,
              entityName: student.name,
              field: 'birthDate',
              message: ageValidation.warning,
              suggestion: 'Considere verificar a adequação idade-série',
            })
          }

          if (ageValidation.distortion === 'high') {
            inconsistencies.push({
              type: 'warning',
              entity: 'student',
              entityId: student.id,
              entityName: student.name,
              field: 'ageGradeDistortion',
              message: `Distorção idade-série alta detectada (${ageValidation.distortion})`,
              suggestion: 'Avalie a necessidade de adequação da série do aluno',
            })
          }
        }
      }
    }

    // Validar matrículas
    for (const enrollment of student.enrollments || []) {
      const enrollmentWithStudentId = { ...enrollment, studentId: student.id }
      const enrollmentValidation = validateEnrollmentComplete(
        enrollmentWithStudentId,
        student.id,
        enrollments,
        schools,
        enrollment.id,
      )

      if (!enrollmentValidation.valid) {
        enrollmentValidation.errors.forEach((error) => {
          inconsistencies.push({
            type: 'error',
            entity: 'enrollment',
            entityId: enrollment.id,
            entityName: `${student.name} - ${enrollment.grade || 'Sem série'}`,
            field: 'validation',
            message: error,
            suggestion: 'Verifique os dados da matrícula',
          })
        })
      }

      if (enrollmentValidation.warnings.length > 0) {
        enrollmentValidation.warnings.forEach((warning) => {
          inconsistencies.push({
            type: 'warning',
            entity: 'enrollment',
            entityId: enrollment.id,
            entityName: `${student.name} - ${enrollment.grade || 'Sem série'}`,
            field: 'validation',
            message: warning,
            suggestion: 'Atenção aos avisos da matrícula',
          })
        })
      }
    }
  }

  return inconsistencies
}

/**
 * Valida professores e retorna inconsistências
 */
function validateTeachers(teachers: Teacher[]): Inconsistency[] {
  const inconsistencies: Inconsistency[] = []

  for (const teacher of teachers) {
    // Validar CPF
    if (teacher.cpf) {
      const cpfValidation = validateCPF(teacher.cpf)
      if (!cpfValidation.valid) {
        inconsistencies.push({
          type: 'error',
          entity: 'teacher',
          entityId: teacher.id,
          entityName: teacher.name,
          field: 'cpf',
          message: cpfValidation.error || 'CPF inválido',
          suggestion: 'Verifique o CPF do professor',
        })
      }
    }

    // Validar campos obrigatórios
    const requiredFields = validateTeacherRequiredFields(teacher)
    if (!requiredFields.valid) {
      requiredFields.errors.forEach((error) => {
        inconsistencies.push({
          type: 'error',
          entity: 'teacher',
          entityId: teacher.id,
          entityName: teacher.name,
          field: error.field,
          message: error.message,
          suggestion: `Preencha o campo ${error.field}`,
        })
      })
    }
  }

  return inconsistencies
}

/**
 * Valida turmas e retorna inconsistências
 */
function validateClassrooms(
  turmas: Turma[],
  schools: School[],
  etapasEnsino: EtapaEnsino[],
): Inconsistency[] {
  const inconsistencies: Inconsistency[] = []

  for (const turma of turmas) {
    // Validar campos obrigatórios
    const requiredFields = validateTurmaRequiredFields(turma, turma.isMultiGrade || false)
    if (!requiredFields.valid) {
      requiredFields.errors.forEach((error) => {
        inconsistencies.push({
          type: 'error',
          entity: 'classroom',
          entityId: turma.id,
          entityName: turma.name,
          field: error.field,
          message: error.message,
          suggestion: `Preencha o campo ${error.field}`,
        })
      })
    }

    // Validar etapa de ensino
    if (turma.etapaEnsinoId) {
      const etapaEnsino = etapasEnsino.find((e) => e.id === turma.etapaEnsinoId)
      if (!etapaEnsino) {
        inconsistencies.push({
          type: 'error',
          entity: 'classroom',
          entityId: turma.id,
          entityName: turma.name,
          field: 'etapaEnsinoId',
          message: 'Etapa de ensino não encontrada',
          suggestion: 'Verifique a etapa de ensino da turma',
        })
      } else {
        const etapaValidation = validateEtapaEnsinoCode(etapaEnsino.codigoCenso)
        if (!etapaValidation.valid) {
          inconsistencies.push({
            type: 'error',
            entity: 'classroom',
            entityId: turma.id,
            entityName: turma.name,
            field: 'etapaEnsinoId',
            message: etapaValidation.error || 'Código de etapa de ensino inválido',
            suggestion: 'Verifique o código da etapa de ensino',
          })
        }
      }
    }
  }

  return inconsistencies
}

/**
 * Gera relatório completo de inconsistências
 */
export function generateInconsistencyReport(
  schools: School[],
  students: Student[],
  teachers: Teacher[],
  etapasEnsino: EtapaEnsino[],
): InconsistencyReport {
  const allEnrollments = students.flatMap((s) => s.enrollments || [])
  const allTurmas = schools.flatMap((s) =>
    (s.academicYears || []).flatMap((y) => y.turmas || []),
  )

  // Coletar todas as inconsistências
  const inconsistencies: Inconsistency[] = [
    ...validateSchools(schools, etapasEnsino),
    ...validateStudents(students, schools, allEnrollments),
    ...validateTeachers(teachers),
    ...validateClassrooms(allTurmas, schools, etapasEnsino),
  ]

  // Contar por tipo
  const errors = inconsistencies.filter((i) => i.type === 'error')
  const warnings = inconsistencies.filter((i) => i.type === 'warning')
  const info = inconsistencies.filter((i) => i.type === 'info')

  // Contar por entidade
  const summary = {
    schools: {
      errors: errors.filter((i) => i.entity === 'school').length,
      warnings: warnings.filter((i) => i.entity === 'school').length,
      info: info.filter((i) => i.entity === 'school').length,
    },
    students: {
      errors: errors.filter((i) => i.entity === 'student').length,
      warnings: warnings.filter((i) => i.entity === 'student').length,
      info: info.filter((i) => i.entity === 'student').length,
    },
    teachers: {
      errors: errors.filter((i) => i.entity === 'teacher').length,
      warnings: warnings.filter((i) => i.entity === 'teacher').length,
      info: info.filter((i) => i.entity === 'teacher').length,
    },
    classrooms: {
      errors: errors.filter((i) => i.entity === 'classroom').length,
      warnings: warnings.filter((i) => i.entity === 'classroom').length,
      info: info.filter((i) => i.entity === 'classroom').length,
    },
    enrollments: {
      errors: errors.filter((i) => i.entity === 'enrollment').length,
      warnings: warnings.filter((i) => i.entity === 'enrollment').length,
      info: info.filter((i) => i.entity === 'enrollment').length,
    },
  }

  return {
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    totalInfo: info.length,
    inconsistencies,
    summary,
  }
}

/**
 * Exporta relatório de inconsistências para CSV
 */
export function exportInconsistencyReportToCSV(
  report: InconsistencyReport,
): string {
  const lines: string[] = []

  // Cabeçalho
  lines.push('Tipo,Entidade,ID,Nome,Campo,Mensagem,Sugestão')

  // Dados
  for (const inconsistency of report.inconsistencies) {
    const line = [
      inconsistency.type,
      inconsistency.entity,
      inconsistency.entityId,
      `"${inconsistency.entityName}"`,
      inconsistency.field || '',
      `"${inconsistency.message}"`,
      inconsistency.suggestion ? `"${inconsistency.suggestion}"` : '',
    ].join(',')

    lines.push(line)
  }

  return lines.join('\n')
}

/**
 * Faz download do relatório de inconsistências
 */
export function downloadInconsistencyReport(report: InconsistencyReport): void {
  const csv = exportInconsistencyReportToCSV(report)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `inconsistencias_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

