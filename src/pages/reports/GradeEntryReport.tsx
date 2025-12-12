import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, FileCheck, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'
import useStudentStore from '@/stores/useStudentStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useTeacherStore from '@/stores/useTeacherStore'
import { ExportActions } from '@/components/ExportActions'

export default function GradeEntryReport() {
  const navigate = useNavigate()
  const { schools } = useSchoolStore()
  const { courses } = useCourseStore()
  const { students } = useStudentStore()
  const { assessments } = useAssessmentStore()
  const { teachers } = useTeacherStore()

  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const activeSchool = useMemo(
    () => schools.find((s) => s.id === selectedSchool),
    [schools, selectedSchool],
  )
  const academicYears = useMemo(
    () => activeSchool?.academicYears || [],
    [activeSchool],
  )
  const activeYear = useMemo(
    () => academicYears.find((y) => y.id === selectedYear),
    [academicYears, selectedYear],
  )
  const periods = useMemo(() => activeYear?.periods || [], [activeYear])

  // Logic to build the report data
  const reportData = useMemo(() => {
    if (!activeSchool || !activeYear) return []

    const data: any[] = []

    activeYear.classes.forEach((cls) => {
      // Find course/grade info
      const course = courses.find((c) =>
        c.grades.some((g) => g.id === cls.gradeId),
      )
      const grade = course?.grades.find((g) => g.id === cls.gradeId)

      if (!grade) return

      // Students in this class
      const classStudents = students.filter((s) => {
        const enrollment = s.enrollments.find(
          (e) =>
            e.schoolId === activeSchool.id &&
            e.year.toString() === activeYear.name &&
            e.grade === cls.name &&
            e.status === 'Cursando',
        )
        return !!enrollment
      })

      const totalStudents = classStudents.length

      grade.subjects.forEach((subject) => {
        const periodsToCheck =
          selectedPeriod === 'all'
            ? periods
            : periods.filter((p) => p.id === selectedPeriod)

        periodsToCheck.forEach((period) => {
          // Find teacher
          const allocation = teachers
            .flatMap((t) => t.allocations)
            .find(
              (a) =>
                a.schoolId === activeSchool.id &&
                a.academicYearId === activeYear.id &&
                a.classroomId === cls.id &&
                a.subjectId === subject.id,
            )
          const teacher = allocation
            ? teachers.find((t) => t.allocations.includes(allocation))
            : null

          let studentsWithGrades = 0
          if (totalStudents > 0) {
            studentsWithGrades = classStudents.filter((student) => {
              const hasAssessment = assessments.some(
                (a) =>
                  a.studentId === student.id &&
                  a.subjectId === subject.id &&
                  a.periodId === period.id &&
                  a.classroomId === cls.id,
              )
              return hasAssessment
            }).length
          }

          const completionRate =
            totalStudents > 0 ? (studentsWithGrades / totalStudents) * 100 : 0

          data.push({
            id: `${cls.id}-${subject.id}-${period.id}`,
            className: cls.name,
            subjectName: subject.name,
            periodName: period.name,
            teacherName: teacher?.name || 'Não alocado',
            totalStudents,
            studentsWithGrades,
            completionRate: parseFloat(completionRate.toFixed(1)),
            status:
              totalStudents === 0
                ? 'Sem Alunos'
                : completionRate >= 100
                  ? 'Completo'
                  : completionRate > 0
                    ? 'Parcial'
                    : 'Pendente',
          })
        })
      })
    })

    return data
  }, [
    activeSchool,
    activeYear,
    selectedPeriod,
    courses,
    students,
    assessments,
    teachers,
    periods,
  ])

  const filteredData = reportData.filter(
    (item) =>
      item.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.teacherName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completo':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Completo</Badge>
        )
      case 'Parcial':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Parcial
          </Badge>
        )
      case 'Pendente':
        return <Badge variant="destructive">Pendente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
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
              <FileCheck className="h-8 w-8" />
              Relatório de Lançamento de Notas
            </h2>
            <p className="text-muted-foreground">
              Acompanhamento do status de digitação de notas por turma e
              disciplina.
            </p>
          </div>
        </div>
        <ExportActions
          data={filteredData}
          filename="relatorio_lancamento_notas"
          columns={[
            'className',
            'subjectName',
            'periodName',
            'teacherName',
            'completionRate',
            'status',
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Relatório</CardTitle>
          <CardDescription>Selecione o contexto para análise.</CardDescription>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Período (Opcional)</label>
              <Select
                value={selectedPeriod}
                onValueChange={setSelectedPeriod}
                disabled={!selectedYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Períodos</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedYear && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Status dos Diários</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum dado encontrado.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turma</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead className="w-[150px]">Progresso</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.className}
                        </TableCell>
                        <TableCell>{item.subjectName}</TableCell>
                        <TableCell>{item.periodName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.teacherName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={item.completionRate}
                              className="h-2"
                            />
                            <span className="text-xs w-8 text-right">
                              {item.completionRate.toFixed(0)}%
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {item.studentsWithGrades}/{item.totalStudents}{' '}
                            alunos
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(item.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
