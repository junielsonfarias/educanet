/**
 * Lesson Service
 * 
 * Serviço para gerenciar Aulas no Supabase
 * 
 * Features:
 * - CRUD completo de aulas
 * - Consulta por turma, professor, disciplina
 * - Gerenciamento de frequência associada
 * - Controle de diário de classe
 */

import { BaseService } from "./base-service"
import { Database } from "../database.types"
import { supabase } from "../client"

// Types
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"]
type LessonInsert = Database["public"]["Tables"]["lessons"]["Insert"]
type LessonUpdate = Database["public"]["Tables"]["lessons"]["Update"]

// Type auxiliar para aulas com relacionamentos
export interface LessonWithDetails extends LessonRow {
  class_teacher_subject?: {
    id: number
    class_id: number
    subject_id: number
    teacher_id: number
    class?: {
      id: number
      name: string
      school_id: number
    }
    subject?: {
      id: number
      name: string
      code: string
    }
    teacher?: {
      id: number
      functional_registration: string
      person?: {
        id: number
        first_name: string
        last_name: string
      }
    }
  }
  attendances?: {
    id: number
    status: string
    student_enrollment_id: number
  }[]
}

/**
 * Serviço para operações com Aulas
 */
class LessonService extends BaseService<LessonRow, LessonInsert, LessonUpdate> {
  constructor() {
    super("lessons")
  }

  /**
   * Obtém aula com todos os detalhes
   */
  async getWithDetails(id: number): Promise<LessonWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          class_teacher_subject:class_teacher_subjects (
            id,
            class_id,
            subject_id,
            teacher_id,
            class:classes (
              id,
              name,
              school_id
            ),
            subject:subjects (
              id,
              name,
              code
            ),
            teacher:teachers (
              id,
              functional_registration,
              person:people (
                id,
                first_name,
                last_name
              )
            )
          ),
          attendances (
            id,
            status,
            student_enrollment_id
          )
        `
        )
        .eq("id", id)
        .is("deleted_at", null)
        .single()

      if (error) throw error

      return data as LessonWithDetails
    } catch (error) {
      console.error("[LessonService] Erro ao buscar aula com detalhes:", error)
      return null
    }
  }

  /**
   * Obtém aulas por turma/disciplina/professor
   */
  async getByClassTeacherSubject(classTeacherSubjectId: number): Promise<LessonRow[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("class_teacher_subject_id", classTeacherSubjectId)
        .is("deleted_at", null)
        .order("lesson_date", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("[LessonService] Erro ao buscar aulas por CTS:", error)
      return []
    }
  }

  /**
   * Obtém aulas por turma
   */
  async getByClass(classId: number): Promise<LessonWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          class_teacher_subject:class_teacher_subjects!inner (
            id,
            class_id,
            subject_id,
            subject:subjects (
              id,
              name,
              code
            ),
            teacher:teachers (
              id,
              functional_registration,
              person:people (
                id,
                first_name,
                last_name
              )
            )
          )
        `
        )
        .eq("class_teacher_subject.class_id", classId)
        .is("deleted_at", null)
        .order("lesson_date", { ascending: false })

      if (error) throw error

      return (data as LessonWithDetails[]) || []
    } catch (error) {
      console.error("[LessonService] Erro ao buscar aulas por turma:", error)
      return []
    }
  }

  /**
   * Obtém aulas por professor
   */
  async getByTeacher(teacherId: number): Promise<LessonWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          class_teacher_subject:class_teacher_subjects!inner (
            id,
            teacher_id,
            class:classes (
              id,
              name
            ),
            subject:subjects (
              id,
              name,
              code
            )
          )
        `
        )
        .eq("class_teacher_subject.teacher_id", teacherId)
        .is("deleted_at", null)
        .order("lesson_date", { ascending: false })

      if (error) throw error

      return (data as LessonWithDetails[]) || []
    } catch (error) {
      console.error("[LessonService] Erro ao buscar aulas por professor:", error)
      return []
    }
  }

  /**
   * Obtém aulas por intervalo de datas
   */
  async getByDateRange(startDate: string, endDate: string): Promise<LessonRow[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .gte("lesson_date", startDate)
        .lte("lesson_date", endDate)
        .is("deleted_at", null)
        .order("lesson_date", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("[LessonService] Erro ao buscar aulas por período:", error)
      return []
    }
  }

  /**
   * Obtém aulas do dia atual
   */
  async getTodayLessons(): Promise<LessonWithDetails[]> {
    try {
      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          class_teacher_subject:class_teacher_subjects (
            id,
            class:classes (
              id,
              name
            ),
            subject:subjects (
              id,
              name
            ),
            teacher:teachers (
              id,
              person:people (
                id,
                first_name,
                last_name
              )
            )
          )
        `
        )
        .eq("lesson_date", today)
        .is("deleted_at", null)
        .order("start_time", { ascending: true })

      if (error) throw error

      return (data as LessonWithDetails[]) || []
    } catch (error) {
      console.error("[LessonService] Erro ao buscar aulas de hoje:", error)
      return []
    }
  }

  /**
   * Verifica se há conflito de horário para o professor
   */
  async checkTeacherScheduleConflict(
    teacherId: number,
    lessonDate: string,
    startTime: string,
    endTime: string,
    excludeLessonId?: number
  ): Promise<boolean> {
    try {
      // Busca todas as aulas do professor na mesma data
      const { data: lessons } = await supabase
        .from(this.tableName)
        .select(
          `
          id,
          start_time,
          end_time,
          class_teacher_subject:class_teacher_subjects!inner (
            teacher_id
          )
        `
        )
        .eq("class_teacher_subject.teacher_id", teacherId)
        .eq("lesson_date", lessonDate)
        .is("deleted_at", null)

      if (!lessons || lessons.length === 0) return false

      // Verifica conflitos de horário
      for (const lesson of lessons) {
        if (excludeLessonId && lesson.id === excludeLessonId) continue

        const lessonStart = lesson.start_time
        const lessonEnd = lesson.end_time

        // Verifica sobreposição
        if (
          (startTime >= lessonStart && startTime < lessonEnd) ||
          (endTime > lessonStart && endTime <= lessonEnd) ||
          (startTime <= lessonStart && endTime >= lessonEnd)
        ) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error("[LessonService] Erro ao verificar conflito de horário:", error)
      return false
    }
  }

  /**
   * Cria aula com validação de conflito
   */
  async createWithValidation(data: LessonInsert): Promise<LessonRow | null> {
    try {
      // Busca o teacher_id via class_teacher_subjects
      const { data: cts } = await supabase
        .from("class_teacher_subjects")
        .select("teacher_id")
        .eq("id", data.class_teacher_subject_id)
        .single()

      if (!cts) {
        console.error("[LessonService] Turma/Professor/Disciplina não encontrado")
        return null
      }

      // Verifica conflito
      const hasConflict = await this.checkTeacherScheduleConflict(
        cts.teacher_id,
        data.lesson_date,
        data.start_time,
        data.end_time
      )

      if (hasConflict) {
        console.error(
          "[LessonService] Há conflito de horário com outra aula deste professor"
        )
        return null
      }

      return await this.create(data)
    } catch (error) {
      console.error("[LessonService] Erro ao criar aula:", error)
      return null
    }
  }

  /**
   * Obtém estatísticas da aula
   */
  async getLessonStats(lessonId: number): Promise<{
    totalStudents: number
    presentStudents: number
    absentStudents: number
    justifiedAbsences: number
    attendanceRate: number
  }> {
    try {
      // Busca a aula para saber qual é o class_teacher_subject_id
      const lesson = await this.getById(lessonId)
      if (!lesson) {
        throw new Error("Aula não encontrada")
      }

      // Busca o class_id via class_teacher_subjects
      const { data: cts } = await supabase
        .from("class_teacher_subjects")
        .select("class_id")
        .eq("id", lesson.class_teacher_subject_id)
        .single()

      if (!cts) {
        throw new Error("Turma não encontrada")
      }

      // Conta alunos matriculados na turma
      const { count: totalStudents } = await supabase
        .from("class_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("class_id", cts.class_id)
        .eq("status", "Ativo")
        .is("deleted_at", null)

      // Conta frequências
      const { count: presentStudents } = await supabase
        .from("attendances")
        .select("*", { count: "exact", head: true })
        .eq("lesson_id", lessonId)
        .eq("status", "Presente")
        .is("deleted_at", null)

      const { count: justifiedAbsences } = await supabase
        .from("attendances")
        .select("*", { count: "exact", head: true })
        .eq("lesson_id", lessonId)
        .eq("status", "Falta Justificada")
        .is("deleted_at", null)

      const { count: unjustifiedAbsences } = await supabase
        .from("attendances")
        .select("*", { count: "exact", head: true })
        .eq("lesson_id", lessonId)
        .eq("status", "Falta Injustificada")
        .is("deleted_at", null)

      const absentStudents = (justifiedAbsences || 0) + (unjustifiedAbsences || 0)
      const attendanceRate =
        totalStudents && presentStudents
          ? ((presentStudents || 0) / (totalStudents || 1)) * 100
          : 0

      return {
        totalStudents: totalStudents || 0,
        presentStudents: presentStudents || 0,
        absentStudents,
        justifiedAbsences: justifiedAbsences || 0,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
      }
    } catch (error) {
      console.error("[LessonService] Erro ao calcular estatísticas:", error)
      return {
        totalStudents: 0,
        presentStudents: 0,
        absentStudents: 0,
        justifiedAbsences: 0,
        attendanceRate: 0,
      }
    }
  }

  /**
   * Verifica se a frequência foi lançada para todos os alunos
   */
  async checkAllAttendancesRecorded(lessonId: number): Promise<boolean> {
    try {
      // Busca a aula para saber qual é o class_teacher_subject_id
      const lesson = await this.getById(lessonId)
      if (!lesson) return false

      // Busca o class_id via class_teacher_subjects
      const { data: cts } = await supabase
        .from("class_teacher_subjects")
        .select("class_id")
        .eq("id", lesson.class_teacher_subject_id)
        .single()

      if (!cts) return false

      // Conta alunos matriculados na turma
      const { count: totalStudents } = await supabase
        .from("class_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("class_id", cts.class_id)
        .eq("status", "Ativo")
        .is("deleted_at", null)

      // Conta frequências lançadas
      const { count: attendancesCount } = await supabase
        .from("attendances")
        .select("*", { count: "exact", head: true })
        .eq("lesson_id", lessonId)
        .is("deleted_at", null)

      return totalStudents === attendancesCount
    } catch (error) {
      console.error(
        "[LessonService] Erro ao verificar completude das frequências:",
        error
      )
      return false
    }
  }
}

// Instância singleton do serviço
export const lessonService = new LessonService()

