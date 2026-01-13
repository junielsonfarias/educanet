/**
 * useTeacherStore - Store para gerenciamento de professores (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui o useTeacherStore.tsx antigo.
 * Após testar e validar, renomear para useTeacherStore.tsx
 */

import { create } from 'zustand';
import { teacherService } from '@/lib/supabase/services/teacher-service';
import type { Teacher, TeacherFullInfo, Person } from '@/lib/database-types';
import { toast } from 'sonner';

interface CertificationData {
  name: string;
  institution?: string;
  date?: string;
  expiration_date?: string;
}

interface TeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  teachersBySchool?: Record<number, number>;
}

interface TeacherState {
  // Estado
  teachers: TeacherFullInfo[];
  currentTeacher: TeacherFullInfo | null;
  loading: boolean;
  error: string | null;
  
  // Ações de busca
  fetchTeachers: () => Promise<void>;
  fetchTeachersBySchool: (schoolId: number, options?: { employmentStatus?: string }) => Promise<void>;
  fetchTeacherById: (id: number) => Promise<void>;
  searchTeachers: (name: string, options?: { schoolId?: number; limit?: number }) => Promise<void>;
  
  // Ações CRUD
  createTeacher: (personData: Partial<Person>, teacherData: Partial<Teacher>) => Promise<TeacherFullInfo | null>;
  updateTeacher: (teacherId: number, personData: Partial<Person>, teacherData: Partial<Teacher>) => Promise<TeacherFullInfo | null>;
  deleteTeacher: (teacherId: number) => Promise<void>;
  
  // Turmas e disciplinas
  fetchTeacherClasses: (teacherId: number, options?: { academicYearId?: number }) => Promise<Record<string, unknown>[]>;
  fetchTeacherSubjects: (teacherId: number) => Promise<Record<string, unknown>[]>;
  fetchTeacherStudents: (teacherId: number, options?: { classId?: number; academicYearId?: number }) => Promise<Record<string, unknown>[]>;

  // Alocações
  assignToClass: (teacherId: number, classId: number, subjectId: number, workloadHours?: number) => Promise<void>;
  removeFromClass: (teacherId: number, classId: number, subjectId: number) => Promise<void>;

  // Certificações
  fetchCertifications: (teacherId: number) => Promise<Record<string, unknown>[]>;
  addCertification: (teacherId: number, certificationData: CertificationData) => Promise<void>;

  // Desenvolvimento profissional
  fetchProfessionalDevelopment: (teacherId: number) => Promise<Record<string, unknown>[]>;

  // Estatísticas
  fetchStats: (schoolId?: number) => Promise<TeacherStats | null>;
  
  // Utilitários
  clearError: () => void;
  setCurrentTeacher: (teacher: TeacherFullInfo | null) => void;
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  // Estado inicial
  teachers: [],
  currentTeacher: null,
  loading: false,
  error: null,

  // ==================== AÇÕES DE BUSCA ====================
  
  fetchTeachers: async () => {
    set({ loading: true, error: null });
    try {
      const teachers = await teacherService.getAll({
        sort: { column: 'id', ascending: true }
      });

      // Buscar informações completas
      const teachersWithFullInfo = await Promise.all(
        teachers.map(teacher => teacherService.getTeacherFullInfo(teacher.id))
      );

      // Ordenar por nome após buscar as informações completas
      const sortedTeachers = teachersWithFullInfo
        .filter(Boolean)
        .sort((a, b) => {
          const nameA = a?.person?.full_name || '';
          const nameB = b?.person?.full_name || '';
          return nameA.localeCompare(nameB, 'pt-BR');
        }) as TeacherFullInfo[];

      set({
        teachers: sortedTeachers,
        loading: false
      });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar professores';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchTeachersBySchool: async (schoolId: number, options = {}) => {
    set({ loading: true, error: null });
    try {
      const teachers = await teacherService.getBySchool(schoolId, options);
      set({ teachers, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar professores da escola';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchTeacherById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const teacher = await teacherService.getTeacherFullInfo(id);
      set({ currentTeacher: teacher, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar dados do professor';
      set({ error: message, loading: false, currentTeacher: null });
      toast.error(message);
    }
  },

  searchTeachers: async (name: string, options = {}) => {
    set({ loading: true, error: null });
    try {
      const teachers = await teacherService.searchByName(name, options);
      set({ teachers, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar professores';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== AÇÕES CRUD ====================

  createTeacher: async (personData: Partial<Person>, teacherData: Partial<Teacher>) => {
    set({ loading: true, error: null });
    try {
      const newTeacher = await teacherService.createTeacher(personData, teacherData);
      
      const { teachers } = get();
      set({ 
        teachers: [...teachers, newTeacher], 
        loading: false 
      });
      
      toast.success('Professor criado com sucesso!');
      return newTeacher;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao criar professor';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  updateTeacher: async (teacherId: number, personData: Partial<Person>, teacherData: Partial<Teacher>) => {
    set({ loading: true, error: null });
    try {
      const updatedTeacher = await teacherService.updateTeacher(teacherId, personData, teacherData);
      
      const { teachers } = get();
      set({ 
        teachers: teachers.map(t => t.id === teacherId ? updatedTeacher : t),
        currentTeacher: get().currentTeacher?.id === teacherId ? updatedTeacher : get().currentTeacher,
        loading: false 
      });
      
      toast.success('Professor atualizado com sucesso!');
      return updatedTeacher;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao atualizar professor';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  deleteTeacher: async (teacherId: number) => {
    set({ loading: true, error: null });
    try {
      await teacherService.delete(teacherId);
      
      const { teachers } = get();
      set({ 
        teachers: teachers.filter(t => t.id !== teacherId),
        currentTeacher: get().currentTeacher?.id === teacherId ? null : get().currentTeacher,
        loading: false 
      });
      
      toast.success('Professor removido com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao remover professor';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== TURMAS E DISCIPLINAS ====================

  fetchTeacherClasses: async (teacherId: number, options = {}) => {
    try {
      const classes = await teacherService.getTeacherClasses(teacherId, options);
      return classes;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar turmas do professor';
      toast.error(message);
      return [];
    }
  },

  fetchTeacherSubjects: async (teacherId: number) => {
    try {
      const subjects = await teacherService.getTeacherSubjects(teacherId);
      return subjects;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar disciplinas do professor';
      toast.error(message);
      return [];
    }
  },

  fetchTeacherStudents: async (teacherId: number, options = {}) => {
    try {
      const students = await teacherService.getTeacherStudents(teacherId, options);
      return students;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar alunos do professor';
      toast.error(message);
      return [];
    }
  },

  // ==================== ALOCAÇÕES ====================

  assignToClass: async (teacherId: number, classId: number, subjectId: number, workloadHours?: number) => {
    set({ loading: true, error: null });
    try {
      await teacherService.assignToClass(teacherId, classId, subjectId, workloadHours);
      
      // Recarregar dados do professor
      if (get().currentTeacher?.id === teacherId) {
        await get().fetchTeacherById(teacherId);
      }
      
      toast.success('Professor alocado à turma com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao alocar professor';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  removeFromClass: async (teacherId: number, classId: number, subjectId: number) => {
    set({ loading: true, error: null });
    try {
      await teacherService.removeFromClass(teacherId, classId, subjectId);
      
      // Recarregar dados do professor
      if (get().currentTeacher?.id === teacherId) {
        await get().fetchTeacherById(teacherId);
      }
      
      toast.success('Alocação removida com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao remover alocação';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== CERTIFICAÇÕES ====================

  fetchCertifications: async (teacherId: number) => {
    try {
      const certifications = await teacherService.getCertifications(teacherId);
      return certifications;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar certificações';
      toast.error(message);
      return [];
    }
  },

  addCertification: async (teacherId: number, certificationData: CertificationData) => {
    set({ loading: true, error: null });
    try {
      await teacherService.addCertification(teacherId, certificationData);
      
      // Recarregar dados do professor
      if (get().currentTeacher?.id === teacherId) {
        await get().fetchTeacherById(teacherId);
      }
      
      toast.success('Certificação adicionada com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao adicionar certificação';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== DESENVOLVIMENTO PROFISSIONAL ====================

  fetchProfessionalDevelopment: async (teacherId: number) => {
    try {
      const programs = await teacherService.getProfessionalDevelopment(teacherId);
      return programs;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar programas de desenvolvimento';
      toast.error(message);
      return [];
    }
  },

  // ==================== ESTATÍSTICAS ====================

  fetchStats: async (schoolId?: number) => {
    try {
      const stats = await teacherService.getStats(schoolId);
      return stats;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar estatísticas';
      toast.error(message);
      return null;
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentTeacher: (teacher: TeacherFullInfo | null) => set({ currentTeacher: teacher }),
}));

// Exportar tipos para uso em componentes
export type { TeacherState, TeacherFullInfo };

