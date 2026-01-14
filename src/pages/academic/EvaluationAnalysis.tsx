import { useState, useMemo } from 'react'
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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  School as SchoolIcon,
  Download,
} from 'lucide-react'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useAssessmentStore } from '@/stores/useAssessmentStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { useToast } from '@/hooks/use-toast'

export default function EvaluationAnalysis() {
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const { assessments = [], assessmentTypes = [] } = useAssessmentStore()
  const { etapasEnsino } = useCourseStore()
  const { toast } = useToast()

  const [yearFilter, setYearFilter] = useState<string>('')
  const [schoolFilter, setSchoolFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Unique Years
  const uniqueYears = Array.from(
    new Set((schools || []).flatMap((s) => (s.academicYears || []).map((y) => y.name))),
  ).sort((a, b) => b.localeCompare(a))

  // Unique Grades based on selected school or all
  const availableGrades = useMemo(() => {
    let relevantSchools = schools || []
    if (schoolFilter !== 'all') {
      relevantSchools = (schools || []).filter((s) => s.id === schoolFilter)
    }
    const grades = new Set<string>()
    relevantSchools.forEach((s) => {
      (s.academicYears || []).forEach((y) => {
        if (!yearFilter || y.name === yearFilter) {
          const turmas = y.turmas || []
          turmas.forEach((c) => {
            if (c.serieAnoName) grades.add(c.serieAnoName)
          })
        }
      })
    })
    return Array.from(grades).sort()
  }, [schools, schoolFilter, yearFilter])

  // Calculation Logic
  const analysisData = useMemo(() => {
    if (!yearFilter) return []

    const result = []

    for (const student of students || []) {
      // Find relevant enrollments
      const enrollments = (student.enrollments || []).filter((e) => {
        // Year Filter
        if (e.year.toString() !== yearFilter) return false
        // School Filter
        if (schoolFilter !== 'all' && e.schoolId !== schoolFilter) return false
        // Grade Filter
        // Note: 'e.grade' is the Class Name, but we want to filter by Grade Name (e.g. 5º Ano)
        // We need to look up the class to get the grade name, or rely on naming convention if consistent
        // Better: look up school -> year -> class
        const school = (schools || []).find((s) => s.id === e.schoolId)
        const year = (school?.academicYears || []).find(
          (y) => y.name === e.year.toString(),
        )
        const turmas = year?.turmas || []
        const cls = turmas.find((c) => c.name === e.grade)

        if (gradeFilter !== 'all') {
          if (cls?.serieAnoName !== gradeFilter) return false
        }

        return true
      })

      for (const enrollment of enrollments) {
        // Calculate Grades
        // We want a consolidated score.
        // If Type Filter is ALL: Average of all FINAL subject grades (Standard Report Card Avg)
        // If Type Filter is SPECIFIC: Average of raw assessments of that type across all subjects

        const school = (schools || []).find((s) => s.id === enrollment.schoolId)
        const year = (school?.academicYears || []).find(
          (y) => y.name === enrollment.year.toString(),
        )
        const turmas = year?.turmas || []
        const cls = turmas.find((c) => c.name === enrollment.grade)

        if (!year || !cls) continue

        let totalScore = 0
        let count = 0
        let subjectsCount = 0
        let failingSubjects = 0

        // Find course structure
        const etapaEnsino = (etapasEnsino || []).find((e) =>
          (e.seriesAnos || []).some((s) => s.id === (cls.serieAnoId || cls.gradeId)),
        )
        const gradeStructure = (etapaEnsino?.seriesAnos || []).find((s) => s.id === (cls.serieAnoId || cls.gradeId))

        if (!gradeStructure) continue

        (gradeStructure.subjects || []).forEach((subject) => {
          subjectsCount++
          if (typeFilter === 'all') {
            // Calculate final grade for subject
            // Simplified calculation for analysis view (avg of assessments)
            // Real calc uses complex rules, for overview we can approximate or use stored values if we had them
            // Let's use simplified avg of period grades for performance speed
            const subjectAssessments = assessments.filter(
              (a) =>
                a.studentId === student.id &&
                a.subjectId === subject.id &&
                a.yearId === year.id &&
                (a.category || 'regular') === 'regular',
            )

            if (subjectAssessments.length > 0) {
              const sum = subjectAssessments.reduce(
                (acc, curr) => acc + Number(curr.value),
                0,
              )
              const avg = sum / subjectAssessments.length
              totalScore += avg
              count++
              if (avg < 6.0) failingSubjects++
            }
          } else {
            // Filter by specific type
            const typeAssessments = assessments.filter(
              (a) =>
                a.studentId === student.id &&
                a.subjectId === subject.id &&
                a.yearId === year.id &&
                a.assessmentTypeId === typeFilter,
            )

            if (typeAssessments.length > 0) {
              const sum = typeAssessments.reduce(
                (acc, curr) => acc + Number(curr.value),
                0,
              )
              const avg = sum / typeAssessments.length
              totalScore += avg
              count++
              if (avg < 6.0) failingSubjects++
            }
          }
        })

        const average = count > 0 ? totalScore / count : 0

        result.push({
          studentId: student.id,
          studentName: student.name,
          registration: student.registration,
          schoolName: school.name,
          gradeName: cls.serieAnoName || cls.gradeName || '',
          className: cls.name,
          averageScore: average,
          failingSubjects,
          dataPoints: count,
        })
      }
    }

    // Filter by Search Term
    return result.filter(
      (r) =>
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.registration.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [
    students,
    assessments,
    schools,
    etapasEnsino,
    yearFilter,
    schoolFilter,
    gradeFilter,
    typeFilter,
    searchTerm,
  ])

  // Statistics
  const stats = useMemo(() => {
    if (analysisData.length === 0) return null
    const totalStudents = analysisData.length
    const globalAvg =
      analysisData.reduce((acc, curr) => acc + curr.averageScore, 0) /
      totalStudents
    const lowPerformers = analysisData.filter((d) => d.averageScore < 6.0)
    const highPerformers = analysisData.filter((d) => d.averageScore >= 8.5)

    return {
      totalStudents,
      globalAvg,
      lowPerformersCount: lowPerformers.length,
      highPerformersCount: highPerformers.length,
    }
  }, [analysisData])

  const sortedData = [...analysisData].sort(
    (a, b) => b.averageScore - a.averageScore,
  )

  const handleExport = () => {
    toast({
      title: 'Exportando dados',
      description: 'O relatório está sendo gerado...',
    })
    // Mock export
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Análise e Comparação
        </h2>
        <p className="text-muted-foreground">
          Pesquisa avançada de desempenho e avaliações.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano Letivo</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueYears.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Escola</label>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Escolas</SelectItem>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Série/Ano</label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Séries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Séries</SelectItem>
                  {availableGrades.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Avaliação</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Geral (Todas)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Geral (Média Final)</SelectItem>
                  {assessmentTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por aluno..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={analysisData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-up">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-muted-foreground">
                Total de Alunos
              </span>
              <span className="text-3xl font-bold">{stats.totalStudents}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-muted-foreground">
                Média Geral
              </span>
              <span
                className={`text-3xl font-bold ${
                  stats.globalAvg >= 6 ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {stats.globalAvg.toFixed(1)}
              </span>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-700" />
                <span className="text-sm font-medium text-green-800">
                  Alto Desempenho
                </span>
              </div>
              <span className="text-3xl font-bold text-green-900">
                {stats.highPerformersCount}
              </span>
              <span className="text-xs text-green-700">Média {'>='} 8.5</span>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-700" />
                <span className="text-sm font-medium text-red-800">
                  Atenção Necessária
                </span>
              </div>
              <span className="text-3xl font-bold text-red-900">
                {stats.lowPerformersCount}
              </span>
              <span className="text-xs text-red-700">Média {'<'} 6.0</span>
            </CardContent>
          </Card>
        </div>
      )}

      {analysisData.length > 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="text-center">Média Apurada</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow key={row.studentId} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {row.studentName}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.registration}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <SchoolIcon className="h-3 w-3 text-muted-foreground" />
                        {row.schoolName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.gradeName} - {row.className}
                    </TableCell>
                    <TableCell className="text-center font-bold text-lg">
                      <span
                        className={
                          row.averageScore >= 6
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }
                      >
                        {row.averageScore.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.averageScore >= 8.5 ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          Destaque
                        </Badge>
                      ) : row.averageScore < 6 ? (
                        <Badge variant="destructive">Risco</Badge>
                      ) : (
                        <Badge variant="secondary">Regular</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        yearFilter && (
          <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
            <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>
              Nenhum dado encontrado para os filtros selecionados.
              <br />
              Tente ajustar os critérios de pesquisa.
            </p>
          </div>
        )
      )}
    </div>
  )
}
