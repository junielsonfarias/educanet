/**
 * AttachmentService - Serviço para gerenciamento de anexos
 * 
 * Gerencia anexos (fotos e documentos) associados a diversas entidades
 * do sistema através de uma chave estrangeira genérica.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import { uploadFile, deleteFile, getPublicUrl, type BucketName } from '../storage';
import type { Tables, Enums } from '@/lib/database-types';

export type EntityType = Enums<'entity_type'>;

export interface AttachmentData {
  entity_type: EntityType;
  entity_id: number;
  file_name: string;
  file_path_url: string;
  file_type: string;
  file_size_bytes?: number;
  description?: string;
}

export interface AttachmentWithDetails extends Tables<'attachments'> {
  uploaded_by?: {
    id: number;
    full_name: string;
    email?: string;
  };
}

class AttachmentService extends BaseService<Tables<'attachments'>> {
  constructor() {
    super('attachments');
  }

  /**
   * Buscar anexo com informações completas
   */
  async getAttachmentFullInfo(id: number): Promise<AttachmentWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select(`
          *,
          uploaded_by:people!attachments_uploaded_by_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw handleSupabaseError(error);
      }

      return data as AttachmentWithDetails;
    } catch (error) {
      console.error('Error in AttachmentService.getAttachmentFullInfo:', error);
      throw error;
    }
  }

  /**
   * Buscar anexos por entidade
   */
  async getByEntity(
    entityType: EntityType,
    entityId: number,
    options?: {
      fileType?: string;
      limit?: number;
    }
  ): Promise<AttachmentWithDetails[]> {
    try {
      let query = supabase
        .from('attachments')
        .select(`
          *,
          uploaded_by:people!attachments_uploaded_by_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('deleted_at', null);

      if (options?.fileType) {
        query = query.eq('file_type', options.fileType);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return (data || []) as AttachmentWithDetails[];
    } catch (error) {
      console.error('Error in AttachmentService.getByEntity:', error);
      throw error;
    }
  }

  /**
   * Buscar anexos por tipo de arquivo
   */
  async getByFileType(
    fileType: string,
    options?: {
      entityType?: EntityType;
      limit?: number;
    }
  ): Promise<AttachmentWithDetails[]> {
    try {
      let query = supabase
        .from('attachments')
        .select(`
          *,
          uploaded_by:people!attachments_uploaded_by_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('file_type', fileType)
        .is('deleted_at', null);

      if (options?.entityType) {
        query = query.eq('entity_type', options.entityType);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return (data || []) as AttachmentWithDetails[];
    } catch (error) {
      console.error('Error in AttachmentService.getByFileType:', error);
      throw error;
    }
  }

  /**
   * Criar anexo (apenas metadados)
   * 
   * Nota: O upload do arquivo deve ser feito separadamente no Supabase Storage
   * e o file_path_url deve ser fornecido aqui.
   */
  async createAttachment(data: AttachmentData): Promise<Tables<'attachments'>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Buscar person_id do usuário autenticado
      const { data: authUser } = await supabase
        .from('auth_users')
        .select('person_id')
        .eq('id', user?.id)
        .is('deleted_at', null)
        .single();

      if (!authUser?.person_id) {
        throw new Error('Usuário não encontrado ou não vinculado a uma pessoa');
      }

      const { data: attachment, error } = await supabase
        .from('attachments')
        .insert({
          ...data,
          uploaded_by_id: authUser.person_id,
          created_by: authUser.person_id,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return attachment;
    } catch (error) {
      console.error('Error in AttachmentService.createAttachment:', error);
      throw error;
    }
  }

  /**
   * Upload de arquivo para Supabase Storage e criação de anexo
   * 
   * @param file Arquivo a ser enviado
   * @param entityType Tipo da entidade
   * @param entityId ID da entidade
   * @param bucket Nome do bucket no Supabase Storage (padrão: 'attachments')
   * @param description Descrição opcional do anexo
   */
  async uploadAttachment(
    file: File,
    entityType: EntityType,
    entityId: number,
    options?: {
      bucket?: BucketName;
      description?: string;
      folder?: string;
    }
  ): Promise<Tables<'attachments'>> {
    try {
      const bucket: BucketName = (options?.bucket || 'attachments') as BucketName;
      const folder = options?.folder || entityType;
      const filePath = `${folder}/${entityId}/${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;

      // Upload do arquivo usando helper do storage.ts
      const uploadResult = await uploadFile({
        bucket,
        file,
        path: filePath,
        upsert: false,
        cacheControl: '3600',
      });

      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Erro ao fazer upload do arquivo');
      }

      // Criar registro do anexo
      const attachmentData: AttachmentData = {
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        file_path_url: uploadResult.publicUrl,
        file_type: file.type,
        file_size_bytes: file.size,
        description: options?.description
      };

      return await this.createAttachment(attachmentData);
    } catch (error) {
      console.error('Error in AttachmentService.uploadAttachment:', error);
      throw error;
    }
  }

  /**
   * Deletar anexo (soft delete)
   */
  async deleteAttachment(id: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Buscar person_id do usuário autenticado
      const { data: authUser } = await supabase
        .from('auth_users')
        .select('person_id')
        .eq('id', user?.id)
        .is('deleted_at', null)
        .single();

      if (!authUser?.person_id) {
        throw new Error('Usuário não encontrado ou não vinculado a uma pessoa');
      }

      // Buscar anexo para obter o caminho do arquivo
      const attachment = await this.getById(id);
      if (!attachment) {
        throw new Error('Anexo não encontrado');
      }

      // Soft delete do registro
      const { error } = await supabase
        .from('attachments')
        .update({
          deleted_at: new Date().toISOString(),
          updated_by: authUser.person_id
        })
        .eq('id', id);

      if (error) throw handleSupabaseError(error);

      // Opcional: Deletar arquivo do Storage
      // Extrair caminho do arquivo da URL
      try {
        const urlParts = attachment.file_path_url.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'storage' || part === 'v1');
        if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
          const bucket = urlParts[bucketIndex + 2] as BucketName;
          const filePath = urlParts.slice(bucketIndex + 3).join('/');
          
          await deleteFile(bucket, filePath);
        }
      } catch (storageError) {
        // Log mas não falha se não conseguir deletar do storage
        console.warn('Erro ao deletar arquivo do Storage (continuando com soft delete):', storageError);
      }
    } catch (error) {
      console.error('Error in AttachmentService.deleteAttachment:', error);
      throw error;
    }
  }

  /**
   * Atualizar descrição do anexo
   */
  async updateDescription(id: number, description: string): Promise<Tables<'attachments'>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Buscar person_id do usuário autenticado
      const { data: authUser } = await supabase
        .from('auth_users')
        .select('person_id')
        .eq('id', user?.id)
        .is('deleted_at', null)
        .single();

      if (!authUser?.person_id) {
        throw new Error('Usuário não encontrado ou não vinculado a uma pessoa');
      }

      const { data, error } = await supabase
        .from('attachments')
        .update({
          description,
          updated_by: authUser.person_id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error in AttachmentService.updateDescription:', error);
      throw error;
    }
  }

  /**
   * Contar anexos por entidade
   */
  async countByEntity(entityType: EntityType, entityId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('attachments')
        .select('id', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);
      return count || 0;
    } catch (error) {
      console.error('Error in AttachmentService.countByEntity:', error);
      throw error;
    }
  }

  /**
   * Buscar anexos recentes
   */
  async getRecentAttachments(limit: number = 10): Promise<AttachmentWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select(`
          *,
          uploaded_by:people!attachments_uploaded_by_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .is('deleted_at', null)
        .order('uploaded_at', { ascending: false })
        .limit(limit);

      if (error) throw handleSupabaseError(error);
      return (data || []) as AttachmentWithDetails[];
    } catch (error) {
      console.error('Error in AttachmentService.getRecentAttachments:', error);
      throw error;
    }
  }
}

export const attachmentService = new AttachmentService();
export default attachmentService;

