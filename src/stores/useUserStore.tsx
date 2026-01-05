import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, initialUsers } from '@/lib/mock-data'
import { comparePassword, hashPassword, migratePasswordToHash } from '@/lib/auth-utils'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'
import { useAuth } from '@/hooks/useAuth'
import { authUserService, type AuthUserFullInfo } from '@/lib/supabase/services'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface UserContextType {
  users: User[]
  currentUser: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string }) => Promise<void>
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void
  migratePasswords: () => Promise<void>
}

const UserContext = createContext<UserContextType | null>(null)

// Componente interno para acessar useAuth
const UserProviderInternal = ({ children }: { children: React.ReactNode }) => {
  const { userData, user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Sincronizar currentUser com useAuth
  useEffect(() => {
    if (userData && user) {
      // Converter userData do Supabase para formato User (compatibilidade)
      const convertedUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.email.split('@')[0], // Fallback, idealmente buscar nome da pessoa
        role: userData.role as any,
        schoolId: null, // Será preenchido se necessário
        schoolIds: [],
        createdAt: new Date().toISOString(),
      }
      setCurrentUser(convertedUser)
    } else {
      setCurrentUser(null)
    }
  }, [userData, user])

  // Carregar usuários do Supabase
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const authUsers = await authUserService.getAllWithFullInfo()
        
        // Converter AuthUserFullInfo para User (compatibilidade)
        const convertedUsers: User[] = authUsers.map((au) => ({
          id: au.id,
          email: au.email,
          name: au.person 
            ? `${au.person.first_name} ${au.person.last_name}` 
            : au.email.split('@')[0],
          role: (au.roles?.[0]?.name || 'user') as any,
          schoolId: null, // Será preenchido se necessário
          schoolIds: [],
          createdAt: au.created_at,
        }))
        
        setUsers(convertedUsers)
      } catch {
        // Fallback para dados mock em caso de erro
        setUsers(initialUsers)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  // Não precisa mais de localStorage, dados vêm do Supabase

  // Login/Logout agora são gerenciados pelo useAuth
  // Mantendo funções para compatibilidade, mas delegando para useAuth
  const login = async (email: string, password: string): Promise<boolean> => {
    // Login é gerenciado pelo useAuth hook
    // Esta função é mantida apenas para compatibilidade
    // Em componentes novos, use useAuth().login diretamente
    // DEPRECATED: Use useAuth().login diretamente
    return false
  }

  const logout = () => {
    // Logout é gerenciado pelo useAuth hook
    // Esta função é mantida apenas para compatibilidade
    // DEPRECATED: Use useAuth().logout diretamente
  }

  const addUser = async (
    userData: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string },
  ): Promise<void> => {
    try {
      // Nota: Criação de usuários no Supabase Auth requer Edge Function ou Dashboard
      // Por enquanto, vamos usar signUp (que requer confirmação de email)
      // Para produção, criar uma Edge Function para criar usuários como admin
      
      // 1. Buscar person_id (assumindo que já existe uma pessoa com este email)
      const { data: person } = await supabase
        .from('people')
        .select('id')
        .eq('email', userData.email)
        .single()

      if (!person) {
        throw new Error('Pessoa não encontrada. Crie a pessoa primeiro.')
      }

      // 2. Criar usuário no Supabase Auth via signUp
      // Nota: Isso enviará um email de confirmação. Para produção, usar Edge Function
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            person_id: person.id,
          },
        },
      })

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Erro ao criar usuário no Supabase Auth')
      }

      // 3. Criar registro em auth_users (o trigger deve criar automaticamente, mas garantimos)
      try {
        await authUserService.createAuthUser(
          authData.user.id,
          userData.email,
          person.id,
          { active: true }
        )
      } catch {
        // Se já existir (criado pelo trigger), ignorar
      }

      // 4. Atribuir role se especificado
      if (userData.role) {
        const { data: role } = await supabase
          .from('roles')
          .select('id')
          .eq('name', userData.role)
          .single()

        if (role) {
          await supabase.from('user_roles').insert({
            person_id: person.id,
            role_id: role.id,
          })
        }
      }

      // Recarregar lista de usuários
      const authUsers = await authUserService.getAllWithFullInfo()
      const convertedUsers: User[] = authUsers.map((au) => ({
        id: au.id,
        email: au.email,
        name: au.person 
          ? `${au.person.first_name} ${au.person.last_name}` 
          : au.email.split('@')[0],
        role: (au.roles?.[0]?.name || 'user') as any,
        schoolId: null,
        schoolIds: [],
        createdAt: au.created_at,
      }))
      setUsers(convertedUsers)

      toast.success('Usuário criado com sucesso! Um email de confirmação foi enviado.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar usuário'
      handleError(error as Error, {
        context: { action: 'addUser', email: userData.email },
      })
      toast.error(errorMessage)
      throw error
    }
  }

  const updateUser = async (id: string, data: Partial<User>) => {
    try {
      // Se estiver atualizando a senha, usar updateUser do Supabase Auth
      // Nota: Isso só funciona para o usuário atual. Para atualizar senha de outros usuários,
      // seria necessário uma Edge Function ou usar service_role key (não recomendado no frontend)
      if ('password' in data && data.password) {
        // Verificar se é o próprio usuário
        const { data: { user: currentAuthUser } } = await supabase.auth.getUser()
        if (currentAuthUser?.id === id) {
          const { error: updateError } = await supabase.auth.updateUser({
            password: data.password,
          })
          if (updateError) throw updateError
        } else {
          // Para outros usuários, seria necessário Edge Function
          toast.warning('Atualização de senha de outros usuários requer configuração adicional.')
        }
      }

      // Atualizar dados em auth_users
      const updateData: any = {}
      if (data.email) updateData.email = data.email
      if (data.role) {
        // Atualizar role em user_roles
        const { data: person } = await supabase
          .from('auth_users')
          .select('person_id')
          .eq('id', id)
          .single()

        if (person) {
          // Remover roles antigas
          await supabase
            .from('user_roles')
            .delete()
            .eq('person_id', person.person_id)

          // Adicionar nova role
          const { data: role } = await supabase
            .from('roles')
            .select('id')
            .eq('name', data.role)
            .single()

          if (role) {
            await supabase.from('user_roles').insert({
              person_id: person.person_id,
              role_id: role.id,
            })
          }
        }
      }

      if (Object.keys(updateData).length > 0) {
        await authUserService.updateAuthUser(id, updateData)
      }

      // Recarregar lista
      const authUsers = await authUserService.getAllWithFullInfo()
      const convertedUsers: User[] = authUsers.map((au) => ({
        id: au.id,
        email: au.email,
        name: au.person 
          ? `${au.person.first_name} ${au.person.last_name}` 
          : au.email.split('@')[0],
        role: (au.roles?.[0]?.name || 'user') as any,
        schoolId: null,
        schoolIds: [],
        createdAt: au.created_at,
      }))
      setUsers(convertedUsers)

      toast.success('Usuário atualizado com sucesso!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar usuário'
      handleError(error as Error, {
        context: { action: 'updateUser', userId: id },
      })
      toast.error(errorMessage)
      throw error
    }
  }

  const migratePasswords = async (): Promise<void> => {
    // Migração de senhas não é mais necessária com Supabase Auth
    // Senhas são gerenciadas pelo Supabase Auth
    // DEPRECATED: Não é mais necessário com Supabase Auth
  }

  const deleteUser = async (id: string) => {
    try {
      await authUserService.deleteAuthUser(id)
      
      // Recarregar lista
      const authUsers = await authUserService.getAllWithFullInfo()
      const convertedUsers: User[] = authUsers.map((au) => ({
        id: au.id,
        email: au.email,
        name: au.person 
          ? `${au.person.first_name} ${au.person.last_name}` 
          : au.email.split('@')[0],
        role: (au.roles?.[0]?.name || 'user') as any,
        schoolId: null,
        schoolIds: [],
        createdAt: au.created_at,
      }))
      setUsers(convertedUsers)

      toast.success('Usuário excluído com sucesso!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir usuário'
      handleError(error as Error, {
        context: { action: 'deleteUser', userId: id },
      })
      toast.error(errorMessage)
      throw error
    }
  }

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        migratePasswords,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// Wrapper para usar useAuth dentro do Provider
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  return <UserProviderInternal>{children}</UserProviderInternal>
}

export default function useUserStore() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserStore must be used within a UserProvider')
  }
  return context
}
