import { supabase } from './client'
import { handleSupabaseError } from './helpers'
import type { User } from '@supabase/supabase-js'

interface SignInResponse {
  success: boolean
  user: User | null
  person_id: number | null
  role: string | null
  error?: string
}

interface UserData {
  id: string
  email: string
  person_id: number
  role: string
  active: boolean
  last_login: string
}

/**
 * Realiza login no sistema
 * @param email - Email do usuário
 * @param password - Senha do usuário
 * @returns Objeto com dados do usuário ou erro
 */
export async function signIn(email: string, password: string): Promise<SignInResponse> {
  try {
    // 1. Autenticar com Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return {
        success: false,
        user: null,
        person_id: null,
        role: null,
        error: 'Credenciais inválidas. Verifique seu email e senha.',
      }
    }

    if (!authData.user) {
      return {
        success: false,
        user: null,
        person_id: null,
        role: null,
        error: 'Erro ao autenticar usuário.',
      }
    }

    // 2. Buscar dados do usuário na tabela auth_users
    const { data: userData, error: userError } = await supabase
      .from('auth_users')
      .select('*, person:people!person_id(id, type, first_name, last_name)')
      .eq('id', authData.user.id)
      .single()

    if (userError) {
      // Se o registro não existe (PGRST116 = not found, PGRST301 = no rows returned)
      if (userError.code === 'PGRST116' || userError.code === 'PGRST301') {
        return {
          success: false,
          user: authData.user,
          person_id: null,
          role: null,
          error: 'Usuário não encontrado no sistema. Execute o script SQL de diagnóstico no Supabase para corrigir.',
        }
      }
      
      // Se for erro de RLS (permissão)
      if (userError.code === '42501' || userError.message?.includes('permission denied')) {
        return {
          success: false,
          user: authData.user,
          person_id: null,
          role: null,
          error: 'Erro de permissão ao acessar dados do usuário. Verifique as políticas RLS.',
        }
      }
      
      return {
        success: false,
        user: authData.user,
        person_id: null,
        role: null,
        error: `Erro ao carregar dados do usuário: ${userError.message} (Código: ${userError.code})`,
      }
    }

    // Verificar se usuário está ativo
    if (!userData || !userData.active) {
      await supabase.auth.signOut()
      return {
        success: false,
        user: null,
        person_id: null,
        role: null,
        error: 'Usuário inativo ou não encontrado. Entre em contato com o administrador.',
      }
    }
    
    // Verificar se person_id está vinculado
    if (!userData.person_id) {
      await supabase.auth.signOut()
      return {
        success: false,
        user: null,
        person_id: null,
        role: null,
        error: 'Usuário não vinculado a uma pessoa. Entre em contato com o administrador.',
      }
    }

    // 3. Buscar role do usuário
    let role: string | null = null
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('person_id', userData.person_id)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle()

      role = roleData?.role?.name || null

      // Se não tiver role, ainda permite login mas com role padrão
      if (!role || roleError) {
        role = 'user' // Role padrão
      }
    } catch {
      role = 'user' // Role padrão em caso de erro
    }

    // 4. Atualizar last_login
    const { error: updateError } = await supabase
      .from('auth_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id)

    // Ignora erro de atualização do last_login (não é crítico)
    void updateError

    return {
      success: true,
      user: authData.user,
      person_id: userData.person_id,
      role,
    }
  } catch {
    return {
      success: false,
      user: null,
      person_id: null,
      role: null,
      error: 'Erro inesperado ao fazer login. Tente novamente.',
    }
  }
}

/**
 * Realiza logout do sistema
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: 'Erro ao fazer logout.',
      }
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Erro inesperado ao fazer logout.',
    }
  }
}

/**
 * Retorna o usuário atualmente autenticado
 */
export async function getCurrentUser(): Promise<{
  user: User | null
  userData: UserData | null
}> {
  try {
    // Obter usuário da sessão
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { user: null, userData: null }
    }

    // Buscar dados completos do usuário
    const { data: userData, error } = await supabase
      .from('auth_users')
      .select('*, person:people!person_id(id, type, first_name, last_name)')
      .eq('id', user.id)
      .single()

    if (error) {
      return { user, userData: null }
    }

    // Buscar role
    let role = 'user' // Role padrão
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('person_id', userData.person_id)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle()

      if (roleData?.role?.name) {
        role = roleData.role.name
      }
    } catch {
      // Usar role padrão em caso de erro
    }

    return {
      user,
      userData: {
        id: userData.id,
        email: userData.email,
        person_id: userData.person_id,
        role,
        active: userData.active,
        last_login: userData.last_login,
      },
    }
  } catch {
    return { user: null, userData: null }
  }
}

/**
 * Solicita redefinição de senha
 * @param email - Email do usuário
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: 'Erro ao solicitar redefinição de senha.',
      }
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Erro inesperado ao solicitar redefinição de senha.',
    }
  }
}

/**
 * Atualiza a senha do usuário
 * @param newPassword - Nova senha
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        success: false,
        error: 'Erro ao atualizar senha.',
      }
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Erro inesperado ao atualizar senha.',
    }
  }
}

/**
 * Verifica se há uma sessão ativa
 */
export async function hasActiveSession(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch {
    return false
  }
}

