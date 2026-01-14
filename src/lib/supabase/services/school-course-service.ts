/**
 * SchoolCourseService - Serviço para gerenciamento de cursos por escola/ano letivo
 *
 * Gerencia a configuração de quais cursos/etapas de ensino cada escola
 * oferece em cada ano letivo.
 */

import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

export interface SchoolAcademicYearCourse {
  id: number;
  school_id: number;
  academic_year_id: number;
  course_id: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by?: number;
  deleted_at?: string;
}

export interface SchoolCourseWithDetails extends SchoolAcademicYearCourse {
  school?: {
    id: number;
    name: string;
  };
  academic_year?: {
    id: number;
    year: number;
    start_date: string;
    end_date: string;
  };
  course?: {
    id: number;
    name: string;
    education_level: string;
    description?: string;
  };
}

export interface CreateSchoolCourseData {
  school_id: number;
  academic_year_id: number;
  course_id: number;
  is_active?: boolean;
  notes?: string;
}

export interface EducationGrade {
  id: number;
  education_level: string;
  grade_name: string;
  grade_order: number;
  is_final_grade?: boolean;
}

export interface SchoolCourseGrade {
  id: number;
  school_course_id: number;
  education_grade_id: number;
  is_active: boolean;
  max_students?: number;
  notes?: string;
  education_grade?: EducationGrade;
}

class SchoolCourseService {
  /**
   * Buscar cursos configurados para uma escola em um ano letivo
   */
  async getBySchoolAndYear(
    schoolId: number,
    academicYearId: number
  ): Promise<SchoolCourseWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('school_academic_year_courses')
        .select(`
          *,
          school:schools(id, name),
          academic_year:academic_years(id, year, start_date, end_date),
          course:courses(id, name, education_level, description)
        `)
        .eq('school_id', schoolId)
        .eq('academic_year_id', academicYearId)
        .is('deleted_at', null)
        .order('course_id');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolCourseService.getBySchoolAndYear:', error);
      throw error;
    }
  }

  /**
   * Buscar todos os cursos configurados para uma escola (todos os anos)
   */
  async getBySchool(schoolId: number): Promise<SchoolCourseWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('school_academic_year_courses')
        .select(`
          *,
          school:schools(id, name),
          academic_year:academic_years(id, year, start_date, end_date),
          course:courses(id, name, education_level, description)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .order('academic_year_id', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolCourseService.getBySchool:', error);
      throw error;
    }
  }

  /**
   * Buscar histórico de cursos de uma escola agrupado por ano
   */
  async getSchoolHistory(schoolId: number): Promise<{
    year: number;
    academic_year_id: number;
    courses: Array<{
      id: number;
      course_id: number;
      course_name: string;
      education_level: string;
      is_active: boolean;
    }>;
  }[]> {
    try {
      const data = await this.getBySchool(schoolId);

      // Agrupar por ano letivo
      const grouped = data.reduce((acc, item) => {
        const year = item.academic_year?.year || 0;
        const yearId = item.academic_year_id;

        if (!acc[year]) {
          acc[year] = {
            year,
            academic_year_id: yearId,
            courses: []
          };
        }

        acc[year].courses.push({
          id: item.id,
          course_id: item.course_id,
          course_name: item.course?.name || '',
          education_level: item.course?.education_level || '',
          is_active: item.is_active
        });

        return acc;
      }, {} as Record<number, { year: number; academic_year_id: number; courses: Array<{ id: number; course_id: number; course_name: string; education_level: string; is_active: boolean }> }>);

      // Converter para array ordenado por ano (decrescente)
      return Object.values(grouped).sort((a, b) => b.year - a.year);
    } catch (error) {
      console.error('Error in SchoolCourseService.getSchoolHistory:', error);
      throw error;
    }
  }

  /**
   * Adicionar curso a uma escola em um ano letivo
   */
  async addCourse(data: CreateSchoolCourseData): Promise<SchoolAcademicYearCourse> {
    try {
      const { data: result, error } = await supabase
        .from('school_academic_year_courses')
        .insert({
          school_id: data.school_id,
          academic_year_id: data.academic_year_id,
          course_id: data.course_id,
          is_active: data.is_active ?? true,
          notes: data.notes,
          created_by: 1 // TODO: pegar do contexto de auth
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return result;
    } catch (error) {
      console.error('Error in SchoolCourseService.addCourse:', error);
      throw error;
    }
  }

  /**
   * Adicionar múltiplos cursos de uma vez
   */
  async addMultipleCourses(
    schoolId: number,
    academicYearId: number,
    courseIds: number[]
  ): Promise<SchoolAcademicYearCourse[]> {
    try {
      const records = courseIds.map(courseId => ({
        school_id: schoolId,
        academic_year_id: academicYearId,
        course_id: courseId,
        is_active: true,
        created_by: 1 // TODO: pegar do contexto de auth
      }));

      const { data, error } = await supabase
        .from('school_academic_year_courses')
        .upsert(records, {
          onConflict: 'school_id,academic_year_id,course_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolCourseService.addMultipleCourses:', error);
      throw error;
    }
  }

  /**
   * Remover curso de uma escola em um ano letivo (soft delete)
   */
  async removeCourse(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('school_academic_year_courses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in SchoolCourseService.removeCourse:', error);
      throw error;
    }
  }

  /**
   * Ativar/desativar curso para uma escola
   */
  async toggleCourseActive(id: number, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('school_academic_year_courses')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in SchoolCourseService.toggleCourseActive:', error);
      throw error;
    }
  }

  /**
   * Verificar se um curso está habilitado para uma escola em um ano
   */
  async isCourseEnabled(
    schoolId: number,
    academicYearId: number,
    courseId: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('school_academic_year_courses')
        .select('id')
        .eq('school_id', schoolId)
        .eq('academic_year_id', academicYearId)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw handleSupabaseError(error);
      }

      return !!data;
    } catch (error) {
      console.error('Error in SchoolCourseService.isCourseEnabled:', error);
      return false;
    }
  }

  /**
   * Copiar configuração de cursos de um ano para outro
   */
  async copyFromYear(
    schoolId: number,
    sourceYearId: number,
    targetYearId: number
  ): Promise<SchoolAcademicYearCourse[]> {
    try {
      // Buscar cursos do ano origem
      const sourceCourses = await this.getBySchoolAndYear(schoolId, sourceYearId);

      if (sourceCourses.length === 0) {
        return [];
      }

      // Criar registros para o ano destino
      const courseIds = sourceCourses.map(c => c.course_id);
      return await this.addMultipleCourses(schoolId, targetYearId, courseIds);
    } catch (error) {
      console.error('Error in SchoolCourseService.copyFromYear:', error);
      throw error;
    }
  }

  /**
   * Buscar cursos disponíveis (não configurados para a escola no ano)
   */
  async getAvailableCourses(
    schoolId: number,
    academicYearId: number
  ): Promise<Array<{ id: number; name: string; education_level: string }>> {
    try {
      // Buscar cursos já configurados
      const configured = await this.getBySchoolAndYear(schoolId, academicYearId);
      const configuredIds = configured.map(c => c.course_id);

      // Buscar todos os cursos
      const { data: allCourses, error } = await supabase
        .from('courses')
        .select('id, name, education_level')
        .is('deleted_at', null)
        .order('education_level')
        .order('name');

      if (error) throw handleSupabaseError(error);

      // Filtrar cursos não configurados
      return (allCourses || []).filter(c => !configuredIds.includes(c.id));
    } catch (error) {
      console.error('Error in SchoolCourseService.getAvailableCourses:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PARA GERENCIAMENTO DE SÉRIES
  // ==========================================

  /**
   * Buscar todas as séries de um nível educacional
   */
  async getGradesByEducationLevel(educationLevel: string): Promise<EducationGrade[]> {
    try {
      const { data, error } = await supabase
        .from('education_grades')
        .select('*')
        .eq('education_level', educationLevel)
        .order('grade_order');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolCourseService.getGradesByEducationLevel:', error);
      return [];
    }
  }

  /**
   * Buscar séries configuradas para um curso de uma escola
   */
  async getCourseGrades(schoolCourseId: number): Promise<SchoolCourseGrade[]> {
    try {
      const { data, error } = await supabase
        .from('school_academic_year_course_grades')
        .select(`
          *,
          education_grade:education_grades(*)
        `)
        .eq('school_course_id', schoolCourseId)
        .is('deleted_at', null)
        .order('education_grade(grade_order)');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolCourseService.getCourseGrades:', error);
      return [];
    }
  }

  /**
   * Adicionar séries a um curso de escola
   */
  async addGradesToCourse(
    schoolCourseId: number,
    gradeIds: number[]
  ): Promise<SchoolCourseGrade[]> {
    try {
      const records = gradeIds.map(gradeId => ({
        school_course_id: schoolCourseId,
        education_grade_id: gradeId,
        is_active: true,
        created_by: 1 // TODO: pegar do contexto de auth
      }));

      const { data, error } = await supabase
        .from('school_academic_year_course_grades')
        .upsert(records, {
          onConflict: 'school_course_id,education_grade_id',
          ignoreDuplicates: false
        })
        .select(`
          *,
          education_grade:education_grades(*)
        `);

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolCourseService.addGradesToCourse:', error);
      throw error;
    }
  }

  /**
   * Remover série de um curso de escola (soft delete)
   */
  async removeGradeFromCourse(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('school_academic_year_course_grades')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in SchoolCourseService.removeGradeFromCourse:', error);
      throw error;
    }
  }

  /**
   * Atualizar capacidade de uma série em um curso
   */
  async updateGradeCapacity(id: number, maxStudents: number | null): Promise<void> {
    try {
      const { error } = await supabase
        .from('school_academic_year_course_grades')
        .update({ max_students: maxStudents })
        .eq('id', id);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in SchoolCourseService.updateGradeCapacity:', error);
      throw error;
    }
  }

  /**
   * Adicionar curso com séries em uma única operação
   */
  async addCourseWithGrades(
    schoolId: number,
    academicYearId: number,
    courseId: number,
    gradeIds: number[]
  ): Promise<{ course: SchoolAcademicYearCourse; grades: SchoolCourseGrade[] }> {
    try {
      // 1. Adicionar o curso
      const course = await this.addCourse({
        school_id: schoolId,
        academic_year_id: academicYearId,
        course_id: courseId
      });

      // 2. Adicionar as séries se houver
      let grades: SchoolCourseGrade[] = [];
      if (gradeIds.length > 0) {
        grades = await this.addGradesToCourse(course.id, gradeIds);
      }

      return { course, grades };
    } catch (error) {
      console.error('Error in SchoolCourseService.addCourseWithGrades:', error);
      throw error;
    }
  }

  /**
   * Buscar cursos com suas séries para uma escola em um ano
   */
  async getCoursesWithGrades(
    schoolId: number,
    academicYearId: number
  ): Promise<Array<SchoolCourseWithDetails & { grades: SchoolCourseGrade[] }>> {
    try {
      // Buscar cursos
      const courses = await this.getBySchoolAndYear(schoolId, academicYearId);

      // Buscar séries para cada curso
      const coursesWithGrades = await Promise.all(
        courses.map(async (course) => {
          const grades = await this.getCourseGrades(course.id);
          return { ...course, grades };
        })
      );

      return coursesWithGrades;
    } catch (error) {
      console.error('Error in SchoolCourseService.getCoursesWithGrades:', error);
      throw error;
    }
  }
}

export const schoolCourseService = new SchoolCourseService();
export default schoolCourseService;
