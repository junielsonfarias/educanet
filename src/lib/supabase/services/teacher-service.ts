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
   * Buscar informações completas do professor (com pessoa e certificações)
   * Nota: A tabela teachers não tem school_id - a relação com escola é via staff ou class_teacher_subjects
   */
  async getTeacherFullInfo(id: number): Promise<TeacherFullInfo | null> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          person:people(*),
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
   * Nota: Como teachers não tem school_id, buscamos via class_teacher_subjects -> classes
   */
  async getBySchool(schoolId: number, options?: {
    employmentStatus?: string;
  }): Promise<TeacherFullInfo[]> {
    try {
      // Primeiro, buscar IDs dos professores que lecionam nesta escola
      const { data: teacherAssignments, error: assignError } = await supabase
        .from('class_teacher_subjects')
        .select(`
          teacher_id,
          class:classes!inner(school_id)
        `)
        .eq('class.school_id', schoolId)
        .is('deleted_at', null);

      if (assignError) throw handleSupabaseError(assignError);

      // Extrair IDs únicos de professores
      const teacherIds = [...new Set(
        (teacherAssignments || []).map((a: Record<string, unknown>) => a.teacher_id as number)
      )];

      if (teacherIds.length === 0) {
        return [];
      }

      // Buscar informações dos professores
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          person:people(*)
        `)
        .in('id', teacherIds)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Ordenar por nome client-side
      const sorted = (data || []).sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const personA = a.person as Record<string, unknown> | null;
        const personB = b.person as Record<string, unknown> | null;
        const nameA = `${personA?.first_name || ''} ${personA?.last_name || ''}`.trim();
        const nameB = `${personB?.first_name || ''} ${personB?.last_name || ''}`.trim();
        return nameA.localeCompare(nameB, 'pt-BR');
      });

      return sorted as TeacherFullInfo[];
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

      const { data, error } = await query.order('id');

      if (error) throw handleSupabaseError(error);

      // Ordenar por nome da turma client-side
      const sorted = (data || []).sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const nameA = (a.class as Record<string, unknown>)?.name as string || '';
        const nameB = (b.class as Record<string, unknown>)?.name as string || '';
        return nameA.localeCompare(nameB, 'pt-BR');
      });

      return sorted;
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
        .order('id');

      if (error) throw handleSupabaseError(error);

      // Ordenar por nome do aluno client-side
      const sorted = (data || []).sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const enrollmentA = a.student_enrollment as Record<string, unknown>;
        const enrollmentB = b.student_enrollment as Record<string, unknown>;
        const profileA = enrollmentA?.student_profile as Record<string, unknown>;
        const profileB = enrollmentB?.student_profile as Record<string, unknown>;
        const personA = profileA?.person as Record<string, unknown>;
        const personB = profileB?.person as Record<string, unknown>;
        const nameA = personA?.full_name as string || '';
        const nameB = personB?.full_name as string || '';
        return nameA.localeCompare(nameB, 'pt-BR');
      });

      return sorted;
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

      const { data, error } = await query.order('id');

      if (error) throw handleSupabaseError(error);

      // Ordenar por nome client-side
      const sorted = (data || []).sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const nameA = (a.person as Record<string, unknown>)?.full_name as string || '';
        const nameB = (b.person as Record<string, unknown>)?.full_name as string || '';
        return nameA.localeCompare(nameB, 'pt-BR');
      });

      return sorted as TeacherFullInfo[];
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
   * Nota: Como teachers não tem school_id, estatísticas por escola seriam calculadas via class_teacher_subjects
   */
  async getStats(schoolId?: number): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySchool: Record<string, number>;
  }> {
    try {
      // Buscar todos os professores
      const { data, error } = await supabase
        .from('teachers')
        .select('id')
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Se precisar filtrar por escola, buscar via class_teacher_subjects
      let filteredTeacherIds: number[] | null = null;
      if (schoolId) {
        const { data: assignments } = await supabase
          .from('class_teacher_subjects')
          .select(`
            teacher_id,
            class:classes!inner(school_id)
          `)
          .eq('class.school_id', schoolId)
          .is('deleted_at', null);

        filteredTeacherIds = [...new Set(
          (assignments || []).map((a: Record<string, unknown>) => a.teacher_id as number)
        )];
      }

      const total = filteredTeacherIds
        ? filteredTeacherIds.length
        : (data?.length || 0);

      // Por simplicidade, retornamos estatísticas básicas
      // (teachers não tem employment_status, essa coluna não existe na tabela)
      return {
        total,
        byStatus: {},
        bySchool: {}
      };
    } catch (error) {
      console.error('Error in TeacherService.getStats:', error);
      throw error;
    }
  }
}

export const teacherService = new TeacherService();
export default teacherService;

