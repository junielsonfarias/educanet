/**
 * Academic Period Service
 * 
 * Serviço para gerenciar Períodos Letivos no Supabase
 * 
 * Features:
 * - CRUD completo de períodos letivos
 * - Consulta de período letivo atual
 * - Validação de sobreposição dentro do ano letivo
 * - Gerenciamento de turmas associadas
 */

import { BaseService } from "./base-service"
import { Database } from "../database.types"
import { supabase } from "../client"

// Types
type AcademicPeriodRow = Database["public"]["Tables"]["academic_periods"]["Row"]
type AcademicPeriodInsert = Database["public"]["Tables"]["academic_periods"]["Insert"]
type AcademicPeriodUpdate = Database["public"]["Tables"]["academic_periods"]["Update"]
type AcademicPeriodType = Database["public"]["Enums"]["academic_period_type"]

// Type auxiliar para Períodos com ano letivo
export interface AcademicPeriodWithYear extends AcademicPeriodRow {
  academic_year?: {
    id: number
    year: number
    start_date: string
    end_date: string
  }
}

/**
 * Serviço para operações com Períodos Letivos
 */
class AcademicPeriodService extends BaseService<
  AcademicPeriodRow,
  AcademicPeriodInsert,
  AcademicPeriodUpdate
> {
  constructor() {
    super("academic_periods")
  }

  /**
   * Obtém o período letivo atual baseado na data de hoje
   */
  async getCurrentAcademicPeriod(): Promise<AcademicPeriodRow | null> {
    try {
      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .lte("start_date", today)
        .gte("end_date", today)
        .is("deleted_at", null)
        .single()

      if (error) {
        console.warn(
          "[AcademicPeriodService] Nenhum período letivo ativo encontrado:",
          error.message
        )
        return null
      }

      return data
    } catch (error) {
      console.error("[AcademicPeriodService] Erro ao buscar período letivo atual:", error)
      return null
    }
  }

  /**
   * Obtém períodos letivos por ano letivo
   */
  async getByAcademicYear(academicYearId: number): Promise<AcademicPeriodRow[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("academic_year_id", academicYearId)
        .is("deleted_at", null)
        .order("start_date", { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("[AcademicPeriodService] Erro ao buscar períodos por ano:", error)
      return []
    }
  }

  /**
   * Obtém período com informações do ano letivo
   */
  async getWithYear(id: number): Promise<AcademicPeriodWithYear | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          academic_year:academic_years (
            id,
            year,
            start_date,
            end_date
          )
        `
        )
        .eq("id", id)
        .is("deleted_at", null)
        .single()

      if (error) throw error

      return data as AcademicPeriodWithYear
    } catch (error) {
      console.error("[AcademicPeriodService] Erro ao buscar período com ano:", error)
      return null
    }
  }

  /**
   * Verifica se há sobreposição de datas dentro do mesmo ano letivo
   */
  async checkDateOverlap(
    academicYearId: number,
    startDate: string,
    endDate: string,
    excludeId?: number
  ): Promise<boolean> {
    try {
      let query = supabase
        .from(this.tableName)
        .select("id")
        .eq("academic_year_id", academicYearId)
        .is("deleted_at", null)
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

      if (excludeId) {
        query = query.neq("id", excludeId)
      }

      const { data, error } = await query

      if (error) throw error

      return (data && data.length > 0) || false
    } catch (error) {
      console.error("[AcademicPeriodService] Erro ao verificar sobreposição:", error)
      return false
    }
  }

  /**
   * Cria período com validação de sobreposição
   */
  async createWithValidation(data: AcademicPeriodInsert): Promise<AcademicPeriodRow | null> {
    try {
      // Verifica sobreposição
      const hasOverlap = await this.checkDateOverlap(
        data.academic_year_id,
        data.start_date,
        data.end_date
      )

      if (hasOverlap) {
        console.error(
          "[AcademicPeriodService] Há sobreposição de datas com outro período do mesmo ano"
        )
        return null
      }

      return await this.create(data)
    } catch (error) {
      console.error("[AcademicPeriodService] Erro ao criar período:", error)
      return null
    }
  }

  /**
   * Atualiza período com validação de sobreposição
   */
  async updateWithValidation(
    id: number,
    data: AcademicPeriodUpdate
  ): Promise<AcademicPeriodRow | null> {
    try {
      // Se está atualizando datas, verifica sobreposição
      if (data.academic_year_id && data.start_date && data.end_date) {
        const hasOverlap = await this.checkDateOverlap(
          data.academic_year_id,
          data.start_date,
          data.end_date,
          id
        )

        if (hasOverlap) {
          console.error(
            "[AcademicPeriodService] Há sobreposição de datas com outro período do mesmo ano"
          )
          return null
        }
      }

      return await this.update(id, data)
    } catch (error) {
      console.error("[AcademicPeriodService] Erro ao atualizar período:", error)
      return null
    }
  }

  /**
   * Obtém períodos por tipo
   */
  async getByType(type: AcademicPeriodType): Promise<AcademicPeriodRow[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("type", type)
        .is("deleted_at", null)
        .order("start_date", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("[AcademicPeriodService] Erro ao buscar períodos por tipo:", error)
      return []
    }
  }

  /**
   * Obtém estatísticas do período letivo
   */
  async getPeriodStats(periodId: number): Promise<{
    totalClasses: number
    totalStudents: number
    totalLessons: number
    totalEvaluations: number
  }> {
    try {
      // Conta turmas
      const { count: totalClasses } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("academic_period_id", periodId)
        .is("deleted_at", null)

      // Busca IDs das turmas para contar alunos
      const { data: classes } = await supabase
        .from("classes")
        .select("id")
        .eq("academic_period_id", periodId)
        .is("deleted_at", null)

      const classIds = classes?.map((c) => c.id) || []

      let totalStudents = 0
      if (classIds.length > 0) {
        const { count } = await supabase
          .from("class_enrollments")
          .select("*", { count: "exact", head: true })
          .in("class_id", classIds)
          .eq("status", "Ativo")
          .is("deleted_at", null)

        totalStudents = count || 0
      }

      // Busca IDs de class_teacher_subjects para contar aulas e avaliações
      const { data: cts } = await supabase
        .from("class_teacher_subjects")
        .select("id")
        .in("class_id", classIds)
        .is("deleted_at", null)

      const ctsIds = cts?.map((c) => c.id) || []

      let totalLessons = 0
      let totalEvaluations = 0

      if (ctsIds.length > 0) {
        const { count: lessonsCount } = await supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .in("class_teacher_subject_id", ctsIds)
          .is("deleted_at", null)

        const { count: evaluationsCount } = await supabase
          .from("evaluation_instances")
          .select("*", { count: "exact", head: true })
          .in("class_teacher_subject_id", ctsIds)
          .is("deleted_at", null)

        totalLessons = lessonsCount || 0
        totalEvaluations = evaluationsCount || 0
      }

      return {
        totalClasses: totalClasses || 0,
        totalStudents,
        totalLessons,
        totalEvaluations,
      }
    } catch (error) {
      console.error("[AcademicPeriodService] Erro ao buscar estatísticas:", error)
      return {
        totalClasses: 0,
        totalStudents: 0,
        totalLessons: 0,
        totalEvaluations: 0,
      }
    }
  }

  /**
   * Obtém todos os períodos com informações do ano letivo
   */
  async getAllWithYear(): Promise<AcademicPeriodWithYear[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          academic_year:academic_years (
            id,
            year,
            start_date,
            end_date
          )
        `
        )
        .is("deleted_at", null)
        .order("start_date", { ascending: false })

      if (error) throw error

      return (data as AcademicPeriodWithYear[]) || []
    } catch (error) {
      console.error("[AcademicPeriodService] Erro ao buscar períodos com ano:", error)
      return []
    }
  }
}

// Instância singleton do serviço
export const academicPeriodService = new AcademicPeriodService()

