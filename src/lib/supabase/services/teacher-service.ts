/**
 * TeacherService - Serviço para gerenciamento de professores
 * 
 * Gerencia professores, suas alocações, turmas, disciplinas e certificações.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import type { Teacher, TeacherFullInfo, Person } from '@/lib/database-types';

class TeacherService extends BaseService<Teacher> {
  constructor() {
    super('teachers');
  }

  /**
   * Buscar informações completas do professor (com pessoa, escola, certificações)
   */
  async getTeacherFullInfo(id: number): Promise<TeacherFullInfo | null> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          person:people(*),
          school:schools(*),
          certifications:teacher_certifications(*)
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

      return data as unknown as TeacherFullInfo;
    } catch (error) {
      console.error('Error in TeacherService.getTeacherFullInfo:', error);
      throw error;
    }
  }

  /**
   * Buscar professores por escola
   */
  async getBySchool(schoolId: number, options?: {
    employmentStatus?: string;
  }): Promise<TeacherFullInfo[]> {
    try {
      let query = supabase
        .from('teachers')
        .select(`
          *,
          person:people(*),
          school:schools(*)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      if (options?.employmentStatus) {
        query = query.eq('employment_status', options.employmentStatus);
      }

      const { data, error } = await query.order('person.full_name');

      if (error) throw handleSupabaseError(error);
      return (data || []) as TeacherFullInfo[];
    } catch (error) {
      console.error('Error in TeacherService.getBySchool:', error);
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
            course:courses(*),
            school:schools(*),
            academic_year:academic_years(*)
          ),
          subject:subjects(*)
        `)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null);

      if (options?.academicYearId) {
        query = query.eq('class.academic_year_id', options.academicYearId);
      }

      const { data, error } = await query.order('class.name');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in TeacherService.getTeacherClasses:', error);
      throw error;
    }
  }

  /**
   * Buscar disciplinas que um professor leciona
   */
  async getTeacherSubjects(teacherId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('class_teacher_subjects')
        .select(`
          subject:subjects(*)
        `)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Extrair disciplinas únicas
      const subjectsMap = new Map();
      (data || []).forEach((item: Record<string, unknown>) => {
        if (item.subject && !subjectsMap.has(item.subject.id)) {
          subjectsMap.set(item.subject.id, item.subject);
        }
      });

      return Array.from(subjectsMap.values());
    } catch (error) {
      console.error('Error in TeacherService.getTeacherSubjects:', error);
      throw error;
    }
  }

  /**
   * Buscar alunos de um professor (de todas as suas turmas)
   */
  async getTeacherStudents(teacherId: number, options?: {
    classId?: number;
    academicYearId?: number;
  }): Promise<any[]> {
    try {
      // Buscar IDs das turmas do professor
      const classesData = await this.getTeacherClasses(teacherId, {
        academicYearId: options?.academicYearId
      });

      let classIds = classesData.map((item: Record<string, unknown>) => item.class?.id).filter(Boolean);

      if (options?.classId) {
        classIds = classIds.filter(id => id === options.classId);
      }

      if (classIds.length === 0) {
        return [];
      }

      // Buscar alunos dessas turmas
      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          *,
          student_enrollment:student_enrollments(
            *,
            student_profile:student_profiles(
              *,
              person:people(*)
            )
          ),
          class:classes(*)
        `)
        .in('class_id', classIds)
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .order('student_enrollment.student_profile.person.full_name');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in TeacherService.getTeacherStudents:', error);
      throw error;
    }
  }

  /**
   * Buscar certificações de um professor
   */
  async getCertifications(teacherId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_certifications')
        .select('*')
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .order('issue_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in TeacherService.getCertifications:', error);
      throw error;
    }
  }

  /**
   * Buscar programas de desenvolvimento profissional de um professor
   */
  async getProfessionalDevelopment(teacherId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_pd_enrollments')
        .select(`
          *,
          program:professional_development_programs(*)
        `)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .order('enrollment_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in TeacherService.getProfessionalDevelopment:', error);
      throw error;
    }
  }

  /**
   * Buscar professor por CPF
   */
  async getByCpf(cpf: string): Promise<TeacherFullInfo | null> {
    try {
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          teacher:teachers(*)
        `)
        .eq('cpf', cpf)
        .eq('person_type', 'Professor')
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw handleSupabaseError(error);
      }

      if (!data.teacher) {
        return null;
      }

      return this.getTeacherFullInfo(data.teacher.id);
    } catch (error) {
      console.error('Error in TeacherService.getByCpf:', error);
      throw error;
    }
  }

  /**
   * Buscar professor por número de matrícula
   */
  async getByRegistrationNumber(registrationNumber: string): Promise<TeacherFullInfo | null> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('registration_number', registrationNumber)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw handleSupabaseError(error);
      }

      return this.getTeacherFullInfo(data.id);
    } catch (error) {
      console.error('Error in TeacherService.getByRegistrationNumber:', error);
      throw error;
    }
  }

  /**
   * Buscar professores com nome similar
   */
  async searchByName(name: string, options?: {
    schoolId?: number;
    limit?: number;
  }): Promise<TeacherFullInfo[]> {
    try {
      let query = supabase
        .from('teachers')
        .select(`
          *,
          person:people(*)
        `)
        .ilike('person.full_name', `%${name}%`)
        .is('deleted_at', null);

      if (options?.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query.order('person.full_name');

      if (error) throw handleSupabaseError(error);
      return (data || []) as TeacherFullInfo[];
    } catch (error) {
      console.error('Error in TeacherService.searchByName:', error);
      throw error;
    }
  }

  /**
   * Criar professor completo (pessoa + perfil de professor)
   */
  async createTeacher(
    personData: Partial<Person>,
    teacherData: Partial<Teacher>
  ): Promise<TeacherFullInfo> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const createdBy = user?.id || 1;

      // 1. Criar pessoa
      const { data: person, error: personError } = await supabase
        .from('people')
        .insert({
          ...personData,
          person_type: 'Professor',
          created_by: createdBy,
        })
        .select()
        .single();

      if (personError) throw handleSupabaseError(personError);

      // 2. Criar perfil de professor
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .insert({
          ...teacherData,
          person_id: person.id,
          created_by: createdBy,
        })
        .select()
        .single();

      if (teacherError) throw handleSupabaseError(teacherError);

      // Retornar informações completas
      return this.getTeacherFullInfo(teacher.id) as Promise<TeacherFullInfo>;
    } catch (error) {
      console.error('Error in TeacherService.createTeacher:', error);
      throw error;
    }
  }

  /**
   * Atualizar professor (pessoa + perfil)
   */
  async updateTeacher(
    teacherId: number,
    personData: Partial<Person>,
    teacherData: Partial<Teacher>
  ): Promise<TeacherFullInfo> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updatedBy = user?.id || 1;

      // Buscar person_id
      const teacher = await this.getById(teacherId);
      if (!teacher) {
        throw new Error('Professor não encontrado');
      }

      // 1. Atualizar pessoa
      if (Object.keys(personData).length > 0) {
        const { error: personError } = await supabase
          .from('people')
          .update({
            ...personData,
            updated_by: updatedBy,
          })
          .eq('id', teacher.person_id);

        if (personError) throw handleSupabaseError(personError);
      }

      // 2. Atualizar perfil de professor
      if (Object.keys(teacherData).length > 0) {
        const { error: teacherError } = await supabase
          .from('teachers')
          .update({
            ...teacherData,
            updated_by: updatedBy,
          })
          .eq('id', teacherId);

        if (teacherError) throw handleSupabaseError(teacherError);
      }

      // Retornar informações atualizadas
      return this.getTeacherFullInfo(teacherId) as Promise<TeacherFullInfo>;
    } catch (error) {
      console.error('Error in TeacherService.updateTeacher:', error);
      throw error;
    }
  }

  /**
   * Alocar professor a uma turma/disciplina
   */
  async assignToClass(
    teacherId: number,
    classId: number,
    subjectId: number,
    workloadHours?: number
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('class_teacher_subjects')
        .insert({
          teacher_id: teacherId,
          class_id: classId,
          subject_id: subjectId,
          workload_hours: workloadHours,
          created_by: user?.id || 1,
        });

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in TeacherService.assignToClass:', error);
      throw error;
    }
  }

  /**
   * Remover alocação de professor de uma turma/disciplina
   */
  async removeFromClass(
    teacherId: number,
    classId: number,
    subjectId: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('class_teacher_subjects')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('class_id', classId)
        .eq('subject_id', subjectId);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in TeacherService.removeFromClass:', error);
      throw error;
    }
  }

  /**
   * Adicionar certificação a um professor
   */
  async addCertification(
    teacherId: number,
    certificationData: {
      certification_name: string;
      issuing_organization: string;
      issue_date: string;
      expiration_date?: string;
      credential_id?: string;
      credential_url?: string;
      notes?: string;
    }
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('teacher_certifications')
        .insert({
          teacher_id: teacherId,
          ...certificationData,
          created_by: user?.id || 1,
        });

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in TeacherService.addCertification:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de professores
   */
  async getStats(schoolId?: number): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySchool: Record<string, number>;
  }> {
    try {
      let query = supabase
        .from('teachers')
        .select('employment_status, school:schools(trade_name)')
        .is('deleted_at', null);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      const byStatus: Record<string, number> = {};
      const bySchool: Record<string, number> = {};

      (data || []).forEach((item: Record<string, unknown>) => {
        // Contar por status
        byStatus[item.employment_status] = (byStatus[item.employment_status] || 0) + 1;

        // Contar por escola
        if (item.school?.trade_name) {
          bySchool[item.school.trade_name] = (bySchool[item.school.trade_name] || 0) + 1;
        }
      });

      return {
        total: data?.length || 0,
        byStatus,
        bySchool
      };
    } catch (error) {
      console.error('Error in TeacherService.getStats:', error);
      throw error;
    }
  }
}

export const teacherService = new TeacherService();
export default teacherService;

