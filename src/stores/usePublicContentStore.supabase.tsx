/**
 * usePublicContentStore - Store para gerenciamento de conteúdo público (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui usePublicContentStore.tsx antigo.
 * Após testar e validar, mesclar com o existente mantendo o Context Provider.
 */

import { create } from 'zustand';
import { publicContentService } from '@/lib/supabase/services/public-content-service';
import type { PublicContentData } from '@/lib/supabase/services/public-content-service';
import { toast } from 'sonner';

interface PublicContent {
  id: number;
  title: string;
  content: string;
  content_type: string;
  publication_status: string;
  publication_date?: string;
  featured: boolean;
  cover_image_url?: string;
  author?: any;
  versions?: any[];
}

interface PublicContentState {
  // Estado
  contents: PublicContent[];
  publishedContents: PublicContent[];
  currentContent: PublicContent | null;
  loading: boolean;
  error: string | null;
  
  // Ações - Buscar
  fetchContents: (options?: {
    contentType?: string;
    status?: string;
  }) => Promise<void>;
  fetchPublishedContents: (options?: {
    contentType?: string;
    limit?: number;
    featuredOnly?: boolean;
  }) => Promise<void>;
  fetchContentById: (id: number) => Promise<void>;
  fetchByAuthor: (authorId: number, status?: string) => Promise<void>;
  
  // CRUD
  createContent: (data: PublicContentData) => Promise<PublicContent | null>;
  updateContent: (id: number, data: Partial<PublicContentData>) => Promise<PublicContent | null>;
  deleteContent: (id: number) => Promise<void>;
  
  // Publicação
  publishContent: (id: number, publicationDate?: string) => Promise<void>;
  archiveContent: (id: number) => Promise<void>;
  toggleFeatured: (id: number, featured: boolean) => Promise<void>;
  
  // Versões
  addVersion: (contentId: number, content: string, notes?: string) => Promise<void>;
  
  // Estatísticas
  fetchStats: () => Promise<any>;
  
  // Utilitários
  clearError: () => void;
  setCurrentContent: (content: PublicContent | null) => void;
}

export const usePublicContentStore = create<PublicContentState>((set, get) => ({
  // Estado inicial
  contents: [],
  publishedContents: [],
  currentContent: null,
  loading: false,
  error: null,

  // ==================== BUSCAR ====================

  fetchContents: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      let contents: any[] = [];
      
      if (options.status === 'Publicado') {
        contents = await publicContentService.getPublishedContent({
          contentType: options.contentType
        });
      } else {
        contents = await publicContentService.getAll({
          filters: options.contentType ? [{ 
            column: 'content_type', 
            operator: 'eq', 
            value: options.contentType 
          }] : undefined,
          sort: { column: 'created_at', ascending: false }
        });
      }
      
      set({ contents, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar conteúdos';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchPublishedContents: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const publishedContents = await publicContentService.getPublishedContent(options);
      set({ publishedContents, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar conteúdos publicados';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchContentById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const content = await publicContentService.getContentFullInfo(id);
      set({ currentContent: content, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar conteúdo';
      set({ error: message, loading: false, currentContent: null });
      toast.error(message);
    }
  },

  fetchByAuthor: async (authorId: number, status?: string) => {
    set({ loading: true, error: null });
    try {
      const contents = await publicContentService.getByAuthor(authorId, status);
      set({ contents, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar conteúdos do autor';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== CRUD ====================

  createContent: async (data: PublicContentData) => {
    set({ loading: true, error: null });
    try {
      const newContent = await publicContentService.createContent(data);
      
      const { contents } = get();
      set({ 
        contents: [...contents, newContent], 
        loading: false 
      });
      
      toast.success('Conteúdo criado com sucesso!');
      return newContent;
    } catch (error: any) {
      const message = error?.message || 'Erro ao criar conteúdo';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  updateContent: async (id: number, data: Partial<PublicContentData>) => {
    set({ loading: true, error: null });
    try {
      const updatedContent = await publicContentService.update(id, data);
      
      const { contents } = get();
      set({ 
        contents: contents.map(c => c.id === id ? { ...c, ...updatedContent } : c),
        currentContent: get().currentContent?.id === id ? { ...get().currentContent, ...updatedContent } : get().currentContent,
        loading: false 
      });
      
      toast.success('Conteúdo atualizado com sucesso!');
      return updatedContent;
    } catch (error: any) {
      const message = error?.message || 'Erro ao atualizar conteúdo';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  deleteContent: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await publicContentService.delete(id);
      
      const { contents } = get();
      set({ 
        contents: contents.filter(c => c.id !== id),
        currentContent: get().currentContent?.id === id ? null : get().currentContent,
        loading: false 
      });
      
      toast.success('Conteúdo removido com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao remover conteúdo';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== PUBLICAÇÃO ====================

  publishContent: async (id: number, publicationDate?: string) => {
    set({ loading: true, error: null });
    try {
      const published = await publicContentService.publishContent(id, publicationDate);
      
      const { contents } = get();
      set({ 
        contents: contents.map(c => c.id === id ? { ...c, ...published } : c),
        currentContent: get().currentContent?.id === id ? { ...get().currentContent, ...published } : get().currentContent,
        loading: false 
      });
      
      toast.success('Conteúdo publicado com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao publicar conteúdo';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  archiveContent: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const archived = await publicContentService.archiveContent(id);
      
      const { contents } = get();
      set({ 
        contents: contents.map(c => c.id === id ? { ...c, ...archived } : c),
        currentContent: get().currentContent?.id === id ? { ...get().currentContent, ...archived } : get().currentContent,
        loading: false 
      });
      
      toast.success('Conteúdo arquivado com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao arquivar conteúdo';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  toggleFeatured: async (id: number, featured: boolean) => {
    set({ loading: true, error: null });
    try {
      const updated = await publicContentService.toggleFeatured(id, featured);
      
      const { contents } = get();
      set({ 
        contents: contents.map(c => c.id === id ? { ...c, ...updated } : c),
        currentContent: get().currentContent?.id === id ? { ...get().currentContent, ...updated } : get().currentContent,
        loading: false 
      });
      
      toast.success(featured ? 'Conteúdo destacado!' : 'Destaque removido!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao alterar destaque';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== VERSÕES ====================

  addVersion: async (contentId: number, content: string, notes?: string) => {
    set({ loading: true, error: null });
    try {
      await publicContentService.addVersion(contentId, content, notes);
      
      // Recarregar conteúdo se for o atual
      if (get().currentContent?.id === contentId) {
        await get().fetchContentById(contentId);
      }
      
      toast.success('Nova versão salva com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao salvar versão';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== ESTATÍSTICAS ====================

  fetchStats: async () => {
    try {
      const stats = await publicContentService.getStats();
      return stats;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar estatísticas';
      toast.error(message);
      return null;
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentContent: (content: PublicContent | null) => set({ currentContent: content }),
}));

// Exportar tipos para uso em componentes
export type { PublicContentState, PublicContent };

