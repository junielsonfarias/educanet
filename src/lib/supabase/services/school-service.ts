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
        .eq('status', 'Matriculado')
        .is('deleted_at', null);

      // Buscar contagem de professores
      const { count: totalTeachers } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('employment_status', 'Ativo')
        .is('deleted_at', null);

      // Buscar contagem de funcionários
      const { count: totalStaff } = await supabase
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('employment_status', 'Ativo')
        .is('deleted_at', null);

      // Buscar contagem de turmas
      const { count: totalClasses } = await supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      // Buscar distribuição de alunos por nível de ensino
      const { data: enrollmentData } = await supabase
        .from('student_enrollments')
        .select(`
          status,
          course:courses(education_level)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      const studentsByEducationLevel: Record<string, number> = {};
      const studentsByStatus: Record<string, number> = {};

      (enrollmentData || []).forEach((item: Record<string, unknown>) => {
        // Contar por nível de ensino
        if (item.course?.education_level) {
          studentsByEducationLevel[item.course.education_level] = 
            (studentsByEducationLevel[item.course.education_level] || 0) + 1;
        }
        
        // Contar por status
        studentsByStatus[item.status] = (studentsByStatus[item.status] || 0) + 1;
      });

      // Calcular taxa de ocupação
      const capacity = school?.student_capacity || 0;
      const occupancyRate = capacity > 0 
        ? Math.round(((totalStudents || 0) / capacity) * 100) 
        : 0;

      return {
        totalStudents: totalStudents || 0,
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
        .order('name');

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
    academicYearId?: number;
    shift?: string;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('classes')
        .select(`
          *,
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

      const { data, error } = await query.order('name');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolService.getClasses:', error);
      throw error;
    }
  }

  /**
   * Buscar professores de uma escola
   */
  async getTeachers(schoolId: number, options?: {
    employmentStatus?: string;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('teachers')
        .select(`
          *,
          person:people(*)
        `)
        .eq('school_id', schoolId)
        .is('deleted_at', null);

      if (options?.employmentStatus) {
        query = query.eq('employment_status', options.employmentStatus);
      }

      const { data, error } = await query.order('person.full_name');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolService.getTeachers:', error);
      throw error;
    }
  }

  /**
   * Buscar funcionários de uma escola
   */
  async getStaff(schoolId: number, options?: {
    employmentStatus?: string;
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

      if (options?.employmentStatus) {
        query = query.eq('employment_status', options.employmentStatus);
      }

      if (options?.positionId) {
        query = query.eq('position_id', options.positionId);
      }

      if (options?.departmentId) {
        query = query.eq('department_id', options.departmentId);
      }

      const { data, error } = await query.order('person.full_name');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in SchoolService.getStaff:', error);
      throw error;
    }
  }

  /**
   * Buscar alunos de uma escola
   */
  async getStudents(schoolId: number, options?: {
    status?: string;
    academicYearId?: number;
    courseId?: number;
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

      if (options?.courseId) {
        query = query.eq('course_id', options.courseId);
      }

      const { data, error } = await query.order('student_profile.person.full_name');

      if (error) throw handleSupabaseError(error);
      return data || [];
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

      // Contar alunos matriculados
      const { count: totalStudents } = await supabase
        .from('student_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Matriculado')
        .is('deleted_at', null);

      // Contar professores ativos
      const { count: totalTeachers } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('employment_status', 'Ativo')
        .is('deleted_at', null);

      // Contar funcionários ativos
      const { count: totalStaff } = await supabase
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .eq('employment_status', 'Ativo')
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
        .eq('status', 'Matriculado')
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

