/**
 * EnrollmentService - Serviço para gerenciamento de matrículas
 * 
 * Gerencia matrículas de alunos, transferências, histórico de status e rematrículas.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import type { StudentEnrollment, EnrollmentWithDetails } from '@/lib/database-types';

export interface EnrollmentData {
  student_profile_id: number;
  school_id: number;
  course_id: number;
  academic_year_id: number;
  enrollment_date?: string;
  status?: string;
  notes?: string;
}

export interface TransferData {
  from_school_id: number;
  to_school_id: number;
  to_course_id?: number;
  transfer_date: string;
  reason?: string;
  notes?: string;
}

class EnrollmentService extends BaseService<StudentEnrollment> {
  constructor() {
    super('student_enrollments');
  }

  /**
   * Buscar matrícula com informações completas
   */
  async getEnrollmentFullInfo(id: number): Promise<EnrollmentWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          *,
          student_profile:student_profiles(
            *,
            person:people(*)
          ),
          school:schools(*),
          course:courses(*),
          academic_year:academic_years(*),
          class_enrollments(
            *,
            class:classes(*)
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

      return data as unknown as EnrollmentWithDetails;
    } catch (error) {
      console.error('Error in EnrollmentService.getEnrollmentFullInfo:', error);
      throw error;
    }
  }

  /**
   * Buscar matrículas por aluno
   */
  async getByStudent(studentProfileId: number, options?: {
    academicYearId?: number;
    status?: string;
  }): Promise<EnrollmentWithDetails[]> {
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
      return (data || []) as EnrollmentWithDetails[];
    } catch (error) {
      console.error('Error in EnrollmentService.getByStudent:', error);
      throw error;
    }
  }

  /**
   * Buscar matrículas por escola
   */
  async getBySchool(schoolId: number, options?: {
    academicYearId?: number;
    status?: string;
    courseId?: number;
  }): Promise<EnrollmentWithDetails[]> {
    try {
      let query = supabase
        .from('student_enrollments')
        .select(`
          *,
          student_profile:student_profiles(
            *,
            person:people(*)
          ),
          course:courses(*),
          academic_year:academic_years(*)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      if (options?.academicYearId) {
        query = query.eq('academic_year_id', options.academicYearId);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.courseId) {
        query = query.eq('course_id', options.courseId);
      }

      const { data, error } = await query.order('enrollment_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return (data || []) as EnrollmentWithDetails[];
    } catch (error) {
      console.error('Error in EnrollmentService.getBySchool:', error);
      throw error;
    }
  }

  /**
   * Buscar matrículas por ano letivo
   */
  async getByAcademicYear(academicYearId: number, options?: {
    schoolId?: number;
    status?: string;
  }): Promise<EnrollmentWithDetails[]> {
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
          course:courses(*)
        `)
        .eq('academic_year_id', academicYearId)
        .is('deleted_at', null);

      if (options?.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query.order('enrollment_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return (data || []) as EnrollmentWithDetails[];
    } catch (error) {
      console.error('Error in EnrollmentService.getByAcademicYear:', error);
      throw error;
    }
  }

  /**
   * Criar matrícula de aluno
   */
  async enrollStudent(data: EnrollmentData): Promise<StudentEnrollment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const enrollmentData = {
        ...data,
        enrollment_date: data.enrollment_date || new Date().toISOString(),
        status: data.status || 'Matriculado',
        created_by: user?.id || 1
      };

      const { data: enrollment, error } = await supabase
        .from('student_enrollments')
        .insert(enrollmentData)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      // Registrar no histórico de status
      await this.addStatusHistory(enrollment.id, 'Matriculado', 'Matrícula inicial');

      return enrollment as StudentEnrollment;
    } catch (error) {
      console.error('Error in EnrollmentService.enrollStudent:', error);
      throw error;
    }
  }

  /**
   * Atualizar status da matrícula
   */
  async updateStatus(
    enrollmentId: number,
    newStatus: string,
    reason?: string,
    notes?: string
  ): Promise<StudentEnrollment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Atualizar matrícula
      const { data: enrollment, error: updateError } = await supabase
        .from('student_enrollments')
        .update({
          status: newStatus,
          notes: notes || undefined,
          updated_by: user?.id || 1
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (updateError) throw handleSupabaseError(updateError);

      // Registrar no histórico
      await this.addStatusHistory(enrollmentId, newStatus, reason);

      return enrollment as StudentEnrollment;
    } catch (error) {
      console.error('Error in EnrollmentService.updateStatus:', error);
      throw error;
    }
  }

  /**
   * Adicionar registro ao histórico de status
   */
  async addStatusHistory(
    enrollmentId: number,
    status: string,
    reason?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('student_status_history')
        .insert({
          student_enrollment_id: enrollmentId,
          status,
          change_date: new Date().toISOString(),
          reason,
          created_by: user?.id || 1
        });

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in EnrollmentService.addStatusHistory:', error);
      throw error;
    }
  }

  /**
   * Buscar histórico de status de uma matrícula
   */
  async getStatusHistory(enrollmentId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('student_status_history')
        .select('*')
        .eq('student_enrollment_id', enrollmentId)
        .is('deleted_at', null)
        .order('change_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in EnrollmentService.getStatusHistory:', error);
      throw error;
    }
  }

  /**
   * Transferir aluno para outra escola
   */
  async transferStudent(
    enrollmentId: number,
    transferData: TransferData
  ): Promise<StudentEnrollment> {
    try {
      // Buscar matrícula atual
      const currentEnrollment = await this.getById(enrollmentId);
      if (!currentEnrollment) {
        throw new Error('Matrícula não encontrada');
      }

      // Atualizar status da matrícula atual para "Transferido"
      await this.updateStatus(
        enrollmentId,
        'Transferido',
        `Transferência para escola ${transferData.to_school_id}`,
        transferData.notes
      );

      // Criar nova matrícula na escola de destino
      const newEnrollment = await this.enrollStudent({
        student_profile_id: currentEnrollment.student_profile_id,
        school_id: transferData.to_school_id,
        course_id: transferData.to_course_id || currentEnrollment.course_id,
        academic_year_id: currentEnrollment.academic_year_id,
        enrollment_date: transferData.transfer_date,
        status: 'Matriculado',
        notes: `Transferido de escola ${transferData.from_school_id}. ${transferData.reason || ''}`
      });

      return newEnrollment;
    } catch (error) {
      console.error('Error in EnrollmentService.transferStudent:', error);
      throw error;
    }
  }

  /**
   * Cancelar matrícula
   */
  async cancelEnrollment(
    enrollmentId: number,
    reason: string
  ): Promise<void> {
    try {
      await this.updateStatus(enrollmentId, 'Cancelado', reason);

      // Cancelar também as matrículas em turmas
      const { error } = await supabase
        .from('class_enrollments')
        .update({
          status: 'Cancelado',
          deleted_at: new Date().toISOString()
        })
        .eq('student_enrollment_id', enrollmentId);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error in EnrollmentService.cancelEnrollment:', error);
      throw error;
    }
  }

  /**
   * Concluir matrícula (aluno formou)
   */
  async completeEnrollment(
    enrollmentId: number,
    notes?: string
  ): Promise<void> {
    try {
      await this.updateStatus(enrollmentId, 'Concluido', 'Conclusão do curso', notes);
    } catch (error) {
      console.error('Error in EnrollmentService.completeEnrollment:', error);
      throw error;
    }
  }

  /**
   * Rematricular aluno (mesmo curso, novo ano letivo)
   */
  async reenrollStudent(
    previousEnrollmentId: number,
    newAcademicYearId: number
  ): Promise<StudentEnrollment> {
    try {
      // Buscar matrícula anterior
      const previousEnrollment = await this.getById(previousEnrollmentId);
      if (!previousEnrollment) {
        throw new Error('Matrícula anterior não encontrada');
      }

      // Criar nova matrícula
      const newEnrollment = await this.enrollStudent({
        student_profile_id: previousEnrollment.student_profile_id,
        school_id: previousEnrollment.school_id,
        course_id: previousEnrollment.course_id,
        academic_year_id: newAcademicYearId,
        status: 'Matriculado',
        notes: `Rematrícula automática do ano anterior (matrícula ${previousEnrollmentId})`
      });

      return newEnrollment;
    } catch (error) {
      console.error('Error in EnrollmentService.reenrollStudent:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de matrículas
   */
  async getStats(options?: {
    schoolId?: number;
    academicYearId?: number;
  }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCourse: Record<string, number>;
    bySchool: Record<string, number>;
  }> {
    try {
      let query = supabase
        .from('student_enrollments')
        .select(`
          status,
          course:courses(name),
          school:schools(trade_name)
        `)
        .is('deleted_at', null);

      if (options?.schoolId) {
        query = query.eq('school_id', options.schoolId);
      }

      if (options?.academicYearId) {
        query = query.eq('academic_year_id', options.academicYearId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      const byStatus: Record<string, number> = {};
      const byCourse: Record<string, number> = {};
      const bySchool: Record<string, number> = {};

      (data || []).forEach((item: any) => {
        // Contar por status
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;

        // Contar por curso
        if (item.course?.name) {
          byCourse[item.course.name] = (byCourse[item.course.name] || 0) + 1;
        }

        // Contar por escola
        if (item.school?.trade_name) {
          bySchool[item.school.trade_name] = (bySchool[item.school.trade_name] || 0) + 1;
        }
      });

      return {
        total: data?.length || 0,
        byStatus,
        byCourse,
        bySchool
      };
    } catch (error) {
      console.error('Error in EnrollmentService.getStats:', error);
      throw error;
    }
  }

  /**
   * Verificar se aluno já está matriculado em determinada escola/ano
   */
  async checkExistingEnrollment(
    studentProfileId: number,
    schoolId: number,
    academicYearId: number
  ): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('student_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('student_profile_id', studentProfileId)
        .eq('school_id', schoolId)
        .eq('academic_year_id', academicYearId)
        .eq('status', 'Matriculado')
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);
      return (count || 0) > 0;
    } catch (error) {
      console.error('Error in EnrollmentService.checkExistingEnrollment:', error);
      return false;
    }
  }

  /**
   * Buscar matrícula ativa de um aluno em um ano específico
   */
  async getActiveEnrollment(
    studentProfileId: number,
    academicYearId: number
  ): Promise<EnrollmentWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          *,
          school:schools(*),
          course:courses(*),
          academic_year:academic_years(*)
        `)
        .eq('student_profile_id', studentProfileId)
        .eq('academic_year_id', academicYearId)
        .eq('status', 'Matriculado')
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw handleSupabaseError(error);
      }

      return data as unknown as EnrollmentWithDetails;
    } catch (error) {
      console.error('Error in EnrollmentService.getActiveEnrollment:', error);
      throw error;
    }
  }
}

export const enrollmentService = new EnrollmentService();
export default enrollmentService;

