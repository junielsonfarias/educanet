/**
 * useClassStore - Store Zustand para gerenciamento de turmas
 *
 * Centraliza o estado de turmas, incluindo CRUD, filtros e estatísticas.
 */

import { create } from 'zustand'
import { classService, type ClassWithFullInfo, type ClassStats } from '@/lib/supabase/services'
import type { Class } from '@/lib/database-types'

interface EducationGrade {
  id: number
  grade_name: string
  grade_order: number
  education_level: string
}

interface ClassFilters {
  schoolId?: number
  academicYearId?: number
  courseId?: number
  educationGradeId?: number
  shift?: string
  search?: string
}

interface ClassState {
  // Data
  classes: ClassWithFullInfo[]
  selectedClass: ClassWithFullInfo | null
  educationGrades: EducationGrade[]

  // UI State
  loading: boolean
  error: string | null
  filters: ClassFilters

  // Stats
  generalStats: {
    totalClasses: number
    totalStudents: number
    averageOccupancy: number
    byShift: Record<string, number>
    byCourse: Record<string, number>
  } | null

  // Actions
  fetchClasses: (filters?: ClassFilters) => Promise<void>
  fetchClassById: (id: number) => Promise<ClassWithFullInfo | null>
  fetchClassWithGradeInfo: (id: number) => Promise<Record<string, unknown> | null>
  fetchEducationGrades: () => Promise<void>
  fetchGeneralStats: (options?: { schoolId?: number; academicYearId?: number }) => Promise<void>

  createClass: (data: {
    name: string
    school_id: number
    course_id: number
    academic_period_id: number
    education_grade_id?: number
    homeroom_teacher_id?: number
    capacity?: number
    shift?: string
  }) => Promise<Record<string, unknown> | null>

  updateClass: (id: number, data: Partial<Class>) => Promise<boolean>
  deleteClass: (id: number) => Promise<boolean>

  // Student management
  enrollStudent: (studentEnrollmentId: number, classId: number) => Promise<boolean>
  unenrollStudent: (classEnrollmentId: number) => Promise<boolean>

  // Teacher management
  assignTeacher: (classId: number, teacherId: number, subjectId: number, workloadHours?: number) => Promise<boolean>
  unassignTeacher: (classId: number, teacherId: number, subjectId: number) => Promise<boolean>

  // Utils
  setFilters: (filters: ClassFilters) => void
  clearFilters: () => void
  setSelectedClass: (cls: ClassWithFullInfo | null) => void
  clearError: () => void
}

export const useClassStore = create<ClassState>((set, get) => ({
  // Initial state
  classes: [],
  selectedClass: null,
  educationGrades: [],
  loading: false,
  error: null,
  filters: {},
  generalStats: null,

  // Fetch classes with filters
  fetchClasses: async (filters?: ClassFilters) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = filters || get().filters
      let classes: ClassWithFullInfo[] = []

      if (currentFilters.schoolId) {
        classes = await classService.getBySchool(currentFilters.schoolId, {
          academicYearId: currentFilters.academicYearId,
          shift: currentFilters.shift,
          courseId: currentFilters.courseId
        })
      } else if (currentFilters.academicYearId) {
        classes = await classService.getByAcademicYear(currentFilters.academicYearId, {
          schoolId: currentFilters.schoolId,
          shift: currentFilters.shift
        })
      } else if (currentFilters.educationGradeId) {
        classes = await classService.getByGrade(currentFilters.educationGradeId, {
          schoolId: currentFilters.schoolId,
          academicYearId: currentFilters.academicYearId
        })
      } else {
        // Buscar todas as turmas
        const allClasses = await classService.getAll()
        // Enriquecer com informações completas
        classes = await Promise.all(
          allClasses.map(async (cls) => {
            const fullInfo = await classService.getClassFullInfo(cls.id)
            return fullInfo || cls as ClassWithFullInfo
          })
        )
      }

      // Aplicar filtro de busca
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase()
        classes = classes.filter(cls =>
          cls.name.toLowerCase().includes(searchLower) ||
          cls.school?.trade_name?.toLowerCase().includes(searchLower) ||
          cls.course?.name?.toLowerCase().includes(searchLower)
        )
      }

      set({ classes, loading: false })
    } catch (error) {
      console.error('Error fetching classes:', error)
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar turmas',
        loading: false
      })
    }
  },

  // Fetch single class by ID
  fetchClassById: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const cls = await classService.getClassFullInfo(id)
      if (cls) {
        set({ selectedClass: cls, loading: false })
      }
      return cls
    } catch (error) {
      console.error('Error fetching class:', error)
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar turma',
        loading: false
      })
      return null
    }
  },

  // Fetch class with grade and evaluation rule info
  fetchClassWithGradeInfo: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const cls = await classService.getClassWithGradeInfo(id)
      set({ loading: false })
      return cls
    } catch (error) {
      console.error('Error fetching class with grade info:', error)
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar informações da turma',
        loading: false
      })
      return null
    }
  },

  // Fetch education grades
  fetchEducationGrades: async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const { data, error } = await supabase
        .from('education_grades')
        .select('id, grade_name, grade_order, education_level')
        .order('education_level')
        .order('grade_order')

      if (error) throw error
      set({ educationGrades: data || [] })
    } catch (error) {
      console.error('Error fetching education grades:', error)
    }
  },

  // Fetch general stats
  fetchGeneralStats: async (options) => {
    try {
      const stats = await classService.getGeneralStats(options)
      set({ generalStats: stats })
    } catch (error) {
      console.error('Error fetching general stats:', error)
    }
  },

  // Create class
  createClass: async (data) => {
    set({ loading: true, error: null })
    try {
      const newClass = await classService.createClass(data)
      // Refresh list
      await get().fetchClasses()
      set({ loading: false })
      return newClass
    } catch (error) {
      console.error('Error creating class:', error)
      set({
        error: error instanceof Error ? error.message : 'Erro ao criar turma',
        loading: false
      })
      return null
    }
  },

  // Update class
  updateClass: async (id, data) => {
    set({ loading: true, error: null })
    try {
      await classService.update(id, data)
      // Refresh list
      await get().fetchClasses()
      set({ loading: false })
      return true
    } catch (error) {
      console.error('Error updating class:', error)
      set({
        error: error instanceof Error ? error.message : 'Erro ao atualizar turma',
        loading: false
      })
      return false
    }
  },

  // Delete class (soft delete)
  deleteClass: async (id) => {
    set({ loading: true, error: null })
    try {
      await classService.delete(id)
      // Remove from local state
      set(state => ({
        classes: state.classes.filter(cls => cls.id !== id),
        loading: false
      }))
      return true
    } catch (error) {
      console.error('Error deleting class:', error)
      set({
        error: error instanceof Error ? error.message : 'Erro ao excluir turma',
        loading: false
      })
      return false
    }
  },

  // Enroll student
  enrollStudent: async (studentEnrollmentId, classId) => {
    set({ loading: true, error: null })
    try {
      await classService.enrollStudent(studentEnrollmentId, classId)
      // Refresh selected class if it's the same
      const { selectedClass } = get()
      if (selectedClass?.id === classId) {
        await get().fetchClassById(classId)
      }
      set({ loading: false })
      return true
    } catch (error) {
      console.error('Error enrolling student:', error)
      set({
        error: error instanceof Error ? error.message : 'Erro ao matricular aluno',
        loading: false
      })
      return false
    }
  },

  // Unenroll student
  unenrollStudent: async (classEnrollmentId) => {
    set({ loading: true, error: null })
    try {
      await classService.unenrollStudent(classEnrollmentId)
      set({ loading: false })
      return true
    } catch (error) {
      console.error('Error unenrolling student:', error)
      set({
        error: error instanceof Error ? error.message : 'Erro ao remover aluno',
        loading: false
      })
      return false
    }
  },

  // Assign teacher
  assignTeacher: async (classId, teacherId, subjectId, workloadHours) => {
    set({ loading: true, error: null })
    try {
      await classService.assignTeacher(classId, teacherId, subjectId, workloadHours)
      set({ loading: false })
      return true
    } catch (error) {
      console.error('Error assigning teacher:', error)
      set({
        error: error instanceof Error ? error.message : 'Erro ao alocar professor',
        loading: false
      })
      return false
    }
  },

  // Unassign teacher
  unassignTeacher: async (classId, teacherId, subjectId) => {
    set({ loading: true, error: null })
    try {
      await classService.unassignTeacher(classId, teacherId, subjectId)
      set({ loading: false })
      return true
    } catch (error) {
      console.error('Error unassigning teacher:', error)
      set({
        error: error instanceof Error ? error.message : 'Erro ao remover professor',
        loading: false
      })
      return false
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters })
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: {} })
  },

  // Set selected class
  setSelectedClass: (cls) => {
    set({ selectedClass: cls })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  }
}))

export default useClassStore
