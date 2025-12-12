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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  GraduationCap,
  Calculator,
  Info,
  FileText,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { Student, EvaluationRule } from '@/lib/mock-data'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'
import useSettingsStore from '@/stores/useSettingsStore'
import {
  calculateGrades,
  SubjectCalculationResult,
} from '@/lib/grade-calculator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface StudentPerformanceCardProps {
  student: Student
}

export function StudentPerformanceCard({
  student,
}: StudentPerformanceCardProps) {
  const { assessments, assessmentTypes } = useAssessmentStore()
  const { schools } = useSchoolStore()
  const { courses, evaluationRules } = useCourseStore()
  const { settings } = useSettingsStore()
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [detailsDialog, setDetailsDialog] =
    useState<SubjectCalculationResult | null>(null)
  const [selectedSubjectName, setSelectedSubjectName] = useState('')

  // Get unique years from enrollments
  const years = Array.from(
    new Set(student.enrollments.map((e) => e.year)),
  ).sort((a, b) => b - a)

  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[0].toString())
    }
  }, [years, selectedYear])

  const getPerformanceData = (yearStr: string) => {
    // 1. Find academic years (ids) that match the selected year string
    let relevantSchool: any = null
    let relevantAcademicYear: any = null

    // Find the correct school and academic year for the selected year string
    for (const school of schools) {
      const ay = school.academicYears.find(
        (y) => y.name === yearStr || y.name.includes(yearStr),
      )
      if (ay) {
        relevantSchool = school
        relevantAcademicYear = ay
        break
      }
    }

    if (!relevantAcademicYear) return []

    // 2. Identify subjects based on student's class
    // Find student's class/grade in this year
    const enrollment = student.enrollments.find(
      (e) => e.year.toString() === yearStr,
    )
    // Find corresponding class object (simplified matching by grade name for mock)
    const classroom = relevantAcademicYear.classes.find(
      (c: any) => c.name === enrollment?.grade,
    )

    // Find Course/Grade structure
    // We iterate courses to find the grade that matches the classroom gradeId
    let gradeStructure: any = null
    let courseEvaluationRule: EvaluationRule | undefined = undefined

    for (const course of courses) {
      const g = course.grades.find(
        (gr) => gr.id === classroom?.gradeId || gr.name === enrollment?.grade,
      )
      if (g) {
        gradeStructure = g
        courseEvaluationRule = evaluationRules.find(
          (r) => r.id === g.evaluationRuleId,
        )
        break
      }
    }

    if (!gradeStructure || !courseEvaluationRule) return []

    const periods = relevantAcademicYear.periods || []

    // 3. Calculate for each subject
    return gradeStructure.subjects.map((subject: any) => {
      // Filter assessments for this subject
      const subjectAssessments = assessments.filter(
        (a) =>
          a.studentId === student.id &&
          a.subjectId === subject.id &&
          relevantAcademicYear.id === a.yearId, // Ensure year matches
      )

      const calculation = calculateGrades(
        subjectAssessments,
        courseEvaluationRule!,
        periods,
        assessmentTypes,
        settings.defaultRecoveryStrategy, // Pass global setting
      )

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        calculation,
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
            Nenhum dado de avaliação encontrado ou configuração incompleta para
            o ano selecionado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Disciplina</TableHead>
                <TableHead>Média Final</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((data: any) => (
                <TableRow key={data.subjectId}>
                  <TableCell className="font-medium">
                    {data.subjectName}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-bold text-lg ${
                        data.calculation.isPassing
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {data.calculation.finalGrade.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        data.calculation.isPassing
                          ? 'default'
                          : data.calculation.status === 'Dependência'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {data.calculation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSubjectName(data.subjectName)
                        setDetailsDialog(data.calculation)
                      }}
                    >
                      <Info className="h-4 w-4 mr-2" /> Ver Cálculo
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Details Dialog */}
      <Dialog
        open={!!detailsDialog}
        onOpenChange={(open) => !open && setDetailsDialog(null)}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Memória de Cálculo: {selectedSubjectName}
            </DialogTitle>
            <DialogDescription>
              Detalhamento de como a nota final foi obtida baseada na regra:{' '}
              <span className="font-semibold text-primary">
                {detailsDialog?.ruleName}
              </span>
              <span className="block mt-1 text-xs">
                Estratégia de Recuperação:{' '}
                {detailsDialog?.recoveryStrategyApplied === 'replace_if_higher'
                  ? 'Substituir se Maior'
                  : detailsDialog?.recoveryStrategyApplied === 'always_replace'
                    ? 'Sempre Substituir'
                    : 'Média'}
              </span>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {detailsDialog?.periodResults.map((period) => (
                <div
                  key={period.periodId}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">
                      {period.periodName}
                    </h4>
                    <div className="flex items-center gap-2">
                      {period.isRecoveryUsed && (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-200 bg-orange-50"
                        >
                          Recuperação Periódica Aplicada
                        </Badge>
                      )}
                      <span className="font-bold text-lg">
                        {period.finalPeriodGrade.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <Separator />

                  {/* Detailed Assessments List */}
                  {period.assessments && period.assessments.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Avaliações
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {period.assessments.map((assessment) => {
                          const type = assessmentTypes.find(
                            (t) => t.id === assessment.assessmentTypeId,
                          )
                          return (
                            <div
                              key={assessment.id}
                              className="flex justify-between items-center bg-secondary/20 p-2 rounded text-sm group relative"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3 text-primary" />
                                <span
                                  className="truncate max-w-[150px] font-medium"
                                  title={type?.name || 'Avaliação'}
                                >
                                  {type?.name || 'Avaliação'}
                                </span>
                                {assessment.category === 'recuperation' && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] h-4 px-1"
                                  >
                                    Recuperação Avulsa
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                {assessment.isRecovered && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="line-through text-muted-foreground">
                                      {Number(assessment.originalValue).toFixed(
                                        1,
                                      )}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="flex items-center gap-1 font-bold text-green-600 cursor-help border-b border-dashed border-green-300">
                                            {Number(assessment.value).toFixed(
                                              1,
                                            )}
                                            <TrendingUp className="h-3 w-3" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="font-semibold">
                                            Recuperado!
                                          </p>
                                          <p>
                                            Nota Recuperação:{' '}
                                            {assessment.recoveryValue}
                                          </p>
                                          {assessment.recoveryDate && (
                                            <p className="text-xs opacity-75">
                                              Data: {assessment.recoveryDate}
                                            </p>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                )}

                                {!assessment.isRecovered && (
                                  <span className="font-semibold">
                                    {Number(assessment.value).toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">
                      Nenhuma avaliação lançada neste período.
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2 rounded mt-2">
                    <p className="font-semibold text-foreground mb-1">
                      Log de Processamento:
                    </p>
                    {period.logs.map((log, idx) => (
                      <p key={idx}>• {log}</p>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 text-sm gap-2 mt-2">
                    <div>
                      <span className="text-muted-foreground">
                        Média Regular:
                      </span>{' '}
                      {period.regularAverage.toFixed(2)}
                    </div>
                    {period.recoveryGrade !== null && (
                      <div>
                        <span className="text-muted-foreground">
                          Nota Recuperação Final:
                        </span>{' '}
                        {period.recoveryGrade}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-2">Cálculo Final</h4>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Fórmula Utilizada:
                    </span>
                    <code className="text-xs bg-background p-1 rounded border">
                      {detailsDialog?.formulaUsed}
                    </code>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                    <span className="text-lg font-bold">
                      Nota Final Calculada
                    </span>
                    <span
                      className={`text-2xl font-bold ${detailsDialog?.isPassing ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {detailsDialog?.finalGrade.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-right mt-1">
                    <Badge
                      variant={
                        detailsDialog?.isPassing ? 'default' : 'destructive'
                      }
                    >
                      {detailsDialog?.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
