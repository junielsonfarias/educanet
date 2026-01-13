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
      
      set({ 
        students: studentsWithFullInfo.filter(Boolean) as StudentFullInfo[], 
        loading: false 
      });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar alunos';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchStudentsBySchool: async (schoolId: number, options = {}) => {
    set({ loading: true, error: null });
    try {
      const students = await studentService.getBySchool(schoolId, options);
      set({ students, loading: false });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar alunos da escola';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchStudentsByClass: async (classId: number) => {
    set({ loading: true, error: null });
    try {
      const students = await studentService.getByClass(classId);
      set({ students, loading: false });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar alunos da turma';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  fetchStudentById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const student = await studentService.getStudentFullInfo(id);
      set({ currentStudent: student, loading: false });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao carregar dados do aluno';
      set({ error: message, loading: false, currentStudent: null });
      toast.error(message);
    }
  },

  searchStudents: async (name: string, options = {}) => {
    set({ loading: true, error: null });
    try {
      const students = await studentService.searchByName(name, options);
      set({ students, loading: false });
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao buscar alunos';
      set({ error: message, loading: false });
      toast.error(message);
    }
  },

  // ==================== AÇÕES CRUD ====================

  createStudent: async (personData: Partial<Person>, studentData: Partial<Student>) => {
    set({ loading: true, error: null });
    try {
      const newStudent = await studentService.createStudent(personData, studentData);
      
      // Adicionar à lista local
      const { students } = get();
      set({ 
        students: [...students, newStudent], 
        loading: false 
      });
      
      toast.success('Aluno criado com sucesso!');
      return newStudent;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao criar aluno';
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
      
      // Atualizar na lista local
      const { students } = get();
      set({ 
        students: students.map(s => s.id === studentId ? updatedStudent : s),
        currentStudent: get().currentStudent?.id === studentId ? updatedStudent : get().currentStudent,
        loading: false 
      });
      
      toast.success('Aluno atualizado com sucesso!');
      return updatedStudent;
    } catch (error: unknown) {
      const message = error?.message || 'Erro ao atualizar aluno';
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
      const message = error?.message || 'Erro ao remover aluno';
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
      const message = error?.message || 'Erro ao carregar responsáveis';
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
      const message = error?.message || 'Erro ao associar responsável';
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
      const message = error?.message || 'Erro ao remover responsável';
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
      const message = error?.message || 'Erro ao carregar matrículas';
      toast.error(message);
      return [];
    }
  },

  // ==================== UTILITÁRIOS ====================

  clearError: () => set({ error: null }),

  setCurrentStudent: (student: StudentFullInfo | null) => set({ currentStudent: student }),
}));

// Exportar tipos para uso em componentes
export type { StudentState, StudentFullInfo };

