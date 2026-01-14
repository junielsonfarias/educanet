/**
 * useEvaluationRulesStore - Store para gerenciamento de regras de avaliação (Versão Supabase)
 *
 * Gerencia regras de avaliação por curso e/ou série:
 * - Nota mínima de aprovação
 * - Frequência mínima
 * - Número de avaliações por período
 * - Tipo de cálculo de média
 */

import { create } from 'zustand';
import { evaluationRulesService } from '@/lib/supabase/services';
import type { EvaluationRule, EvaluationRuleFormData } from '@/lib/supabase/services';

interface ApprovalCheckResult {
  approved: boolean;
  gradeApproved: boolean;
  attendanceApproved: boolean;
  message: string;
}

interface EvaluationRulesState {
  // Estado
  rules: EvaluationRule[];
  currentRule: EvaluationRule | null;
  loading: boolean;
  error: string | null;

  // Ações - CRUD
  fetchRules: () => Promise<void>;
  fetchRuleById: (id: number) => Promise<EvaluationRule | null>;
  fetchRulesByCourse: (courseId: number) => Promise<void>;
  fetchRulesByGrade: (gradeId: number) => Promise<void>;
  fetchRuleForClass: (courseId: number, gradeId?: number) => Promise<EvaluationRule | null>;
  createRule: (data: EvaluationRuleFormData) => Promise<EvaluationRule | null>;
  updateRule: (id: number, data: Partial<EvaluationRuleFormData>) => Promise<EvaluationRule | null>;
  deleteRule: (id: number) => Promise<void>;
  duplicateRule: (id: number, newName: string) => Promise<EvaluationRule | null>;

  // Ações - Validação
  checkApprovalStatus: (ruleId: number, averageGrade: number, attendancePercent: number) => Promise<ApprovalCheckResult>;

  // Utilitários
  setCurrentRule: (rule: EvaluationRule | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useEvaluationRulesStore = create<EvaluationRulesState>((set, get) => ({
  // Estado inicial
  rules: [],
  currentRule: null,
  loading: false,
  error: null,

  // =====================================
  // AÇÕES - CRUD
  // =====================================

  /**
   * Buscar todas as regras de avaliação
   */
  fetchRules: async () => {
    set({ loading: true, error: null });
    try {
      const rules = await evaluationRulesService.getAll();
      set({ rules, loading: false });
    } catch (error) {
      console.error('Erro ao buscar regras de avaliação:', error);
      set({ error: 'Erro ao carregar regras de avaliação', loading: false });
    }
  },

  /**
   * Buscar regra por ID
   */
  fetchRuleById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const rule = await evaluationRulesService.getById(id);
      if (rule) {
        set({ currentRule: rule, loading: false });
      } else {
        set({ error: 'Regra não encontrada', loading: false });
      }
      return rule;
    } catch (error) {
      console.error('Erro ao buscar regra:', error);
      set({ error: 'Erro ao carregar regra de avaliação', loading: false });
      return null;
    }
  },

  /**
   * Buscar regras por curso
   */
  fetchRulesByCourse: async (courseId: number) => {
    set({ loading: true, error: null });
    try {
      const rules = await evaluationRulesService.getByCourse(courseId);
      set({ rules, loading: false });
    } catch (error) {
      console.error('Erro ao buscar regras por curso:', error);
      set({ error: 'Erro ao carregar regras do curso', loading: false });
    }
  },

  /**
   * Buscar regras por série/ano
   */
  fetchRulesByGrade: async (gradeId: number) => {
    set({ loading: true, error: null });
    try {
      const rules = await evaluationRulesService.getByGrade(gradeId);
      set({ rules, loading: false });
    } catch (error) {
      console.error('Erro ao buscar regras por série:', error);
      set({ error: 'Erro ao carregar regras da série', loading: false });
    }
  },

  /**
   * Buscar regra aplicável para uma turma (por curso e/ou série)
   */
  fetchRuleForClass: async (courseId: number, gradeId?: number) => {
    set({ loading: true, error: null });
    try {
      const rule = await evaluationRulesService.getRuleForClass(courseId, gradeId);
      if (rule) {
        set({ currentRule: rule, loading: false });
      } else {
        set({ loading: false });
      }
      return rule;
    } catch (error) {
      console.error('Erro ao buscar regra para turma:', error);
      set({ error: 'Erro ao carregar regra da turma', loading: false });
      return null;
    }
  },

  /**
   * Criar nova regra de avaliação
   */
  createRule: async (data: EvaluationRuleFormData) => {
    set({ loading: true, error: null });
    try {
      const newRule = await evaluationRulesService.create(data);

      // Atualiza a lista de regras
      const { rules } = get();
      set({
        rules: [...rules, newRule],
        currentRule: newRule,
        loading: false
      });

      return newRule;
    } catch (error) {
      console.error('Erro ao criar regra de avaliação:', error);
      set({ error: 'Erro ao criar regra de avaliação', loading: false });
      return null;
    }
  },

  /**
   * Atualizar regra de avaliação
   */
  updateRule: async (id: number, data: Partial<EvaluationRuleFormData>) => {
    set({ loading: true, error: null });
    try {
      const updatedRule = await evaluationRulesService.update(id, data);

      // Atualiza a lista de regras
      const { rules } = get();
      const updatedRules = rules.map(r => r.id === id ? updatedRule : r);
      set({
        rules: updatedRules,
        currentRule: updatedRule,
        loading: false
      });

      return updatedRule;
    } catch (error) {
      console.error('Erro ao atualizar regra de avaliação:', error);
      set({ error: 'Erro ao atualizar regra de avaliação', loading: false });
      return null;
    }
  },

  /**
   * Excluir regra de avaliação (soft delete)
   */
  deleteRule: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await evaluationRulesService.delete(id);

      // Remove da lista
      const { rules, currentRule } = get();
      const updatedRules = rules.filter(r => r.id !== id);
      set({
        rules: updatedRules,
        currentRule: currentRule?.id === id ? null : currentRule,
        loading: false
      });
    } catch (error) {
      console.error('Erro ao excluir regra de avaliação:', error);
      set({ error: 'Erro ao excluir regra de avaliação', loading: false });
    }
  },

  /**
   * Duplicar regra de avaliação
   */
  duplicateRule: async (id: number, newName: string) => {
    set({ loading: true, error: null });
    try {
      const duplicatedRule = await evaluationRulesService.duplicate(id, newName);

      // Adiciona à lista
      const { rules } = get();
      set({
        rules: [...rules, duplicatedRule],
        currentRule: duplicatedRule,
        loading: false
      });

      return duplicatedRule;
    } catch (error) {
      console.error('Erro ao duplicar regra de avaliação:', error);
      set({ error: 'Erro ao duplicar regra de avaliação', loading: false });
      return null;
    }
  },

  // =====================================
  // AÇÕES - VALIDAÇÃO
  // =====================================

  /**
   * Verificar se aluno atingiu requisitos de aprovação
   */
  checkApprovalStatus: async (ruleId: number, averageGrade: number, attendancePercent: number) => {
    try {
      const result = await evaluationRulesService.checkApprovalStatus(
        ruleId,
        averageGrade,
        attendancePercent
      );
      return result;
    } catch (error) {
      console.error('Erro ao verificar status de aprovação:', error);
      return {
        approved: false,
        gradeApproved: false,
        attendanceApproved: false,
        message: 'Erro ao verificar aprovação'
      };
    }
  },

  // =====================================
  // UTILITÁRIOS
  // =====================================

  /**
   * Definir regra atual
   */
  setCurrentRule: (rule: EvaluationRule | null) => {
    set({ currentRule: rule });
  },

  /**
   * Limpar erro
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Resetar store
   */
  reset: () => {
    set({
      rules: [],
      currentRule: null,
      loading: false,
      error: null
    });
  }
}));

export default useEvaluationRulesStore;
