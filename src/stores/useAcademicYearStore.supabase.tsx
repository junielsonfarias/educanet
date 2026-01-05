/**
 * Academic Year Store - Zustand + Supabase
 * 
 * Store para gerenciar Anos Letivos integrado com Supabase
 * 
 * Features:
 * - CRUD completo de anos letivos
 * - Cache de ano letivo atual
 * - Validação de sobreposição de datas
 * - Estatísticas e relacionamentos
 */

import { create } from "zustand"
import { academicYearService, type AcademicYearWithPeriods } from "@/lib/supabase/services"
import { Database } from "@/lib/supabase/database.types"
import { toast } from "sonner"

type AcademicYearRow = Database["public"]["Tables"]["academic_years"]["Row"]
type AcademicYearInsert = Database["public"]["Tables"]["academic_years"]["Insert"]
type AcademicYearUpdate = Database["public"]["Tables"]["academic_years"]["Update"]

interface AcademicYearStats {
  totalEnrollments: number
  activeEnrollments: number
  totalClasses: number
  totalPeriods: number
}

interface AcademicYearState {
  // State
  academicYears: AcademicYearRow[]
  academicYearsWithPeriods: AcademicYearWithPeriods[]
  currentAcademicYear: AcademicYearRow | null
  selectedAcademicYear: AcademicYearWithPeriods | null
  stats: Record<number, AcademicYearStats>
  loading: boolean
  error: string | null

  // Actions - CRUD
  fetchAcademicYears: () => Promise<void>
  fetchAcademicYearsWithPeriods: () => Promise<void>
  fetchCurrentAcademicYear: () => Promise<void>
  fetchAcademicYearWithPeriods: (id: number) => Promise<void>
  createAcademicYear: (data: AcademicYearInsert) => Promise<AcademicYearRow | null>
  updateAcademicYear: (id: number, data: AcademicYearUpdate) => Promise<AcademicYearRow | null>
  deleteAcademicYear: (id: number) => Promise<boolean>

  // Actions - Stats & Utils
  fetchAcademicYearStats: (id: number) => Promise<void>
  checkDateOverlap: (startDate: string, endDate: string, excludeId?: number) => Promise<boolean>
  setSelectedAcademicYear: (year: AcademicYearWithPeriods | null) => void
  clearError: () => void
}

export const useAcademicYearStore = create<AcademicYearState>((set, get) => ({
  // Initial State
  academicYears: [],
  academicYearsWithPeriods: [],
  currentAcademicYear: null,
  selectedAcademicYear: null,
  stats: {},
  loading: false,
  error: null,

  // Fetch all academic years
  fetchAcademicYears: async () => {
    set({ loading: true, error: null })
    try {
      const years = await academicYearService.getAll()
      set({ academicYears: years, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar anos letivos"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch all academic years with periods
  fetchAcademicYearsWithPeriods: async () => {
    set({ loading: true, error: null })
    try {
      const years = await academicYearService.getAllWithPeriods()
      set({ academicYearsWithPeriods: years, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar anos letivos com períodos"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch current academic year
  fetchCurrentAcademicYear: async () => {
    set({ loading: true, error: null })
    try {
      const currentYear = await academicYearService.getCurrentAcademicYear()
      set({ currentAcademicYear: currentYear, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar ano letivo atual"
      set({ error: errorMessage, loading: false })
      // Não mostra toast aqui pois pode ser normal não ter ano letivo ativo
    }
  },

  // Fetch specific academic year with periods
  fetchAcademicYearWithPeriods: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const year = await academicYearService.getWithPeriods(id)
      set({ selectedAcademicYear: year, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar ano letivo"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Create academic year
  createAcademicYear: async (data: AcademicYearInsert) => {
    set({ loading: true, error: null })
    try {
      const newYear = await academicYearService.createWithValidation(data)

      if (!newYear) {
        const errorMessage = "Erro ao criar ano letivo. Verifique se há sobreposição de datas."
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return null
      }

      // Atualiza listas
      set((state) => ({
        academicYears: [newYear, ...state.academicYears],
        loading: false,
      }))

      toast.success("Ano letivo criado com sucesso!")
      return newYear
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar ano letivo"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return null
    }
  },

  // Update academic year
  updateAcademicYear: async (id: number, data: AcademicYearUpdate) => {
    set({ loading: true, error: null })
    try {
      const updatedYear = await academicYearService.updateWithValidation(id, data)

      if (!updatedYear) {
        const errorMessage =
          "Erro ao atualizar ano letivo. Verifique se há sobreposição de datas."
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return null
      }

      // Atualiza listas
      set((state) => ({
        academicYears: state.academicYears.map((y) => (y.id === id ? updatedYear : y)),
        academicYearsWithPeriods: state.academicYearsWithPeriods.map((y) =>
          y.id === id ? { ...y, ...updatedYear } : y
        ),
        selectedAcademicYear:
          state.selectedAcademicYear?.id === id
            ? { ...state.selectedAcademicYear, ...updatedYear }
            : state.selectedAcademicYear,
        currentAcademicYear:
          state.currentAcademicYear?.id === id ? updatedYear : state.currentAcademicYear,
        loading: false,
      }))

      toast.success("Ano letivo atualizado com sucesso!")
      return updatedYear
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao atualizar ano letivo"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return null
    }
  },

  // Delete academic year (soft delete)
  deleteAcademicYear: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const success = await academicYearService.softDelete(id)

      if (!success) {
        const errorMessage = "Erro ao excluir ano letivo"
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return false
      }

      // Remove das listas
      set((state) => ({
        academicYears: state.academicYears.filter((y) => y.id !== id),
        academicYearsWithPeriods: state.academicYearsWithPeriods.filter((y) => y.id !== id),
        selectedAcademicYear:
          state.selectedAcademicYear?.id === id ? null : state.selectedAcademicYear,
        currentAcademicYear:
          state.currentAcademicYear?.id === id ? null : state.currentAcademicYear,
        loading: false,
      }))

      toast.success("Ano letivo excluído com sucesso!")
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir ano letivo"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return false
    }
  },

  // Fetch academic year stats
  fetchAcademicYearStats: async (id: number) => {
    try {
      const stats = await academicYearService.getAcademicYearStats(id)
      set((state) => ({
        stats: { ...state.stats, [id]: stats },
      }))
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    }
  },

  // Check date overlap
  checkDateOverlap: async (startDate: string, endDate: string, excludeId?: number) => {
    try {
      return await academicYearService.checkDateOverlap(startDate, endDate, excludeId)
    } catch (error) {
      console.error("Erro ao verificar sobreposição:", error)
      return false
    }
  },

  // Set selected academic year
  setSelectedAcademicYear: (year: AcademicYearWithPeriods | null) => {
    set({ selectedAcademicYear: year })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))

