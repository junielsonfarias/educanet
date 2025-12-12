import { Printer, Info, AlertCircle, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  ReportCardData,
  GradeData,
  RecoveryGradeData,
  EvaluationTypeData,
  EvaluationEntry,
} from './types'
import { PublicAssessmentHistory } from './PublicAssessmentHistory'
import { PrintableReportCard } from './PrintableReportCard'

interface ReportCardDisplayProps {
  data: ReportCardData
}

export function ReportCardDisplay({ data }: ReportCardDisplayProps) {
  const handlePrint = () => {
    window.print()
  }

  const formatPeriodName = (name: string) => {
    return name.replace('Bimestre', 'Avaliação')
  }

  const getGradeColorClass = (grade: number) => {
    if (grade < 5) return 'text-red-600 font-bold'
    if (grade >= 5) return 'text-blue-600 font-bold'
    return ''
  }

  const renderGradesTable = (
    grades: GradeData[],
    periodNames: string[],
    ruleName: string,
    isDependency = false,
  ) => (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold min-w-[200px]">
                Disciplina
              </TableHead>
              {periodNames.map((p) => (
                <TableHead key={p} className="text-center min-w-[80px]">
                  {formatPeriodName(p)}
                </TableHead>
              ))}
              <TableHead className="text-center font-bold min-w-[100px]">
                Média Final
              </TableHead>
              <TableHead className="text-center min-w-[120px]">
                Situação
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((grade) => (
              <TableRow key={grade.subject}>
                <TableCell className="font-medium">{grade.subject}</TableCell>
                {grade.periodGrades.map((p, idx) => (
                  <TableCell
                    key={idx}
                    className={cn('text-center', getGradeColorClass(p))}
                  >
                    {p.toFixed(1)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-bold bg-muted/20">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'flex items-center justify-center gap-1 cursor-help',
                          getGradeColorClass(grade.final),
                        )}
                      >
                        {grade.final.toFixed(1)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Fórmula: {grade.formula}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      grade.status === 'Aprovado' || grade.status === 'Cursando'
                        ? 'default'
                        : 'destructive'
                    }
                    className={cn({
                      'bg-green-600 hover:bg-green-700':
                        grade.status === 'Aprovado',
                      'bg-yellow-600 hover:bg-yellow-700':
                        grade.status === 'Cursando',
                    })}
                  >
                    {grade.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>
          Regra de Avaliação Aplicada: <strong>{ruleName}</strong>
        </span>
        {isDependency && (
          <span className="ml-2 font-medium text-amber-600">
            (Regime de Dependência)
          </span>
        )}
      </div>
    </div>
  )

  const renderRecoveriesTable = (
    recoveries: RecoveryGradeData[],
    periodNames: string[],
  ) => {
    // Check if there are any recoveries to show
    const hasRecoveries = recoveries.some((r) =>
      r.periodGrades.some((g) => g !== null),
    )

    if (!hasRecoveries) return null

    return (
      <div className="space-y-2 mt-6 animate-fade-in">
        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> Notas de Recuperação
        </h4>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader className="bg-amber-50/50">
              <TableRow>
                <TableHead className="font-bold min-w-[200px]">
                  Disciplina
                </TableHead>
                {periodNames.map((_, idx) => (
                  <TableHead key={idx} className="text-center min-w-[100px]">
                    {idx + 1}º Recuperação
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recoveries.map((rec) => (
                <TableRow key={rec.subject}>
                  <TableCell className="font-medium">{rec.subject}</TableCell>
                  {rec.periodGrades.map((grade, idx) => (
                    <TableCell key={idx} className="text-center">
                      {grade !== null ? (
                        <span className={cn(getGradeColorClass(grade))}>
                          {grade.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const renderOtherEvaluations = (evaluationTypes: EvaluationTypeData[]) => {
    if (evaluationTypes.length === 0) return null

    return (
      <div className="space-y-6 mt-6 pt-6 border-t animate-fade-in">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Outras Avaliações (Detalhamento)
        </h3>

        {evaluationTypes.map((type) => {
          // Group by Subject
          const bySubject: Record<string, EvaluationEntry[]> = {}
          type.entries.forEach((entry) => {
            if (!bySubject[entry.subject]) bySubject[entry.subject] = []
            bySubject[entry.subject].push(entry)
          })

          return (
            <div key={type.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm font-semibold px-3">
                  {type.name}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(bySubject).map(([subject, entries]) => (
                  <Card key={subject} className="bg-secondary/10 border-0">
                    <CardContent className="p-4">
                      <div className="font-bold mb-3 text-sm">{subject}</div>
                      <div className="flex flex-wrap gap-2">
                        {entries.map((entry, idx) => {
                          let stageLabel = entry.periodName
                          const match = entry.periodName.match(/^(\d+º)/)
                          if (match) {
                            stageLabel = `${match[1]} ${type.name}`
                          }

                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 bg-background border rounded px-2 py-1 text-xs"
                            >
                              <span className="text-muted-foreground">
                                {stageLabel}:
                              </span>
                              <span
                                className={cn(
                                  'font-bold',
                                  getGradeColorClass(entry.value),
                                )}
                              >
                                {entry.value.toFixed(1)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      {/* Screen View */}
      <div className="print:hidden">
        <Card className="animate-slide-up">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{data.name}</CardTitle>
              <CardDescription className="text-base mt-1">
                {data.school} • {data.grade} • {data.year}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Exportar PDF / Imprimir
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="report" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="report">Boletim</TabsTrigger>
                <TabsTrigger value="history">
                  Histórico de Avaliações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="report" className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Grade Curricular
                  </h3>
                  {renderGradesTable(
                    data.grades,
                    data.periodNames,
                    data.ruleName,
                  )}
                  {renderRecoveriesTable(data.recoveries, data.periodNames)}
                  {renderOtherEvaluations(data.evaluationTypes)}
                </div>

                {data.dependencies.length > 0 && (
                  <div className="space-y-6 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-amber-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Disciplinas em Dependência
                    </h3>
                    {data.dependencies.map((dep, idx) => (
                      <div
                        key={idx}
                        className="bg-amber-50/50 p-4 rounded-lg border"
                      >
                        <div className="mb-4 text-sm text-muted-foreground flex gap-4">
                          <span>
                            Turma: <strong>{dep.className}</strong>
                          </span>
                          <span>
                            Tipo: <strong>Dependência</strong>
                          </span>
                        </div>
                        {renderGradesTable(
                          dep.grades,
                          data.periodNames,
                          dep.ruleName,
                          true,
                        )}
                        {renderRecoveriesTable(
                          dep.recoveries,
                          data.periodNames,
                        )}
                        {renderOtherEvaluations(dep.evaluationTypes)}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                <PublicAssessmentHistory history={data.history} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Print View */}
      <PrintableReportCard data={data} />
    </>
  )
}
