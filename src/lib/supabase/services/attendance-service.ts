/**
 * AttendanceService - Serviço para gerenciamento de frequência
 * 
 * Gerencia registros de presença/falta, cálculo de percentual de frequência e relatórios.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import type { Attendance } from '@/lib/database-types';

export interface AttendanceData {
  lesson_id: number;
  student_profile_id: number;
  attendance_status: 'Presente' | 'Ausente' | 'Justificado' | 'Atestado';
  notes?: string;
}

export interface AttendanceStats {
  totalClasses: number;
  present: number;
  absent: number;
  justified: number;
  withCertificate: number;
  attendanceRate: number;
}

class AttendanceService extends BaseService<Attendance> {
  constructor() {
    super('attendances');
  }

  /**
   * Buscar frequência com informações completas
   */
  async getAttendanceFullInfo(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          *,
          lesson:lessons(
            *,
            class:classes(*),
            subject:subjects(*),
            teacher:teachers(
              person:people(full_name)
            )
          ),
          student_profile:student_profiles(
            *,
            person:people(*)
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

      return data;
    } catch (error) {
      console.error('Error in AttendanceService.getAttendanceFullInfo:', error);
      throw error;
    }
  }

  /**
   * Registrar frequência de uma aula
   */
  async recordAttendance(
    lessonId: number,
    records: AttendanceData[]
  ): Promise<Attendance[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const attendances: Attendance[] = [];

      for (const record of records) {
        // Verificar se já existe registro
        const { data: existing } = await supabase
          .from('attendances')
          .select('id')
          .eq('lesson_id', lessonId)
          .eq('student_profile_id', record.student_profile_id)
          .is('deleted_at', null)
          .single();

        if (existing) {
          // Atualizar existente
          const { data: updated, error } = await supabase
            .from('attendances')
            .update({
              attendance_status: record.attendance_status,
              notes: record.notes,
              updated_by: user?.id || 1
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw handleSupabaseError(error);
          attendances.push(updated as Attendance);
        } else {
          // Criar novo
          const { data: created, error } = await supabase
            .from('attendances')
            .insert({
              ...record,
              created_by: user?.id || 1
            })
            .select()
            .single();

          if (error) throw handleSupabaseError(error);
          attendances.push(created as Attendance);
        }
      }

      return attendances;
    } catch (error) {
      console.error('Error in AttendanceService.recordAttendance:', error);
      throw error;
    }
  }

  /**
   * Buscar frequência de uma aula
   */
  async getLessonAttendance(lessonId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          *,
          student_profile:student_profiles(
            *,
            person:people(*)
          )
        `)
        .eq('lesson_id', lessonId)
        .is('deleted_at', null)
        .order('student_profile.person.full_name');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in AttendanceService.getLessonAttendance:', error);
      throw error;
    }
  }

  /**
   * Buscar frequência de um aluno por período
   */
  async getStudentAttendance(
    studentProfileId: number,
    options?: {
      academicPeriodId?: number;
      subjectId?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('attendances')
        .select(`
          *,
          lesson:lessons(
            *,
            class:classes(*),
            subject:subjects(*),
            academic_period:academic_periods(*)
          )
        `)
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null);

      if (options?.academicPeriodId) {
        query = query.eq('lesson.academic_period_id', options.academicPeriodId);
      }

      if (options?.subjectId) {
        query = query.eq('lesson.subject_id', options.subjectId);
      }

      if (options?.startDate) {
        query = query.gte('lesson.lesson_date', options.startDate);
      }

      if (options?.endDate) {
        query = query.lte('lesson.lesson_date', options.endDate);
      }

      const { data, error } = await query.order('lesson.lesson_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in AttendanceService.getStudentAttendance:', error);
      throw error;
    }
  }

  /**
   * Buscar frequência de uma turma por disciplina
   */
  async getClassAttendance(
    classId: number,
    subjectId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('lessons')
        .select(`
          *,
          attendances(
            *,
            student_profile:student_profiles(
              *,
              person:people(*)
            )
          )
        `)
        .eq('class_id', classId)
        .is('deleted_at', null);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      if (startDate) {
        query = query.gte('lesson_date', startDate);
      }

      if (endDate) {
        query = query.lte('lesson_date', endDate);
      }

      const { data, error } = await query.order('lesson_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in AttendanceService.getClassAttendance:', error);
      throw error;
    }
  }

  /**
   * Calcular estatísticas de frequência de um aluno
   */
  async calculateAttendanceStats(
    studentProfileId: number,
    options?: {
      academicPeriodId?: number;
      subjectId?: number;
    }
  ): Promise<AttendanceStats> {
    try {
      let query = supabase
        .from('attendances')
        .select(`
          attendance_status,
          lesson:lessons(
            academic_period_id,
            subject_id
          )
        `)
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null);

      if (options?.academicPeriodId) {
        query = query.eq('lesson.academic_period_id', options.academicPeriodId);
      }

      if (options?.subjectId) {
        query = query.eq('lesson.subject_id', options.subjectId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      const totalClasses = data?.length || 0;
      const present = data?.filter(a => a.attendance_status === 'Presente').length || 0;
      const absent = data?.filter(a => a.attendance_status === 'Ausente').length || 0;
      const justified = data?.filter(a => a.attendance_status === 'Justificado').length || 0;
      const withCertificate = data?.filter(a => a.attendance_status === 'Atestado').length || 0;

      // Calcular percentual (presente + justificado + atestado = presença válida)
      const validPresence = present + justified + withCertificate;
      const attendanceRate = totalClasses > 0 
        ? Math.round((validPresence / totalClasses) * 100 * 100) / 100 
        : 0;

      return {
        totalClasses,
        present,
        absent,
        justified,
        withCertificate,
        attendanceRate
      };
    } catch (error) {
      console.error('Error in AttendanceService.calculateAttendanceStats:', error);
      throw error;
    }
  }

  /**
   * Verificar se aluno atingiu mínimo de frequência (geralmente 75%)
   */
  async checkMinimumAttendance(
    studentProfileId: number,
    academicPeriodId: number,
    minimumRate: number = 75
  ): Promise<{
    meetsRequirement: boolean;
    attendanceRate: number;
    totalClasses: number;
    validPresences: number;
    absences: number;
  }> {
    try {
      const stats = await this.calculateAttendanceStats(studentProfileId, {
        academicPeriodId
      });

      return {
        meetsRequirement: stats.attendanceRate >= minimumRate,
        attendanceRate: stats.attendanceRate,
        totalClasses: stats.totalClasses,
        validPresences: stats.present + stats.justified + stats.withCertificate,
        absences: stats.absent
      };
    } catch (error) {
      console.error('Error in AttendanceService.checkMinimumAttendance:', error);
      throw error;
    }
  }

  /**
   * Buscar alunos com frequência abaixo do mínimo
   */
  async getStudentsWithLowAttendance(
    classId: number,
    academicPeriodId: number,
    minimumRate: number = 75
  ): Promise<any[]> {
    try {
      // Buscar todos os alunos da turma
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('class_enrollments')
        .select(`
          student_enrollment:student_enrollments(
            student_profile:student_profiles(
              id,
              person:people(full_name)
            )
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (enrollmentError) throw handleSupabaseError(enrollmentError);

      const studentsWithLowAttendance = [];

      for (const enrollment of enrollments || []) {
        const studentProfileId = enrollment.student_enrollment?.student_profile?.id;
        if (!studentProfileId) continue;

        const stats = await this.calculateAttendanceStats(studentProfileId, {
          academicPeriodId
        });

        if (stats.attendanceRate < minimumRate) {
          studentsWithLowAttendance.push({
            student_profile_id: studentProfileId,
            student_name: enrollment.student_enrollment.student_profile.person.full_name,
            ...stats
          });
        }
      }

      return studentsWithLowAttendance.sort((a, b) => a.attendanceRate - b.attendanceRate);
    } catch (error) {
      console.error('Error in AttendanceService.getStudentsWithLowAttendance:', error);
      throw error;
    }
  }

  /**
   * Buscar relatório de frequência de uma turma
   */
  async getClassAttendanceReport(
    classId: number,
    academicPeriodId: number,
    subjectId?: number
  ): Promise<any[]> {
    try {
      // Buscar alunos da turma
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('class_enrollments')
        .select(`
          student_enrollment:student_enrollments(
            student_profile:student_profiles(
              id,
              person:people(full_name)
            )
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (enrollmentError) throw handleSupabaseError(enrollmentError);

      const report = await Promise.all(
        (enrollments || []).map(async (enrollment: Record<string, unknown>) => {
          const studentProfileId = enrollment.student_enrollment?.student_profile?.id;
          if (!studentProfileId) return null;

          const stats = await this.calculateAttendanceStats(studentProfileId, {
            academicPeriodId,
            subjectId
          });

          return {
            student_profile_id: studentProfileId,
            student_name: enrollment.student_enrollment.student_profile.person.full_name,
            ...stats,
            status: stats.attendanceRate >= 75 ? 'Adequado' : 'Atenção'
          };
        })
      );

      return report.filter(Boolean).sort((a: Record<string, unknown>, b: Record<string, unknown>) => 
        a.student_name.localeCompare(b.student_name)
      );
    } catch (error) {
      console.error('Error in AttendanceService.getClassAttendanceReport:', error);
      throw error;
    }
  }

  /**
   * Buscar frequência de um período (para relatório mensal, por exemplo)
   */
  async getAttendanceByPeriod(
    startDate: string,
    endDate: string,
    options?: {
      schoolId?: number;
      classId?: number;
      studentProfileId?: number;
    }
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('attendances')
        .select(`
          *,
          lesson:lessons(
            *,
            class:classes(
              *,
              school:schools(*)
            ),
            subject:subjects(*)
          ),
          student_profile:student_profiles(
            *,
            person:people(*)
          )
        `)
        .gte('lesson.lesson_date', startDate)
        .lte('lesson.lesson_date', endDate)
        .is('deleted_at', null);

      if (options?.schoolId) {
        query = query.eq('lesson.class.school_id', options.schoolId);
      }

      if (options?.classId) {
        query = query.eq('lesson.class_id', options.classId);
      }

      if (options?.studentProfileId) {
        query = query.eq('student_profile_id', options.studentProfileId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in AttendanceService.getAttendanceByPeriod:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas gerais de frequência
   */
  async getGeneralStats(options?: {
    schoolId?: number;
    academicPeriodId?: number;
  }): Promise<{
    totalAttendances: number;
    averageAttendanceRate: number;
    byStatus: Record<string, number>;
  }> {
    try {
      let query = supabase
        .from('attendances')
        .select(`
          attendance_status,
          lesson:lessons(
            academic_period_id,
            class:classes(school_id)
          )
        `)
        .is('deleted_at', null);

      if (options?.schoolId) {
        query = query.eq('lesson.class.school_id', options.schoolId);
      }

      if (options?.academicPeriodId) {
        query = query.eq('lesson.academic_period_id', options.academicPeriodId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      const totalAttendances = data?.length || 0;
      const byStatus: Record<string, number> = {};

      (data || []).forEach((attendance: Record<string, unknown>) => {
        byStatus[attendance.attendance_status] = 
          (byStatus[attendance.attendance_status] || 0) + 1;
      });

      const present = byStatus['Presente'] || 0;
      const justified = byStatus['Justificado'] || 0;
      const withCertificate = byStatus['Atestado'] || 0;
      const validPresences = present + justified + withCertificate;

      const averageAttendanceRate = totalAttendances > 0
        ? Math.round((validPresences / totalAttendances) * 100 * 100) / 100
        : 0;

      return {
        totalAttendances,
        averageAttendanceRate,
        byStatus
      };
    } catch (error) {
      console.error('Error in AttendanceService.getGeneralStats:', error);
      throw error;
    }
  }

  /**
   * Justificar falta
   */
  async justifyAbsence(
    attendanceId: number,
    justificationType: 'Justificado' | 'Atestado',
    notes: string
  ): Promise<Attendance> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('attendances')
        .update({
          attendance_status: justificationType,
          notes,
          updated_by: user?.id || 1
        })
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);
      return data as Attendance;
    } catch (error) {
      console.error('Error in AttendanceService.justifyAbsence:', error);
      throw error;
    }
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;

