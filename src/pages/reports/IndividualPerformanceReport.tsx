import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  FileText,
  User,
  GraduationCap,
  Calendar,
  Filter,
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useAssessmentStore } from '@/stores/useAssessmentStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useSettingsStore } from '@/stores/useSettingsStore.supabase'
import { enrollmentService } from '@/lib/supabase/services'
import { calculateGrades } from '@/lib/grade-calculator'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnrollmentData {
  id: number;
  school_id?: number;
  class_id?: number;
  academic_year_id?: number;
  status?: string;
  class?: {
    id: number;
    name: string;
    grade_id?: number;
  };
  academic_year?: {
    id: number;
    name: string;
    academic_periods?: AcademicPeriodData[];
  };
}

interface AcademicPeriodData {
  id: number;
  name: string;
}

interface SubjectData {
  id: number;
  name: string;
}

interface AssessmentFlatData {
  id: string;
  date: string;
  value: number;
  originalValue: number;
  isRecovered: boolean;
  recoveryValue: number | null;
  periodName: string;
  assessmentTypeId: string;
  category?: string;
}

interface SubjectReportData {
  subjectId: number;
  subjectName: string;
  flatAssessments: AssessmentFlatData[];
  finalGrade: number;
  status: string;
}

interface PeriodReportData {
  id: string;
  periodName: string;
  name?: string;
}

export default function IndividualPerformanceReport() {
  const { students, fetchStudents } = useStudentStore()
  const { grades, fetchGrades } = useAssessmentStore()
  const { courses, fetchCourses } = useCourseStore()
  const { schools, fetchSchools } = useSchoolStore()
  const { settings } = useSettingsStore()

  const [openCombobox, setOpenCombobox] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [disciplineFilter, setDisciplineFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([])

  useEffect(() => {
    fetchStudents()
    fetchGrades()
    fetchCourses()
    fetchSchools()
  }, [fetchStudents, fetchGrades, fetchCourses, fetchSchools])

  const student = students.find((s) => s.id.toString() === selectedStudentId)

  // Buscar matrículas do aluno selecionado
  useEffect(() => {
    const loadEnrollments = async () => {
      if (selectedStudentId) {
        try {
          const studentEnrollments = await enrollmentService.getByStudent(parseInt(selectedStudentId))
          setEnrollments(studentEnrollments)
        } catch {
          setEnrollments([])
        }
      } else {
        setEnrollments([])
      }
    }
    loadEnrollments()
  }, [selectedStudentId])

  // Determine available enrollments for selected student
  const availableEnrollments = useMemo(() => {
    if (!student || enrollments.length === 0) return []
    return enrollments.map((e) => {
      const school = schools.find((s) => s.id === e.school_id)
      const className = e.class?.name || 'N/A'
      const academicYear = e.academic_year?.name || 'N/A'
      return {
        ...e,
        id: e.id.toString(),
        schoolName: school?.name || 'Escola Desconhecida',
        label: `${academicYear} - ${className} (${school?.name})`,
        year: academicYear,
        grade: className,
        schoolId: e.school_id?.toString(),
      }
    })
  }, [student, enrollments, schools])

  // Select first enrollment by default
  useEffect(() => {
    if (availableEnrollments.length > 0 && !selectedEnrollmentId) {
      const active = availableEnrollments.find((e) => e.status === 'Ativo' || e.status === 'Cursando')
      setSelectedEnrollmentId(active ? active.id : availableEnrollments[0].id)
    }
  }, [availableEnrollments, selectedEnrollmentId])

  const selectedEnrollment = availableEnrollments.find(
    (e) => e.id === selectedEnrollmentId,
  )

  const reportData = useMemo(() => {
    if (!student || !selectedEnrollment) return null

    const enrollment = enrollments.find((e) => e.id.toString() === selectedEnrollmentId)
    if (!enrollment) return null

    const classId = enrollment.class_id
    const grade = courses.find((g) => g.id === enrollment.class?.grade_id)
    if (!grade) return null

    const subjects = grade.subjects || []

    const subjectsData = subjects.map((subject: SubjectData) => {
      if (disciplineFilter !== 'all' && subject.id.toString() !== disciplineFilter)
        return null

      // Buscar notas do aluno para esta disciplina e turma
      const subjectGrades = grades.filter(
        (g) =>
          g.student_profile_id === student.id &&
          g.evaluation_instance?.subject_id === subject.id &&
          g.evaluation_instance?.class_id === classId,
      )

      // Calcular média
      let finalGrade = 0
      let isPassing = false
      if (subjectGrades.length > 0) {
        finalGrade = subjectGrades.reduce((sum, g) => sum + (g.grade_value || 0), 0) / subjectGrades.length
        isPassing = finalGrade >= 6.0 // Pode ser configurável
      }

      // Filtrar por período se necessário
      let periodGrades = subjectGrades
      if (periodFilter !== 'all') {
        periodGrades = subjectGrades.filter(
          (g) => g.evaluation_instance?.academic_period_id?.toString() === periodFilter
        )
      }

      // Mapear notas para formato esperado
      const flatAssessments = periodGrades.map((g) => ({
        id: g.id.toString(),
        date: g.evaluation_instance?.evaluation_date || g.created_at,
        value: g.grade_value || 0,
        originalValue: g.grade_value || 0,
        isRecovered: false, // TODO: Implementar lógica de recuperação se necessário
        recoveryValue: null,
        periodName: g.evaluation_instance?.academic_period?.name || 'Geral',
        assessmentTypeId: g.evaluation_instance?.evaluation_type || 'Prova',
      }))

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        flatAssessments,
        finalGrade: finalGrade,
        status: isPassing ? 'Aprovado' : 'Em Risco',
      }
    }).filter(Boolean)

    // Buscar períodos acadêmicos
    const academicPeriods = enrollment.academic_year?.academic_periods || []

    return {
      subjects: subjectsData,
      periods: academicPeriods.map((p: AcademicPeriodData) => ({
        id: p.id.toString(),
        periodName: p.name,
      })),
      allSubjectsList: subjects,
    }
  }, [
    student,
    selectedEnrollment,
    selectedEnrollmentId,
    enrollments,
    courses,
    grades,
    disciplineFilter,
    periodFilter,
  ])

  const handleExportCSV = () => {
    if (!reportData || !student) return

    let csvContent =
      'data:text/csv;charset=utf-8,Aluno,Disciplina,Periodo,Data,Avaliacao,Nota Original,Recuperacao,Nota Final\n'

    const studentName = `${student.person?.first_name || ''} ${student.person?.last_name || ''}`.trim()

    reportData.subjects.forEach((subject: SubjectReportData) => {
      subject.flatAssessments.forEach((assessment: AssessmentFlatData) => {
        const row = [
          studentName,
          subject.subjectName,
          assessment.periodName,
          assessment.date ? new Date(assessment.date).toLocaleDateString() : '',
          assessment.assessmentTypeId || 'Avaliacao',
          assessment.isRecovered ? assessment.originalValue : assessment.value,
          assessment.isRecovered ? assessment.recoveryValue : '-',
          assessment.value,
        ].join(',')
        csvContent += row + '\n'
      })
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio_${studentName.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Relatório Individual de Performance
        </h2>
        <p className="text-muted-foreground">
          Análise detalhada e cronológica de notas e recuperações.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-medium">Selecionar Aluno</label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                  >
                    {student 
                      ? `${student.person?.first_name || ''} ${student.person?.last_name || ''}`.trim() || 'Aluno'
                      : 'Buscar aluno...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar aluno..." />
                    <CommandList>
                      <CommandEmpty>Aluno não encontrado.</CommandEmpty>
                      <CommandGroup>
                        {students.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.name}
                            onSelect={() => {
                              setSelectedStudentId(s.id)
                              setOpenCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedStudentId === s.id
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            {s.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full md:w-[300px] space-y-2">
              <label className="text-sm font-medium">Matrícula / Ano</label>
              <Select
                value={selectedEnrollmentId}
                onValueChange={setSelectedEnrollmentId}
                disabled={!student}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {availableEnrollments.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 w-full md:w-auto">
              <Select
                value={disciplineFilter}
                onValueChange={setDisciplineFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Todas as Disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Disciplinas</SelectItem>
                  {reportData.allSubjectsList.map((s: SubjectData) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[200px]">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Todos os Períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Períodos</SelectItem>
                  {reportData.periods.map((p: PeriodReportData) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Exportar Relatório
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.print()}>
                  <FileText className="mr-2 h-4 w-4" /> Exportar PDF (Imprimir)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-6">
            {reportData.subjects.map((item: SubjectReportData) => (
              <Card key={item.subjectId}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{item.subjectName}</CardTitle>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold">
                        {item.finalGrade.toFixed(1)}
                      </span>
                      <Badge
                        variant={
                          item.status === 'Aprovado' ? 'default' : 'secondary'
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {item.flatAssessments.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-4">
                      Nenhuma avaliação registrada.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Avaliação</TableHead>
                          <TableHead className="text-center">
                            Nota Original
                          </TableHead>
                          <TableHead className="text-center">
                            Recuperação
                          </TableHead>
                          <TableHead className="text-center">
                            Nota Final
                          </TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.flatAssessments.map((assessment: AssessmentFlatData) => {
                          return (
                            <TableRow key={assessment.id}>
                              <TableCell className="text-muted-foreground text-sm">
                                {assessment.date
                                  ? new Date(
                                      assessment.date,
                                    ).toLocaleDateString()
                                  : '-'}
                              </TableCell>
                              <TableCell>{assessment.periodName}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {assessment.assessmentTypeId || 'Avaliação'}
                                  </span>
                                  {assessment.category === 'recuperation' && (
                                    <span className="text-xs text-muted-foreground">
                                      Avaliação Avulsa de Rec.
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {assessment.isRecovered ? (
                                  <span className="line-through text-muted-foreground">
                                    {Number(assessment.originalValue).toFixed(
                                      1,
                                    )}
                                  </span>
                                ) : assessment.category === 'recuperation' ? (
                                  '-'
                                ) : (
                                  Number(assessment.value).toFixed(1)
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {assessment.isRecovered ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-orange-50 text-orange-700 border-orange-200"
                                  >
                                    {assessment.recoveryValue}
                                  </Badge>
                                ) : assessment.category === 'recuperation' ? (
                                  Number(assessment.value).toFixed(1)
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                {Number(assessment.value).toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right">
                                {assessment.isRecovered ? (
                                  <Badge className="bg-green-600 hover:bg-green-700">
                                    Recuperado
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    Normal
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
