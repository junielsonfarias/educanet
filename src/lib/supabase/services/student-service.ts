/**
 * StudentService - Serviço para gerenciamento de alunos
 * 
 * Gerencia perfis de estudantes, matrículas, responsáveis e dados relacionados.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import type { Student, StudentFullInfo, Person, Guardian, StudentEnrollment } from '@/lib/database-types';

class StudentService extends BaseService<Student> {
  constructor() {
    super('student_profiles');
  }

  /**
   * Buscar informações completas do aluno (com pessoa, responsáveis, matrículas)
   */
  async getStudentFullInfo(id: number): Promise<StudentFullInfo | null> {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          *,
          person:people(*),
          enrollments:student_enrollments(
            *,
            school:schools(*),
            course:courses(*),
            academic_year:academic_years(*)
          ),
          student_guardians(
            *,
            guardian:guardians(
              *,
              person:people(*)
            )
          )
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

      return data as unknown as StudentFullInfo;
    } catch (error) {
      console.error('Error in StudentService.getStudentFullInfo:', error);
      throw error;
    }
  }

  /**
   * Buscar alunos por escola
   */
  async getBySchool(schoolId: number, options?: {
    status?: string;
    academicYearId?: number;
  }): Promise<StudentFullInfo[]> {
    try {
      let query = supabase
        .from('student_enrollments')
        .select(`
          *,
          student_profile:student_profiles(
            *,
            person:people(*)
          ),
          school:schools(*),
          course:courses(*),
          academic_year:academic_years(*)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.academicYearId) {
        query = query.eq('academic_year_id', options.academicYearId);
      }

      const { data, error } = await query.order('student_profile.person.full_name');

      if (error) throw handleSupabaseError(error);

      // Extrair student_profiles únicos (evitar duplicatas)
      const students = new Map<number, StudentFullInfo>();
      (data || []).forEach((enrollment: any) => {
        if (enrollment.student_profile && !students.has(enrollment.student_profile.id)) {
          students.set(enrollment.student_profile.id, {
            ...enrollment.student_profile,
            enrollments: [enrollment]
          });
        } else if (enrollment.student_profile) {
          const student = students.get(enrollment.student_profile.id)!;
          student.enrollments = [...(student.enrollments || []), enrollment];
        }
      });

      return Array.from(students.values());
    } catch (error) {
      console.error('Error in StudentService.getBySchool:', error);
      throw error;
    }
  }

  /**
   * Buscar alunos por turma
   */
  async getByClass(classId: number): Promise<StudentFullInfo[]> {
    try {
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
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .order('student_enrollment.student_profile.person.full_name');

      if (error) throw handleSupabaseError(error);

      return (data || []).map((item: any) => item.student_enrollment?.student_profile).filter(Boolean);
    } catch (error) {
      console.error('Error in StudentService.getByClass:', error);
      throw error;
    }
  }

  /**
   * Buscar responsáveis de um aluno
   */
  async getGuardians(studentProfileId: number): Promise<Guardian[]> {
    try {
      const { data, error } = await supabase
        .from('student_guardians')
        .select(`
          *,
          guardian:guardians(
            *,
            person:people(*)
          )
        `)
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null)
        .order('is_primary_contact', { ascending: false });

      if (error) throw handleSupabaseError(error);

      return (data || []).map((item: any) => item.guardian).filter(Boolean);
    } catch (error) {
      console.error('Error in StudentService.getGuardians:', error);
      throw error;
    }
  }

  /**
   * Buscar matrículas de um aluno
   */
  async getEnrollments(studentProfileId: number, options?: {
    academicYearId?: number;
    status?: string;
  }): Promise<StudentEnrollment[]> {
    try {
      let query = supabase
        .from('student_enrollments')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_year:academic_years(*)
        `)
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null);

      if (options?.academicYearId) {
        query = query.eq('academic_year_id', options.academicYearId);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query.order('enrollment_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data as StudentEnrollment[] || [];
    } catch (error) {
      console.error('Error in StudentService.getEnrollments:', error);
      throw error;
    }
  }

  /**
   * Buscar aluno por CPF
   */
  async getByCpf(cpf: string): Promise<StudentFullInfo | null> {
    try {
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          student_profile:student_profiles(*)
        `)
        .eq('cpf', cpf)
        .eq('person_type', 'Aluno')
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw handleSupabaseError(error);
      }

      if (!data.student_profile) {
        return null;
      }

      // Buscar informações completas
      return this.getStudentFullInfo(data.student_profile.id);
    } catch (error) {
      console.error('Error in StudentService.getByCpf:', error);
      throw error;
    }
  }

  /**
   * Buscar aluno por número de matrícula
   */
  async getByRegistrationNumber(registrationNumber: string): Promise<StudentFullInfo | null> {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
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

      return this.getStudentFullInfo(data.id);
    } catch (error) {
      console.error('Error in StudentService.getByRegistrationNumber:', error);
      throw error;
    }
  }

  /**
   * Buscar alunos com nome similar (busca parcial)
   */
  async searchByName(name: string, options?: {
    schoolId?: number;
    limit?: number;
  }): Promise<StudentFullInfo[]> {
    try {
      let query = supabase
        .from('student_profiles')
        .select(`
          *,
          person:people(*)
        `)
        .ilike('person.full_name', `%${name}%`)
        .is('deleted_at', null);

      if (options?.schoolId) {
        // Filtrar por escola via enrollments
        query = query.in('id', 
          supabase
            .from('student_enrollments')
            .select('student_profile_id')
            .eq('school_id', options.schoolId)
            .eq('status', 'Matriculado')
        );
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query.order('person.full_name');

      if (error) throw handleSupabaseError(error);
      return (data || []) as StudentFullInfo[];
    } catch (error) {
      console.error('Error in StudentService.searchByName:', error);
      throw error;
    }
  }

  /**
   * Criar aluno completo (pessoa + perfil de aluno)
   */
  async createStudent(
    personData: Partial<Person>,
    studentData: Partial<Student>
  ): Promise<StudentFullInfo> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const createdBy = user?.id || 1;

      // 1. Criar pessoa
      const { data: person, error: personError } = await supabase
        .from('people')
        .insert({
          ...personData,
          person_type: 'Aluno',
          created_by: createdBy,
        })
        .select()
        .single();

      if (personError) throw handleSupabaseError(personError);

      // 2. Criar perfil de aluno
      const { data: studentProfile, error: studentError } = await supabase
        .from('student_profiles')
        .insert({
          ...studentData,
          person_id: person.id,
          created_by: createdBy,
        })
        .select()
        .single();

      if (studentError) throw handleSupabaseError(studentError);

      // Retornar informações completas
      return this.getStudentFullInfo(studentProfile.id) as Promise<StudentFullInfo>;
    } catch (error) {
      console.error('Error in StudentService.createStudent:', error);
      throw error;
    }
  }

  /**
   * Atualizar aluno (pessoa + perfil)
   */
  async updateStudent(
    studentProfileId: number,
    personData: Partial<Person>,
    studentData: Partial<Student>
  ): Promise<StudentFullInfo> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updatedBy = user?.id || 1;

      // Buscar person_id
      const student = await this.getById(studentProfileId);
      if (!student) {
        throw new Error('Aluno não encontrado');
      }

      // 1. Atualizar pessoa
      if (Object.keys(personData).length > 0) {
        const { error: personError } = await supabase
          .from('people')
          .update({
            ...personData,
            updated_by: updatedBy,
          })
          .eq('id', student.person_id);

        if (personError) throw handleSupabaseError(personError);
      }

      // 2. Atualizar perfil de aluno
      if (Object.keys(studentData).length > 0) {
        const { error: studentError } = await supabase
          .from('student_profiles')
          .update({
            ...studentData,
            updated_by: updatedBy,
          })
          .eq('id', studentProfileId);

        if (studentError) throw handleSupabaseError(studentError);
      }

      // Retornar informações atualizadas
      return this.getStudentFullInfo(studentProfileId) as Promise<StudentFullInfo>;
    } catch (error) {
      console.error('Error in StudentService.updateStudent:', error);
      throw error;
    }
  }

  /**
   * Associar responsável a um aluno
   */
  async addGuardian(
    studentProfileId: number,
    guardianId: number,
    relationship: {
      relationship_type: string;
      is_primary_contact?: boolean;
      is_emergency_contact?: boolean;
      is_authorized_pickup?: boolean;
      notes?: string;
    }
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('student_guardians')
        .insert({
          student_profile_id: studentProfileId,
          guardian_id: guardianId,
          ...relationship,
          created_by: user?.id || 1,
        });

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in StudentService.addGuardian:', error);
      throw error;
    }
  }

  /**
   * Remover responsável de um aluno
   */
  async removeGuardian(studentProfileId: number, guardianId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('student_guardians')
        .delete()
        .eq('student_profile_id', studentProfileId)
        .eq('guardian_id', guardianId);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in StudentService.removeGuardian:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de alunos
   */
  async getStats(schoolId?: number): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byEducationLevel: Record<string, number>;
  }> {
    try {
      let baseQuery = supabase
        .from('student_enrollments')
        .select('status, course:courses(education_level)')
        .is('deleted_at', null);

      if (schoolId) {
        baseQuery = baseQuery.eq('school_id', schoolId);
      }

      const { data, error } = await baseQuery;

      if (error) throw handleSupabaseError(error);

      const byStatus: Record<string, number> = {};
      const byEducationLevel: Record<string, number> = {};

      (data || []).forEach((item: any) => {
        // Contar por status
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;

        // Contar por nível de ensino
        if (item.course?.education_level) {
          byEducationLevel[item.course.education_level] = 
            (byEducationLevel[item.course.education_level] || 0) + 1;
        }
      });

      return {
        total: data?.length || 0,
        byStatus,
        byEducationLevel
      };
    } catch (error) {
      console.error('Error in StudentService.getStats:', error);
      throw error;
    }
  }
}

export const studentService = new StudentService();
export default studentService;

