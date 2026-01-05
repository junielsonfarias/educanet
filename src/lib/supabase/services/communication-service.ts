/**
 * CommunicationService - Serviço para gerenciamento de comunicações
 * 
 * Gerencia avisos, comunicados e notificações para alunos, responsáveis e professores.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

export interface CommunicationData {
  title: string;
  content: string;
  communication_type: string;
  target_audience: string;
  scheduled_date?: string;
  expiration_date?: string;
}

class CommunicationService extends BaseService {
  constructor() {
    super('communications');
  }

  /**
   * Buscar comunicação com destinatários
   */
  async getCommunicationFullInfo(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select(`
          *,
          recipients:communication_recipients(
            *,
            person:people(*)
          )
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
      console.error('Error in CommunicationService.getCommunicationFullInfo:', error);
      throw error;
    }
  }

  /**
   * Criar comunicação
   */
  async createCommunication(data: CommunicationData, recipientIds: number[]): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: communication, error } = await supabase
        .from('communications')
        .insert({
          ...data,
          sent_date: data.scheduled_date || new Date().toISOString(),
          created_by: user?.id || 1
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      // Adicionar destinatários
      if (recipientIds.length > 0) {
        await this.addRecipients(communication.id, recipientIds);
      }

      return communication;
    } catch (error) {
      console.error('Error in CommunicationService.createCommunication:', error);
      throw error;
    }
  }

  /**
   * Adicionar destinatários
   */
  async addRecipients(communicationId: number, personIds: number[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const recipients = personIds.map(personId => ({
        communication_id: communicationId,
        person_id: personId,
        created_by: user?.id || 1
      }));

      const { error } = await supabase
        .from('communication_recipients')
        .insert(recipients);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in CommunicationService.addRecipients:', error);
      throw error;
    }
  }

  /**
   * Marcar como lida
   */
  async markAsRead(communicationId: number, personId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('communication_recipients')
        .update({
          read_at: new Date().toISOString()
        })
        .eq('communication_id', communicationId)
        .eq('person_id', personId);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in CommunicationService.markAsRead:', error);
      throw error;
    }
  }

  /**
   * Buscar comunicações de uma pessoa
   */
  async getPersonCommunications(personId: number, unreadOnly: boolean = false): Promise<any[]> {
    try {
      let query = supabase
        .from('communication_recipients')
        .select(`
          *,
          communication:communications(*)
        `)
        .eq('person_id', personId)
        .is('deleted_at', null);

      if (unreadOnly) {
        query = query.is('read_at', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in CommunicationService.getPersonCommunications:', error);
      throw error;
    }
  }

  /**
   * Contar não lidas
   */
  async getUnreadCount(personId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('communication_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('person_id', personId)
        .is('read_at', null)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);
      return count || 0;
    } catch (error) {
      console.error('Error in CommunicationService.getUnreadCount:', error);
      return 0;
    }
  }
}

export const communicationService = new CommunicationService();
export default communicationService;

