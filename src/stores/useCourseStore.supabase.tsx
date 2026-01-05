/**
 * useCourseStore - Store para gerenciamento de cursos e disciplinas (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui o useCourseStore.tsx antigo.
 * Após testar e validar, renomear para useCourseStore.tsx
 */

import { create } from 'zustand';
import { courseService, subjectService } from '@/lib/supabase/services/course-service';
import { toast } from 'sonner';

interface Course {
  id: number;
  name: string;
  course_level: string;
  workload_hours?: number;
  description?: string;
  subjects?: any[];
  classes?: any[];
}

interface Subject {
  id: number;
  name: string;
  subject_code?: string;
  workload_hours?: number;
  description?: string;
  courses?: any[];
  teachers?: any[];
}

interface CourseState {
  // Estado
  courses: Course[];
  subjects: Subject[];
  currentCourse: Course | null;
  currentSubject: Subject | null;
  loading: boolean;
  error: string | null;
  
  // Ações - Cursos
  fetchCourses: () => Promise<void>;
  fetchCoursesByLevel: (level: string) => Promise<void>;
  fetchCourseById: (id: number) => Promise<void>;
  createCourse: (data: any) => Promise<Course | null>;
  updateCourse: (id: number, data: any) => Promise<Course | null>;
  deleteCourse: (id: number) => Promise<void>;
  
  // Grade curricular
  addSubjectToCourse: (courseId: number, subjectId: number, options?: any) => Promise<void>;
  removeSubjectFromCourse: (courseId: number, subjectId: number) => Promise<void>;
  fetchCourseSubjects: (courseId: number, options?: any) => Promise<any[]>;
  
  // Turmas do curso
  fetchCourseClasses: (courseId: number, options?: any) => Promise<any[]>;
  
  // Ações - Disciplinas
  fetchSubjects: () => Promise<void>;
  searchSubjects: (searchTerm: string, limit?: number) => Promise<void>;
  fetchSubjectById: (id: number) => Promise<void>;
  createSubject: (data: any) => Promise<Subject | null>;
  updateSubject: (id: number, data: any) => Promise<Subject | null>;
  deleteSubject: (id: number) => Promise<void>;
  
  // Professores da disciplina
  fetchSubjectTeachers: (subjectId: number, options?: any) => Promise<any[]>;
  
  // Estatísticas
  fetchStats: () => Promise<any>;
  calculateTotalWorkload: (courseId: number) => Promise<number>;
  
  // Utilitários
  clearError: () => void;
  setCurrentCourse: (course: Course | null) => void;
  setCurrentSubject: (subject: Subject | null) => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  // Estado inicial
  courses: [],
  subjects: [],
  currentCourse: null,
  currentSubject: null,
  loading: false,
  error: null,

  // ==================== CURSOS ====================

  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      const courses = await courseService.getAll({
        sort: { column: 'name', ascending: true }
      });
      set({ courses, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar cursos';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchCoursesByLevel: async (level: string) => {
    set({ loading: true, error: null });
    try {
      const courses = await courseService.getCoursesByLevel(level);
      set({ courses, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar cursos por nível';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchCourseById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const course = await courseService.getCourseWithSubjects(id);
      set({ currentCourse: course, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar curso';
      set({ error: message, loading: false, currentCourse: null });
      toast.error(message);
    }
  },

  createCourse: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const newCourse = await courseService.createCourse(data);
      
      const { courses } = get();
      set({ 
        courses: [...courses, newCourse], 
        loading: false 
      });
      
      toast.success('Curso criado com sucesso!');
      return newCourse;
    } catch (error: any) {
      const message = error?.message || 'Erro ao criar curso';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  updateCourse: async (id: number, data: any) => {
    set({ loading: true, error: null });
    try {
      const updatedCourse = await courseService.update(id, data);
      
      const { courses } = get();
      set({ 
        courses: courses.map(c => c.id === id ? { ...c, ...updatedCourse } : c),
        currentCourse: get().currentCourse?.id === id ? { ...get().currentCourse, ...updatedCourse } : get().currentCourse,
        loading: false 
      });
      
      toast.success('Curso atualizado com sucesso!');
      return updatedCourse;
    } catch (error: any) {
      const message = error?.message || 'Erro ao atualizar curso';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  deleteCourse: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await courseService.delete(id);
      
      const { courses } = get();
      set({ 
        courses: courses.filter(c => c.id !== id),
        currentCourse: get().currentCourse?.id === id ? null : get().currentCourse,
        loading: false 
      });
      
      toast.success('Curso removido com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao remover curso';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== GRADE CURRICULAR ====================

  addSubjectToCourse: async (courseId: number, subjectId: number, options?: any) => {
    set({ loading: true, error: null });
    try {
      await courseService.addSubjectToCourse(courseId, subjectId, options);
      
      // Recarregar dados do curso
      if (get().currentCourse?.id === courseId) {
        await get().fetchCourseById(courseId);
      }
      
      toast.success('Disciplina adicionada ao curso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao adicionar disciplina';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  removeSubjectFromCourse: async (courseId: number, subjectId: number) => {
    set({ loading: true, error: null });
    try {
      await courseService.removeSubjectFromCourse(courseId, subjectId);
      
      // Recarregar dados do curso
      if (get().currentCourse?.id === courseId) {
        await get().fetchCourseById(courseId);
      }
      
      toast.success('Disciplina removida do curso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao remover disciplina';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchCourseSubjects: async (courseId: number, options?: any) => {
    try {
      const subjects = await courseService.getCourseSubjects(courseId, options);
      return subjects;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar disciplinas do curso';
      toast.error(message);
      return [];
    }
  },

  fetchCourseClasses: async (courseId: number, options?: any) => {
    try {
      const classes = await courseService.getCourseClasses(courseId, options);
      return classes;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar turmas do curso';
      toast.error(message);
      return [];
    }
  },

  // ==================== DISCIPLINAS ====================

  fetchSubjects: async () => {
    set({ loading: true, error: null });
    try {
      const subjects = await subjectService.getAll({
        sort: { column: 'name', ascending: true }
      });
      set({ subjects, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar disciplinas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  searchSubjects: async (searchTerm: string, limit?: number) => {
    set({ loading: true, error: null });
    try {
      const subjects = await subjectService.searchSubjects(searchTerm, limit);
      set({ subjects, loading: false });
    } catch (error: any) {
      const message = error?.message || 'Erro ao buscar disciplinas';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchSubjectById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const subject = await subjectService.getById(id);
      
      // Buscar cursos e professores da disciplina
      const [courses, teachers] = await Promise.all([
        subjectService.getSubjectCourses(id),
        subjectService.getSubjectTeachers(id)
      ]);
      
      set({ 
        currentSubject: { 
          ...subject, 
          courses, 
          teachers 
        }, 
        loading: false 
      });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar disciplina';
      set({ error: message, loading: false, currentSubject: null });
      toast.error(message);
    }
  },

  createSubject: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const newSubject = await subjectService.createSubject(data);
      
      const { subjects } = get();
      set({ 
        subjects: [...subjects, newSubject], 
        loading: false 
      });
      
      toast.success('Disciplina criada com sucesso!');
      return newSubject;
    } catch (error: any) {
      const message = error?.message || 'Erro ao criar disciplina';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  updateSubject: async (id: number, data: any) => {
    set({ loading: true, error: null });
    try {
      const updatedSubject = await subjectService.update(id, data);
      
      const { subjects } = get();
      set({ 
        subjects: subjects.map(s => s.id === id ? { ...s, ...updatedSubject } : s),
        currentSubject: get().currentSubject?.id === id ? { ...get().currentSubject, ...updatedSubject } : get().currentSubject,
        loading: false 
      });
      
      toast.success('Disciplina atualizada com sucesso!');
      return updatedSubject;
    } catch (error: any) {
      const message = error?.message || 'Erro ao atualizar disciplina';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  deleteSubject: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await subjectService.delete(id);
      
      const { subjects } = get();
      set({ 
        subjects: subjects.filter(s => s.id !== id),
        currentSubject: get().currentSubject?.id === id ? null : get().currentSubject,
        loading: false 
      });
      
      toast.success('Disciplina removida com sucesso!');
    } catch (error: any) {
      const message = error?.message || 'Erro ao remover disciplina';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchSubjectTeachers: async (subjectId: number, options?: any) => {
    try {
      const teachers = await subjectService.getSubjectTeachers(subjectId, options);
      return teachers;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar professores da disciplina';
      toast.error(message);
      return [];
    }
  },

  // ==================== ESTATÍSTICAS ====================

  fetchStats: async () => {
    try {
      const stats = await courseService.getStats();
      return stats;
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar estatísticas';
      toast.error(message);
      return null;
    }
  },

  calculateTotalWorkload: async (courseId: number) => {
    try {
      const total = await courseService.calculateTotalWorkload(courseId);
      return total;
    } catch (error: any) {
      const message = error?.message || 'Erro ao calcular carga horária';
      toast.error(message);
      return 0;
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),
  
  setCurrentCourse: (course: Course | null) => set({ currentCourse: course }),
  
  setCurrentSubject: (subject: Subject | null) => set({ currentSubject: subject }),
}));

// Exportar tipos para uso em componentes
export type { CourseState, Course, Subject };

