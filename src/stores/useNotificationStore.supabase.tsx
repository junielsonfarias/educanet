/**
 * useNotificationStore - Store para gerenciamento de notificações/comunicações (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui o useNotificationStore.tsx antigo.
 * Após testar e validar, renomear para useNotificationStore.tsx
 */

import { create } from 'zustand';
import { communicationService } from '@/lib/supabase/services/communication-service';
import type { CommunicationData } from '@/lib/supabase/services/communication-service';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Communication {
  id: number;
  title: string;
  content: string;
  communication_type: string;
  target_audience: string;
  sent_date: string;
  expiration_date?: string;
  recipients?: any[];
}

interface NotificationState {
  // Estado
  communications: Communication[];
  userCommunications: any[];
  currentCommunication: Communication | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Ações - Buscar
  fetchCommunications: (filters?: {
    type?: string;
    audience?: string;
  }) => Promise<void>;
  fetchUserCommunications: (personId: number, unreadOnly?: boolean) => Promise<void>;
  fetchCommunicationById: (id: number) => Promise<void>;
  fetchUnreadCount: (personId: number) => Promise<void>;
  
  // CRUD
  createCommunication: (data: CommunicationData, recipientIds: number[]) => Promise<Communication | null>;
  updateCommunication: (id: number, data: Partial<CommunicationData>) => Promise<Communication | null>;
  deleteCommunication: (id: number) => Promise<void>;
  
  // Ações
  markAsRead: (communicationId: number, personId: number) => Promise<void>;
  addRecipients: (communicationId: number, personIds: number[]) => Promise<void>;
  
  // Métodos específicos para NotificationsManager
  sendCommunication: (data: {
    recipient_person_id: number;
    channel: string;
    subject: string;
    content: string;
    priority?: string;
  }) => Promise<any>;
  updateCommunicationStatus: (id: number, status: string) => Promise<void>;
  
  // Utilitários
  clearError: () => void;
  setCurrentCommunication: (communication: Communication | null) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Estado inicial
  communications: [],
  userCommunications: [],
  currentCommunication: null,
  unreadCount: 0,
  loading: false,
  error: null,

  // ==================== BUSCAR ====================

  fetchCommunications: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const filtersArray: any[] = [];
      
      if (filters.type) {
        filtersArray.push({
          column: 'communication_type',
          operator: 'eq',
          value: filters.type
        });
      }
      
      if (filters.audience) {
        filtersArray.push({
          column: 'target_audience',
          operator: 'eq',
          value: filters.audience
        });
      }

      const communications = await communicationService.getAll({
        filters: filtersArray.length > 0 ? filtersArray : undefined,
        sort: { column: 'sent_date', ascending: false }
      });
      
      set({ communications, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar comunicações';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchUserCommunications: async (personId: number, unreadOnly = false) => {
    set({ loading: true, error: null });
    try {
      const userCommunications = await communicationService.getPersonCommunications(
        personId,
        unreadOnly
      );
      set({ userCommunications, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar suas comunicações';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchCommunicationById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const communication = await communicationService.getCommunicationFullInfo(id);
      set({ currentCommunication: communication, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar comunicação';
      set({ error: message, loading: false, currentCommunication: null });
      toast.error(message);
    }
  },

  fetchUnreadCount: async (personId: number) => {
    try {
      const count = await communicationService.getUnreadCount(personId);
      set({ unreadCount: count });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      // Não mostra toast para não incomodar o usuário
    }
  },

  // ==================== CRUD ====================

  createCommunication: async (data: CommunicationData, recipientIds: number[]) => {
    set({ loading: true, error: null });
    try {
      const newCommunication = await communicationService.createCommunication(
        data,
        recipientIds
      );
      
      const { communications } = get();
      set({ 
        communications: [newCommunication, ...communications], 
        loading: false 
      });
      
      toast.success('Comunicação enviada com sucesso!');
      return newCommunication;
    } catch (error: any) {
      const message = error?.message || 'Erro ao enviar comunicação';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  updateCommunication: async (id: number, data: Partial<CommunicationData>) => {
    set({ loading: true, error: null });
    try {
      const updatedCommunication = await communicationService.update(id, data);
      
      const { communications } = get();
      set({ 
        communications: communications.map(c => 
          c.id === id ? { ...c, ...updatedCommunication } : c
        ),
        currentCommunication: get().currentCommunication?.id === id 
          ? { ...get().currentCommunication, ...updatedCommunication } 
          : get().currentCommunication,
        loading: false 
      });
      
      toast.success('Comunicação atualizada com sucesso!');
      return updatedCommunication;
    } catch (error: any) {
      const message = error?.message || 'Erro ao atualizar comunicação';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  deleteCommunication: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await communicationService.delete(id);
      
      const { communications } = get();
      set({ 
        communications: communications.filter(c => c.id !== id),
        currentCommunication: get().currentCommunication?.id === id 
          ? null 
          : get().currentCommunication,
        loading: false 
      });
      
      toast.success('Comunicação removida com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao remover comunicação';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== AÇÕES ====================

  markAsRead: async (communicationId: number, personId: number) => {
    try {
      await communicationService.markAsRead(communicationId, personId);
      
      // Atualizar lista de comunicações do usuário
      const { userCommunications, unreadCount } = get();
      set({
        userCommunications: userCommunications.map(uc => 
          uc.communication_id === communicationId 
            ? { ...uc, read_at: new Date().toISOString() }
            : uc
        ),
        unreadCount: Math.max(0, unreadCount - 1)
      });
    } catch (error: any) {
      console.error('Error marking as read:', error);
      // Não mostra toast para não incomodar o usuário
    }
  },

  addRecipients: async (communicationId: number, personIds: number[]) => {
    set({ loading: true, error: null });
    try {
      await communicationService.addRecipients(communicationId, personIds);
      
      // Recarregar comunicação se for a atual
      if (get().currentCommunication?.id === communicationId) {
        await get().fetchCommunicationById(communicationId);
      }
      
      toast.success('Destinatários adicionados com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao adicionar destinatários';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // Métodos específicos para NotificationsManager
  sendCommunication: async (data: {
    recipient_person_id: number;
    channel: string;
    subject: string;
    content: string;
    priority?: string;
  }) => {
    set({ loading: true, error: null });
    try {
      // Criar comunicação usando o formato esperado
      const communicationData: CommunicationData = {
        title: data.subject,
        content: data.content,
        communication_type: data.channel, // email, sms, push
        target_audience: 'individual', // individual, class, school, all
      };

      const newCommunication = await communicationService.createCommunication(
        communicationData,
        [data.recipient_person_id]
      );
      
      const { communications } = get();
      set({ 
        communications: [newCommunication, ...communications], 
        loading: false 
      });
      
      return newCommunication;
    } catch (error: any) {
      const message = error?.message || 'Erro ao enviar comunicação';
      set({ error: message, loading: false });
      toast.error(message);
      throw error;
    }
  },

  updateCommunicationStatus: async (id: number, status: string) => {
    set({ loading: true, error: null });
    try {
      // Atualizar apenas o status (pode ser 'pending', 'sent', 'failed')
      // Como o CommunicationData não tem status, vamos usar update diretamente
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('communications')
        .update({ 
          status,
          sent_date: status === 'sent' ? new Date().toISOString() : undefined,
        })
        .eq('id', id);

      if (error) throw error;
      
      const { communications } = get();
      set({ 
        communications: communications.map(c => 
          c.id === id ? { ...c, status, sent_date: status === 'sent' ? new Date().toISOString() : c.sent_date } : c
        ),
        loading: false 
      });
      
      toast.success('Status atualizado com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao atualizar status';
      set({ error: message, loading: false });
      toast.error(message);
      throw error;
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentCommunication: (communication: Communication | null) => 
    set({ currentCommunication: communication }),
}));

// Exportar tipos para uso em componentes
export type { NotificationState, Communication };

