/**
 * CourseService - Serviço para gerenciamento de cursos/etapas de ensino e disciplinas
 *
 * Gerencia etapas de ensino (cursos), séries/anos e disciplinas.
 * Usa a tabela education_grades para séries e courses para metadados.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

export interface SerieData {
  name: string;
  order: number;
  is_final?: boolean;
}

export interface CourseData {
  name: string;
  codigoCenso?: string;
  education_level?: string;
  workload_hours?: number;
  description?: string;
  series?: SerieData[];
}

export interface SubjectData {
  name: string;
  subject_code?: string;
  workload_hours?: number;
  description?: string;
}

// Mapeamento de código INEP para education_level no banco (deve corresponder ao ENUM)
const CODIGO_TO_LEVEL: Record<string, string> = {
  '01': 'Educação Infantil',    // Creche
  '02': 'Educação Infantil',    // Pré-escola
  '03': 'Ensino Fundamental I', // Anos Iniciais
  '04': 'Ensino Fundamental II',// Anos Finais
  '05': 'Ensino Médio',
  '06': 'EJA',
};

class CourseService extends BaseService {
  constructor() {
    super('courses');
  }

  /**
   * Buscar todos os cursos com suas séries
   */
  async getAllWithSeries(): Promise<any[]> {
    try {
      // Buscar cursos
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      // Se houver erro, retornar array vazio (não lançar exceção)
      if (coursesError) {
        console.warn('Erro ao buscar cursos:', coursesError.message);
        return [];
      }

      // Tentar buscar séries (pode não existir se migration não foi aplicada)
      let grades: Record<string, unknown>[] = [];
      const { data: gradesData, error: gradesError } = await supabase
        .from('education_grades')
        .select('*')
        .order('education_level', { ascending: true })
        .order('grade_order', { ascending: true });

      if (!gradesError && gradesData) {
        grades = gradesData;
      } else if (gradesError) {
        console.warn('Tabela education_grades não encontrada ou erro:', gradesError.message);
      }

      // Associar séries aos cursos baseado no education_level
      const coursesWithSeries = (courses || []).map((course: Record<string, unknown>) => {
        const courseLevel = course.education_level as string;
        const courseSeries = courseLevel
          ? grades.filter((g: Record<string, unknown>) => g.education_level === courseLevel)
          : [];
        return {
          ...course,
          series: courseSeries,
          seriesCount: courseSeries.length,
        };
      });

      return coursesWithSeries;
    } catch (error) {
      console.error('Error in CourseService.getAllWithSeries:', error);
      // Retornar array vazio em caso de erro (não propagar exceção)
      return [];
    }
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

      // Buscar séries do nível de ensino
      if (data?.education_level) {
        const { data: grades } = await supabase
          .from('education_grades')
          .select('*')
          .eq('education_level', data.education_level)
          .order('grade_order', { ascending: true });

        data.series = grades || [];
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
        .eq('education_level', level)
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
   * Criar curso/etapa de ensino com séries
   */
  async createCourse(data: CourseData): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Obter person_id do usuário atual
      let createdBy: number | null = null;
      if (user?.id) {
        const { data: authUser } = await supabase
          .from('auth_users')
          .select('person_id')
          .eq('id', user.id)
          .single();
        createdBy = authUser?.person_id || 1;
      }

      // Determinar o education_level baseado no código INEP
      const courseLevel = data.codigoCenso
        ? CODIGO_TO_LEVEL[data.codigoCenso] || data.name
        : data.education_level || data.name;

      // 1. Criar o curso (tentar com education_level, se falhar usar sem)
      let course: Record<string, unknown> | null = null;

      // Primeiro tentar com education_level
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          name: data.name,
          education_level: courseLevel,
          description: data.description,
          workload_hours: data.workload_hours,
          created_by: createdBy || 1
        })
        .select()
        .single();

      if (courseError) {
        // Se erro for por coluna não existir, tentar sem education_level
        if (courseError.message?.includes('education_level')) {
          console.warn('Coluna education_level não existe. Execute a migration 040.');
          const { data: basicCourse, error: basicError } = await supabase
            .from('courses')
            .insert({
              name: data.name,
              description: data.description,
              workload_hours: data.workload_hours,
              created_by: createdBy || 1
            })
            .select()
            .single();

          if (basicError) throw handleSupabaseError(basicError);
          course = basicCourse;
        } else {
          throw handleSupabaseError(courseError);
        }
      } else {
        course = courseData;
      }

      // 2. Tentar criar as séries em education_grades (se a tabela existir)
      if (data.series && data.series.length > 0) {
        try {
          for (const serie of data.series) {
            // Verificar se a série já existe
            const { data: existingGrade } = await supabase
              .from('education_grades')
              .select('id')
              .eq('education_level', courseLevel)
              .eq('grade_name', serie.name)
              .maybeSingle();

            if (!existingGrade) {
              // Inserir nova série
              await supabase
                .from('education_grades')
                .insert({
                  education_level: courseLevel,
                  grade_name: serie.name,
                  grade_order: serie.order,
                  is_final_grade: serie.is_final || false,
                });
            }
          }

          // Atualizar next_grade_id das séries
          const { data: grades } = await supabase
            .from('education_grades')
            .select('*')
            .eq('education_level', courseLevel)
            .order('grade_order', { ascending: true });

          if (grades && grades.length > 1) {
            for (let i = 0; i < grades.length - 1; i++) {
              await supabase
                .from('education_grades')
                .update({ next_grade_id: grades[i + 1].id })
                .eq('id', grades[i].id);
            }
          }
        } catch (seriesError) {
          // Tabela education_grades não existe - ignorar silenciosamente
          console.warn('Não foi possível criar séries. Execute a migration 040.');
        }
      }

      // Retornar curso com séries
      return {
        ...course,
        education_level: courseLevel,
        series: data.series || [],
        seriesCount: data.series?.length || 0,
      };
    } catch (error) {
      console.error('Error in CourseService.createCourse:', error);
      throw error;
    }
  }

  /**
   * Buscar séries de um nível de ensino
   */
  async getSeriesByLevel(educationLevel: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('education_grades')
        .select('*')
        .eq('education_level', educationLevel)
        .order('grade_order', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in CourseService.getSeriesByLevel:', error);
      throw error;
    }
  }

  /**
   * Buscar todas as séries disponíveis
   */
  async getAllSeries(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('education_grades')
        .select('*')
        .order('education_level', { ascending: true })
        .order('grade_order', { ascending: true });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in CourseService.getAllSeries:', error);
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

      // Agrupar por nome (simplificado, já que education_level não existe)
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

