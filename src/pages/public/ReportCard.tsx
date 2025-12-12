import { useState, useMemo } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import useStudentStore from '@/stores/useStudentStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useCourseStore from '@/stores/useCourseStore'
import useSchoolStore from '@/stores/useSchoolStore'
import { calculateGrades } from '@/lib/grade-calculator'
import {
  ReportCardDisplay,
  ReportCardData,
  GradeData,
} from './components/ReportCardDisplay'

export default function ReportCard() {
  const [searchRegistration, setSearchRegistration] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedGradeName, setSelectedGradeName] = useState('')
  const [result, setResult] = useState<ReportCardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { students } = useStudentStore()
  const { assessments, assessmentTypes } = useAssessmentStore()
  const { courses, evaluationRules } = useCourseStore()
  const { schools } = useSchoolStore()

  const activeSchool = schools.find((s) => s.id === selectedSchool)
  const academicYears = activeSchool?.academicYears || []
  const activeYear = academicYears.find((y) => y.id === selectedYear)

  const availableGrades = useMemo(() => {
    if (!activeYear) return []
    const gradeNames = new Set(
      activeYear.classes.map((c) => c.gradeName).filter(Boolean),
    )
    return Array.from(gradeNames) as string[]
  }, [activeYear])

  const calculateSubjectGrades = (
    subjects: any[],
    studentId: string,
    yearId: string,
    classId: string,
    rule: any,
    periods: any[],
    isYearActive: boolean,
  ): GradeData[] => {
    return subjects.map((subject: any) => {
      const subjectAssessments = assessments.filter(
        (a) =>
          a.studentId === studentId &&
          a.subjectId === subject.id &&
          yearId === a.yearId &&
          a.classroomId === classId,
      )

      const calculation = calculateGrades(
        subjectAssessments,
        rule,
        periods,
        assessmentTypes,
      )

      return {
        subject: subject.name,
        periodGrades: periods.map((p: any) => {
          const pRes = calculation.periodResults.find(
            (pr) => pr.periodId === p.id,
          )
          return pRes ? pRes.finalPeriodGrade : 0
        }),
        final: calculation.finalGrade,
        status: isYearActive ? 'Cursando' : calculation.status,
        passing: calculation.isPassing,
        formula: calculation.formulaUsed,
      }
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (
      !selectedSchool ||
      !selectedYear ||
      !selectedGradeName ||
      !searchRegistration
    ) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    const student = students.find((s) => s.registration === searchRegistration)
    if (!student) {
      setError('Aluno não encontrado com a matrícula informada.')
      return
    }

    // Find Regular Enrollment
    const validEnrollment = student.enrollments.find((e) => {
      if (e.schoolId !== selectedSchool) return false
      if (e.year.toString() !== activeYear?.name) return false
      if (e.type !== 'regular') return false

      const cls = activeYear?.classes.find((c) => c.name === e.grade)
      return cls && cls.gradeName === selectedGradeName
    })

    if (!validEnrollment) {
      setError('Aluno não matriculado na escola/ano/série selecionados.')
      return
    }

    const school = schools.find((s) => s.id === validEnrollment.schoolId)
    const academicYear = school?.academicYears.find(
      (y) => y.name === validEnrollment.year.toString(),
    )
    const classroom = academicYear?.classes.find(
      (c) => c.name === validEnrollment.grade,
    )

    if (!academicYear || !classroom) {
      setError('Dados acadêmicos incompletos.')
      return
    }

    // Determine Regular Structure
    let regularGradeStructure: any = null
    let regularRule: any = null

    for (const course of courses) {
      const g = course.grades.find(
        (gr) =>
          gr.name === selectedGradeName ||
          (classroom && gr.id === classroom.gradeId),
      )
      if (g) {
        regularGradeStructure = g
        regularRule = evaluationRules.find((r) => r.id === g.evaluationRuleId)
        break
      }
    }

    if (!regularGradeStructure || !regularRule) {
      setError('Erro na configuração curricular.')
      return
    }

    const periods = academicYear.periods || []
    const isYearActive = academicYear.status === 'active'

    // Calculate Regular Grades
    const reportCardGrades = calculateSubjectGrades(
      regularGradeStructure.subjects,
      student.id,
      academicYear.id,
      classroom.id,
      regularRule,
      periods,
      isYearActive,
    )

    // Calculate Dependency Grades
    const dependencyEnrollments = student.enrollments.filter(
      (e) =>
        e.schoolId === selectedSchool &&
        e.year.toString() === activeYear?.name &&
        e.type === 'dependency',
    )

    const dependenciesData = []

    for (const depEnrollment of dependencyEnrollments) {
      const depClass = activeYear.classes.find(
        (c) => c.name === depEnrollment.grade,
      )
      if (!depClass) continue

      let depGradeStructure: any = null
      let depRule: any = null

      for (const course of courses) {
        const g = course.grades.find((gr) => gr.id === depClass.gradeId)
        if (g) {
          depGradeStructure = g
          depRule = evaluationRules.find((r) => r.id === g.evaluationRuleId)
          break
        }
      }

      if (!depGradeStructure || !depRule) continue

      // Filter subjects with assessments
      const activeSubjects = depGradeStructure.subjects.filter(
        (subject: any) => {
          return assessments.some(
            (a) =>
              a.studentId === student.id &&
              a.subjectId === subject.id &&
              a.classroomId === depClass.id &&
              a.yearId === academicYear.id,
          )
        },
      )

      if (activeSubjects.length > 0) {
        const depGrades = calculateSubjectGrades(
          activeSubjects,
          student.id,
          academicYear.id,
          depClass.id,
          depRule,
          periods,
          isYearActive,
        )

        dependenciesData.push({
          className: depClass.name,
          grades: depGrades,
          ruleName: depRule.name,
        })
      }
    }

    setResult({
      name: student.name,
      school: school?.name || '',
      grade: validEnrollment.grade,
      year: validEnrollment.year,
      ruleName: regularRule.name,
      grades: reportCardGrades,
      periodNames: periods.map((p) => p.name),
      dependencies: dependenciesData,
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

        {result && <ReportCardDisplay data={result} />}
      </div>
    </div>
  )
}
