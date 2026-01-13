/**
 * ProtocolService - Serviço para gerenciamento de protocolos de atendimento
 * 
 * Gerencia solicitações e atendimentos da secretaria.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

export interface ProtocolData {
  requester_person_id: number;
  request_type: string;
  description: string;
  priority?: string;
  student_profile_id?: number;
  school_id?: number;
}

class ProtocolService extends BaseService {
  constructor() {
    super('secretariat_protocols');
  }

  /**
   * Buscar protocolo com informações completas
   */
  async getProtocolFullInfo(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('secretariat_protocols')
        .select(`
          *,
          requester:people!requester_person_id(*),
          assigned_to_person:people!assigned_to_person_id(*),
          history:protocol_status_history(*),
          services:secretariat_services(*)
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
      console.error('Error in ProtocolService.getProtocolFullInfo:', error);
      throw error;
    }
  }

  /**
   * Criar protocolo
   */
  async createProtocol(data: ProtocolData): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Gerar número do protocolo
      const protocolNumber = `PROT-${Date.now()}`;

      const { data: protocol, error } = await supabase
        .from('secretariat_protocols')
        .insert({
          ...data,
          protocol_number: protocolNumber,
          status: 'Aberto',
          opening_date: new Date().toISOString(),
          created_by: user?.id || 1
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      // Registrar no histórico
      await this.addStatusHistory(protocol.id, 'Aberto', 'Protocolo criado');

      return protocol;
    } catch (error) {
      console.error('Error in ProtocolService.createProtocol:', error);
      throw error;
    }
  }

  /**
   * Atualizar status do protocolo
   */
  async updateStatus(protocolId: number, newStatus: string, notes?: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_by: user?.id || 1
      };

      if (newStatus === 'Resolvido') {
        updateData.resolution_date = new Date().toISOString();
      }

      const { data: protocol, error } = await supabase
        .from('secretariat_protocols')
        .update(updateData)
        .eq('id', protocolId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      // Registrar no histórico
      await this.addStatusHistory(protocolId, newStatus, notes);

      return protocol;
    } catch (error) {
      console.error('Error in ProtocolService.updateStatus:', error);
      throw error;
    }
  }

  /**
   * Adicionar ao histórico de status
   */
  async addStatusHistory(protocolId: number, status: string, notes?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('protocol_status_history')
        .insert({
          secretariat_protocol_id: protocolId,
          status,
          change_date: new Date().toISOString(),
          notes,
          created_by: user?.id || 1
        });

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in ProtocolService.addStatusHistory:', error);
      throw error;
    }
  }

  /**
   * Atribuir protocolo a um atendente
   */
  async assignProtocol(protocolId: number, personId: number): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('secretariat_protocols')
        .update({
          assigned_to_person_id: personId,
          status: 'Em_Analise',
          updated_by: user?.id || 1
        })
        .eq('id', protocolId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      await this.addStatusHistory(protocolId, 'Em_Analise', `Atribuído ao atendente ${personId}`);

      return data;
    } catch (error) {
      console.error('Error in ProtocolService.assignProtocol:', error);
      throw error;
    }
  }

  /**
   * Buscar protocolos por solicitante
   */
  async getByRequester(requesterId: number, status?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('secretariat_protocols')
        .select('*')
        .eq('requester_person_id', requesterId)
        .is('deleted_at', null);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('opening_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ProtocolService.getByRequester:', error);
      throw error;
    }
  }

  /**
   * Buscar protocolos por status
   */
  async getByStatus(status: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('secretariat_protocols')
        .select(`
          *,
          requester:people!requester_person_id(*)
        `)
        .eq('status', status)
        .is('deleted_at', null)
        .order('opening_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ProtocolService.getByStatus:', error);
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
    averageResolutionTime: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('secretariat_protocols')
        .select('status, request_type, opening_date, resolution_date')
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      const byStatus: Record<string, number> = {};
      const byType: Record<string, number> = {};
      let totalResolutionTime = 0;
      let resolvedCount = 0;

      (data || []).forEach((protocol: Record<string, unknown>) => {
        byStatus[protocol.status] = (byStatus[protocol.status] || 0) + 1;
        byType[protocol.request_type] = (byType[protocol.request_type] || 0) + 1;

        if (protocol.resolution_date && protocol.opening_date) {
          const openingTime = new Date(protocol.opening_date).getTime();
          const resolutionTime = new Date(protocol.resolution_date).getTime();
          totalResolutionTime += resolutionTime - openingTime;
          resolvedCount++;
        }
      });

      const averageResolutionTime = resolvedCount > 0
        ? Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60 * 24)) // em dias
        : 0;

      return {
        total: data?.length || 0,
        byStatus,
        byType,
        averageResolutionTime
      };
    } catch (error) {
      console.error('Error in ProtocolService.getStats:', error);
      throw error;
    }
  }
}

export const protocolService = new ProtocolService();
export default protocolService;

