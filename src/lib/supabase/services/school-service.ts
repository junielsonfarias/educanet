/**
 * SchoolService - Serviço para gerenciamento de escolas
 * 
 * Gerencia escolas, infraestrutura, estatísticas e dados relacionados.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import type { School } from '@/lib/database-types';

export interface SchoolStats {
  totalStudents: number;
  totalStudentsPCD: number;
  totalTeachers: number;
  totalStaff: number;
  totalClasses: number;
  studentsByEducationLevel: Record<string, number>;
  studentsByStatus: Record<string, number>;
  capacity: number | null;
  occupancyRate: number;
}

export interface SchoolWithStats extends School {
  stats?: SchoolStats;
}

class SchoolService extends BaseService<School> {
  constructor() {
    super('schools');
  }

  /**
   * Buscar escola com estatísticas completas
   */
  async getSchoolWithStats(schoolId: number): Promise<SchoolWithStats | null> {
    try {
      const school = await this.getById(schoolId);
      if (!school) return null;

      const stats = await this.getSchoolStats(schoolId);

      return {
        ...school,
        stats
      };
    } catch (error) {
      console.error('Error in SchoolService.getSchoolWithStats:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas completas de uma escola
   */
  async getSchoolStats(schoolId: number): Promise<SchoolStats> {
    try {
      // Buscar escola para capacidade
      const school = await this.getById(schoolId);

      // Buscar contagem de alunos
      const { count: totalStudents } = await supabase
        .from('student_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('enrollment_status', 'Ativo')
        .is('deleted_at', null);

      // Buscar contagem de alunos PCD
      const { data: enrollmentsWithPCD } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          student_profile:student_profiles(is_pcd)
        `)
        .eq('school_id', schoolId)
        .eq('enrollment_status', 'Ativo')
        .is('deleted_at', null);

      const totalStudentsPCD = (enrollmentsWithPCD || []).filter((item: Record<string, unknown>) => {
        const profile = item.student_profile as Record<string, unknown> | undefined;
        return profile?.is_pcd === true;
      }).length;

      // Buscar contagem de professores (via class_teacher_subjects -> classes)
      const { data: teacherData } = await supabase
        .from('class_teacher_subjects')
        .select('teacher_id, class:classes!inner(school_id)')
        .eq('class.school_id', schoolId)
        .is('deleted_at', null);

      // Contar professores únicos
      const uniqueTeachers = new Set((teacherData || []).map(t => t.teacher_id));
      const totalTeachers = uniqueTeachers.size;

      // Buscar contagem de funcionários
      const { count: totalStaff } = await supabase
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      // Buscar contagem de turmas
      const { count: totalClasses } = await supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      // Buscar distribuição de alunos por status de matrícula
      const { data: enrollmentData } = await supabase
        .from('student_enrollments')
        .select('enrollment_status')
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      const studentsByEducationLevel: Record<string, number> = {};
      const studentsByStatus: Record<string, number> = {};

      (enrollmentData || []).forEach((item: Record<string, unknown>) => {
        // Contar por status
        const status = item.enrollment_status as string;
        if (status) {
          studentsByStatus[status] = (studentsByStatus[status] || 0) + 1;
        }
      });

      // Calcular taxa de ocupação
      const capacity = school?.student_capacity || 0;
      const occupancyRate = capacity > 0
        ? Math.round(((totalStudents || 0) / capacity) * 100)
        : 0;

      return {
        totalStudents: totalStudents || 0,
        totalStudentsPCD,
        totalTeachers: totalTeachers || 0,
        totalStaff: totalStaff || 0,
        totalClasses: totalClasses || 0,
        studentsByEducationLevel,
        studentsByStatus,
        capacity,
        occupancyRate
      };
    } catch (error) {
      console.error('Error in SchoolService.getSchoolStats:', error);
      throw error;
    }
  }

  /**
   * Buscar infraestrutura de uma escola
   */
  async getInfrastructure(schoolId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('infrastructures')
        .select('*')
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .order('type');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolService.getInfrastructure:', error);
      throw error;
    }
  }

  /**
   * Buscar turmas de uma escola
   */
  async getClasses(schoolId: number, options?: {
    academicPeriodId?: number;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('classes')
        .select(`
          *,
          course:courses(*),
          academic_period:academic_periods(*)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      if (options?.academicPeriodId) {
        query = query.eq('academic_period_id', options.academicPeriodId);
      }

      const { data, error } = await query.order('name');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolService.getClasses:', error);
      throw error;
    }
  }

  /**
   * Buscar professores de uma escola (via class_teacher_subjects)
   */
  async getTeachers(schoolId: number): Promise<any[]> {
    try {
      // Buscar professores alocados em turmas da escola
      const { data: assignments, error: assignError } = await supabase
        .from('class_teacher_subjects')
        .select(`
          teacher_id,
          class:classes!inner(school_id),
          teacher:teachers(
            *,
            person:people(*)
          )
        `)
        .eq('class.school_id', schoolId)
        .is('deleted_at', null);

      if (assignError) throw handleSupabaseError(assignError);

      // Deduplica professores (um professor pode estar em várias turmas)
      const teacherMap = new Map();
      (assignments || []).forEach(item => {
        if (item.teacher && !teacherMap.has(item.teacher_id)) {
          teacherMap.set(item.teacher_id, item.teacher);
        }
      });

      const teachers = Array.from(teacherMap.values());

      // Ordenar por nome da pessoa
      const sortedData = teachers.sort((a, b) => {
        const nameA = a.person?.full_name || '';
        const nameB = b.person?.full_name || '';
        return nameA.localeCompare(nameB, 'pt-BR');
      });

      return sortedData;
    } catch (error) {
      console.error('Error in SchoolService.getTeachers:', error);
      throw error;
    }
  }

  /**
   * Buscar funcionários de uma escola
   */
  async getStaff(schoolId: number, options?: {
    positionId?: number;
    departmentId?: number;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('staff')
        .select(`
          *,
          person:people(*),
          position:positions(*),
          department:departments(*)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      if (options?.positionId) {
        query = query.eq('position_id', options.positionId);
      }

      if (options?.departmentId) {
        query = query.eq('department_id', options.departmentId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      // Ordenar por nome da pessoa no JavaScript (Supabase não suporta order por campos relacionados)
      const sortedData = (data || []).sort((a, b) => {
        const nameA = a.person?.full_name || '';
        const nameB = b.person?.full_name || '';
        return nameA.localeCompare(nameB, 'pt-BR');
      });

      return sortedData;
    } catch (error) {
      console.error('Error in SchoolService.getStaff:', error);
      throw error;
    }
  }

  /**
   * Buscar alunos de uma escola
   */
  async getStudents(schoolId: number, options?: {
    enrollmentStatus?: string;
    academicYearId?: number;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('student_enrollments')
        .select(`
          *,
          student_profile:student_profiles(
            *,
            person:people(*)
          ),
          academic_year:academic_years(*)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      if (options?.enrollmentStatus) {
        query = query.eq('enrollment_status', options.enrollmentStatus);
      }

      if (options?.academicYearId) {
        query = query.eq('academic_year_id', options.academicYearId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      // Ordenar por nome da pessoa no JavaScript (Supabase não suporta order por campos relacionados aninhados)
      const sortedData = (data || []).sort((a, b) => {
        const nameA = a.student_profile?.person?.full_name || '';
        const nameB = b.student_profile?.person?.full_name || '';
        return nameA.localeCompare(nameB, 'pt-BR');
      });

      return sortedData;
    } catch (error) {
      console.error('Error in SchoolService.getStudents:', error);
      throw error;
    }
  }

  /**
   * Buscar escolas ativas
   */
  async getActiveSchools(): Promise<School[]> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('active', true)
        .is('deleted_at', null)
        .order('trade_name');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolService.getActiveSchools:', error);
      throw error;
    }
  }

  /**
   * Buscar escola por CNPJ
   */
  async getByCnpj(cnpj: string): Promise<School | null> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('cnpj', cnpj)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw handleSupabaseError(error);
      }

      return data as School;
    } catch (error) {
      console.error('Error in SchoolService.getByCnpj:', error);
      throw error;
    }
  }

  /**
   * Buscar escola por código INEP
   */
  async getByInepCode(inepCode: string): Promise<School | null> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('inep_code', inepCode)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw handleSupabaseError(error);
      }

      return data as School;
    } catch (error) {
      console.error('Error in SchoolService.getByInepCode:', error);
      throw error;
    }
  }

  /**
   * Buscar escolas com nome similar
   */
  async searchByName(name: string, limit: number = 10): Promise<School[]> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .ilike('trade_name', `%${name}%`)
        .is('deleted_at', null)
        .order('trade_name')
        .limit(limit);

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolService.searchByName:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas gerais (todas as escolas)
   */
  async getGeneralStats(): Promise<{
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    totalClasses: number;
    averageOccupancyRate: number;
  }> {
    try {
      // Contar escolas ativas
      const { count: totalSchools } = await supabase
        .from('schools')
        .select('id', { count: 'exact', head: true })
        .eq('active', true)
        .is('deleted_at', null);

      // Contar alunos ativos
      const { count: totalStudents } = await supabase
        .from('student_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('enrollment_status', 'Ativo')
        .is('deleted_at', null);

      // Contar professores (todos os cadastrados)
      const { count: totalTeachers } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);

      // Contar funcionários (todos os cadastrados)
      const { count: totalStaff } = await supabase
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);

      // Contar turmas
      const { count: totalClasses } = await supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);

      // Calcular taxa de ocupação média
      const { data: schools } = await supabase
        .from('schools')
        .select('id, student_capacity')
        .eq('active', true)
        .is('deleted_at', null);

      let totalCapacity = 0;
      (schools || []).forEach(school => {
        if (school.student_capacity) {
          totalCapacity += school.student_capacity;
        }
      });

      const averageOccupancyRate = totalCapacity > 0
        ? Math.round(((totalStudents || 0) / totalCapacity) * 100)
        : 0;

      return {
        totalSchools: totalSchools || 0,
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalStaff: totalStaff || 0,
        totalClasses: totalClasses || 0,
        averageOccupancyRate
      };
    } catch (error) {
      console.error('Error in SchoolService.getGeneralStats:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidade de vagas em uma escola
   */
  async checkAvailability(schoolId: number): Promise<{
    capacity: number | null;
    enrolled: number;
    available: number;
    hasAvailability: boolean;
  }> {
    try {
      const school = await this.getById(schoolId);
      if (!school) {
        throw new Error('Escola não encontrada');
      }

      const { count: enrolled } = await supabase
        .from('student_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('enrollment_status', 'Ativo')
        .is('deleted_at', null);

      const capacity = school.student_capacity;
      const available = capacity ? capacity - (enrolled || 0) : Infinity;
      const hasAvailability = capacity === null || available > 0;

      return {
        capacity,
        enrolled: enrolled || 0,
        available: capacity === null ? Infinity : available,
        hasAvailability
      };
    } catch (error) {
      console.error('Error in SchoolService.checkAvailability:', error);
      throw error;
    }
  }
}

export const schoolService = new SchoolService();
export default schoolService;

