/**
 * assessment-type-service.ts
 *
 * Service para gerenciamento de tipos de avaliação
 * Gerencia CRUD de tipos como Prova Bimestral, Recuperação, SISAM, etc.
 */

import { supabase } from '../client'

// =====================================================
// TIPOS
// =====================================================

export interface AssessmentType {
  id: number
  name: string
  description?: string
  code?: string
  weight: number
  max_score: number
  passing_score: number
  exclude_from_average: boolean
  is_recovery: boolean
  replaces_lowest: boolean
  is_mandatory: boolean
  applicable_period_type: string
  applicable_grade_ids: number[]
  school_id?: number
  course_id?: number
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  deleted_at?: string
}

export interface AssessmentTypeCreateData {
  name: string
  description?: string
  code?: string
  weight?: number
  max_score?: number
  passing_score?: number
  exclude_from_average?: boolean
  is_recovery?: boolean
  replaces_lowest?: boolean
  is_mandatory?: boolean
  applicable_period_type?: string
  applicable_grade_ids?: number[]
  school_id?: number
  course_id?: number
  display_order?: number
}

export interface AssessmentTypeUpdateData extends Partial<AssessmentTypeCreateData> {
  is_active?: boolean
}

// =====================================================
// SERVICE
// =====================================================

class AssessmentTypeService {
  private table = 'assessment_types'

  /**
   * Busca todos os tipos de avaliação ativos
   */
  async getAll(options?: {
    schoolId?: number
    courseId?: number
    includeInactive?: boolean
  }): Promise<AssessmentType[]> {
    let query = supabase
      .from(this.table)
      .select('*')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (!options?.includeInactive) {
      query = query.eq('is_active', true)
    }

    if (options?.schoolId) {
      query = query.or(`school_id.eq.${options.schoolId},school_id.is.null`)
    }

    if (options?.courseId) {
      query = query.or(`course_id.eq.${options.courseId},course_id.is.null`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar tipos de avaliação:', error)
      throw error
    }

    return data || []
  }

  /**
   * Busca tipo de avaliação por ID
   */
  async getById(id: number): Promise<AssessmentType | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Erro ao buscar tipo de avaliação:', error)
      throw error
    }

    return data
  }

  /**
   * Busca tipos de avaliação por série/ano
   */
  async getByGrade(gradeId: number): Promise<AssessmentType[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .contains('applicable_grade_ids', [gradeId])
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar tipos por série:', error)
      throw error
    }

    return data || []
  }

  /**
   * Busca tipos de avaliação de recuperação
   */
  async getRecoveryTypes(options?: {
    schoolId?: number
    courseId?: number
  }): Promise<AssessmentType[]> {
    let query = supabase
      .from(this.table)
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .eq('is_recovery', true)
      .order('display_order', { ascending: true })

    if (options?.schoolId) {
      query = query.or(`school_id.eq.${options.schoolId},school_id.is.null`)
    }

    if (options?.courseId) {
      query = query.or(`course_id.eq.${options.courseId},course_id.is.null`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar tipos de recuperação:', error)
      throw error
    }

    return data || []
  }

  /**
   * Cria novo tipo de avaliação
   */
  async create(data: AssessmentTypeCreateData): Promise<AssessmentType> {
    const { data: userData } = await supabase.auth.getUser()

    const { data: created, error } = await supabase
      .from(this.table)
      .insert({
        ...data,
        created_by: userData.user?.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar tipo de avaliação:', error)
      throw error
    }

    return created
  }

  /**
   * Atualiza tipo de avaliação
   */
  async update(id: number, data: AssessmentTypeUpdateData): Promise<AssessmentType> {
    const { data: updated, error } = await supabase
      .from(this.table)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar tipo de avaliação:', error)
      throw error
    }

    return updated
  }

  /**
   * Exclui tipo de avaliação (soft delete)
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir tipo de avaliação:', error)
      throw error
    }
  }

  /**
   * Ativa/Desativa tipo de avaliação
   */
  async toggleActive(id: number, isActive: boolean): Promise<AssessmentType> {
    return this.update(id, { is_active: isActive })
  }

  /**
   * Reordena tipos de avaliação
   */
  async reorder(items: { id: number; order: number }[]): Promise<void> {
    const updates = items.map(item =>
      supabase
        .from(this.table)
        .update({ display_order: item.order })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)

    const error = results.find(r => r.error)?.error
    if (error) {
      console.error('Erro ao reordenar tipos de avaliação:', error)
      throw error
    }
  }

  /**
   * Duplica um tipo de avaliação
   */
  async duplicate(id: number, newName: string): Promise<AssessmentType> {
    const original = await this.getById(id)
    if (!original) {
      throw new Error('Tipo de avaliação não encontrado')
    }

    const { id: _, created_at, updated_at, deleted_at, ...data } = original

    return this.create({
      ...data,
      name: newName,
      code: data.code ? `${data.code}_COPY` : undefined
    })
  }
}

export const assessmentTypeService = new AssessmentTypeService()
export default assessmentTypeService
