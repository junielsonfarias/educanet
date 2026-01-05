/**
 * PublicContentService - Serviço para gerenciamento de conteúdo público
 * 
 * Gerencia notícias, eventos e conteúdo institucional do portal público.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

export interface PublicContentData {
  title: string;
  content: string;
  content_type: string;
  publication_status?: string;
  publication_date?: string;
  featured?: boolean;
  cover_image_url?: string;
}

class PublicContentService extends BaseService {
  constructor() {
    super('public_portal_content');
  }

  /**
   * Buscar conteúdo com versões
   */
  async getContentFullInfo(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('public_portal_content')
        .select(`
          *,
          versions:public_portal_content_versions(*)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw handleSupabaseError(error);
      }

      // Buscar informações do autor se existir
      if (data?.author_person_id) {
        const { data: authorData } = await supabase
          .from('people')
          .select('id, first_name, last_name, email')
          .eq('id', data.author_person_id)
          .single();
        
        return {
          ...data,
          author: authorData || null
        };
      }

      return { ...data, author: null };
    } catch (error) {
      console.error('Error in PublicContentService.getContentFullInfo:', error);
      throw error;
    }
  }

  /**
   * Buscar conteúdo publicado (para portal público)
   */
  async getPublishedContent(options?: {
    contentType?: string;
    limit?: number;
    featuredOnly?: boolean;
  }): Promise<any[]> {
    try {
      // Buscar conteúdo sem relacionamento primeiro
      let query = supabase
        .from('public_portal_content')
        .select('*')
        .eq('publication_status', 'Publicado')
        .lte('publication_date', new Date().toISOString())
        .is('deleted_at', null);

      // Nota: A coluna content_type pode não existir na tabela
      // Se necessário, filtrar por outro campo ou remover este filtro
      // if (options?.contentType) {
      //   query = query.eq('type', options.contentType); // ou outro nome de coluna
      // }

      if (options?.featuredOnly) {
        query = query.eq('featured', true);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query.order('publication_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PublicContentService.getPublishedContent:', error);
      throw error;
    }
  }

  /**
   * Criar conteúdo
   */
  async createContent(data: PublicContentData): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: content, error } = await supabase
        .from('public_portal_content')
        .insert({
          ...data,
          publication_status: data.publication_status || 'Rascunho',
          author_person_id: user?.id || 1,
          created_by: user?.id || 1
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      // Criar primeira versão
      await this.addVersion(content.id, data.content, 'Versão inicial');

      return content;
    } catch (error) {
      console.error('Error in PublicContentService.createContent:', error);
      throw error;
    }
  }

  /**
   * Adicionar versão ao conteúdo
   */
  async addVersion(contentId: number, content: string, notes?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Buscar número da última versão
      const { data: versions } = await supabase
        .from('public_portal_content_versions')
        .select('version_number')
        .eq('public_portal_content_id', contentId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      const { error } = await supabase
        .from('public_portal_content_versions')
        .insert({
          public_portal_content_id: contentId,
          version_number: nextVersion,
          content,
          notes,
          created_by: user?.id || 1
        });

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in PublicContentService.addVersion:', error);
      throw error;
    }
  }

  /**
   * Publicar conteúdo
   */
  async publishContent(contentId: number, publicationDate?: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('public_portal_content')
        .update({
          publication_status: 'Publicado',
          publication_date: publicationDate || new Date().toISOString(),
          updated_by: user?.id || 1
        })
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error in PublicContentService.publishContent:', error);
      throw error;
    }
  }

  /**
   * Arquivar conteúdo
   */
  async archiveContent(contentId: number): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('public_portal_content')
        .update({
          publication_status: 'Arquivado',
          updated_by: user?.id || 1
        })
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error in PublicContentService.archiveContent:', error);
      throw error;
    }
  }

  /**
   * Destacar/remover destaque
   */
  async toggleFeatured(contentId: number, featured: boolean): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('public_portal_content')
        .update({
          featured,
          updated_by: user?.id || 1
        })
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error in PublicContentService.toggleFeatured:', error);
      throw error;
    }
  }

  /**
   * Buscar por autor
   */
  async getByAuthor(authorPersonId: number, status?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('public_portal_content')
        .select('*')
        .eq('author_person_id', authorPersonId)
        .is('deleted_at', null);

      if (status) {
        query = query.eq('publication_status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PublicContentService.getByAuthor:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    featured: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('public_portal_content')
        .select('publication_status, featured')
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      const byStatus: Record<string, number> = {};
      const byType: Record<string, number> = {};
      let featured = 0;

      (data || []).forEach((content: any) => {
        byStatus[content.publication_status] = (byStatus[content.publication_status] || 0) + 1;
        // content_type não existe na tabela, removido
        if (content.featured) featured++;
      });

      return {
        total: data?.length || 0,
        byStatus,
        byType,
        featured
      };
    } catch (error) {
      console.error('Error in PublicContentService.getStats:', error);
      throw error;
    }
  }
}

export const publicContentService = new PublicContentService();
export default publicContentService;

