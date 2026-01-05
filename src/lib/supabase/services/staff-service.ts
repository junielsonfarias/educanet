/**
 * Staff Service
 * 
 * Serviço para gerenciar Funcionários no Supabase
 * 
 * Features:
 * - CRUD completo de funcionários
 * - Consulta por escola, cargo, departamento
 * - Informações completas com pessoa vinculada
 */

import { BaseService } from "./base-service"
import { Database } from "../database.types"
import { supabase } from "../client"

// Types
type StaffRow = Database["public"]["Tables"]["staff"]["Row"]
type StaffInsert = Database["public"]["Tables"]["staff"]["Insert"]
type StaffUpdate = Database["public"]["Tables"]["staff"]["Update"]

// Type auxiliar para funcionários com informações completas
export interface StaffFullInfo extends StaffRow {
  person?: {
    id: number
    first_name: string
    last_name: string
    cpf: string
    email: string | null
    phone: string | null
    date_of_birth: string
    address: string | null
  }
  position?: {
    id: number
    name: string
    description: string | null
  }
  department?: {
    id: number
    name: string
    description: string | null
  }
  school?: {
    id: number
    name: string
    address: string
  } | null
}

/**
 * Serviço para operações com Funcionários
 */
class StaffService extends BaseService<StaffRow, StaffInsert, StaffUpdate> {
  constructor() {
    super("staff")
  }

  /**
   * Obtém funcionário com informações completas
   */
  async getStaffFullInfo(id: number): Promise<StaffFullInfo | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          person:people (
            id,
            first_name,
            last_name,
            cpf,
            email,
            phone,
            date_of_birth,
            address
          ),
          position:positions (
            id,
            name,
            description
          ),
          department:departments (
            id,
            name,
            description
          ),
          school:schools (
            id,
            name,
            address
          )
        `
        )
        .eq("id", id)
        .is("deleted_at", null)
        .single()

      if (error) throw error

      return data as StaffFullInfo
    } catch (error) {
      console.error("[StaffService] Erro ao buscar funcionário completo:", error)
      return null
    }
  }

  /**
   * Obtém todos os funcionários com informações completas
   */
  async getAllWithFullInfo(): Promise<StaffFullInfo[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          person:people (
            id,
            first_name,
            last_name,
            cpf,
            email,
            phone,
            date_of_birth,
            address
          ),
          position:positions (
            id,
            name,
            description
          ),
          department:departments (
            id,
            name,
            description
          ),
          school:schools (
            id,
            name,
            address
          )
        `
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data as StaffFullInfo[]) || []
    } catch (error) {
      console.error("[StaffService] Erro ao buscar funcionários:", error)
      return []
    }
  }

  /**
   * Obtém funcionários por escola
   */
  async getBySchool(schoolId: number): Promise<StaffFullInfo[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          person:people (
            id,
            first_name,
            last_name,
            cpf,
            email,
            phone
          ),
          position:positions (
            id,
            name
          ),
          department:departments (
            id,
            name
          )
        `
        )
        .eq("school_id", schoolId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data as StaffFullInfo[]) || []
    } catch (error) {
      console.error("[StaffService] Erro ao buscar funcionários por escola:", error)
      return []
    }
  }

  /**
   * Obtém funcionários por departamento
   */
  async getByDepartment(departmentId: number): Promise<StaffFullInfo[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          person:people (
            id,
            first_name,
            last_name,
            cpf,
            email,
            phone
          ),
          position:positions (
            id,
            name
          ),
          school:schools (
            id,
            name
          )
        `
        )
        .eq("department_id", departmentId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data as StaffFullInfo[]) || []
    } catch (error) {
      console.error("[StaffService] Erro ao buscar funcionários por departamento:", error)
      return []
    }
  }

  /**
   * Obtém funcionários por cargo
   */
  async getByPosition(positionId: number): Promise<StaffFullInfo[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          person:people (
            id,
            first_name,
            last_name,
            cpf,
            email,
            phone
          ),
          department:departments (
            id,
            name
          ),
          school:schools (
            id,
            name
          )
        `
        )
        .eq("position_id", positionId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data as StaffFullInfo[]) || []
    } catch (error) {
      console.error("[StaffService] Erro ao buscar funcionários por cargo:", error)
      return []
    }
  }

  /**
   * Busca funcionários por termo
   */
  async searchStaff(searchTerm: string): Promise<StaffFullInfo[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          person:people (
            id,
            first_name,
            last_name,
            cpf,
            email,
            phone
          ),
          position:positions (
            id,
            name
          ),
          department:departments (
            id,
            name
          ),
          school:schools (
            id,
            name
          )
        `
        )
        .or(
          `functional_registration.ilike.%${searchTerm}%,person.first_name.ilike.%${searchTerm}%,person.last_name.ilike.%${searchTerm}%,person.cpf.ilike.%${searchTerm}%`
        )
        .is("deleted_at", null)
        .limit(20)

      if (error) throw error

      return (data as StaffFullInfo[]) || []
    } catch (error) {
      console.error("[StaffService] Erro ao buscar funcionários:", error)
      return []
    }
  }

  /**
   * Verifica se a matrícula funcional já existe
   */
  async checkFunctionalRegistrationExists(
    functionalRegistration: string,
    excludeId?: number
  ): Promise<boolean> {
    try {
      let query = supabase
        .from(this.tableName)
        .select("id")
        .eq("functional_registration", functionalRegistration)
        .is("deleted_at", null)

      if (excludeId) {
        query = query.neq("id", excludeId)
      }

      const { data, error } = await query

      if (error) throw error

      return (data && data.length > 0) || false
    } catch (error) {
      console.error("[StaffService] Erro ao verificar matrícula funcional:", error)
      return false
    }
  }

  /**
   * Cria funcionário com validação
   */
  async createWithValidation(data: StaffInsert): Promise<StaffRow | null> {
    try {
      // Verifica se a matrícula funcional já existe
      const exists = await this.checkFunctionalRegistrationExists(data.functional_registration)

      if (exists) {
        console.error(
          "[StaffService] Matrícula funcional já existe:",
          data.functional_registration
        )
        return null
      }

      return await this.create(data)
    } catch (error) {
      console.error("[StaffService] Erro ao criar funcionário:", error)
      return null
    }
  }

  /**
   * Atualiza funcionário com validação
   */
  async updateWithValidation(id: number, data: StaffUpdate): Promise<StaffRow | null> {
    try {
      // Se está atualizando a matrícula funcional, verifica se já existe
      if (data.functional_registration) {
        const exists = await this.checkFunctionalRegistrationExists(
          data.functional_registration,
          id
        )

        if (exists) {
          console.error(
            "[StaffService] Matrícula funcional já existe:",
            data.functional_registration
          )
          return null
        }
      }

      return await this.update(id, data)
    } catch (error) {
      console.error("[StaffService] Erro ao atualizar funcionário:", error)
      return null
    }
  }

  /**
   * Conta funcionários por departamento
   */
  async countByDepartment(departmentId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("department_id", departmentId)
        .is("deleted_at", null)

      if (error) throw error

      return count || 0
    } catch (error) {
      console.error("[StaffService] Erro ao contar funcionários:", error)
      return 0
    }
  }

  /**
   * Conta funcionários por escola
   */
  async countBySchool(schoolId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .is("deleted_at", null)

      if (error) throw error

      return count || 0
    } catch (error) {
      console.error("[StaffService] Erro ao contar funcionários:", error)
      return 0
    }
  }
}

// Instância singleton do serviço
export const staffService = new StaffService()

