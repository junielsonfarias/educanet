/**
 * useCourseStore - Store para gerenciamento de cursos e disciplinas (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui o useCourseStore.tsx antigo.
 * Após testar e validar, renomear para useCourseStore.tsx
 */

import { create } from 'zustand';
import { courseService, subjectService } from '@/lib/supabase/services/course-service';
// Toast desabilitado temporariamente - Sonner incompatível com React 19
// import { toast } from 'sonner';

interface Course {
  id: number;
  name: string;
  education_level: string;
  workload_hours?: number;
  description?: string;
  subjects?: Record<string, unknown>[];
  classes?: Record<string, unknown>[];
}

interface Subject {
  id: number;
  name: string;
  subject_code?: string;
  workload_hours?: number;
  description?: string;
  courses?: Record<string, unknown>[];
  teachers?: Record<string, unknown>[];
}

interface CourseSubjectOptions {
  workload_hours?: number;
  is_mandatory?: boolean;
  order?: number;
}

interface FetchOptions {
  academicYearId?: number;
  status?: string;
}

interface CourseStats {
  totalCourses: number;
  totalSubjects: number;
  coursesByLevel: Record<string, number>;
}

interface SerieAno {
  id: number;
  name: string;
  numero?: number;
  evaluationRuleId?: string;
  subjects?: SubjectItem[];
}

interface SubjectItem {
  id: number;
  name: string;
  workload: number;
}

interface SerieAnoFormData {
  name?: string;
  numero?: number;
  evaluationRuleId?: string;
}

interface SubjectFormData {
  name?: string;
  workload?: number;
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
  createCourse: (data: Partial<Course>) => Promise<Course | null>;
  updateCourse: (id: number, data: Partial<Course>) => Promise<Course | null>;
  deleteCourse: (id: number) => Promise<void>;

  // Grade curricular
  addSubjectToCourse: (courseId: number, subjectId: number, options?: CourseSubjectOptions) => Promise<void>;
  removeSubjectFromCourse: (courseId: number, subjectId: number) => Promise<void>;
  fetchCourseSubjects: (courseId: number, options?: FetchOptions) => Promise<Subject[]>;

  // Turmas do curso
  fetchCourseClasses: (courseId: number, options?: FetchOptions) => Promise<Record<string, unknown>[]>;

  // Ações - Séries/Anos
  addSerieAno: (courseId: number, data: SerieAnoFormData) => Promise<void>;
  updateSerieAno: (courseId: number, serieId: number, data: SerieAnoFormData) => Promise<void>;
  deleteSerieAno: (courseId: number, serieId: number) => Promise<void>;
  fetchSeriesWithSubjects: (courseId: number) => Promise<SerieAno[]>;

  // Ações - Disciplinas em Séries
  addSubjectToSeries: (courseId: number, serieId: number, data: SubjectFormData) => Promise<void>;
  updateSubjectInSeries: (courseId: number, serieId: number, subjectId: number, data: SubjectFormData) => Promise<void>;
  removeSubjectFromSeries: (courseId: number, serieId: number, subjectId: number) => Promise<void>;

  // Ações - Disciplinas
  fetchSubjects: () => Promise<void>;
  searchSubjects: (searchTerm: string, limit?: number) => Promise<void>;
  fetchSubjectById: (id: number) => Promise<void>;
  createSubject: (data: Partial<Subject>) => Promise<Subject | null>;
  updateSubject: (id: number, data: Partial<Subject>) => Promise<Subject | null>;
  deleteSubject: (id: number) => Promise<void>;

  // Professores da disciplina
  fetchSubjectTeachers: (subjectId: number, options?: FetchOptions) => Promise<Record<string, unknown>[]>;

  // Estatísticas
  fetchStats: () => Promise<CourseStats | null>;
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
      const courses = await courseService.getAllWithSeries();
      set({ courses, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar cursos';
      set({ error: message, loading: false, courses: [] });
      // Não mostrar toast para evitar erro de DOM com Sonner/React 19
      console.warn('Erro ao carregar cursos:', message);
    }
  },

  fetchCoursesByLevel: async (level: string) => {
    set({ loading: true, error: null });
    try {
      const courses = await courseService.getCoursesByLevel(level);
      set({ courses, loading: false });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar cursos por nível';
      set({ error: message, loading: false });
      console.error('Toast:',message);
    }
  },

  fetchCourseById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const course = await courseService.getCourseWithSubjects(id);
      set({ currentCourse: course, loading: false });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar curso';
      set({ error: message, loading: false, currentCourse: null });
      console.error('Toast:',message);
    }
  },

  createCourse: async (data: Partial<Course>) => {
    set({ loading: true, error: null });
    try {
      const newCourse = await courseService.createCourse(data);
      
      const { courses } = get();
      set({ 
        courses: [...courses, newCourse], 
        loading: false 
      });
      
      console.log('Toast:','Curso criado com sucesso!');
      return newCourse;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao criar curso';
      set({ error: message, loading: false });
      console.error('Toast:',message);
      return null;
    }
  },

  updateCourse: async (id: number, data: Partial<Course>) => {
    set({ loading: true, error: null });
    try {
      const updatedCourse = await courseService.update(id, data);
      
      const { courses } = get();
      set({ 
        courses: courses.map(c => c.id === id ? { ...c, ...updatedCourse } : c),
        currentCourse: get().currentCourse?.id === id ? { ...get().currentCourse, ...updatedCourse } : get().currentCourse,
        loading: false 
      });
      
      console.log('Toast:','Curso atualizado com sucesso!');
      return updatedCourse;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao atualizar curso';
      set({ error: message, loading: false });
      console.error('Toast:',message);
      return null;
    }
  },

  deleteCourse: async (id: number) => {
    set({ loading: true, error: null });
    try {
      // Usar o método com limpeza de vínculos
      await courseService.deleteCourseWithCleanup(id);

      const { courses } = get();
      set({
        courses: courses.filter(c => c.id !== id),
        currentCourse: get().currentCourse?.id === id ? null : get().currentCourse,
        loading: false
      });

      console.log('Toast:','Etapa de ensino removida com sucesso! Vínculos limpos.');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao remover etapa de ensino';
      set({ error: message, loading: false });
      console.error('Toast:', message);
    }
  },

  // ==================== GRADE CURRICULAR ====================

  addSubjectToCourse: async (courseId: number, subjectId: number, options?: CourseSubjectOptions) => {
    set({ loading: true, error: null });
    try {
      await courseService.addSubjectToCourse(courseId, subjectId, options);
      
      // Recarregar dados do curso
      if (get().currentCourse?.id === courseId) {
        await get().fetchCourseById(courseId);
      }
      
      console.log('Toast:','Disciplina adicionada ao curso!');
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao adicionar disciplina';
      set({ error: message, loading: false });
      console.error('Toast:',message);
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
      
      console.log('Toast:','Disciplina removida do curso!');
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao remover disciplina';
      set({ error: message, loading: false });
      console.error('Toast:',message);
    }
  },

  fetchCourseSubjects: async (courseId: number, options?: FetchOptions) => {
    try {
      const subjects = await courseService.getCourseSubjects(courseId, options);
      return subjects;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar disciplinas do curso';
      console.error('Toast:',message);
      return [];
    }
  },

  fetchCourseClasses: async (courseId: number, options?: FetchOptions) => {
    try {
      const classes = await courseService.getCourseClasses(courseId, options);
      return classes;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar turmas do curso';
      console.error('Toast:',message);
      return [];
    }
  },

  // ==================== SÉRIES/ANOS ====================

  addSerieAno: async (courseId: number, data: SerieAnoFormData) => {
    set({ loading: true, error: null });
    try {
      await courseService.addSeries(courseId, {
        name: data.name || '',
        numero: data.numero,
        evaluationRuleId: data.evaluationRuleId
      });

      // Recarregar dados do curso
      await get().fetchCourses();
      set({ loading: false });

      console.log('Toast:', 'Série/Ano adicionada com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao adicionar série/ano';
      set({ error: message, loading: false });
      console.error('Toast:', message);
    }
  },

  updateSerieAno: async (_courseId: number, serieId: number, data: SerieAnoFormData) => {
    set({ loading: true, error: null });
    try {
      await courseService.updateSeries(serieId, {
        name: data.name,
        numero: data.numero,
        evaluationRuleId: data.evaluationRuleId
      });

      // Recarregar dados do curso
      await get().fetchCourses();
      set({ loading: false });

      console.log('Toast:', 'Série/Ano atualizada com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao atualizar série/ano';
      set({ error: message, loading: false });
      console.error('Toast:', message);
    }
  },

  deleteSerieAno: async (_courseId: number, serieId: number) => {
    set({ loading: true, error: null });
    try {
      await courseService.deleteSeries(serieId);

      // Recarregar dados
      await get().fetchCourses();
      set({ loading: false });

      console.log('Toast:', 'Série/Ano removida com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao remover série/ano';
      set({ error: message, loading: false });
      console.error('Toast:', message);
    }
  },

  fetchSeriesWithSubjects: async (courseId: number) => {
    try {
      const result = await courseService.getCourseSeriesWithSubjects(courseId);
      return result.seriesAnos;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar séries';
      console.error('Toast:', message);
      return [];
    }
  },

  // ==================== DISCIPLINAS EM SÉRIES ====================

  addSubjectToSeries: async (courseId: number, serieId: number, data: SubjectFormData) => {
    set({ loading: true, error: null });
    try {
      await courseService.addSubjectToSeries(courseId, serieId, {
        name: data.name || '',
        workload: data.workload
      });

      // Recarregar dados
      await get().fetchCourses();
      set({ loading: false });

      console.log('Toast:', 'Disciplina adicionada à série!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao adicionar disciplina';
      set({ error: message, loading: false });
      console.error('Toast:', message);
    }
  },

  updateSubjectInSeries: async (_courseId: number, _serieId: number, subjectId: number, data: SubjectFormData) => {
    set({ loading: true, error: null });
    try {
      await courseService.updateSubjectInSeries(subjectId, {
        name: data.name,
        workload: data.workload
      });

      // Recarregar dados
      await get().fetchCourses();
      set({ loading: false });

      console.log('Toast:', 'Disciplina atualizada!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao atualizar disciplina';
      set({ error: message, loading: false });
      console.error('Toast:', message);
    }
  },

  removeSubjectFromSeries: async (_courseId: number, _serieId: number, subjectId: number) => {
    set({ loading: true, error: null });
    try {
      await courseService.removeSubjectFromSeries(subjectId);

      // Recarregar dados
      await get().fetchCourses();
      set({ loading: false });

      console.log('Toast:', 'Disciplina removida da série!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao remover disciplina';
      set({ error: message, loading: false });
      console.error('Toast:', message);
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
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar disciplinas';
      set({ error: message, loading: false });
      console.error('Toast:',message);
    }
  },

  searchSubjects: async (searchTerm: string, limit?: number) => {
    set({ loading: true, error: null });
    try {
      const subjects = await subjectService.searchSubjects(searchTerm, limit);
      set({ subjects, loading: false });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao buscar disciplinas';
      set({ error: message, loading: false });
      console.error('Toast:',message);
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
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar disciplina';
      set({ error: message, loading: false, currentSubject: null });
      console.error('Toast:',message);
    }
  },

  createSubject: async (data: Partial<Subject>) => {
    set({ loading: true, error: null });
    try {
      const newSubject = await subjectService.createSubject(data);
      
      const { subjects } = get();
      set({ 
        subjects: [...subjects, newSubject], 
        loading: false 
      });
      
      console.log('Toast:','Disciplina criada com sucesso!');
      return newSubject;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao criar disciplina';
      set({ error: message, loading: false });
      console.error('Toast:',message);
      return null;
    }
  },

  updateSubject: async (id: number, data: Partial<Subject>) => {
    set({ loading: true, error: null });
    try {
      const updatedSubject = await subjectService.update(id, data);
      
      const { subjects } = get();
      set({ 
        subjects: subjects.map(s => s.id === id ? { ...s, ...updatedSubject } : s),
        currentSubject: get().currentSubject?.id === id ? { ...get().currentSubject, ...updatedSubject } : get().currentSubject,
        loading: false 
      });
      
      console.log('Toast:','Disciplina atualizada com sucesso!');
      return updatedSubject;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao atualizar disciplina';
      set({ error: message, loading: false });
      console.error('Toast:',message);
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
      
      console.log('Toast:','Disciplina removida com sucesso!');
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao remover disciplina';
      set({ error: message, loading: false });
      console.error('Toast:',message);
    }
  },

  fetchSubjectTeachers: async (subjectId: number, options?: FetchOptions) => {
    try {
      const teachers = await subjectService.getSubjectTeachers(subjectId, options);
      return teachers;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar professores da disciplina';
      console.error('Toast:',message);
      return [];
    }
  },

  // ==================== ESTATÍSTICAS ====================

  fetchStats: async () => {
    try {
      const stats = await courseService.getStats();
      return stats;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar estatísticas';
      console.error('Toast:',message);
      return null;
    }
  },

  calculateTotalWorkload: async (courseId: number) => {
    try {
      const total = await courseService.calculateTotalWorkload(courseId);
      return total;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao calcular carga horária';
      console.error('Toast:',message);
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

