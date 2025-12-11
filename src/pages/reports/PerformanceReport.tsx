import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Printer, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'

export default function PerformanceReport() {
  const navigate = useNavigate()
  const { assessments } = useAssessmentStore()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const { courses } = useCourseStore()

  // Filters
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')

  // Helper Lists
  const allGrades = Array.from(
    new Set(
      courses.flatMap((c) => c.grades.map((g) => ({ id: g.id, name: g.name }))),
    ),
  ).filter(
    (v, i, a) => a.findIndex((t) => t.name === v.name) === i, // Dedup by name
  )

  const allSubjects = Array.from(
    new Set(courses.flatMap((c) => c.grades.flatMap((g) => g.subjects))),
  ).filter(
    (v, i, a) => a.findIndex((t) => t.name === v.name) === i, // Dedup by name
  )

  const allPeriods = Array.from(
    new Set(schools.flatMap((s) => s.academicYears.flatMap((y) => y.periods))),
  ).filter(
    (v, i, a) => a.findIndex((t) => t.name === v.name) === i, // Dedup by name
  )

  // Filter Data
  const filteredAssessments = assessments.filter((a) => {
    // Find context
    // This part is a bit tricky with flattened IDs, simplified matching for report
    // Assuming simple mock ID matching or comprehensive lookup
    // For subject and period, direct ID matching is best, but for Grade we need to find the class -> grade
    // Or we filter by what we can.

    let matchesGrade = true
    if (selectedGrade !== 'all') {
      // Find student grade
      const student = students.find((s) => s.id === a.studentId)
      // Check active enrollment
      const enrollment = student?.enrollments.find(
        (e) => e.status === 'Cursando',
      )
      // This matches grade NAME usually stored in enrollment
      // And selectedGrade is an ID from CourseStore
      const gradeObj = courses
        .flatMap((c) => c.grades)
        .find((g) => g.id === selectedGrade)
      if (enrollment && gradeObj) {
        matchesGrade = enrollment.grade === gradeObj.name
      } else {
        matchesGrade = false
      }
    }

    const matchesSubject =
      selectedSubject === 'all' || a.subjectId === selectedSubject
    const matchesPeriod =
      selectedPeriod === 'all' || a.periodId === selectedPeriod

    return matchesGrade && matchesSubject && matchesPeriod
  })

  // Aggregate by Student/Subject
  const aggregation: Record<
    string,
    { total: number; count: number; studentName: string; subjectName: string }
  > = {}

  filteredAssessments.forEach((a) => {
    if (typeof a.value === 'number') {
      const key = `${a.studentId}-${a.subjectId}`
      if (!aggregation[key]) {
        const student = students.find((s) => s.id === a.studentId)
        const subject = courses
          .flatMap((c) => c.grades.flatMap((g) => g.subjects))
          .find((s) => s.id === a.subjectId)

        aggregation[key] = {
          total: 0,
          count: 0,
          studentName: student?.name || 'Unknown',
          subjectName: subject?.name || 'Unknown',
        }
      }
      aggregation[key].total += a.value
      aggregation[key].count++
    }
  })

  const reportData = Object.values(aggregation).map((item) => ({
    ...item,
    average: (item.total / item.count).toFixed(1),
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/relatorios')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Relatório de Desempenho
          </h2>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Série" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Séries</SelectItem>
                {allGrades.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Disciplinas</SelectItem>
                {allSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Períodos</SelectItem>
                {allPeriods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados Consolidados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead className="text-right">Média Calculada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {row.studentName}
                  </TableCell>
                  <TableCell>{row.subjectName}</TableCell>
                  <TableCell className="text-right font-bold">
                    {row.average}
                  </TableCell>
                </TableRow>
              ))}
              {reportData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    Nenhum dado encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
