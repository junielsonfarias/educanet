/**
 * ReenrollmentService - Serviço para gerenciamento de rematrícula automática
 *
 * Implementa toda a lógica de rematrícula de alunos para o próximo ano letivo,
 * executada pelo Coordenador ou Administrativo da escola após o fechamento do ano.
 *
 * Regras:
 * - Aprovados: avançam de série
 * - Reprovados: mantêm a série
 * - Concluíram ciclo: não rematricula (status Concluído)
 * - Se escola não tem série: busca outra do polo
 */

import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import { BaseService } from './base-service';

// ==================== TIPOS ====================

export type ReenrollmentStatus =
  | 'Pendente'
  | 'Em_Processamento'
  | 'Concluido'
  | 'Cancelado';

export type ReenrollmentItemStatus =
  | 'Pendente'
  | 'Rematriculado'
  | 'Concluido_Ciclo'
  | 'Necessita_Escola'
  | 'Erro'
  | 'Excluido';

export type StudentFinalResult =
  | 'Aprovado'
  | 'Reprovado'
  | 'Aprovado_Conselho'
  | 'Concluido'
  | 'Desistente'
  | 'Transferido';

// Interface do Lote de Rematrícula
export interface ReenrollmentBatch {
  id: number;
  school_id: number;
  ano_letivo_origem_id: number;
  ano_letivo_destino_id: number;
  status: ReenrollmentStatus;
  total_alunos: number;
  total_rematriculados: number;
  total_concluidos: number;
  total_pendentes: number;
  total_erros: number;
  data_criacao: string;
  data_execucao: string | null;
  data_conclusao: string | null;
  criado_por: number;
  executado_por: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// Interface com detalhes relacionados
export interface ReenrollmentBatchWithDetails extends ReenrollmentBatch {
  school?: Record<string, unknown>;
  ano_letivo_origem?: Record<string, unknown>;
  ano_letivo_destino?: Record<string, unknown>;
  criador?: Record<string, unknown>;
  executor?: Record<string, unknown>;
  items?: ReenrollmentItemWithDetails[];
}

// Interface do Item de Rematrícula
export interface ReenrollmentItem {
  id: number;
  batch_id: number;
  student_profile_id: number;
  matricula_origem_id: number;
  serie_atual: string;
  resultado_final: StudentFinalResult | null;
  serie_destino: string | null;
  escola_destino_id: number | null;
  escola_destino_sugerida: boolean;
  status: ReenrollmentItemStatus;
  motivo_status: string | null;
  matricula_destino_id: number | null;
  created_at: string;
  updated_at: string;
}

// Interface do Item com detalhes
export interface ReenrollmentItemWithDetails extends ReenrollmentItem {
  student?: {
    id: number;
    person?: {
      first_name: string;
      last_name: string;
    };
  };
  escola_destino?: Record<string, unknown>;
  matricula_origem?: Record<string, unknown>;
  matricula_destino?: Record<string, unknown>;
}

// Interface de Série/Ano
export interface EducationGrade {
  id: number;
  education_level: string;
  grade_name: string;
  grade_order: number;
  is_final_grade: boolean;
  next_grade_id: number | null;
}

// Interface de Nível por Escola
export interface SchoolEducationLevel {
  id: number;
  school_id: number;
  education_level: string;
  is_active: boolean;
  created_at: string;
}

// Interface para prévia de rematrícula
export interface PreviaRematricula {
  school_id: number;
  school_name: string;
  academic_year_id: number;
  ano_letivo: string;
  enrollment_id: number;
  student_profile_id: number;
  student_name: string;
  serie_atual: string;
  resultado_final: StudentFinalResult | null;
  serie_destino: string;
  concluiu_ciclo: boolean;
  precisa_trocar_escola: boolean;
}

// Interface para resultado de execução
export interface ResultadoExecucao {
  total_processados: number;
  total_sucesso: number;
  total_erros: number;
}

// ==================== SERVICE ====================

class ReenrollmentServiceClass extends BaseService<ReenrollmentBatch> {
  constructor() {
    super('reenrollment_batches');
  }

  // ==================== SÉRIES (GRADES) ====================

  /**
   * Buscar todas as séries
   */
  async getAllGrades(): Promise<EducationGrade[]> {
    try {
      const { data, error } = await supabase
        .from('education_grades')
        .select('*')
        .order('education_level')
        .order('grade_order');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ReenrollmentService.getAllGrades:', error);
      throw error;
    }
  }

  /**
   * Buscar séries por nível de ensino
   */
  async getGradesByLevel(educationLevel: string): Promise<EducationGrade[]> {
    try {
      const { data, error } = await supabase
        .from('education_grades')
        .select('*')
        .eq('education_level', educationLevel)
        .order('grade_order');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ReenrollmentService.getGradesByLevel:', error);
      throw error;
    }
  }

  /**
   * Calcular próxima série
   */
  async getProximaSerie(
    serieAtual: string,
    resultado: StudentFinalResult
  ): Promise<{
    proxima_serie: string;
    is_final: boolean;
    education_level: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .rpc('fn_get_proxima_serie', {
          p_serie_atual: serieAtual,
          p_resultado: resultado
        });

      if (error) throw handleSupabaseError(error);
      return data?.[0] || null;
    } catch (error) {
      console.error('Error in ReenrollmentService.getProximaSerie:', error);
      throw error;
    }
  }

  // ==================== NÍVEIS POR ESCOLA ====================

  /**
   * Buscar níveis de ensino de uma escola
   */
  async getNiveisEscola(escolaId: number): Promise<SchoolEducationLevel[]> {
    try {
      const { data, error } = await supabase
        .from('school_education_levels')
        .select('*')
        .eq('school_id', escolaId)
        .eq('is_active', true)
        .order('education_level');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ReenrollmentService.getNiveisEscola:', error);
      throw error;
    }
  }

  /**
   * Adicionar nível de ensino a uma escola
   */
  async adicionarNivelEscola(
    escolaId: number,
    educationLevel: string
  ): Promise<SchoolEducationLevel> {
    try {
      const { data, error } = await supabase
        .from('school_education_levels')
        .upsert({
          school_id: escolaId,
          education_level: educationLevel,
          is_active: true
        }, {
          onConflict: 'school_id,education_level'
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data;
    } catch (error) {
      console.error('Error in ReenrollmentService.adicionarNivelEscola:', error);
      throw error;
    }
  }

  /**
   * Remover nível de ensino de uma escola
   */
  async removerNivelEscola(escolaId: number, educationLevel: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('school_education_levels')
        .update({ is_active: false })
        .eq('school_id', escolaId)
        .eq('education_level', educationLevel);

      if (error) throw handleSupabaseError(error);
      return true;
    } catch (error) {
      console.error('Error in ReenrollmentService.removerNivelEscola:', error);
      throw error;
    }
  }

  /**
   * Buscar escolas por nível de ensino
   */
  async getEscolasPorNivel(educationLevel: string): Promise<{
    school_id: number;
    school_name: string;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('school_education_levels')
        .select(`
          school_id,
          school:schools(name)
        `)
        .eq('education_level', educationLevel)
        .eq('is_active', true);

      if (error) throw handleSupabaseError(error);

      return (data || []).map((item: Record<string, unknown>) => ({
        school_id: item.school_id as number,
        school_name: (item.school as Record<string, unknown>)?.name as string
      }));
    } catch (error) {
      console.error('Error in ReenrollmentService.getEscolasPorNivel:', error);
      throw error;
    }
  }

  // ==================== PRÉVIA DE REMATRÍCULA ====================

  /**
   * Buscar prévia de rematrícula de uma escola
   */
  async getPreviaRematricula(
    escolaId: number,
    academicYearId: number
  ): Promise<PreviaRematricula[]> {
    try {
      const { data, error } = await supabase
        .from('vw_previa_rematricula')
        .select('*')
        .eq('school_id', escolaId)
        .eq('academic_year_id', academicYearId);

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ReenrollmentService.getPreviaRematricula:', error);
      throw error;
    }
  }

  /**
   * Resumo da prévia de rematrícula
   */
  async getResumoPreviaRematricula(
    escolaId: number,
    academicYearId: number
  ): Promise<{
    total_alunos: number;
    total_aprovados: number;
    total_reprovados: number;
    total_concluidos: number;
    total_trocam_escola: number;
    por_serie_destino: Record<string, number>;
  }> {
    try {
      const previa = await this.getPreviaRematricula(escolaId, academicYearId);

      const resumo = {
        total_alunos: previa.length,
        total_aprovados: 0,
        total_reprovados: 0,
        total_concluidos: 0,
        total_trocam_escola: 0,
        por_serie_destino: {} as Record<string, number>
      };

      previa.forEach((item) => {
        // Contagem por resultado
        if (item.resultado_final === 'Aprovado' || item.resultado_final === 'Aprovado_Conselho') {
          resumo.total_aprovados++;
        } else if (item.resultado_final === 'Reprovado') {
          resumo.total_reprovados++;
        }

        // Concluíram ciclo
        if (item.concluiu_ciclo) {
          resumo.total_concluidos++;
        }

        // Precisam trocar de escola
        if (item.precisa_trocar_escola) {
          resumo.total_trocam_escola++;
        }

        // Por série destino
        if (item.serie_destino) {
          resumo.por_serie_destino[item.serie_destino] =
            (resumo.por_serie_destino[item.serie_destino] || 0) + 1;
        }
      });

      return resumo;
    } catch (error) {
      console.error('Error in ReenrollmentService.getResumoPreviaRematricula:', error);
      throw error;
    }
  }

  // ==================== LOTES DE REMATRÍCULA ====================

  /**
   * Criar lote de rematrícula
   */
  async criarLote(
    escolaId: number,
    anoOrigemId: number,
    anoDestinoId: number,
    criadoPor: number
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('fn_criar_lote_rematricula', {
          p_school_id: escolaId,
          p_ano_origem_id: anoOrigemId,
          p_ano_destino_id: anoDestinoId,
          p_criado_por: criadoPor
        });

      if (error) throw handleSupabaseError(error);
      return data as number;
    } catch (error) {
      console.error('Error in ReenrollmentService.criarLote:', error);
      throw error;
    }
  }

  /**
   * Buscar lote com detalhes
   */
  async getLoteWithDetails(id: number): Promise<ReenrollmentBatchWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          school:schools(id, name),
          ano_letivo_origem:academic_years!ano_letivo_origem_id(id, year_name),
          ano_letivo_destino:academic_years!ano_letivo_destino_id(id, year_name),
          criador:people!criado_por(first_name, last_name),
          executor:people!executado_por(first_name, last_name)
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
      console.error('Error in ReenrollmentService.getLoteWithDetails:', error);
      throw error;
    }
  }

  /**
   * Buscar lotes por escola
   */
  async getLotesByEscola(escolaId: number): Promise<ReenrollmentBatchWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          ano_letivo_origem:academic_years!ano_letivo_origem_id(id, year_name),
          ano_letivo_destino:academic_years!ano_letivo_destino_id(id, year_name)
        `)
        .eq('school_id', escolaId)
        .is('deleted_at', null)
        .order('data_criacao', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ReenrollmentService.getLotesByEscola:', error);
      throw error;
    }
  }

  /**
   * Buscar lotes pendentes
   */
  async getLotesPendentes(escolaId?: number): Promise<ReenrollmentBatchWithDetails[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          school:schools(id, name),
          ano_letivo_origem:academic_years!ano_letivo_origem_id(id, year_name),
          ano_letivo_destino:academic_years!ano_letivo_destino_id(id, year_name)
        `)
        .eq('status', 'Pendente')
        .is('deleted_at', null);

      if (escolaId) {
        query = query.eq('school_id', escolaId);
      }

      const { data, error } = await query.order('data_criacao', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ReenrollmentService.getLotesPendentes:', error);
      throw error;
    }
  }

  /**
   * Cancelar lote (antes de executar)
   */
  async cancelarLote(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          status: 'Cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('status', 'Pendente');

      if (error) throw handleSupabaseError(error);
      return true;
    } catch (error) {
      console.error('Error in ReenrollmentService.cancelarLote:', error);
      throw error;
    }
  }

  // ==================== ITENS DE REMATRÍCULA ====================

  /**
   * Buscar itens de um lote
   */
  async getItensLote(batchId: number): Promise<ReenrollmentItemWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('reenrollment_items')
        .select(`
          *,
          student:student_profiles(
            id,
            person:people(first_name, last_name)
          ),
          escola_destino:schools!escola_destino_id(id, name)
        `)
        .eq('batch_id', batchId)
        .order('status')
        .order('serie_atual');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ReenrollmentService.getItensLote:', error);
      throw error;
    }
  }

  /**
   * Buscar itens que precisam de escola
   */
  async getItensNecessitamEscola(batchId: number): Promise<ReenrollmentItemWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('reenrollment_items')
        .select(`
          *,
          student:student_profiles(
            id,
            person:people(first_name, last_name)
          ),
          escola_destino:schools!escola_destino_id(id, name)
        `)
        .eq('batch_id', batchId)
        .eq('status', 'Necessita_Escola');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ReenrollmentService.getItensNecessitamEscola:', error);
      throw error;
    }
  }

  /**
   * Definir escola para um item
   */
  async definirEscolaItem(itemId: number, escolaId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('fn_definir_escola_item', {
          p_item_id: itemId,
          p_escola_id: escolaId
        });

      if (error) throw handleSupabaseError(error);
      return data as boolean;
    } catch (error) {
      console.error('Error in ReenrollmentService.definirEscolaItem:', error);
      throw error;
    }
  }

  /**
   * Excluir item do lote
   */
  async excluirItem(itemId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reenrollment_items')
        .update({
          status: 'Excluido',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .in('status', ['Pendente', 'Necessita_Escola']);

      if (error) throw handleSupabaseError(error);
      return true;
    } catch (error) {
      console.error('Error in ReenrollmentService.excluirItem:', error);
      throw error;
    }
  }

  // ==================== EXECUÇÃO ====================

  /**
   * Executar rematrícula de um item individual
   */
  async executarItem(itemId: number, executadoPor: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('fn_executar_rematricula_item', {
          p_item_id: itemId,
          p_executado_por: executadoPor
        });

      if (error) throw handleSupabaseError(error);
      return data as number; // Retorna ID da nova matrícula
    } catch (error) {
      console.error('Error in ReenrollmentService.executarItem:', error);
      throw error;
    }
  }

  /**
   * Executar lote completo de rematrícula
   */
  async executarLote(batchId: number, executadoPor: number): Promise<ResultadoExecucao> {
    try {
      const { data, error } = await supabase
        .rpc('fn_executar_lote_rematricula', {
          p_batch_id: batchId,
          p_executado_por: executadoPor
        });

      if (error) throw handleSupabaseError(error);

      const result = Array.isArray(data) ? data[0] : data;
      return {
        total_processados: result.total_processados,
        total_sucesso: result.total_sucesso,
        total_erros: result.total_erros
      };
    } catch (error) {
      console.error('Error in ReenrollmentService.executarLote:', error);
      throw error;
    }
  }

  // ==================== ESCOLAS ALTERNATIVAS ====================

  /**
   * Buscar escolas alternativas no polo
   */
  async buscarEscolasAlternativas(
    escolaAtualId: number,
    educationLevel: string
  ): Promise<{
    school_id: number;
    school_name: string;
    polo_id: number;
    vagas_disponiveis: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .rpc('fn_buscar_escola_alternativa', {
          p_escola_atual_id: escolaAtualId,
          p_education_level: educationLevel
        });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ReenrollmentService.buscarEscolasAlternativas:', error);
      throw error;
    }
  }

  // ==================== ESTATÍSTICAS ====================

  /**
   * Estatísticas gerais de rematrícula
   */
  async getEstatisticasGerais(academicYearId?: number): Promise<{
    total_lotes: number;
    total_alunos_processados: number;
    total_rematriculados: number;
    total_concluidos_ciclo: number;
    total_erros: number;
    por_status: Record<ReenrollmentStatus, number>;
  }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('status, total_alunos, total_rematriculados, total_concluidos, total_erros')
        .is('deleted_at', null);

      if (academicYearId) {
        query = query.eq('ano_letivo_origem_id', academicYearId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      const stats = {
        total_lotes: data?.length || 0,
        total_alunos_processados: 0,
        total_rematriculados: 0,
        total_concluidos_ciclo: 0,
        total_erros: 0,
        por_status: {} as Record<ReenrollmentStatus, number>
      };

      data?.forEach((batch: Record<string, unknown>) => {
        stats.total_alunos_processados += (batch.total_alunos as number) || 0;
        stats.total_rematriculados += (batch.total_rematriculados as number) || 0;
        stats.total_concluidos_ciclo += (batch.total_concluidos as number) || 0;
        stats.total_erros += (batch.total_erros as number) || 0;

        const status = batch.status as ReenrollmentStatus;
        stats.por_status[status] = (stats.por_status[status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in ReenrollmentService.getEstatisticasGerais:', error);
      throw error;
    }
  }

  /**
   * Estatísticas por escola
   */
  async getEstatisticasEscola(
    escolaId: number,
    academicYearId?: number
  ): Promise<{
    total_lotes: number;
    ultimo_lote: ReenrollmentBatchWithDetails | null;
    historico: {
      ano_letivo: string;
      total_alunos: number;
      rematriculados: number;
      concluidos: number;
      erros: number;
    }[];
  }> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          ano_letivo_origem:academic_years!ano_letivo_origem_id(year_name)
        `)
        .eq('school_id', escolaId)
        .eq('status', 'Concluido')
        .is('deleted_at', null);

      if (academicYearId) {
        query = query.eq('ano_letivo_origem_id', academicYearId);
      }

      const { data, error } = await query.order('data_conclusao', { ascending: false });

      if (error) throw handleSupabaseError(error);

      const historico = (data || []).map((batch: Record<string, unknown>) => ({
        ano_letivo: ((batch.ano_letivo_origem as Record<string, unknown>)?.year_name as string) || '',
        total_alunos: (batch.total_alunos as number) || 0,
        rematriculados: (batch.total_rematriculados as number) || 0,
        concluidos: (batch.total_concluidos as number) || 0,
        erros: (batch.total_erros as number) || 0
      }));

      return {
        total_lotes: data?.length || 0,
        ultimo_lote: data?.[0] as ReenrollmentBatchWithDetails || null,
        historico
      };
    } catch (error) {
      console.error('Error in ReenrollmentService.getEstatisticasEscola:', error);
      throw error;
    }
  }

  // ==================== DEFINIR RESULTADO FINAL ====================

  /**
   * Definir resultado final de uma matrícula
   */
  async definirResultadoFinal(
    enrollmentId: number,
    resultado: StudentFinalResult
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('student_enrollments')
        .update({
          resultado_final: resultado,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);

      if (error) throw handleSupabaseError(error);
      return true;
    } catch (error) {
      console.error('Error in ReenrollmentService.definirResultadoFinal:', error);
      throw error;
    }
  }

  /**
   * Definir resultados em lote (para conselho de classe)
   */
  async definirResultadosEmLote(
    resultados: { enrollment_id: number; resultado: StudentFinalResult }[]
  ): Promise<{ sucesso: number; erros: number }> {
    let sucesso = 0;
    let erros = 0;

    for (const item of resultados) {
      try {
        await this.definirResultadoFinal(item.enrollment_id, item.resultado);
        sucesso++;
      } catch {
        erros++;
      }
    }

    return { sucesso, erros };
  }
}

// Exportar instância singleton
export const reenrollmentService = new ReenrollmentServiceClass();

// Exportar classe para testes
export { ReenrollmentServiceClass };
