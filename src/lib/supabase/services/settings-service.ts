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
  value: any;
  category?: string;
  description?: string;
}

class SettingsService extends BaseService {
  constructor() {
    super('system_settings');
  }

  /**
   * Buscar configuração por chave
   */
  async getByKey(key: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error in SettingsService.getByKey:', error);
      throw error;
    }
  }

  /**
   * Buscar configurações por categoria
   */
  async getByCategory(category: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', category)
        .is('deleted_at', null)
        .order('key', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SettingsService.getByCategory:', error);
      throw error;
    }
  }

  /**
   * Buscar todas as configurações
   */
  async getAllSettings(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Converter array em objeto {key: value}
      const settings: Record<string, any> = {};
      (data || []).forEach((setting: any) => {
        settings[setting.key] = setting.value;
      });

      return settings;
    } catch (error) {
      console.error('Error in SettingsService.getAllSettings:', error);
      throw error;
    }
  }

  /**
   * Salvar ou atualizar configuração
   */
  async setSetting(key: string, value: any, options?: {
    category?: string;
    description?: string;
  }): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Verificar se já existe
      const existing = await this.getByKey(key);

      if (existing) {
        // Atualizar
        const { data, error } = await supabase
          .from('system_settings')
          .update({
            value,
            category: options?.category,
            description: options?.description,
            updated_by: user?.id || 1
          })
          .eq('key', key)
          .select()
          .single();

        if (error) throw handleSupabaseError(error);
        return data;
      } else {
        // Criar
        const { data, error } = await supabase
          .from('system_settings')
          .insert({
            key,
            value,
            category: options?.category,
            description: options?.description,
            created_by: user?.id || 1
          })
          .select()
          .single();

        if (error) throw handleSupabaseError(error);
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
  async setMultiple(settings: Record<string, any>, category?: string): Promise<void> {
    try {
      const promises = Object.entries(settings).map(([key, value]) =>
        this.setSetting(key, value, { category })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error in SettingsService.setMultiple:', error);
      throw error;
    }
  }

  /**
   * Deletar configuração
   */
  async deleteSetting(key: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ deleted_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in SettingsService.deleteSetting:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();
export default settingsService;

