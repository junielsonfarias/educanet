/**
 * ClassFormDialogUnified - Dialog unificado para criar/editar turmas
 *
 * Combina funcionalidades de:
 * - ClassFormDialog (integração com regras de avaliação, filtro de períodos)
 * - ClassroomDialog (campos do Censo Escolar: Modalidade, Tipo Regime, Multissérie)
 *
 * Pode ser usado tanto dentro da aba escola quanto no menu admin de turmas.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState, useEffect, useMemo } from 'react'
import { Info, BookOpen, Calculator, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { classService, academicPeriodService, schoolCourseService, evaluationRulesService } from '@/lib/supabase/services'
import type { EducationGrade, SchoolCourseWithDetails, EvaluationRule } from '@/lib/supabase/services'
import { useTeacherStore } from '@/stores/useTeacherStore.supabase'
import type { School } from '@/lib/database-types'

// Schema de validação
const classFormSchema = z.object({
  name: z.string().min(2, 'Nome da turma obrigatório'),
  code: z.string().optional(),
  shift: z.enum(['Manhã', 'Tarde', 'Noite', 'Integral']),
  capacity: z.coerce.number().min(1, 'Capacidade mínima é 1 aluno').default(35),
  courseId: z.string().min(1, 'Curso/Etapa de Ensino obrigatório'),
  gradeId: z.string().optional(),
  periodId: z.string().min(1, 'Período acadêmico obrigatório'),
  // Campos do Censo Escolar
  isMultiGrade: z.boolean().default(false),
  educationModality: z.string().optional(),
  tipoRegime: z.string().optional(),
  operatingHours: z.string().optional(),
  minStudents: z.coerce.number().min(0).optional(),
  maxDependencySubjects: z.coerce.number().min(0).optional(),
  operatingDays: z.array(z.string()).default(['seg', 'ter', 'qua', 'qui', 'sex']),
  regentTeacherId: z.string().optional(),
  // Campos para criação global (menu admin)
  schoolId: z.string().optional(),
  yearId: z.string().optional(),
})

type ClassFormData = z.infer<typeof classFormSchema>

interface AcademicPeriod {
  id: number
  name: string
  type: string
  start_date: string
  end_date: string
}

interface ClassFormDialogUnifiedProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  // Props para uso dentro da aba escola (contexto já definido)
  schoolId?: number
  academicYearId?: number
  // Props para uso no menu admin (permite seleção de escola/ano)
  schools?: School[]
  // Dados para edição
  editingClass?: {
    id: number
    name: string
    code?: string
    shift: string
    capacity: number
    school_id?: number
    course_id?: number
    education_grade_id?: number
    academic_period_id?: number
    is_multi_grade?: boolean
    education_modality?: string
    tipo_regime?: string
    operating_hours?: string
    min_students?: number
    max_dependency_subjects?: number
    operating_days?: string[]
    regent_teacher_id?: number
  }
}

const daysOfWeek = [
  { id: 'seg', label: 'Segunda' },
  { id: 'ter', label: 'Terça' },
  { id: 'qua', label: 'Quarta' },
  { id: 'qui', label: 'Quinta' },
  { id: 'sex', label: 'Sexta' },
  { id: 'sab', label: 'Sábado' },
]

const selectClassName = cn(
  'flex h-10 w-full items-center justify-between rounded-md border border-input',
  'bg-background px-3 py-2 text-sm ring-offset-background',
  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
  'transition-all duration-200 hover:border-primary/30',
  'disabled:cursor-not-allowed disabled:opacity-50'
)

export function ClassFormDialogUnified({
  open,
  onOpenChange,
  onSuccess,
  schoolId: propSchoolId,
  academicYearId: propAcademicYearId,
  schools,
  editingClass,
}: ClassFormDialogUnifiedProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Estado para dados carregados
  const [courses, setCourses] = useState<SchoolCourseWithDetails[]>([])
  const [grades, setGrades] = useState<EducationGrade[]>([])
  const [allPeriods, setAllPeriods] = useState<AcademicPeriod[]>([])
  const [filteredPeriods, setFilteredPeriods] = useState<AcademicPeriod[]>([])
  const [evaluationRule, setEvaluationRule] = useState<EvaluationRule | null>(null)
  const [loadingRule, setLoadingRule] = useState(false)

  // Estado para anos letivos quando em modo admin
  const [academicYears, setAcademicYears] = useState<Array<{ id: number; name: string }>>([])

  // Professores
  const { teachers, loading: teachersLoading, fetchTeachers } = useTeacherStore()

  // Form
  const form = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: '',
      code: '',
      shift: 'Manhã',
      capacity: 35,
      courseId: '',
      gradeId: '',
      periodId: '',
      isMultiGrade: false,
      educationModality: '',
      tipoRegime: '',
      operatingHours: '',
      minStudents: 0,
      maxDependencySubjects: 0,
      operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
      regentTeacherId: '',
      schoolId: '',
      yearId: '',
    },
  })

  // Valores do form
  const watchedSchoolId = form.watch('schoolId')
  const watchedYearId = form.watch('yearId')
  const watchedCourseId = form.watch('courseId')
  const watchedGradeId = form.watch('gradeId')
  const watchedIsMultiGrade = form.watch('isMultiGrade')

  // Determinar schoolId e yearId efetivos (props ou form)
  const effectiveSchoolId = propSchoolId || (watchedSchoolId ? parseInt(watchedSchoolId) : null)
  const effectiveYearId = propAcademicYearId || (watchedYearId ? parseInt(watchedYearId) : null)

  // Determina se estamos no modo admin (permite seleção de escola)
  const isAdminMode = !!schools && !propSchoolId

  // Carregar professores
  useEffect(() => {
    if (open && teachers.length === 0 && !teachersLoading) {
      fetchTeachers()
    }
  }, [open, teachers.length, teachersLoading, fetchTeachers])

  // Resetar form quando abrir/fechar
  useEffect(() => {
    if (open) {
      if (editingClass) {
        // Para modo admin, usar school_id da turma sendo editada
        const editSchoolId = editingClass.school_id?.toString() || propSchoolId?.toString() || ''

        form.reset({
          name: editingClass.name || '',
          code: editingClass.code || '',
          shift: (editingClass.shift as 'Manhã' | 'Tarde' | 'Noite' | 'Integral') || 'Manhã',
          capacity: editingClass.capacity || 35,
          courseId: editingClass.course_id?.toString() || '',
          gradeId: editingClass.education_grade_id?.toString() || '',
          periodId: editingClass.academic_period_id?.toString() || '',
          isMultiGrade: editingClass.is_multi_grade || false,
          educationModality: editingClass.education_modality || '',
          tipoRegime: editingClass.tipo_regime || '',
          operatingHours: editingClass.operating_hours || '',
          minStudents: editingClass.min_students || 0,
          maxDependencySubjects: editingClass.max_dependency_subjects || 0,
          operatingDays: editingClass.operating_days || ['seg', 'ter', 'qua', 'qui', 'sex'],
          regentTeacherId: editingClass.regent_teacher_id?.toString() || '',
          schoolId: editSchoolId,
          yearId: propAcademicYearId?.toString() || '',
        })
      } else {
        form.reset({
          name: '',
          code: '',
          shift: 'Manhã',
          capacity: 35,
          courseId: '',
          gradeId: '',
          periodId: '',
          isMultiGrade: false,
          educationModality: '',
          tipoRegime: '',
          operatingHours: '',
          minStudents: 0,
          maxDependencySubjects: 0,
          operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
          regentTeacherId: '',
          schoolId: '',
          yearId: '',
        })
      }
    }
  }, [open, editingClass, propSchoolId, propAcademicYearId, form])

  // Carregar anos letivos quando escola mudar (modo admin)
  useEffect(() => {
    const loadAcademicYearsForSchool = async (schoolId: number) => {
      try {
        const { supabase } = await import('@/lib/supabase/client')

        // Buscar anos letivos que têm períodos vinculados a turmas desta escola
        // Ou buscar todos os anos letivos ativos
        const { data: years, error } = await supabase
          .from('academic_years')
          .select('id, name')
          .is('deleted_at', null)
          .order('name', { ascending: false })

        if (error) throw error
        setAcademicYears(years || [])

        // Se estamos editando, buscar o ano letivo do período acadêmico
        if (editingClass?.academic_period_id && years?.length > 0) {
          const { data: period } = await supabase
            .from('academic_periods')
            .select('academic_year_id')
            .eq('id', editingClass.academic_period_id)
            .single()

          if (period?.academic_year_id) {
            form.setValue('yearId', period.academic_year_id.toString())
          }
        }
      } catch (error) {
        console.error('Erro ao carregar anos letivos:', error)
        setAcademicYears([])
      }
    }

    if (isAdminMode && watchedSchoolId) {
      const schoolIdNum = parseInt(watchedSchoolId)
      if (!isNaN(schoolIdNum)) {
        loadAcademicYearsForSchool(schoolIdNum)
      }

      // Limpar seleções dependentes apenas se não estiver editando
      if (!editingClass) {
        form.setValue('yearId', '')
        form.setValue('courseId', '')
        form.setValue('gradeId', '')
        form.setValue('periodId', '')
        setCourses([])
        setGrades([])
        setAllPeriods([])
        setFilteredPeriods([])
      }
    }
  }, [watchedSchoolId, isAdminMode, editingClass, form])

  // Carregar cursos e períodos quando escola/ano estiverem definidos
  useEffect(() => {
    if (effectiveSchoolId && effectiveYearId) {
      loadInitialData(effectiveSchoolId, effectiveYearId)
    }
  }, [effectiveSchoolId, effectiveYearId])

  // Carregar séries quando curso mudar
  useEffect(() => {
    if (watchedCourseId) {
      loadGradesForCourse(watchedCourseId)
      loadEvaluationRule(watchedCourseId, watchedGradeId || undefined)
    } else {
      setGrades([])
      form.setValue('gradeId', '')
      setEvaluationRule(null)
      setFilteredPeriods(allPeriods)
    }
  }, [watchedCourseId])

  // Atualizar regra de avaliação quando série mudar
  useEffect(() => {
    if (watchedCourseId && watchedGradeId) {
      loadEvaluationRule(watchedCourseId, watchedGradeId)
    }
  }, [watchedGradeId])

  const loadInitialData = async (schoolId: number, yearId: number) => {
    setLoading(true)
    try {
      // Carregar cursos configurados COM as séries
      const coursesData = await schoolCourseService.getCoursesWithGrades(schoolId, yearId)
      setCourses(coursesData || [])

      // Carregar períodos acadêmicos
      const periodsData = await academicPeriodService.getByAcademicYear(yearId)
      setAllPeriods(periodsData || [])
      setFilteredPeriods(periodsData || [])

      // Se editando, selecionar primeiro período se não houver
      if (!editingClass?.academic_period_id && periodsData && periodsData.length > 0) {
        form.setValue('periodId', periodsData[0].id.toString())
      }

      // Se editando, carregar séries do curso
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

  const loadGradesForCourse = (courseId: string) => {
    const selectedCourse = courses.find(c => c.course_id === parseInt(courseId))
    if (selectedCourse?.grades) {
      const courseGrades = selectedCourse.grades
        .map(g => g.education_grade)
        .filter((g): g is EducationGrade => g !== null && g !== undefined)
        .sort((a, b) => a.grade_order - b.grade_order)
      setGrades(courseGrades)

      // Se a série atual não está nas séries do novo curso, limpar
      const currentGradeId = form.getValues('gradeId')
      if (currentGradeId && !courseGrades.some(g => g.id.toString() === currentGradeId)) {
        form.setValue('gradeId', '')
      }
    } else {
      setGrades([])
      form.setValue('gradeId', '')
    }
  }

  const loadEvaluationRule = async (courseId: string, gradeId?: string) => {
    setLoadingRule(true)
    try {
      const rule = await evaluationRulesService.getRuleForClass(
        parseInt(courseId),
        gradeId ? parseInt(gradeId) : undefined
      )
      setEvaluationRule(rule)

      // Filtrar períodos pelo tipo da regra
      if (rule?.academic_period_type) {
        const filtered = allPeriods.filter(p => p.type === rule.academic_period_type)
        setFilteredPeriods(filtered.length > 0 ? filtered : allPeriods)

        // Verificar se período atual ainda é válido
        const currentPeriodId = form.getValues('periodId')
        if (currentPeriodId && filtered.length > 0) {
          const periodStillValid = filtered.some(p => p.id.toString() === currentPeriodId)
          if (!periodStillValid) {
            form.setValue('periodId', filtered[0].id.toString())
          }
        } else if (filtered.length > 0 && !currentPeriodId) {
          form.setValue('periodId', filtered[0].id.toString())
        }
      } else {
        setFilteredPeriods(allPeriods)
      }
    } catch (error) {
      console.error('Erro ao carregar regra:', error)
      setFilteredPeriods(allPeriods)
    } finally {
      setLoadingRule(false)
    }
  }

  const handleSubmit = async (data: ClassFormData) => {
    // Validação: se não for multissérie, deve ter série selecionada
    if (!data.isMultiGrade && !data.gradeId) {
      form.setError('gradeId', {
        type: 'manual',
        message: 'Série/Ano é obrigatória para turmas não multissérie',
      })
      return
    }

    const finalSchoolId = effectiveSchoolId
    const finalYearId = effectiveYearId

    if (!finalSchoolId || !finalYearId) {
      alert('Selecione a escola e o ano letivo')
      return
    }

    setSaving(true)
    try {
      const classData = {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        school_id: finalSchoolId,
        course_id: parseInt(data.courseId),
        academic_period_id: parseInt(data.periodId),
        education_grade_id: data.gradeId ? parseInt(data.gradeId) : null,
        capacity: data.capacity,
        shift: data.shift,
        is_multi_grade: data.isMultiGrade,
        education_modality: data.educationModality || null,
        tipo_regime: data.tipoRegime || null,
        operating_hours: data.operatingHours || null,
        min_students: data.minStudents || null,
        max_dependency_subjects: data.maxDependencySubjects || null,
        operating_days: data.operatingDays.length > 0 ? data.operatingDays : null,
        regent_teacher_id: data.regentTeacherId ? parseInt(data.regentTeacherId) : null,
      }

      if (editingClass) {
        await classService.update(editingClass.id, classData)
        alert('Turma atualizada com sucesso!')
      } else {
        await classService.createClass({
          ...classData,
          code: classData.code || undefined,
          education_grade_id: classData.education_grade_id || undefined,
        })
        alert('Turma criada com sucesso!')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar turma:', error)
      alert(editingClass ? 'Erro ao atualizar turma' : 'Erro ao criar turma')
    } finally {
      setSaving(false)
    }
  }

  // Professores ativos da escola
  // Nota: A tabela teachers não tem employment_status, filtramos apenas por ter person
  const activeTeachers = useMemo(() => {
    return teachers.filter(t => t && t.person)
  }, [teachers])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingClass ? 'Editar Turma' : 'Nova Turma'}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da turma incluindo dados do Censo Escolar.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "flex items-center justify-center py-10",
            !loading && "hidden"
          )}
        >
          <div className="h-6 w-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        </div>

        <div className={cn(loading && "hidden")}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Seleção de Escola/Ano (modo admin) */}
              <div
                className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg",
                  !isAdminMode && "hidden"
                )}
              >
                <FormField
                  control={form.control}
                  name="schoolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escola *</FormLabel>
                      <FormControl>
                        <select
                          className={selectClassName}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="">Selecione a escola...</option>
                          {schools?.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano Letivo *</FormLabel>
                      <FormControl>
                        <select
                          className={selectClassName}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={!watchedSchoolId}
                        >
                          <option value="">Selecione o ano...</option>
                          {academicYears.map((y) => (
                            <option key={y.id} value={y.id.toString()}>
                              {y.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Nome e Sigla */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nome da Turma *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 5º Ano A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sigla</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 5A"
                          maxLength={10}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Curso/Etapa e Série */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curso/Etapa de Ensino *</FormLabel>
                      <FormControl>
                        <select
                          className={selectClassName}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={!effectiveSchoolId || !effectiveYearId}
                        >
                          <option value="">Selecione o curso...</option>
                          {courses.map((course) => (
                            <option key={course.id} value={course.course_id.toString()}>
                              {course.course?.name} ({course.course?.education_level})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription
                        className={cn(
                          "text-orange-500",
                          !(courses.length === 0 && effectiveSchoolId && effectiveYearId) && "hidden"
                        )}
                      >
                        Nenhum curso configurado para este ano letivo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  key={`grade-field-${watchedCourseId || 'none'}`}
                  control={form.control}
                  name="gradeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedIsMultiGrade ? 'Série Principal (Referência)' : 'Série/Ano'}
                        {!watchedIsMultiGrade && ' *'}
                      </FormLabel>
                      <FormControl>
                        <select
                          className={selectClassName}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={!watchedCourseId}
                        >
                          <option value="">
                            {watchedCourseId ? 'Selecione...' : 'Selecione primeiro o curso'}
                          </option>
                          {grades
                            .filter((grade) => grade && grade.id)
                            .map((grade) => (
                              <option key={`grade-${grade.id}`} value={grade.id.toString()}>
                                {grade.grade_name}
                              </option>
                            ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Turno e Turma Multissérie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno *</FormLabel>
                      <FormControl>
                        <select
                          className={selectClassName}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="Manhã">Manhã</option>
                          <option value="Tarde">Tarde</option>
                          <option value="Noite">Noite</option>
                          <option value="Integral">Integral</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isMultiGrade"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-1">
                      <div className="space-y-0.5">
                        <FormLabel>Turma Multissérie</FormLabel>
                        <FormDescription>
                          Permite alunos de diferentes séries
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Período Acadêmico */}
              <FormField
                control={form.control}
                name="periodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período Acadêmico *</FormLabel>
                    <FormControl>
                      <select
                        className={selectClassName}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="">Selecione o período...</option>
                        {filteredPeriods.map((period) => (
                          <option key={period.id} value={period.id.toString()}>
                            {period.name} ({period.type})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription
                      className={cn(
                        "text-orange-500",
                        filteredPeriods.length > 0 && "hidden"
                      )}
                    >
                      Nenhum período acadêmico configurado.
                    </FormDescription>
                    <FormDescription
                      className={cn(
                        "text-blue-600 flex items-center gap-1",
                        !(evaluationRule && filteredPeriods.length < allPeriods.length) && "hidden"
                      )}
                    >
                      <Info className="h-3 w-3" />
                      Períodos filtrados pelo tipo: {evaluationRule?.academic_period_type}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Card de Regra de Avaliação */}
              <div
                className={cn(
                  "rounded-lg border bg-gradient-to-br from-purple-50 to-blue-50 p-4 space-y-3",
                  !evaluationRule && "hidden"
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                  <Calculator className="h-4 w-4" />
                  Regra de Avaliação: {evaluationRule?.name}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <Badge variant="outline" className="bg-white justify-center">
                    Nota Mín: {evaluationRule?.min_approval_grade}
                  </Badge>
                  <Badge variant="outline" className="bg-white justify-center">
                    Freq. Mín: {evaluationRule?.min_attendance_percent}%
                  </Badge>
                  <Badge variant="outline" className="bg-white justify-center">
                    Período: {evaluationRule?.academic_period_type}
                  </Badge>
                  <Badge variant="outline" className="bg-white justify-center">
                    {evaluationRule?.periods_per_year}x ao ano
                  </Badge>
                </div>
                <p
                  className={cn(
                    "text-xs text-green-700 flex items-center gap-1",
                    !evaluationRule?.allow_recovery && "hidden"
                  )}
                >
                  <BookOpen className="h-3 w-3" />
                  Recuperação permitida
                </p>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 text-sm text-muted-foreground",
                  !loadingRule && "hidden"
                )}
              >
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Carregando regras de avaliação...
              </div>

              {/* Capacidade e Horário */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade Máxima *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 35)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minStudents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mínimo de Alunos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="operatingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Funcionamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 07:00 - 12:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Campos do Censo Escolar */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h4 className="font-medium text-sm text-muted-foreground">Campos do Censo Escolar</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="educationModality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modalidade de Ensino</FormLabel>
                        <FormControl>
                          <select
                            className={selectClassName}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Selecione...</option>
                            <option value="Regular">Ensino Regular</option>
                            <option value="EJA">EJA - Educação de Jovens e Adultos</option>
                            <option value="Especial">Educação Especial</option>
                            <option value="Integral">Tempo Integral</option>
                            <option value="Tecnico">Ensino Técnico</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tipoRegime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Regime</FormLabel>
                        <FormControl>
                          <select
                            className={selectClassName}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Selecione...</option>
                            <option value="Seriado">Seriado</option>
                            <option value="Nao Seriado">Não Seriado</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="maxDependencySubjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de Disciplinas em Dependência</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Número máximo de disciplinas reprovadas que o aluno pode levar para o próximo ano.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Professor Regente */}
              <FormField
                control={form.control}
                name="regentTeacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professor Regente</FormLabel>
                    <FormControl>
                      <select
                        className={selectClassName}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="">Selecione o professor regente (opcional)</option>
                        {activeTeachers.map((teacher) => {
                          const teacherName = teacher.person
                            ? `${teacher.person.first_name} ${teacher.person.last_name}`
                            : 'Professor'
                          return (
                            <option key={teacher.id} value={teacher.id.toString()}>
                              {teacherName}
                            </option>
                          )
                        })}
                      </select>
                    </FormControl>
                    <FormDescription>
                      Professor responsável pela turma (opcional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dias de Funcionamento */}
              <FormField
                control={form.control}
                name="operatingDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias de Funcionamento</FormLabel>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                      {daysOfWeek.map((item) => (
                        <div key={item.id} className="flex flex-row items-center space-x-2">
                          <Checkbox
                            id={`day-${item.id}`}
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item.id])
                                : field.onChange(field.value?.filter((v: string) => v !== item.id))
                            }}
                          />
                          <label
                            htmlFor={`day-${item.id}`}
                            className="font-normal text-sm cursor-pointer"
                          >
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || loadingRule}>
                  <span
                    className={cn(
                      "mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin",
                      !(saving || loadingRule) && "hidden"
                    )}
                    aria-hidden="true"
                  />
                  <span>{editingClass ? 'Salvar' : 'Criar Turma'}</span>
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
