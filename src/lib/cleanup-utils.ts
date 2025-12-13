/**
 * Utilitários para limpeza de dados relacionados
 * Usado quando entidades são deletadas para manter integridade referencial
 */

import { Enrollment, Student } from './mock-data'
import { Assessment } from './mock-data'
import { AttendanceRecord } from './mock-data'
import { Occurrence } from './mock-data'
import { TeacherAllocation, Teacher } from './mock-data'

/**
 * Limpa dados relacionados a uma turma quando ela é deletada
 * Atualiza ou remove referências à turma em outras entidades
 */
export interface CleanupResult {
  enrollmentsUpdated: number
  assessmentsRemoved: number
  attendanceRecordsRemoved: number
  occurrencesRemoved: number
  teacherAllocationsRemoved: number
  errors: string[]
}

/**
 * Limpa dados relacionados a uma turma
 * Retorna informações sobre o que foi limpo
 */
export function cleanupClassroomData(
  classroomId: string,
  schoolId: string,
  academicYearId: string,
  options: {
    students?: Student[]
    assessments?: Assessment[]
    attendanceRecords?: AttendanceRecord[]
    occurrences?: Occurrence[]
    teachers?: Teacher[]
    removeEnrollments?: boolean // Se true, remove enrollments. Se false, apenas atualiza status
  } = {},
): CleanupResult {
  const result: CleanupResult = {
    enrollmentsUpdated: 0,
    assessmentsRemoved: 0,
    attendanceRecordsRemoved: 0,
    occurrencesRemoved: 0,
    teacherAllocationsRemoved: 0,
    errors: [],
  }

  try {
    // 1. Atualizar ou remover Enrollments relacionados
    if (options.students) {
      options.students.forEach((student) => {
        const enrollmentsToUpdate = student.enrollments.filter(
          (e) =>
            e.classroomId === classroomId ||
            (e.schoolId === schoolId &&
              e.academicYearId === academicYearId &&
              // Fallback: verificar por nome se classroomId não estiver disponível
              !e.classroomId),
        )

        enrollmentsToUpdate.forEach((enrollment) => {
          if (options.removeEnrollments) {
            // Remover enrollment (será feito pelo store)
            result.enrollmentsUpdated++
          } else {
            // Atualizar status para "Transferido" ou "Abandono"
            enrollment.status = 'Transferido'
            result.enrollmentsUpdated++
          }
        })
      })
    }

    // 2. Remover Assessments relacionados
    if (options.assessments) {
      const assessmentsToRemove = options.assessments.filter(
        (a) => a.classroomId === classroomId,
      )
      result.assessmentsRemoved = assessmentsToRemove.length
      // Nota: A remoção real será feita pelo store
    }

    // 3. Remover AttendanceRecords relacionados
    if (options.attendanceRecords) {
      const recordsToRemove = options.attendanceRecords.filter(
        (r) => r.classroomId === classroomId,
      )
      result.attendanceRecordsRemoved = recordsToRemove.length
      // Nota: A remoção real será feita pelo store
    }

    // 4. Remover Occurrences relacionadas
    if (options.occurrences) {
      const occurrencesToRemove = options.occurrences.filter(
        (o) => o.classroomId === classroomId,
      )
      result.occurrencesRemoved = occurrencesToRemove.length
      // Nota: A remoção real será feita pelo store
    }

    // 5. Remover TeacherAllocations relacionadas
    if (options.teachers) {
      options.teachers.forEach((teacher) => {
        const allocationsToRemove = teacher.allocations.filter(
          (a) =>
            a.classroomId === classroomId &&
            a.schoolId === schoolId &&
            a.academicYearId === academicYearId,
        )
        result.teacherAllocationsRemoved += allocationsToRemove.length
        // Nota: A remoção real será feita pelo store
      })
    }
  } catch (error) {
    result.errors.push(
      `Erro durante limpeza: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    )
  }

  return result
}

/**
 * Obtém lista de IDs de alunos que têm matrícula na turma
 * Útil para identificar quais alunos serão afetados pela deleção
 */
export function getStudentsInClassroom(
  classroomId: string,
  schoolId: string,
  academicYearId: string,
  students: Student[],
): string[] {
  return students
    .filter((student) => {
      return student.enrollments.some(
        (e) =>
          (e.classroomId === classroomId ||
            (e.schoolId === schoolId &&
              e.academicYearId === academicYearId &&
              !e.classroomId)) &&
          e.status === 'Cursando',
      )
    })
    .map((s) => s.id)
}

/**
 * Obtém estatísticas sobre dados relacionados a uma turma
 * Útil para mostrar ao usuário antes de deletar
 */
export function getClassroomDataStats(
  classroomId: string,
  schoolId: string,
  academicYearId: string,
  options: {
    students?: Student[]
    assessments?: Assessment[]
    attendanceRecords?: AttendanceRecord[]
    occurrences?: Occurrence[]
    teachers?: Teacher[]
  } = {},
): {
  studentCount: number
  assessmentCount: number
  attendanceRecordCount: number
  occurrenceRecordCount: number
  teacherAllocationCount: number
} {
  const studentIds = getStudentsInClassroom(
    classroomId,
    schoolId,
    academicYearId,
    options.students || [],
  )

  const assessmentCount =
    options.assessments?.filter((a) => a.classroomId === classroomId).length ||
    0

  const attendanceRecordCount =
    options.attendanceRecords?.filter(
      (r) => r.classroomId === classroomId,
    ).length || 0

  const occurrenceRecordCount =
    options.occurrences?.filter((o) => o.classroomId === classroomId).length ||
    0

  const teacherAllocationCount =
    options.teachers?.reduce(
      (count, teacher) =>
        count +
        teacher.allocations.filter(
          (a) =>
            a.classroomId === classroomId &&
            a.schoolId === schoolId &&
            a.academicYearId === academicYearId,
        ).length,
      0,
    ) || 0

  return {
    studentCount: studentIds.length,
    assessmentCount,
    attendanceRecordCount,
    occurrenceRecordCount,
    teacherAllocationCount,
  }
}

