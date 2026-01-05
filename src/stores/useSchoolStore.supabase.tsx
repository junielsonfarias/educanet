/**
 * useSchoolStore - Store para gerenciamento de escolas (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui o useSchoolStore.tsx antigo.
 * Após testar e validar, renomear para useSchoolStore.tsx
 */

import { create } from 'zustand';
import { schoolService, type SchoolStats, type SchoolWithStats } from '@/lib/supabase/services/school-service';
import type { School, Class, TeacherFullInfo, StaffFullInfo, StudentFullInfo, Infrastructure, ClassWithDetails } from '@/lib/database-types';
import { toast } from 'sonner';

interface SchoolState {
  // Estado
  schools: School[];
  currentSchool: SchoolWithStats | null;
  loading: boolean;
  error: string | null;
  
  // Estatísticas
  generalStats: {
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    totalClasses: number;
    averageOccupancyRate: number;
  } | null;
  
  // Ações de busca
  fetchSchools: () => Promise<void>;
  fetchActiveSchools: () => Promise<void>;
  fetchSchoolById: (id: number) => Promise<void>;
  fetchSchoolWithStats: (id: number) => Promise<void>;
  searchSchools: (name: string, limit?: number) => Promise<void>;
  
  // Estatísticas e dados relacionados
  fetchSchoolStats: (schoolId: number) => Promise<SchoolStats | null>;
  fetchGeneralStats: () => Promise<void>;
  fetchInfrastructure: (schoolId: number) => Promise<Infrastructure[]>;
  fetchClasses: (schoolId: number, options?: { academicYearId?: number; shift?: string }) => Promise<ClassWithDetails[]>;
  fetchTeachers: (schoolId: number, options?: { employmentStatus?: string }) => Promise<TeacherFullInfo[]>;
  fetchStaff: (schoolId: number, options?: { employmentStatus?: string; positionId?: number; departmentId?: number }) => Promise<StaffFullInfo[]>;
  fetchStudents: (schoolId: number, options?: { status?: string; academicYearId?: number; courseId?: number }) => Promise<StudentFullInfo[]>;
  checkAvailability: (schoolId: number) => Promise<{ capacity: number | null; enrolled: number; available: number; hasAvailability: boolean } | null>;
  
  // Ações CRUD
  createSchool: (data: Partial<School>) => Promise<School | null>;
  updateSchool: (id: number, data: Partial<School>) => Promise<School | null>;
  deleteSchool: (id: number) => Promise<void>;
  
  // Utilitários
  clearError: () => void;
  setCurrentSchool: (school: SchoolWithStats | null) => void;
}

export const useSchoolStore = create<SchoolState>((set, get) => ({
  // Estado inicial
  schools: [],
  currentSchool: null,
  loading: false,
  error: null,
  generalStats: null,

  // ==================== AÇÕES DE BUSCA ====================
  
  fetchSchools: async () => {
    set({ loading: true, error: null });
    try {
      const schools = await schoolService.getAll({
        sort: { column: 'name', ascending: true }
      });
      set({ schools, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar escolas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchActiveSchools: async () => {
    set({ loading: true, error: null });
    try {
      const schools = await schoolService.getActiveSchools();
      set({ schools, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar escolas ativas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchSchoolById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const school = await schoolService.getById(id);
      set({ currentSchool: school ? { ...school } : null, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar dados da escola';
      set({ error: message, loading: false, currentSchool: null });
      toast.error(message);
    }
  },

  fetchSchoolWithStats: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const school = await schoolService.getSchoolWithStats(id);
      set({ currentSchool: school, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar dados da escola';
      set({ error: message, loading: false, currentSchool: null });
      toast.error(message);
    }
  },

  searchSchools: async (name: string, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const schools = await schoolService.searchByName(name, limit);
      set({ schools, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao buscar escolas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== ESTATÍSTICAS E DADOS RELACIONADOS ====================

  fetchSchoolStats: async (schoolId: number) => {
    try {
      const stats = await schoolService.getSchoolStats(schoolId);
      
      // Atualizar currentSchool se for a escola atual
      if (get().currentSchool?.id === schoolId) {
        set({ 
          currentSchool: { 
            ...get().currentSchool!, 
            stats 
          } 
        });
      }
      
      return stats;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar estatísticas';
      toast.error(message);
      return null;
    }
  },

  fetchGeneralStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await schoolService.getGeneralStats();
      set({ generalStats: stats, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar estatísticas gerais';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchInfrastructure: async (schoolId: number) => {
    try {
      const infrastructure = await schoolService.getInfrastructure(schoolId);
      return infrastructure;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar infraestrutura';
      toast.error(message);
      return [];
    }
  },

  fetchClasses: async (schoolId: number, options = {}) => {
    try {
      const classes = await schoolService.getClasses(schoolId, options);
      return classes;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar turmas';
      toast.error(message);
      return [];
    }
  },

  fetchTeachers: async (schoolId: number, options = {}) => {
    try {
      const teachers = await schoolService.getTeachers(schoolId, options);
      return teachers;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar professores';
      toast.error(message);
      return [];
    }
  },

  fetchStaff: async (schoolId: number, options = {}) => {
    try {
      const staff = await schoolService.getStaff(schoolId, options);
      return staff;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar funcionários';
      toast.error(message);
      return [];
    }
  },

  fetchStudents: async (schoolId: number, options = {}) => {
    try {
      const students = await schoolService.getStudents(schoolId, options);
      return students;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar alunos';
      toast.error(message);
      return [];
    }
  },

  checkAvailability: async (schoolId: number) => {
    try {
      const availability = await schoolService.checkAvailability(schoolId);
      return availability;
    } catch (error: any) {
      const message = error?.message || 'Erro ao verificar disponibilidade';
      toast.error(message);
      return null;
    }
  },

  // ==================== AÇÕES CRUD ====================

  createSchool: async (data: Partial<School>) => {
    set({ loading: true, error: null });
    try {
      const newSchool = await schoolService.create(data);
      
      // Adicionar à lista local
      const { schools } = get();
      set({ 
        schools: [...schools, newSchool], 
        loading: false 
      });
      
      toast.success('Escola criada com sucesso!');
      return newSchool;
    } catch (error: any) {
      const message = error?.message || 'Erro ao criar escola';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  updateSchool: async (id: number, data: Partial<School>) => {
    set({ loading: true, error: null });
    try {
      const updatedSchool = await schoolService.update(id, data);
      
      // Atualizar na lista local
      const { schools } = get();
      set({ 
        schools: schools.map(s => s.id === id ? updatedSchool : s),
        currentSchool: get().currentSchool?.id === id ? { ...updatedSchool } : get().currentSchool,
        loading: false 
      });
      
      toast.success('Escola atualizada com sucesso!');
      return updatedSchool;
    } catch (error: any) {
      const message = error?.message || 'Erro ao atualizar escola';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  deleteSchool: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await schoolService.delete(id);
      
      // Remover da lista local
      const { schools } = get();
      set({ 
        schools: schools.filter(s => s.id !== id),
        currentSchool: get().currentSchool?.id === id ? null : get().currentSchool,
        loading: false 
      });
      
      toast.success('Escola removida com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao remover escola';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentSchool: (school: SchoolWithStats | null) => set({ currentSchool: school }),
}));

// Exportar tipos para uso em componentes
export type { SchoolState, SchoolWithStats, SchoolStats };

