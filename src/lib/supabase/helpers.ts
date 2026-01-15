import { supabase } from './client'
import { PostgrestError } from '@supabase/supabase-js'

/**
 * Verifica se o Supabase está configurado corretamente
 */
export function isSupabaseConfigured(): boolean {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  return !!(supabaseUrl && supabaseAnonKey)
}

/**
 * Testa a conexão com o Supabase
 */
export async function checkConnection(): Promise<{
  success: boolean
  message: string
  details?: Record<string, unknown> | PostgrestError | Error
}> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase não está configurado. Verifique as variáveis de ambiente.',
      }
    }

    // Tenta fazer uma query simples para verificar a conexão
    const { data, error } = await supabase.from('_health_check').select('*').limit(1)

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = tabela não encontrada, mas conexão OK
      return {
        success: false,
        message: 'Erro ao conectar com Supabase',
        details: error,
      }
    }

    return {
      success: true,
      message: 'Conexão com Supabase estabelecida com sucesso!',
      details: {
        url: import.meta.env.VITE_SUPABASE_URL,
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      success: false,
      message: 'Erro inesperado ao conectar com Supabase',
      details: error,
    }
  }
}

/**
 * Trata erros do Supabase de forma padronizada
 */
export function handleSupabaseError(
  error: PostgrestError | Error | null,
): string {
  if (!error) {
    return 'Erro desconhecido'
  }

  if ('code' in error && 'message' in error) {
    // Erro do PostgrestError
    const pgError = error as PostgrestError

    switch (pgError.code) {
      case '23505':
        return 'Este registro já existe no banco de dados'
      case '23503':
        return 'Não é possível excluir este registro pois ele está sendo usado'
      case '42501':
        return 'Você não tem permissão para realizar esta operação'
      case 'PGRST116':
        return 'Tabela não encontrada'
      case 'PGRST301':
        return 'Formato de requisição inválido'
      default:
        return pgError.message || 'Erro ao processar requisição'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Erro desconhecido ao processar requisição'
}

/**
 * Formata mensagens de sucesso do Supabase
 */
export function formatSuccessMessage(operation: string, itemName?: string): string {
  const item = itemName ? ` ${itemName}` : ''

  switch (operation) {
    case 'create':
      return `${item} criado com sucesso!`
    case 'update':
      return `${item} atualizado com sucesso!`
    case 'delete':
      return `${item} excluído com sucesso!`
    case 'fetch':
      return `${item} carregado com sucesso!`
    default:
      return 'Operação realizada com sucesso!'
  }
}

/**
 * Obtém o person_id do usuário autenticado para uso em created_by/updated_by
 * @returns person_id do usuário ou 1 (sistema) como fallback
 */
export async function getCurrentPersonId(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      return 1 // Sistema
    }

    const { data: authUser } = await supabase
      .from('auth_users')
      .select('person_id')
      .eq('id', user.id)
      .single()

    return authUser?.person_id || 1
  } catch {
    return 1 // Sistema como fallback em caso de erro
  }
}

/**
 * Cache para person_id do usuário atual (evita queries repetidas)
 */
let cachedPersonId: number | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Versão com cache do getCurrentPersonId
 * Evita múltiplas queries para o mesmo usuário
 */
export async function getCachedPersonId(): Promise<number> {
  const now = Date.now()

  if (cachedPersonId !== null && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedPersonId
  }

  cachedPersonId = await getCurrentPersonId()
  cacheTimestamp = now

  return cachedPersonId
}

/**
 * Limpa o cache de person_id (útil após logout)
 */
export function clearPersonIdCache(): void {
  cachedPersonId = null
  cacheTimestamp = 0
}

