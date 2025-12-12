import { useState, useMemo } from 'react'
import { Search, Printer, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import useStudentStore from '@/stores/useStudentStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useCourseStore from '@/stores/useCourseStore'
import useSchoolStore from '@/stores/useSchoolStore'
import { calculateGrades } from '@/lib/grade-calculator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'

export default function ReportCard() {
  const [searchRegistration, setSearchRegistration] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedGradeName, setSelectedGradeName] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const { students } = useStudentStore()
  const { assessments, assessmentTypes } = useAssessmentStore()
  const { courses, evaluationRules } = useCourseStore()
  const { schools } = useSchoolStore()

  // Helper lists for dropdowns
  const activeSchool = schools.find((s) => s.id === selectedSchool)
  const academicYears = activeSchool?.academicYears || []
  const activeYear = academicYears.find((y) => y.id === selectedYear)

  // Extract unique grade names from the selected year classes
  const availableGrades = useMemo(() => {
    if (!activeYear) return []
    const gradeNames = new Set(
      activeYear.classes.map((c) => c.gradeName).filter(Boolean),
    )
    return Array.from(gradeNames) as string[]
  }, [activeYear])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    // Validation
    if (
      !selectedSchool ||
      !selectedYear ||
      !selectedGradeName ||
      !searchRegistration
    ) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    // Find Student
    const student = students.find((s) => s.registration === searchRegistration)
    if (!student) {
      setError('Aluno não encontrado com a matrícula informada.')
      return
    }

    // Verify Enrollment matches criteria
    const enrollment = student.enrollments.find(
      (e) =>
        e.schoolId === selectedSchool &&
        activeYear?.name === e.year.toString() &&
        (e.grade === selectedGradeName || e.grade.includes(selectedGradeName)), // Loose match for simplicity or exact? User story asks for Grade
    )

    // Note: The dropdown selects "Grade Name" (e.g. 5º Ano), but enrollment might store "5º Ano A".
    // Usually enrollment stores the Class Name or Grade Name. In this mock, enrollment.grade seems to be Class Name.
    // Let's assume we match if the enrollment grade includes the selected grade name or matches class.
    // Better logic: Enrollment stores "grade" string which is Class Name. Class has "gradeName".
    // We should find if the student is enrolled in a class that belongs to the selected grade name.

    const relevantClass = activeYear?.classes.find(
      (c) =>
        c.gradeName === selectedGradeName &&
        (c.name === enrollment?.grade || enrollment?.grade.includes(c.name)),
    )
    // Or simpler: check if any enrollment matches
    const validEnrollment = student.enrollments.find((e) => {
      if (e.schoolId !== selectedSchool) return false
      if (e.year.toString() !== activeYear?.name) return false

      // Find class for this enrollment string
      const cls = activeYear?.classes.find((c) => c.name === e.grade)
      return cls && cls.gradeName === selectedGradeName
    })

    if (!validEnrollment) {
      setError('Aluno não matriculado na escola/ano/série selecionados.')
      return
    }

    const enrollmentData = validEnrollment
    const school = schools.find((s) => s.id === enrollmentData.schoolId)
    const academicYear = school?.academicYears.find(
      (y) => y.name === enrollmentData.year.toString(),
    )
    const classroom = academicYear?.classes.find(
      (c) => c.name === enrollmentData.grade,
    )

    // Find Course Structure
    let gradeStructure: any = null
    let courseEvaluationRule: any = null

    for (const course of courses) {
      const g = course.grades.find(
        (gr) =>
          gr.name === selectedGradeName || // Match selected grade name
          (classroom && gr.id === classroom.gradeId),
      )
      if (g) {
        gradeStructure = g
        courseEvaluationRule = evaluationRules.find(
          (r) => r.id === g.evaluationRuleId,
        )
        break
      }
    }

    if (!gradeStructure || !courseEvaluationRule) {
      setError('Erro na configuração curricular. Contate a escola.')
      return
    }

    const periods = academicYear?.periods || []

    // Process Grades using centralized calculator
    const reportCardGrades = gradeStructure.subjects.map((subject: any) => {
      const subjectAssessments = assessments.filter(
        (a) =>
          a.studentId === student.id &&
          a.subjectId === subject.id &&
          academicYear!.id === a.yearId,
      )

      const calculation = calculateGrades(
        subjectAssessments,
        courseEvaluationRule,
        periods,
        assessmentTypes,
      )

      return {
        subject: subject.name,
        periodGrades: periods.map((p) => {
          const pRes = calculation.periodResults.find(
            (pr) => pr.periodId === p.id,
          )
          return pRes ? pRes.finalPeriodGrade : 0
        }),
        final: calculation.finalGrade,
        status: calculation.status,
        passing: calculation.isPassing,
        formula: calculation.formulaUsed,
      }
    })

    setResult({
      name: student.name,
      school: school?.name,
      grade: enrollmentData.grade, // Display actual class name
      gradeName: selectedGradeName,
      year: enrollmentData.year,
      ruleName: courseEvaluationRule.name,
      grades: reportCardGrades,
      periodNames: periods.map((p) => p.name),
    })
  }

  return (
    <div className="min-h-screen bg-secondary/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">
            Boletim Escolar Online
          </h1>
          <p className="text-muted-foreground">
            Consulte o desempenho escolar do aluno
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Consultar Boletim</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para visualizar as notas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Escola</Label>
                  <Select
                    onValueChange={(val) => {
                      setSelectedSchool(val)
                      setSelectedYear('')
                      setSelectedGradeName('')
                    }}
                    value={selectedSchool}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a escola" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ano Letivo</Label>
                  <Select
                    onValueChange={(val) => {
                      setSelectedYear(val)
                      setSelectedGradeName('')
                    }}
                    value={selectedYear}
                    disabled={!selectedSchool}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Série/Ano</Label>
                  <Select
                    onValueChange={setSelectedGradeName}
                    value={selectedGradeName}
                    disabled={!selectedYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a série" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGrades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Matrícula do Aluno</Label>
                  <Input
                    placeholder="Ex: EDU-2024001"
                    value={searchRegistration}
                    onChange={(e) => setSearchRegistration(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 p-3 rounded-md flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    !selectedSchool ||
                    !selectedYear ||
                    !selectedGradeName ||
                    !searchRegistration
                  }
                >
                  <Search className="mr-2 h-4 w-4" /> Consultar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="animate-slide-up">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{result.name}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {result.school} • {result.grade} • {result.year}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold min-w-[200px]">
                        Disciplina
                      </TableHead>
                      {result.periodNames.map((p: string) => (
                        <TableHead key={p} className="text-center min-w-[80px]">
                          {p}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-bold min-w-[100px]">
                        Média Final
                      </TableHead>
                      <TableHead className="text-center min-w-[120px]">
                        Situação
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.grades.map((grade: any) => (
                      <TableRow key={grade.subject}>
                        <TableCell className="font-medium">
                          {grade.subject}
                        </TableCell>
                        {grade.periodGrades.map((p: number, idx: number) => (
                          <TableCell key={idx} className="text-center">
                            {p.toFixed(1)}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold bg-muted/20">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1 cursor-help">
                                {grade.final.toFixed(1)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Fórmula: {grade.formula}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={grade.passing ? 'default' : 'destructive'}
                            className={
                              grade.passing
                                ? 'bg-green-600 hover:bg-green-700'
                                : ''
                            }
                          >
                            {grade.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>
                  Regra de Avaliação Aplicada:{' '}
                  <strong>{result.ruleName}</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
