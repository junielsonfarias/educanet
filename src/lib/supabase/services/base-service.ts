/**
 * BaseService - Serviço genérico para operações CRUD
 * 
 * Todos os services específicos devem herdar desta classe para
 * ter acesso aos métodos básicos de CRUD.
 */

import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import type { PostgrestError } from '@supabase/supabase-js';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SortParams {
  column: string;
  ascending?: boolean;
}

export interface FilterParams {
  [key: string]: string | number | boolean | null | undefined;
}

export interface QueryResult<T> {
  data: T[];
  count?: number;
  error?: PostgrestError | null;
}

export class BaseService<T = Record<string, unknown>> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Buscar todos os registros (não deletados)
   */
  async getAll(options?: {
    pagination?: PaginationParams;
    sort?: SortParams;
    filters?: FilterParams;
  }): Promise<T[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .is('deleted_at', null);

      // Aplicar filtros
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Aplicar ordenação
      if (options?.sort) {
        query = query.order(options.sort.column, {
          ascending: options.sort.ascending ?? true
        });
      }

      // Aplicar paginação
      if (options?.pagination) {
        const { page = 1, pageSize = 50 } = options.pagination;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);
      return (data as T[]) || [];
    } catch (error) {
      console.error(`Error in ${this.tableName}.getAll:`, error);
      throw error;
    }
  }

  /**
   * Buscar registro por ID
   */
  async getById(id: number | string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Registro não encontrado
          return null;
        }
        throw handleSupabaseError(error);
      }

      return data as T;
    } catch (error) {
      console.error(`Error in ${this.tableName}.getById:`, error);
      throw error;
    }
  }

  /**
   * Criar novo registro
   * Nota: created_by usa 1 (Sistema) pois o UUID do Supabase Auth não é compatível com INTEGER
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const insertData = {
        ...data,
        created_by: 1, // Sistema (ID 1) - UUID do Auth não é compatível com INTEGER
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return result as T;
    } catch (error) {
      console.error(`Error in ${this.tableName}.create:`, error);
      throw error;
    }
  }

  /**
   * Atualizar registro existente
   * Nota: updated_by usa 1 (Sistema) pois o UUID do Supabase Auth não é compatível com INTEGER
   */
  async update(id: number | string, data: Partial<T>): Promise<T> {
    try {
      const updateData = {
        ...data,
        updated_by: 1, // Sistema (ID 1) - UUID do Auth não é compatível com INTEGER
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return result as T;
    } catch (error) {
      console.error(`Error in ${this.tableName}.update:`, error);
      throw error;
    }
  }

  /**
   * Deletar registro (soft delete)
   * Nota: updated_by usa 1 (Sistema) pois o UUID do Supabase Auth não é compatível com INTEGER
   */
  async delete(id: number | string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          deleted_at: new Date().toISOString(),
          updated_by: 1, // Sistema (ID 1) - UUID do Auth não é compatível com INTEGER
        })
        .eq('id', id);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error(`Error in ${this.tableName}.delete:`, error);
      throw error;
    }
  }

  /**
   * Deletar registro permanentemente (hard delete)
   * Use com MUITO CUIDADO!
   */
  async hardDelete(id: number | string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error(`Error in ${this.tableName}.hardDelete:`, error);
      throw error;
    }
  }

  /**
   * Contar registros com filtros opcionais
   */
  async count(filters?: FilterParams): Promise<number> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) throw handleSupabaseError(error);
      return count || 0;
    } catch (error) {
      console.error(`Error in ${this.tableName}.count:`, error);
      throw error;
    }
  }

  /**
   * Buscar com query personalizada
   */
  async query(
    select: string,
    filters?: FilterParams,
    options?: {
      pagination?: PaginationParams;
      sort?: SortParams;
    }
  ): Promise<Record<string, unknown>[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(select)
        .is('deleted_at', null);

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      if (options?.sort) {
        query = query.order(options.sort.column, {
          ascending: options.sort.ascending ?? true
        });
      }

      if (options?.pagination) {
        const { page = 1, pageSize = 50 } = options.pagination;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error(`Error in ${this.tableName}.query:`, error);
      throw error;
    }
  }

  /**
   * Verificar se registro existe
   */
  async exists(id: number | string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);
      return (count || 0) > 0;
    } catch (error) {
      console.error(`Error in ${this.tableName}.exists:`, error);
      return false;
    }
  }

  /**
   * Buscar com paginação e contagem total
   */
  async getPaginated(
    options?: {
      pagination?: PaginationParams;
      sort?: SortParams;
      filters?: FilterParams;
    }
  ): Promise<{ data: T[]; total: number }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .is('deleted_at', null);

      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      if (options?.sort) {
        query = query.order(options.sort.column, {
          ascending: options.sort.ascending ?? true
        });
      }

      if (options?.pagination) {
        const { page = 1, pageSize = 50 } = options.pagination;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, count, error } = await query;

      if (error) throw handleSupabaseError(error);

      return {
        data: (data as T[]) || [],
        total: count || 0
      };
    } catch (error) {
      console.error(`Error in ${this.tableName}.getPaginated:`, error);
      throw error;
    }
  }
}

