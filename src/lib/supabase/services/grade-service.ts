/**
 * GradeService - Serviço para gerenciamento de notas
 * 
 * Gerencia notas de alunos, cálculo de médias, boletins e aprovação/reprovação.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';
import type { Grade } from '@/lib/database-types';

export interface GradeData {
  evaluation_instance_id: number;
  student_profile_id: number;
  grade_value: number;
  notes?: string;
}

export interface StudentGradesSummary {
  student_profile_id: number;
  student_name: string;
  grades: Array<{
    subject_name: string;
    subject_id: number;
    evaluations: Array<{
      evaluation_name: string;
      grade_value: number;
      evaluation_date: string;
    }>;
    average: number;
  }>;
  overall_average: number;
  status: 'Aprovado' | 'Reprovado' | 'Recuperação' | 'Pendente';
}

class GradeService extends BaseService<Grade> {
  constructor() {
    super('grades');
  }

  /**
   * Buscar nota com informações completas
   */
  async getGradeFullInfo(id: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          evaluation_instance:evaluation_instances(
            *,
            subject:subjects(*),
            academic_period:academic_periods(*)
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
      console.error('Error in GradeService.getGradeFullInfo:', error);
      throw error;
    }
  }

  /**
   * Salvar nota de um aluno
   */
  async saveGrade(data: GradeData): Promise<Grade> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Verificar se já existe nota para esta avaliação/aluno
      const { data: existingGrade } = await supabase
        .from('grades')
        .select('id')
        .eq('evaluation_instance_id', data.evaluation_instance_id)
        .eq('student_profile_id', data.student_profile_id)
        .is('deleted_at', null)
        .single();

      if (existingGrade) {
        // Atualizar nota existente
        const { data: updatedGrade, error } = await supabase
          .from('grades')
          .update({
            grade_value: data.grade_value,
            notes: data.notes,
            updated_by: user?.id || 1
          })
          .eq('id', existingGrade.id)
          .select()
          .single();

        if (error) throw handleSupabaseError(error);
        return updatedGrade as Grade;
      } else {
        // Criar nova nota
        const { data: newGrade, error } = await supabase
          .from('grades')
          .insert({
            ...data,
            created_by: user?.id || 1
          })
          .select()
          .single();

        if (error) throw handleSupabaseError(error);
        return newGrade as Grade;
      }
    } catch (error) {
      console.error('Error in GradeService.saveGrade:', error);
      throw error;
    }
  }

  /**
   * Buscar notas de um aluno por período
   */
  async getStudentGrades(
    studentProfileId: number,
    academicPeriodId?: number
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('grades')
        .select(`
          *,
          evaluation_instance:evaluation_instances(
            *,
            subject:subjects(*),
            academic_period:academic_periods(*)
          )
        `)
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null);

      if (academicPeriodId) {
        query = query.eq('evaluation_instance.academic_period_id', academicPeriodId);
      }

      const { data, error } = await query.order('evaluation_instance.evaluation_date', { ascending: false });

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in GradeService.getStudentGrades:', error);
      throw error;
    }
  }

  /**
   * Buscar notas de uma avaliação (toda a turma)
   */
  async getEvaluationGrades(evaluationInstanceId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          student_profile:student_profiles(
            *,
            person:people(*)
          )
        `)
        .eq('evaluation_instance_id', evaluationInstanceId)
        .is('deleted_at', null)
        .order('student_profile.person.full_name');

      if (error) throw handleSupabaseError(error);
      return data || [];
    } catch (error) {
      console.error('Error in GradeService.getEvaluationGrades:', error);
      throw error;
    }
  }

  /**
   * Calcular média de um aluno por disciplina e período
   */
  async calculateAverage(
    studentProfileId: number,
    subjectId: number,
    academicPeriodId: number
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          grade_value,
          evaluation_instance:evaluation_instances(
            subject_id,
            academic_period_id
          )
        `)
        .eq('student_profile_id', studentProfileId)
        .eq('evaluation_instance.subject_id', subjectId)
        .eq('evaluation_instance.academic_period_id', academicPeriodId)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      if (!data || data.length === 0) {
        return 0;
      }

      const sum = data.reduce((acc, grade) => acc + grade.grade_value, 0);
      const average = sum / data.length;
      
      return Math.round(average * 100) / 100; // 2 casas decimais
    } catch (error) {
      console.error('Error in GradeService.calculateAverage:', error);
      throw error;
    }
  }

  /**
   * Calcular média geral de um aluno no período
   */
  async calculateOverallAverage(
    studentProfileId: number,
    academicPeriodId: number
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          grade_value,
          evaluation_instance:evaluation_instances(
            subject_id,
            academic_period_id
          )
        `)
        .eq('student_profile_id', studentProfileId)
        .eq('evaluation_instance.academic_period_id', academicPeriodId)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      if (!data || data.length === 0) {
        return 0;
      }

      // Agrupar por disciplina e calcular média de cada
      const subjectAverages = new Map<number, number[]>();
      
      data.forEach((grade: any) => {
        const subjectId = grade.evaluation_instance?.subject_id;
        if (subjectId) {
          if (!subjectAverages.has(subjectId)) {
            subjectAverages.set(subjectId, []);
          }
          subjectAverages.get(subjectId)!.push(grade.grade_value);
        }
      });

      // Calcular média de cada disciplina
      const averages: number[] = [];
      subjectAverages.forEach((grades) => {
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        averages.push(avg);
      });

      // Média geral = média das médias das disciplinas
      const overallAvg = averages.reduce((a, b) => a + b, 0) / averages.length;
      
      return Math.round(overallAvg * 100) / 100;
    } catch (error) {
      console.error('Error in GradeService.calculateOverallAverage:', error);
      throw error;
    }
  }

  /**
   * Buscar boletim completo de um aluno
   */
  async getStudentReport(
    studentProfileId: number,
    academicPeriodId: number
  ): Promise<StudentGradesSummary> {
    try {
      // Buscar informações do aluno
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select(`
          *,
          person:people(full_name)
        `)
        .eq('id', studentProfileId)
        .single();

      if (studentError) throw handleSupabaseError(studentError);

      // Buscar todas as notas do período
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          evaluation_instance:evaluation_instances(
            *,
            subject:subjects(*)
          )
        `)
        .eq('student_profile_id', studentProfileId)
        .eq('evaluation_instance.academic_period_id', academicPeriodId)
        .is('deleted_at', null);

      if (gradesError) throw handleSupabaseError(gradesError);

      // Agrupar por disciplina
      const subjectsMap = new Map<number, any>();
      
      (gradesData || []).forEach((grade: any) => {
        const subject = grade.evaluation_instance?.subject;
        if (!subject) return;

        if (!subjectsMap.has(subject.id)) {
          subjectsMap.set(subject.id, {
            subject_name: subject.name,
            subject_id: subject.id,
            evaluations: [],
            grades: []
          });
        }

        const subjectData = subjectsMap.get(subject.id);
        subjectData.evaluations.push({
          evaluation_name: grade.evaluation_instance.name,
          grade_value: grade.grade_value,
          evaluation_date: grade.evaluation_instance.evaluation_date
        });
        subjectData.grades.push(grade.grade_value);
      });

      // Calcular médias por disciplina
      const grades = Array.from(subjectsMap.values()).map(subject => {
        const avg = subject.grades.reduce((a: number, b: number) => a + b, 0) / subject.grades.length;
        return {
          subject_name: subject.subject_name,
          subject_id: subject.subject_id,
          evaluations: subject.evaluations,
          average: Math.round(avg * 100) / 100
        };
      });

      // Calcular média geral
      const overallAverage = await this.calculateOverallAverage(studentProfileId, academicPeriodId);

      // Determinar status (assumindo média 6.0 para aprovação)
      let status: 'Aprovado' | 'Reprovado' | 'Recuperação' | 'Pendente' = 'Pendente';
      if (overallAverage >= 6.0) {
        status = 'Aprovado';
      } else if (overallAverage >= 4.0) {
        status = 'Recuperação';
      } else if (overallAverage > 0) {
        status = 'Reprovado';
      }

      return {
        student_profile_id: studentProfileId,
        student_name: studentData.person.full_name,
        grades,
        overall_average: overallAverage,
        status
      };
    } catch (error) {
      console.error('Error in GradeService.getStudentReport:', error);
      throw error;
    }
  }

  /**
   * Buscar notas de uma turma por disciplina
   */
  async getClassGradesBySubject(
    classId: number,
    subjectId: number,
    academicPeriodId: number
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

      // Para cada aluno, buscar notas da disciplina
      const results = await Promise.all(
        (enrollments || []).map(async (enrollment: any) => {
          const studentProfileId = enrollment.student_enrollment?.student_profile?.id;
          if (!studentProfileId) return null;

          const { data: grades } = await supabase
            .from('grades')
            .select(`
              *,
              evaluation_instance:evaluation_instances(*)
            `)
            .eq('student_profile_id', studentProfileId)
            .eq('evaluation_instance.subject_id', subjectId)
            .eq('evaluation_instance.academic_period_id', academicPeriodId)
            .is('deleted_at', null);

          const average = await this.calculateAverage(studentProfileId, subjectId, academicPeriodId);

          return {
            student_profile_id: studentProfileId,
            student_name: enrollment.student_enrollment.student_profile.person.full_name,
            grades: grades || [],
            average
          };
        })
      );

      return results.filter(Boolean);
    } catch (error) {
      console.error('Error in GradeService.getClassGradesBySubject:', error);
      throw error;
    }
  }

  /**
   * Salvar múltiplas notas de uma vez (lançamento em lote)
   */
  async saveMultipleGrades(grades: GradeData[]): Promise<Grade[]> {
    try {
      const savedGrades: Grade[] = [];

      for (const gradeData of grades) {
        const grade = await this.saveGrade(gradeData);
        savedGrades.push(grade);
      }

      return savedGrades;
    } catch (error) {
      console.error('Error in GradeService.saveMultipleGrades:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de notas
   */
  async getGradeStats(options: {
    classId?: number;
    subjectId?: number;
    academicPeriodId?: number;
  }): Promise<{
    total: number;
    average: number;
    highest: number;
    lowest: number;
    approved: number;
    failed: number;
    recovery: number;
  }> {
    try {
      let query = supabase
        .from('grades')
        .select(`
          grade_value,
          evaluation_instance:evaluation_instances(
            subject_id,
            academic_period_id,
            class_teacher_subject:class_teacher_subjects(class_id)
          )
        `)
        .is('deleted_at', null);

      if (options.subjectId) {
        query = query.eq('evaluation_instance.subject_id', options.subjectId);
      }

      if (options.academicPeriodId) {
        query = query.eq('evaluation_instance.academic_period_id', options.academicPeriodId);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      if (!data || data.length === 0) {
        return {
          total: 0,
          average: 0,
          highest: 0,
          lowest: 0,
          approved: 0,
          failed: 0,
          recovery: 0
        };
      }

      const grades = data.map(g => g.grade_value);
      const sum = grades.reduce((a, b) => a + b, 0);
      const avg = sum / grades.length;

      return {
        total: grades.length,
        average: Math.round(avg * 100) / 100,
        highest: Math.max(...grades),
        lowest: Math.min(...grades),
        approved: grades.filter(g => g >= 6.0).length,
        failed: grades.filter(g => g < 4.0).length,
        recovery: grades.filter(g => g >= 4.0 && g < 6.0).length
      };
    } catch (error) {
      console.error('Error in GradeService.getGradeStats:', error);
      throw error;
    }
  }

  /**
   * Verificar se aluno foi aprovado no período
   */
  async checkApproval(
    studentProfileId: number,
    academicPeriodId: number,
    minimumAverage: number = 6.0
  ): Promise<{
    isApproved: boolean;
    average: number;
    status: 'Aprovado' | 'Reprovado' | 'Recuperação';
  }> {
    try {
      const average = await this.calculateOverallAverage(studentProfileId, academicPeriodId);

      let status: 'Aprovado' | 'Reprovado' | 'Recuperação';
      if (average >= minimumAverage) {
        status = 'Aprovado';
      } else if (average >= 4.0) {
        status = 'Recuperação';
      } else {
        status = 'Reprovado';
      }

      return {
        isApproved: average >= minimumAverage,
        average,
        status
      };
    } catch (error) {
      console.error('Error in GradeService.checkApproval:', error);
      throw error;
    }
  }
}

export const gradeService = new GradeService();
export default gradeService;

