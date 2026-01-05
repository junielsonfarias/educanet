import { createClient } from '@supabase/supabase-js'
import { logSupabaseEnv, checkSupabaseEnv } from './check-env'

// Logar informações sobre as variáveis de ambiente (apenas em desenvolvimento)
logSupabaseEnv()

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificação detalhada
const envCheck = checkSupabaseEnv()

if (!envCheck.isConfigured) {
  const errorMessage = `
    ⚠️ ERRO: Variáveis de ambiente do Supabase não configuradas corretamente!
    
    ${envCheck.errors.map(e => `- ${e}`).join('\n    ')}
    
    📝 Para corrigir:
    1. Crie um arquivo .env.local na raiz do projeto (ao lado de package.json)
    2. Adicione as seguintes linhas:
    
       VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
       VITE_SUPABASE_ANON_KEY=sua-chave-anon-public-aqui
    
    3. Substitua pelos valores reais do seu projeto Supabase
    4. Reinicie o servidor de desenvolvimento (Ctrl+C e depois pnpm dev)
    
    📖 Veja CONFIGURAR_VARIAVEIS_AMBIENTE.md para mais detalhes.
    
    Variáveis encontradas:
    - VITE_SUPABASE_URL: ${supabaseUrl ? `✅ ${supabaseUrl.substring(0, 30)}...` : '❌ Não configurado'}
    - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Configurado (oculto)' : '❌ Não configurado'}
  `
  console.error(errorMessage)
  throw new Error('Missing Supabase environment variables. See CONFIGURAR_VARIAVEIS_AMBIENTE.md')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

