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
      console.error('[signIn] Auth error:', authError)
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
      console.error('[signIn] User data error:', userError)
      return {
        success: false,
        user: authData.user,
        person_id: null,
        role: null,
        error: 'Erro ao carregar dados do usuário.',
      }
    }

    // Verificar se usuário está ativo
    if (!userData.active) {
      await supabase.auth.signOut()
      return {
        success: false,
        user: null,
        person_id: null,
        role: null,
        error: 'Usuário inativo. Entre em contato com o administrador.',
      }
    }

    // 3. Buscar role do usuário
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('person_id', userData.person_id)
      .limit(1)
      .single()

    if (roleError) {
      console.error('[signIn] Role error:', roleError)
    }

    const role = roleData?.role?.name || 'user'

    // 4. Atualizar last_login
    const { error: updateError } = await supabase
      .from('auth_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('[signIn] Update last_login error:', updateError)
    }

    return {
      success: true,
      user: authData.user,
      person_id: userData.person_id,
      role,
    }
  } catch (error) {
    console.error('[signIn] Unexpected error:', error)
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
      console.error('[signOut] Error:', error)
      return {
        success: false,
        error: 'Erro ao fazer logout.',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[signOut] Unexpected error:', error)
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
      console.error('[getCurrentUser] Error:', error)
      return { user, userData: null }
    }

    // Buscar role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('person_id', userData.person_id)
      .limit(1)
      .single()

    return {
      user,
      userData: {
        id: userData.id,
        email: userData.email,
        person_id: userData.person_id,
        role: roleData?.role?.name || 'user',
        active: userData.active,
        last_login: userData.last_login,
      },
    }
  } catch (error) {
    console.error('[getCurrentUser] Unexpected error:', error)
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
      console.error('[resetPassword] Error:', error)
      return {
        success: false,
        error: 'Erro ao solicitar redefinição de senha.',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[resetPassword] Unexpected error:', error)
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
      console.error('[updatePassword] Error:', error)
      return {
        success: false,
        error: 'Erro ao atualizar senha.',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[updatePassword] Unexpected error:', error)
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
  } catch (error) {
    console.error('[hasActiveSession] Error:', error)
    return false
  }
}

