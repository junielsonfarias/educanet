/**
 * User Store - Zustand + Supabase
 * 
 * Store para gerenciar Usuários de Autenticação integrado com Supabase
 * 
 * Features:
 * - CRUD completo de usuários de autenticação
 * - Consulta por email, person_id
 * - Gerenciamento de status (ativo/inativo)
 * - Integração com Supabase Auth
 * 
 * Nota: A autenticação (login/logout) é gerenciada pelo hook useAuth.
 * Este store foca no gerenciamento de usuários (CRUD).
 */

import { create } from 'zustand'
import { authUserService, type AuthUserFullInfo } from '@/lib/supabase/services'
import { Database } from '@/lib/supabase/database.types'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

type AuthUserRow = Database['public']['Tables']['auth_users']['Row']
type AuthUserInsert = Database['public']['Tables']['auth_users']['Insert']
type AuthUserUpdate = Database['public']['Tables']['auth_users']['Update']

interface UserState {
  // State
  users: AuthUserFullInfo[]
  selectedUser: AuthUserFullInfo | null
  loading: boolean
  error: string | null

  // Actions - CRUD
  fetchUsers: () => Promise<void>
  fetchActiveUsers: () => Promise<void>
  fetchUserById: (id: string) => Promise<void>
  fetchUserByEmail: (email: string) => Promise<void>
  fetchUserByPersonId: (personId: number) => Promise<void>
  createUser: (
    authUserId: string,
    email: string,
    personId: number,
    options?: { active?: boolean }
  ) => Promise<AuthUserRow | null>
  updateUser: (id: string, data: AuthUserUpdate) => Promise<AuthUserRow | null>
  deleteUser: (id: string) => Promise<boolean>
  setUserActive: (id: string, active: boolean) => Promise<boolean>
  countActiveUsers: () => Promise<number>

  // Actions - Utils
  setSelectedUser: (user: AuthUserFullInfo | null) => void
  clearError: () => void
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial State
  users: [],
  selectedUser: null,
  loading: false,
  error: null,

  // Fetch all users
  fetchUsers: async () => {
    set({ loading: true, error: null })
    try {
      const users = await authUserService.getAllWithFullInfo()
      set({ users, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar usuários'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch active users only
  fetchActiveUsers: async () => {
    set({ loading: true, error: null })
    try {
      const users = await authUserService.getActiveUsers()
      set({ users, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar usuários ativos'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch user by ID
  fetchUserById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const user = await authUserService.getByIdWithFullInfo(id)
      if (user) {
        set({ selectedUser: user, loading: false })
        // Atualizar na lista se já existir
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? user : u)),
        }))
      } else {
        set({ selectedUser: null, loading: false })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar usuário'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch user by email
  fetchUserByEmail: async (email: string) => {
    set({ loading: true, error: null })
    try {
      const user = await authUserService.getByEmail(email)
      if (user) {
        const fullInfo = await authUserService.getByIdWithFullInfo(user.id)
        set({ selectedUser: fullInfo, loading: false })
      } else {
        set({ selectedUser: null, loading: false })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar usuário'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch user by person_id
  fetchUserByPersonId: async (personId: number) => {
    set({ loading: true, error: null })
    try {
      const user = await authUserService.getByPersonId(personId)
      if (user) {
        const fullInfo = await authUserService.getByIdWithFullInfo(user.id)
        set({ selectedUser: fullInfo, loading: false })
      } else {
        set({ selectedUser: null, loading: false })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar usuário'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Create user
  createUser: async (
    authUserId: string,
    email: string,
    personId: number,
    options?: { active?: boolean }
  ) => {
    set({ loading: true, error: null })
    try {
      const user = await authUserService.createAuthUser(authUserId, email, personId, options)
      
      // Recarregar lista
      await get().fetchUsers()
      
      set({ loading: false })
      toast.success('Usuário criado com sucesso!')
      return user
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar usuário'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return null
    }
  },

  // Update user
  updateUser: async (id: string, data: AuthUserUpdate) => {
    set({ loading: true, error: null })
    try {
      const updated = await authUserService.updateAuthUser(id, data)
      
      // Atualizar na lista
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, ...updated } : u)),
        selectedUser: state.selectedUser?.id === id ? { ...state.selectedUser, ...updated } : state.selectedUser,
      }))
      
      set({ loading: false })
      toast.success('Usuário atualizado com sucesso!')
      return updated
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar usuário'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return null
    }
  },

  // Delete user (soft delete)
  deleteUser: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await authUserService.deleteAuthUser(id)
      
      // Remover da lista
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
      }))
      
      set({ loading: false })
      toast.success('Usuário excluído com sucesso!')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir usuário'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return false
    }
  },

  // Set user active/inactive
  setUserActive: async (id: string, active: boolean) => {
    set({ loading: true, error: null })
    try {
      await authUserService.setActive(id, active)
      
      // Atualizar na lista
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, active } : u)),
        selectedUser: state.selectedUser?.id === id ? { ...state.selectedUser, active } : state.selectedUser,
      }))
      
      set({ loading: false })
      toast.success(`Usuário ${active ? 'ativado' : 'desativado'} com sucesso!`)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar status do usuário'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return false
    }
  },

  // Count active users
  countActiveUsers: async () => {
    try {
      return await authUserService.countActiveUsers()
    } catch (error) {
      console.error('Error counting active users:', error)
      return 0
    }
  },

  // Utils
  setSelectedUser: (user: AuthUserFullInfo | null) => {
    set({ selectedUser: user })
  },

  clearError: () => {
    set({ error: null })
  },
}))

// Export default para compatibilidade
export default useUserStore

