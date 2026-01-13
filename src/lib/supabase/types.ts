import { PostgrestError } from '@supabase/supabase-js'

/**
 * Tipos para respostas da API do Supabase
 */
export interface SupabaseResponse<T> {
  data: T | null
  error: PostgrestError | null
}

/**
 * Tipos para respostas paginadas
 */
export interface PaginatedResponse<T> {
  data: T[]
  count: number | null
  error: PostgrestError | null
}

/**
 * Tipos para status de operações
 */
export type OperationStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * Tipo para resultado de operação
 */
export interface OperationResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Tipo para filtros de query
 */
export interface QueryFilter {
  column: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in'
  value: string | number | boolean | string[] | number[] | null
}

/**
 * Tipo para ordenação
 */
export interface QueryOrder {
  column: string
  ascending?: boolean
}

/**
 * Tipo para paginação
 */
export interface QueryPagination {
  from: number
  to: number
}

/**
 * Configuração de query completa
 */
export interface QueryConfig {
  filters?: QueryFilter[]
  order?: QueryOrder
  pagination?: QueryPagination
}

/**
 * Tipo para erros customizados do Supabase
 */
export interface SupabaseCustomError {
  code: string
  message: string
  details?: Record<string, unknown>
  hint?: string
}

/**
 * Tipo para metadata de tabelas
 */
export interface TableMetadata {
  tableName: string
  rowCount?: number
  lastUpdated?: string
}

/**
 * Tipo para status de conexão
 */
export interface ConnectionStatus {
  isConnected: boolean
  lastChecked: Date
  error?: string
}

// Placeholder para tipos gerados do banco de dados
// Este arquivo será substituído após rodar: npx supabase gen types typescript
export type Database = {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updateable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

