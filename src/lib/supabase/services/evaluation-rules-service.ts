/**
 * EvaluationRulesService - Serviço para gerenciamento de regras de avaliação
 *
 * Gerencia as regras de avaliação por curso e/ou série:
 * - Nota mínima de aprovação
 * - Frequência mínima
 * - Número de avaliações por período
 * - Tipo de cálculo de média
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

// Estrutura dos pesos por período para média ponderada
export interface PeriodWeights {
  weights: number[];  // Pesos para cada período na ordem
  divisor: number;    // Divisor total (soma dos pesos ou valor fixo)
  formula?: string;   // Fórmula textual opcional
}

export interface EvaluationRule {
  id: number;
  name: string;
  description?: string;
  course_id?: number;
  education_grade_id?: number;
  min_approval_grade: number;
  min_attendance_percent: number;
  min_evaluations_per_period: number;
  max_single_evaluation_weight?: number;
  academic_period_type: string;
  periods_per_year: number;
  calculation_type: string;
  allow_recovery: boolean;
  recovery_replaces_lowest: boolean;
  // Campos de fórmula de cálculo
  period_weights?: PeriodWeights;
  formula_description?: string;
  // Auditoria
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  deleted_at?: string | null;
  // Joins
  course?: { id: number; name: string; education_level: string };
  education_grade?: { id: number; grade_name: string; grade_order: number };
}

export interface EvaluationRuleFormData {
  name: string;
  description?: string;
  course_id?: number;
  education_grade_id?: number;
  min_approval_grade?: number;
  min_attendance_percent?: number;
  min_evaluations_per_period?: number;
  max_single_evaluation_weight?: number;
  academic_period_type?: string;
  periods_per_year?: number;
  calculation_type?: string;
  allow_recovery?: boolean;
  recovery_replaces_lowest?: boolean;
  // Campos de fórmula de cálculo
  period_weights?: PeriodWeights;
  formula_description?: string;
}

class EvaluationRulesService extends BaseService {
  constructor() {
    super('evaluation_rules');
  }

  /**
   * Buscar todas as regras de avaliação
   */
  async getAll(): Promise<EvaluationRule[]> {
    try {
      const { data, error } = await supabase
        .from('evaluation_rules')
        .select(`
          *,
          course:courses(id, name, education_level),
          education_grade:education_grades(id, grade_name, grade_order)
        `)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in EvaluationRulesService.getAll:', error);
      throw error;
    }
  }

  /**
   * Buscar regra por ID
   */
  async getById(id: number): Promise<EvaluationRule | null> {
    try {
      const { data, error } = await supabase
        .from('evaluation_rules')
        .select(`
          *,
          course:courses(id, name, education_level),
          education_grade:education_grades(id, grade_name, grade_order)
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
      console.error('Error in EvaluationRulesService.getById:', error);
      throw error;
    }
  }

  /**
   * Buscar regras por curso
   */
  async getByCourse(courseId: number): Promise<EvaluationRule[]> {
    try {
      const { data, error } = await supabase
        .from('evaluation_rules')
        .select(`
          *,
          course:courses(id, name, education_level),
          education_grade:education_grades(id, grade_name, grade_order)
        `)
        .eq('course_id', courseId)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in EvaluationRulesService.getByCourse:', error);
      throw error;
    }
  }

  /**
   * Buscar regras por série/ano
   */
  async getByGrade(gradeId: number): Promise<EvaluationRule[]> {
    try {
      const { data, error } = await supabase
        .from('evaluation_rules')
        .select(`
          *,
          course:courses(id, name, education_level),
          education_grade:education_grades(id, grade_name, grade_order)
        `)
        .eq('education_grade_id', gradeId)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in EvaluationRulesService.getByGrade:', error);
      throw error;
    }
  }

  /**
   * Buscar regra aplicável para uma turma (por curso e/ou série)
   */
  async getRuleForClass(courseId: number, gradeId?: number): Promise<EvaluationRule | null> {
    try {
      // Primeiro tenta buscar regra específica da série
      if (gradeId) {
        const { data: gradeRule } = await supabase
          .from('evaluation_rules')
          .select('*')
          .eq('education_grade_id', gradeId)
          .is('deleted_at', null)
          .maybeSingle();

        if (gradeRule) return gradeRule;
      }

      // Se não encontrou, busca regra do curso
      const { data: courseRule } = await supabase
        .from('evaluation_rules')
        .select('*')
        .eq('course_id', courseId)
        .is('education_grade_id', null)
        .is('deleted_at', null)
        .maybeSingle();

      if (courseRule) return courseRule;

      // Se não encontrou, busca regra padrão baseada no education_level do curso
      const { data: course } = await supabase
        .from('courses')
        .select('education_level')
        .eq('id', courseId)
        .single();

      if (course?.education_level) {
        const levelMapping: Record<string, string> = {
          'Educação Infantil': 'Regra Padrão - Educação Infantil',
          'Ensino Fundamental I': 'Regra Padrão - Fundamental I',
          'Ensino Fundamental II': 'Regra Padrão - Fundamental II',
          'Ensino Médio': 'Regra Padrão - Ensino Médio',
          'EJA': 'Regra Padrão - EJA',
        };

        const ruleName = levelMapping[course.education_level];
        if (ruleName) {
          const { data: defaultRule } = await supabase
            .from('evaluation_rules')
            .select('*')
            .eq('name', ruleName)
            .is('deleted_at', null)
            .maybeSingle();

          if (defaultRule) return defaultRule;
        }
      }

      return null;
    } catch (error) {
      console.error('Error in EvaluationRulesService.getRuleForClass:', error);
      return null;
    }
  }

  /**
   * Criar nova regra de avaliação
   */
  async create(data: EvaluationRuleFormData): Promise<EvaluationRule> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Obter person_id
      let createdBy = 1;
      if (user?.id) {
        const { data: authUser } = await supabase
          .from('auth_users')
          .select('person_id')
          .eq('id', user.id)
          .single();
        createdBy = authUser?.person_id || 1;
      }

      const { data: rule, error } = await supabase
        .from('evaluation_rules')
        .insert({
          name: data.name,
          description: data.description,
          course_id: data.course_id,
          education_grade_id: data.education_grade_id,
          min_approval_grade: data.min_approval_grade ?? 7.0,
          min_attendance_percent: data.min_attendance_percent ?? 75.0,
          min_evaluations_per_period: data.min_evaluations_per_period ?? 2,
          max_single_evaluation_weight: data.max_single_evaluation_weight ?? 40.0,
          academic_period_type: data.academic_period_type ?? 'Bimestre',
          periods_per_year: data.periods_per_year ?? 4,
          calculation_type: data.calculation_type ?? 'Media_Simples',
          allow_recovery: data.allow_recovery ?? true,
          recovery_replaces_lowest: data.recovery_replaces_lowest ?? true,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return rule;
    } catch (error) {
      console.error('Error in EvaluationRulesService.create:', error);
      throw error;
    }
  }

  /**
   * Atualizar regra de avaliação
   */
  async update(id: number, data: Partial<EvaluationRuleFormData>): Promise<EvaluationRule> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Obter person_id
      let updatedBy = 1;
      if (user?.id) {
        const { data: authUser } = await supabase
          .from('auth_users')
          .select('person_id')
          .eq('id', user.id)
          .single();
        updatedBy = authUser?.person_id || 1;
      }

      const { data: rule, error } = await supabase
        .from('evaluation_rules')
        .update({
          ...data,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return rule;
    } catch (error) {
      console.error('Error in EvaluationRulesService.update:', error);
      throw error;
    }
  }

  /**
   * Excluir regra de avaliação (soft delete)
   */
  async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('evaluation_rules')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in EvaluationRulesService.delete:', error);
      throw error;
    }
  }

  /**
   * Duplicar regra de avaliação
   */
  async duplicate(id: number, newName: string): Promise<EvaluationRule> {
    try {
      const original = await this.getById(id);
      if (!original) throw new Error('Regra não encontrada');

      return await this.create({
        name: newName,
        description: original.description,
        course_id: original.course_id,
        education_grade_id: original.education_grade_id,
        min_approval_grade: original.min_approval_grade,
        min_attendance_percent: original.min_attendance_percent,
        min_evaluations_per_period: original.min_evaluations_per_period,
        max_single_evaluation_weight: original.max_single_evaluation_weight,
        academic_period_type: original.academic_period_type,
        periods_per_year: original.periods_per_year,
        calculation_type: original.calculation_type,
        allow_recovery: original.allow_recovery,
        recovery_replaces_lowest: original.recovery_replaces_lowest,
      });
    } catch (error) {
      console.error('Error in EvaluationRulesService.duplicate:', error);
      throw error;
    }
  }

  /**
   * Validar se aluno atingiu requisitos de aprovação
   */
  async checkApprovalStatus(
    ruleId: number,
    averageGrade: number,
    attendancePercent: number
  ): Promise<{
    approved: boolean;
    gradeApproved: boolean;
    attendanceApproved: boolean;
    message: string;
  }> {
    try {
      const rule = await this.getById(ruleId);
      if (!rule) {
        return {
          approved: false,
          gradeApproved: false,
          attendanceApproved: false,
          message: 'Regra de avaliação não encontrada'
        };
      }

      const gradeApproved = averageGrade >= rule.min_approval_grade;
      const attendanceApproved = attendancePercent >= rule.min_attendance_percent;
      const approved = gradeApproved && attendanceApproved;

      let message = '';
      if (approved) {
        message = 'Aprovado';
      } else if (!gradeApproved && !attendanceApproved) {
        message = `Reprovado por nota (${averageGrade.toFixed(1)} < ${rule.min_approval_grade}) e frequência (${attendancePercent.toFixed(1)}% < ${rule.min_attendance_percent}%)`;
      } else if (!gradeApproved) {
        message = `Reprovado por nota (${averageGrade.toFixed(1)} < ${rule.min_approval_grade})`;
      } else {
        message = `Reprovado por frequência (${attendancePercent.toFixed(1)}% < ${rule.min_attendance_percent}%)`;
      }

      return { approved, gradeApproved, attendanceApproved, message };
    } catch (error) {
      console.error('Error in EvaluationRulesService.checkApprovalStatus:', error);
      throw error;
    }
  }

  /**
   * Calcular média ponderada usando os pesos configurados
   */
  calculateWeightedAverage(grades: (number | null)[], periodWeights: PeriodWeights): number | null {
    const validGrades = grades.filter((g): g is number => g !== null);
    if (validGrades.length === 0) return null;

    const { weights, divisor } = periodWeights;

    let weightedSum = 0;
    let usedWeightsSum = 0;

    for (let i = 0; i < grades.length && i < weights.length; i++) {
      if (grades[i] !== null) {
        weightedSum += (grades[i] as number) * weights[i];
        usedWeightsSum += weights[i];
      }
    }

    // Se não há divisor definido ou é 0, usar a soma dos pesos usados
    const actualDivisor = divisor > 0 ? divisor : usedWeightsSum;

    if (actualDivisor === 0) return null;

    return Math.round((weightedSum / actualDivisor) * 100) / 100;
  }

  /**
   * Gerar descrição textual da fórmula de cálculo
   */
  generateFormulaDescription(
    rule: EvaluationRule,
    periodNames?: string[]
  ): string {
    const { calculation_type, periods_per_year, period_weights } = rule;

    // Nomes padrão dos períodos
    const defaultPeriodNames = rule.academic_period_type === 'Bimestre'
      ? ['1ª Av.', '2ª Av.', '3ª Av.', '4ª Av.']
      : rule.academic_period_type === 'Trimestre'
        ? ['1º Tri.', '2º Tri.', '3º Tri.']
        : ['1º Sem.', '2º Sem.'];

    const names = periodNames || defaultPeriodNames.slice(0, periods_per_year);

    if (calculation_type === 'Media_Simples') {
      const parts = names.join(' + ');
      return `Média Simples: (${parts}) / ${periods_per_year}`;
    }

    if (calculation_type === 'Media_Ponderada' && period_weights) {
      const { weights, divisor } = period_weights;
      const parts = names.map((name, i) => {
        const weight = weights[i] || 1;
        return weight === 1 ? name : `(${name} × ${weight})`;
      }).join(' + ');
      return `Média Ponderada: (${parts}) / ${divisor}`;
    }

    if (calculation_type === 'Descritiva') {
      return 'Avaliação Descritiva (sem nota numérica)';
    }

    if (calculation_type === 'Soma_Notas') {
      const parts = names.join(' + ');
      return `Soma de Notas: ${parts}`;
    }

    return 'Cálculo não definido';
  }

  /**
   * Obter pesos padrão baseado no tipo de cálculo
   */
  getDefaultWeights(periodsPerYear: number, calculationType: string): PeriodWeights {
    if (calculationType === 'Media_Ponderada') {
      // Pesos padrão para média ponderada (alternados)
      const weights = periodsPerYear === 4
        ? [2, 3, 2, 3]
        : periodsPerYear === 3
          ? [2, 3, 3]
          : [1, 1];
      const divisor = weights.reduce((a, b) => a + b, 0);
      return { weights, divisor };
    }

    // Média simples - pesos iguais
    const weights = Array(periodsPerYear).fill(1);
    return { weights, divisor: periodsPerYear };
  }
}

export const evaluationRulesService = new EvaluationRulesService();
export default evaluationRulesService;
