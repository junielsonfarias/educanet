/**
 * usePreEnrollmentStore - Store para gerenciamento de pré-matrícula online (Versão Supabase)
 *
 * Gerencia todo o fluxo de pré-matrícula pelo portal público:
 * - Períodos de pré-matrícula
 * - Solicitações de pré-matrícula
 * - Análise e aprovação
 * - Controle de vagas
 * - Acompanhamento por protocolo
 */

import { create } from 'zustand';
import {
  preEnrollmentService,
  type PreEnrollment,
  type PreEnrollmentWithDetails,
  type PreEnrollmentPeriod,
  type PreEnrollmentStatus,
  type SchoolVacancy,
  type SchoolCoverageArea,
  type CriarPreMatriculaData,
  type AcompanhamentoPreMatricula
} from '@/lib/supabase/services';
import { toast } from 'sonner';

interface PreEnrollmentStats {
  total: number;
  por_status: Record<PreEnrollmentStatus, number>;
  por_serie: Record<string, number>;
  por_bairro: Record<string, number>;
  vulnerabilidade: number;
}

interface EscolaComVagas {
  school_id: number;
  school_name: string;
  vagas_disponiveis: number;
  distancia_prioridade: number;
}

interface PreEnrollmentState {
  // Estado
  preEnrollments: PreEnrollmentWithDetails[];
  currentPreEnrollment: PreEnrollmentWithDetails | null;
  periodoAtivo: PreEnrollmentPeriod | null;
  periodos: PreEnrollmentPeriod[];
  pendentes: PreEnrollmentWithDetails[];
  listaEspera: PreEnrollmentWithDetails[];
  vagas: SchoolVacancy[];
  areasCobertura: SchoolCoverageArea[];
  escolasComVagas: EscolaComVagas[];
  stats: PreEnrollmentStats | null;
  acompanhamento: AcompanhamentoPreMatricula | null;
  loading: boolean;
  error: string | null;

  // Ações - Períodos
  fetchPeriodoAtivo: () => Promise<PreEnrollmentPeriod | null>;
  fetchPeriodosByAnoLetivo: (academicYearId: number) => Promise<void>;
  criarPeriodo: (periodo: Omit<PreEnrollmentPeriod, 'id' | 'created_at' | 'updated_at' | 'total_solicitacoes' | 'total_aprovadas' | 'total_lista_espera' | 'total_rejeitadas'>) => Promise<PreEnrollmentPeriod | null>;
  atualizarPeriodo: (id: number, updates: Partial<PreEnrollmentPeriod>) => Promise<PreEnrollmentPeriod | null>;

  // Ações - Pré-Matrícula (Portal Público)
  criarPreMatricula: (periodId: number, dados: CriarPreMatriculaData) => Promise<{ pre_enrollment_id: number; protocolo: string } | null>;
  acompanharPorProtocolo: (protocolo: string) => Promise<AcompanhamentoPreMatricula | null>;
  acompanharPorCpfResponsavel: (cpf: string) => Promise<AcompanhamentoPreMatricula[]>;

  // Ações - Buscar
  fetchByPeriodo: (periodId: number, status?: PreEnrollmentStatus) => Promise<void>;
  fetchByEscola: (escolaId: number, status?: PreEnrollmentStatus) => Promise<void>;
  fetchPendentes: (periodId?: number) => Promise<void>;
  fetchListaEspera: (escolaId: number, serie: string) => Promise<void>;
  fetchPreEnrollmentDetails: (id: number) => Promise<PreEnrollmentWithDetails | null>;

  // Ações - Análise e Aprovação
  aprovar: (preEnrollmentId: number, escolaId: number, analisadoPor: number) => Promise<boolean>;
  colocarListaEspera: (preEnrollmentId: number, escolaId: number, analisadoPor: number) => Promise<number | null>;
  rejeitar: (preEnrollmentId: number, motivo: string, analisadoPor: number) => Promise<boolean>;
  confirmarComparecimento: (preEnrollmentId: number, confirmadoPor: number) => Promise<number | null>;
  cancelar: (preEnrollmentId: number) => Promise<boolean>;

  // Ações - Vagas
  buscarEscolasComVagas: (academicYearId: number, serie: string, turno?: string, bairro?: string) => Promise<void>;
  fetchVagasByEscola: (escolaId: number, academicYearId?: number) => Promise<void>;
  atualizarVagas: (escolaId: number, academicYearId: number, serie: string, turno: string, vagasTotais: number) => Promise<SchoolVacancy | null>;

  // Ações - Áreas de Cobertura
  fetchAreasCobertura: (escolaId: number) => Promise<void>;
  getEscolasPorBairro: (bairro: string) => Promise<{ school_id: number; school_name: string; prioridade: number }[]>;
  adicionarAreaCobertura: (area: Omit<SchoolCoverageArea, 'id' | 'created_at'>) => Promise<SchoolCoverageArea | null>;

  // Estatísticas
  fetchEstatisticasPeriodo: (periodId: number) => Promise<void>;
  fetchEstatisticasEscola: (escolaId: number, periodId?: number) => Promise<void>;

  // Pontuação
  recalcularPontuacao: (preEnrollmentId: number) => Promise<number | null>;
  recalcularPontuacaoPeriodo: (periodId: number) => Promise<number>;

  // Utilitários
  clearError: () => void;
  setCurrentPreEnrollment: (preEnrollment: PreEnrollmentWithDetails | null) => void;
  clearAcompanhamento: () => void;
  reset: () => void;
}

export const usePreEnrollmentStore = create<PreEnrollmentState>((set, get) => ({
  // Estado inicial
  preEnrollments: [],
  currentPreEnrollment: null,
  periodoAtivo: null,
  periodos: [],
  pendentes: [],
  listaEspera: [],
  vagas: [],
  areasCobertura: [],
  escolasComVagas: [],
  stats: null,
  acompanhamento: null,
  loading: false,
  error: null,

  // ==================== PERÍODOS ====================

  fetchPeriodoAtivo: async () => {
    set({ loading: true, error: null });
    try {
      const periodo = await preEnrollmentService.getPeriodoAtivo();
      set({ periodoAtivo: periodo, loading: false });
      return periodo;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar período ativo';
      set({ error: message, loading: false });
      return null;
    }
  },

  fetchPeriodosByAnoLetivo: async (academicYearId: number) => {
    set({ loading: true, error: null });
    try {
      const periodos = await preEnrollmentService.getPeriodosByAnoLetivo(academicYearId);
      set({ periodos, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar períodos';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  criarPeriodo: async (periodo) => {
    set({ loading: true, error: null });
    try {
      const novoPeriodo = await preEnrollmentService.criarPeriodo(periodo);
      const { periodos } = get();
      set({ periodos: [novoPeriodo, ...periodos], loading: false });
      toast.success('Período criado com sucesso!');
      return novoPeriodo;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao criar período';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  atualizarPeriodo: async (id: number, updates: Partial<PreEnrollmentPeriod>) => {
    set({ loading: true, error: null });
    try {
      const periodoAtualizado = await preEnrollmentService.atualizarPeriodo(id, updates);
      const { periodos, periodoAtivo } = get();
      set({
        periodos: periodos.map(p => p.id === id ? periodoAtualizado : p),
        periodoAtivo: periodoAtivo?.id === id ? periodoAtualizado : periodoAtivo,
        loading: false
      });
      toast.success('Período atualizado com sucesso!');
      return periodoAtualizado;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao atualizar período';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  // ==================== PRÉ-MATRÍCULA (PORTAL PÚBLICO) ====================

  criarPreMatricula: async (periodId: number, dados: CriarPreMatriculaData) => {
    set({ loading: true, error: null });
    try {
      const result = await preEnrollmentService.criarPreMatricula(periodId, dados);
      set({ loading: false });
      toast.success(`Pré-matrícula criada! Protocolo: ${result.protocolo}`);
      return result;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao criar pré-matrícula';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  acompanharPorProtocolo: async (protocolo: string) => {
    set({ loading: true, error: null });
    try {
      const acompanhamento = await preEnrollmentService.acompanharPorProtocolo(protocolo);
      set({ acompanhamento, loading: false });
      return acompanhamento;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar pré-matrícula';
      set({ error: message, loading: false, acompanhamento: null });
      toast.error(message);
      return null;
    }
  },

  acompanharPorCpfResponsavel: async (cpf: string) => {
    set({ loading: true, error: null });
    try {
      const lista = await preEnrollmentService.acompanharPorCpfResponsavel(cpf);
      set({ loading: false });
      return lista;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar pré-matrículas';
      set({ error: message, loading: false });
      toast.error(message);
      return [];
    }
  },

  // ==================== BUSCAR ====================

  fetchByPeriodo: async (periodId: number, status?: PreEnrollmentStatus) => {
    set({ loading: true, error: null });
    try {
      const preEnrollments = await preEnrollmentService.getByPeriodo(periodId, status);
      set({ preEnrollments, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar pré-matrículas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchByEscola: async (escolaId: number, status?: PreEnrollmentStatus) => {
    set({ loading: true, error: null });
    try {
      const preEnrollments = await preEnrollmentService.getByEscola(escolaId, status);
      set({ preEnrollments, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar pré-matrículas da escola';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchPendentes: async (periodId?: number) => {
    set({ loading: true, error: null });
    try {
      const pendentes = await preEnrollmentService.getPendentes(periodId);
      set({ pendentes, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar pendentes';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchListaEspera: async (escolaId: number, serie: string) => {
    set({ loading: true, error: null });
    try {
      const listaEspera = await preEnrollmentService.getListaEspera(escolaId, serie);
      set({ listaEspera, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar lista de espera';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchPreEnrollmentDetails: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const preEnrollment = await preEnrollmentService.getWithDetails(id);
      set({ currentPreEnrollment: preEnrollment, loading: false });
      return preEnrollment;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar detalhes';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  // ==================== ANÁLISE E APROVAÇÃO ====================

  aprovar: async (preEnrollmentId: number, escolaId: number, analisadoPor: number) => {
    set({ loading: true, error: null });
    try {
      const success = await preEnrollmentService.aprovar(preEnrollmentId, escolaId, analisadoPor);
      if (success) {
        const { pendentes } = get();
        set({
          pendentes: pendentes.filter(p => p.id !== preEnrollmentId),
          loading: false
        });
        toast.success('Pré-matrícula aprovada!');
      }
      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao aprovar pré-matrícula';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  colocarListaEspera: async (preEnrollmentId: number, escolaId: number, analisadoPor: number) => {
    set({ loading: true, error: null });
    try {
      const posicao = await preEnrollmentService.colocarListaEspera(preEnrollmentId, escolaId, analisadoPor);
      const { pendentes } = get();
      set({
        pendentes: pendentes.filter(p => p.id !== preEnrollmentId),
        loading: false
      });
      toast.success(`Colocado na lista de espera - Posição: ${posicao}`);
      return posicao;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao colocar em lista de espera';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  rejeitar: async (preEnrollmentId: number, motivo: string, analisadoPor: number) => {
    set({ loading: true, error: null });
    try {
      const success = await preEnrollmentService.rejeitar(preEnrollmentId, motivo, analisadoPor);
      if (success) {
        const { pendentes } = get();
        set({
          pendentes: pendentes.filter(p => p.id !== preEnrollmentId),
          loading: false
        });
        toast.success('Pré-matrícula rejeitada');
      }
      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao rejeitar pré-matrícula';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  confirmarComparecimento: async (preEnrollmentId: number, confirmadoPor: number) => {
    set({ loading: true, error: null });
    try {
      const matriculaId = await preEnrollmentService.confirmarComparecimento(preEnrollmentId, confirmadoPor);
      set({ loading: false });
      toast.success('Comparecimento confirmado! Matrícula efetivada.');
      return matriculaId;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao confirmar comparecimento';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  cancelar: async (preEnrollmentId: number) => {
    set({ loading: true, error: null });
    try {
      const success = await preEnrollmentService.cancelar(preEnrollmentId);
      if (success) {
        toast.success('Pré-matrícula cancelada');
      }
      set({ loading: false });
      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao cancelar pré-matrícula';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  // ==================== VAGAS ====================

  buscarEscolasComVagas: async (academicYearId: number, serie: string, turno?: string, bairro?: string) => {
    set({ loading: true, error: null });
    try {
      const escolasComVagas = await preEnrollmentService.buscarEscolasComVagas(
        academicYearId,
        serie,
        turno,
        bairro
      );
      set({ escolasComVagas, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar escolas com vagas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchVagasByEscola: async (escolaId: number, academicYearId?: number) => {
    set({ loading: true, error: null });
    try {
      const vagas = await preEnrollmentService.getVagasByEscola(escolaId, academicYearId);
      set({ vagas, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar vagas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  atualizarVagas: async (escolaId: number, academicYearId: number, serie: string, turno: string, vagasTotais: number) => {
    set({ loading: true, error: null });
    try {
      const vaga = await preEnrollmentService.atualizarVagas(escolaId, academicYearId, serie, turno, vagasTotais);
      const { vagas } = get();
      const existingIndex = vagas.findIndex(
        v => v.school_id === escolaId && v.serie === serie && v.turno === turno
      );

      if (existingIndex >= 0) {
        set({
          vagas: vagas.map((v, i) => i === existingIndex ? vaga : v),
          loading: false
        });
      } else {
        set({ vagas: [...vagas, vaga], loading: false });
      }

      toast.success('Vagas atualizadas!');
      return vaga;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao atualizar vagas';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  // ==================== ÁREAS DE COBERTURA ====================

  fetchAreasCobertura: async (escolaId: number) => {
    set({ loading: true, error: null });
    try {
      const areasCobertura = await preEnrollmentService.getAreasCobertura(escolaId);
      set({ areasCobertura, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar áreas de cobertura';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  getEscolasPorBairro: async (bairro: string) => {
    try {
      return await preEnrollmentService.getEscolasPorBairro(bairro);
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar escolas do bairro';
      toast.error(message);
      return [];
    }
  },

  adicionarAreaCobertura: async (area) => {
    set({ loading: true, error: null });
    try {
      const novaArea = await preEnrollmentService.adicionarAreaCobertura(area);
      const { areasCobertura } = get();
      set({ areasCobertura: [...areasCobertura, novaArea], loading: false });
      toast.success('Área de cobertura adicionada!');
      return novaArea;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao adicionar área de cobertura';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  // ==================== ESTATÍSTICAS ====================

  fetchEstatisticasPeriodo: async (periodId: number) => {
    set({ loading: true, error: null });
    try {
      const stats = await preEnrollmentService.getEstatisticasPeriodo(periodId);
      set({ stats, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar estatísticas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchEstatisticasEscola: async (escolaId: number, periodId?: number) => {
    set({ loading: true, error: null });
    try {
      const escolaStats = await preEnrollmentService.getEstatisticasEscola(escolaId, periodId);
      // Converter para o formato esperado
      const stats: PreEnrollmentStats = {
        total: escolaStats.total_alocadas + escolaStats.total_lista_espera + escolaStats.total_matriculadas,
        por_status: {} as Record<PreEnrollmentStatus, number>,
        por_serie: {},
        por_bairro: {},
        vulnerabilidade: 0
      };

      Object.entries(escolaStats.por_serie).forEach(([serie, values]) => {
        stats.por_serie[serie] = values.aprovadas + values.lista_espera + values.matriculadas;
      });

      set({ stats, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar estatísticas da escola';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== PONTUAÇÃO ====================

  recalcularPontuacao: async (preEnrollmentId: number) => {
    set({ loading: true, error: null });
    try {
      const pontuacao = await preEnrollmentService.recalcularPontuacao(preEnrollmentId);
      set({ loading: false });
      toast.success(`Pontuação recalculada: ${pontuacao} pontos`);
      return pontuacao;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao recalcular pontuação';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  recalcularPontuacaoPeriodo: async (periodId: number) => {
    set({ loading: true, error: null });
    try {
      const count = await preEnrollmentService.recalcularPontuacaoPeriodo(periodId);
      set({ loading: false });
      toast.success(`Pontuação recalculada para ${count} pré-matrículas`);
      return count;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao recalcular pontuações';
      set({ error: message, loading: false });
      toast.error(message);
      return 0;
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentPreEnrollment: (preEnrollment: PreEnrollmentWithDetails | null) =>
    set({ currentPreEnrollment: preEnrollment }),

  clearAcompanhamento: () => set({ acompanhamento: null }),

  reset: () => set({
    preEnrollments: [],
    currentPreEnrollment: null,
    periodoAtivo: null,
    periodos: [],
    pendentes: [],
    listaEspera: [],
    vagas: [],
    areasCobertura: [],
    escolasComVagas: [],
    stats: null,
    acompanhamento: null,
    loading: false,
    error: null
  })
}));

// Exportar tipos
export type { PreEnrollmentState, PreEnrollmentStats, EscolaComVagas };
