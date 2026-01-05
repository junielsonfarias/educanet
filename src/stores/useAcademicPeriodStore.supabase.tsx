/**
 * Academic Period Store - Zustand + Supabase
 * 
 * Store para gerenciar Períodos Letivos integrado com Supabase
 * 
 * Features:
 * - CRUD completo de períodos letivos
 * - Cache de período letivo atual
 * - Validação de sobreposição de datas
 * - Estatísticas e relacionamentos
 */

import { create } from "zustand"
import { academicPeriodService, type AcademicPeriodWithYear } from "@/lib/supabase/services"
import { Database } from "@/lib/supabase/database.types"
import { toast } from "sonner"

type AcademicPeriodRow = Database["public"]["Tables"]["academic_periods"]["Row"]
type AcademicPeriodInsert = Database["public"]["Tables"]["academic_periods"]["Insert"]
type AcademicPeriodUpdate = Database["public"]["Tables"]["academic_periods"]["Update"]
type AcademicPeriodType = Database["public"]["Enums"]["academic_period_type"]

interface AcademicPeriodStats {
  totalClasses: number
  totalStudents: number
  totalLessons: number
  totalEvaluations: number
}

interface AcademicPeriodState {
  // State
  academicPeriods: AcademicPeriodRow[]
  academicPeriodsWithYear: AcademicPeriodWithYear[]
  currentAcademicPeriod: AcademicPeriodRow | null
  selectedAcademicPeriod: AcademicPeriodWithYear | null
  stats: Record<number, AcademicPeriodStats>
  loading: boolean
  error: string | null

  // Actions - CRUD
  fetchAcademicPeriods: () => Promise<void>
  fetchAcademicPeriodsWithYear: () => Promise<void>
  fetchAcademicPeriodsByYear: (academicYearId: number) => Promise<void>
  fetchCurrentAcademicPeriod: () => Promise<void>
  fetchAcademicPeriodWithYear: (id: number) => Promise<void>
  createAcademicPeriod: (data: AcademicPeriodInsert) => Promise<AcademicPeriodRow | null>
  updateAcademicPeriod: (
    id: number,
    data: AcademicPeriodUpdate
  ) => Promise<AcademicPeriodRow | null>
  deleteAcademicPeriod: (id: number) => Promise<boolean>

  // Actions - Stats & Utils
  fetchAcademicPeriodStats: (id: number) => Promise<void>
  checkDateOverlap: (
    academicYearId: number,
    startDate: string,
    endDate: string,
    excludeId?: number
  ) => Promise<boolean>
  setSelectedAcademicPeriod: (period: AcademicPeriodWithYear | null) => void
  clearError: () => void
}

export const useAcademicPeriodStore = create<AcademicPeriodState>((set, get) => ({
  // Initial State
  academicPeriods: [],
  academicPeriodsWithYear: [],
  currentAcademicPeriod: null,
  selectedAcademicPeriod: null,
  stats: {},
  loading: false,
  error: null,

  // Fetch all academic periods
  fetchAcademicPeriods: async () => {
    set({ loading: true, error: null })
    try {
      const periods = await academicPeriodService.getAll()
      set({ academicPeriods: periods, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar períodos letivos"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch all academic periods with year info
  fetchAcademicPeriodsWithYear: async () => {
    set({ loading: true, error: null })
    try {
      const periods = await academicPeriodService.getAllWithYear()
      set({ academicPeriodsWithYear: periods, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar períodos letivos com ano"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch periods by academic year
  fetchAcademicPeriodsByYear: async (academicYearId: number) => {
    set({ loading: true, error: null })
    try {
      const periods = await academicPeriodService.getByAcademicYear(academicYearId)
      set({ academicPeriods: periods, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar períodos do ano letivo"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch current academic period
  fetchCurrentAcademicPeriod: async () => {
    set({ loading: true, error: null })
    try {
      const currentPeriod = await academicPeriodService.getCurrentAcademicPeriod()
      set({ currentAcademicPeriod: currentPeriod, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar período letivo atual"
      set({ error: errorMessage, loading: false })
      // Não mostra toast aqui pois pode ser normal não ter período ativo
    }
  },

  // Fetch specific academic period with year info
  fetchAcademicPeriodWithYear: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const period = await academicPeriodService.getWithYear(id)
      set({ selectedAcademicPeriod: period, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar período letivo"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Create academic period
  createAcademicPeriod: async (data: AcademicPeriodInsert) => {
    set({ loading: true, error: null })
    try {
      const newPeriod = await academicPeriodService.createWithValidation(data)

      if (!newPeriod) {
        const errorMessage =
          "Erro ao criar período letivo. Verifique se há sobreposição de datas no mesmo ano."
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return null
      }

      // Atualiza listas
      set((state) => ({
        academicPeriods: [newPeriod, ...state.academicPeriods],
        loading: false,
      }))

      toast.success("Período letivo criado com sucesso!")
      return newPeriod
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao criar período letivo"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return null
    }
  },

  // Update academic period
  updateAcademicPeriod: async (id: number, data: AcademicPeriodUpdate) => {
    set({ loading: true, error: null })
    try {
      const updatedPeriod = await academicPeriodService.updateWithValidation(id, data)

      if (!updatedPeriod) {
        const errorMessage =
          "Erro ao atualizar período letivo. Verifique se há sobreposição de datas."
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return null
      }

      // Atualiza listas
      set((state) => ({
        academicPeriods: state.academicPeriods.map((p) => (p.id === id ? updatedPeriod : p)),
        academicPeriodsWithYear: state.academicPeriodsWithYear.map((p) =>
          p.id === id ? { ...p, ...updatedPeriod } : p
        ),
        selectedAcademicPeriod:
          state.selectedAcademicPeriod?.id === id
            ? { ...state.selectedAcademicPeriod, ...updatedPeriod }
            : state.selectedAcademicPeriod,
        currentAcademicPeriod:
          state.currentAcademicPeriod?.id === id ? updatedPeriod : state.currentAcademicPeriod,
        loading: false,
      }))

      toast.success("Período letivo atualizado com sucesso!")
      return updatedPeriod
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao atualizar período letivo"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return null
    }
  },

  // Delete academic period (soft delete)
  deleteAcademicPeriod: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const success = await academicPeriodService.softDelete(id)

      if (!success) {
        const errorMessage = "Erro ao excluir período letivo"
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return false
      }

      // Remove das listas
      set((state) => ({
        academicPeriods: state.academicPeriods.filter((p) => p.id !== id),
        academicPeriodsWithYear: state.academicPeriodsWithYear.filter((p) => p.id !== id),
        selectedAcademicPeriod:
          state.selectedAcademicPeriod?.id === id ? null : state.selectedAcademicPeriod,
        currentAcademicPeriod:
          state.currentAcademicPeriod?.id === id ? null : state.currentAcademicPeriod,
        loading: false,
      }))

      toast.success("Período letivo excluído com sucesso!")
      return true
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao excluir período letivo"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return false
    }
  },

  // Fetch academic period stats
  fetchAcademicPeriodStats: async (id: number) => {
    try {
      const stats = await academicPeriodService.getPeriodStats(id)
      set((state) => ({
        stats: { ...state.stats, [id]: stats },
      }))
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    }
  },

  // Check date overlap
  checkDateOverlap: async (
    academicYearId: number,
    startDate: string,
    endDate: string,
    excludeId?: number
  ) => {
    try {
      return await academicPeriodService.checkDateOverlap(
        academicYearId,
        startDate,
        endDate,
        excludeId
      )
    } catch (error) {
      console.error("Erro ao verificar sobreposição:", error)
      return false
    }
  },

  // Set selected academic period
  setSelectedAcademicPeriod: (period: AcademicPeriodWithYear | null) => {
    set({ selectedAcademicPeriod: period })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))

