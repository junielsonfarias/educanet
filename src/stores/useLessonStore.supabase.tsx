/**
 * Lesson Store - Zustand + Supabase
 * 
 * Store para gerenciar Aulas integrado com Supabase
 * 
 * Features:
 * - CRUD completo de aulas
 * - Validação de conflitos de horário
 * - Consultas por turma, professor, data
 * - Estatísticas de frequência
 */

import { create } from "zustand"
import { lessonService, type LessonWithDetails } from "@/lib/supabase/services"
import { Database } from "@/lib/supabase/database.types"
import { toast } from "sonner"

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"]
type LessonInsert = Database["public"]["Tables"]["lessons"]["Insert"]
type LessonUpdate = Database["public"]["Tables"]["lessons"]["Update"]

interface LessonStats {
  totalStudents: number
  presentStudents: number
  absentStudents: number
  justifiedAbsences: number
  attendanceRate: number
}

interface LessonState {
  // State
  lessons: LessonRow[]
  lessonsWithDetails: LessonWithDetails[]
  todayLessons: LessonWithDetails[]
  selectedLesson: LessonWithDetails | null
  stats: Record<number, LessonStats>
  loading: boolean
  error: string | null

  // Actions - CRUD
  fetchLessons: () => Promise<void>
  fetchLessonsByClass: (classId: number) => Promise<void>
  fetchLessonsByTeacher: (teacherId: number) => Promise<void>
  fetchLessonsByDateRange: (startDate: string, endDate: string) => Promise<void>
  fetchTodayLessons: () => Promise<void>
  fetchLessonWithDetails: (id: number) => Promise<void>
  createLesson: (data: LessonInsert) => Promise<LessonRow | null>
  updateLesson: (id: number, data: LessonUpdate) => Promise<LessonRow | null>
  deleteLesson: (id: number) => Promise<boolean>

  // Actions - Stats & Utils
  fetchLessonStats: (id: number) => Promise<void>
  checkTeacherScheduleConflict: (
    teacherId: number,
    lessonDate: string,
    startTime: string,
    endTime: string,
    excludeLessonId?: number
  ) => Promise<boolean>
  checkAllAttendancesRecorded: (lessonId: number) => Promise<boolean>
  setSelectedLesson: (lesson: LessonWithDetails | null) => void
  clearError: () => void
}

export const useLessonStore = create<LessonState>((set, get) => ({
  // Initial State
  lessons: [],
  lessonsWithDetails: [],
  todayLessons: [],
  selectedLesson: null,
  stats: {},
  loading: false,
  error: null,

  // Fetch all lessons
  fetchLessons: async () => {
    set({ loading: true, error: null })
    try {
      const lessons = await lessonService.getAll()
      set({ lessons, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar aulas"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch lessons by class
  fetchLessonsByClass: async (classId: number) => {
    set({ loading: true, error: null })
    try {
      const lessons = await lessonService.getByClass(classId)
      set({ lessonsWithDetails: lessons, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar aulas da turma"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch lessons by teacher
  fetchLessonsByTeacher: async (teacherId: number) => {
    set({ loading: true, error: null })
    try {
      const lessons = await lessonService.getByTeacher(teacherId)
      set({ lessonsWithDetails: lessons, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar aulas do professor"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch lessons by date range
  fetchLessonsByDateRange: async (startDate: string, endDate: string) => {
    set({ loading: true, error: null })
    try {
      const lessons = await lessonService.getByDateRange(startDate, endDate)
      set({ lessons, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar aulas do período"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch today's lessons
  fetchTodayLessons: async () => {
    set({ loading: true, error: null })
    try {
      const lessons = await lessonService.getTodayLessons()
      set({ todayLessons: lessons, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar aulas de hoje"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch specific lesson with details
  fetchLessonWithDetails: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const lesson = await lessonService.getWithDetails(id)
      set({ selectedLesson: lesson, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar aula"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Create lesson
  createLesson: async (data: LessonInsert) => {
    set({ loading: true, error: null })
    try {
      const newLesson = await lessonService.createWithValidation(data)

      if (!newLesson) {
        const errorMessage =
          "Erro ao criar aula. Verifique se há conflito de horário com outra aula do professor."
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return null
      }

      // Atualiza lista
      set((state) => ({
        lessons: [newLesson, ...state.lessons],
        loading: false,
      }))

      toast.success("Aula criada com sucesso!")
      return newLesson
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar aula"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return null
    }
  },

  // Update lesson
  updateLesson: async (id: number, data: LessonUpdate) => {
    set({ loading: true, error: null })
    try {
      const updatedLesson = await lessonService.update(id, data)

      if (!updatedLesson) {
        const errorMessage = "Erro ao atualizar aula"
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return null
      }

      // Atualiza listas
      set((state) => ({
        lessons: state.lessons.map((l) => (l.id === id ? updatedLesson : l)),
        lessonsWithDetails: state.lessonsWithDetails.map((l) =>
          l.id === id ? { ...l, ...updatedLesson } : l
        ),
        todayLessons: state.todayLessons.map((l) =>
          l.id === id ? { ...l, ...updatedLesson } : l
        ),
        selectedLesson:
          state.selectedLesson?.id === id
            ? { ...state.selectedLesson, ...updatedLesson }
            : state.selectedLesson,
        loading: false,
      }))

      toast.success("Aula atualizada com sucesso!")
      return updatedLesson
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar aula"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return null
    }
  },

  // Delete lesson (soft delete)
  deleteLesson: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const success = await lessonService.softDelete(id)

      if (!success) {
        const errorMessage = "Erro ao excluir aula"
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return false
      }

      // Remove das listas
      set((state) => ({
        lessons: state.lessons.filter((l) => l.id !== id),
        lessonsWithDetails: state.lessonsWithDetails.filter((l) => l.id !== id),
        todayLessons: state.todayLessons.filter((l) => l.id !== id),
        selectedLesson: state.selectedLesson?.id === id ? null : state.selectedLesson,
        loading: false,
      }))

      toast.success("Aula excluída com sucesso!")
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir aula"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return false
    }
  },

  // Fetch lesson stats
  fetchLessonStats: async (id: number) => {
    try {
      const stats = await lessonService.getLessonStats(id)
      set((state) => ({
        stats: { ...state.stats, [id]: stats },
      }))
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    }
  },

  // Check teacher schedule conflict
  checkTeacherScheduleConflict: async (
    teacherId: number,
    lessonDate: string,
    startTime: string,
    endTime: string,
    excludeLessonId?: number
  ) => {
    try {
      return await lessonService.checkTeacherScheduleConflict(
        teacherId,
        lessonDate,
        startTime,
        endTime,
        excludeLessonId
      )
    } catch (error) {
      console.error("Erro ao verificar conflito de horário:", error)
      return false
    }
  },

  // Check if all attendances recorded
  checkAllAttendancesRecorded: async (lessonId: number) => {
    try {
      return await lessonService.checkAllAttendancesRecorded(lessonId)
    } catch (error) {
      console.error("Erro ao verificar completude das frequências:", error)
      return false
    }
  },

  // Set selected lesson
  setSelectedLesson: (lesson: LessonWithDetails | null) => {
    set({ selectedLesson: lesson })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))

