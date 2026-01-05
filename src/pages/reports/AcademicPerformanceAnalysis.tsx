import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  BarChart2,
  PieChart,
  Users,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useAssessmentStore } from '@/stores/useAssessmentStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { calculateGrades } from '@/lib/grade-calculator'
import { ExportActions } from '@/components/ExportActions'
import { SafeChart } from '@/components/charts/SafeChart'

export default function AcademicPerformanceAnalysis() {
  const navigate = useNavigate()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const { assessments, assessmentTypes } = useAssessmentStore()
  const { etapasEnsino, evaluationRules } = useCourseStore()

  const [selectedSchool, setSelectedSchool] = useState<string>('all')

  // Aggregate Data Logic
  const analysis = useMemo(() => {
    let totalGrades = 0
    let countGrades = 0
    let passedSubjects = 0
    let failedSubjects = 0

    // Aggregation by Subject
    const subjectStats: Record<
      string,
      { sum: number; count: number; pass: number; fail: number }
    > = {}

    // Aggregation by Grade Level (Series)
    const levelStats: Record<string, { sum: number; count: number }> = {}

    // Students at Risk (Failing 2+ subjects)
    const atRiskStudents: any[] = []

    (students || []).forEach((student) => {
      const enrollment = (student.enrollments || []).find(
        (e) =>
          e.status === 'Cursando' ||
          e.status === 'Aprovado' ||
          e.status === 'Reprovado',
      )
      if (!enrollment) return

      // Filter School
      if (selectedSchool !== 'all' && enrollment.schoolId !== selectedSchool)
        return

      const school = (schools || []).find((s) => s.id === enrollment.schoolId)
      const year = (school?.academicYears || []).find(
        (y) => y.name === enrollment.year.toString(),
      )
      const turmas = year?.turmas || year?.classes || []
      const cls = turmas.find((c) => c.name === enrollment.grade)

      if (!year || !cls) return

      // EtapaEnsino/SerieAno Info
      const etapaEnsino = (etapasEnsino || []).find((e) =>
        (e.seriesAnos || []).some((s) => s.id === (cls.serieAnoId || cls.gradeId)),
      )
      const serieAno = (etapaEnsino?.seriesAnos || []).find((s) => s.id === (cls.serieAnoId || cls.gradeId))
      const rule = (evaluationRules || []).find((r) => r.id === serieAno?.evaluationRuleId)

      if (!serieAno || !rule) return

      let studentFailCount = 0
      let studentAvgSum = 0
      let studentSubjectCount = 0

      (serieAno.subjects || []).forEach((subject) => {
        const subAssessments = assessments.filter(
          (a) =>
            a.studentId === student.id &&
            a.subjectId === subject.id &&
            a.yearId === year.id,
        )

        const calc = calculateGrades(
          subAssessments,
          rule,
          year.periods,
          assessmentTypes,
        )

        // Update Globals
        totalGrades += calc.finalGrade
        countGrades++
        if (calc.isPassing) passedSubjects++
        else failedSubjects++

        // Update Subject Stats
        if (!subjectStats[subject.name])
          subjectStats[subject.name] = { sum: 0, count: 0, pass: 0, fail: 0 }
        subjectStats[subject.name].sum += calc.finalGrade
        subjectStats[subject.name].count++
        if (calc.isPassing) subjectStats[subject.name].pass++
        else subjectStats[subject.name].fail++

        // Update Level Stats
        if (!levelStats[serieAno.name])
          levelStats[serieAno.name] = { sum: 0, count: 0 }
        levelStats[serieAno.name].sum += calc.finalGrade
        levelStats[serieAno.name].count++

        // Student Stats
        studentAvgSum += calc.finalGrade
        studentSubjectCount++
        if (!calc.isPassing) studentFailCount++
      })

      if (studentFailCount >= 2) {
        atRiskStudents.push({
          name: student.name,
          registration: student.registration,
          grade: enrollment.grade,
          failedCount: studentFailCount,
          average:
            studentSubjectCount > 0
              ? (studentAvgSum / studentSubjectCount).toFixed(1)
              : 0,
        })
      }
    })

    // Transform for Charts
    const subjectChartData = Object.entries(subjectStats)
      .map(([name, stat]) => ({
        name,
        average: parseFloat((stat.sum / stat.count).toFixed(1)),
        passRate: parseFloat(
          ((stat.pass / (stat.pass + stat.fail)) * 100).toFixed(1),
        ),
      }))
      .sort((a, b) => a.average - b.average)

    const levelChartData = Object.entries(levelStats).map(([name, stat]) => ({
      name,
      average: parseFloat((stat.sum / stat.count).toFixed(1)),
    }))

    const globalAverage = countGrades > 0 ? totalGrades / countGrades : 0
    const globalPassRate =
      passedSubjects + failedSubjects > 0
        ? (passedSubjects / (passedSubjects + failedSubjects)) * 100
        : 0

    return {
      globalAverage,
      globalPassRate,
      subjectChartData,
      levelChartData,
      atRiskStudents,
      totalEvaluations: countGrades,
    }
  }, [
    students,
    schools,
    etapasEnsino,
    assessments,
    assessmentTypes,
    evaluationRules,
    selectedSchool,
  ])

  // Chart Config
  const subjectChartConfig = {
    average: { label: 'Média', color: 'hsl(var(--primary))' },
    passRate: { label: 'Aprovação %', color: 'hsl(var(--chart-2))' },
  }

  const pieData = [
    { name: 'Aprovado', value: analysis.globalPassRate, fill: '#22c55e' },
    {
      name: 'Reprovado',
      value: 100 - analysis.globalPassRate,
      fill: '#ef4444',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/relatorios')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Análise de Desempenho Acadêmico
            </h2>
            <p className="text-muted-foreground">
              Visão aprofundada dos indicadores de qualidade de ensino.
            </p>
          </div>
        </div>

        <div className="w-[200px]">
          <Select value={selectedSchool} onValueChange={setSelectedSchool}>
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Média Global da Rede
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {analysis.globalAverage.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado em {analysis.totalEvaluations} registros
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {analysis.globalPassRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Disciplinas aprovadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Alunos em Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {analysis.atRiskStudents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Baixo desempenho (2+ reprovações)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Disciplinas Monitoradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analysis.subjectChartData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Componentes curriculares
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" /> Desempenho por Disciplina
            </CardTitle>
            <CardDescription>
              Média geral das notas finais por componente curricular.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ChartContainer
                config={subjectChartConfig}
                className="h-full w-full"
              >
                <BarChart
                  data={analysis.subjectChartData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="average"
                    fill="var(--color-average)"
                    radius={[0, 4, 4, 0]}
                    name="Média"
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" /> Taxa de Aprovação Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SafeChart
              data={pieData}
              minHeight={300}
              validateData={(data) =>
                Array.isArray(data) &&
                data.length > 0 &&
                data[0]?.value !== undefined
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${entry.name || index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <ChartLegend content={<ChartLegendContent />} />
                </RePieChart>
              </ResponsiveContainer>
            </SafeChart>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Alunos com Baixo Desempenho
            </CardTitle>
            <ExportActions
              data={analysis.atRiskStudents}
              filename="alunos_em_risco"
              columns={[
                'name',
                'registration',
                'grade',
                'failedCount',
                'average',
              ]}
              disablePrint
            />
          </CardHeader>
          <CardContent>
            {analysis.atRiskStudents.length > 0 ? (
              <div className="rounded-md border h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead className="text-center">Reprovações</TableHead>
                      <TableHead className="text-center">Média Geral</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.atRiskStudents.map((student, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell className="text-center text-red-600 font-bold">
                          {student.failedCount}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.average}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-10 text-muted-foreground">
                Nenhum aluno identificado em risco crítico.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Média por Série/Ano
            </CardTitle>
            <ExportActions
              data={analysis.levelChartData}
              filename="media_por_serie"
              disablePrint
            />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Série</TableHead>
                    <TableHead className="text-right">Média Geral</TableHead>
                    <TableHead className="text-right">Barra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.levelChartData.map((level, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {level.name}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {level.average.toFixed(1)}
                      </TableCell>
                      <TableCell className="w-[40%]">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden w-full">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${(level.average / 10) * 100}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
