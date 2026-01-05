/**
 * Utilitário para verificar se as variáveis de ambiente do Supabase estão configuradas
 */

export function checkSupabaseEnv(): {
  url: string | undefined
  key: string | undefined
  isConfigured: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  if (!url) {
    errors.push('VITE_SUPABASE_URL não está definida')
  } else if (!url.startsWith('http')) {
    errors.push('VITE_SUPABASE_URL deve começar com http:// ou https://')
  }
  
  if (!key) {
    errors.push('VITE_SUPABASE_ANON_KEY não está definida')
  } else if (key.length < 30) {
    errors.push('VITE_SUPABASE_ANON_KEY parece estar incompleta (muito curta)')
  }
  
  return {
    url,
    key: key ? `${key.substring(0, 20)}...` : undefined, // Mostra apenas os primeiros 20 caracteres
    isConfigured: errors.length === 0,
    errors,
  }
}

/**
 * Loga informações sobre as variáveis de ambiente (apenas em desenvolvimento)
 */
export function logSupabaseEnv(): void {
  if (import.meta.env.DEV) {
    const check = checkSupabaseEnv()
    console.group('🔍 Verificação de Variáveis de Ambiente Supabase')
    console.log('URL:', check.url || '❌ Não configurado')
    console.log('Key:', check.key || '❌ Não configurado')
    console.log('Configurado:', check.isConfigured ? '✅ Sim' : '❌ Não')
    if (check.errors.length > 0) {
      console.error('Erros:', check.errors)
      console.error('\n📝 Para corrigir:')
      console.error('1. Crie um arquivo .env.local na raiz do projeto')
      console.error('2. Adicione as seguintes linhas:')
      console.error('   VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co')
      console.error('   VITE_SUPABASE_ANON_KEY=sua-chave-anon-public-aqui')
      console.error('3. Reinicie o servidor de desenvolvimento')
      console.error('\n📖 Veja CONFIGURAR_VARIAVEIS_AMBIENTE.md para mais detalhes')
    }
    console.groupEnd()
  }
}

