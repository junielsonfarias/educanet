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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, History } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface AssessmentItem {
  id: string | number
  date: string
  subjectId?: string | number
  periodId?: string | number
  assessmentTypeId?: string
  value: number | string
  category?: string
  relatedAssessmentId?: string | number
}

interface SubjectItem {
  id: string | number
  name: string
}

interface PeriodItem {
  id: string | number
  name: string
}

interface AssessmentTypeItem {
  id: string
  name: string
}

interface StudentAssessmentHistoryProps {
  assessments: AssessmentItem[]
  assessmentTypes?: AssessmentTypeItem[]
  subjects: SubjectItem[]
  periods: PeriodItem[]
}

export function StudentAssessmentHistory({
  assessments,
  assessmentTypes,
  subjects,
  periods,
}: StudentAssessmentHistoryProps) {
  // Flatten and link recovery assessments
  const historyData = (assessments || [])
    .filter((a) => (a.category || 'regular') === 'regular') // Base list on regular assessments
    .map((assessment) => {
      const type = (assessmentTypes || []).find(
        (t) => t.id === assessment.assessmentTypeId,
      )
      const subject = subjects.find((s) => 
        s.id?.toString() === assessment.subjectId?.toString()
      )
      const period = periods.find((p) => 
        p.id?.toString() === assessment.periodId?.toString()
      )

      // Find linked recovery
      const recovery = assessments.find(
        (r) => r.relatedAssessmentId?.toString() === assessment.id?.toString(),
      )

      return {
        id: assessment.id,
        date: assessment.date,
        subjectName: subject?.name || 'Disciplina Desconhecida',
        periodName: period?.name || 'Período Desconhecido',
        typeName: type?.name || 'Avaliação',
        originalGrade: Number(assessment.value) || 0,
        recoveryGrade: recovery ? Number(recovery.value) : null,
        recoveryDate: recovery ? recovery.date : null,
        finalGrade: recovery
          ? Math.max(Number(assessment.value) || 0, Number(recovery.value) || 0) // Assuming standard strategy for display
          : Number(assessment.value) || 0,
        isRecovered: !!recovery,
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (historyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Notas por Avaliação
          </CardTitle>
          <CardDescription>
            Nenhuma avaliação registrada para este aluno.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Notas por Avaliação
        </CardTitle>
        <CardDescription>
          Registro cronológico detalhado de todas as avaliações e recuperações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead className="text-center">Nota Original</TableHead>
                <TableHead className="text-center">Recuperação</TableHead>
                <TableHead className="text-center">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    {format(parseISO(item.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.subjectName}
                  </TableCell>
                  <TableCell>{item.periodName}</TableCell>
                  <TableCell>{item.typeName}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        item.isRecovered
                          ? 'line-through text-muted-foreground'
                          : ''
                      }
                    >
                      {item.originalGrade.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.recoveryGrade !== null ? (
                      <div className="flex flex-col items-center">
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-700 border-orange-200"
                        >
                          {item.recoveryGrade.toFixed(1)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {item.recoveryDate
                            ? format(parseISO(item.recoveryDate), 'dd/MM')
                            : ''}
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    <div className="flex items-center justify-center gap-2">
                      {item.isRecovered && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span
                        className={
                          item.isRecovered
                            ? 'text-green-600'
                            : 'text-foreground'
                        }
                      >
                        {item.finalGrade.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
