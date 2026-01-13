/**
 * useReenrollmentStore - Store para gerenciamento de rematrícula automática (Versão Supabase)
 *
 * Gerencia todo o fluxo de rematrícula de alunos:
 * - Séries e progressão
 * - Níveis de ensino por escola
 * - Prévia de rematrícula
 * - Lotes de rematrícula
 * - Execução de rematrícula
 */

import { create } from 'zustand';
import {
  reenrollmentService,
  type ReenrollmentBatch,
  type ReenrollmentBatchWithDetails,
  type ReenrollmentItem,
  type ReenrollmentItemWithDetails,
  type ReenrollmentStatus,
  type ReenrollmentItemStatus,
  type StudentFinalResult,
  type EducationGrade,
  type SchoolEducationLevel,
  type PreviaRematricula,
  type ResultadoExecucao
} from '@/lib/supabase/services';
import { toast } from 'sonner';

interface ReenrollmentStats {
  total_lotes: number;
  total_alunos_processados: number;
  total_rematriculados: number;
  total_concluidos_ciclo: number;
  total_erros: number;
  por_status: Record<ReenrollmentStatus, number>;
}

interface ResumoPreviaRematricula {
  total_alunos: number;
  total_aprovados: number;
  total_reprovados: number;
  total_concluidos: number;
  total_trocam_escola: number;
  por_serie_destino: Record<string, number>;
}

interface EscolaAlternativa {
  school_id: number;
  school_name: string;
  polo_id: number;
  vagas_disponiveis: number;
}

interface ReenrollmentState {
  // Estado
  grades: EducationGrade[];
  niveisEscola: SchoolEducationLevel[];
  previa: PreviaRematricula[];
  resumoPrevia: ResumoPreviaRematricula | null;
  lotes: ReenrollmentBatchWithDetails[];
  currentLote: ReenrollmentBatchWithDetails | null;
  itensLote: ReenrollmentItemWithDetails[];
  itensNecessitamEscola: ReenrollmentItemWithDetails[];
  escolasAlternativas: EscolaAlternativa[];
  stats: ReenrollmentStats | null;
  loading: boolean;
  error: string | null;

  // Ações - Séries (Grades)
  fetchAllGrades: () => Promise<void>;
  fetchGradesByLevel: (educationLevel: string) => Promise<void>;
  getProximaSerie: (serieAtual: string, resultado: StudentFinalResult) => Promise<{
    proxima_serie: string;
    is_final: boolean;
    education_level: string;
  } | null>;

  // Ações - Níveis por Escola
  fetchNiveisEscola: (escolaId: number) => Promise<void>;
  adicionarNivelEscola: (escolaId: number, educationLevel: string) => Promise<SchoolEducationLevel | null>;
  removerNivelEscola: (escolaId: number, educationLevel: string) => Promise<boolean>;
  getEscolasPorNivel: (educationLevel: string) => Promise<{ school_id: number; school_name: string }[]>;

  // Ações - Prévia de Rematrícula
  fetchPreviaRematricula: (escolaId: number, academicYearId: number) => Promise<void>;
  fetchResumoPreviaRematricula: (escolaId: number, academicYearId: number) => Promise<void>;

  // Ações - Lotes de Rematrícula
  criarLote: (escolaId: number, anoOrigemId: number, anoDestinoId: number, criadoPor: number) => Promise<number | null>;
  fetchLoteWithDetails: (id: number) => Promise<ReenrollmentBatchWithDetails | null>;
  fetchLotesByEscola: (escolaId: number) => Promise<void>;
  fetchLotesPendentes: (escolaId?: number) => Promise<void>;
  cancelarLote: (id: number) => Promise<boolean>;

  // Ações - Itens de Rematrícula
  fetchItensLote: (batchId: number) => Promise<void>;
  fetchItensNecessitamEscola: (batchId: number) => Promise<void>;
  definirEscolaItem: (itemId: number, escolaId: number) => Promise<boolean>;
  excluirItem: (itemId: number) => Promise<boolean>;

  // Ações - Execução
  executarItem: (itemId: number, executadoPor: number) => Promise<number | null>;
  executarLote: (batchId: number, executadoPor: number) => Promise<ResultadoExecucao | null>;
  buscarEscolasAlternativas: (escolaAtualId: number, educationLevel: string) => Promise<void>;

  // Ações - Estatísticas
  fetchEstatisticasGerais: (academicYearId?: number) => Promise<void>;
  fetchEstatisticasEscola: (escolaId: number, academicYearId?: number) => Promise<void>;

  // Ações - Resultado Final
  definirResultadoFinal: (enrollmentId: number, resultado: StudentFinalResult) => Promise<boolean>;
  definirResultadosEmLote: (resultados: { enrollment_id: number; resultado: StudentFinalResult }[]) => Promise<{ sucesso: number; erros: number }>;

  // Utilitários
  clearError: () => void;
  setCurrentLote: (lote: ReenrollmentBatchWithDetails | null) => void;
  reset: () => void;
}

export const useReenrollmentStore = create<ReenrollmentState>((set, get) => ({
  // Estado inicial
  grades: [],
  niveisEscola: [],
  previa: [],
  resumoPrevia: null,
  lotes: [],
  currentLote: null,
  itensLote: [],
  itensNecessitamEscola: [],
  escolasAlternativas: [],
  stats: null,
  loading: false,
  error: null,

  // ==================== SÉRIES (GRADES) ====================

  fetchAllGrades: async () => {
    set({ loading: true, error: null });
    try {
      const grades = await reenrollmentService.getAllGrades();
      set({ grades, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar séries';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchGradesByLevel: async (educationLevel: string) => {
    set({ loading: true, error: null });
    try {
      const grades = await reenrollmentService.getGradesByLevel(educationLevel);
      set({ grades, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar séries do nível';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  getProximaSerie: async (serieAtual: string, resultado: StudentFinalResult) => {
    try {
      return await reenrollmentService.getProximaSerie(serieAtual, resultado);
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao calcular próxima série';
      toast.error(message);
      return null;
    }
  },

  // ==================== NÍVEIS POR ESCOLA ====================

  fetchNiveisEscola: async (escolaId: number) => {
    set({ loading: true, error: null });
    try {
      const niveisEscola = await reenrollmentService.getNiveisEscola(escolaId);
      set({ niveisEscola, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar níveis da escola';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  adicionarNivelEscola: async (escolaId: number, educationLevel: string) => {
    set({ loading: true, error: null });
    try {
      const nivel = await reenrollmentService.adicionarNivelEscola(escolaId, educationLevel);
      const { niveisEscola } = get();

      // Verificar se já existe
      const exists = niveisEscola.some(
        n => n.school_id === escolaId && n.education_level === educationLevel
      );

      if (!exists) {
        set({ niveisEscola: [...niveisEscola, nivel], loading: false });
      } else {
        set({
          niveisEscola: niveisEscola.map(n =>
            n.school_id === escolaId && n.education_level === educationLevel ? nivel : n
          ),
          loading: false
        });
      }

      toast.success('Nível de ensino adicionado!');
      return nivel;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao adicionar nível de ensino';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  removerNivelEscola: async (escolaId: number, educationLevel: string) => {
    set({ loading: true, error: null });
    try {
      const success = await reenrollmentService.removerNivelEscola(escolaId, educationLevel);
      if (success) {
        const { niveisEscola } = get();
        set({
          niveisEscola: niveisEscola.filter(
            n => !(n.school_id === escolaId && n.education_level === educationLevel)
          ),
          loading: false
        });
        toast.success('Nível de ensino removido');
      }
      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao remover nível de ensino';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  getEscolasPorNivel: async (educationLevel: string) => {
    try {
      return await reenrollmentService.getEscolasPorNivel(educationLevel);
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar escolas por nível';
      toast.error(message);
      return [];
    }
  },

  // ==================== PRÉVIA DE REMATRÍCULA ====================

  fetchPreviaRematricula: async (escolaId: number, academicYearId: number) => {
    set({ loading: true, error: null });
    try {
      const previa = await reenrollmentService.getPreviaRematricula(escolaId, academicYearId);
      set({ previa, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar prévia de rematrícula';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchResumoPreviaRematricula: async (escolaId: number, academicYearId: number) => {
    set({ loading: true, error: null });
    try {
      const resumoPrevia = await reenrollmentService.getResumoPreviaRematricula(escolaId, academicYearId);
      set({ resumoPrevia, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar resumo da prévia';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== LOTES DE REMATRÍCULA ====================

  criarLote: async (escolaId: number, anoOrigemId: number, anoDestinoId: number, criadoPor: number) => {
    set({ loading: true, error: null });
    try {
      const batchId = await reenrollmentService.criarLote(escolaId, anoOrigemId, anoDestinoId, criadoPor);
      toast.success('Lote de rematrícula criado!');
      set({ loading: false });
      return batchId;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao criar lote de rematrícula';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  fetchLoteWithDetails: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const lote = await reenrollmentService.getLoteWithDetails(id);
      set({ currentLote: lote, loading: false });
      return lote;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar lote';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  fetchLotesByEscola: async (escolaId: number) => {
    set({ loading: true, error: null });
    try {
      const lotes = await reenrollmentService.getLotesByEscola(escolaId);
      set({ lotes, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar lotes da escola';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchLotesPendentes: async (escolaId?: number) => {
    set({ loading: true, error: null });
    try {
      const lotes = await reenrollmentService.getLotesPendentes(escolaId);
      set({ lotes, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar lotes pendentes';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  cancelarLote: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const success = await reenrollmentService.cancelarLote(id);
      if (success) {
        const { lotes } = get();
        set({
          lotes: lotes.map(l =>
            l.id === id ? { ...l, status: 'Cancelado' as ReenrollmentStatus } : l
          ),
          loading: false
        });
        toast.success('Lote cancelado');
      }
      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao cancelar lote';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  // ==================== ITENS DE REMATRÍCULA ====================

  fetchItensLote: async (batchId: number) => {
    set({ loading: true, error: null });
    try {
      const itensLote = await reenrollmentService.getItensLote(batchId);
      set({ itensLote, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar itens do lote';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchItensNecessitamEscola: async (batchId: number) => {
    set({ loading: true, error: null });
    try {
      const itensNecessitamEscola = await reenrollmentService.getItensNecessitamEscola(batchId);
      set({ itensNecessitamEscola, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar itens que necessitam escola';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  definirEscolaItem: async (itemId: number, escolaId: number) => {
    set({ loading: true, error: null });
    try {
      const success = await reenrollmentService.definirEscolaItem(itemId, escolaId);
      if (success) {
        const { itensNecessitamEscola, itensLote } = get();
        set({
          itensNecessitamEscola: itensNecessitamEscola.filter(i => i.id !== itemId),
          itensLote: itensLote.map(i =>
            i.id === itemId ? { ...i, escola_destino_id: escolaId, status: 'Pendente' as ReenrollmentItemStatus } : i
          ),
          loading: false
        });
        toast.success('Escola definida para o item');
      }
      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao definir escola do item';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  excluirItem: async (itemId: number) => {
    set({ loading: true, error: null });
    try {
      const success = await reenrollmentService.excluirItem(itemId);
      if (success) {
        const { itensLote, itensNecessitamEscola } = get();
        set({
          itensLote: itensLote.map(i =>
            i.id === itemId ? { ...i, status: 'Excluido' as ReenrollmentItemStatus } : i
          ),
          itensNecessitamEscola: itensNecessitamEscola.filter(i => i.id !== itemId),
          loading: false
        });
        toast.success('Item excluído do lote');
      }
      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao excluir item';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  // ==================== EXECUÇÃO ====================

  executarItem: async (itemId: number, executadoPor: number) => {
    set({ loading: true, error: null });
    try {
      const matriculaId = await reenrollmentService.executarItem(itemId, executadoPor);

      const { itensLote } = get();
      set({
        itensLote: itensLote.map(i =>
          i.id === itemId ? {
            ...i,
            status: 'Rematriculado' as ReenrollmentItemStatus,
            matricula_destino_id: matriculaId
          } : i
        ),
        loading: false
      });

      toast.success('Item rematriculado com sucesso!');
      return matriculaId;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao executar rematrícula do item';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  executarLote: async (batchId: number, executadoPor: number) => {
    set({ loading: true, error: null });
    try {
      const resultado = await reenrollmentService.executarLote(batchId, executadoPor);

      // Atualizar lote para concluído
      const { lotes, currentLote } = get();
      set({
        lotes: lotes.map(l =>
          l.id === batchId ? {
            ...l,
            status: 'Concluido' as ReenrollmentStatus,
            total_rematriculados: resultado.total_sucesso,
            total_erros: resultado.total_erros
          } : l
        ),
        currentLote: currentLote?.id === batchId ? {
          ...currentLote,
          status: 'Concluido' as ReenrollmentStatus,
          total_rematriculados: resultado.total_sucesso,
          total_erros: resultado.total_erros
        } : currentLote,
        loading: false
      });

      toast.success(
        `Rematrícula concluída! ${resultado.total_sucesso} alunos rematriculados, ${resultado.total_erros} erros.`
      );
      return resultado;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao executar lote de rematrícula';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  buscarEscolasAlternativas: async (escolaAtualId: number, educationLevel: string) => {
    set({ loading: true, error: null });
    try {
      const escolasAlternativas = await reenrollmentService.buscarEscolasAlternativas(
        escolaAtualId,
        educationLevel
      );
      set({ escolasAlternativas, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar escolas alternativas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== ESTATÍSTICAS ====================

  fetchEstatisticasGerais: async (academicYearId?: number) => {
    set({ loading: true, error: null });
    try {
      const stats = await reenrollmentService.getEstatisticasGerais(academicYearId);
      set({ stats, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar estatísticas gerais';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchEstatisticasEscola: async (escolaId: number, academicYearId?: number) => {
    set({ loading: true, error: null });
    try {
      const escolaStats = await reenrollmentService.getEstatisticasEscola(escolaId, academicYearId);

      // Converter para formato da store
      const stats: ReenrollmentStats = {
        total_lotes: escolaStats.total_lotes,
        total_alunos_processados: escolaStats.historico.reduce((acc, h) => acc + h.total_alunos, 0),
        total_rematriculados: escolaStats.historico.reduce((acc, h) => acc + h.rematriculados, 0),
        total_concluidos_ciclo: escolaStats.historico.reduce((acc, h) => acc + h.concluidos, 0),
        total_erros: escolaStats.historico.reduce((acc, h) => acc + h.erros, 0),
        por_status: {} as Record<ReenrollmentStatus, number>
      };

      set({ stats, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar estatísticas da escola';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== RESULTADO FINAL ====================

  definirResultadoFinal: async (enrollmentId: number, resultado: StudentFinalResult) => {
    set({ loading: true, error: null });
    try {
      const success = await reenrollmentService.definirResultadoFinal(enrollmentId, resultado);
      if (success) {
        toast.success('Resultado final definido!');
      }
      set({ loading: false });
      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao definir resultado final';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  definirResultadosEmLote: async (resultados) => {
    set({ loading: true, error: null });
    try {
      const result = await reenrollmentService.definirResultadosEmLote(resultados);
      set({ loading: false });
      toast.success(`Resultados definidos: ${result.sucesso} sucesso, ${result.erros} erros`);
      return result;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao definir resultados em lote';
      set({ error: message, loading: false });
      toast.error(message);
      return { sucesso: 0, erros: resultados.length };
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentLote: (lote: ReenrollmentBatchWithDetails | null) =>
    set({ currentLote: lote }),

  reset: () => set({
    grades: [],
    niveisEscola: [],
    previa: [],
    resumoPrevia: null,
    lotes: [],
    currentLote: null,
    itensLote: [],
    itensNecessitamEscola: [],
    escolasAlternativas: [],
    stats: null,
    loading: false,
    error: null
  })
}));

// Exportar tipos
export type { ReenrollmentState, ReenrollmentStats, ResumoPreviaRematricula, EscolaAlternativa };
