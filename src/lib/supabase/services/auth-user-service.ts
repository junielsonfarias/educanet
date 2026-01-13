/**
 * Auth User Service
 * 
 * Serviço para gerenciar usuários de autenticação (auth_users) no Supabase
 * 
 * Features:
 * - CRUD completo de usuários de autenticação
 * - Consulta por email, person_id
 * - Gerenciamento de status (ativo/inativo)
 * - Vinculação com pessoas e roles
 */

import { BaseService } from './base-service'
import { Database } from '../database.types'
import { supabase } from '../client'
import { handleSupabaseError } from '../helpers'

// Types
type AuthUserRow = Database['public']['Tables']['auth_users']['Row']
type AuthUserInsert = Database['public']['Tables']['auth_users']['Insert']
type AuthUserUpdate = Database['public']['Tables']['auth_users']['Update']

// Type auxiliar para usuários com informações completas
export interface AuthUserFullInfo extends AuthUserRow {
  person?: {
    id: number
    first_name: string
    last_name: string
    email: string | null
    cpf: string | null
  }
  roles?: Array<{
    id: number
    name: string
    description: string | null
  }>
}

class AuthUserService extends BaseService<AuthUserRow> {
  constructor() {
    super('auth_users')
  }

  /**
   * Buscar todos os usuários com informações completas
   */
  async getAllWithFullInfo(): Promise<AuthUserFullInfo[]> {
    try {
      // Buscar auth_users (não tem deleted_at)
      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw handleSupabaseError(usersError)

      // Buscar person e roles para cada usuário separadamente
      const data = await Promise.all(
        (usersData || []).map(async (user: Record<string, unknown>) => {
          let person = null
          let roles: Record<string, unknown>[] = []

          if (user.person_id) {
            // Buscar person
            const { data: personData } = await supabase
              .from('people')
              .select('id, first_name, last_name, email, cpf')
              .eq('id', user.person_id)
              .single()
            
            person = personData || null

            // Buscar roles
            const { data: rolesData, error: rolesError } = await supabase
              .from('user_roles')
              .select(`
                role:roles(
                  id,
                  name,
                  description
                )
              `)
              .eq('person_id', user.person_id)
              .is('deleted_at', null)

            if (!rolesError && rolesData) {
              roles = rolesData.map((ur: Record<string, unknown>) => ur.role).filter(Boolean)
            }
          }

          return {
            ...user,
            person,
            roles
          }
        })
      )

      const error = null

      if (error) throw handleSupabaseError(error)

      // Transformar roles de array aninhado para array simples
      return (data || []).map((user: Record<string, unknown>) => ({
        ...user,
        roles: user.roles?.map((ur: Record<string, unknown>) => ur.role).filter(Boolean) || [],
      })) as AuthUserFullInfo[]
    } catch (error) {
      console.error('Error in AuthUserService.getAllWithFullInfo:', error)
      throw error
    }
  }

  /**
   * Buscar usuário por ID com informações completas
   */
  async getByIdWithFullInfo(id: string): Promise<AuthUserFullInfo | null> {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select(`
          *,
          person:people!auth_users_person_id_fkey(
            id,
            first_name,
            last_name,
            email,
            cpf
          ),
          roles:user_roles(
            role:roles(
              id,
              name,
              description
            )
          )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw handleSupabaseError(error)
      }

      if (!data) return null

      // Transformar roles
      return {
        ...data,
        roles: (data as Record<string, unknown>).roles?.map((ur: Record<string, unknown>) => ur.role).filter(Boolean) || [],
      } as AuthUserFullInfo
    } catch (error) {
      console.error('Error in AuthUserService.getByIdWithFullInfo:', error)
      throw error
    }
  }

  /**
   * Buscar usuário por email
   */
  async getByEmail(email: string): Promise<AuthUserRow | null> {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('email', email)
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw handleSupabaseError(error)
      }

      return data
    } catch (error) {
      console.error('Error in AuthUserService.getByEmail:', error)
      throw error
    }
  }

  /**
   * Buscar usuário por person_id
   */
  async getByPersonId(personId: number): Promise<AuthUserRow | null> {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('person_id', personId)
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw handleSupabaseError(error)
      }

      return data
    } catch (error) {
      console.error('Error in AuthUserService.getByPersonId:', error)
      throw error
    }
  }

  /**
   * Criar usuário de autenticação
   * 
   * Nota: O usuário deve ser criado primeiro no Supabase Auth,
   * depois este método cria o registro em auth_users
   */
  async createAuthUser(
    authUserId: string,
    email: string,
    personId: number,
    options?: {
      active?: boolean
    }
  ): Promise<AuthUserRow> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar person_id do usuário autenticado para created_by
      const { data: authUser } = await supabase
        .from('auth_users')
        .select('person_id')
        .eq('id', user.id)
        .is('deleted_at', null)
        .single()

      const { data, error } = await supabase
        .from('auth_users')
        .insert({
          id: authUserId,
          email,
          person_id: personId,
          active: options?.active ?? true,
          created_by: authUser?.person_id || null,
        })
        .select()
        .single()

      if (error) throw handleSupabaseError(error)
      return data
    } catch (error) {
      console.error('Error in AuthUserService.createAuthUser:', error)
      throw error
    }
  }

  /**
   * Atualizar usuário
   */
  async updateAuthUser(
    id: string,
    data: AuthUserUpdate
  ): Promise<AuthUserRow> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar person_id do usuário autenticado para updated_by
      const { data: authUser } = await supabase
        .from('auth_users')
        .select('person_id')
        .eq('id', user.id)
        .is('deleted_at', null)
        .single()

      const { data: updated, error } = await supabase
        .from('auth_users')
        .update({
          ...data,
          updated_by: authUser?.person_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw handleSupabaseError(error)
      return updated
    } catch (error) {
      console.error('Error in AuthUserService.updateAuthUser:', error)
      throw error
    }
  }

  /**
   * Ativar/Desativar usuário
   */
  async setActive(id: string, active: boolean): Promise<AuthUserRow> {
    return this.updateAuthUser(id, { active })
  }

  /**
   * Deletar usuário (soft delete)
   */
  async deleteAuthUser(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar person_id do usuário autenticado
      const { data: authUser } = await supabase
        .from('auth_users')
        .select('person_id')
        .eq('id', user.id)
        .is('deleted_at', null)
        .single()

      const { error } = await supabase
        .from('auth_users')
        .update({
          deleted_at: new Date().toISOString(),
          updated_by: authUser?.person_id || null,
        })
        .eq('id', id)

      if (error) throw handleSupabaseError(error)
    } catch (error) {
      console.error('Error in AuthUserService.deleteAuthUser:', error)
      throw error
    }
  }

  /**
   * Buscar usuários ativos
   */
  async getActiveUsers(): Promise<AuthUserFullInfo[]> {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select(`
          *,
          person:people!auth_users_person_id_fkey(
            id,
            first_name,
            last_name,
            email,
            cpf
          ),
          roles:user_roles(
            role:roles(
              id,
              name,
              description
            )
          )
        `)
        .eq('active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw handleSupabaseError(error)

      return (data || []).map((user: Record<string, unknown>) => ({
        ...user,
        roles: user.roles?.map((ur: Record<string, unknown>) => ur.role).filter(Boolean) || [],
      })) as AuthUserFullInfo[]
    } catch (error) {
      console.error('Error in AuthUserService.getActiveUsers:', error)
      throw error
    }
  }

  /**
   * Contar usuários ativos
   */
  async countActiveUsers(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('auth_users')
        .select('id', { count: 'exact', head: true })
        .eq('active', true)
        .is('deleted_at', null)

      if (error) throw handleSupabaseError(error)
      return count || 0
    } catch (error) {
      console.error('Error in AuthUserService.countActiveUsers:', error)
      throw error
    }
  }
}

export const authUserService = new AuthUserService()
export default authUserService

