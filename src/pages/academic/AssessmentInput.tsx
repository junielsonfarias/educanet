import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Loader2, Save, Filter, AlertCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { useAssessmentStore } from '@/stores/useAssessmentStore.supabase'
import { useAcademicYearStore } from '@/stores/useAcademicYearStore.supabase'
import { useAcademicPeriodStore } from '@/stores/useAcademicPeriodStore.supabase'
import {
  classService,
  evaluationInstanceService
} from '@/lib/supabase/services'
import { cn } from '@/lib/utils'

// --- Select Style ---
const selectClassName = cn(
  'flex h-10 w-full items-center justify-between rounded-md border border-input',
  'bg-background px-3 py-2 text-sm ring-offset-background',
  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
  'transition-all duration-200 hover:border-primary/30',
  'disabled:cursor-not-allowed disabled:opacity-50'
)

// --- Storage Key for Persistence ---
const STORAGE_KEY = 'edu_assessment_filters_v4'

interface FilterState {
  schoolId: string
  academicYearId: string
  academicPeriodId: string
  courseId: string
  classId: string
  subjectId: string
}

// --- Tipo para aluno retornado pelo classService ---
interface ClassStudent {
  id: number
  order_number?: number
  student_registration_number?: string
  person?: {
    first_name?: string
    last_name?: string
    full_name?: string
  }
}

// --- Optimized Student Row Component ---
const StudentRow = memo(
  ({
    student,
    value,
    max,
    onChange,
  }: {
    student: ClassStudent
    value: string | number
    max: number
    onChange: (id: number, val: string | number) => void
  }) => {
    const [localValue, setLocalValue] = useState<string | number>(
      value !== undefined ? value : '',
    )

    useEffect(() => {
      setLocalValue(value !== undefined ? value : '')
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setLocalValue(val)
      const num = parseFloat(val)
      onChange(student.id, isNaN(num) ? '' : num)
    }

    // Usar estrutura do classService.getClassStudents
    const studentName = student.person?.full_name ||
      `${student.person?.first_name || ''} ${student.person?.last_name || ''}`.trim() ||
      'Aluno'
    const studentRegistration = student.student_registration_number || 'N/A'
    const orderNumber = student.order_number || ''

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm w-6">{orderNumber}.</span>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{studentName}</span>
            <span className="text-xs text-muted-foreground">
              Matrícula: {studentRegistration}
            </span>
          </div>
        </div>
        <div className="w-full sm:w-[150px]">
          <Input
            type="number"
            min={0}
            max={max}
            step="0.1"
            placeholder="Nota"
            className={cn(
              'transition-all',
              typeof localValue === 'number' && localValue < 6
                ? 'border-red-300 bg-red-50 text-red-900'
                : '',
            )}
            value={localValue}
            onChange={handleChange}
          />
        </div>
      </div>
    )
  },
  (prev, next) =>
    prev.value === next.value &&
    prev.student?.id === next.student?.id &&
    prev.max === next.max,
)

StudentRow.displayName = 'StudentRow'

export default function AssessmentInput() {
  const { schools, loading: schoolsLoading, fetchSchools } = useSchoolStore()
  const { courses, subjects, loading: coursesLoading, fetchCourses, fetchSubjects } = useCourseStore()
  const {
    grades,
    loading: gradesLoading,
    saveGrade,
    fetchClassGrades
  } = useAssessmentStore()
  const { academicYears, loading: yearsLoading, fetchAcademicYears } = useAcademicYearStore()
  const { academicPeriods, loading: periodsLoading, fetchAcademicPeriods } = useAcademicPeriodStore()

  // Filtros simples com useState
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {
      // Ignore parse errors
    }
    return {
      schoolId: '',
      academicYearId: '',
      academicPeriodId: '',
      courseId: '',
      classId: '',
      subjectId: '',
    }
  })

  const [studentGrades, setStudentGrades] = useState<Record<number, number | string>>({})
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [classStudents, setClassStudents] = useState<any[]>([])

  // Salvar filtros no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  // Carregar dados iniciais
  useEffect(() => {
    fetchSchools()
    fetchCourses()
    fetchSubjects()
    fetchAcademicYears()
    fetchAcademicPeriods()
  }, [fetchSchools, fetchCourses, fetchSubjects, fetchAcademicYears, fetchAcademicPeriods])

  // --- Safe Arrays (memoized to prevent unnecessary re-renders) ---
  const safeSchools = useMemo(() => Array.isArray(schools) ? schools : [], [schools])
  const safeAcademicYears = useMemo(() => Array.isArray(academicYears) ? academicYears : [], [academicYears])
  const safeCourses = useMemo(() => Array.isArray(courses) ? courses : [], [courses])
  const safeSubjects = useMemo(() => Array.isArray(subjects) ? subjects : [], [subjects])
  const safeGrades = useMemo(() => Array.isArray(grades) ? grades : [], [grades])

  // Filtrar períodos por ano letivo
  const filteredPeriods = useMemo(() => {
    if (!filters.academicYearId) return []
    return (Array.isArray(academicPeriods) ? academicPeriods : []).filter(
      (p) => p.academic_year_id?.toString() === filters.academicYearId
    )
  }, [academicPeriods, filters.academicYearId])

  // Buscar turmas quando escola e ano são selecionados
  useEffect(() => {
    const fetchClasses = async () => {
      if (filters.schoolId && filters.academicYearId) {
        setClassesLoading(true)
        try {
          const classesData = await classService.getBySchool(parseInt(filters.schoolId))
          const filteredClasses = (classesData || []).filter(
            (c) => c.academic_year_id?.toString() === filters.academicYearId
          )
          setClasses(filteredClasses)
        } catch {
          toast.error('Erro ao carregar turmas')
          setClasses([])
        } finally {
          setClassesLoading(false)
        }
      } else {
        setClasses([])
      }
    }
    fetchClasses()
  }, [filters.schoolId, filters.academicYearId])

  // Filtrar turmas por curso
  const filteredClasses = useMemo(() => {
    if (!filters.courseId) return classes
    return classes.filter((c) => c.course_id?.toString() === filters.courseId)
  }, [classes, filters.courseId])

  // Handle filter changes
  const handleFilterChange = useCallback((field: keyof FilterState, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [field]: value }

      // Reset dependent fields
      if (field === 'schoolId') {
        next.academicYearId = ''
        next.academicPeriodId = ''
        next.courseId = ''
        next.classId = ''
        next.subjectId = ''
      } else if (field === 'academicYearId') {
        next.academicPeriodId = ''
        next.courseId = ''
        next.classId = ''
        next.subjectId = ''
      } else if (field === 'courseId') {
        next.classId = ''
      }

      return next
    })
  }, [])

  // Estado para controlar se os dados foram carregados
  const [dataLoaded, setDataLoaded] = useState(false)

  // --- Load Grades Data (manual trigger only) ---
  const loadData = useCallback(async () => {
    if (!filters.classId || !filters.subjectId || !filters.academicPeriodId) {
      toast.warning('Preencha todos os filtros antes de carregar')
      return
    }

    setLoading(true)
    setDataLoaded(false)
    try {
      // Buscar alunos da turma usando classService
      const studentsData = await classService.getClassStudents(parseInt(filters.classId))
      setClassStudents(studentsData || [])

      // Tentar buscar notas existentes (pode não haver)
      try {
        await fetchClassGrades(parseInt(filters.classId))
      } catch {
        // Ignorar erro se não houver notas - é esperado
        console.log('Nenhuma nota encontrada para esta turma')
      }

      setStudentGrades({})
      setDataLoaded(true)
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
      toast.error('Erro ao carregar alunos da turma')
      setDataLoaded(false)
    } finally {
      setLoading(false)
    }
  }, [filters.classId, filters.subjectId, filters.academicPeriodId, fetchClassGrades])

  // Reset quando filtros mudam (sem carregar automaticamente)
  useEffect(() => {
    setDataLoaded(false)
    setStudentGrades({})
    setClassStudents([])
  }, [filters.schoolId, filters.academicYearId, filters.academicPeriodId, filters.courseId, filters.classId, filters.subjectId])

  // Inicializar studentGrades quando grades do store mudar (apenas se dados carregados)
  useEffect(() => {
    if (!dataLoaded || !filters.classId || !filters.subjectId || classStudents.length === 0) return

    const currentGrades: Record<number, number | string> = {}

    classStudents.forEach((student: any) => {
      const studentProfileId = student.id
      if (!studentProfileId) return

      const grade = safeGrades.find(
        (g: any) =>
          g.student_profile_id === studentProfileId &&
          g.evaluation_instance?.class_teacher_subject?.class_id?.toString() === filters.classId &&
          g.evaluation_instance?.class_teacher_subject?.subject_id?.toString() === filters.subjectId
      )

      if (grade) {
        currentGrades[studentProfileId] = (grade as any).grade_value || ''
      }
    })

    setStudentGrades(currentGrades)
  }, [dataLoaded, safeGrades, classStudents, filters.classId, filters.subjectId])

  const handleGradeChange = useCallback(
    (studentId: number, value: string | number) => {
      setStudentGrades((prev) => ({ ...prev, [studentId]: value }))
    },
    [],
  )

  const handleSave = async () => {
    setLoading(true)
    let savedCount = 0

    try {
      const classIdNum = parseInt(filters.classId)
      const existingInstances = await evaluationInstanceService.getByClass(classIdNum)

      const instancesForSubject = existingInstances.filter((inst) => {
        const cts = inst.class_teacher_subject
        return cts?.subject_id?.toString() === filters.subjectId
      })

      let evaluationInstanceId: number | null = null

      if (instancesForSubject.length > 0) {
        evaluationInstanceId = instancesForSubject[0]?.id || null
      } else if (existingInstances.length > 0) {
        evaluationInstanceId = existingInstances[0]?.id || null
      }

      if (!evaluationInstanceId) {
        toast.warning(
          'Instância de avaliação não encontrada. ' +
          'Por favor, crie uma alocação de professor para esta turma/disciplina primeiro.'
        )
        return
      }

      for (const student of classStudents) {
        const studentProfileId = student.id
        if (!studentProfileId) continue

        const value = studentGrades[studentProfileId]
        if (value === undefined || value === '') continue

        try {
          const gradeValue = typeof value === 'number' ? value : parseFloat(value as string)

          if (isNaN(gradeValue)) {
            continue
          }

          const gradeData = {
            evaluation_instance_id: evaluationInstanceId!,
            student_profile_id: studentProfileId,
            grade_value: gradeValue,
            notes: typeof value === 'string' && isNaN(parseFloat(value)) ? value : undefined,
          }

          await saveGrade(gradeData)
          savedCount++
        } catch {
          toast.error(`Erro ao salvar nota do aluno ${studentProfileId}`)
        }
      }

      if (savedCount > 0) {
        toast.success(`${savedCount} nota(s) salva(s) com sucesso!`)
        await loadData()
      } else {
        toast.warning('Nenhuma nota foi salva.')
      }
    } catch {
      toast.error('Erro ao salvar notas')
    } finally {
      setLoading(false)
    }
  }

  // Alunos da turma já vêm ordenados do classService.getClassStudents
  const displayStudents = useMemo(() => {
    if (!filters.classId || !classStudents.length) return []
    return classStudents
  }, [classStudents, filters.classId])

  const isConfigComplete =
    filters.schoolId &&
    filters.academicYearId &&
    filters.academicPeriodId &&
    filters.courseId &&
    filters.classId &&
    filters.subjectId

  const maxGrade = 10
  const isLoadingData = loading
  const hasStudents = displayStudents.length > 0

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Save className="h-8 w-8" />
          Lançamento de Avaliações
        </h2>
        <p className="text-muted-foreground">
          Registro dinâmico de notas por turma e disciplina.
        </p>
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-white border-purple-200/50 border-t-4 border-t-purple-500 hover:border-purple-600 hover:shadow-lg transition-all duration-300 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="pb-4 relative z-10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
              <Save className="h-5 w-5 text-purple-600" />
            </div>
            <Filter className="h-5 w-5" />
            Filtros de Seleção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. School */}
            <div className="space-y-2">
              <Label>Escola</Label>
              <select
                className={selectClassName}
                value={filters.schoolId}
                onChange={(e) => handleFilterChange('schoolId', e.target.value)}
                disabled={schoolsLoading}
              >
                <option value="">Selecione...</option>
                {safeSchools.map((s) => (
                  <option key={s.id} value={s.id.toString()}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Academic Year */}
            <div className="space-y-2">
              <Label>Ano Letivo</Label>
              <select
                className={selectClassName}
                value={filters.academicYearId}
                onChange={(e) => handleFilterChange('academicYearId', e.target.value)}
                disabled={!filters.schoolId || yearsLoading}
              >
                <option value="">Selecione...</option>
                {safeAcademicYears.map((y) => (
                  <option key={y.id} value={y.id.toString()}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Academic Period */}
            <div className="space-y-2">
              <Label>Período</Label>
              <select
                className={selectClassName}
                value={filters.academicPeriodId}
                onChange={(e) => handleFilterChange('academicPeriodId', e.target.value)}
                disabled={!filters.academicYearId || periodsLoading}
              >
                <option value="">Selecione...</option>
                {filteredPeriods.map((p) => (
                  <option key={p.id} value={p.id.toString()}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Course */}
            <div className="space-y-2">
              <Label>Curso</Label>
              <select
                className={selectClassName}
                value={filters.courseId}
                onChange={(e) => handleFilterChange('courseId', e.target.value)}
                disabled={!filters.academicYearId || coursesLoading}
              >
                <option value="">Selecione...</option>
                {safeCourses.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Class */}
            <div className="space-y-2">
              <Label>Turma</Label>
              <select
                className={selectClassName}
                value={filters.classId}
                onChange={(e) => handleFilterChange('classId', e.target.value)}
                disabled={!filters.courseId || classesLoading}
              >
                <option value="">{classesLoading ? 'Carregando...' : 'Selecione...'}</option>
                {filteredClasses.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Subject */}
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <select
                className={selectClassName}
                value={filters.subjectId}
                onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                disabled={!filters.courseId || coursesLoading}
              >
                <option value="">Selecione...</option>
                {safeSubjects.map((s) => (
                  <option key={s.id} value={s.id.toString()}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Load Data Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={loadData}
              disabled={!isConfigComplete || loading}
              className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500"
            >
              <Loader2 className={cn("mr-2 h-4 w-4 animate-spin", !loading && "hidden")} />
              <Filter className={cn("mr-2 h-4 w-4", loading && "hidden")} />
              <span>Carregar Dados</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid Display - Config incomplete message */}
      <div className={cn(
        "flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed",
        (isConfigComplete && dataLoaded) && "hidden"
      )}>
        <Filter className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">
          {isConfigComplete
            ? 'Clique em "Carregar Dados" para visualizar o diário.'
            : 'Selecione todos os filtros acima para carregar o diário.'}
        </p>
        <p className="text-sm mt-2">
          {isConfigComplete
            ? 'Os filtros estão configurados. Agora carregue os dados.'
            : 'Configure escola, ano letivo, período, curso, turma e disciplina.'}
        </p>
      </div>

      {/* Grid Display - Class diary card */}
      <Card className={cn(
        "animate-fade-in-up relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-white border-purple-200/50 hover:shadow-lg transition-all duration-300",
        !dataLoaded && "hidden"
      )}>
        <CardHeader className="flex flex-row items-center justify-between relative z-10">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-100 to-purple-200">
                <Save className="h-4 w-4 text-purple-600" />
              </div>
              Diário de Classe
            </CardTitle>
            <CardDescription>
              {displayStudents.length} aluno(s) listado(s)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={loading || studentsLoading || gradesLoading}
              size="sm"
              className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Loader2 className={cn("mr-2 h-4 w-4 animate-spin", !loading && "hidden")} />
              <div className={cn("p-0.5 rounded-md bg-white/20 mr-2", loading && "hidden")}>
                <Save className="h-4 w-4" />
              </div>
              <span>Salvar Notas</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading skeleton */}
          <div className={cn("space-y-2", !isLoadingData && "hidden")}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex gap-4">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>

          {/* Empty state */}
          <div className={cn(
            "text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg",
            (isLoadingData || hasStudents) && "hidden"
          )}>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Nenhum aluno encontrado nesta turma.</p>
            <p className="text-sm mt-2">Verifique se há alunos matriculados na turma selecionada.</p>
          </div>

          {/* Students list */}
          <div className={cn(
            "space-y-2",
            (isLoadingData || !hasStudents) && "hidden"
          )}>
            {displayStudents.map((student: any) => (
              <StudentRow
                key={`student-${student.id}`}
                student={student}
                value={studentGrades[student.id]}
                max={maxGrade}
                onChange={handleGradeChange}
              />
            ))}

            <div className="flex justify-end pt-6 sticky bottom-4">
              <Button
                size="lg"
                onClick={handleSave}
                disabled={loading}
                className="shadow-lg bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white"
              >
                <Loader2 className={cn("mr-2 h-4 w-4 animate-spin", !loading && "hidden")} />
                <Save className={cn("mr-2 h-4 w-4", loading && "hidden")} />
                <span>Salvar Alterações</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
