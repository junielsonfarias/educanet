/**
 * useAssessmentStore - Store para gerenciamento de avaliações e notas (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui o useAssessmentStore.tsx antigo.
 * Após testar e validar, renomear para useAssessmentStore.tsx
 */

import { create } from 'zustand';
import { gradeService } from '@/lib/supabase/services/grade-service';
import { assessmentTypeService } from '@/lib/supabase/services/assessment-type-service';
import type { GradeData } from '@/lib/supabase/services/grade-service';
import type { AssessmentType as AssessmentTypeDB, AssessmentTypeCreateData, AssessmentTypeUpdateData } from '@/lib/supabase/services/assessment-type-service';
import { toast } from 'sonner';

interface Grade {
  id: number;
  student_profile_id: number;
  evaluation_instance_id: number;
  score?: number;
  grade?: string;
  comments?: string;
  student?: Record<string, unknown>;
  evaluation?: Record<string, unknown>;
}

interface StudentGrade {
  student: Record<string, unknown>;
  grades: Grade[];
  average: number;
  status: string;
}

interface AssessmentState {
  // Estado
  grades: Grade[];
  studentGrades: StudentGrade[];
  currentGrade: Grade | null;
  assessmentTypes: AssessmentTypeDB[];
  assessments: Record<string, unknown>[];
  loading: boolean;
  loadingTypes: boolean;
  error: string | null;

  // Ações - Notas
  fetchGrades: (options?: {
    classId?: number;
    studentId?: number;
    evaluationId?: number;
  }) => Promise<void>;
  fetchStudentGrades: (studentId: number, options?: {
    periodId?: number;
    subjectId?: number;
  }) => Promise<void>;
  fetchClassGrades: (classId: number, options?: {
    evaluationId?: number;
    subjectId?: number;
  }) => Promise<void>;

  // CRUD Notas
  saveGrade: (data: GradeData) => Promise<Grade | null>;
  updateGrade: (id: number, data: Partial<GradeData>) => Promise<Grade | null>;
  deleteGrade: (id: number) => Promise<void>;

  // Lançamento em lote
  saveGradeBatch: (grades: GradeData[]) => Promise<void>;

  // Médias e cálculos
  calculateAverage: (studentId: number, subjectId: number, periodId?: number) => Promise<number>;
  calculateClassAverage: (classId: number, evaluationId: number) => Promise<number>;

  // Boletim
  fetchReportCard: (studentId: number, periodId: number) => Promise<Record<string, unknown>>;

  // Estatísticas
  fetchStats: (options?: {
    classId?: number;
    periodId?: number;
  }) => Promise<Record<string, unknown>>;

  // ==================== TIPOS DE AVALIAÇÃO ====================
  fetchAssessmentTypes: (options?: {
    schoolId?: number;
    courseId?: number;
  }) => Promise<void>;
  createAssessmentType: (data: AssessmentTypeCreateData) => Promise<AssessmentTypeDB | null>;
  updateAssessmentType: (id: number, data: AssessmentTypeUpdateData) => Promise<AssessmentTypeDB | null>;
  deleteAssessmentType: (id: number) => Promise<void>;

  // Utilitários
  clearError: () => void;
  setCurrentGrade: (grade: Grade | null) => void;
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  // Estado inicial
  grades: [],
  studentGrades: [],
  currentGrade: null,
  assessmentTypes: [],
  assessments: [],
  loading: false,
  loadingTypes: false,
  error: null,

  // ==================== BUSCAR NOTAS ====================

  fetchGrades: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      let grades: Record<string, unknown>[] = [];

      if (options.classId && options.evaluationId) {
        grades = await gradeService.getEvaluationGrades(options.evaluationId);
      } else if (options.studentId) {
        grades = await gradeService.getStudentGrades(options.studentId, {
          subjectId: options.evaluationId
        });
      } else {
        grades = await gradeService.getAll({
          sort: { column: 'created_at', ascending: false }
        });
      }

      set({ grades, loading: false });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar notas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchStudentGrades: async (studentId: number, options = {}) => {
    set({ loading: true, error: null });
    try {
      const grades = await gradeService.getStudentGrades(studentId, options);
      set({ grades, loading: false });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar notas do aluno';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchClassGrades: async (classId: number, options = {}) => {
    set({ loading: true, error: null });
    try {
      const grades = await gradeService.getClassGrades(classId, options);
      set({ grades, loading: false });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar notas da turma';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== CRUD ====================

  saveGrade: async (data: GradeData) => {
    set({ loading: true, error: null });
    try {
      const newGrade = await gradeService.saveGrade(data);
      
      const { grades } = get();
      set({ 
        grades: [...grades, newGrade], 
        loading: false 
      });
      
      toast.success('Nota salva com sucesso!');
      return newGrade;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao salvar nota';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  updateGrade: async (id: number, data: Partial<GradeData>) => {
    set({ loading: true, error: null });
    try {
      const updatedGrade = await gradeService.updateGrade(id, data);
      
      const { grades } = get();
      set({ 
        grades: grades.map(g => g.id === id ? { ...g, ...updatedGrade } : g),
        currentGrade: get().currentGrade?.id === id ? { ...get().currentGrade, ...updatedGrade } : get().currentGrade,
        loading: false 
      });
      
      toast.success('Nota atualizada com sucesso!');
      return updatedGrade;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao atualizar nota';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  deleteGrade: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await gradeService.deleteGrade(id);
      
      const { grades } = get();
      set({ 
        grades: grades.filter(g => g.id !== id),
        currentGrade: get().currentGrade?.id === id ? null : get().currentGrade,
        loading: false 
      });
      
      toast.success('Nota removida com sucesso!');
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao remover nota';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== LOTE ====================

  saveGradeBatch: async (grades: GradeData[]) => {
    set({ loading: true, error: null });
    try {
      const savedGrades = await Promise.all(
        grades.map(grade => gradeService.saveGrade(grade))
      );
      
      const { grades: existingGrades } = get();
      set({ 
        grades: [...existingGrades, ...savedGrades], 
        loading: false 
      });
      
      toast.success(`${savedGrades.length} notas salvas com sucesso!`);
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao salvar notas em lote';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== CÁLCULOS ====================

  calculateAverage: async (studentId: number, subjectId: number, periodId?: number) => {
    try {
      const average = await gradeService.calculateStudentAverage(
        studentId,
        subjectId,
        periodId
      );
      return average;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao calcular média';
      toast.error(message);
      return 0;
    }
  },

  calculateClassAverage: async (classId: number, evaluationId: number) => {
    try {
      const average = await gradeService.calculateClassAverage(
        classId,
        evaluationId
      );
      return average;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao calcular média da turma';
      toast.error(message);
      return 0;
    }
  },

  // ==================== BOLETIM ====================

  fetchReportCard: async (studentId: number, periodId: number) => {
    set({ loading: true, error: null });
    try {
      const reportCard = await gradeService.getStudentReportCard(
        studentId,
        periodId
      );
      set({ loading: false });
      return reportCard;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar boletim';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  // ==================== ESTATÍSTICAS ====================

  fetchStats: async (options = {}) => {
    try {
      // Implementar estatísticas agregadas
      // Por enquanto, retorna dados básicos
      const { grades } = get();
      
      const stats = {
        total: grades.length,
        averageScore: grades.reduce((sum, g) => sum + (g.score || 0), 0) / (grades.length || 1),
        approved: grades.filter(g => (g.score || 0) >= 6).length,
        failed: grades.filter(g => (g.score || 0) < 6).length
      };

      return stats;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar estatísticas';
      toast.error(message);
      return null;
    }
  },

  // ==================== TIPOS DE AVALIAÇÃO ====================

  fetchAssessmentTypes: async (options = {}) => {
    set({ loadingTypes: true, error: null });
    try {
      const types = await assessmentTypeService.getAll(options);
      set({ assessmentTypes: types, loadingTypes: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar tipos de avaliação';
      set({ error: message, loadingTypes: false });
      toast.error(message);
    }
  },

  createAssessmentType: async (data: AssessmentTypeCreateData) => {
    set({ loadingTypes: true, error: null });
    try {
      const created = await assessmentTypeService.create(data);
      const { assessmentTypes } = get();
      set({
        assessmentTypes: [...assessmentTypes, created],
        loadingTypes: false
      });
      toast.success('Tipo de avaliação criado com sucesso!');
      return created;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao criar tipo de avaliação';
      set({ error: message, loadingTypes: false });
      toast.error(message);
      return null;
    }
  },

  updateAssessmentType: async (id: number, data: AssessmentTypeUpdateData) => {
    set({ loadingTypes: true, error: null });
    try {
      const updated = await assessmentTypeService.update(id, data);
      const { assessmentTypes } = get();
      set({
        assessmentTypes: assessmentTypes.map(t => t.id === id ? updated : t),
        loadingTypes: false
      });
      toast.success('Tipo de avaliação atualizado com sucesso!');
      return updated;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao atualizar tipo de avaliação';
      set({ error: message, loadingTypes: false });
      toast.error(message);
      return null;
    }
  },

  deleteAssessmentType: async (id: number) => {
    set({ loadingTypes: true, error: null });
    try {
      await assessmentTypeService.delete(id);
      const { assessmentTypes } = get();
      set({
        assessmentTypes: assessmentTypes.filter(t => t.id !== id),
        loadingTypes: false
      });
      toast.success('Tipo de avaliação excluído com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao excluir tipo de avaliação';
      set({ error: message, loadingTypes: false });
      toast.error(message);
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentGrade: (grade: Grade | null) => set({ currentGrade: grade }),
}));

// Exportar tipos para uso em componentes
export type { AssessmentState, Grade, StudentGrade };
export type { AssessmentTypeDB as AssessmentType } from '@/lib/supabase/services/assessment-type-service';

