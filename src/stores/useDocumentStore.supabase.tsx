/**
 * useDocumentStore - Store para gerenciamento de documentos escolares (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui o useDocumentStore.tsx antigo.
 * Após testar e validar, renomear para useDocumentStore.tsx
 */

import { create } from 'zustand';
import { documentService } from '@/lib/supabase/services/document-service';
import type { DocumentData } from '@/lib/supabase/services/document-service';
import { toast } from 'sonner';

interface Document {
  id: number;
  student_profile_id: number;
  document_type: string;
  title: string;
  issue_date: string;
  notes?: string;
  student?: any;
  versions?: any[];
}

interface DocumentState {
  // Estado
  documents: Document[];
  currentDocument: Document | null;
  loading: boolean;
  error: string | null;
  
  // Ações - Buscar
  fetchDocuments: () => Promise<void>;
  fetchStudentDocuments: (studentId: number, documentType?: string) => Promise<void>;
  fetchDocumentById: (id: number) => Promise<void>;
  
  // CRUD
  createDocument: (data: DocumentData, fileContent?: string) => Promise<Document | null>;
  updateDocument: (id: number, data: Partial<DocumentData>) => Promise<Document | null>;
  deleteDocument: (id: number) => Promise<void>;
  
  // Versões
  addVersion: (documentId: number, fileContent: string, notes?: string) => Promise<void>;
  fetchVersions: (documentId: number) => Promise<any[]>;
  
  // Estatísticas
  fetchStats: (studentId?: number) => Promise<any>;
  
  // Utilitários
  clearError: () => void;
  setCurrentDocument: (document: Document | null) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  // Estado inicial
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,

  // ==================== BUSCAR ====================

  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const documents = await documentService.getAll({
        sort: { column: 'issue_date', ascending: false }
      });
      set({ documents, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar documentos';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchStudentDocuments: async (studentId: number, documentType?: string) => {
    set({ loading: true, error: null });
    try {
      const documents = await documentService.getStudentDocuments(
        studentId,
        documentType
      );
      set({ documents, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar documentos do aluno';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchDocumentById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const document = await documentService.getDocumentFullInfo(id);
      set({ currentDocument: document, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar documento';
      set({ error: message, loading: false, currentDocument: null });
      toast.error(message);
    }
  },

  // ==================== CRUD ====================

  createDocument: async (data: DocumentData, fileContent?: string) => {
    set({ loading: true, error: null });
    try {
      const newDocument = await documentService.createDocument(data, fileContent);
      
      const { documents } = get();
      set({ 
        documents: [...documents, newDocument], 
        loading: false 
      });
      
      toast.success('Documento criado com sucesso!');
      return newDocument;
    } catch (error: any) {
      const message = error?.message || 'Erro ao criar documento';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  updateDocument: async (id: number, data: Partial<DocumentData>) => {
    set({ loading: true, error: null });
    try {
      const updatedDocument = await documentService.update(id, data);
      
      const { documents } = get();
      set({ 
        documents: documents.map(d => d.id === id ? { ...d, ...updatedDocument } : d),
        currentDocument: get().currentDocument?.id === id ? { ...get().currentDocument, ...updatedDocument } : get().currentDocument,
        loading: false 
      });
      
      toast.success('Documento atualizado com sucesso!');
      return updatedDocument;
    } catch (error: any) {
      const message = error?.message || 'Erro ao atualizar documento';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  deleteDocument: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await documentService.delete(id);
      
      const { documents } = get();
      set({ 
        documents: documents.filter(d => d.id !== id),
        currentDocument: get().currentDocument?.id === id ? null : get().currentDocument,
        loading: false 
      });
      
      toast.success('Documento removido com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao remover documento';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== VERSÕES ====================

  addVersion: async (documentId: number, fileContent: string, notes?: string) => {
    set({ loading: true, error: null });
    try {
      await documentService.addVersion(documentId, fileContent, notes);
      
      // Recarregar documento se for o atual
      if (get().currentDocument?.id === documentId) {
        await get().fetchDocumentById(documentId);
      }
      
      toast.success('Nova versão adicionada com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao adicionar versão';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchVersions: async (documentId: number) => {
    try {
      const versions = await documentService.getDocumentVersions(documentId);
      return versions;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar versões do documento';
      toast.error(message);
      return [];
    }
  },

  // ==================== ESTATÍSTICAS ====================

  fetchStats: async (studentId?: number) => {
    try {
      const stats = await documentService.getStats(studentId);
      return stats;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar estatísticas';
      toast.error(message);
      return null;
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentDocument: (document: Document | null) => set({ currentDocument: document }),
}));

// Exportar tipos para uso em componentes
export type { DocumentState, Document };

