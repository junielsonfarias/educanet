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
  // Mostrar todas as avaliações (regulares e recuperação)
  const historyData = (assessments || [])
    .map((assessment) => {
      const type = (assessmentTypes || []).find(
        (t) => String(t.id) === String(assessment.assessmentTypeId),
      )
      const subject = subjects.find((s) =>
        String(s.id) === String(assessment.subjectId)
      )
      const period = periods.find((p) =>
        String(p.id) === String(assessment.periodId)
      )

      // Determinar se é recuperação
      const isRecovery = assessment.category === 'recuperation' ||
        (assessment as any).isRecovery === true

      return {
        id: assessment.id,
        date: assessment.date,
        subjectName: subject?.name || 'Disciplina Desconhecida',
        periodName: period?.name || 'Período Desconhecido',
        typeName: type?.name || (assessment as any).evaluationTitle || 'Avaliação',
        originalGrade: Number(assessment.value) || 0,
        recoveryGrade: null, // Agora mostramos recuperação como linha separada
        recoveryDate: null,
        finalGrade: Number(assessment.value) || 0,
        isRecovered: false,
        isRecoveryAssessment: isRecovery,
        category: assessment.category || 'regular',
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
                <TableRow
                  key={item.id}
                  className={`hover:bg-muted/50 ${
                    item.isRecoveryAssessment
                      ? 'bg-orange-50/50'
                      : ''
                  }`}
                >
                  <TableCell>
                    {format(parseISO(item.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.subjectName}
                  </TableCell>
                  <TableCell>{item.periodName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.typeName}
                      {item.isRecoveryAssessment && (
                        <Badge
                          variant="outline"
                          className="bg-orange-100 text-orange-700 border-orange-200 text-xs"
                        >
                          Rec
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={item.isRecoveryAssessment ? 'text-orange-700 font-medium' : ''}>
                      {item.originalGrade.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.isRecoveryAssessment ? (
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        Substituir menor
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    <span
                      className={
                        item.finalGrade >= 7
                          ? 'text-green-600'
                          : item.finalGrade >= 5
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }
                    >
                      {item.finalGrade.toFixed(1)}
                    </span>
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
