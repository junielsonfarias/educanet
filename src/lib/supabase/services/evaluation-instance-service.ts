/**
 * Evaluation Instance Service
 * 
 * Serviço para gerenciar Instâncias de Avaliação no Supabase
 * 
 * Features:
 * - CRUD completo de instâncias de avaliação
 * - Consulta por turma, professor, disciplina
 * - Gerenciamento de notas associadas
 * - Estatísticas de avaliações
 */

import { BaseService } from "./base-service"
import { Database } from "../database.types"
import { supabase } from "../client"

// Types
type EvaluationInstanceRow = Database["public"]["Tables"]["evaluation_instances"]["Row"]
type EvaluationInstanceInsert =
  Database["public"]["Tables"]["evaluation_instances"]["Insert"]
type EvaluationInstanceUpdate =
  Database["public"]["Tables"]["evaluation_instances"]["Update"]
type EvaluationType = Database["public"]["Enums"]["evaluation_type"]

// Type auxiliar para avaliações com relacionamentos
export interface EvaluationInstanceWithDetails extends EvaluationInstanceRow {
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
  grades?: {
    id: number
    grade_value: number
    student_enrollment_id: number
  }[]
}

/**
 * Serviço para operações com Instâncias de Avaliação
 */
class EvaluationInstanceService extends BaseService<
  EvaluationInstanceRow,
  EvaluationInstanceInsert,
  EvaluationInstanceUpdate
> {
  constructor() {
    super("evaluation_instances")
  }

  /**
   * Obtém avaliação com todos os detalhes
   */
  async getWithDetails(id: number): Promise<EvaluationInstanceWithDetails | null> {
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
          grades (
            id,
            grade_value,
            student_enrollment_id
          )
        `
        )
        .eq("id", id)
        .is("deleted_at", null)
        .single()

      if (error) throw error

      return data as EvaluationInstanceWithDetails
    } catch (error) {
      console.error("[EvaluationInstanceService] Erro ao buscar avaliação com detalhes:", error)
      return null
    }
  }

  /**
   * Obtém avaliações por turma/disciplina/professor
   */
  async getByClassTeacherSubject(
    classTeacherSubjectId: number
  ): Promise<EvaluationInstanceRow[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("class_teacher_subject_id", classTeacherSubjectId)
        .is("deleted_at", null)
        .order("evaluation_date", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error(
        "[EvaluationInstanceService] Erro ao buscar avaliações por CTS:",
        error
      )
      return []
    }
  }

  /**
   * Obtém avaliações por turma
   */
  async getByClass(classId: number): Promise<EvaluationInstanceWithDetails[]> {
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
        .order("evaluation_date", { ascending: false })

      if (error) throw error

      return (data as EvaluationInstanceWithDetails[]) || []
    } catch (error) {
      console.error("[EvaluationInstanceService] Erro ao buscar avaliações por turma:", error)
      return []
    }
  }

  /**
   * Obtém avaliações por professor
   */
  async getByTeacher(teacherId: number): Promise<EvaluationInstanceWithDetails[]> {
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
        .order("evaluation_date", { ascending: false })

      if (error) throw error

      return (data as EvaluationInstanceWithDetails[]) || []
    } catch (error) {
      console.error(
        "[EvaluationInstanceService] Erro ao buscar avaliações por professor:",
        error
      )
      return []
    }
  }

  /**
   * Obtém avaliações por tipo
   */
  async getByType(type: EvaluationType): Promise<EvaluationInstanceRow[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("evaluation_type", type)
        .is("deleted_at", null)
        .order("evaluation_date", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("[EvaluationInstanceService] Erro ao buscar avaliações por tipo:", error)
      return []
    }
  }

  /**
   * Obtém avaliações por intervalo de datas
   */
  async getByDateRange(startDate: string, endDate: string): Promise<EvaluationInstanceRow[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .gte("evaluation_date", startDate)
        .lte("evaluation_date", endDate)
        .is("deleted_at", null)
        .order("evaluation_date", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error(
        "[EvaluationInstanceService] Erro ao buscar avaliações por período:",
        error
      )
      return []
    }
  }

  /**
   * Obtém estatísticas da avaliação
   */
  async getEvaluationStats(evaluationId: number): Promise<{
    totalStudents: number
    studentsWithGrades: number
    averageGrade: number
    highestGrade: number
    lowestGrade: number
    approvalRate: number
  }> {
    try {
      // Busca a avaliação para saber a nota máxima
      const evaluation = await this.getById(evaluationId)
      if (!evaluation) {
        throw new Error("Avaliação não encontrada")
      }

      const maxGrade = evaluation.max_grade || 10

      // Busca todas as notas desta avaliação
      const { data: grades } = await supabase
        .from("grades")
        .select("grade_value, student_enrollment_id")
        .eq("evaluation_instance_id", evaluationId)
        .is("deleted_at", null)

      if (!grades || grades.length === 0) {
        return {
          totalStudents: 0,
          studentsWithGrades: 0,
          averageGrade: 0,
          highestGrade: 0,
          lowestGrade: 0,
          approvalRate: 0,
        }
      }

      const gradeValues = grades.map((g) => g.grade_value)
      const averageGrade = gradeValues.reduce((sum, val) => sum + val, 0) / gradeValues.length
      const highestGrade = Math.max(...gradeValues)
      const lowestGrade = Math.min(...gradeValues)

      // Calcula taxa de aprovação (>= 60% da nota máxima)
      const passGrade = maxGrade * 0.6
      const passedCount = gradeValues.filter((g) => g >= passGrade).length
      const approvalRate = (passedCount / gradeValues.length) * 100

      return {
        totalStudents: grades.length,
        studentsWithGrades: grades.length,
        averageGrade: Math.round(averageGrade * 100) / 100,
        highestGrade,
        lowestGrade,
        approvalRate: Math.round(approvalRate * 100) / 100,
      }
    } catch (error) {
      console.error("[EvaluationInstanceService] Erro ao calcular estatísticas:", error)
      return {
        totalStudents: 0,
        studentsWithGrades: 0,
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
        approvalRate: 0,
      }
    }
  }

  /**
   * Verifica se todos os alunos têm notas lançadas
   */
  async checkAllGradesReleased(evaluationId: number): Promise<boolean> {
    try {
      // Busca a avaliação para saber qual é o class_teacher_subject_id
      const evaluation = await this.getById(evaluationId)
      if (!evaluation) return false

      // Busca o class_id via class_teacher_subjects
      const { data: cts } = await supabase
        .from("class_teacher_subjects")
        .select("class_id")
        .eq("id", evaluation.class_teacher_subject_id)
        .single()

      if (!cts) return false

      // Conta alunos matriculados na turma
      const { count: totalStudents } = await supabase
        .from("class_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("class_id", cts.class_id)
        .eq("status", "Ativo")
        .is("deleted_at", null)

      // Conta notas lançadas
      const { count: gradesCount } = await supabase
        .from("grades")
        .select("*", { count: "exact", head: true })
        .eq("evaluation_instance_id", evaluationId)
        .is("deleted_at", null)

      return totalStudents === gradesCount
    } catch (error) {
      console.error(
        "[EvaluationInstanceService] Erro ao verificar completude das notas:",
        error
      )
      return false
    }
  }
}

// Instância singleton do serviço
export const evaluationInstanceService = new EvaluationInstanceService()

