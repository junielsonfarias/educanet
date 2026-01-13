/**
 * PreEnrollmentService - Serviço para gerenciamento de pré-matrículas online
 *
 * Implementa toda a lógica de pré-matrícula pelo portal público,
 * permitindo que famílias solicitem vagas antes do ano letivo.
 *
 * Regras:
 * - Público: qualquer situação (novos, transferências, troca)
 * - Escola: sistema sugere + família pode escolher
 * - Prioridade: 1º Vulnerabilidade (1000pts), 2º Proximidade (500pts), 3º Ordem (100pts)
 * - Período: configurável pelo administrador
 * - Confirmação: presencial obrigatória
 */

import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import { BaseService } from './base-service';

// ==================== TIPOS ====================

export type PreEnrollmentStatus =
  | 'Pendente'
  | 'Em_Analise'
  | 'Aprovada'
  | 'Lista_Espera'
  | 'Rejeitada'
  | 'Confirmada'
  | 'Nao_Compareceu'
  | 'Cancelada'
  | 'Matriculada';

export type PreEnrollmentType =
  | 'Aluno_Novo'
  | 'Transferencia_Externa'
  | 'Transferencia_Interna'
  | 'Retorno';

export type PriorityCriteria =
  | 'Vulnerabilidade_Social'
  | 'Proximidade'
  | 'Ordem_Inscricao';

// Interface do Período de Pré-Matrícula
export interface PreEnrollmentPeriod {
  id: number;
  name: string;
  description: string | null;
  academic_year_id: number;
  data_inicio: string;
  data_fim: string;
  data_resultado: string | null;
  is_active: boolean;
  permite_escolha_escola: boolean;
  max_opcoes_escola: number;
  dias_para_comparecer: number;
  criterios_prioridade: string[];
  total_solicitacoes: number;
  total_aprovadas: number;
  total_lista_espera: number;
  total_rejeitadas: number;
  created_at: string;
  updated_at: string;
}

// Interface da Pré-Matrícula
export interface PreEnrollment {
  id: number;
  period_id: number;
  protocolo: string;
  tipo: PreEnrollmentType;
  status: PreEnrollmentStatus;

  // Dados do aluno
  aluno_nome: string;
  aluno_data_nascimento: string;
  aluno_cpf: string | null;
  aluno_certidao_nascimento: string | null;
  aluno_sexo: string | null;
  aluno_cor_raca: string | null;
  aluno_deficiencia: boolean;
  aluno_tipo_deficiencia: string | null;

  // Escola de origem
  escola_origem_nome: string | null;
  escola_origem_cidade: string | null;
  escola_origem_estado: string | null;

  // Série desejada
  serie_desejada: string;
  turno_desejado: string | null;

  // Dados do responsável
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_rg: string | null;
  responsavel_telefone: string;
  responsavel_email: string | null;
  responsavel_parentesco: string | null;

  // Endereço
  endereco_cep: string;
  endereco_logradouro: string;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_estado: string;
  endereco_latitude: number | null;
  endereco_longitude: number | null;

  // Critérios de prioridade
  vulnerabilidade_social: boolean;
  nis_cadunico: string | null;
  comprovante_vulnerabilidade: boolean;

  // Pontuação calculada
  pontuacao_total: number;
  pontuacao_vulnerabilidade: number;
  pontuacao_proximidade: number;
  pontuacao_ordem: number;

  // Escola alocada
  escola_alocada_id: number | null;
  posicao_lista_espera: number | null;

  // Datas importantes
  data_solicitacao: string;
  data_analise: string | null;
  data_aprovacao: string | null;
  data_notificacao: string | null;
  data_limite_comparecimento: string | null;
  data_comparecimento: string | null;
  data_matricula: string | null;

  // Análise
  analisado_por: number | null;
  motivo_rejeicao: string | null;
  observacoes: string | null;

  // Resultado
  matricula_id: number | null;

  created_at: string;
  updated_at: string;
}

// Interface com detalhes relacionados
export interface PreEnrollmentWithDetails extends PreEnrollment {
  period?: PreEnrollmentPeriod;
  escola_alocada?: Record<string, unknown>;
  school_choices?: PreEnrollmentSchoolChoice[];
}

// Interface da escolha de escola
export interface PreEnrollmentSchoolChoice {
  id: number;
  pre_enrollment_id: number;
  school_id: number;
  ordem_preferencia: number;
  distancia_km: number | null;
  escola_sugerida: boolean;
  school?: Record<string, unknown>;
}

// Interface de vagas por escola
export interface SchoolVacancy {
  id: number;
  school_id: number;
  academic_year_id: number;
  serie: string;
  turno: string;
  vagas_totais: number;
  vagas_ocupadas: number;
  vagas_reservadas: number;
  vagas_disponiveis: number;
}

// Interface para área de cobertura
export interface SchoolCoverageArea {
  id: number;
  school_id: number;
  bairro: string;
  cep_inicio: string | null;
  cep_fim: string | null;
  prioridade: number;
}

// Interface para dados do formulário público
export interface CriarPreMatriculaData {
  // Tipo
  tipo?: PreEnrollmentType;

  // Dados do aluno
  aluno_nome: string;
  aluno_data_nascimento: string;
  aluno_cpf?: string;
  aluno_certidao_nascimento?: string;
  aluno_sexo?: string;
  serie_desejada: string;
  turno_desejado?: string;

  // Escola de origem (se transferência)
  escola_origem_nome?: string;
  escola_origem_cidade?: string;
  escola_origem_estado?: string;

  // Dados do responsável
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_telefone: string;
  responsavel_email?: string;
  responsavel_parentesco?: string;

  // Endereço
  endereco_cep: string;
  endereco_logradouro: string;
  endereco_numero?: string;
  endereco_bairro: string;
  endereco_cidade?: string;

  // Vulnerabilidade
  vulnerabilidade_social?: boolean;
  nis_cadunico?: string;

  // Preferências de escola (IDs)
  escolas_preferencia?: number[];
}

// Interface para acompanhamento público
export interface AcompanhamentoPreMatricula {
  protocolo: string;
  status: PreEnrollmentStatus;
  aluno_nome: string;
  serie_desejada: string;
  escola_alocada: string | null;
  posicao_lista_espera: number | null;
  data_solicitacao: string;
  data_aprovacao: string | null;
  data_limite_comparecimento: string | null;
  mensagem_status: string;
}

// ==================== SERVICE ====================

class PreEnrollmentServiceClass extends BaseService<PreEnrollment> {
  constructor() {
    super('pre_enrollments');
  }

  // ==================== PERÍODOS ====================

  /**
   * Buscar período ativo
   */
  async getPeriodoAtivo(): Promise<PreEnrollmentPeriod | null> {
    try {
      const { data, error } = await supabase
        .from('pre_enrollment_periods')
        .select('*')
        .eq('is_active', true)
        .lte('data_inicio', new Date().toISOString())
        .gte('data_fim', new Date().toISOString())
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw handleSupabaseError(error);
      }
      return data;
    } catch (error) {
      console.error('Error in PreEnrollmentService.getPeriodoAtivo:', error);
      throw error;
    }
  }

  /**
   * Buscar todos os períodos de um ano letivo
   */
  async getPeriodosByAnoLetivo(academicYearId: number): Promise<PreEnrollmentPeriod[]> {
    try {
      const { data, error } = await supabase
        .from('pre_enrollment_periods')
        .select('*')
        .eq('academic_year_id', academicYearId)
        .is('deleted_at', null)
        .order('data_inicio', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PreEnrollmentService.getPeriodosByAnoLetivo:', error);
      throw error;
    }
  }

  /**
   * Criar novo período de pré-matrícula
   */
  async criarPeriodo(periodo: Omit<PreEnrollmentPeriod, 'id' | 'created_at' | 'updated_at' | 'total_solicitacoes' | 'total_aprovadas' | 'total_lista_espera' | 'total_rejeitadas'>): Promise<PreEnrollmentPeriod> {
    try {
      const { data, error } = await supabase
        .from('pre_enrollment_periods')
        .insert(periodo)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error in PreEnrollmentService.criarPeriodo:', error);
      throw error;
    }
  }

  /**
   * Atualizar período
   */
  async atualizarPeriodo(id: number, updates: Partial<PreEnrollmentPeriod>): Promise<PreEnrollmentPeriod> {
    try {
      const { data, error } = await supabase
        .from('pre_enrollment_periods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error in PreEnrollmentService.atualizarPeriodo:', error);
      throw error;
    }
  }

  // ==================== CRIAR PRÉ-MATRÍCULA ====================

  /**
   * Criar pré-matrícula (usado pelo formulário público)
   */
  async criarPreMatricula(
    periodId: number,
    dados: CriarPreMatriculaData
  ): Promise<{ pre_enrollment_id: number; protocolo: string }> {
    try {
      const { data, error } = await supabase
        .rpc('fn_criar_pre_matricula', {
          p_period_id: periodId,
          p_dados: dados
        });

      if (error) throw handleSupabaseError(error);

      // A função retorna uma tabela, pegar primeiro resultado
      const result = Array.isArray(data) ? data[0] : data;
      return {
        pre_enrollment_id: result.pre_enrollment_id,
        protocolo: result.protocolo
      };
    } catch (error) {
      console.error('Error in PreEnrollmentService.criarPreMatricula:', error);
      throw error;
    }
  }

  // ==================== ACOMPANHAMENTO ====================

  /**
   * Acompanhar pré-matrícula por protocolo (público)
   */
  async acompanharPorProtocolo(protocolo: string): Promise<AcompanhamentoPreMatricula | null> {
    try {
      const { data, error } = await supabase
        .from('vw_acompanhamento_pre_matricula')
        .select('*')
        .eq('protocolo', protocolo)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw handleSupabaseError(error);
      }
      return data;
    } catch (error) {
      console.error('Error in PreEnrollmentService.acompanharPorProtocolo:', error);
      throw error;
    }
  }

  /**
   * Acompanhar pré-matrícula por CPF do responsável
   */
  async acompanharPorCpfResponsavel(cpf: string): Promise<AcompanhamentoPreMatricula[]> {
    try {
      const { data, error } = await supabase
        .from('vw_acompanhamento_pre_matricula')
        .select('*')
        .eq('responsavel_cpf', cpf)
        .order('data_solicitacao', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PreEnrollmentService.acompanharPorCpfResponsavel:', error);
      throw error;
    }
  }

  // ==================== BUSCAR PRÉ-MATRÍCULAS ====================

  /**
   * Buscar pré-matrícula com detalhes
   */
  async getWithDetails(id: number): Promise<PreEnrollmentWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          period:pre_enrollment_periods(*),
          escola_alocada:schools!escola_alocada_id(id, name, address),
          school_choices:pre_enrollment_school_choices(
            *,
            school:schools(id, name)
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
      console.error('Error in PreEnrollmentService.getWithDetails:', error);
      throw error;
    }
  }

  /**
   * Buscar pré-matrículas por período
   */
  async getByPeriodo(periodId: number, status?: PreEnrollmentStatus): Promise<PreEnrollmentWithDetails[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          escola_alocada:schools!escola_alocada_id(id, name)
        `)
        .eq('period_id', periodId)
        .is('deleted_at', null);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('pontuacao_total', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PreEnrollmentService.getByPeriodo:', error);
      throw error;
    }
  }

  /**
   * Buscar pré-matrículas por escola (alocadas ou na preferência)
   */
  async getByEscola(escolaId: number, status?: PreEnrollmentStatus): Promise<PreEnrollmentWithDetails[]> {
    try {
      // Primeiro buscar IDs das pré-matrículas que têm essa escola como escolha
      const { data: choices, error: choicesError } = await supabase
        .from('pre_enrollment_school_choices')
        .select('pre_enrollment_id')
        .eq('school_id', escolaId);

      if (choicesError) throw handleSupabaseError(choicesError);

      const choiceIds = choices?.map((c: Record<string, unknown>) => c.pre_enrollment_id) || [];

      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          escola_alocada:schools!escola_alocada_id(id, name),
          school_choices:pre_enrollment_school_choices(
            *,
            school:schools(id, name)
          )
        `)
        .is('deleted_at', null);

      // Buscar alocadas ou nas preferências
      if (choiceIds.length > 0) {
        query = query.or(`escola_alocada_id.eq.${escolaId},id.in.(${choiceIds.join(',')})`);
      } else {
        query = query.eq('escola_alocada_id', escolaId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('pontuacao_total', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PreEnrollmentService.getByEscola:', error);
      throw error;
    }
  }

  /**
   * Buscar pré-matrículas pendentes
   */
  async getPendentes(periodId?: number): Promise<PreEnrollmentWithDetails[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          school_choices:pre_enrollment_school_choices(
            *,
            school:schools(id, name)
          )
        `)
        .eq('status', 'Pendente')
        .is('deleted_at', null);

      if (periodId) {
        query = query.eq('period_id', periodId);
      }

      const { data, error } = await query.order('data_solicitacao', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PreEnrollmentService.getPendentes:', error);
      throw error;
    }
  }

  /**
   * Buscar lista de espera por escola e série
   */
  async getListaEspera(escolaId: number, serie: string): Promise<PreEnrollmentWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          escola_alocada:schools!escola_alocada_id(id, name)
        `)
        .eq('escola_alocada_id', escolaId)
        .eq('serie_desejada', serie)
        .eq('status', 'Lista_Espera')
        .is('deleted_at', null)
        .order('posicao_lista_espera', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PreEnrollmentService.getListaEspera:', error);
      throw error;
    }
  }

  // ==================== ANÁLISE E APROVAÇÃO ====================

  /**
   * Aprovar pré-matrícula
   */
  async aprovar(
    preEnrollmentId: number,
    escolaId: number,
    analisadoPor: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('fn_aprovar_pre_matricula', {
          p_pre_enrollment_id: preEnrollmentId,
          p_escola_id: escolaId,
          p_analisado_por: analisadoPor
        });

      if (error) throw handleSupabaseError(error);
      return data as boolean;
    } catch (error) {
      console.error('Error in PreEnrollmentService.aprovar:', error);
      throw error;
    }
  }

  /**
   * Colocar em lista de espera
   */
  async colocarListaEspera(
    preEnrollmentId: number,
    escolaId: number,
    analisadoPor: number
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('fn_lista_espera_pre_matricula', {
          p_pre_enrollment_id: preEnrollmentId,
          p_escola_id: escolaId,
          p_analisado_por: analisadoPor
        });

      if (error) throw handleSupabaseError(error);
      return data as number; // Retorna posição na lista
    } catch (error) {
      console.error('Error in PreEnrollmentService.colocarListaEspera:', error);
      throw error;
    }
  }

  /**
   * Rejeitar pré-matrícula
   */
  async rejeitar(
    preEnrollmentId: number,
    motivo: string,
    analisadoPor: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('fn_rejeitar_pre_matricula', {
          p_pre_enrollment_id: preEnrollmentId,
          p_motivo: motivo,
          p_analisado_por: analisadoPor
        });

      if (error) throw handleSupabaseError(error);
      return data as boolean;
    } catch (error) {
      console.error('Error in PreEnrollmentService.rejeitar:', error);
      throw error;
    }
  }

  /**
   * Confirmar comparecimento e efetivar matrícula
   */
  async confirmarComparecimento(
    preEnrollmentId: number,
    confirmadoPor: number
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('fn_confirmar_comparecimento', {
          p_pre_enrollment_id: preEnrollmentId,
          p_confirmado_por: confirmadoPor
        });

      if (error) throw handleSupabaseError(error);
      return data as number; // Retorna ID da matrícula criada
    } catch (error) {
      console.error('Error in PreEnrollmentService.confirmarComparecimento:', error);
      throw error;
    }
  }

  /**
   * Cancelar pré-matrícula
   */
  async cancelar(preEnrollmentId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          status: 'Cancelada',
          updated_at: new Date().toISOString()
        })
        .eq('id', preEnrollmentId)
        .in('status', ['Pendente', 'Em_Analise']);

      if (error) throw handleSupabaseError(error);
      return true;
    } catch (error) {
      console.error('Error in PreEnrollmentService.cancelar:', error);
      throw error;
    }
  }

  // ==================== VAGAS ====================

  /**
   * Buscar escolas com vagas
   */
  async buscarEscolasComVagas(
    academicYearId: number,
    serie: string,
    turno?: string,
    bairro?: string
  ): Promise<{
    school_id: number;
    school_name: string;
    vagas_disponiveis: number;
    distancia_prioridade: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .rpc('fn_buscar_escolas_com_vagas', {
          p_academic_year_id: academicYearId,
          p_serie: serie,
          p_turno: turno || null,
          p_bairro: bairro || null
        });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PreEnrollmentService.buscarEscolasComVagas:', error);
      throw error;
    }
  }

  /**
   * Buscar vagas por escola
   */
  async getVagasByEscola(escolaId: number, academicYearId?: number): Promise<SchoolVacancy[]> {
    try {
      let query = supabase
        .from('school_vacancies')
        .select('*')
        .eq('school_id', escolaId);

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId);
      }

      const { data, error } = await query.order('serie');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PreEnrollmentService.getVagasByEscola:', error);
      throw error;
    }
  }

  /**
   * Atualizar vagas
   */
  async atualizarVagas(
    escolaId: number,
    academicYearId: number,
    serie: string,
    turno: string,
    vagasTotais: number
  ): Promise<SchoolVacancy> {
    try {
      const { data, error } = await supabase
        .from('school_vacancies')
        .upsert({
          school_id: escolaId,
          academic_year_id: academicYearId,
          serie,
          turno,
          vagas_totais: vagasTotais
        }, {
          onConflict: 'school_id,academic_year_id,serie,turno'
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error in PreEnrollmentService.atualizarVagas:', error);
      throw error;
    }
  }

  // ==================== ÁREAS DE COBERTURA ====================

  /**
   * Buscar áreas de cobertura de uma escola
   */
  async getAreasCobertura(escolaId: number): Promise<SchoolCoverageArea[]> {
    try {
      const { data, error } = await supabase
        .from('school_coverage_areas')
        .select('*')
        .eq('school_id', escolaId)
        .order('prioridade');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in PreEnrollmentService.getAreasCobertura:', error);
      throw error;
    }
  }

  /**
   * Buscar escolas que cobrem um bairro
   */
  async getEscolasPorBairro(bairro: string): Promise<{
    school_id: number;
    school_name: string;
    prioridade: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('school_coverage_areas')
        .select(`
          school_id,
          prioridade,
          school:schools(name)
        `)
        .ilike('bairro', bairro);

      if (error) throw handleSupabaseError(error);

      return (data || []).map((item: Record<string, unknown>) => ({
        school_id: item.school_id as number,
        school_name: (item.school as Record<string, unknown>)?.name as string,
        prioridade: item.prioridade as number
      }));
    } catch (error) {
      console.error('Error in PreEnrollmentService.getEscolasPorBairro:', error);
      throw error;
    }
  }

  /**
   * Adicionar área de cobertura
   */
  async adicionarAreaCobertura(area: Omit<SchoolCoverageArea, 'id' | 'created_at'>): Promise<SchoolCoverageArea> {
    try {
      const { data, error } = await supabase
        .from('school_coverage_areas')
        .insert(area)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error in PreEnrollmentService.adicionarAreaCobertura:', error);
      throw error;
    }
  }

  // ==================== ESTATÍSTICAS ====================

  /**
   * Estatísticas por período
   */
  async getEstatisticasPeriodo(periodId: number): Promise<{
    total: number;
    por_status: Record<PreEnrollmentStatus, number>;
    por_serie: Record<string, number>;
    por_bairro: Record<string, number>;
    vulnerabilidade: number;
  }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('status, serie_desejada, endereco_bairro, vulnerabilidade_social')
        .eq('period_id', periodId)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      const stats = {
        total: data?.length || 0,
        por_status: {} as Record<PreEnrollmentStatus, number>,
        por_serie: {} as Record<string, number>,
        por_bairro: {} as Record<string, number>,
        vulnerabilidade: 0
      };

      data?.forEach((item: Record<string, unknown>) => {
        // Por status
        const status = item.status as PreEnrollmentStatus;
        stats.por_status[status] = (stats.por_status[status] || 0) + 1;

        // Por série
        const serie = item.serie_desejada as string;
        stats.por_serie[serie] = (stats.por_serie[serie] || 0) + 1;

        // Por bairro
        const bairro = item.endereco_bairro as string;
        stats.por_bairro[bairro] = (stats.por_bairro[bairro] || 0) + 1;

        // Vulnerabilidade
        if (item.vulnerabilidade_social) {
          stats.vulnerabilidade++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in PreEnrollmentService.getEstatisticasPeriodo:', error);
      throw error;
    }
  }

  /**
   * Estatísticas por escola
   */
  async getEstatisticasEscola(escolaId: number, periodId?: number): Promise<{
    total_alocadas: number;
    total_lista_espera: number;
    total_matriculadas: number;
    por_serie: Record<string, {
      aprovadas: number;
      lista_espera: number;
      matriculadas: number;
    }>;
  }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('status, serie_desejada')
        .eq('escola_alocada_id', escolaId)
        .is('deleted_at', null);

      if (periodId) {
        query = query.eq('period_id', periodId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      const stats = {
        total_alocadas: 0,
        total_lista_espera: 0,
        total_matriculadas: 0,
        por_serie: {} as Record<string, {
          aprovadas: number;
          lista_espera: number;
          matriculadas: number;
        }>
      };

      data?.forEach((item: Record<string, unknown>) => {
        const status = item.status as PreEnrollmentStatus;
        const serie = item.serie_desejada as string;

        if (!stats.por_serie[serie]) {
          stats.por_serie[serie] = { aprovadas: 0, lista_espera: 0, matriculadas: 0 };
        }

        if (status === 'Aprovada' || status === 'Confirmada') {
          stats.total_alocadas++;
          stats.por_serie[serie].aprovadas++;
        } else if (status === 'Lista_Espera') {
          stats.total_lista_espera++;
          stats.por_serie[serie].lista_espera++;
        } else if (status === 'Matriculada') {
          stats.total_matriculadas++;
          stats.por_serie[serie].matriculadas++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in PreEnrollmentService.getEstatisticasEscola:', error);
      throw error;
    }
  }

  // ==================== RECÁLCULO ====================

  /**
   * Recalcular pontuação de uma pré-matrícula
   */
  async recalcularPontuacao(preEnrollmentId: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('fn_calcular_pontuacao_pre_matricula', {
          p_pre_enrollment_id: preEnrollmentId
        });

      if (error) throw handleSupabaseError(error);
      return data as number;
    } catch (error) {
      console.error('Error in PreEnrollmentService.recalcularPontuacao:', error);
      throw error;
    }
  }

  /**
   * Recalcular pontuação de todas as pré-matrículas de um período
   */
  async recalcularPontuacaoPeriodo(periodId: number): Promise<number> {
    try {
      // Buscar todas as pré-matrículas do período
      const { data: preEnrollments, error: fetchError } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('period_id', periodId)
        .is('deleted_at', null);

      if (fetchError) throw handleSupabaseError(fetchError);

      // Recalcular cada uma
      let count = 0;
      for (const pre of (preEnrollments || [])) {
        await this.recalcularPontuacao(pre.id);
        count++;
      }

      return count;
    } catch (error) {
      console.error('Error in PreEnrollmentService.recalcularPontuacaoPeriodo:', error);
      throw error;
    }
  }
}

// Exportar instância singleton
export const preEnrollmentService = new PreEnrollmentServiceClass();

// Exportar classe para testes
export { PreEnrollmentServiceClass };
