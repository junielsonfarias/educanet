import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { signIn as authSignIn, signOut as authSignOut, getCurrentUser } from '@/lib/supabase/auth'
import type { User } from '@supabase/supabase-js'
import { useToast } from '@/components/ui/use-toast'

interface UserData {
  id: string
  email: string
  person_id: number
  role: string
  active: boolean
  last_login: string
}

interface AuthState {
  user: User | null
  userData: UserData | null
  loading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userData: null,
    loading: true,
    isAuthenticated: false,
  })
  const { toast } = useToast()

  /**
   * Carrega os dados do usuário autenticado
   */
  const loadUser = useCallback(async () => {
    try {
      const { user, userData } = await getCurrentUser()
      setAuthState({
        user,
        userData,
        loading: false,
        isAuthenticated: !!user,
      })
    } catch (error) {
      console.error('[useAuth] Load user error:', error)
      setAuthState({
        user: null,
        userData: null,
        loading: false,
        isAuthenticated: false,
      })
    }
  }, [])

  /**
   * Realiza login
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      const response = await authSignIn(email, password)
      
      if (!response.success) {
        toast({
          title: 'Erro ao fazer login',
          description: response.error || 'Credenciais inválidas.',
          variant: 'destructive',
        })
        setAuthState(prev => ({ ...prev, loading: false }))
        return { success: false, error: response.error }
      }

      // Recarregar dados do usuário
      await loadUser()
      
      toast({
        title: 'Login realizado',
        description: 'Bem-vindo ao EduGestão Municipal!',
        variant: 'default',
      })

      return { success: true }
    } catch (error) {
      console.error('[useAuth] Login error:', error)
      toast({
        title: 'Erro ao fazer login',
        description: 'Erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
      setAuthState(prev => ({ ...prev, loading: false }))
      return { success: false, error: 'Erro inesperado' }
    }
  }, [loadUser, toast])

  /**
   * Realiza logout
   */
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      const response = await authSignOut()
      
      if (!response.success) {
        toast({
          title: 'Erro ao fazer logout',
          description: response.error || 'Tente novamente.',
          variant: 'destructive',
        })
        setAuthState(prev => ({ ...prev, loading: false }))
        return { success: false }
      }

      setAuthState({
        user: null,
        userData: null,
        loading: false,
        isAuthenticated: false,
      })

      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
        variant: 'default',
      })

      return { success: true }
    } catch (error) {
      console.error('[useAuth] Logout error:', error)
      toast({
        title: 'Erro ao fazer logout',
        description: 'Erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
      setAuthState(prev => ({ ...prev, loading: false }))
      return { success: false }
    }
  }, [toast])

  /**
   * Verifica se o usuário está autenticado
   */
  const isAuthenticated = useCallback(() => {
    return authState.isAuthenticated
  }, [authState.isAuthenticated])

  /**
   * Verifica se o usuário tem uma role específica
   */
  const hasRole = useCallback((role: string) => {
    return authState.userData?.role === role
  }, [authState.userData])

  /**
   * Verifica se o usuário tem uma das roles especificadas
   */
  const hasAnyRole = useCallback((roles: string[]) => {
    return roles.includes(authState.userData?.role || '')
  }, [authState.userData])

  // Efeito para carregar usuário na montagem
  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Efeito para listener de mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth state changed:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session) {
        await loadUser()
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          userData: null,
          loading: false,
          isAuthenticated: false,
        })
      } else if (event === 'TOKEN_REFRESHED') {
        await loadUser()
      } else if (event === 'USER_UPDATED') {
        await loadUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUser])

  return {
    user: authState.user,
    userData: authState.userData,
    loading: authState.loading,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
    reload: loadUser,
  }
}

