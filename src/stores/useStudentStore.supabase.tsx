/**
 * useStudentStore - Store para gerenciamento de alunos (Versão Supabase)
 * 
 * IMPORTANTE: Este arquivo substitui o useStudentStore.tsx antigo.
 * Após testar e validar, renomear para useStudentStore.tsx
 */

import { create } from 'zustand';
import { studentService } from '@/lib/supabase/services/student-service';
import type { Student, StudentFullInfo, Person, Guardian, StudentEnrollment, RelationshipType } from '@/lib/database-types';
import { toast } from 'sonner';

// Helper para adicionar propriedades de compatibilidade
function enrichStudentData(student: StudentFullInfo | null): StudentFullInfo | null {
  if (!student) return null;

  return {
    ...student,
    // Propriedades de compatibilidade
    name: student.person
      ? `${student.person.first_name || ''} ${student.person.last_name || ''}`.trim()
      : '',
    registration: student.registration_number || '',
    projectIds: [], // Projetos não implementados ainda
  };
}

interface StudentState {
  // Estado
  students: StudentFullInfo[];
  currentStudent: StudentFullInfo | null;
  loading: boolean;
  error: string | null;

  // Ações de busca
  fetchStudents: () => Promise<void>;
  fetchStudentsBySchool: (schoolId: number, options?: { status?: string; academicYearId?: number }) => Promise<void>;
  fetchStudentsByClass: (classId: number) => Promise<void>;
  fetchStudentById: (id: number) => Promise<void>;
  searchStudents: (name: string, options?: { schoolId?: number; limit?: number }) => Promise<void>;

  // Busca síncrona (do estado local)
  getStudent: (id: string | number) => StudentFullInfo | undefined;

  // Ações CRUD
  createStudent: (personData: Partial<Person>, studentData: Partial<Student>) => Promise<StudentFullInfo | null>;
  updateStudent: (studentId: number, personData: Partial<Person>, studentData: Partial<Student>) => Promise<StudentFullInfo | null>;
  deleteStudent: (studentId: number) => Promise<void>;

  // Responsáveis
  fetchGuardians: (studentProfileId: number) => Promise<Guardian[]>;
  addGuardian: (studentProfileId: number, guardianId: number, relationship: RelationshipType) => Promise<void>;
  removeGuardian: (studentProfileId: number, guardianId: number) => Promise<void>;

  // Matrículas
  fetchEnrollments: (studentProfileId: number, options?: { academicYearId?: number; status?: string }) => Promise<StudentEnrollment[]>;
  addEnrollment: (studentId: number | string, enrollmentData: Record<string, unknown>) => void;
  updateEnrollment: (studentId: number | string, enrollmentId: number | string, data: Record<string, unknown>) => void;

  // Projetos (compatibilidade)
  addProjectEnrollment: (studentId: number | string, projectId: string) => void;
  removeProjectEnrollment: (studentId: number | string, projectId: string) => void;

  // Utilitários
  clearError: () => void;
  setCurrentStudent: (student: StudentFullInfo | null) => void;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  // Estado inicial
  students: [],
  currentStudent: null,
  loading: false,
  error: null,

  // ==================== AÇÕES DE BUSCA ====================
  
  fetchStudents: async () => {
    set({ loading: true, error: null });
    try {
      const students = await studentService.getAll({
        sort: { column: 'id', ascending: true }
      });

      // Buscar informações completas de cada aluno
      const studentsWithFullInfo = await Promise.all(
        students.map(student => studentService.getStudentFullInfo(student.id))
      );

      // Enriquecer dados com propriedades de compatibilidade
      const enrichedStudents = studentsWithFullInfo
        .map(enrichStudentData)
        .filter(Boolean) as StudentFullInfo[];

      set({ students: enrichedStudents, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar alunos';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchStudentsBySchool: async (schoolId: number, options = {}) => {
    set({ loading: true, error: null });
    try {
      const students = await studentService.getBySchool(schoolId, options);
      const enrichedStudents = students.map(enrichStudentData).filter(Boolean) as StudentFullInfo[];
      set({ students: enrichedStudents, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar alunos da escola';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchStudentsByClass: async (classId: number) => {
    set({ loading: true, error: null });
    try {
      const students = await studentService.getByClass(classId);
      const enrichedStudents = students.map(enrichStudentData).filter(Boolean) as StudentFullInfo[];
      set({ students: enrichedStudents, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar alunos da turma';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchStudentById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const student = await studentService.getStudentFullInfo(id);
      const enrichedStudent = enrichStudentData(student);
      set({ currentStudent: enrichedStudent, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar dados do aluno';
      set({ error: message, loading: false, currentStudent: null });
      toast.error(message);
    }
  },

  searchStudents: async (name: string, options = {}) => {
    set({ loading: true, error: null });
    try {
      const students = await studentService.searchByName(name, options);
      const enrichedStudents = students.map(enrichStudentData).filter(Boolean) as StudentFullInfo[];
      set({ students: enrichedStudents, loading: false });
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao buscar alunos';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== BUSCA SÍNCRONA ====================

  getStudent: (id: string | number) => {
    const { students, currentStudent } = get();
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    // Primeiro verifica no currentStudent
    if (currentStudent && currentStudent.id === numericId) {
      return currentStudent;
    }

    // Depois busca na lista
    return students.find(s => s.id === numericId);
  },

  // ==================== AÇÕES CRUD ====================

  createStudent: async (personData: Partial<Person>, studentData: Partial<Student>) => {
    set({ loading: true, error: null });
    try {
      const newStudent = await studentService.createStudent(personData, studentData);
      const enrichedStudent = enrichStudentData(newStudent);

      // Adicionar à lista local
      const { students } = get();
      if (enrichedStudent) {
        set({
          students: [...students, enrichedStudent],
          loading: false
        });
      }

      toast.success('Aluno criado com sucesso!');
      return enrichedStudent;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao criar aluno';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  updateStudent: async (
    studentId: number,
    personData: Partial<Person>,
    studentData: Partial<Student>
  ) => {
    set({ loading: true, error: null });
    try {
      const updatedStudent = await studentService.updateStudent(studentId, personData, studentData);
      const enrichedStudent = enrichStudentData(updatedStudent);

      // Atualizar na lista local
      const { students } = get();
      set({
        students: students.map(s => s.id === studentId && enrichedStudent ? enrichedStudent : s),
        currentStudent: get().currentStudent?.id === studentId ? enrichedStudent : get().currentStudent,
        loading: false
      });

      toast.success('Aluno atualizado com sucesso!');
      return enrichedStudent;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao atualizar aluno';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  deleteStudent: async (studentId: number) => {
    set({ loading: true, error: null });
    try {
      await studentService.delete(studentId);

      // Remover da lista local
      const { students } = get();
      set({
        students: students.filter(s => s.id !== studentId),
        currentStudent: get().currentStudent?.id === studentId ? null : get().currentStudent,
        loading: false
      });

      toast.success('Aluno removido com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao remover aluno';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== RESPONSÁVEIS ====================

  fetchGuardians: async (studentProfileId: number) => {
    try {
      const guardians = await studentService.getGuardians(studentProfileId);
      return guardians;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar responsáveis';
      toast.error(message);
      return [];
    }
  },

  addGuardian: async (studentProfileId: number, guardianId: number, relationship: RelationshipType) => {
    set({ loading: true, error: null });
    try {
      await studentService.addGuardian(studentProfileId, guardianId, relationship);

      // Recarregar dados do aluno
      await get().fetchStudentById(studentProfileId);

      toast.success('Responsável associado com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao associar responsável';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  removeGuardian: async (studentProfileId: number, guardianId: number) => {
    set({ loading: true, error: null });
    try {
      await studentService.removeGuardian(studentProfileId, guardianId);

      // Recarregar dados do aluno
      await get().fetchStudentById(studentProfileId);

      toast.success('Responsável removido com sucesso!');
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao remover responsável';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== MATRÍCULAS ====================

  fetchEnrollments: async (studentProfileId: number, options = {}) => {
    try {
      const enrollments = await studentService.getEnrollments(studentProfileId, options);
      return enrollments;
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Erro ao carregar matrículas';
      toast.error(message);
      return [];
    }
  },

  addEnrollment: (studentId: number | string, enrollmentData: Record<string, unknown>) => {
    // TODO: Implementar via enrollmentService quando necessário
    // Por enquanto, apenas log para compatibilidade
    console.log('addEnrollment chamado:', { studentId, enrollmentData });
    toast.info('Funcionalidade de matrícula em desenvolvimento');
  },

  updateEnrollment: (studentId: number | string, enrollmentId: number | string, data: Record<string, unknown>) => {
    // TODO: Implementar via enrollmentService quando necessário
    console.log('updateEnrollment chamado:', { studentId, enrollmentId, data });
    toast.info('Funcionalidade de atualização de matrícula em desenvolvimento');
  },

  // ==================== PROJETOS (COMPATIBILIDADE) ====================

  addProjectEnrollment: (studentId: number | string, projectId: string) => {
    // TODO: Implementar quando houver tabela de projetos
    console.log('addProjectEnrollment chamado:', { studentId, projectId });
    toast.info('Funcionalidade de projetos em desenvolvimento');
  },

  removeProjectEnrollment: (studentId: number | string, projectId: string) => {
    // TODO: Implementar quando houver tabela de projetos
    console.log('removeProjectEnrollment chamado:', { studentId, projectId });
    toast.info('Funcionalidade de projetos em desenvolvimento');
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentStudent: (student: StudentFullInfo | null) => set({ currentStudent: student }),
}));

// Exportar tipos para uso em componentes
export type { StudentState, StudentFullInfo };

