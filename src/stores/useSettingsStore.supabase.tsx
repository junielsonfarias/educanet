/**
 * useSettingsStore - Store para gerenciamento de configurações do sistema (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui o useSettingsStore.tsx antigo.
 * Após testar e validar, renomear para useSettingsStore.tsx
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsService } from '@/lib/supabase/services/settings-service';
import type { SettingsData } from '@/lib/supabase/services/settings-service';
import { toast } from 'sonner';

interface Settings {
  // Configurações gerais
  [key: string]: string | number | boolean | Record<string, unknown> | null;
}

type SettingValue = string | number | boolean | Record<string, unknown> | null;

interface SettingsState {
  // Estado
  settings: Settings;
  loading: boolean;
  error: string | null;

  // Ações
  fetchSettings: () => Promise<void>;
  fetchByCategory: (category: string) => Promise<Settings>;
  getSetting: <T = SettingValue>(key: string, defaultValue?: T) => T;
  setSetting: (key: string, value: SettingValue, options?: {
    category?: string;
    description?: string;
  }) => Promise<void>;
  setMultiple: (settings: Record<string, SettingValue>, category?: string) => Promise<void>;
  deleteSetting: (key: string) => Promise<void>;

  // Utilitários
  clearError: () => void;
  reset: () => void;
}

const initialSettings: Settings = {};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      settings: initialSettings,
      loading: false,
      error: null,

      // ==================== BUSCAR ====================

      fetchSettings: async () => {
        set({ loading: true, error: null });
        try {
          const settings = await settingsService.getAllSettings();
          set({ settings, loading: false });
        } catch (error: unknown) {
          const message = (error as Error)?.message || 'Erro ao carregar configurações';
          set({ error: message, loading: false });
          toast.error(message);
        }
      },

      fetchByCategory: async (category: string) => {
        set({ loading: true, error: null });
        try {
          const settingsArray = await settingsService.getByCategory(category);

          // Converter array em objeto
          const settings: Settings = {};
          settingsArray.forEach((setting: Record<string, unknown>) => {
            settings[setting.key as string] = setting.value as SettingValue;
          });

          set({ loading: false });
          return settings;
        } catch (error: unknown) {
          const message = (error as Error)?.message || 'Erro ao carregar configurações da categoria';
          set({ error: message, loading: false });
          toast.error(message);
          return {};
        }
      },

      getSetting: <T = SettingValue>(key: string, defaultValue?: T): T => {
        const { settings } = get();
        return (settings[key] !== undefined ? settings[key] : defaultValue) as T;
      },

      // ==================== SALVAR ====================

      setSetting: async (key: string, value: SettingValue, options = {}) => {
        set({ loading: true, error: null });
        try {
          await settingsService.setSetting(key, value, options);
          
          const { settings } = get();
          set({ 
            settings: { ...settings, [key]: value },
            loading: false 
          });
          
          toast.success('Configuração salva com sucesso!');
        } catch (error: unknown) {
          const message = (error as Error)?.message || 'Erro ao salvar configuração';
          set({ error: message, loading: false });
          toast.error(message);
        }
      },

      setMultiple: async (newSettings: Record<string, SettingValue>, category?: string) => {
        set({ loading: true, error: null });
        try {
          await settingsService.setMultiple(newSettings, category);
          
          const { settings } = get();
          set({ 
            settings: { ...settings, ...newSettings },
            loading: false 
          });
          
          toast.success('Configurações salvas com sucesso!');
        } catch (error: unknown) {
          const message = (error as Error)?.message || 'Erro ao salvar configurações';
          set({ error: message, loading: false });
          toast.error(message);
        }
      },

      deleteSetting: async (key: string) => {
        set({ loading: true, error: null });
        try {
          await settingsService.deleteSetting(key);
          
          const { settings } = get();
          const newSettings = { ...settings };
          delete newSettings[key];
          
          set({ settings: newSettings, loading: false });
          toast.success('Configuração removida com sucesso!');
        } catch (error: unknown) {
          const message = (error as Error)?.message || 'Erro ao remover configuração';
          set({ error: message, loading: false });
          toast.error(message);
        }
      },

      // ==================== UTILITÁRIOS ====================

      clearError: () => set({ error: null }),

      reset: () => set({ settings: initialSettings, error: null }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

// Exportar tipos para uso em componentes
export type { SettingsState, Settings };

