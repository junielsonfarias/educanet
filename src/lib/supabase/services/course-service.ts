/**
 * CourseService - Serviço para gerenciamento de cursos e disciplinas
 * 
 * Gerencia cursos, disciplinas, grades curriculares e séries/anos.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

export interface CourseData {
  name: string;
  course_level: string;
  workload_hours?: number;
  description?: string;
}

export interface SubjectData {
  name: string;
  subject_code?: string;
  workload_hours?: number;
  description?: string;
}

class CourseService extends BaseService {
  constructor() {
    super('courses');
  }

  /**
   * Buscar curso com disciplinas
   */
  async getCourseWithSubjects(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          subjects:course_subjects(
            *,
            subject:subjects(*)
          )
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
      console.error('Error in CourseService.getCourseWithSubjects:', error);
      throw error;
    }
  }

  /**
   * Buscar cursos por nível
   */
  async getCoursesByLevel(level: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('course_level', level)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in CourseService.getCoursesByLevel:', error);
      throw error;
    }
  }

  /**
   * Criar curso
   */
  async createCourse(data: CourseData): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: course, error } = await supabase
        .from('courses')
        .insert({
          ...data,
          created_by: user?.id || 1
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return course;
    } catch (error) {
      console.error('Error in CourseService.createCourse:', error);
      throw error;
    }
  }

  /**
   * Adicionar disciplina ao curso
   */
  async addSubjectToCourse(courseId: number, subjectId: number, options?: {
    serie?: string;
    isOptional?: boolean;
    workloadHours?: number;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('course_subjects')
        .insert({
          course_id: courseId,
          subject_id: subjectId,
          serie: options?.serie || '1',
          is_optional: options?.isOptional || false,
          workload_hours: options?.workloadHours,
          created_by: user?.id || 1
        });

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in CourseService.addSubjectToCourse:', error);
      throw error;
    }
  }

  /**
   * Remover disciplina do curso
   */
  async removeSubjectFromCourse(courseId: number, subjectId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('course_subjects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('course_id', courseId)
        .eq('subject_id', subjectId);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in CourseService.removeSubjectFromCourse:', error);
      throw error;
    }
  }

  /**
   * Buscar disciplinas de um curso
   */
  async getCourseSubjects(courseId: number, options?: {
    serie?: string;
    optionalOnly?: boolean;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('course_subjects')
        .select(`
          *,
          subject:subjects(*)
        `)
        .eq('course_id', courseId)
        .is('deleted_at', null);

      if (options?.serie) {
        query = query.eq('serie', options.serie);
      }

      if (options?.optionalOnly) {
        query = query.eq('is_optional', true);
      }

      const { data, error } = await query.order('serie', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in CourseService.getCourseSubjects:', error);
      throw error;
    }
  }

  /**
   * Buscar turmas de um curso
   */
  async getCourseClasses(courseId: number, options?: {
    academicYearId?: number;
    schoolId?: number;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('classes')
        .select(`
          *,
          school:schools(name),
          academic_year:academic_years(year)
        `)
        .eq('course_id', courseId)
        .is('deleted_at', null);

      if (options?.academicYearId) {
        query = query.eq('academic_year_id', options.academicYearId);
      }

      if (options?.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in CourseService.getCourseClasses:', error);
      throw error;
    }
  }

  /**
   * Calcular carga horária total do curso
   */
  async calculateTotalWorkload(courseId: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('course_subjects')
        .select('workload_hours')
        .eq('course_id', courseId)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      const total = (data || []).reduce((sum, item) => {
        return sum + (item.workload_hours || 0);
      }, 0);

      return total;
    } catch (error) {
      console.error('Error in CourseService.calculateTotalWorkload:', error);
      return 0;
    }
  }

  /**
   * Buscar estatísticas
   */
  async getStats(): Promise<{
    total: number;
    byLevel: Record<string, number>;
    totalSubjects: number;
    totalClasses: number;
  }> {
    try {
      // Buscar todos os cursos
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, name')
        .is('deleted_at', null);

      if (coursesError) throw handleSupabaseError(coursesError);

      // Agrupar por nome (simplificado, já que course_level não existe)
      const byLevel: Record<string, number> = {};
      (courses || []).forEach((course: Record<string, unknown>) => {
        const level = course.name || 'Outros';
        byLevel[level] = (byLevel[level] || 0) + 1;
      });

      // Total de disciplinas
      const { count: subjectsCount, error: subjectsError } = await supabase
        .from('subjects')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (subjectsError) throw handleSupabaseError(subjectsError);

      // Total de turmas
      const { count: classesCount, error: classesError } = await supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (classesError) throw handleSupabaseError(classesError);

      return {
        total: courses?.length || 0,
        byLevel,
        totalSubjects: subjectsCount || 0,
        totalClasses: classesCount || 0
      };
    } catch (error) {
      console.error('Error in CourseService.getStats:', error);
      throw error;
    }
  }
}

// Subject Service
class SubjectService extends BaseService {
  constructor() {
    super('subjects');
  }

  /**
   * Criar disciplina
   */
  async createSubject(data: SubjectData): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: subject, error } = await supabase
        .from('subjects')
        .insert({
          ...data,
          created_by: user?.id || 1
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return subject;
    } catch (error) {
      console.error('Error in SubjectService.createSubject:', error);
      throw error;
    }
  }

  /**
   * Buscar disciplinas por termo
   */
  async searchSubjects(searchTerm: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,subject_code.ilike.%${searchTerm}%`)
        .is('deleted_at', null)
        .order('name', { ascending: true })
        .limit(limit);

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SubjectService.searchSubjects:', error);
      throw error;
    }
  }

  /**
   * Buscar cursos que contêm a disciplina
   */
  async getSubjectCourses(subjectId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('course_subjects')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('subject_id', subjectId)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SubjectService.getSubjectCourses:', error);
      throw error;
    }
  }

  /**
   * Buscar professores da disciplina
   */
  async getSubjectTeachers(subjectId: number, options?: {
    schoolId?: number;
    academicYearId?: number;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('class_teacher_subjects')
        .select(`
          *,
          teacher:teachers(
            *,
            person:people(*)
          ),
          class:classes(
            *,
            school:schools(name)
          )
        `)
        .eq('subject_id', subjectId)
        .is('deleted_at', null);

      if (options?.schoolId) {
        query = query.eq('class.school_id', options.schoolId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SubjectService.getSubjectTeachers:', error);
      throw error;
    }
  }
}

export const courseService = new CourseService();
export const subjectService = new SubjectService();
export default { courseService, subjectService };

