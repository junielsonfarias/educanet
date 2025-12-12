import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Save, Filter, AlertCircle, RefreshCw } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'
import useStudentStore from '@/stores/useStudentStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import { cn } from '@/lib/utils'

// --- Storage Key for Persistence ---
const STORAGE_KEY = 'edu_assessment_filters_v2'

// --- Validation Schema ---
const filterSchema = z.object({
  schoolId: z.string().min(1, 'Selecione a escola'),
  academicYearId: z.string().min(1, 'Selecione o ano letivo'),
  gradeId: z.string().min(1, 'Selecione o curso/série'), // Maps to 'Curso e Série'
  shift: z.string().min(1, 'Selecione o turno'),
  classId: z.string().min(1, 'Selecione a turma'),
  periodId: z.string().min(1, 'Selecione o período'),
  subjectId: z.string().min(1, 'Selecione a disciplina'),
  category: z
    .enum(['regular', 'recuperation', 'external_exam'])
    .default('regular'),
  assessmentTypeId: z.string().optional(),
})

type FilterValues = z.infer<typeof filterSchema>

// --- Optimized Student Row Component ---
const StudentRow = memo(
  ({
    student,
    value,
    max,
    isNumeric,
    onChange,
  }: {
    student: any
    value: string | number
    max: number
    isNumeric: boolean
    onChange: (id: string, val: string | number) => void
  }) => {
    // Local state for smooth typing
    const [localValue, setLocalValue] = useState<string | number>(
      value !== undefined ? value : '',
    )

    // Sync local state when prop value changes (e.g. initial load or reset)
    useEffect(() => {
      setLocalValue(value !== undefined ? value : '')
    }, [value])

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const val = e.target.value
      setLocalValue(val)

      // Debounce the update to parent to keep UI responsive
      // However, for immediate feedback in simple inputs, direct update usually works if list isn't huge.
      // For 50+ items, we can defer.
      // Here passing directly for simplicity but relying on memo to block other rows rerender.
      if (isNumeric) {
        const num = parseFloat(val)
        onChange(student.id, isNaN(num) ? '' : num)
      } else {
        onChange(student.id, val)
      }
    }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{student.name}</span>
          <span className="text-xs text-muted-foreground">
            Matrícula: {student.registration}
          </span>
        </div>
        <div className="w-full sm:w-[150px]">
          {isNumeric ? (
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
          ) : (
            <Textarea
              placeholder="Parecer..."
              className="min-h-[40px] h-[40px] resize-none py-2"
              value={localValue}
              onChange={handleChange}
            />
          )}
        </div>
      </div>
    )
  },
  (prev, next) =>
    prev.value === next.value &&
    prev.student.id === next.student.id &&
    prev.isNumeric === next.isNumeric,
)

StudentRow.displayName = 'StudentRow'

export default function AssessmentInput() {
  const { schools } = useSchoolStore()
  const { courses, evaluationRules } = useCourseStore()
  const { students } = useStudentStore()
  const { assessments, addAssessment, assessmentTypes } = useAssessmentStore()
  const { toast } = useToast()

  const [studentGrades, setStudentGrades] = useState<
    Record<string, number | string>
  >({})
  const [loading, setLoading] = useState(false)

  // Load saved filters
  const defaultValues: FilterValues = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? JSON.parse(saved)
      : {
          schoolId: '',
          academicYearId: '',
          gradeId: '',
          shift: '',
          classId: '',
          periodId: '',
          subjectId: '',
          category: 'regular',
          assessmentTypeId: '',
        }
  }, [])

  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues,
  })

  // --- Watchers ---
  const schoolId = form.watch('schoolId')
  const academicYearId = form.watch('academicYearId')
  const gradeId = form.watch('gradeId')
  const shift = form.watch('shift')
  const classId = form.watch('classId')
  const subjectId = form.watch('subjectId')
  const periodId = form.watch('periodId')
  const category = form.watch('category')
  const assessmentTypeId = form.watch('assessmentTypeId')

  // --- Persistent Storage ---
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    })
    return () => subscription.unsubscribe()
  }, [form])

  // --- Derived Options with Memoization ---

  const selectedSchool = useMemo(
    () => schools.find((s) => s.id === schoolId),
    [schools, schoolId],
  )

  const academicYears = useMemo(
    () => selectedSchool?.academicYears || [],
    [selectedSchool],
  )

  const selectedYear = useMemo(
    () => academicYears.find((y) => y.id === academicYearId),
    [academicYears, academicYearId],
  )

  // Derive available Grades (Courses/Series) from classes in the selected year
  const availableGrades = useMemo(() => {
    if (!selectedYear) return []
    const gradeIds = new Set(selectedYear.classes.map((c) => c.gradeId))
    const flattenGrades = courses.flatMap((c) =>
      c.grades.map((g) => ({ ...g, courseName: c.name })),
    )
    return flattenGrades.filter((g) => gradeIds.has(g.id))
  }, [selectedYear, courses])

  // Derive available Shifts based on selected Grade
  const availableShifts = useMemo(() => {
    if (!selectedYear || !gradeId) return []
    const classesInGrade = selectedYear.classes.filter(
      (c) => c.gradeId === gradeId,
    )
    const shifts = new Set(classesInGrade.map((c) => c.shift))
    return Array.from(shifts)
  }, [selectedYear, gradeId])

  // Derive available Classes based on Grade AND Shift
  const availableClasses = useMemo(() => {
    if (!selectedYear || !gradeId || !shift) return []
    return selectedYear.classes.filter(
      (c) => c.gradeId === gradeId && c.shift === shift,
    )
  }, [selectedYear, gradeId, shift])

  // Derive Periods
  const periods = useMemo(() => selectedYear?.periods || [], [selectedYear])

  // Derive Subjects from Grade structure
  const currentGradeStructure = useMemo(
    () => availableGrades.find((g) => g.id === gradeId),
    [availableGrades, gradeId],
  )
  const subjects = useMemo(
    () => currentGradeStructure?.subjects || [],
    [currentGradeStructure],
  )

  // Evaluation Rule for the selected Grade
  const evaluationRule = useMemo(
    () =>
      evaluationRules.find(
        (r) => r.id === currentGradeStructure?.evaluationRuleId,
      ),
    [evaluationRules, currentGradeStructure],
  )

  // Available Assessment Types
  const availableAssessmentTypes = useMemo(() => {
    if (!currentGradeStructure) return []

    // Filter by grade
    const gradeTypes = assessmentTypes.filter((t) =>
      t.applicableGradeIds.includes(currentGradeStructure.id),
    )

    // Filter by category
    if (category === 'external_exam') {
      // External exams: excludeFromAverage === true
      return gradeTypes.filter((t) => t.excludeFromAverage === true)
    } else {
      // Regular and Recuperation: Include types that usually count towards average (excludeFromAverage === false or undefined)
      // Using !t.excludeFromAverage ensures false or undefined are included.
      return gradeTypes.filter((t) => !t.excludeFromAverage)
    }
  }, [assessmentTypes, currentGradeStructure, category])

  // --- Reset Effects for Dependent Fields ---

  useEffect(() => {
    if (schoolId) {
      // Keep year if valid, else reset
      const validYear = academicYears.find((y) => y.id === academicYearId)
      if (!validYear) form.setValue('academicYearId', '')
    } else {
      form.setValue('academicYearId', '')
    }
  }, [schoolId, academicYears, academicYearId, form])

  useEffect(() => {
    const validGrade = availableGrades.find((g) => g.id === gradeId)
    if (!validGrade) form.setValue('gradeId', '')
  }, [availableGrades, gradeId, form])

  useEffect(() => {
    if (!availableShifts.includes(shift)) form.setValue('shift', '')
  }, [availableShifts, shift, form])

  useEffect(() => {
    const validClass = availableClasses.find((c) => c.id === classId)
    if (!validClass) form.setValue('classId', '')
  }, [availableClasses, classId, form])

  useEffect(() => {
    const validSubject = subjects.find((s) => s.id === subjectId)
    if (!validSubject) form.setValue('subjectId', '')
  }, [subjects, subjectId, form])

  // Reset assessment type if not in the new available list
  useEffect(() => {
    if (assessmentTypeId && availableAssessmentTypes.length > 0) {
      const exists = availableAssessmentTypes.find(
        (t) => t.id === assessmentTypeId,
      )
      if (!exists) form.setValue('assessmentTypeId', '')
    }
  }, [availableAssessmentTypes, assessmentTypeId, form])

  // --- Load Grades Data ---

  const loadData = useCallback(() => {
    if (!classId || !subjectId || !periodId) return

    setLoading(true)
    // Simulate slight network delay for realism if desired, but keeping it snappy
    setTimeout(() => {
      const currentGrades: Record<string, number | string> = {}

      // Find students currently enrolled in this class
      // Filter by school and active enrollment
      const targetClass = availableClasses.find((c) => c.id === classId)

      const classStudents = students.filter((s) => {
        const enrollment = s.enrollments.find((e) => e.status === 'Cursando')
        // Match Logic: School Match AND Grade Match.
        // Note: Enrollment.grade is usually the Class Name.
        return (
          enrollment &&
          enrollment.schoolId === schoolId &&
          targetClass &&
          enrollment.grade === targetClass.name
        )
      })

      classStudents.forEach((student) => {
        const assessment = assessments.find(
          (a) =>
            a.studentId === student.id &&
            a.classroomId === classId &&
            a.subjectId === subjectId &&
            a.periodId === periodId &&
            (a.category || 'regular') === category &&
            (assessmentTypeId ? a.assessmentTypeId === assessmentTypeId : true),
        )
        if (assessment) {
          currentGrades[student.id] = assessment.value
        }
      })
      setStudentGrades(currentGrades)
      setLoading(false)
    }, 300)
  }, [
    classId,
    subjectId,
    periodId,
    category,
    assessmentTypeId,
    students,
    assessments,
    availableClasses,
    schoolId,
  ])

  // Trigger load when filters are complete
  useEffect(() => {
    // Check if all necessary filters are present
    // If assessmentType is required (e.g. for specific types), check it too.
    // Requirement: "Upon selection of all necessary filters... automatically load"
    // If Types are available but none selected, we might not load grades yet or load generic?
    // Assuming we need Type if availableTypes > 0.

    const basicFilters =
      schoolId &&
      academicYearId &&
      gradeId &&
      shift &&
      classId &&
      periodId &&
      subjectId
    const typeNeeded = availableAssessmentTypes.length > 0

    if (basicFilters && (!typeNeeded || assessmentTypeId)) {
      loadData()
    } else {
      setStudentGrades({})
    }
  }, [
    schoolId,
    academicYearId,
    gradeId,
    shift,
    classId,
    periodId,
    subjectId,
    category,
    assessmentTypeId,
    availableAssessmentTypes,
    loadData,
  ])

  const handleGradeChange = useCallback(
    (studentId: string, value: string | number) => {
      setStudentGrades((prev) => ({ ...prev, [studentId]: value }))
    },
    [],
  )

  const handleSave = () => {
    const values = form.getValues()
    const targetClass = availableClasses.find((c) => c.id === values.classId)

    const classStudents = students.filter((s) => {
      const enrollment = s.enrollments.find((e) => e.status === 'Cursando')
      return (
        enrollment &&
        enrollment.schoolId === values.schoolId &&
        targetClass &&
        enrollment.grade === targetClass.name
      )
    })

    let savedCount = 0
    classStudents.forEach((student) => {
      const value = studentGrades[student.id]
      if (value !== undefined && value !== '') {
        // logic for linking recoveries
        let relatedAssessmentId: string | undefined = undefined

        if (values.category === 'recuperation' && values.assessmentTypeId) {
          const related = assessments.find(
            (a) =>
              a.studentId === student.id &&
              a.periodId === values.periodId &&
              a.subjectId === values.subjectId &&
              a.assessmentTypeId === values.assessmentTypeId &&
              (a.category || 'regular') === 'regular',
          )
          if (related) relatedAssessmentId = related.id
        }

        addAssessment({
          studentId: student.id,
          schoolId: values.schoolId,
          yearId: values.academicYearId,
          classroomId: values.classId,
          periodId: values.periodId,
          subjectId: values.subjectId,
          type: evaluationRule?.type || 'numeric',
          category: values.category,
          value: value,
          date: new Date().toISOString().split('T')[0],
          assessmentTypeId: values.assessmentTypeId || undefined,
          relatedAssessmentId,
        })
        savedCount++
      }
    })

    toast({
      title: 'Diário Salvo',
      description: `${savedCount} registros de avaliação atualizados com sucesso.`,
    })
  }

  // Filtered students for rendering
  const filteredStudents = useMemo(() => {
    if (!classId) return []
    const targetClass = availableClasses.find((c) => c.id === classId)
    if (!targetClass) return []

    return students
      .filter((s) => {
        const enrollment = s.enrollments.find((e) => e.status === 'Cursando')
        return (
          enrollment &&
          enrollment.schoolId === schoolId &&
          enrollment.grade === targetClass.name
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [students, classId, availableClasses, schoolId])

  const isConfigComplete =
    schoolId &&
    academicYearId &&
    gradeId &&
    shift &&
    classId &&
    periodId &&
    subjectId &&
    (!availableAssessmentTypes.length || assessmentTypeId)

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Save className="h-8 w-8" />
          Lançamento de Avaliações
        </h2>
        <p className="text-muted-foreground">
          Registro dinâmico de notas por turma, turno e disciplina.
        </p>
      </div>

      <Card className="border-t-4 border-t-primary">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros de Seleção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. School */}
                <FormField
                  control={form.control}
                  name="schoolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escola</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schools.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* 2. Academic Year */}
                <FormField
                  control={form.control}
                  name="academicYearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano Letivo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!schoolId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((y) => (
                            <SelectItem key={y.id} value={y.id}>
                              {y.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* 3. Course/Series (Grade) */}
                <FormField
                  control={form.control}
                  name="gradeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curso e Série</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!academicYearId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableGrades.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}{' '}
                              <span className="text-muted-foreground text-xs">
                                ({g.courseName})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* 4. Shift (Turno) */}
                <FormField
                  control={form.control}
                  name="shift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!gradeId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableShifts.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* 5. Class (Turma) */}
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turma</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!shift}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableClasses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* 6. Period */}
                <FormField
                  control={form.control}
                  name="periodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!academicYearId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periods.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* 7. Subject */}
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disciplina</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!gradeId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* 8. Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="recuperation">
                            Recuperação
                          </SelectItem>
                          <SelectItem value="external_exam">
                            Prova Externa
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* 9. Assessment Type - Dynamic */}
              {availableAssessmentTypes.length > 0 && (
                <div className="animate-slide-down">
                  <FormField
                    control={form.control}
                    name="assessmentTypeId"
                    render={({ field }) => (
                      <FormItem className="max-w-md">
                        <FormLabel>
                          Tipo de Avaliação{' '}
                          {category === 'recuperation' ? '(Referência)' : ''}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de avaliação..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableAssessmentTypes.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {availableAssessmentTypes.length === 0 && gradeId && (
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md flex items-center gap-2 text-sm border border-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  Nenhum tipo de avaliação configurado para esta
                  categoria/série.
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Grid Display */}
      {isConfigComplete ? (
        <Card className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Diário de Classe</CardTitle>
              <CardDescription>
                {filteredStudents.length} alunos listados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="h-8 px-3">
                {evaluationRule?.name}
              </Badge>
              <Button onClick={handleSave} disabled={loading} size="sm">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Notas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                Nenhum aluno encontrado nesta turma.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    value={studentGrades[student.id]}
                    max={evaluationRule?.maxGrade || 10}
                    isNumeric={evaluationRule?.type === 'numeric'}
                    onChange={handleGradeChange}
                  />
                ))}

                <div className="flex justify-end pt-6 sticky bottom-4">
                  <Button size="lg" onClick={handleSave} className="shadow-lg">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
          <Filter className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">
            Selecione todos os filtros acima para carregar o diário.
          </p>
          <p className="text-sm">
            Certifique-se de que a configuração de tipos de avaliação esteja
            correta.
          </p>
        </div>
      )}
    </div>
  )
}
