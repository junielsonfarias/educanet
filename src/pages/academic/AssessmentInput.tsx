import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

const filterSchema = z.object({
  schoolId: z.string().min(1, 'Selecione a escola'),
  academicYearId: z.string().min(1, 'Selecione o ano letivo'),
  classId: z.string().min(1, 'Selecione a turma'),
  periodId: z.string().min(1, 'Selecione o período'),
  subjectId: z.string().min(1, 'Selecione a disciplina'),
  category: z.enum(['regular', 'recuperation']).default('regular'),
  assessmentTypeId: z.string().optional(),
})

export default function AssessmentInput() {
  const { schools } = useSchoolStore()
  const { courses, evaluationRules } = useCourseStore()
  const { students } = useStudentStore()
  const { assessments, addAssessment, assessmentTypes } = useAssessmentStore()
  const { toast } = useToast()

  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [studentGrades, setStudentGrades] = useState<
    Record<string, number | string>
  >({})

  const form = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      schoolId: '',
      academicYearId: '',
      classId: '',
      periodId: '',
      subjectId: '',
      category: 'regular',
      assessmentTypeId: '',
    },
  })

  // Watchers for Dependent Dropdowns
  const schoolId = form.watch('schoolId')
  const academicYearId = form.watch('academicYearId')
  const classId = form.watch('classId')
  const category = form.watch('category')

  const selectedSchool = schools.find((s) => s.id === schoolId)
  const academicYears = selectedSchool?.academicYears || []
  const selectedYear = academicYears.find((y) => y.id === academicYearId)
  const periods = selectedYear?.periods || []
  const classes = selectedYear?.classes || []

  // Logic to find subjects based on class -> grade -> course
  const currentClass = classes.find((c) => c.id === classId)
  const allGrades = courses.flatMap((c) =>
    c.grades.map((g) => ({ ...g, courseId: c.id })),
  )
  const classGrade = allGrades.find((g) => g.id === currentClass?.gradeId)
  const subjects = classGrade?.subjects || []
  const evaluationRule = evaluationRules.find(
    (r) => r.id === classGrade?.evaluationRuleId,
  )

  // Filter assessment types applicable to this grade
  const availableAssessmentTypes = assessmentTypes.filter(
    (type) => classGrade && type.applicableGradeIds.includes(classGrade.id),
  )

  const handleFilter = (data: z.infer<typeof filterSchema>) => {
    setSelectedClass(currentClass)
    setSelectedSubject(subjects.find((s) => s.id === data.subjectId))

    // Load existing grades
    const currentGrades: Record<string, number | string> = {}

    // Simplification for mock: match by school
    const classStudents = students.filter((s) => {
      const enrollment = s.enrollments.find((e) => e.status === 'Cursando')
      return enrollment && enrollment.schoolId === data.schoolId
    })

    classStudents.forEach((student) => {
      // If we are in regular mode, we find the regular assessment
      // If we are in recuperation mode, we find the recuperation assessment
      // We match by TYPE if provided
      const assessment = assessments.find(
        (a) =>
          a.studentId === student.id &&
          a.classroomId === data.classId &&
          a.subjectId === data.subjectId &&
          a.periodId === data.periodId &&
          (a.category || 'regular') === data.category &&
          (data.assessmentTypeId
            ? a.assessmentTypeId === data.assessmentTypeId
            : true),
      )
      if (assessment) {
        currentGrades[student.id] = assessment.value
      }
    })
    setStudentGrades(currentGrades)
  }

  const handleGradeChange = (studentId: string, value: string | number) => {
    setStudentGrades((prev) => ({ ...prev, [studentId]: value }))
  }

  const handleSave = () => {
    const values = form.getValues()

    const classStudents = students.filter((s) => {
      const enrollment = s.enrollments.find((e) => e.status === 'Cursando')
      return enrollment && enrollment.schoolId === values.schoolId
    })

    classStudents.forEach((student) => {
      const value = studentGrades[student.id]
      if (value !== undefined && value !== '') {
        // Automatic Linking Logic for Recuperation
        let relatedAssessmentId: string | undefined = undefined

        if (
          values.category === 'recuperation' &&
          values.assessmentTypeId &&
          values.assessmentTypeId !== ''
        ) {
          // Find the regular assessment of the SAME type in the SAME period
          const related = assessments.find(
            (a) =>
              a.studentId === student.id &&
              a.periodId === values.periodId &&
              a.subjectId === values.subjectId &&
              a.assessmentTypeId === values.assessmentTypeId &&
              (a.category || 'regular') === 'regular',
          )
          if (related) {
            relatedAssessmentId = related.id
          }
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
      }
    })

    toast({
      title: 'Avaliações Salvas',
      description: 'As notas foram registradas com sucesso.',
    })
  }

  const filteredStudents = selectedClass
    ? students.filter((s) => {
        return s.enrollments.some(
          (e) => e.schoolId === schoolId && e.status === 'Cursando',
        )
      })
    : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Lançamento de Avaliações
        </h2>
        <p className="text-muted-foreground">
          Registro de notas e pareceres por turma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione a Turma e Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFilter)}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <FormField
                control={form.control}
                name="schoolId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
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
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplina</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!classId}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="periodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período (Bimestre)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">
                          Avaliação Regular
                        </SelectItem>
                        <SelectItem value="recuperation">
                          Recuperação
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assessmentTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipo de Avaliação {category === 'recuperation' && '*'}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
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
                    {category === 'recuperation' && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        * Selecione o tipo da avaliação regular que será
                        recuperada (ex: Prova Bimestral).
                      </p>
                    )}
                  </FormItem>
                )}
              />
              <div className="flex items-end col-span-1 md:col-span-2 lg:col-span-3">
                <Button type="submit" className="w-full">
                  Carregar Diário
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {selectedClass && selectedSubject && (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Lançamento: {selectedSubject.name}</span>
              <div className="flex gap-2">
                <Badge variant="secondary">{evaluationRule?.name}</Badge>
                <Badge
                  variant={
                    form.getValues('category') === 'regular'
                      ? 'default'
                      : 'destructive'
                  }
                >
                  {form.getValues('category') === 'regular'
                    ? 'Regular'
                    : 'Recuperação'}
                </Badge>
                {form.getValues('assessmentTypeId') && (
                  <Badge
                    variant="outline"
                    className="border-primary text-primary"
                  >
                    {
                      assessmentTypes.find(
                        (t) => t.id === form.getValues('assessmentTypeId'),
                      )?.name
                    }
                  </Badge>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {selectedClass.name} -{' '}
              {form.getValues('periodId')
                ? periods.find((p) => p.id === form.getValues('periodId'))?.name
                : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                Nenhum aluno encontrado nesta turma.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-secondary/10"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{student.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Matrícula: {student.registration}
                      </span>
                    </div>
                    <div className="w-full sm:w-[200px]">
                      {evaluationRule?.type === 'numeric' ? (
                        <Input
                          type="number"
                          min={evaluationRule.minGrade}
                          max={evaluationRule.maxGrade}
                          step="0.1"
                          placeholder="Nota (0-10)"
                          value={studentGrades[student.id] || ''}
                          onChange={(e) =>
                            handleGradeChange(
                              student.id,
                              parseFloat(e.target.value),
                            )
                          }
                        />
                      ) : (
                        <Textarea
                          placeholder="Parecer descritivo..."
                          value={studentGrades[student.id] || ''}
                          onChange={(e) =>
                            handleGradeChange(student.id, e.target.value)
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Button size="lg" onClick={handleSave}>
                    Salvar Avaliações
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
