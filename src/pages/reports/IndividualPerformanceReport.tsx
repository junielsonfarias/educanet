import { useState, useMemo } from 'react'
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
import useStudentStore from '@/stores/useStudentStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useCourseStore from '@/stores/useCourseStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useSettingsStore from '@/stores/useSettingsStore'
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

export default function IndividualPerformanceReport() {
  const { students } = useStudentStore()
  const { assessments, assessmentTypes } = useAssessmentStore()
  const { etapasEnsino, evaluationRules } = useCourseStore()
  const { schools } = useSchoolStore()
  const { settings } = useSettingsStore()

  const [openCombobox, setOpenCombobox] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [disciplineFilter, setDisciplineFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  const student = students.find((s) => s.id === selectedStudentId)

  // Determine available enrollments for selected student
  const availableEnrollments = useMemo(() => {
    if (!student) return []
    return student.enrollments.map((e) => {
      const school = schools.find((s) => s.id === e.schoolId)
      return {
        ...e,
        schoolName: school?.name || 'Escola Desconhecida',
        label: `${e.year} - ${e.grade} (${school?.name})`,
      }
    })
  }, [student, schools])

  // Select first enrollment by default
  useMemo(() => {
    if (availableEnrollments.length > 0 && !selectedEnrollmentId) {
      const active = availableEnrollments.find((e) => e.status === 'Cursando')
      setSelectedEnrollmentId(active ? active.id : availableEnrollments[0].id)
    }
  }, [availableEnrollments, selectedEnrollmentId])

  const selectedEnrollment = availableEnrollments.find(
    (e) => e.id === selectedEnrollmentId,
  )

  const reportData = useMemo(() => {
    if (!student || !selectedEnrollment) return null

    const school = schools.find((s) => s.id === selectedEnrollment.schoolId)
    const academicYear = school?.academicYears.find(
      (y) => y.name === selectedEnrollment.year.toString(),
    )
    const turmas = academicYear?.turmas || academicYear?.classes || []
    const classroom = turmas.find(
      (c) => c.name === selectedEnrollment.grade,
    )

    let gradeStructure: any = null
    let courseEvaluationRule: any = null

    for (const etapaEnsino of etapasEnsino) {
      const s = etapaEnsino.seriesAnos.find(
        (sr) =>
          sr.name === selectedEnrollment.grade ||
          (classroom && sr.id === classroom.serieAnoId),
      )
      if (s) {
        gradeStructure = s
        courseEvaluationRule = evaluationRules.find(
          (r) => r.id === s.evaluationRuleId,
        )
        break
      }
    }

    if (!gradeStructure || !courseEvaluationRule) return null

    const periods = academicYear?.periods || []

    const subjects = gradeStructure.subjects.map((subject: any) => {
      if (disciplineFilter !== 'all' && subject.id !== disciplineFilter)
        return null

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
        settings.defaultRecoveryStrategy,
      )

      const flatAssessments = calculation.periodResults
        .filter((p) => periodFilter === 'all' || p.periodId === periodFilter)
        .flatMap((p) =>
          p.assessments.map((a) => ({ ...a, periodName: p.periodName })),
        )

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        flatAssessments,
        finalGrade: calculation.finalGrade,
        status: calculation.status,
      }
    })

    return {
      subjects: subjects.filter(Boolean),
      periods,
      allSubjectsList: gradeStructure.subjects,
    }
  }, [
    student,
    selectedEnrollment,
    schools,
    etapasEnsino,
    evaluationRules,
    assessments,
    assessmentTypes,
    settings.defaultRecoveryStrategy,
    disciplineFilter,
    periodFilter,
  ])

  const handleExportCSV = () => {
    if (!reportData || !student) return

    let csvContent =
      'data:text/csv;charset=utf-8,Aluno,Disciplina,Periodo,Data,Avaliacao,Nota Original,Recuperacao,Nota Final\n'

    reportData.subjects.forEach((subject: any) => {
      subject.flatAssessments.forEach((assessment: any) => {
        const type = assessmentTypes.find(
          (t) => t.id === assessment.assessmentTypeId,
        )
        const row = [
          student.name,
          subject.subjectName,
          assessment.periodName,
          assessment.date ? new Date(assessment.date).toLocaleDateString() : '',
          type?.name || 'Avaliacao',
          assessment.isRecovered ? assessment.originalValue : assessment.value, // Logic check: value is effective, originalValue is stored if recovered
          assessment.isRecovered ? assessment.recoveryValue : '-',
          assessment.value,
        ].join(',')
        csvContent += row + '\n'
      })
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio_${student.name}.csv`)
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
                    {student ? student.name : 'Buscar aluno...'}
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
                  {reportData.allSubjectsList.map((s: any) => (
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
                  {reportData.periods.map((p: any) => (
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
            {reportData.subjects.map((item: any) => (
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
                        {item.flatAssessments.map((assessment: any) => {
                          const type = assessmentTypes.find(
                            (t) => t.id === assessment.assessmentTypeId,
                          )
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
                                    {type?.name || 'Avaliação'}
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
