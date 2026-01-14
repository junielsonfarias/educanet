/**
 * ClassFormDialog - Dialog para criar/editar turmas
 *
 * Funcionalidades:
 * - Filtra períodos acadêmicos de acordo com a regra de avaliação do curso
 * - Mostra informações da regra de avaliação vinculada ao curso/série
 */

import { useState, useEffect } from 'react'
import { X, Info, BookOpen, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { classService, academicPeriodService, schoolCourseService, evaluationRulesService } from '@/lib/supabase/services'
import type { EducationGrade, SchoolCourseWithDetails, EvaluationRule } from '@/lib/supabase/services'

interface ClassFormDialogProps {
  schoolId: number
  academicYearId: number
  onClose: () => void
  onCreated: () => void
  editingClass?: {
    id: number
    name: string
    code?: string
    shift: string
    capacity: number
    course_id?: number
    education_grade_id?: number
    academic_period_id?: number
  }
}

interface AcademicPeriod {
  id: number
  name: string
  type: string
  start_date: string
  end_date: string
}

export function ClassFormDialog({
  schoolId,
  academicYearId,
  onClose,
  onCreated,
  editingClass
}: ClassFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Dados do formulário
  const [name, setName] = useState(editingClass?.name || '')
  const [code, setCode] = useState(editingClass?.code || '')
  const [shift, setShift] = useState(editingClass?.shift || 'Manhã')
  const [capacity, setCapacity] = useState(editingClass?.capacity || 35)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(editingClass?.course_id || null)
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(editingClass?.education_grade_id || null)
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(editingClass?.academic_period_id || null)

  // Dados para selects
  const [courses, setCourses] = useState<SchoolCourseWithDetails[]>([])
  const [grades, setGrades] = useState<EducationGrade[]>([])
  const [allPeriods, setAllPeriods] = useState<AcademicPeriod[]>([])
  const [filteredPeriods, setFilteredPeriods] = useState<AcademicPeriod[]>([])

  // Regra de avaliação do curso selecionado
  const [evaluationRule, setEvaluationRule] = useState<EvaluationRule | null>(null)
  const [loadingRule, setLoadingRule] = useState(false)

  const shifts = ['Manhã', 'Tarde', 'Noite', 'Integral']

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [schoolId, academicYearId])

  // Carregar séries e regra de avaliação quando curso mudar
  useEffect(() => {
    if (selectedCourseId) {
      loadGradesForCourse()
      loadEvaluationRule()
    } else {
      setGrades([])
      setSelectedGradeId(null)
      setEvaluationRule(null)
      setFilteredPeriods(allPeriods)
    }
  }, [selectedCourseId])

  // Atualizar regra de avaliação quando série mudar
  useEffect(() => {
    if (selectedCourseId && selectedGradeId) {
      loadEvaluationRule()
    }
  }, [selectedGradeId])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      // Carregar cursos configurados para a escola COM as séries de cada curso
      const coursesData = await schoolCourseService.getCoursesWithGrades(schoolId, academicYearId)
      setCourses(coursesData || [])

      // Carregar todos os períodos acadêmicos do ano
      const periodsData = await academicPeriodService.getByAcademicYear(academicYearId)
      setAllPeriods(periodsData || [])
      setFilteredPeriods(periodsData || [])

      // Selecionar primeiro período se não houver seleção
      if (!selectedPeriodId && periodsData && periodsData.length > 0) {
        setSelectedPeriodId(periodsData[0].id)
      }

      // Se estiver editando, carregar as séries do curso selecionado
      if (editingClass?.course_id && coursesData) {
        const selectedCourse = coursesData.find(c => c.course_id === editingClass.course_id)
        if (selectedCourse?.grades) {
          const courseGrades = selectedCourse.grades
            .map(g => g.education_grade)
            .filter((g): g is EducationGrade => g !== null && g !== undefined)
            .sort((a, b) => a.grade_order - b.grade_order)
          setGrades(courseGrades)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Toast desabilitado - React 19 incompatível
    } finally {
      setLoading(false)
    }
  }

  const loadEvaluationRule = async () => {
    if (!selectedCourseId) return

    setLoadingRule(true)
    try {
      // Buscar regra de avaliação para o curso/série selecionado
      const rule = await evaluationRulesService.getRuleForClass(
        selectedCourseId,
        selectedGradeId || undefined
      )
      setEvaluationRule(rule)

      // Filtrar períodos pelo tipo definido na regra
      if (rule?.academic_period_type) {
        const filtered = allPeriods.filter(
          p => p.type === rule.academic_period_type
        )
        setFilteredPeriods(filtered.length > 0 ? filtered : allPeriods)

        // Se o período selecionado não está mais disponível, selecionar o primeiro
        if (selectedPeriodId && filtered.length > 0) {
          const periodStillValid = filtered.some(p => p.id === selectedPeriodId)
          if (!periodStillValid) {
            setSelectedPeriodId(filtered[0].id)
          }
        } else if (filtered.length > 0 && !selectedPeriodId) {
          setSelectedPeriodId(filtered[0].id)
        }
      } else {
        setFilteredPeriods(allPeriods)
      }
    } catch (error) {
      console.error('Erro ao carregar regra de avaliação:', error)
      setFilteredPeriods(allPeriods)
    } finally {
      setLoadingRule(false)
    }
  }

  const loadGradesForCourse = () => {
    if (!selectedCourseId) return

    // Usar as séries que JÁ ESTÃO CONFIGURADAS para o curso na escola/ano
    // Isso evita mostrar séries que não foram associadas ao curso
    const selectedCourse = courses.find(c => c.course_id === selectedCourseId)
    if (selectedCourse?.grades) {
      const courseGrades = selectedCourse.grades
        .map(g => g.education_grade)
        .filter((g): g is EducationGrade => g !== null && g !== undefined)
        .sort((a, b) => a.grade_order - b.grade_order)
      setGrades(courseGrades)

      // Se a série atual não está nas séries do novo curso, limpar seleção
      if (selectedGradeId && !courseGrades.some(g => g.id === selectedGradeId)) {
        setSelectedGradeId(null)
      }
    } else {
      setGrades([])
      setSelectedGradeId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Informe o nome da turma')
      return
    }

    if (!selectedCourseId) {
      alert('Selecione o curso')
      return
    }

    if (!selectedPeriodId) {
      alert('Selecione o período acadêmico')
      return
    }

    setSaving(true)
    try {
      if (editingClass) {
        // Atualizar turma existente
        await classService.update(editingClass.id, {
          name: name.trim(),
          code: code.trim() || null,
          course_id: selectedCourseId,
          academic_period_id: selectedPeriodId,
          education_grade_id: selectedGradeId || null,
          capacity,
          shift
        })
        alert('Turma atualizada com sucesso!')
      } else {
        // Criar nova turma
        await classService.createClass({
          name: name.trim(),
          code: code.trim() || undefined,
          school_id: schoolId,
          course_id: selectedCourseId,
          academic_period_id: selectedPeriodId,
          education_grade_id: selectedGradeId || undefined,
          capacity,
          shift
        })
        alert('Turma criada com sucesso!')
      }
      onCreated()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar turma:', error)
      alert(editingClass ? 'Erro ao atualizar turma' : 'Erro ao criar turma')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative z-50 w-full max-w-lg bg-background rounded-lg shadow-lg border p-6 mx-4">
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-lg border p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {editingClass ? 'Editar Turma' : 'Nova Turma'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Preencha os dados da turma
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome e Sigla em linha */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nome da Turma *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: 5º Ano A, Turma 101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Sigla</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: 5A"
                maxLength={10}
              />
            </div>
          </div>

          {/* Curso */}
          <div className="space-y-2">
            <Label htmlFor="course">Curso/Etapa de Ensino *</Label>
            <select
              id="course"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedCourseId?.toString() || ''}
              onChange={(e) => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
              required
            >
              <option value="">Selecione o curso</option>
              {courses.map((course) => (
                <option key={course.id} value={course.course_id.toString()}>
                  {course.course?.name} ({course.course?.education_level})
                </option>
              ))}
            </select>
            {courses.length === 0 && (
              <p className="text-xs text-orange-500">
                Nenhum curso configurado para este ano letivo. Configure os cursos na aba "Ano Letivo e Cursos".
              </p>
            )}
          </div>

          {/* Série/Ano */}
          <div className="space-y-2" key={`grade-container-${selectedCourseId || 'none'}`}>
            <Label htmlFor="grade">Série/Ano</Label>
            <select
              id="grade"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedGradeId?.toString() || ''}
              onChange={(e) => setSelectedGradeId(e.target.value ? parseInt(e.target.value) : null)}
              disabled={!selectedCourseId}
            >
              <option value="">Selecione a série (opcional)</option>
              {grades
                .filter((grade) => grade && grade.id)
                .sort((a, b) => a.grade_order - b.grade_order)
                .map((grade) => (
                  <option key={`grade-${grade.id}`} value={grade.id.toString()}>
                    {grade.grade_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Período acadêmico */}
          <div className="space-y-2">
            <Label htmlFor="period">Período Acadêmico *</Label>
            <select
              id="period"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedPeriodId?.toString() || ''}
              onChange={(e) => setSelectedPeriodId(e.target.value ? parseInt(e.target.value) : null)}
              required
            >
              <option value="">Selecione o período</option>
              {filteredPeriods.map((period) => (
                <option key={period.id} value={period.id.toString()}>
                  {period.name} ({period.type})
                </option>
              ))}
            </select>
            {filteredPeriods.length === 0 && (
              <p className="text-xs text-orange-500">
                Nenhum período acadêmico configurado para este ano letivo.
              </p>
            )}
            {evaluationRule && filteredPeriods.length < allPeriods.length && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Períodos filtrados pelo tipo: {evaluationRule.academic_period_type}
              </p>
            )}
          </div>

          {/* Card de Regra de Avaliação */}
          {evaluationRule && (
            <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-blue-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                <Calculator className="h-4 w-4" />
                Regra de Avaliação: {evaluationRule.name}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    Nota Mín: {evaluationRule.min_approval_grade}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    Freq. Mín: {evaluationRule.min_attendance_percent}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    Período: {evaluationRule.academic_period_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">
                    {evaluationRule.periods_per_year}x ao ano
                  </Badge>
                </div>
              </div>
              {evaluationRule.allow_recovery && (
                <p className="text-xs text-green-700 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Recuperação permitida
                </p>
              )}
            </div>
          )}
          {loadingRule && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Carregando regras de avaliação...
            </div>
          )}

          {/* Turno e Capacidade em linha */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift">Turno *</Label>
              <select
                id="shift"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                required
              >
                {shifts.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade *</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={100}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 35)}
                required
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || loadingRule}>
              {(saving || loadingRule) && (
                <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {editingClass ? 'Salvar' : 'Criar Turma'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
