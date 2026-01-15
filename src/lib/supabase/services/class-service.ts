/**
 * ClassService - Serviço para gerenciamento de turmas
 * 
 * Gerencia turmas, suas disciplinas, professores, alunos e horários.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import type { Class, ClassWithDetails, School, Course, AcademicYear, Student, Teacher, Subject } from '@/lib/database-types';

export interface ClassStats {
  totalStudents: number;
  studentsPCD: number;
  capacity: number;
  availableSpots: number;
  occupancyRate: number;
  totalTeachers: number;
  totalSubjects: number;
}

export interface ClassAcademicPeriodInfo {
  id: number;
  name: string;
  type: string;
  start_date?: string;
  end_date?: string;
  academic_year_id?: number;
  academic_year?: AcademicYear;
}

export interface ClassWithFullInfo extends Class {
  // Campos adicionais que existem na tabela mas não estão no tipo base
  code?: string;
  shift?: string;
  capacity?: number;
  is_multi_grade?: boolean;
  education_modality?: string;
  tipo_regime?: string;
  operating_hours?: string;
  min_students?: number;
  max_dependency_subjects?: number;
  operating_days?: string[];
  regent_teacher_id?: number;
  education_grade_id?: number;
  // Relacionamentos
  school?: School;
  course?: Course;
  academic_year?: AcademicYear;
  academic_period?: ClassAcademicPeriodInfo;
  education_grade?: {
    id: number;
    grade_name: string;
    grade_order: number;
    education_level?: string;
  };
  stats?: ClassStats;
  students?: Student[];
  teachers?: Teacher[];
  subjects?: Subject[];
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
          academic_period:academic_periods(*, academic_year:academic_years(*)),
          education_grade:education_grades(*)
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

      // Extrair academic_year do academic_period para compatibilidade
      const academic_year = data?.academic_period?.academic_year || null;

      return {
        ...data,
        academic_year,
        stats
      } as ClassWithFullInfo;
    } catch (error) {
      console.error('Error in ClassService.getClassFullInfo:', error);
      throw error;
    }
  }

  /**
   * Buscar todas as turmas com informações completas (otimizado)
   * Evita N+1 queries fazendo todos os joins de uma vez
   */
  async getAllWithFullInfo(): Promise<ClassWithFullInfo[]> {
    try {
      // Query básica das turmas
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          education_grade:education_grades(*)
        `)
        .is('deleted_at', null)
        .order('name');

      if (error) throw handleSupabaseError(error);

      // Buscar contagem de alunos por turma em uma única query
      const classIds = (data || []).map((cls: any) => cls.id);
      const studentCounts = new Map<number, number>();

      if (classIds.length > 0) {
        const { data: enrollments } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .in('class_id', classIds)
          .eq('status', 'Ativo')
          .is('deleted_at', null);

        // Contar alunos por turma
        for (const enrollment of enrollments || []) {
          const count = studentCounts.get(enrollment.class_id) || 0;
          studentCounts.set(enrollment.class_id, count + 1);
        }
      }

      // Buscar períodos acadêmicos com anos letivos SEMPRE (evita problemas de join)
      const periodIds = [...new Set((data || []).map((cls: any) => cls.academic_period_id).filter(Boolean))];
      const academicPeriodMap = new Map<number, { id: number; name: string; type: string; academic_year_id: number; academic_year: { id: number; name: string } | null }>();

      if (periodIds.length > 0) {
        // Buscar TODOS os anos letivos (tabela tem 'year' como número, não 'name')
        const { data: allYears, error: yearsError } = await supabase
          .from('academic_years')
          .select('id, year');

        const yearMap = new Map<number, { id: number; name: string }>();
        if (!yearsError && allYears) {
          for (const yr of allYears) {
            // Converter o ano (number) para nome (string)
            yearMap.set(yr.id, { id: yr.id, name: String(yr.year) });
          }
        }

        // Buscar períodos
        const { data: periods, error: periodsError } = await supabase
          .from('academic_periods')
          .select('id, name, type, academic_year_id')
          .in('id', periodIds);

        if (!periodsError && periods) {
          // Montar o mapa de períodos com anos
          for (const period of periods) {
            const year = period.academic_year_id ? yearMap.get(period.academic_year_id) : null;
            academicPeriodMap.set(period.id, {
              id: period.id,
              name: period.name,
              type: period.type,
              academic_year_id: period.academic_year_id,
              academic_year: year || null
            });

          }
        }
      }

      // Mapear resultados com academic_year e stats
      const classes = (data || []).map((cls: any) => {
        const totalStudents = studentCounts.get(cls.id) || 0;
        const capacity = cls.capacity || cls.max_students || 35;

        // Buscar período e ano letivo do mapa
        const periodData = cls.academic_period_id ? academicPeriodMap.get(cls.academic_period_id) : null;
        const academic_year = periodData?.academic_year || null;
        const academic_period = periodData ? {
          id: periodData.id,
          name: periodData.name,
          type: periodData.type,
          academic_year_id: periodData.academic_year_id,
          academic_year: periodData.academic_year
        } : null;

        return {
          ...cls,
          academic_year,
          academic_period,
          stats: {
            totalStudents,
            capacity,
            availableSpots: capacity - totalStudents,
            occupancyRate: capacity > 0 ? Math.round((totalStudents / capacity) * 100) : 0,
            studentsPCD: 0,
            totalTeachers: 0,
            totalSubjects: 0,
          }
        };
      });

      return classes as ClassWithFullInfo[];
    } catch (error) {
      console.error('Error in ClassService.getAllWithFullInfo:', error);
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
      // Se precisar filtrar por ano letivo, primeiro buscar os períodos do ano
      let periodIds: number[] = [];
      if (options?.academicYearId) {
        const { data: periods } = await supabase
          .from('academic_periods')
          .select('id')
          .eq('academic_year_id', options.academicYearId);
        periodIds = (periods || []).map(p => p.id);
      }

      let query = supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_period:academic_periods(*, academic_year:academic_years(*)),
          education_grade:education_grades(*)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      // Filtrar por períodos do ano letivo
      if (options?.academicYearId && periodIds.length > 0) {
        query = query.in('academic_period_id', periodIds);
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
      // Buscar períodos do ano letivo
      const { data: periods } = await supabase
        .from('academic_periods')
        .select('id')
        .eq('academic_year_id', academicYearId);
      const periodIds = (periods || []).map(p => p.id);

      if (periodIds.length === 0) {
        return [];
      }

      let query = supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_period:academic_periods(*, academic_year:academic_years(*)),
          education_grade:education_grades(*)
        `)
        .in('academic_period_id', periodIds)
        .is('deleted_at', null);

      if (options?.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      if (options?.shift) {
        query = query.eq('shift', options.shift);
      }

      const { data, error } = await query.order('name');

      if (error) throw handleSupabaseError(error);
      return (data || []) as ClassWithDetails[];
    } catch (error) {
      console.error('Error in ClassService.getByAcademicYear:', error);
      throw error;
    }
  }

  /**
   * Buscar alunos de uma turma com informacoes completas
   */
  async getClassStudents(classId: number, options?: {
    status?: string;
    includeTransferred?: boolean;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('class_enrollments')
        .select(`
          id,
          enrollment_date,
          status,
          student_enrollment:student_enrollments(
            id,
            enrollment_date,
            enrollment_status,
            student_profile:student_profiles(
              id,
              student_registration_number,
              person:people(
                id,
                first_name,
                last_name,
                date_of_birth
              )
            )
          )
        `)
        .eq('class_id', classId)
        .is('deleted_at', null);

      // Por padrao inclui todos os status existentes no banco
      if (options?.status) {
        query = query.eq('status', options.status);
      } else {
        // Filtrar apenas status Ativo e Transferido (que existem no ENUM atual)
        query = query.eq('status', 'Ativo');
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      // Mapear os dados com informacoes completas
      const students = (data || [])
        .map((item: Record<string, unknown>) => {
          const enrollment = item.student_enrollment as Record<string, unknown> | undefined;
          const studentProfile = enrollment?.student_profile as Record<string, unknown> | undefined;

          if (!studentProfile) return null;

          // Construir pessoa com full_name
          const person = studentProfile.person as Record<string, unknown> | undefined;
          const personWithFullName = person ? {
            ...person,
            full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
            birth_date: person.date_of_birth
          } : undefined;

          return {
            ...studentProfile,
            person: personWithFullName,
            class_enrollment_id: item.id,
            class_enrollment_status: item.status,
            class_enrollment_date: item.enrollment_date,
            student_enrollment_id: enrollment?.id,
            student_enrollment_status: enrollment?.enrollment_status
          };
        })
        .filter(Boolean);

      // Ordenar alfabeticamente por nome
      const sortedStudents = students.sort((a: any, b: any) => {
        const nameA = a?.person?.full_name || '';
        const nameB = b?.person?.full_name || '';
        return nameA.localeCompare(nameB);
      });

      // Atribuir numeros de ordem
      return sortedStudents.map((student, index) => ({
        ...student,
        order_number: index + 1
      }));
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
          id,
          subject:subjects(*),
          teacher:teachers(
            id,
            person:people(first_name, last_name)
          )
        `)
        .eq('class_id', classId)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Agrupar por disciplina (pode ter múltiplos professores)
      const subjectsMap = new Map();
      (data || []).forEach((item: Record<string, unknown>) => {
        const subject = item.subject as Record<string, unknown> | undefined;
        if (subject) {
          const subjectId = subject.id;
          if (!subjectsMap.has(subjectId)) {
            subjectsMap.set(subjectId, {
              ...subject,
              teachers: []
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

      // Contar alunos ativos
      const { count: totalStudents } = await supabase
        .from('class_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      // PCD desabilitado temporariamente (campo is_pcd pode nao existir)
      const studentsPCD = 0;

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
        studentsPCD,
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
   * Buscar alunos disponíveis para matrícula em uma turma
   * Retorna alunos com matrícula ativa na escola/ano letivo que ainda não estão na turma
   */
  async getAvailableStudentsForClass(classId: number): Promise<any[]> {
    try {
      // Primeiro, buscar informações da turma para saber escola e ano letivo
      const classInfo = await this.getClassFullInfo(classId);
      if (!classInfo) {
        throw new Error('Turma não encontrada');
      }

      const schoolId = classInfo.school?.id;
      const academicYearId = classInfo.academic_year?.id;

      if (!schoolId || !academicYearId) {
        throw new Error('Escola ou ano letivo não definido para esta turma');
      }

      // Buscar IDs dos alunos já matriculados na turma
      const { data: enrolledStudents } = await supabase
        .from('class_enrollments')
        .select('student_enrollment_id')
        .eq('class_id', classId)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      const enrolledIds = (enrolledStudents || []).map(e => e.student_enrollment_id);

      // Buscar alunos com matrícula ativa na mesma escola e ano letivo
      let query = supabase
        .from('student_enrollments')
        .select(`
          id,
          enrollment_number,
          enrollment_date,
          enrollment_status,
          student_profile:student_profiles(
            id,
            student_registration_number,
            person:people(
              id,
              first_name,
              last_name,
              date_of_birth
            )
          )
        `)
        .eq('school_id', schoolId)
        .eq('academic_year_id', academicYearId)
        .eq('enrollment_status', 'Ativo')
        .is('deleted_at', null);

      // Excluir alunos já matriculados
      if (enrolledIds.length > 0) {
        query = query.not('id', 'in', `(${enrolledIds.join(',')})`);
      }

      const { data, error } = await query.order('enrollment_number');

      if (error) throw handleSupabaseError(error);

      // Mapear para formato mais amigável
      return (data || []).map((item: Record<string, unknown>) => {
        const profile = item.student_profile as Record<string, unknown> | undefined;
        const person = profile?.person as Record<string, unknown> | undefined;
        return {
          student_enrollment_id: item.id,
          enrollment_number: item.enrollment_number,
          enrollment_date: item.enrollment_date,
          student_profile_id: profile?.id,
          student_registration_number: profile?.student_registration_number,
          person: person ? {
            ...person,
            full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim()
          } : undefined
        };
      });
    } catch (error) {
      console.error('Error in ClassService.getAvailableStudentsForClass:', error);
      throw error;
    }
  }

  /**
   * Matricular aluno em uma turma
   */
  async enrollStudent(
    studentEnrollmentId: number,
    classId: number
  ): Promise<void> {
    try {
      // Verificar disponibilidade
      const availability = await this.checkAvailability(classId);
      if (!availability.hasAvailability) {
        throw new Error('Turma sem vagas disponíveis');
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Obter person_id do usuário
      let createdBy = 1;
      if (user?.id) {
        const { data: authUser } = await supabase
          .from('auth_users')
          .select('person_id')
          .eq('id', user.id)
          .single();
        createdBy = authUser?.person_id || 1;
      }

      const { error } = await supabase
        .from('class_enrollments')
        .insert({
          student_enrollment_id: studentEnrollmentId,
          class_id: classId,
          enrollment_date: new Date().toISOString().split('T')[0],
          status: 'Ativo',
          created_by: createdBy
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
      // Se filtrar por ano letivo, buscar períodos primeiro
      let periodIds: number[] = [];
      if (options?.academicYearId) {
        const { data: periods } = await supabase
          .from('academic_periods')
          .select('id')
          .eq('academic_year_id', options.academicYearId);
        periodIds = (periods || []).map(p => p.id);
      }

      let query = supabase
        .from('class_teacher_subjects')
        .select(`
          *,
          class:classes(
            *,
            school:schools(*),
            course:courses(*),
            academic_period:academic_periods(*, academic_year:academic_years(*)),
            education_grade:education_grades(*)
          ),
          subject:subjects(*)
        `)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null);

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      // Filtrar por ano letivo se necessário
      let result = data || [];
      if (options?.academicYearId && periodIds.length > 0) {
        result = result.filter(item =>
          item.class && periodIds.includes(item.class.academic_period_id)
        );
      }

      return result;
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
      // Se filtrar por ano letivo, buscar períodos primeiro
      let periodIds: number[] = [];
      if (options.academicYearId) {
        const { data: periods } = await supabase
          .from('academic_periods')
          .select('id')
          .eq('academic_year_id', options.academicYearId);
        periodIds = (periods || []).map(p => p.id);
      }

      let query = supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_period:academic_periods(*, academic_year:academic_years(*)),
          education_grade:education_grades(*)
        `)
        .is('deleted_at', null);

      if (options.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      if (options.academicYearId && periodIds.length > 0) {
        query = query.in('academic_period_id', periodIds);
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
        (data || []).map(async (classData: Record<string, unknown>) => {
          const stats = await this.getClassStats(classData.id as number);
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
      // Se filtrar por ano letivo, buscar períodos primeiro
      let periodIds: number[] = [];
      if (options?.academicYearId) {
        const { data: periods } = await supabase
          .from('academic_periods')
          .select('id')
          .eq('academic_year_id', options.academicYearId);
        periodIds = (periods || []).map(p => p.id);
      }

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

      if (options?.academicYearId && periodIds.length > 0) {
        query = query.in('academic_period_id', periodIds);
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

  // ==================== MÉTODOS COM EDUCATION_GRADE_ID ====================

  /**
   * Criar turma com série específica e campos do Censo Escolar
   */
  async createClass(data: {
    name: string;
    code?: string;
    school_id: number;
    course_id: number;
    academic_period_id: number;
    education_grade_id?: number;
    homeroom_teacher_id?: number;
    capacity?: number;
    shift?: string;
    // Campos do Censo Escolar
    is_multi_grade?: boolean;
    education_modality?: string | null;
    tipo_regime?: string | null;
    operating_hours?: string | null;
    min_students?: number | null;
    max_dependency_subjects?: number | null;
    operating_days?: string[] | null;
    regent_teacher_id?: number | null;
  }): Promise<Record<string, unknown>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Obter person_id
      let createdBy = 1;
      if (user?.id) {
        const { data: authUser } = await supabase
          .from('auth_users')
          .select('person_id')
          .eq('id', user.id)
          .single();
        createdBy = authUser?.person_id || 1;
      }

      const { data: newClass, error } = await supabase
        .from('classes')
        .insert({
          name: data.name,
          code: data.code || null,
          school_id: data.school_id,
          course_id: data.course_id,
          academic_period_id: data.academic_period_id,
          education_grade_id: data.education_grade_id,
          homeroom_teacher_id: data.homeroom_teacher_id,
          capacity: data.capacity || 35,
          shift: data.shift || 'Manhã',
          // Campos do Censo Escolar
          is_multi_grade: data.is_multi_grade || false,
          education_modality: data.education_modality || null,
          tipo_regime: data.tipo_regime || null,
          operating_hours: data.operating_hours || null,
          min_students: data.min_students || null,
          max_dependency_subjects: data.max_dependency_subjects || null,
          operating_days: data.operating_days || null,
          regent_teacher_id: data.regent_teacher_id || null,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return newClass;
    } catch (error) {
      console.error('Error in ClassService.createClass:', error);
      throw error;
    }
  }

  /**
   * Atualizar série da turma
   */
  async updateClassGrade(classId: number, educationGradeId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          education_grade_id: educationGradeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', classId);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in ClassService.updateClassGrade:', error);
      throw error;
    }
  }

  /**
   * Buscar turmas por série
   */
  async getByGrade(educationGradeId: number, options?: {
    schoolId?: number;
    academicYearId?: number;
  }): Promise<ClassWithDetails[]> {
    try {
      // Se filtrar por ano letivo, buscar períodos primeiro
      let periodIds: number[] = [];
      if (options?.academicYearId) {
        const { data: periods } = await supabase
          .from('academic_periods')
          .select('id')
          .eq('academic_year_id', options.academicYearId);
        periodIds = (periods || []).map(p => p.id);
      }

      let query = supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_period:academic_periods(*, academic_year:academic_years(*)),
          education_grade:education_grades(*)
        `)
        .eq('education_grade_id', educationGradeId)
        .is('deleted_at', null);

      if (options?.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      if (options?.academicYearId && periodIds.length > 0) {
        query = query.in('academic_period_id', periodIds);
      }

      const { data, error } = await query.order('name');

      if (error) throw handleSupabaseError(error);
      return (data || []) as ClassWithDetails[];
    } catch (error) {
      console.error('Error in ClassService.getByGrade:', error);
      throw error;
    }
  }

  /**
   * Buscar turma com informações completas incluindo série e regra de avaliação
   */
  async getClassWithGradeInfo(classId: number): Promise<Record<string, unknown> | null> {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_period:academic_periods(*, academic_year:academic_years(*)),
          education_grade:education_grades(*)
        `)
        .eq('id', classId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw handleSupabaseError(error);
      }

      // Buscar regra de avaliação aplicável
      let evaluationRule = null;
      if (data?.education_grade_id || data?.course_id) {
        // Construir filtro OR apenas com valores não-null
        const orFilters: string[] = [];
        if (data.education_grade_id) {
          orFilters.push(`education_grade_id.eq.${data.education_grade_id}`);
        }
        if (data.course_id) {
          orFilters.push(`course_id.eq.${data.course_id}`);
        }

        if (orFilters.length > 0) {
          const { data: rule } = await supabase
            .from('evaluation_rules')
            .select('*')
            .or(orFilters.join(','))
            .is('deleted_at', null)
            .limit(1)
            .maybeSingle();

          evaluationRule = rule;
        }
      }

      // Buscar estatísticas
      const stats = await this.getClassStats(classId);

      // Extrair academic_year do academic_period para compatibilidade
      const academic_year = data?.academic_period?.academic_year || null;

      return {
        ...data,
        academic_year,
        evaluation_rule: evaluationRule,
        stats
      };
    } catch (error) {
      console.error('Error in ClassService.getClassWithGradeInfo:', error);
      throw error;
    }
  }
}

export const classService = new ClassService();
export default classService;

