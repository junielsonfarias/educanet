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
  student_enrollment_id: number;
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
            class_teacher_subject:class_teacher_subjects(
              *,
              subject:subjects(*)
            ),
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
        .eq('student_enrollment_id', data.student_enrollment_id)
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
   * Nota: grades usa student_enrollment_id, não student_profile_id
   */
  async getStudentGrades(
    studentProfileId: number,
    academicPeriodId?: number
  ): Promise<any[]> {
    try {
      // Primeiro, buscar todos os student_enrollment_ids do aluno
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null);

      if (enrollmentError) throw handleSupabaseError(enrollmentError);

      const enrollmentIds = (enrollments || []).map(e => e.id);

      if (enrollmentIds.length === 0) {
        return [];
      }

      // Buscar notas usando student_enrollment_id
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          student_enrollment:student_enrollments(
            id,
            student_profile_id
          ),
          evaluation_instance:evaluation_instances(
            *,
            class_teacher_subject:class_teacher_subjects(
              *,
              subject:subjects(*)
            ),
            academic_period:academic_periods(*)
          )
        `)
        .in('student_enrollment_id', enrollmentIds)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Filtrar por período se especificado
      let filteredData = data || [];
      if (academicPeriodId) {
        filteredData = filteredData.filter(
          (g: any) => g.evaluation_instance?.academic_period_id === academicPeriodId
        );
      }

      // Ordenar por data de avaliação em JavaScript
      const sortedData = filteredData.sort((a, b) => {
        const dateA = a.evaluation_instance?.evaluation_date || '';
        const dateB = b.evaluation_instance?.evaluation_date || '';
        return dateB.localeCompare(dateA); // Ordem decrescente
      });

      return sortedData;
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
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Ordenar por nome do aluno em JavaScript (Supabase não suporta order por relações aninhadas)
      const sortedData = (data || []).sort((a, b) => {
        const nameA = a.student_profile?.person?.full_name || '';
        const nameB = b.student_profile?.person?.full_name || '';
        return nameA.localeCompare(nameB);
      });

      return sortedData;
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
      // Primeiro, buscar todos os student_enrollment_ids do aluno
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null);

      if (enrollmentError) throw handleSupabaseError(enrollmentError);

      const enrollmentIds = (enrollments || []).map(e => e.id);
      if (enrollmentIds.length === 0) return 0;

      const { data, error } = await supabase
        .from('grades')
        .select(`
          grade_value,
          evaluation_instance:evaluation_instances(
            academic_period_id,
            class_teacher_subject:class_teacher_subjects(subject_id)
          )
        `)
        .in('student_enrollment_id', enrollmentIds)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Filtrar por disciplina e período em JavaScript
      const filteredData = (data || []).filter((grade: any) => {
        const gradeSubjectId = grade.evaluation_instance?.class_teacher_subject?.subject_id;
        const gradePeriodId = grade.evaluation_instance?.academic_period_id;
        return gradeSubjectId === subjectId && gradePeriodId === academicPeriodId;
      });

      if (filteredData.length === 0) {
        return 0;
      }

      const sum = filteredData.reduce((acc: number, grade: any) => acc + grade.grade_value, 0);
      const average = sum / filteredData.length;

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
      // Primeiro, buscar todos os student_enrollment_ids do aluno
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null);

      if (enrollmentError) throw handleSupabaseError(enrollmentError);

      const enrollmentIds = (enrollments || []).map(e => e.id);
      if (enrollmentIds.length === 0) return 0;

      const { data, error } = await supabase
        .from('grades')
        .select(`
          grade_value,
          evaluation_instance:evaluation_instances(
            academic_period_id,
            class_teacher_subject:class_teacher_subjects(subject_id)
          )
        `)
        .in('student_enrollment_id', enrollmentIds)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Filtrar por período em JavaScript
      const filteredData = (data || []).filter((grade: any) => {
        return grade.evaluation_instance?.academic_period_id === academicPeriodId;
      });

      if (filteredData.length === 0) {
        return 0;
      }

      // Agrupar por disciplina e calcular média de cada
      const subjectAverages = new Map<number, number[]>();

      filteredData.forEach((grade: any) => {
        const subjectId = grade.evaluation_instance?.class_teacher_subject?.subject_id;
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

      if (averages.length === 0) return 0;

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

      // Buscar student_enrollment_ids do aluno
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null);

      if (enrollmentError) throw handleSupabaseError(enrollmentError);

      const enrollmentIds = (enrollments || []).map(e => e.id);
      if (enrollmentIds.length === 0) {
        return {
          student_profile_id: studentProfileId,
          student_name: studentData.person.full_name,
          grades: [],
          overall_average: 0,
          status: 'Pendente'
        };
      }

      // Buscar todas as notas do período
      const { data: allGrades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          evaluation_instance:evaluation_instances(
            *,
            class_teacher_subject:class_teacher_subjects(
              *,
              subject:subjects(*)
            )
          )
        `)
        .in('student_enrollment_id', enrollmentIds)
        .is('deleted_at', null);

      if (gradesError) throw handleSupabaseError(gradesError);

      // Filtrar por período em JavaScript
      const gradesData = (allGrades || []).filter(
        (g: any) => g.evaluation_instance?.academic_period_id === academicPeriodId
      );

      // Agrupar por disciplina
      const subjectsMap = new Map<number, any>();

      (gradesData || []).forEach((grade: Record<string, unknown>) => {
        const subject = grade.evaluation_instance?.class_teacher_subject?.subject;
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
          evaluation_name: grade.evaluation_instance.title,
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
      // 1. Buscar todos os alunos da turma
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('class_enrollments')
        .select(`
          student_enrollment_id,
          student_enrollment:student_enrollments(
            id,
            student_profile:student_profiles(
              id,
              person:people(first_name, last_name)
            )
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (enrollmentError) throw handleSupabaseError(enrollmentError);
      if (!enrollments || enrollments.length === 0) return [];

      // Extrair IDs de student_enrollment para query em lote
      const studentEnrollmentIds = enrollments
        .map((e: Record<string, unknown>) => e.student_enrollment_id)
        .filter(Boolean) as number[];

      if (studentEnrollmentIds.length === 0) return [];

      // 2. Buscar TODAS as notas de todos os alunos em UMA query (otimizado)
      const { data: allGrades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          evaluation_instance:evaluation_instances(
            id,
            name,
            academic_period_id,
            class_teacher_subject:class_teacher_subjects(subject_id)
          )
        `)
        .in('student_enrollment_id', studentEnrollmentIds)
        .is('deleted_at', null);

      if (gradesError) throw handleSupabaseError(gradesError);

      // Criar mapa de notas por student_enrollment_id para acesso O(1)
      const gradesByEnrollment = new Map<number, typeof allGrades>();
      for (const grade of allGrades || []) {
        const enrollmentId = grade.student_enrollment_id;
        if (!gradesByEnrollment.has(enrollmentId)) {
          gradesByEnrollment.set(enrollmentId, []);
        }
        gradesByEnrollment.get(enrollmentId)!.push(grade);
      }

      // 3. Montar resultados mapeando notas aos alunos
      const results = enrollments.map((enrollment: Record<string, unknown>) => {
        const studentEnrollmentId = enrollment.student_enrollment_id as number;
        const studentEnrollment = enrollment.student_enrollment as Record<string, unknown> | null;
        const studentProfile = studentEnrollment?.student_profile as Record<string, unknown> | null;
        const person = studentProfile?.person as Record<string, unknown> | null;

        if (!studentEnrollmentId || !studentProfile?.id) return null;

        // Filtrar notas deste aluno por disciplina e período
        const studentGrades = gradesByEnrollment.get(studentEnrollmentId) || [];
        const filteredGrades = studentGrades.filter((g: Record<string, unknown>) => {
          const evalInstance = g.evaluation_instance as Record<string, unknown> | null;
          const classTeacherSubject = evalInstance?.class_teacher_subject as Record<string, unknown> | null;
          const gradeSubjectId = classTeacherSubject?.subject_id;
          const gradePeriodId = evalInstance?.academic_period_id;
          return gradeSubjectId === subjectId && gradePeriodId === academicPeriodId;
        });

        // Calcular média local (evita query adicional)
        const gradeValues = filteredGrades
          .map((g: Record<string, unknown>) => g.grade_value as number)
          .filter((v): v is number => typeof v === 'number' && !isNaN(v));
        const average = gradeValues.length > 0
          ? gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length
          : 0;

        const firstName = person?.first_name || '';
        const lastName = person?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();

        return {
          student_profile_id: studentProfile.id as number,
          student_name: fullName,
          grades: filteredGrades,
          average: Math.round(average * 100) / 100
        };
      });

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
      const { data, error } = await supabase
        .from('grades')
        .select(`
          grade_value,
          evaluation_instance:evaluation_instances(
            academic_period_id,
            class_teacher_subject:class_teacher_subjects(class_id, subject_id)
          )
        `)
        .is('deleted_at', null);

      if (error) throw handleSupabaseError(error);

      // Filtrar em JavaScript (Supabase não suporta filtro por nested relations)
      let filteredData = data || [];

      if (options.subjectId) {
        filteredData = filteredData.filter((g: any) =>
          g.evaluation_instance?.class_teacher_subject?.subject_id === options.subjectId
        );
      }

      if (options.academicPeriodId) {
        filteredData = filteredData.filter((g: any) =>
          g.evaluation_instance?.academic_period_id === options.academicPeriodId
        );
      }

      if (options.classId) {
        filteredData = filteredData.filter((g: any) =>
          g.evaluation_instance?.class_teacher_subject?.class_id === options.classId
        );
      }

      if (filteredData.length === 0) {
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

      const grades = filteredData.map((g: any) => g.grade_value);
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
   * Buscar notas formatadas para exibição no boletim/desempenho
   * Retorna no formato esperado pelos componentes de UI
   */
  async getStudentAssessmentsFormatted(studentProfileId: number): Promise<any[]> {
    try {
      // Buscar student_enrollment_ids do aluno
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          academic_year_id,
          school_id
        `)
        .eq('student_profile_id', studentProfileId)
        .is('deleted_at', null);

      if (enrollmentError) throw handleSupabaseError(enrollmentError);
      if (!enrollments || enrollments.length === 0) return [];

      const enrollmentIds = enrollments.map(e => e.id);

      // Buscar notas com todos os relacionamentos necessários
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          grade_value,
          created_at,
          student_enrollment_id,
          evaluation_instance:evaluation_instances(
            id,
            title,
            evaluation_date,
            evaluation_type,
            academic_period_id,
            education_grade_id,
            assessment_type_id,
            class_teacher_subject:class_teacher_subjects(
              id,
              class_id,
              subject_id,
              class:classes(
                id,
                name,
                academic_year_id
              )
            ),
            assessment_type:assessment_types(
              id,
              name,
              is_recovery,
              replaces_lowest
            )
          )
        `)
        .in('student_enrollment_id', enrollmentIds)
        .is('deleted_at', null);

      if (gradesError) throw handleSupabaseError(gradesError);

      // Transformar para o formato esperado pelos componentes
      // IMPORTANTE: Manter IDs como tipos mistos (string para compatibilidade com componentes legados)
      const formattedAssessments = (grades || []).map((grade: any) => {
        const evalInstance = grade.evaluation_instance;
        const cts = evalInstance?.class_teacher_subject;
        const classData = cts?.class;
        const assessmentType = evalInstance?.assessment_type;

        // Determinar categoria (regular ou recuperação)
        const isRecovery = assessmentType?.is_recovery || false;
        const category = isRecovery ? 'recuperation' : 'regular';

        return {
          id: String(grade.id),
          // IDs mantidos como string para compatibilidade com diferentes sistemas
          studentId: studentProfileId, // Número
          subjectId: cts?.subject_id || null, // Número
          yearId: classData?.academic_year_id || null, // Número
          classroomId: cts?.class_id || null, // Número
          periodId: evalInstance?.academic_period_id || null, // Número
          assessmentTypeId: evalInstance?.assessment_type_id || null, // Número
          category,
          date: evalInstance?.evaluation_date || grade.created_at,
          value: grade.grade_value,
          evaluationInstanceId: evalInstance?.id,
          evaluationTitle: evalInstance?.title,
          // Campos adicionais úteis
          isRecovery,
          replacesLowest: assessmentType?.replaces_lowest || false,
        };
      });

      return formattedAssessments;
    } catch (error) {
      console.error('Error in GradeService.getStudentAssessmentsFormatted:', error);
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

