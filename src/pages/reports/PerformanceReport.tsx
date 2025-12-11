import { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { FileDown, Filter } from 'lucide-react'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'
import useStudentStore from '@/stores/useStudentStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import { calculateGrades } from '@/lib/grade-calculator'

export default function PerformanceReport() {
  const { schools } = useSchoolStore()
  const { courses, evaluationRules } = useCourseStore()
  const { students } = useStudentStore()
  const { assessments, assessmentTypes } = useAssessmentStore()

  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')

  const activeSchool = schools.find((s) => s.id === selectedSchool)
  const academicYears = activeSchool?.academicYears || []
  const activeYear = academicYears.find((y) => y.id === selectedYear)

  const generateReport = () => {
    if (!activeSchool || !activeYear) return []

    const reportData: any[] = []

    activeYear.classes.forEach((cls) => {
      // Find students in this class
      const classStudents = students.filter((s) => {
        const enrollment = s.enrollments.find(
          (e) =>
            e.schoolId === activeSchool.id &&
            e.year.toString() === activeYear.name && // Simple year match
            e.grade === cls.name, // Simple class match
        )
        return !!enrollment
      })

      // Find grade/course info
      const grade = courses
        .flatMap((c) => c.grades)
        .find((g) => g.id === cls.gradeId)

      if (!grade) return

      const rule = evaluationRules.find((r) => r.id === grade.evaluationRuleId)
      if (!rule) return

      classStudents.forEach((student) => {
        // Calculate per subject
        const studentStats = {
          passed: 0,
          failed: 0,
          total: 0,
          avg: 0,
        }

        let gradeSum = 0

        grade.subjects.forEach((subject) => {
          const subjectAssessments = assessments.filter(
            (a) =>
              a.studentId === student.id &&
              a.subjectId === subject.id &&
              a.yearId === activeYear.id,
          )

          const calculation = calculateGrades(
            subjectAssessments,
            rule,
            activeYear.periods || [],
            assessmentTypes,
          )

          if (calculation.isPassing) {
            studentStats.passed++
          } else {
            studentStats.failed++
          }
          studentStats.total++
          gradeSum += calculation.finalGrade
        })

        if (studentStats.total > 0) {
          studentStats.avg = gradeSum / studentStats.total
        }

        reportData.push({
          studentName: student.name,
          className: cls.name,
          passedSubjects: studentStats.passed,
          failedSubjects: studentStats.failed,
          overallAverage: studentStats.avg.toFixed(1),
          status: studentStats.failed === 0 ? 'Aprovado' : 'Em Risco',
        })
      })
    })

    return reportData
  }

  const reportData = generateReport()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Relatório de Desempenho
        </h2>
        <p className="text-muted-foreground">
          Análise de aprovação e desempenho por turma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecione a escola e o ano letivo para gerar os indicadores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Escola</label>
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano Letivo</label>
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
                disabled={!selectedSchool}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" disabled={!selectedYear}>
                <Filter className="mr-2 h-4 w-4" /> Atualizar Dados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <Card className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Resultados Consolidados</CardTitle>
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="text-center">Disc. Aprovadas</TableHead>
                  <TableHead className="text-center">
                    Disc. Reprovadas
                  </TableHead>
                  <TableHead className="text-center">Média Geral</TableHead>
                  <TableHead className="text-center">Status Geral</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {row.studentName}
                    </TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell className="text-center text-green-600 font-medium">
                      {row.passedSubjects}
                    </TableCell>
                    <TableCell className="text-center text-red-600 font-medium">
                      {row.failedSubjects}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {row.overallAverage}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.status === 'Aprovado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
