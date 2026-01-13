/**
 * TransferService - Serviço para gerenciamento de transferências de alunos
 *
 * Implementa toda a lógica de transferência interna (entre escolas do município)
 * e externa (saída/entrada de outros municípios).
 */

import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import { BaseService } from './base-service';

// Tipos
export type TransferStatus =
  | 'Pendente'
  | 'Aprovada'
  | 'Efetivada'
  | 'Rejeitada'
  | 'Cancelada';

export type TransferType =
  | 'Interna'
  | 'Externa_Saida'
  | 'Externa_Entrada';

export interface Transfer {
  id: number;
  student_profile_id: number;
  escola_origem_id: number;
  escola_destino_id: number | null;
  matricula_origem_id: number;
  matricula_destino_id: number | null;
  transfer_type: TransferType;
  status: TransferStatus;
  data_solicitacao: string;
  data_aprovacao: string | null;
  data_efetivacao: string | null;
  data_cancelamento: string | null;
  solicitante_id: number;
  aprovador_id: number | null;
  motivo: string | null;
  motivo_rejeicao: string | null;
  observacoes: string | null;
  cidade_destino: string | null;
  estado_destino: string | null;
  escola_destino_nome: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransferWithDetails extends Transfer {
  student?: Record<string, unknown>;
  escola_origem?: Record<string, unknown>;
  escola_destino?: Record<string, unknown>;
  solicitante?: Record<string, unknown>;
  aprovador?: Record<string, unknown>;
}

export interface SolicitarTransferenciaData {
  studentProfileId: number;
  escolaDestinoId: number;
  motivo?: string;
}

export interface TransferenciaExternaSaidaData {
  studentProfileId: number;
  cidadeDestino: string;
  estadoDestino: string;
  escolaDestinoNome?: string;
  motivo?: string;
}

class TransferServiceClass extends BaseService<Transfer> {
  constructor() {
    super('student_transfers');
  }

  // ==================== BUSCAR ====================

  /**
   * Buscar transferências por escola origem
   */
  async getByEscolaOrigem(escolaId: number): Promise<TransferWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          student:student_profiles(
            id,
            person:people(first_name, last_name)
          ),
          escola_origem:schools!escola_origem_id(id, name),
          escola_destino:schools!escola_destino_id(id, name),
          solicitante:people!solicitante_id(first_name, last_name)
        `)
        .eq('escola_origem_id', escolaId)
        .is('deleted_at', null)
        .order('data_solicitacao', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in TransferService.getByEscolaOrigem:', error);
      throw error;
    }
  }

  /**
   * Buscar transferências por escola destino (pendentes de aprovação)
   */
  async getByEscolaDestino(escolaId: number, status?: TransferStatus): Promise<TransferWithDetails[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          student:student_profiles(
            id,
            person:people(first_name, last_name)
          ),
          escola_origem:schools!escola_origem_id(id, name),
          escola_destino:schools!escola_destino_id(id, name),
          solicitante:people!solicitante_id(first_name, last_name)
        `)
        .eq('escola_destino_id', escolaId)
        .is('deleted_at', null);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('data_solicitacao', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in TransferService.getByEscolaDestino:', error);
      throw error;
    }
  }

  /**
   * Buscar transferências pendentes de aprovação para uma escola
   */
  async getPendentesAprovacao(escolaId: number): Promise<TransferWithDetails[]> {
    return this.getByEscolaDestino(escolaId, 'Pendente');
  }

  /**
   * Buscar transferência por ID com detalhes
   */
  async getTransferFullInfo(id: number): Promise<TransferWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          student:student_profiles(
            id,
            person:people(*)
          ),
          escola_origem:schools!escola_origem_id(*),
          escola_destino:schools!escola_destino_id(*),
          solicitante:people!solicitante_id(*),
          aprovador:people!aprovador_id(*)
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
      console.error('Error in TransferService.getTransferFullInfo:', error);
      throw error;
    }
  }

  /**
   * Buscar transferências de um aluno
   */
  async getByStudent(studentProfileId: number): Promise<TransferWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          escola_origem:schools!escola_origem_id(id, name),
          escola_destino:schools!escola_destino_id(id, name)
        `)
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null)
        .order('data_solicitacao', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in TransferService.getByStudent:', error);
      throw error;
    }
  }

  /**
   * Buscar transferências por polo (todas as escolas do polo)
   */
  async getByPolo(poloId: number, status?: TransferStatus): Promise<TransferWithDetails[]> {
    try {
      // Primeiro buscar escolas do polo
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('id')
        .eq('polo_id', poloId)
        .is('deleted_at', null);

      if (schoolsError) throw handleSupabaseError(schoolsError);

      const schoolIds = schools?.map((s: Record<string, unknown>) => s.id) || [];

      if (schoolIds.length === 0) return [];

      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          student:student_profiles(
            id,
            person:people(first_name, last_name)
          ),
          escola_origem:schools!escola_origem_id(id, name),
          escola_destino:schools!escola_destino_id(id, name)
        `)
        .or(`escola_origem_id.in.(${schoolIds.join(',')}),escola_destino_id.in.(${schoolIds.join(',')})`)
        .is('deleted_at', null);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('data_solicitacao', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in TransferService.getByPolo:', error);
      throw error;
    }
  }

  // ==================== TRANSFERÊNCIA INTERNA ====================

  /**
   * Solicitar transferência interna (entre escolas do município)
   */
  async solicitarTransferenciaInterna(
    data: SolicitarTransferenciaData,
    solicitanteId: number
  ): Promise<number> {
    try {
      const { data: result, error } = await supabase
        .rpc('solicitar_transferencia_interna', {
          p_student_profile_id: data.studentProfileId,
          p_escola_destino_id: data.escolaDestinoId,
          p_solicitante_id: solicitanteId,
          p_motivo: data.motivo || null
        });

      if (error) throw handleSupabaseError(error);
      return result as number;
    } catch (error) {
      console.error('Error in TransferService.solicitarTransferenciaInterna:', error);
      throw error;
    }
  }

  /**
   * Aprovar transferência
   */
  async aprovarTransferencia(transferId: number, aprovadorId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('aprovar_transferencia', {
          p_transfer_id: transferId,
          p_aprovador_id: aprovadorId
        });

      if (error) throw handleSupabaseError(error);
      return data as boolean;
    } catch (error) {
      console.error('Error in TransferService.aprovarTransferencia:', error);
      throw error;
    }
  }

  /**
   * Efetivar transferência (após aprovação)
   */
  async efetivarTransferencia(transferId: number, turmaId?: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('efetivar_transferencia', {
          p_transfer_id: transferId,
          p_turma_id: turmaId || null
        });

      if (error) throw handleSupabaseError(error);
      return data as number;
    } catch (error) {
      console.error('Error in TransferService.efetivarTransferencia:', error);
      throw error;
    }
  }

  /**
   * Rejeitar transferência
   */
  async rejeitarTransferencia(
    transferId: number,
    aprovadorId: number,
    motivoRejeicao: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('rejeitar_transferencia', {
          p_transfer_id: transferId,
          p_aprovador_id: aprovadorId,
          p_motivo_rejeicao: motivoRejeicao
        });

      if (error) throw handleSupabaseError(error);
      return data as boolean;
    } catch (error) {
      console.error('Error in TransferService.rejeitarTransferencia:', error);
      throw error;
    }
  }

  /**
   * Cancelar transferência (pela escola origem)
   */
  async cancelarTransferencia(transferId: number, solicitanteId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('cancelar_transferencia', {
          p_transfer_id: transferId,
          p_solicitante_id: solicitanteId
        });

      if (error) throw handleSupabaseError(error);
      return data as boolean;
    } catch (error) {
      console.error('Error in TransferService.cancelarTransferencia:', error);
      throw error;
    }
  }

  // ==================== TRANSFERÊNCIA EXTERNA ====================

  /**
   * Registrar transferência externa de saída
   */
  async registrarTransferenciaExternaSaida(
    data: TransferenciaExternaSaidaData,
    solicitanteId: number
  ): Promise<number> {
    try {
      // Buscar matrícula ativa do aluno
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id, school_id')
        .eq('student_profile_id', data.studentProfileId)
        .eq('enrollment_status', 'Ativo')
        .is('deleted_at', null)
        .single();

      if (enrollmentError) throw handleSupabaseError(enrollmentError);

      // Criar registro de transferência externa
      const { data: transfer, error } = await supabase
        .from(this.tableName)
        .insert({
          student_profile_id: data.studentProfileId,
          escola_origem_id: enrollment.school_id,
          escola_destino_id: null,
          matricula_origem_id: enrollment.id,
          transfer_type: 'Externa_Saida',
          status: 'Efetivada',
          data_solicitacao: new Date().toISOString(),
          data_efetivacao: new Date().toISOString(),
          solicitante_id: solicitanteId,
          motivo: data.motivo,
          cidade_destino: data.cidadeDestino,
          estado_destino: data.estadoDestino,
          escola_destino_nome: data.escolaDestinoNome,
          created_by: solicitanteId
        })
        .select('id')
        .single();

      if (error) throw handleSupabaseError(error);

      // Atualizar matrícula como transferida externa
      await supabase
        .from('student_enrollments')
        .update({
          enrollment_status: 'Transferido_Externo',
          transferencia_id: transfer.id,
          data_fim: new Date().toISOString()
        })
        .eq('id', enrollment.id);

      return transfer.id;
    } catch (error) {
      console.error('Error in TransferService.registrarTransferenciaExternaSaida:', error);
      throw error;
    }
  }

  // ==================== ESTATÍSTICAS ====================

  /**
   * Contar transferências por status
   */
  async countByStatus(escolaId?: number): Promise<Record<TransferStatus, number>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('status')
        .is('deleted_at', null);

      if (escolaId) {
        query = query.or(`escola_origem_id.eq.${escolaId},escola_destino_id.eq.${escolaId}`);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      const counts: Record<TransferStatus, number> = {
        'Pendente': 0,
        'Aprovada': 0,
        'Efetivada': 0,
        'Rejeitada': 0,
        'Cancelada': 0
      };

      data?.forEach((item: Record<string, unknown>) => {
        const status = item.status as TransferStatus;
        if (counts[status] !== undefined) {
          counts[status]++;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error in TransferService.countByStatus:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de transferências por período
   */
  async getStatsByPeriod(
    dataInicio: string,
    dataFim: string,
    escolaId?: number
  ): Promise<{
    total: number;
    internas: number;
    externasSaida: number;
    externasEntrada: number;
    pendentes: number;
    efetivadas: number;
  }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('transfer_type, status')
        .gte('data_solicitacao', dataInicio)
        .lte('data_solicitacao', dataFim)
        .is('deleted_at', null);

      if (escolaId) {
        query = query.or(`escola_origem_id.eq.${escolaId},escola_destino_id.eq.${escolaId}`);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      const stats = {
        total: data?.length || 0,
        internas: 0,
        externasSaida: 0,
        externasEntrada: 0,
        pendentes: 0,
        efetivadas: 0
      };

      data?.forEach((item: Record<string, unknown>) => {
        if (item.transfer_type === 'Interna') stats.internas++;
        if (item.transfer_type === 'Externa_Saida') stats.externasSaida++;
        if (item.transfer_type === 'Externa_Entrada') stats.externasEntrada++;
        if (item.status === 'Pendente') stats.pendentes++;
        if (item.status === 'Efetivada') stats.efetivadas++;
      });

      return stats;
    } catch (error) {
      console.error('Error in TransferService.getStatsByPeriod:', error);
      throw error;
    }
  }

  // ==================== VIEWS ====================

  /**
   * Buscar alunos por escola com data de corte (para estatísticas)
   */
  async getAlunosPorEscolaComDataCorte(
    escolaId: number,
    dataReferencia?: string
  ): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await supabase
        .from('vw_alunos_por_escola_data_corte')
        .select('*')
        .eq('school_id', escolaId);

      if (error) throw handleSupabaseError(error);

      // Filtrar por data de referência se fornecida
      if (dataReferencia) {
        return (data || []).filter((aluno: Record<string, unknown>) => {
          const dataMatricula = new Date(aluno.data_matricula as string);
          const dataRef = new Date(dataReferencia);
          const dataCorte = aluno.data_corte_estatisticas
            ? new Date(aluno.data_corte_estatisticas as string)
            : null;

          return dataMatricula <= dataRef && (!dataCorte || dataRef < dataCorte);
        });
      }

      return data || [];
    } catch (error) {
      console.error('Error in TransferService.getAlunosPorEscolaComDataCorte:', error);
      throw error;
    }
  }

  /**
   * Buscar contagem de alunos em uma data específica
   */
  async getContagemAlunosEscola(
    escolaId: number,
    dataReferencia?: string
  ): Promise<{
    total_alunos: number;
    alunos_ativos: number;
    alunos_transferidos: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('fn_contagem_alunos_escola', {
          p_school_id: escolaId,
          p_data_referencia: dataReferencia || new Date().toISOString().split('T')[0]
        });

      if (error) throw handleSupabaseError(error);

      return data?.[0] || {
        total_alunos: 0,
        alunos_ativos: 0,
        alunos_transferidos: 0
      };
    } catch (error) {
      console.error('Error in TransferService.getContagemAlunosEscola:', error);
      throw error;
    }
  }

  /**
   * Buscar frequência consolidada do aluno
   */
  async getFrequenciaConsolidadaAluno(
    studentProfileId: number,
    academicYearId?: number
  ): Promise<{
    total_aulas: number;
    presencas: number;
    faltas: number;
    percentual_geral: number;
    atinge_minimo: boolean;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('fn_frequencia_consolidada_aluno', {
          p_student_profile_id: studentProfileId,
          p_academic_year_id: academicYearId || null
        });

      if (error) throw handleSupabaseError(error);

      return data?.[0] || {
        total_aulas: 0,
        presencas: 0,
        faltas: 0,
        percentual_geral: 0,
        atinge_minimo: false
      };
    } catch (error) {
      console.error('Error in TransferService.getFrequenciaConsolidadaAluno:', error);
      throw error;
    }
  }
}

// Exportar instância singleton
export const transferService = new TransferServiceClass();

// Exportar classe para testes
export { TransferServiceClass };
