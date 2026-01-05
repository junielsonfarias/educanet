/**
 * Academic Year Service
 * 
 * Serviço para gerenciar Anos Letivos no Supabase
 * 
 * Features:
 * - CRUD completo de anos letivos
 * - Consulta de ano letivo atual
 * - Validação de sobreposição de datas
 * - Gerenciamento de períodos letivos associados
 */

import { BaseService } from "./base-service"
import { Database } from "../database.types"
import { supabase } from "../client"

// Types
type AcademicYearRow = Database["public"]["Tables"]["academic_years"]["Row"]
type AcademicYearInsert = Database["public"]["Tables"]["academic_years"]["Insert"]
type AcademicYearUpdate = Database["public"]["Tables"]["academic_years"]["Update"]

// Type auxiliar para Anos Letivos com períodos
export interface AcademicYearWithPeriods extends AcademicYearRow {
  academic_periods?: {
    id: number
    name: string
    type: string
    start_date: string
    end_date: string
  }[]
}

/**
 * Serviço para operações com Anos Letivos
 */
class AcademicYearService extends BaseService<
  AcademicYearRow,
  AcademicYearInsert,
  AcademicYearUpdate
> {
  constructor() {
    super("academic_years")
  }

  /**
   * Obtém o ano letivo atual baseado na data de hoje
   */
  async getCurrentAcademicYear(): Promise<AcademicYearRow | null> {
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
        console.warn("[AcademicYearService] Nenhum ano letivo ativo encontrado:", error.message)
        return null
      }

      return data
    } catch (error) {
      console.error("[AcademicYearService] Erro ao buscar ano letivo atual:", error)
      return null
    }
  }

  /**
   * Obtém ano letivo com seus períodos
   */
  async getWithPeriods(id: number): Promise<AcademicYearWithPeriods | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          academic_periods (
            id,
            name,
            type,
            start_date,
            end_date
          )
        `
        )
        .eq("id", id)
        .is("deleted_at", null)
        .single()

      if (error) throw error

      return data as AcademicYearWithPeriods
    } catch (error) {
      console.error("[AcademicYearService] Erro ao buscar ano letivo com períodos:", error)
      return null
    }
  }

  /**
   * Obtém todos os anos letivos com seus períodos
   */
  async getAllWithPeriods(): Promise<AcademicYearWithPeriods[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          academic_periods (
            id,
            name,
            type,
            start_date,
            end_date
          )
        `
        )
        .is("deleted_at", null)
        .order("year", { ascending: false })

      if (error) throw error

      return (data as AcademicYearWithPeriods[]) || []
    } catch (error) {
      console.error("[AcademicYearService] Erro ao buscar anos letivos com períodos:", error)
      return []
    }
  }

  /**
   * Verifica se há sobreposição de datas com outros anos letivos
   */
  async checkDateOverlap(
    startDate: string,
    endDate: string,
    excludeId?: number
  ): Promise<boolean> {
    try {
      let query = supabase
        .from(this.tableName)
        .select("id")
        .is("deleted_at", null)
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

      if (excludeId) {
        query = query.neq("id", excludeId)
      }

      const { data, error } = await query

      if (error) throw error

      return (data && data.length > 0) || false
    } catch (error) {
      console.error("[AcademicYearService] Erro ao verificar sobreposição:", error)
      return false
    }
  }

  /**
   * Cria um novo ano letivo com validação de sobreposição
   */
  async createWithValidation(data: AcademicYearInsert): Promise<AcademicYearRow | null> {
    try {
      // Verifica sobreposição
      const hasOverlap = await this.checkDateOverlap(data.start_date, data.end_date)

      if (hasOverlap) {
        console.error("[AcademicYearService] Há sobreposição de datas com outro ano letivo")
        return null
      }

      return await this.create(data)
    } catch (error) {
      console.error("[AcademicYearService] Erro ao criar ano letivo:", error)
      return null
    }
  }

  /**
   * Atualiza ano letivo com validação de sobreposição
   */
  async updateWithValidation(
    id: number,
    data: AcademicYearUpdate
  ): Promise<AcademicYearRow | null> {
    try {
      // Se está atualizando datas, verifica sobreposição
      if (data.start_date && data.end_date) {
        const hasOverlap = await this.checkDateOverlap(
          data.start_date,
          data.end_date,
          id
        )

        if (hasOverlap) {
          console.error("[AcademicYearService] Há sobreposição de datas com outro ano letivo")
          return null
        }
      }

      return await this.update(id, data)
    } catch (error) {
      console.error("[AcademicYearService] Erro ao atualizar ano letivo:", error)
      return null
    }
  }

  /**
   * Obtém anos letivos por intervalo de anos
   */
  async getByYearRange(startYear: number, endYear: number): Promise<AcademicYearRow[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .gte("year", startYear)
        .lte("year", endYear)
        .is("deleted_at", null)
        .order("year", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("[AcademicYearService] Erro ao buscar anos letivos por intervalo:", error)
      return []
    }
  }

  /**
   * Obtém estatísticas do ano letivo
   */
  async getAcademicYearStats(academicYearId: number): Promise<{
    totalEnrollments: number
    activeEnrollments: number
    totalClasses: number
    totalPeriods: number
  }> {
    try {
      // Conta matrículas
      const { count: totalEnrollments } = await supabase
        .from("student_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("academic_year_id", academicYearId)
        .is("deleted_at", null)

      const { count: activeEnrollments } = await supabase
        .from("student_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("academic_year_id", academicYearId)
        .eq("enrollment_status", "Ativo")
        .is("deleted_at", null)

      // Conta turmas via academic_periods
      const { data: periods } = await supabase
        .from("academic_periods")
        .select("id")
        .eq("academic_year_id", academicYearId)
        .is("deleted_at", null)

      const periodIds = periods?.map((p) => p.id) || []

      let totalClasses = 0
      if (periodIds.length > 0) {
        const { count } = await supabase
          .from("classes")
          .select("*", { count: "exact", head: true })
          .in("academic_period_id", periodIds)
          .is("deleted_at", null)

        totalClasses = count || 0
      }

      return {
        totalEnrollments: totalEnrollments || 0,
        activeEnrollments: activeEnrollments || 0,
        totalClasses,
        totalPeriods: periods?.length || 0,
      }
    } catch (error) {
      console.error("[AcademicYearService] Erro ao buscar estatísticas:", error)
      return {
        totalEnrollments: 0,
        activeEnrollments: 0,
        totalClasses: 0,
        totalPeriods: 0,
      }
    }
  }
}

// Instância singleton do serviço
export const academicYearService = new AcademicYearService()

