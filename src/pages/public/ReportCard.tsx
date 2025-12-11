import { useState } from 'react'
import { Search, Printer, Info } from 'lucide-react'
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

export default function ReportCard() {
  const [searchId, setSearchId] = useState('')
  const [result, setResult] = useState<any>(null)

  const { students } = useStudentStore()
  const { assessments, assessmentTypes } = useAssessmentStore()
  const { courses, evaluationRules } = useCourseStore()
  const { schools } = useSchoolStore()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Find Student
    const student = students.find((s) => s.registration === searchId)
    if (!student) {
      setResult(null)
      return
    }

    const enrollment = student.enrollments.find((e) => e.status === 'Cursando')
    if (!enrollment) {
      setResult(null)
      return
    }

    const school = schools.find((s) => s.id === enrollment.schoolId)
    const academicYear = school?.academicYears.find(
      (y) => y.name === enrollment.year.toString(),
    )
    const classroom = academicYear?.classes.find(
      (c) => c.name === enrollment.grade,
    )

    // Find Course Structure
    let gradeStructure: any = null
    let courseEvaluationRule: any = null

    for (const course of courses) {
      const g = course.grades.find(
        (gr) =>
          gr.name === enrollment.grade ||
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

    if (!gradeStructure || !courseEvaluationRule) return

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
      grade: enrollment.grade,
      year: enrollment.year,
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
              Informe o número da matrícula para visualizar o boletim.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <Input
                placeholder="Digite a matrícula (ex: EDU-2024001)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" /> Consultar
              </Button>
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
