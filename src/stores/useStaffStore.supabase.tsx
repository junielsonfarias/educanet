/**
 * Staff Store - Zustand + Supabase
 * 
 * Store para gerenciar Funcionários integrado com Supabase
 * 
 * Features:
 * - CRUD completo de funcionários
 * - Validação de matrícula funcional
 * - Consultas por escola, departamento, cargo
 * - Busca e filtros
 */

import { create } from "zustand"
import { staffService, type StaffFullInfo } from "@/lib/supabase/services"
import { Database } from "@/lib/supabase/database.types"
import { toast } from "sonner"

type StaffRow = Database["public"]["Tables"]["staff"]["Row"]
type StaffInsert = Database["public"]["Tables"]["staff"]["Insert"]
type StaffUpdate = Database["public"]["Tables"]["staff"]["Update"]

interface StaffState {
  // State
  staff: StaffFullInfo[]
  selectedStaff: StaffFullInfo | null
  loading: boolean
  error: string | null

  // Actions - CRUD
  fetchStaff: () => Promise<void>
  fetchStaffBySchool: (schoolId: number) => Promise<void>
  fetchStaffByDepartment: (departmentId: number) => Promise<void>
  fetchStaffByPosition: (positionId: number) => Promise<void>
  fetchStaffFullInfo: (id: number) => Promise<void>
  searchStaff: (searchTerm: string) => Promise<void>
  createStaff: (
    personData: Database["public"]["Tables"]["people"]["Insert"],
    staffData: Omit<StaffInsert, "person_id">
  ) => Promise<StaffRow | null>
  updateStaff: (
    id: number,
    personData: Database["public"]["Tables"]["people"]["Update"],
    staffData: StaffUpdate
  ) => Promise<StaffRow | null>
  deleteStaff: (id: number) => Promise<boolean>

  // Actions - Utils
  checkFunctionalRegistrationExists: (
    functionalRegistration: string,
    excludeId?: number
  ) => Promise<boolean>
  countByDepartment: (departmentId: number) => Promise<number>
  countBySchool: (schoolId: number) => Promise<number>
  setSelectedStaff: (staff: StaffFullInfo | null) => void
  clearError: () => void
}

export const useStaffStore = create<StaffState>((set, get) => ({
  // Initial State
  staff: [],
  selectedStaff: null,
  loading: false,
  error: null,

  // Fetch all staff
  fetchStaff: async () => {
    set({ loading: true, error: null })
    try {
      const staff = await staffService.getAllWithFullInfo()
      set({ staff, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar funcionários"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch staff by school
  fetchStaffBySchool: async (schoolId: number) => {
    set({ loading: true, error: null })
    try {
      const staff = await staffService.getBySchool(schoolId)
      set({ staff, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar funcionários da escola"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch staff by department
  fetchStaffByDepartment: async (departmentId: number) => {
    set({ loading: true, error: null })
    try {
      const staff = await staffService.getByDepartment(departmentId)
      set({ staff, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar funcionários do departamento"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch staff by position
  fetchStaffByPosition: async (positionId: number) => {
    set({ loading: true, error: null })
    try {
      const staff = await staffService.getByPosition(positionId)
      set({ staff, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar funcionários do cargo"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Fetch specific staff member with full info
  fetchStaffFullInfo: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const staff = await staffService.getStaffFullInfo(id)
      set({ selectedStaff: staff, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao buscar funcionário"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Search staff
  searchStaff: async (searchTerm: string) => {
    set({ loading: true, error: null })
    try {
      const staff = await staffService.searchStaff(searchTerm)
      set({ staff, loading: false })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao buscar funcionários"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  // Create staff (person + staff record)
  createStaff: async (
    personData: Database["public"]["Tables"]["people"]["Insert"],
    staffData: Omit<StaffInsert, "person_id">
  ) => {
    set({ loading: true, error: null })
    try {
      // Primeiro cria a pessoa
      const { data: person, error: personError } = await import("@/lib/supabase/client")
        .then((m) => m.supabase)
        .then((supabase) =>
          supabase.from("people").insert(personData).select().single()
        )

      if (personError) throw personError
      if (!person) throw new Error("Erro ao criar pessoa")

      // Depois cria o staff vinculado à pessoa
      const newStaff = await staffService.createWithValidation({
        ...staffData,
        person_id: person.id,
      })

      if (!newStaff) {
        const errorMessage =
          "Erro ao criar funcionário. A matrícula funcional pode já existir."
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return null
      }

      // Busca o staff completo
      const staffFullInfo = await staffService.getStaffFullInfo(newStaff.id)

      // Atualiza lista
      set((state) => ({
        staff: staffFullInfo ? [staffFullInfo, ...state.staff] : state.staff,
        loading: false,
      }))

      toast.success("Funcionário criado com sucesso!")
      return newStaff
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar funcionário"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return null
    }
  },

  // Update staff (person + staff record)
  updateStaff: async (
    id: number,
    personData: Database["public"]["Tables"]["people"]["Update"],
    staffData: StaffUpdate
  ) => {
    set({ loading: true, error: null })
    try {
      // Busca o staff para pegar o person_id
      const currentStaff = await staffService.getById(id)
      if (!currentStaff) throw new Error("Funcionário não encontrado")

      // Atualiza a pessoa
      if (Object.keys(personData).length > 0) {
        const { error: personError } = await import("@/lib/supabase/client")
          .then((m) => m.supabase)
          .then((supabase) =>
            supabase
              .from("people")
              .update(personData)
              .eq("id", currentStaff.person_id)
          )

        if (personError) throw personError
      }

      // Atualiza o staff
      const updatedStaff = await staffService.updateWithValidation(id, staffData)

      if (!updatedStaff) {
        const errorMessage =
          "Erro ao atualizar funcionário. A matrícula funcional pode já existir."
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return null
      }

      // Busca o staff completo
      const staffFullInfo = await staffService.getStaffFullInfo(id)

      // Atualiza listas
      set((state) => ({
        staff: state.staff.map((s) =>
          s.id === id && staffFullInfo ? staffFullInfo : s
        ),
        selectedStaff:
          state.selectedStaff?.id === id && staffFullInfo
            ? staffFullInfo
            : state.selectedStaff,
        loading: false,
      }))

      toast.success("Funcionário atualizado com sucesso!")
      return updatedStaff
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao atualizar funcionário"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return null
    }
  },

  // Delete staff (soft delete)
  deleteStaff: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const success = await staffService.softDelete(id)

      if (!success) {
        const errorMessage = "Erro ao excluir funcionário"
        set({ error: errorMessage, loading: false })
        toast.error(errorMessage)
        return false
      }

      // Remove das listas
      set((state) => ({
        staff: state.staff.filter((s) => s.id !== id),
        selectedStaff: state.selectedStaff?.id === id ? null : state.selectedStaff,
        loading: false,
      }))

      toast.success("Funcionário excluído com sucesso!")
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir funcionário"
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
      return false
    }
  },

  // Check if functional registration exists
  checkFunctionalRegistrationExists: async (
    functionalRegistration: string,
    excludeId?: number
  ) => {
    try {
      return await staffService.checkFunctionalRegistrationExists(
        functionalRegistration,
        excludeId
      )
    } catch (error) {
      console.error("Erro ao verificar matrícula funcional:", error)
      return false
    }
  },

  // Count by department
  countByDepartment: async (departmentId: number) => {
    try {
      return await staffService.countByDepartment(departmentId)
    } catch (error) {
      console.error("Erro ao contar funcionários:", error)
      return 0
    }
  },

  // Count by school
  countBySchool: async (schoolId: number) => {
    try {
      return await staffService.countBySchool(schoolId)
    } catch (error) {
      console.error("Erro ao contar funcionários:", error)
      return 0
    }
  },

  // Set selected staff
  setSelectedStaff: (staff: StaffFullInfo | null) => {
    set({ selectedStaff: staff })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))

