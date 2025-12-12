import { useState, useMemo } from 'react'
import { Search, AlertTriangle, AlertCircle } from 'lucide-react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import useStudentStore from '@/stores/useStudentStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useCourseStore from '@/stores/useCourseStore'
import useSchoolStore from '@/stores/useSchoolStore'
import { calculateGrades } from '@/lib/grade-calculator'
import { ReportCardDisplay } from './components/ReportCardDisplay'
import {
  ReportCardData,
  GradeData,
  RecoveryGradeData,
  EvaluationTypeData,
  EvaluationEntry,
  HistoryEntry,
} from './components/types'
import { format } from 'date-fns'

export default function ReportCard() {
  const [searchRegistration, setSearchRegistration] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedGradeName, setSelectedGradeName] = useState('')
  const [result, setResult] = useState<ReportCardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'error' | 'warning'>('error')

  const { students } = useStudentStore()
  const { assessments, assessmentTypes } = useAssessmentStore()
  const { courses, evaluationRules } = useCourseStore()
  const { schools } = useSchoolStore()

  const activeSchool = schools.find((s) => s.id === selectedSchool)
  const academicYears = activeSchool?.academicYears || []
  const activeYear = academicYears.find((y) => y.id === selectedYear)

  const availableGrades = useMemo(() => {
    if (!activeYear || !selectedSchool) return []

    const validGradeNames = new Set<string>()
    const classMap = new Map<string, string>()

    // Map classes to grade names
    activeYear.classes.forEach((c) => {
      if (c.gradeName) {
        classMap.set(c.name, c.gradeName)
      }
    })

    // Filter students with active regular enrollments in this school/year
    students.forEach((student) => {
      student.enrollments.forEach((e) => {
        if (
          e.schoolId === selectedSchool &&
          e.year.toString() === activeYear.name &&
          e.type === 'regular' &&
          ['Cursando', 'Aprovado', 'Reprovado'].includes(e.status)
        ) {
          const gradeName = classMap.get(e.grade)
          if (gradeName) {
            validGradeNames.add(gradeName)
          }
        }
      })
    })

    return Array.from(validGradeNames).sort()
  }, [activeYear, selectedSchool, students])

  const calculateSubjectGrades = (
    subjects: any[],
    studentId: string,
    yearId: string,
    classId: string,
    rule: any,
    periods: any[],
    isYearActive: boolean,
  ): {
    grades: GradeData[]
    recoveries: RecoveryGradeData[]
    evaluationTypes: EvaluationTypeData[]
    history: HistoryEntry[]
  } => {
    const grades: GradeData[] = []
    const recoveries: RecoveryGradeData[] = []
    const history: HistoryEntry[] = []
    const allAssessments: {
      typeId: string
      subject: string
      periodName: string
      value: number
    }[] = []

    subjects.forEach((subject: any) => {
      const subjectAssessments = assessments.filter(
        (a) =>
          a.studentId === studentId &&
          a.subjectId === subject.id &&
          yearId === a.yearId &&
          a.classroomId === classId,
      )

      // Collect Raw History
      subjectAssessments.forEach((a) => {
        const type = assessmentTypes.find((t) => t.id === a.assessmentTypeId)
        const period = periods.find((p: any) => p.id === a.periodId)

        const recovery = assessments.find(
          (rec) => rec.relatedAssessmentId === a.id,
        )

        if ((a.category || 'regular') === 'regular') {
          history.push({
            id: a.id,
            date: a.date,
            subject: subject.name,
            period: period?.name || 'N/A',
            type: type?.name || 'Avaliação',
            category: 'regular',
            value: Number(a.value),
            originalValue: Number(a.value),
            isRecovered: !!recovery,
            recoveryValue: recovery ? Number(recovery.value) : undefined,
          })
        } else {
          // Unlinked recovery (e.g. Period Recovery)
          if (!a.relatedAssessmentId) {
            history.push({
              id: a.id,
              date: a.date,
              subject: subject.name,
              period: period?.name || 'N/A',
              type: type?.name || 'Recuperação',
              category: 'recuperation',
              value: Number(a.value),
            })
          }
        }
      })

      // Collect raw assessments for other evaluations display
      subjectAssessments.forEach((a) => {
        if (
          a.assessmentTypeId &&
          (a.category || 'regular') !== 'recuperation'
        ) {
          const p = periods.find((pr: any) => pr.id === a.periodId)
          if (p) {
            allAssessments.push({
              typeId: a.assessmentTypeId,
              subject: subject.name,
              periodName: p.name,
              value: Number(a.value),
            })
          }
        }
      })

      const calculation = calculateGrades(
        subjectAssessments,
        rule,
        periods,
        assessmentTypes,
      )

      // Main Grades Data
      grades.push({
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
      })

      // Recovery Data
      recoveries.push({
        subject: subject.name,
        periodGrades: periods.map((p: any) => {
          const pRes = calculation.periodResults.find(
            (pr) => pr.periodId === p.id,
          )
          return pRes && pRes.recoveryGrade !== null ? pRes.recoveryGrade : null
        }),
      })
    })

    // Group Other Evaluations
    const evaluationTypes: EvaluationTypeData[] = []
    const groupedByType = new Map<string, EvaluationEntry[]>()

    allAssessments.forEach((a) => {
      const existing = groupedByType.get(a.typeId) || []
      existing.push({
        subject: a.subject,
        periodName: a.periodName,
        value: a.value,
      })
      groupedByType.set(a.typeId, existing)
    })

    groupedByType.forEach((entries, typeId) => {
      const type = assessmentTypes.find((t) => t.id === typeId)
      if (type && type.excludeFromAverage) {
        evaluationTypes.push({
          id: type.id,
          name: type.name,
          excludeFromAverage: type.excludeFromAverage || false,
          entries,
        })
      }
    })

    return { grades, recoveries, evaluationTypes, history }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorType('error')
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
      setError('Número de matrícula inválido ou não encontrado.')
      return
    }

    // Check for Regular Enrollment in Selected Criteria
    const regularEnrollment = student.enrollments.find((e) => {
      if (e.schoolId !== selectedSchool) return false
      if (e.year.toString() !== activeYear?.name) return false
      if (e.type !== 'regular') return false

      const cls = activeYear?.classes.find((c) => c.name === e.grade)
      return cls && cls.gradeName === selectedGradeName
    })

    if (regularEnrollment) {
      const school = schools.find((s) => s.id === regularEnrollment.schoolId)
      const academicYear = school?.academicYears.find(
        (y) => y.name === regularEnrollment.year.toString(),
      )
      const classroom = academicYear?.classes.find(
        (c) => c.name === regularEnrollment.grade,
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
      const {
        grades: reportCardGrades,
        recoveries: reportCardRecoveries,
        evaluationTypes: reportCardEvaluations,
        history: reportCardHistory,
      } = calculateSubjectGrades(
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
      let dependencyHistory: HistoryEntry[] = []

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
          const {
            grades: depGrades,
            recoveries: depRecoveries,
            evaluationTypes: depEvaluations,
            history: depHist,
          } = calculateSubjectGrades(
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
            recoveries: depRecoveries,
            evaluationTypes: depEvaluations,
            ruleName: depRule.name,
          })
          dependencyHistory = [...dependencyHistory, ...depHist]
        }
      }

      const fullHistory = [...reportCardHistory, ...dependencyHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )

      setResult({
        name: student.name,
        registration: student.registration,
        school: school?.name || '',
        schoolLogo: school?.logo,
        grade: regularEnrollment.grade,
        year: regularEnrollment.year,
        ruleName: regularRule.name,
        grades: reportCardGrades,
        recoveries: reportCardRecoveries,
        evaluationTypes: reportCardEvaluations,
        periodNames: periods.map((p) => p.name),
        dependencies: dependenciesData,
        history: fullHistory,
        generatedAt: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
      })
      return
    }

    // Check for Dependency in Selected Series (for better error message)
    const dependencyEnrollment = student.enrollments.find((e) => {
      if (e.schoolId !== selectedSchool) return false
      if (e.year.toString() !== activeYear?.name) return false
      if (e.type !== 'dependency') return false

      const cls = activeYear?.classes.find((c) => c.name === e.grade)
      return cls && cls.gradeName === selectedGradeName
    })

    if (dependencyEnrollment) {
      const actualRegular = student.enrollments.find(
        (e) =>
          e.schoolId === selectedSchool &&
          e.year.toString() === activeYear?.name &&
          e.type === 'regular',
      )

      let suggestion = ''
      if (actualRegular) {
        const cls = activeYear?.classes.find(
          (c) => c.name === actualRegular.grade,
        )
        const regName = cls?.gradeName || actualRegular.grade
        suggestion = ` Por favor, verifique a série de matrícula regular do aluno (${regName}).`
      } else {
        suggestion =
          ' Por favor, verifique a série de matrícula regular do aluno.'
      }

      setError(
        `O aluno possui matrícula em regime de dependência nesta série, mas não uma matrícula regular.${suggestion}`,
      )
      setErrorType('warning')
      return
    }

    // Generic Error
    setError(
      'Nenhuma matrícula ativa encontrada para o aluno nesta escola, ano letivo e série.',
    )
  }

  return (
    <div className="min-h-screen bg-secondary/30 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto space-y-8 print:max-w-none print:space-y-0">
        <div className="text-center space-y-2 print:hidden">
          <h1 className="text-3xl font-bold text-primary">
            Boletim Escolar Online
          </h1>
          <p className="text-muted-foreground">
            Consulte o desempenho escolar do aluno
          </p>
        </div>

        <Card className="print:hidden">
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
                    disabled={!selectedYear || availableGrades.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          availableGrades.length === 0 && selectedYear
                            ? 'Nenhuma série disponível'
                            : 'Selecione a série'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGrades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedYear && availableGrades.length === 0 && (
                    <p className="text-xs text-muted-foreground text-amber-600">
                      Nenhuma série com matrículas regulares encontrada para
                      este ano letivo.
                    </p>
                  )}
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
                <Alert
                  variant={errorType === 'error' ? 'destructive' : 'default'}
                  className={
                    errorType === 'warning'
                      ? 'border-amber-500 text-amber-600 bg-amber-50'
                      : ''
                  }
                >
                  {errorType === 'error' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {errorType === 'error' ? 'Erro' : 'Atenção'}
                  </AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
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
