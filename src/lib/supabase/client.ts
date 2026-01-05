import { createClient } from '@supabase/supabase-js'
import { logSupabaseEnv } from './check-env'

// Logar informações sobre as variáveis de ambiente (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  logSupabaseEnv()
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Verificação básica - apenas warning, não bloqueia o app
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas. Algumas funcionalidades podem não funcionar.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

