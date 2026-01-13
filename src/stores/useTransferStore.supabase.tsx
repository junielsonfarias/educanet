/**
 * useTransferStore - Store para gerenciamento de transferências (Versão Supabase)
 *
 * Gerencia todo o fluxo de transferências de alunos:
 * - Transferência interna (entre escolas do município)
 * - Transferência externa (saída/entrada de outros municípios)
 * - Fluxo de aprovação
 */

import { create } from 'zustand';
import {
  transferService,
  type Transfer,
  type TransferWithDetails,
  type TransferStatus,
  type SolicitarTransferenciaData,
  type TransferenciaExternaSaidaData
} from '@/lib/supabase/services';
import { toast } from 'sonner';

interface TransferStats {
  total: number;
  pendentes: number;
  aprovadas: number;
  efetivadas: number;
  rejeitadas: number;
  canceladas: number;
}

interface TransferState {
  // Estado
  transfers: TransferWithDetails[];
  currentTransfer: TransferWithDetails | null;
  pendentesAprovacao: TransferWithDetails[];
  stats: TransferStats | null;
  loading: boolean;
  error: string | null;

  // Ações - Buscar
  fetchByEscolaOrigem: (escolaId: number) => Promise<void>;
  fetchByEscolaDestino: (escolaId: number, status?: TransferStatus) => Promise<void>;
  fetchPendentesAprovacao: (escolaId: number) => Promise<void>;
  fetchByStudent: (studentProfileId: number) => Promise<void>;
  fetchByPolo: (poloId: number, status?: TransferStatus) => Promise<void>;
  fetchTransferDetails: (id: number) => Promise<TransferWithDetails | null>;

  // Transferência Interna
  solicitarTransferenciaInterna: (data: SolicitarTransferenciaData, solicitanteId: number) => Promise<number | null>;
  aprovarTransferencia: (transferId: number, aprovadorId: number) => Promise<boolean>;
  efetivarTransferencia: (transferId: number, turmaId?: number) => Promise<number | null>;
  rejeitarTransferencia: (transferId: number, aprovadorId: number, motivoRejeicao: string) => Promise<boolean>;
  cancelarTransferencia: (transferId: number, solicitanteId: number) => Promise<boolean>;

  // Transferência Externa
  registrarTransferenciaExternaSaida: (data: TransferenciaExternaSaidaData, solicitanteId: number) => Promise<number | null>;

  // Estatísticas
  fetchStats: (escolaId?: number) => Promise<void>;
  fetchStatsByPeriod: (dataInicio: string, dataFim: string, escolaId?: number) => Promise<void>;

  // Consultas especiais
  getContagemAlunosEscola: (escolaId: number, dataReferencia?: string) => Promise<{
    total_alunos: number;
    alunos_ativos: number;
    alunos_transferidos: number;
  } | null>;
  getFrequenciaConsolidadaAluno: (studentProfileId: number, academicYearId?: number) => Promise<{
    total_aulas: number;
    presencas: number;
    faltas: number;
    percentual_geral: number;
    atinge_minimo: boolean;
  } | null>;

  // Utilitários
  clearError: () => void;
  setCurrentTransfer: (transfer: TransferWithDetails | null) => void;
  reset: () => void;
}

const initialStats: TransferStats = {
  total: 0,
  pendentes: 0,
  aprovadas: 0,
  efetivadas: 0,
  rejeitadas: 0,
  canceladas: 0
};

export const useTransferStore = create<TransferState>((set, get) => ({
  // Estado inicial
  transfers: [],
  currentTransfer: null,
  pendentesAprovacao: [],
  stats: null,
  loading: false,
  error: null,

  // ==================== BUSCAR ====================

  fetchByEscolaOrigem: async (escolaId: number) => {
    set({ loading: true, error: null });
    try {
      const transfers = await transferService.getByEscolaOrigem(escolaId);
      set({ transfers, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar transferências';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchByEscolaDestino: async (escolaId: number, status?: TransferStatus) => {
    set({ loading: true, error: null });
    try {
      const transfers = await transferService.getByEscolaDestino(escolaId, status);
      set({ transfers, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar transferências';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchPendentesAprovacao: async (escolaId: number) => {
    set({ loading: true, error: null });
    try {
      const pendentesAprovacao = await transferService.getPendentesAprovacao(escolaId);
      set({ pendentesAprovacao, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar transferências pendentes';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchByStudent: async (studentProfileId: number) => {
    set({ loading: true, error: null });
    try {
      const transfers = await transferService.getByStudent(studentProfileId);
      set({ transfers, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar transferências do aluno';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchByPolo: async (poloId: number, status?: TransferStatus) => {
    set({ loading: true, error: null });
    try {
      const transfers = await transferService.getByPolo(poloId, status);
      set({ transfers, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar transferências do polo';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchTransferDetails: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const transfer = await transferService.getTransferFullInfo(id);
      set({ currentTransfer: transfer, loading: false });
      return transfer;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar detalhes da transferência';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  // ==================== TRANSFERÊNCIA INTERNA ====================

  solicitarTransferenciaInterna: async (data: SolicitarTransferenciaData, solicitanteId: number) => {
    set({ loading: true, error: null });
    try {
      const transferId = await transferService.solicitarTransferenciaInterna(data, solicitanteId);
      toast.success('Transferência solicitada com sucesso!');
      set({ loading: false });
      return transferId;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao solicitar transferência';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  aprovarTransferencia: async (transferId: number, aprovadorId: number) => {
    set({ loading: true, error: null });
    try {
      const success = await transferService.aprovarTransferencia(transferId, aprovadorId);

      if (success) {
        // Atualizar lista de pendentes
        const { pendentesAprovacao } = get();
        set({
          pendentesAprovacao: pendentesAprovacao.filter(t => t.id !== transferId),
          loading: false
        });
        toast.success('Transferência aprovada com sucesso!');
      }

      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao aprovar transferência';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  efetivarTransferencia: async (transferId: number, turmaId?: number) => {
    set({ loading: true, error: null });
    try {
      const novaMatriculaId = await transferService.efetivarTransferencia(transferId, turmaId);
      toast.success('Transferência efetivada com sucesso!');
      set({ loading: false });
      return novaMatriculaId;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao efetivar transferência';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  rejeitarTransferencia: async (transferId: number, aprovadorId: number, motivoRejeicao: string) => {
    set({ loading: true, error: null });
    try {
      const success = await transferService.rejeitarTransferencia(transferId, aprovadorId, motivoRejeicao);

      if (success) {
        const { pendentesAprovacao } = get();
        set({
          pendentesAprovacao: pendentesAprovacao.filter(t => t.id !== transferId),
          loading: false
        });
        toast.success('Transferência rejeitada');
      }

      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao rejeitar transferência';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  cancelarTransferencia: async (transferId: number, solicitanteId: number) => {
    set({ loading: true, error: null });
    try {
      const success = await transferService.cancelarTransferencia(transferId, solicitanteId);

      if (success) {
        const { transfers } = get();
        set({
          transfers: transfers.map(t =>
            t.id === transferId ? { ...t, status: 'Cancelada' as TransferStatus } : t
          ),
          loading: false
        });
        toast.success('Transferência cancelada');
      }

      return success;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao cancelar transferência';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  // ==================== TRANSFERÊNCIA EXTERNA ====================

  registrarTransferenciaExternaSaida: async (data: TransferenciaExternaSaidaData, solicitanteId: number) => {
    set({ loading: true, error: null });
    try {
      const transferId = await transferService.registrarTransferenciaExternaSaida(data, solicitanteId);
      toast.success('Transferência externa registrada com sucesso!');
      set({ loading: false });
      return transferId;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao registrar transferência externa';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  // ==================== ESTATÍSTICAS ====================

  fetchStats: async (escolaId?: number) => {
    set({ loading: true, error: null });
    try {
      const counts = await transferService.countByStatus(escolaId);

      const stats: TransferStats = {
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        pendentes: counts['Pendente'] || 0,
        aprovadas: counts['Aprovada'] || 0,
        efetivadas: counts['Efetivada'] || 0,
        rejeitadas: counts['Rejeitada'] || 0,
        canceladas: counts['Cancelada'] || 0
      };

      set({ stats, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar estatísticas';
      set({ error: message, loading: false, stats: initialStats });
      toast.error(message);
    }
  },

  fetchStatsByPeriod: async (dataInicio: string, dataFim: string, escolaId?: number) => {
    set({ loading: true, error: null });
    try {
      const periodStats = await transferService.getStatsByPeriod(dataInicio, dataFim, escolaId);

      const stats: TransferStats = {
        total: periodStats.total,
        pendentes: periodStats.pendentes,
        aprovadas: 0,
        efetivadas: periodStats.efetivadas,
        rejeitadas: 0,
        canceladas: 0
      };

      set({ stats, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar estatísticas do período';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== CONSULTAS ESPECIAIS ====================

  getContagemAlunosEscola: async (escolaId: number, dataReferencia?: string) => {
    try {
      const contagem = await transferService.getContagemAlunosEscola(escolaId, dataReferencia);
      return contagem;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar contagem de alunos';
      toast.error(message);
      return null;
    }
  },

  getFrequenciaConsolidadaAluno: async (studentProfileId: number, academicYearId?: number) => {
    try {
      const frequencia = await transferService.getFrequenciaConsolidadaAluno(studentProfileId, academicYearId);
      return frequencia;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar frequência consolidada';
      toast.error(message);
      return null;
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentTransfer: (transfer: TransferWithDetails | null) =>
    set({ currentTransfer: transfer }),

  reset: () => set({
    transfers: [],
    currentTransfer: null,
    pendentesAprovacao: [],
    stats: null,
    loading: false,
    error: null
  })
}));

// Exportar tipos
export type { TransferState, TransferStats };
