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

