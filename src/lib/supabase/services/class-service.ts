/**
 * ClassService - Serviço para gerenciamento de turmas
 * 
 * Gerencia turmas, suas disciplinas, professores, alunos e horários.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import type { Class, ClassWithDetails } from '@/lib/database-types';

export interface ClassStats {
  totalStudents: number;
  capacity: number;
  availableSpots: number;
  occupancyRate: number;
  totalTeachers: number;
  totalSubjects: number;
}

export interface ClassWithFullInfo extends Class {
  school?: any;
  course?: any;
  academic_year?: any;
  stats?: ClassStats;
  students?: any[];
  teachers?: any[];
  subjects?: any[];
}

class ClassService extends BaseService<Class> {
  constructor() {
    super('classes');
  }

  /**
   * Buscar turma com informações completas
   */
  async getClassFullInfo(id: number): Promise<ClassWithFullInfo | null> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_year:academic_years(*)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw handleSupabaseError(error);
      }

      // Buscar estatísticas
      const stats = await this.getClassStats(id);

      return {
        ...data,
        stats
      } as ClassWithFullInfo;
    } catch (error) {
      console.error('Error in ClassService.getClassFullInfo:', error);
      throw error;
    }
  }

  /**
   * Buscar turmas por escola
   */
  async getBySchool(schoolId: number, options?: {
    academicYearId?: number;
    shift?: string;
    courseId?: number;
  }): Promise<ClassWithDetails[]> {
    try {
      let query = supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_year:academic_years(*)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      if (options?.academicYearId) {
        query = query.eq('academic_year_id', options.academicYearId);
      }

      if (options?.shift) {
        query = query.eq('shift', options.shift);
      }

      if (options?.courseId) {
        query = query.eq('course_id', options.courseId);
      }

      const { data, error } = await query.order('name');

      if (error) throw handleSupabaseError(error);
      return (data || []) as ClassWithDetails[];
    } catch (error) {
      console.error('Error in ClassService.getBySchool:', error);
      throw error;
    }
  }

  /**
   * Buscar turmas por ano letivo
   */
  async getByAcademicYear(academicYearId: number, options?: {
    schoolId?: number;
    shift?: string;
  }): Promise<ClassWithDetails[]> {
    try {
      let query = supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_year:academic_years(*)
        `)
        .eq('academic_year_id', academicYearId)
        .is('deleted_at', null);

      if (options?.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      if (options?.shift) {
        query = query.eq('shift', options.shift);
      }

      const { data, error } = await query.order('school.trade_name').order('name');

      if (error) throw handleSupabaseError(error);
      return (data || []) as ClassWithDetails[];
    } catch (error) {
      console.error('Error in ClassService.getByAcademicYear:', error);
      throw error;
    }
  }

  /**
   * Buscar alunos de uma turma
   */
  async getClassStudents(classId: number, options?: {
    status?: string;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('class_enrollments')
        .select(`
          *,
          student_enrollment:student_enrollments(
            *,
            student_profile:student_profiles(
              *,
              person:people(*)
            )
          )
        `)
        .eq('class_id', classId)
        .is('deleted_at', null);

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query.order('student_enrollment.student_profile.person.full_name');

      if (error) throw handleSupabaseError(error);
      return (data || []).map((item: any) => item.student_enrollment?.student_profile).filter(Boolean);
    } catch (error) {
      console.error('Error in ClassService.getClassStudents:', error);
      throw error;
    }
  }

  /**
   * Buscar professores de uma turma (com disciplinas)
   */
  async getClassTeachers(classId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('class_teacher_subjects')
        .select(`
          *,
          teacher:teachers(
            *,
            person:people(*)
          ),
          subject:subjects(*)
        `)
        .eq('class_id', classId)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ClassService.getClassTeachers:', error);
      throw error;
    }
  }

  /**
   * Buscar disciplinas de uma turma
   */
  async getClassSubjects(classId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('class_teacher_subjects')
        .select(`
          subject:subjects(*),
          teacher:teachers(
            person:people(full_name)
          ),
          workload_hours
        `)
        .eq('class_id', classId)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Agrupar por disciplina (pode ter múltiplos professores)
      const subjectsMap = new Map();
      (data || []).forEach((item: any) => {
        if (item.subject) {
          const subjectId = item.subject.id;
          if (!subjectsMap.has(subjectId)) {
            subjectsMap.set(subjectId, {
              ...item.subject,
              teachers: [],
              workload_hours: item.workload_hours
            });
          }
          if (item.teacher) {
            subjectsMap.get(subjectId).teachers.push(item.teacher);
          }
        }
      });

      return Array.from(subjectsMap.values());
    } catch (error) {
      console.error('Error in ClassService.getClassSubjects:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de uma turma
   */
  async getClassStats(classId: number): Promise<ClassStats> {
    try {
      // Buscar dados da turma
      const classData = await this.getById(classId);
      if (!classData) {
        throw new Error('Turma não encontrada');
      }

      // Contar alunos
      const { count: totalStudents } = await supabase
        .from('class_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      // Contar professores únicos
      const { data: teachersData } = await supabase
        .from('class_teacher_subjects')
        .select('teacher_id')
        .eq('class_id', classId)
        .is('deleted_at', null);

      const uniqueTeachers = new Set((teachersData || []).map(t => t.teacher_id));
      const totalTeachers = uniqueTeachers.size;

      // Contar disciplinas únicas
      const { data: subjectsData } = await supabase
        .from('class_teacher_subjects')
        .select('subject_id')
        .eq('class_id', classId)
        .is('deleted_at', null);

      const uniqueSubjects = new Set((subjectsData || []).map(s => s.subject_id));
      const totalSubjects = uniqueSubjects.size;

      const capacity = classData.capacity;
      const enrolled = totalStudents || 0;
      const availableSpots = capacity - enrolled;
      const occupancyRate = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;

      return {
        totalStudents: enrolled,
        capacity,
        availableSpots,
        occupancyRate,
        totalTeachers,
        totalSubjects
      };
    } catch (error) {
      console.error('Error in ClassService.getClassStats:', error);
      throw error;
    }
  }

  /**
   * Verificar se turma tem vagas disponíveis
   */
  async checkAvailability(classId: number): Promise<{
    hasAvailability: boolean;
    availableSpots: number;
    capacity: number;
    enrolled: number;
  }> {
    try {
      const stats = await this.getClassStats(classId);
      
      return {
        hasAvailability: stats.availableSpots > 0,
        availableSpots: stats.availableSpots,
        capacity: stats.capacity,
        enrolled: stats.totalStudents
      };
    } catch (error) {
      console.error('Error in ClassService.checkAvailability:', error);
      throw error;
    }
  }

  /**
   * Matricular aluno em uma turma
   */
  async enrollStudent(
    studentEnrollmentId: number,
    classId: number,
    notes?: string
  ): Promise<void> {
    try {
      // Verificar disponibilidade
      const availability = await this.checkAvailability(classId);
      if (!availability.hasAvailability) {
        throw new Error('Turma sem vagas disponíveis');
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('class_enrollments')
        .insert({
          student_enrollment_id: studentEnrollmentId,
          class_id: classId,
          enrollment_date: new Date().toISOString(),
          status: 'Ativo',
          notes,
          created_by: user?.id || 1
        });

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in ClassService.enrollStudent:', error);
      throw error;
    }
  }

  /**
   * Remover aluno de uma turma (soft delete)
   */
  async unenrollStudent(classEnrollmentId: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('class_enrollments')
        .update({
          status: 'Cancelado',
          deleted_at: new Date().toISOString(),
          updated_by: user?.id || 1
        })
        .eq('id', classEnrollmentId);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in ClassService.unenrollStudent:', error);
      throw error;
    }
  }

  /**
   * Alocar professor a uma disciplina da turma
   */
  async assignTeacher(
    classId: number,
    teacherId: number,
    subjectId: number,
    workloadHours?: number
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('class_teacher_subjects')
        .insert({
          class_id: classId,
          teacher_id: teacherId,
          subject_id: subjectId,
          workload_hours: workloadHours,
          created_by: user?.id || 1
        });

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in ClassService.assignTeacher:', error);
      throw error;
    }
  }

  /**
   * Remover alocação de professor
   */
  async unassignTeacher(
    classId: number,
    teacherId: number,
    subjectId: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('class_teacher_subjects')
        .delete()
        .eq('class_id', classId)
        .eq('teacher_id', teacherId)
        .eq('subject_id', subjectId);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in ClassService.unassignTeacher:', error);
      throw error;
    }
  }

  /**
   * Buscar turmas de um professor
   */
  async getTeacherClasses(teacherId: number, options?: {
    academicYearId?: number;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('class_teacher_subjects')
        .select(`
          *,
          class:classes(
            *,
            school:schools(*),
            course:courses(*),
            academic_year:academic_years(*)
          ),
          subject:subjects(*)
        `)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null);

      if (options?.academicYearId) {
        query = query.eq('class.academic_year_id', options.academicYearId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in ClassService.getTeacherClasses:', error);
      throw error;
    }
  }

  /**
   * Buscar turmas disponíveis para matrícula (com vagas)
   */
  async getAvailableClasses(options: {
    schoolId?: number;
    academicYearId?: number;
    courseId?: number;
    shift?: string;
  }): Promise<ClassWithDetails[]> {
    try {
      let query = supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_year:academic_years(*)
        `)
        .is('deleted_at', null);

      if (options.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      if (options.academicYearId) {
        query = query.eq('academic_year_id', options.academicYearId);
      }

      if (options.courseId) {
        query = query.eq('course_id', options.courseId);
      }

      if (options.shift) {
        query = query.eq('shift', options.shift);
      }

      const { data, error } = await query.order('name');

      if (error) throw handleSupabaseError(error);

      // Filtrar turmas com vagas
      const classesWithStats = await Promise.all(
        (data || []).map(async (classData: any) => {
          const stats = await this.getClassStats(classData.id);
          return {
            ...classData,
            stats,
            hasAvailability: stats.availableSpots > 0
          };
        })
      );

      return classesWithStats.filter(c => c.hasAvailability);
    } catch (error) {
      console.error('Error in ClassService.getAvailableClasses:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas gerais de turmas
   */
  async getGeneralStats(options?: {
    schoolId?: number;
    academicYearId?: number;
  }): Promise<{
    totalClasses: number;
    totalStudents: number;
    averageOccupancy: number;
    byShift: Record<string, number>;
    byCourse: Record<string, number>;
  }> {
    try {
      let query = supabase
        .from('classes')
        .select(`
          *,
          course:courses(name)
        `)
        .is('deleted_at', null);

      if (options?.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      if (options?.academicYearId) {
        query = query.eq('academic_year_id', options.academicYearId);
      }

      const { data: classes, error } = await query;

      if (error) throw handleSupabaseError(error);

      let totalCapacity = 0;
      let totalEnrolled = 0;
      const byShift: Record<string, number> = {};
      const byCourse: Record<string, number> = {};

      for (const classData of classes || []) {
        // Contar por turno
        byShift[classData.shift] = (byShift[classData.shift] || 0) + 1;

        // Contar por curso
        if (classData.course?.name) {
          byCourse[classData.course.name] = (byCourse[classData.course.name] || 0) + 1;
        }

        // Somar capacidade e matriculados
        totalCapacity += classData.capacity;

        const { count } = await supabase
          .from('class_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', classData.id)
          .eq('status', 'Ativo')
          .is('deleted_at', null);

        totalEnrolled += count || 0;
      }

      const averageOccupancy = totalCapacity > 0
        ? Math.round((totalEnrolled / totalCapacity) * 100)
        : 0;

      return {
        totalClasses: classes?.length || 0,
        totalStudents: totalEnrolled,
        averageOccupancy,
        byShift,
        byCourse
      };
    } catch (error) {
      console.error('Error in ClassService.getGeneralStats:', error);
      throw error;
    }
  }
}

export const classService = new ClassService();
export default classService;

