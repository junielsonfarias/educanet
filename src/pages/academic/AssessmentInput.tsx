import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Save, Filter, AlertCircle } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useAssessmentStore } from '@/stores/useAssessmentStore.supabase'
import { useAcademicYearStore } from '@/stores/useAcademicYearStore.supabase'
import { useAcademicPeriodStore } from '@/stores/useAcademicPeriodStore.supabase'
import { 
  classService, 
  evaluationInstanceService,
  enrollmentService 
} from '@/lib/supabase/services'
import { cn } from '@/lib/utils'
import { RequirePermission } from '@/components/RequirePermission'

// --- Storage Key for Persistence ---
const STORAGE_KEY = 'edu_assessment_filters_v3_supabase'

// --- Validation Schema ---
const filterSchema = z.object({
  schoolId: z.string().min(1, 'Selecione a escola'),
  academicYearId: z.string().min(1, 'Selecione o ano letivo'),
  academicPeriodId: z.string().min(1, 'Selecione o período'),
  courseId: z.string().min(1, 'Selecione o curso'),
  classId: z.string().min(1, 'Selecione a turma'),
  subjectId: z.string().min(1, 'Selecione a disciplina'),
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
    onChange: (id: number, val: string | number) => void
  }) => {
    const [localValue, setLocalValue] = useState<string | number>(
      value !== undefined ? value : '',
    )

    useEffect(() => {
      setLocalValue(value !== undefined ? value : '')
    }, [value])

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const val = e.target.value
      setLocalValue(val)

      if (isNumeric) {
        const num = parseFloat(val)
        onChange(student.id, isNaN(num) ? '' : num)
      } else {
        onChange(student.id, val)
      }
    }

    const studentName = `${student.first_name} ${student.last_name}`
    const studentRegistration = student.registration_number || 'N/A'

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{studentName}</span>
          <span className="text-xs text-muted-foreground">
            Matrícula: {studentRegistration}
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
  const { schools, loading: schoolsLoading, fetchSchools } = useSchoolStore()
  const { courses, subjects, loading: coursesLoading, fetchCourses, fetchSubjects } = useCourseStore()
  const { students, loading: studentsLoading, fetchStudents } = useStudentStore()
  const { 
    grades, 
    loading: gradesLoading, 
    saveGrade,
    fetchClassGrades 
  } = useAssessmentStore()
  const { academicYears, loading: yearsLoading, fetchAcademicYears } = useAcademicYearStore()
  const { academicPeriods, loading: periodsLoading, fetchAcademicPeriods } = useAcademicPeriodStore()

  const [studentGrades, setStudentGrades] = useState<Record<number, number | string>>({})
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [evaluationInstances, setEvaluationInstances] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])

  // Carregar dados iniciais
  useEffect(() => {
    fetchSchools()
    fetchCourses()
    fetchSubjects()
    fetchAcademicYears()
    fetchAcademicPeriods()
    fetchStudents()
  }, [fetchSchools, fetchCourses, fetchSubjects, fetchAcademicYears, fetchAcademicPeriods, fetchStudents])

  // Load saved filters
  const defaultValues: FilterValues = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? JSON.parse(saved)
      : {
          schoolId: '',
          academicYearId: '',
          academicPeriodId: '',
          courseId: '',
          classId: '',
          subjectId: '',
        }
  }, [])

  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues,
  })

  // --- Watchers ---
  const schoolId = form.watch('schoolId')
  const academicYearId = form.watch('academicYearId')
  const academicPeriodId = form.watch('academicPeriodId')
  const courseId = form.watch('courseId')
  const classId = form.watch('classId')
  const subjectId = form.watch('subjectId')

  // --- Persistent Storage ---
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    })
    return () => subscription.unsubscribe()
  }, [form])

  // --- Safe Arrays ---
  const safeSchools = Array.isArray(schools) ? schools : []
  const safeAcademicYears = Array.isArray(academicYears) ? academicYears : []
  const safeCourses = Array.isArray(courses) ? courses : []
  const safeSubjects = Array.isArray(subjects) ? subjects : []
  const safeStudents = Array.isArray(students) ? students : []
  const safeGrades = Array.isArray(grades) ? grades : []

  // --- Derived Options ---
  
  // Filtrar períodos por ano letivo
  const filteredPeriods = useMemo(() => {
    if (!academicYearId) return []
    return (Array.isArray(academicPeriods) ? academicPeriods : []).filter(
      (p) => p.academic_year_id?.toString() === academicYearId
    )
  }, [academicPeriods, academicYearId])

  // Buscar turmas quando escola e ano são selecionados
  useEffect(() => {
    const fetchClasses = async () => {
      if (schoolId && academicYearId) {
        setClassesLoading(true)
        try {
          const classesData = await classService.getBySchool(parseInt(schoolId))
          // Filtrar turmas pelo ano letivo
          const filteredClasses = (classesData || []).filter(
            (c) => c.academic_year_id?.toString() === academicYearId
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
  }, [schoolId, academicYearId])

  // Filtrar turmas por curso
  const filteredClasses = useMemo(() => {
    if (!courseId) return classes
    return classes.filter((c) => c.course_id?.toString() === courseId)
  }, [classes, courseId])

  // --- Reset Effects for Dependent Fields ---
  useEffect(() => {
    if (schoolId) {
      const validYear = safeAcademicYears.find((y) => y.id.toString() === academicYearId)
      if (!validYear && academicYearId) form.setValue('academicYearId', '')
    } else {
      if (academicYearId) form.setValue('academicYearId', '')
    }
  }, [schoolId, academicYearId, safeAcademicYears, form])

  useEffect(() => {
    if (academicYearId) {
      const validPeriod = filteredPeriods.find((p) => p.id.toString() === academicPeriodId)
      if (!validPeriod && academicPeriodId) form.setValue('academicPeriodId', '')
    } else {
      if (academicPeriodId) form.setValue('academicPeriodId', '')
    }
  }, [academicYearId, academicPeriodId, filteredPeriods, form])

  useEffect(() => {
    if (courseId) {
      const validClass = filteredClasses.find((c) => c.id.toString() === classId)
      if (!validClass && classId) form.setValue('classId', '')
    } else {
      if (classId) form.setValue('classId', '')
    }
  }, [courseId, classId, filteredClasses, form])

  useEffect(() => {
    const validSubject = safeSubjects.find((s) => s.id.toString() === subjectId)
    if (!validSubject && subjectId) form.setValue('subjectId', '')
  }, [subjectId, safeSubjects, form])

  // --- Load Grades Data ---
  const loadData = useCallback(async () => {
    if (!classId || !subjectId || !academicPeriodId) return

    setLoading(true)
    try {
      // Buscar matrículas da turma
      const enrollmentsData = await enrollmentService.getEnrollmentsByClass(parseInt(classId))
      setEnrollments(enrollmentsData || [])

      // Buscar notas existentes
      await fetchClassGrades(parseInt(classId))

      // Inicializar studentGrades com notas existentes
      const currentGrades: Record<number, number | string> = {}
      
      enrollmentsData?.forEach((enrollment: any) => {
        const studentProfileId = enrollment.student_profile_id || enrollment.student_id
        if (!studentProfileId) return

        // Buscar nota do aluno
        const grade = safeGrades.find(
          (g) =>
            g.student_profile_id === studentProfileId &&
            g.evaluation_instance?.class_teacher_subject?.class_id?.toString() === classId &&
            g.evaluation_instance?.class_teacher_subject?.subject_id?.toString() === subjectId
        )
        
        if (grade) {
          currentGrades[studentProfileId] = grade.grade_value || ''
        }
      })

      setStudentGrades(currentGrades)
    } catch {
      toast.error('Erro ao carregar notas')
    } finally {
      setLoading(false)
    }
  }, [classId, subjectId, academicPeriodId, fetchClassGrades, safeGrades])

  // Trigger load when filters are complete
  useEffect(() => {
    const basicFilters =
      schoolId &&
      academicYearId &&
      academicPeriodId &&
      courseId &&
      classId &&
      subjectId

    if (basicFilters) {
      loadData()
    } else {
      setStudentGrades({})
      setEnrollments([])
    }
  }, [schoolId, academicYearId, academicPeriodId, courseId, classId, subjectId, loadData])

  const handleGradeChange = useCallback(
    (studentId: number, value: string | number) => {
      setStudentGrades((prev) => ({ ...prev, [studentId]: value }))
    },
    [],
  )

  const handleSave = async () => {
    const values = form.getValues()

    setLoading(true)
    let savedCount = 0

    try {
      // Buscar instâncias de avaliação existentes para esta turma
      const classIdNum = parseInt(values.classId)
      const existingInstances = await evaluationInstanceService.getByClass(classIdNum)
      
      // Filtrar por disciplina se possível
      const instancesForSubject = existingInstances.filter((inst) => {
        const cts = inst.class_teacher_subject
        return cts?.subject_id?.toString() === values.subjectId
      })

      // Usar a primeira instância encontrada ou criar uma nova se necessário
      let evaluationInstanceId: number | null = null
      
      if (instancesForSubject.length > 0) {
        // Usar a instância mais recente para esta disciplina
        evaluationInstanceId = instancesForSubject[0]?.id || null
      } else if (existingInstances.length > 0) {
        // Usar a primeira instância da turma (pode ser de outra disciplina)
        evaluationInstanceId = existingInstances[0]?.id || null
      }

      // Se não houver instância, criar uma nova
      // TODO: Implementar criação de instância de avaliação quando class_teacher_subject estiver disponível
      if (!evaluationInstanceId) {
        toast.warning(
          'Instância de avaliação não encontrada. ' +
          'Por favor, crie uma alocação de professor para esta turma/disciplina primeiro.'
        )
        return
      }

      for (const enrollment of enrollments) {
        const studentProfileId = enrollment.student_profile_id || enrollment.student_id
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

          // O saveGrade já verifica se existe e atualiza automaticamente
          await saveGrade(gradeData)
          savedCount++
        } catch {
          toast.error(`Erro ao salvar nota do aluno ${studentProfileId}`)
        }
      }

      if (savedCount > 0) {
        toast.success(`${savedCount} nota(s) salva(s) com sucesso!`)
        await loadData() // Recarregar dados
      } else {
        toast.warning('Nenhuma nota foi salva.')
      }
    } catch {
      toast.error('Erro ao salvar notas')
    } finally {
      setLoading(false)
    }
  }

  // Filtered students for rendering
  const filteredStudents = useMemo(() => {
    if (!classId || !enrollments.length) return []

    return enrollments
      .map((enrollment) => {
        const studentProfileId = enrollment.student_profile_id || enrollment.student_id
        const student = safeStudents.find((s) => s.id === studentProfileId)
        return student
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const nameA = `${a.first_name || a.person?.first_name || ''} ${a.last_name || a.person?.last_name || ''}`
        const nameB = `${b.first_name || b.person?.first_name || ''} ${b.last_name || b.person?.last_name || ''}`
        return nameA.localeCompare(nameB)
      })
  }, [enrollments, safeStudents, classId])

  const isConfigComplete =
    schoolId &&
    academicYearId &&
    academicPeriodId &&
    courseId &&
    classId &&
    subjectId

  const isNumeric = true // TODO: buscar do tipo de avaliação
  const maxGrade = 10 // TODO: buscar da regra de avaliação

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
          <Form {...form}>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        disabled={schoolsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {safeSchools.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                        disabled={!schoolId || yearsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {safeAcademicYears.map((y) => (
                            <SelectItem key={y.id} value={y.id.toString()}>
                              {y.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 3. Academic Period */}
                <FormField
                  control={form.control}
                  name="academicPeriodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!academicYearId || periodsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredPeriods.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 4. Course */}
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curso</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!academicYearId || coursesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {safeCourses.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 5. Class */}
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turma</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!courseId || classesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classesLoading ? (
                            <div className="flex justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            filteredClasses.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 6. Subject */}
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disciplina</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!courseId || coursesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {safeSubjects.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Grid Display */}
      {isConfigComplete ? (
        <Card className="animate-fade-in-up relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-white border-purple-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between relative z-10">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-100 to-purple-200">
                  <Save className="h-4 w-4 text-purple-600" />
                </div>
                Diário de Classe
              </CardTitle>
              <CardDescription>
                {filteredStudents.length} aluno(s) listado(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <RequirePermission permission="create:assessment">
                <Button 
                  onClick={handleSave} 
                  disabled={loading || studentsLoading || gradesLoading} 
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <div className="p-0.5 rounded-md bg-white/20 mr-2">
                      <Save className="h-4 w-4" />
                    </div>
                  )}
                  Salvar Notas
                </Button>
              </RequirePermission>
            </div>
          </CardHeader>
          <CardContent>
            {loading || studentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="flex gap-4">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Nenhum aluno encontrado nesta turma.</p>
                <p className="text-sm mt-2">Verifique se há alunos matriculados na turma selecionada.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student: any) => (
                  <StudentRow
                    key={`student-${student.id}`}
                    student={student}
                    value={studentGrades[student.id]}
                    max={maxGrade}
                    isNumeric={isNumeric}
                    onChange={handleGradeChange}
                  />
                ))}

                <div className="flex justify-end pt-6 sticky bottom-4">
                  <RequirePermission permission="create:assessment">
                    <Button 
                      size="lg" 
                      onClick={handleSave} 
                      disabled={loading}
                      className="shadow-lg bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Salvar Alterações
                    </Button>
                  </RequirePermission>
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
          <p className="text-sm mt-2">
            Configure escola, ano letivo, período, curso, turma e disciplina.
          </p>
        </div>
      )}
    </div>
  )
}
