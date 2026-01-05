/**
 * DocumentService - Serviço para gerenciamento de documentos escolares
 * 
 * Gerencia documentos de alunos (históricos, declarações, certificados, etc).
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

export interface DocumentData {
  student_profile_id: number;
  document_type: string;
  title: string;
  issue_date: string;
  notes?: string;
}

class DocumentService extends BaseService {
  constructor() {
    super('school_documents');
  }

  /**
   * Buscar documento com informações completas
   */
  async getDocumentFullInfo(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('school_documents')
        .select(`
          *,
          student_profile:student_profiles(
            *,
            person:people(*)
          ),
          versions:school_documents_versions(*)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error in DocumentService.getDocumentFullInfo:', error);
      throw error;
    }
  }

  /**
   * Buscar documentos de um aluno
   */
  async getStudentDocuments(studentProfileId: number, documentType?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('school_documents')
        .select('*')
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null);

      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      const { data, error } = await query.order('issue_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in DocumentService.getStudentDocuments:', error);
      throw error;
    }
  }

  /**
   * Criar documento
   */
  async createDocument(data: DocumentData, fileContent?: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: document, error } = await supabase
        .from('school_documents')
        .insert({
          ...data,
          created_by: user?.id || 1
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      // Se houver conteúdo, criar primeira versão
      if (fileContent) {
        await this.addVersion(document.id, fileContent, 'Versão inicial');
      }

      return document;
    } catch (error) {
      console.error('Error in DocumentService.createDocument:', error);
      throw error;
    }
  }

  /**
   * Adicionar versão ao documento
   */
  async addVersion(documentId: number, fileContent: string, notes?: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Buscar número da última versão
      const { data: versions } = await supabase
        .from('school_documents_versions')
        .select('version_number')
        .eq('school_document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      const { data: version, error } = await supabase
        .from('school_documents_versions')
        .insert({
          school_document_id: documentId,
          version_number: nextVersion,
          file_path: fileContent,
          notes,
          created_by: user?.id || 1
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return version;
    } catch (error) {
      console.error('Error in DocumentService.addVersion:', error);
      throw error;
    }
  }

  /**
   * Buscar versões de um documento
   */
  async getDocumentVersions(documentId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('school_documents_versions')
        .select('*')
        .eq('school_document_id', documentId)
        .is('deleted_at', null)
        .order('version_number', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in DocumentService.getDocumentVersions:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de documentos
   */
  async getStats(studentProfileId?: number): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    try {
      let query = supabase
        .from('school_documents')
        .select('document_type')
        .is('deleted_at', null);

      if (studentProfileId) {
        query = query.eq('student_profile_id', studentProfileId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      const byType: Record<string, number> = {};
      (data || []).forEach((doc: any) => {
        byType[doc.document_type] = (byType[doc.document_type] || 0) + 1;
      });

      return {
        total: data?.length || 0,
        byType
      };
    } catch (error) {
      console.error('Error in DocumentService.getStats:', error);
      throw error;
    }
  }
}

export const documentService = new DocumentService();
export default documentService;

