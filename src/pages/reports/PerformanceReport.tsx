import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useStudentStore from '@/stores/useStudentStore'

export default function PerformanceReport() {
  const navigate = useNavigate()
  const { assessments } = useAssessmentStore()
  const { students } = useStudentStore()

  // Aggregate by Student/Subject
  const aggregation: Record<
    string,
    { total: number; count: number; studentName: string; subjectId: string }
  > = {}

  assessments.forEach((a) => {
    if (typeof a.value === 'number') {
      const key = `${a.studentId}-${a.subjectId}`
      if (!aggregation[key]) {
        const student = students.find((s) => s.id === a.studentId)
        aggregation[key] = {
          total: 0,
          count: 0,
          studentName: student?.name || 'Unknown',
          subjectId: a.subjectId,
        }
      }
      aggregation[key].total += a.value
      aggregation[key].count++
    }
  })

  const reportData = Object.values(aggregation).map((item) => ({
    ...item,
    average: (item.total / item.count).toFixed(1),
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/relatorios')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Relatório de Desempenho
          </h2>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Média por Aluno/Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Disciplina (ID)</TableHead>
                <TableHead className="text-right">Média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.studentName}</TableCell>
                  <TableCell>{row.subjectId}</TableCell>
                  <TableCell className="text-right font-bold">
                    {row.average}
                  </TableCell>
                </TableRow>
              ))}
              {reportData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    Sem dados de avaliação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
