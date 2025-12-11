import { useState, useEffect } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { GraduationCap } from 'lucide-react'
import { Student } from '@/lib/mock-data'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'

interface StudentPerformanceCardProps {
  student: Student
}

export function StudentPerformanceCard({
  student,
}: StudentPerformanceCardProps) {
  const { assessments } = useAssessmentStore()
  const { schools } = useSchoolStore()
  const { courses } = useCourseStore()
  const [selectedYear, setSelectedYear] = useState<string>('')

  // Get unique years from enrollments
  const years = Array.from(
    new Set(student.enrollments.map((e) => e.year)),
  ).sort((a, b) => b - a)

  // Default select most recent year
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[0].toString())
    }
  }, [years, selectedYear])

  const getPerformanceData = (yearStr: string) => {
    // 1. Find academic years (ids) that match the selected year string
    const relevantYearIds: string[] = []
    schools.forEach((school) => {
      school.academicYears.forEach((ay) => {
        if (ay.name === yearStr || ay.name.includes(yearStr)) {
          relevantYearIds.push(ay.id)
        }
      })
    })

    // 2. Filter assessments for student and year
    const relevantAssessments = assessments.filter(
      (a) =>
        a.studentId === student.id &&
        (relevantYearIds.includes(a.yearId) ||
          // Fallback if yearId matches directly (e.g., 'y2024' matches '2024' check)
          a.yearId.includes(yearStr)),
    )

    // 3. Group by Subject
    const subjectsMap = new Map<string, { regular: any[]; recovery: any[] }>()

    relevantAssessments.forEach((a) => {
      if (!subjectsMap.has(a.subjectId)) {
        subjectsMap.set(a.subjectId, { regular: [], recovery: [] })
      }
      const entry = subjectsMap.get(a.subjectId)!
      if (a.category === 'recuperation') {
        entry.recovery.push(a)
      } else {
        entry.regular.push(a)
      }
    })

    // 4. Calculate stats and format
    return Array.from(subjectsMap.entries()).map(([subjectId, data]) => {
      // Find Subject Name using Course Store
      let subjectName = 'Disciplina desconhecida'
      for (const course of courses) {
        for (const grade of course.grades) {
          const found = grade.subjects.find((s) => s.id === subjectId)
          if (found) {
            subjectName = found.name
            break
          }
        }
        if (subjectName !== 'Disciplina desconhecida') break
      }

      // Calculate Average (Simplified Logic)
      // Group by period to correctly apply recovery logic
      const periods = new Set(
        [...data.regular, ...data.recovery].map((a) => a.periodId),
      )
      let totalPeriodGrades = 0
      let periodCount = 0

      periods.forEach((periodId) => {
        const pRegular = data.regular.filter((a) => a.periodId === periodId)
        const pRecovery = data.recovery.filter((a) => a.periodId === periodId)

        let regularAvg = 0
        if (pRegular.length > 0) {
          const sum = pRegular.reduce(
            (acc, curr) =>
              acc + (typeof curr.value === 'number' ? curr.value : 0),
            0,
          )
          regularAvg = sum / pRegular.length
        }

        let periodGrade = regularAvg
        // Logic: Recovery replaces regular avg if higher
        if (pRecovery.length > 0) {
          const bestRecovery = Math.max(
            ...pRecovery.map((r) =>
              typeof r.value === 'number' ? r.value : 0,
            ),
          )
          if (bestRecovery > regularAvg) periodGrade = bestRecovery
        }

        if (pRegular.length > 0 || pRecovery.length > 0) {
          totalPeriodGrades += periodGrade
          periodCount++
        }
      })

      const finalAverage =
        periodCount > 0 ? (totalPeriodGrades / periodCount).toFixed(1) : '-'

      // Status based on average (Assuming 6.0 passing)
      const numAvg = parseFloat(finalAverage)
      const isPassing = !isNaN(numAvg) && numAvg >= 6.0

      return {
        subjectId,
        subjectName,
        regular: data.regular,
        recovery: data.recovery,
        finalAverage,
        isPassing,
      }
    })
  }

  const performanceData = selectedYear ? getPerformanceData(selectedYear) : []

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Desempenho Acadêmico
          </CardTitle>
          <CardDescription>
            Notas, avaliações e recuperações por ano letivo
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ano Letivo" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {performanceData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center bg-muted/20 rounded-md">
            Nenhum dado de avaliação encontrado para o ano selecionado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Disciplina</TableHead>
                <TableHead>Avaliações (Regulares)</TableHead>
                <TableHead>Recuperação</TableHead>
                <TableHead className="text-right">Média Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((data) => (
                <TableRow key={data.subjectId}>
                  <TableCell className="font-medium">
                    {data.subjectName}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {data.regular.length > 0 ? (
                        data.regular.map((a, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {a.value}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {data.recovery.length > 0 ? (
                        data.recovery.map((a, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs font-normal border-orange-200 text-orange-700 bg-orange-50"
                          >
                            {a.value}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-bold ${
                        data.finalAverage !== '-'
                          ? data.isPassing
                            ? 'text-green-600'
                            : 'text-red-600'
                          : ''
                      }`}
                    >
                      {data.finalAverage}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
