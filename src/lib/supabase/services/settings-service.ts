/**
 * SettingsService - Serviço para gerenciamento de configurações do sistema
 * 
 * Gerencia as configurações globais armazenadas na tabela system_settings.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

export interface SettingsData {
  key: string;
  value: string | number | boolean | Record<string, unknown> | null;
  category?: string;
  description?: string;
}

export type SettingValue = string | number | boolean | Record<string, unknown> | null;

class SettingsService extends BaseService {
  constructor() {
    super('system_settings');
  }

  /**
   * Buscar configuração por chave
   * NOTA: A coluna "key" é palavra reservada no PostgreSQL
   */
  async getByKey(keyName: string): Promise<Record<string, unknown> | null> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('id, key, value, category, description, created_at, updated_at')
        .eq('key', keyName)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        // PGRST116 = no rows returned (não é erro)
        if (error.code === 'PGRST116') return null;
        console.warn('Error fetching setting by key:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in SettingsService.getByKey:', error);
      return null;
    }
  }

  /**
   * Buscar configurações por categoria
   */
  async getByCategory(category: string): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('id, key, value, category, description, created_at, updated_at')
        .eq('category', category)
        .is('deleted_at', null)
        .order('key', { ascending: true });

      if (error) {
        console.warn('Error fetching settings by category:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in SettingsService.getByCategory:', error);
      return [];
    }
  }

  /**
   * Buscar todas as configurações
   */
  async getAllSettings(): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('id, key, value, category, description')
        .is('deleted_at', null);

      if (error) {
        console.warn('Error fetching all settings:', error);
        // Retornar objeto vazio em vez de lançar erro
        return {};
      }

      // Converter array em objeto {key: value}
      const settings: Record<string, unknown> = {};
      (data || []).forEach((setting: Record<string, unknown>) => {
        const key = setting.key as string;
        settings[key] = setting.value;
      });

      return settings;
    } catch (error) {
      console.error('Error in SettingsService.getAllSettings:', error);
      // Retornar objeto vazio em caso de erro para não quebrar a UI
      return {};
    }
  }

  /**
   * Salvar ou atualizar configuração
   */
  async setSetting(keyName: string, value: string | number | boolean | Record<string, unknown> | null, options?: {
    category?: string;
    description?: string;
  }): Promise<Record<string, unknown> | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Verificar se já existe
      const existing = await this.getByKey(keyName);

      if (existing) {
        // Atualizar
        const { data, error } = await supabase
          .from('system_settings')
          .update({
            value,
            category: options?.category,
            description: options?.description,
            updated_by: user?.id || null
          })
          .eq('key', keyName)
          .is('deleted_at', null)
          .select('id, key, value, category, description')
          .maybeSingle();

        if (error) {
          console.error('Error updating setting:', error);
          throw handleSupabaseError(error);
        }
        return data;
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('system_settings')
          .insert({
            key: keyName,
            value,
            category: options?.category,
            description: options?.description,
            created_by: user?.id || null
          })
          .select('id, key, value, category, description')
          .maybeSingle();

        if (error) {
          console.error('Error inserting setting:', error);
          throw handleSupabaseError(error);
        }
        return data;
      }
    } catch (error) {
      console.error('Error in SettingsService.setSetting:', error);
      throw error;
    }
  }

  /**
   * Salvar múltiplas configurações
   */
  async setMultiple(settings: Record<string, string | number | boolean | Record<string, unknown> | null>, category?: string): Promise<void> {
    try {
      const promises = Object.entries(settings).map(([keyName, value]) =>
        this.setSetting(keyName, value, { category })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error in SettingsService.setMultiple:', error);
      throw error;
    }
  }

  /**
   * Deletar configuração (soft delete)
   */
  async deleteSetting(keyName: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ deleted_at: new Date().toISOString() })
        .eq('key', keyName)
        .is('deleted_at', null);

      if (error) {
        console.error('Error deleting setting:', error);
        throw handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error in SettingsService.deleteSetting:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();
export default settingsService;

