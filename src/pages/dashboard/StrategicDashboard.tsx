import { useMemo, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  TrendingUp,
  AlertCircle,
  Users,
  School,
  CheckCircle2,
  XCircle,
  BookOpen,
} from 'lucide-react'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useAttendanceStore } from '@/stores/useAttendanceStore.supabase'
import { useAssessmentStore } from '@/stores/useAssessmentStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { calculateGrades } from '@/lib/grade-calculator'
import type { Period } from '@/lib/mock-data'
import { SafeChart } from '@/components/charts/SafeChart'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function StrategicDashboard() {
  const { schools } = useSchoolStore()
  const { students } = useStudentStore()
  const { assessments, assessmentTypes } = useAssessmentStore()
  const { etapasEnsino, evaluationRules } = useCourseStore()
  const { attendanceRecords } = useAttendanceStore()

  // 1. Overall Approval Rate Calculation
  const approvalStats = useMemo(() => {
    let totalStudents = 0
    let approved = 0
    let failed = 0
    let ongoing = 0

    ;(students || []).forEach((s) => {
      const activeEnrollment = (s.enrollments || []).find(
        (e) => e.status !== 'Transferido' && e.status !== 'Abandono',
      )
      if (activeEnrollment) {
        totalStudents++
        if (activeEnrollment.status === 'Aprovado') approved++
        else if (activeEnrollment.status === 'Reprovado') failed++
        else ongoing++
      }
    })

    const approvalRate =
      totalStudents > 0 ? (approved / totalStudents) * 100 : 0

    return {
      totalStudents,
      approved,
      failed,
      ongoing,
      approvalRate,
      data: [
        { name: 'Aprovados', value: approved, color: '#16a34a' },
        { name: 'Reprovados', value: failed, color: '#dc2626' },
        { name: 'Cursando', value: ongoing, color: '#3b82f6' },
      ],
    }
  }, [students])

  // 2. Average Performance per Subject (Aggregated)
  const subjectPerformance = useMemo(() => {
    const subjectStats: Record<string, { sum: number; count: number }> = {}
    
    // Early return if no data
    if (!students || students.length === 0) {
      return []
    }

    ;(students || []).forEach((student) => {
      const enrollment = (student.enrollments || []).find(
        (e) =>
          e.status === 'Cursando' ||
          e.status === 'Aprovado' ||
          e.status === 'Reprovado',
      )
      if (!enrollment) return

      const school = (schools || []).find((s) => s.id === enrollment.schoolId)
      const year = (school?.academicYears || []).find(
        (y) => y.name === enrollment.year.toString(),
      )
      const turmas = year?.turmas || []
      const classroom = turmas.find((c) => c.name === enrollment.grade)

      if (!year || !classroom) return

      const etapaEnsino = (etapasEnsino || []).find((e) =>
        (e.seriesAnos || []).some((s) => s.id === classroom.serieAnoId),
      )
      const serieAno = (etapaEnsino?.seriesAnos || []).find((s) => s.id === classroom.serieAnoId)
      const rule = (evaluationRules || []).find((r) => r.id === serieAno?.evaluationRuleId)

      if (!serieAno || !rule || !year) return

      // Ensure periods is always a valid array
      let periods: Period[] = []
      if (year && Array.isArray(year.periods)) {
        periods = year.periods
      }

      (serieAno.subjects || []).forEach((subj) => {
        const subAssessments = (assessments || []).filter(
          (a) =>
            a.studentId === student.id &&
            a.subjectId === subj.id &&
            a.yearId === year.id,
        )

        if (subAssessments.length > 0 && Array.isArray(periods) && periods.length > 0) {
          const calc = calculateGrades(
            subAssessments,
            rule,
            periods,
            assessmentTypes || [],
          )
          if (!subjectStats[subj.name])
            subjectStats[subj.name] = { sum: 0, count: 0 }
          subjectStats[subj.name].sum += calc.finalGrade
          subjectStats[subj.name].count++
        }
      })
    })

    const result = Object.entries(subjectStats)
      .map(([name, stats]) => ({
        name,
        average: parseFloat((stats.sum / stats.count).toFixed(1)),
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 10)
    
    // Ensure we always return an array
    return Array.isArray(result) ? result : []
  }, [
    students,
    schools,
    etapasEnsino,
    evaluationRules,
    assessments,
    assessmentTypes,
  ])

  // 3. High Absenteeism
  const absenteeismData = useMemo(() => {
    // Early return if no data
    if (!students || students.length === 0) {
      return []
    }
    
    const studentsWithAbsence = (students || []).map((s) => {
      const records = (attendanceRecords || []).filter((r) => r.studentId === s.id)
      const total = records.length
      const absent = records.filter((r) => !r.present).length
      const percentage = total > 0 ? (absent / total) * 100 : 0
      return {
        ...s,
        absencePercentage: percentage,
        totalAbsences: absent,
      }
    })

    const highRisk = studentsWithAbsence
      .filter((s) => s.absencePercentage > 20)
      .sort((a, b) => b.absencePercentage - a.absencePercentage)
      .slice(0, 5)

    // Ensure we always return an array
    return Array.isArray(highRisk) ? highRisk : []
  }, [students, attendanceRecords])

  // 4. Low Performance Students (Risk)
  const lowPerformanceStudents = useMemo(() => {
    const atRisk: Array<{
      id: string
      name: string
      registration: string
      failedCount: number
      subjects: Array<{ name: string; grade: number }>
    }> = []
    
    // Early return if no data
    if (!students || students.length === 0) {
      return []
    }

    (students || []).forEach((student) => {
      // Find active enrollment
      const enrollment = (student.enrollments || []).find(
        (e) => e.status === 'Cursando',
      )
      if (!enrollment) return

      const school = (schools || []).find((s) => s.id === enrollment.schoolId)
      const year = (school?.academicYears || []).find(
        (y) => y.name === enrollment.year.toString(),
      )
      const turmas = year?.turmas || []
      const classroom = turmas.find((c) => c.name === enrollment.grade)

      if (!year || !classroom) return

      // Find structure
      const etapaEnsino = (etapasEnsino || []).find((e) =>
        (e.seriesAnos || []).some((s) => s.id === classroom.serieAnoId),
      )
      const serieAno = (etapaEnsino?.seriesAnos || []).find((s) => s.id === classroom.serieAnoId)
      const rule = (evaluationRules || []).find((r) => r.id === serieAno?.evaluationRuleId)

      if (!serieAno || !rule || !year) return

      // Ensure periods is always a valid array
      let periods: Period[] = []
      if (year && Array.isArray(year.periods)) {
        periods = year.periods
      }
      let failedSubjectsCount = 0
      const subjectDetails: Array<{ name: string; grade: number }> = []

      (serieAno.subjects || []).forEach((subj) => {
        const subAssessments = (assessments || []).filter(
          (a) =>
            a.studentId === student.id &&
            a.subjectId === subj.id &&
            a.yearId === year.id,
        )

        if (Array.isArray(periods) && periods.length > 0 && subAssessments.length > 0) {
          const calc = calculateGrades(
            subAssessments,
            rule,
            periods,
            assessmentTypes || [],
          )

          // Check passing grade using the rule
          if (!calc.isPassing) {
            failedSubjectsCount++
            subjectDetails.push({ name: subj.name, grade: calc.finalGrade })
          }
        }
      })

      // Threshold: 2 or more subjects below passing grade
      if (failedSubjectsCount >= 2) {
        atRisk.push({
          id: student.id,
          name: student.name,
          registration: student.registration,
          failedCount: failedSubjectsCount,
          subjects: subjectDetails,
        })
      }
    })

    const result = atRisk.sort((a, b) => b.failedCount - a.failedCount).slice(0, 5)
    // Ensure we always return an array
    return Array.isArray(result) ? result : []
  }, [
    students,
    schools,
    etapasEnsino,
    evaluationRules,
    assessments,
    assessmentTypes,
  ])

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Painel Estratégico
        </h1>
        <p className="text-muted-foreground">
          Indicadores chave de desempenho da rede de ensino municipal.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Alunos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvalStats.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              Matriculados na rede
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Aprovação
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvalStats.approvalRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Média geral da rede</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Escolas Monitoradas
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(schools || []).length}</div>
            <p className="text-xs text-muted-foreground">Unidades ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alunos em Risco (Notas)
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowPerformanceStudents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Com notas baixas em 2+ disciplinas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Subject Performance Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Desempenho Médio por Disciplina</CardTitle>
            <CardDescription>
              Média das notas finais agregadas por componente curricular.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <SafeChart
              data={subjectPerformance}
              minHeight={350}
              validateData={(data) => 
                Array.isArray(data) && 
                data.length > 0 && 
                data[0]?.name !== undefined
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 10]}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="average"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Média"
                  />
                </BarChart>
              </ResponsiveContainer>
            </SafeChart>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Situação dos Alunos</CardTitle>
            <CardDescription>
              Distribuição por status de matrícula.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SafeChart
              data={approvalStats.data}
              minHeight={350}
              validateData={(data) => 
                Array.isArray(data) && 
                data.length > 0 && 
                data[0]?.value !== undefined
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={approvalStats.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {approvalStats.data.map((entry, index) => (
                      <Cell key={`cell-${entry.name || index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </SafeChart>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* High Absenteeism List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Alerta de Infrequência
            </CardTitle>
            <CardDescription>
              Alunos com maior índice de faltas registrado ({'>'} 20%).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {absenteeismData.length > 0 ? (
              <div className="space-y-4">
                {absenteeismData.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {student.registration}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-600">
                        {student.absencePercentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {student.totalAbsences} faltas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum aluno em situação crítica de frequência.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Performance List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-600" />
              Alunos com Baixo Desempenho
            </CardTitle>
            <CardDescription>
              Alunos com média insuficiente em 2 ou mais disciplinas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowPerformanceStudents.length > 0 ? (
              <div className="space-y-4">
                {lowPerformanceStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col border-b pb-2 last:border-0 last:pb-0 gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        {student.failedCount} disciplinas
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                      {student.subjects.map((s, idx) => (
                        <span key={idx}>
                          {s.name} ({s.grade.toFixed(1)})
                          {idx < student.subjects.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum aluno identificado com baixo desempenho crítico.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
