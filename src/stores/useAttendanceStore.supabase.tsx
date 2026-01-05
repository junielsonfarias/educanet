/**
 * useAttendanceStore - Store para gerenciamento de frequência (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui o useAttendanceStore.tsx antigo.
 * Após testar e validar, renomear para useAttendanceStore.tsx
 */

import { create } from 'zustand';
import { attendanceService } from '@/lib/supabase/services/attendance-service';
import type { AttendanceData } from '@/lib/supabase/services/attendance-service';
import { toast } from 'sonner';

interface Attendance {
  id: number;
  student_profile_id: number;
  lesson_id: number;
  attendance_date: string;
  status: string;
  justification?: string;
  student?: any;
  lesson?: any;
}

interface AttendanceStats {
  studentId: number;
  totalLessons: number;
  presences: number;
  absences: number;
  justifiedAbsences: number;
  percentage: number;
  meetsMinimum: boolean;
}

interface AttendanceState {
  // Estado
  attendances: Attendance[];
  currentAttendance: Attendance | null;
  stats: AttendanceStats | null;
  loading: boolean;
  error: string | null;
  
  // Ações - Buscar
  fetchAttendances: (options?: {
    lessonId?: number;
    studentId?: number;
    classId?: number;
    dateRange?: { start: string; end: string };
  }) => Promise<void>;
  fetchStudentAttendance: (studentId: number, options?: {
    periodId?: number;
    subjectId?: number;
  }) => Promise<void>;
  fetchClassAttendance: (classId: number, options?: {
    date?: string;
    subjectId?: number;
  }) => Promise<void>;
  fetchLessonAttendance: (lessonId: number) => Promise<void>;
  
  // CRUD
  recordAttendance: (data: AttendanceData) => Promise<Attendance | null>;
  updateAttendance: (id: number, data: Partial<AttendanceData>) => Promise<Attendance | null>;
  deleteAttendance: (id: number) => Promise<void>;
  
  // Lançamento em lote
  recordAttendanceBatch: (attendances: AttendanceData[]) => Promise<void>;
  
  // Ações rápidas
  markPresent: (studentId: number, lessonId: number, date: string) => Promise<void>;
  markAbsent: (studentId: number, lessonId: number, date: string, justification?: string) => Promise<void>;
  
  // Estatísticas
  calculatePercentage: (studentId: number, options?: {
    periodId?: number;
    subjectId?: number;
  }) => Promise<number>;
  calculateClassPercentage: (classId: number, options?: {
    periodId?: number;
    subjectId?: number;
  }) => Promise<number>;
  checkMinimumAttendance: (studentId: number, periodId?: number) => Promise<boolean>;
  fetchStats: (studentId: number, options?: {
    periodId?: number;
    subjectId?: number;
  }) => Promise<AttendanceStats | null>;
  
  // Alertas
  getStudentsAtRisk: (classId: number, minimumPercentage?: number) => Promise<any[]>;
  
  // Utilitários
  clearError: () => void;
  setCurrentAttendance: (attendance: Attendance | null) => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  // Estado inicial
  attendances: [],
  currentAttendance: null,
  stats: null,
  loading: false,
  error: null,

  // ==================== BUSCAR ====================

  fetchAttendances: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      let attendances: any[] = [];

      if (options.dateRange) {
        attendances = await attendanceService.getByDateRange(
          options.dateRange.start,
          options.dateRange.end,
          options.classId,
          options.studentId
        );
      } else if (options.lessonId) {
        attendances = await attendanceService.getLessonAttendance(options.lessonId);
      } else if (options.studentId) {
        attendances = await attendanceService.getStudentAttendance(options.studentId);
      } else if (options.classId) {
        attendances = await attendanceService.getClassAttendance(options.classId);
      } else {
        attendances = await attendanceService.getAll({
          sort: { column: 'attendance_date', ascending: false }
        });
      }

      set({ attendances, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar frequência';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchStudentAttendance: async (studentId: number, options = {}) => {
    set({ loading: true, error: null });
    try {
      const attendances = await attendanceService.getStudentAttendance(
        studentId,
        options
      );
      set({ attendances, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar frequência do aluno';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchClassAttendance: async (classId: number, options = {}) => {
    set({ loading: true, error: null });
    try {
      const attendances = await attendanceService.getClassAttendance(
        classId,
        options
      );
      set({ attendances, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar frequência da turma';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchLessonAttendance: async (lessonId: number) => {
    set({ loading: true, error: null });
    try {
      const attendances = await attendanceService.getLessonAttendance(lessonId);
      set({ attendances, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar frequência da aula';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== CRUD ====================

  recordAttendance: async (data: AttendanceData) => {
    set({ loading: true, error: null });
    try {
      const newAttendance = await attendanceService.recordAttendance(data);
      
      const { attendances } = get();
      set({ 
        attendances: [...attendances, newAttendance], 
        loading: false 
      });
      
      toast.success('Frequência registrada com sucesso!');
      return newAttendance;
    } catch (error: any) {
      const message = error?.message || 'Erro ao registrar frequência';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  updateAttendance: async (id: number, data: Partial<AttendanceData>) => {
    set({ loading: true, error: null });
    try {
      const updatedAttendance = await attendanceService.updateAttendance(id, data);
      
      const { attendances } = get();
      set({ 
        attendances: attendances.map(a => a.id === id ? { ...a, ...updatedAttendance } : a),
        currentAttendance: get().currentAttendance?.id === id ? { ...get().currentAttendance, ...updatedAttendance } : get().currentAttendance,
        loading: false 
      });
      
      toast.success('Frequência atualizada com sucesso!');
      return updatedAttendance;
    } catch (error: any) {
      const message = error?.message || 'Erro ao atualizar frequência';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  deleteAttendance: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await attendanceService.deleteAttendance(id);
      
      const { attendances } = get();
      set({ 
        attendances: attendances.filter(a => a.id !== id),
        currentAttendance: get().currentAttendance?.id === id ? null : get().currentAttendance,
        loading: false 
      });
      
      toast.success('Frequência removida com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao remover frequência';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== LOTE ====================

  recordAttendanceBatch: async (attendances: AttendanceData[]) => {
    set({ loading: true, error: null });
    try {
      const savedAttendances = await Promise.all(
        attendances.map(att => attendanceService.recordAttendance(att))
      );
      
      const { attendances: existingAttendances } = get();
      set({ 
        attendances: [...existingAttendances, ...savedAttendances], 
        loading: false 
      });
      
      toast.success(`Frequência de ${savedAttendances.length} alunos registrada!`);
    } catch (error: any) {
      const message = error?.message || 'Erro ao registrar frequência em lote';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== AÇÕES RÁPIDAS ====================

  markPresent: async (studentId: number, lessonId: number, date: string) => {
    set({ loading: true, error: null });
    try {
      await attendanceService.markStudentPresent(studentId, lessonId, date);
      
      // Recarregar frequências
      await get().fetchLessonAttendance(lessonId);
      
      toast.success('Presença registrada!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao marcar presença';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  markAbsent: async (studentId: number, lessonId: number, date: string, justification?: string) => {
    set({ loading: true, error: null });
    try {
      await attendanceService.markStudentAbsent(
        studentId,
        lessonId,
        date,
        justification
      );
      
      // Recarregar frequências
      await get().fetchLessonAttendance(lessonId);
      
      toast.success('Falta registrada!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao marcar falta';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== ESTATÍSTICAS ====================

  calculatePercentage: async (studentId: number, options = {}) => {
    try {
      const percentage = await attendanceService.calculateStudentAttendancePercentage(
        studentId,
        options
      );
      return percentage;
    } catch (error: any) {
      const message = error?.message || 'Erro ao calcular percentual';
      toast.error(message);
      return 0;
    }
  },

  calculateClassPercentage: async (classId: number, options = {}) => {
    try {
      const percentage = await attendanceService.calculateClassAttendancePercentage(
        classId,
        options
      );
      return percentage;
    } catch (error: any) {
      const message = error?.message || 'Erro ao calcular percentual da turma';
      toast.error(message);
      return 0;
    }
  },

  checkMinimumAttendance: async (studentId: number, periodId?: number) => {
    try {
      const percentage = await attendanceService.calculateStudentAttendancePercentage(
        studentId,
        { periodId }
      );
      return percentage >= 75; // 75% é o mínimo legal
    } catch (error: any) {
      const message = error?.message || 'Erro ao verificar frequência mínima';
      toast.error(message);
      return false;
    }
  },

  fetchStats: async (studentId: number, options = {}) => {
    set({ loading: true, error: null });
    try {
      const attendances = await attendanceService.getStudentAttendance(
        studentId,
        options
      );

      const totalLessons = attendances.length;
      const presences = attendances.filter((a: any) => a.status === 'Presente').length;
      const absences = attendances.filter((a: any) => 
        a.status === 'Falta' || a.status === 'Falta_Justificada'
      ).length;
      const justifiedAbsences = attendances.filter((a: any) => 
        a.status === 'Falta_Justificada'
      ).length;
      const percentage = totalLessons > 0 ? (presences / totalLessons) * 100 : 0;
      const meetsMinimum = percentage >= 75;

      const stats: AttendanceStats = {
        studentId,
        totalLessons,
        presences,
        absences,
        justifiedAbsences,
        percentage,
        meetsMinimum
      };

      set({ stats, loading: false });
      return stats;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar estatísticas';
      set({ error: message, loading: false, stats: null });
      toast.error(message);
      return null;
    }
  },

  // ==================== ALERTAS ====================

  getStudentsAtRisk: async (classId: number, minimumPercentage = 75) => {
    try {
      const students = await attendanceService.getStudentsAtRisk(
        classId,
        minimumPercentage
      );
      return students;
    } catch (error: any) {
      const message = error?.message || 'Erro ao buscar alunos em risco';
      toast.error(message);
      return [];
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentAttendance: (attendance: Attendance | null) => 
    set({ currentAttendance: attendance }),
}));

// Exportar tipos para uso em componentes
export type { AttendanceState, Attendance, AttendanceStats };

