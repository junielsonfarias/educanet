import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { signIn as authSignIn, signOut as authSignOut, getCurrentUser } from '@/lib/supabase/auth'
import type { User } from '@supabase/supabase-js'
import { toast } from 'sonner'

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
    } catch {
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
        toast.error(response.error || 'Credenciais inválidas.')
        setAuthState(prev => ({ ...prev, loading: false }))
        return { success: false, error: response.error }
      }

      // Se o login foi bem-sucedido, atualizar estado diretamente com os dados retornados
      if (response.user && response.person_id) {
        const userData: UserData = {
          id: response.user.id,
          email: response.user.email || email,
          person_id: response.person_id,
          role: response.role || 'user',
          active: true,
          last_login: new Date().toISOString(),
        }

        setAuthState({
          user: response.user,
          userData,
          loading: false,
          isAuthenticated: true,
        })

        toast.success('Login realizado com sucesso!')
        return { success: true }
      } else {
        // Se não tiver dados completos, tentar carregar
        try {
          await loadUser()
          toast.success('Login realizado com sucesso!')
          return { success: true }
        } catch {
          toast.error('Login realizado, mas houve erro ao carregar dados do usuário.')
          setAuthState(prev => ({ ...prev, loading: false }))
          return { success: false, error: 'Erro ao carregar dados do usuário' }
        }
      }
    } catch {
      toast.error('Erro inesperado ao fazer login. Tente novamente.')
      setAuthState(prev => ({ ...prev, loading: false }))
      return { success: false, error: 'Erro inesperado' }
    }
  }, [loadUser])

  /**
   * Realiza logout
   */
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      const response = await authSignOut()
      
      if (!response.success) {
        toast.error(response.error || 'Erro ao fazer logout. Tente novamente.')
        setAuthState(prev => ({ ...prev, loading: false }))
        return { success: false }
      }

      setAuthState({
        user: null,
        userData: null,
        loading: false,
        isAuthenticated: false,
      })

      toast.success('Logout realizado com sucesso!')

      return { success: true }
    } catch {
      toast.error('Erro inesperado ao fazer logout. Tente novamente.')
      setAuthState(prev => ({ ...prev, loading: false }))
      return { success: false }
    }
  }, [])

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

  // Efeito para carregar usuário na montagem (apenas uma vez)
  useEffect(() => {
    let mounted = true
    
    const initLoad = async () => {
      try {
        const { user, userData } = await getCurrentUser()
        if (mounted) {
          setAuthState({
            user,
            userData,
            loading: false,
            isAuthenticated: !!user,
          })
        }
      } catch {
        if (mounted) {
          setAuthState({
            user: null,
            userData: null,
            loading: false,
            isAuthenticated: false,
          })
        }
      }
    }
    
    initLoad()
    
    return () => {
      mounted = false
    }
  }, [])

  // Efeito para listener de mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Evitar atualizar estado se já estiver carregando (evita loops)
      if (authState.loading && event === 'SIGNED_IN') {
        return
      }
      
      if (event === 'SIGNED_IN' && session) {
        try {
          const { user, userData } = await getCurrentUser()
          // Só atualizar se realmente mudou
          if (user && (!authState.user || user.id !== authState.user.id)) {
            setAuthState({
              user,
              userData,
              loading: false,
              isAuthenticated: !!user,
            })
          }
        } catch {
          // Não resetar loading aqui para não interferir com o login
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          userData: null,
          loading: false,
          isAuthenticated: false,
        })
      } else if (event === 'TOKEN_REFRESHED' && session) {
        try {
          const { user, userData } = await getCurrentUser()
          setAuthState(prev => ({
            user,
            userData,
            loading: prev.loading,
            isAuthenticated: !!user,
          }))
        } catch {
          // Token refresh error silently handled
        }
      } else if (event === 'USER_UPDATED' && session) {
        try {
          const { user, userData } = await getCurrentUser()
          setAuthState(prev => ({
            user,
            userData,
            loading: prev.loading,
            isAuthenticated: !!user,
          }))
        } catch {
          // User update error silently handled
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [authState.loading, authState.user])

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

