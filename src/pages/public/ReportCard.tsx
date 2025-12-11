import { useState } from 'react'
import { Search, Printer } from 'lucide-react'
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
import { EvaluationRule } from '@/lib/mock-data'

export default function ReportCard() {
  const [searchId, setSearchId] = useState('')
  const [result, setResult] = useState<any>(null)

  const { students } = useStudentStore()
  const { assessments } = useAssessmentStore()
  const { courses, evaluationRules } = useCourseStore()
  const { schools } = useSchoolStore()

  const calculateFinalGrade = (evaluations: number[], rule: EvaluationRule) => {
    if (!rule.formula) return null

    try {
      // Create context variables: eval1, eval2, etc.
      const context: Record<string, number> = {}
      evaluations.forEach((val, index) => {
        context[`eval${index + 1}`] = val
      })

      // Simple and safe parser for basic arithmetic expressions
      // Using Function constructor with limited scope for demo purposes
      // In production, use a math expression parser library
      const formula = rule.formula
      const keys = Object.keys(context)
      const values = Object.values(context)

      // Ensure all required variables are present (assuming up to periodCount)
      const periodCount = rule.periodCount || 4
      for (let i = 1; i <= periodCount; i++) {
        if (context[`eval${i}`] === undefined) {
          // If a grade is missing, we can treat as 0 or null.
          // Treating as 0 for calculation safety
          return 0
        }
      }

      const func = new Function(...keys, `return ${formula};`)
      return func(...values)
    } catch (e) {
      console.error('Error calculating grade', e)
      return 0
    }
  }

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
    // Assuming simple mock matching for class
    // In real app, enrollment links to classId
    const classroom = academicYear?.classes.find(
      (c) => c.name === enrollment.grade,
    )

    // Find Course Structure
    const allGrades = courses.flatMap((c) =>
      c.grades.map((g) => ({ ...g, courseId: c.id })),
    )
    const grade = allGrades.find(
      (g) =>
        g.name === enrollment.grade ||
        (classroom && g.id === classroom.gradeId),
    )

    if (!grade) return

    const rule = evaluationRules.find((r) => r.id === grade.evaluationRuleId)
    if (!rule) return

    // Process Grades
    const reportCardGrades = grade.subjects.map((subject) => {
      const subjectAssessments = assessments.filter(
        (a) => a.studentId === student.id && a.subjectId === subject.id,
      )

      // Group by period (assuming 4 periods for now based on mock data)
      const periods = academicYear?.periods || []
      const periodGrades: number[] = []

      periods.forEach((period) => {
        // Find regular assessment
        const regular = subjectAssessments.find(
          (a) =>
            a.periodId === period.id &&
            (a.category === 'regular' || !a.category),
        )
        // Find recuperation assessment
        const recuperation = subjectAssessments.find(
          (a) => a.periodId === period.id && a.category === 'recuperation',
        )

        // Logic: Substitute lowest evaluation grade with higher recuperation grade
        let finalValue = 0
        const regValue = regular ? Number(regular.value) : 0
        const recValue = recuperation ? Number(recuperation.value) : 0

        // If recuperation is higher, use it. Otherwise use regular.
        if (recValue > regValue) {
          finalValue = recValue
        } else {
          finalValue = regValue
        }

        periodGrades.push(finalValue)
      })

      // Calculate Final based on Formula
      let finalGrade = 0
      if (rule.type === 'numeric' && rule.formula) {
        finalGrade = calculateFinalGrade(periodGrades, rule) || 0
      } else if (rule.type === 'numeric') {
        // Fallback average
        const sum = periodGrades.reduce((a, b) => a + b, 0)
        finalGrade = periodGrades.length > 0 ? sum / periodGrades.length : 0
      }

      return {
        subject: subject.name,
        periods: periodGrades,
        final: finalGrade,
        passing: finalGrade >= (rule.passingGrade || 6.0),
      }
    })

    setResult({
      name: student.name,
      school: school?.name,
      grade: enrollment.grade,
      year: enrollment.year,
      ruleName: rule.name,
      grades: reportCardGrades,
      periodNames: academicYear?.periods.map((p) => p.name) || [
        '1º Bim',
        '2º Bim',
        '3º Bim',
        '4º Bim',
      ],
    })
  }

  return (
    <div className="min-h-screen bg-secondary/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">{result.name}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {result.school} • {result.grade} • {result.year}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold">Disciplina</TableHead>
                      {result.periodNames.map((p: string) => (
                        <TableHead key={p} className="text-center">
                          {p}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-bold">
                        Média Final
                      </TableHead>
                      <TableHead className="text-center">Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.grades.map((grade: any) => (
                      <TableRow key={grade.subject}>
                        <TableCell className="font-medium">
                          {grade.subject}
                        </TableCell>
                        {grade.periods.map((p: number, idx: number) => (
                          <TableCell key={idx} className="text-center">
                            {p.toFixed(1)}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold bg-muted/20">
                          {grade.final.toFixed(1)}
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
                            {grade.passing ? 'Aprovado' : 'Recuperação'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-xs text-muted-foreground text-center">
                * Regra de Avaliação Aplicada: {result.ruleName}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
