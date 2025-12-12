import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, Calendar, FileText } from 'lucide-react'
import { HistoryEntry } from './types'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface PublicAssessmentHistoryProps {
  history: HistoryEntry[]
}

export function PublicAssessmentHistory({
  history,
}: PublicAssessmentHistoryProps) {
  // Group by Period for better navigation/visualization
  const groupedHistory = history.reduce(
    (acc, entry) => {
      if (!acc[entry.period]) {
        acc[entry.period] = []
      }
      acc[entry.period].push(entry)
      return acc
    },
    {} as Record<string, HistoryEntry[]>,
  )

  const sortedPeriods = Object.keys(groupedHistory).sort()

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma avaliação registrada no histórico.
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">
          Histórico Completo de Avaliações
        </h3>
      </div>

      {sortedPeriods.map((periodName) => (
        <Card key={periodName} className="border-l-4 border-l-primary/50">
          <CardHeader className="py-3 bg-muted/20">
            <CardTitle className="text-base font-semibold text-primary flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {periodName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="text-center w-[100px]">Nota</TableHead>
                  <TableHead className="text-center w-[120px]">
                    Situação
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedHistory[periodName].map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="text-sm">
                      {item.date
                        ? format(parseISO(item.date), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.subject}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          {item.type}
                        </span>
                        {item.category === 'recuperation' && (
                          <span className="text-xs text-amber-600 font-medium ml-4">
                            Recuperação
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'font-bold',
                          item.value < 6 ? 'text-red-600' : 'text-blue-600',
                          item.isRecovered &&
                            'line-through text-muted-foreground/50 text-xs font-normal mr-2',
                        )}
                      >
                        {item.isRecovered
                          ? item.originalValue?.toFixed(1)
                          : item.value.toFixed(1)}
                      </span>
                      {item.isRecovered && (
                        <span className="font-bold text-green-600">
                          {item.recoveryValue?.toFixed(1)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isRecovered ? (
                        <Badge
                          variant="outline"
                          className="border-green-200 text-green-700 bg-green-50"
                        >
                          Recuperado
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-muted text-muted-foreground"
                        >
                          Lançada
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
