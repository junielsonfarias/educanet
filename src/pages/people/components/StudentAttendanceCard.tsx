import { useMemo, useEffect } from 'react'
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
import { CalendarDays, CheckCircle2, XCircle } from 'lucide-react'
import { useAttendanceStore } from '@/stores/useAttendanceStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { format, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

interface StudentAttendanceCardProps {
  studentId: string
}

export function StudentAttendanceCard({
  studentId,
}: StudentAttendanceCardProps) {
  const { 
    attendances, 
    loading, 
    fetchStudentAttendance 
  } = useAttendanceStore()
  const { subjects } = useCourseStore()

  useEffect(() => {
    if (studentId) {
      fetchStudentAttendance(parseInt(studentId))
    }
  }, [studentId, fetchStudentAttendance])

  const stats = useMemo(() => {
    const total = attendances.length
    const present = attendances.filter((r) => r.status === 'Presente').length
    const absent = attendances.filter((r) => 
      r.status === 'Ausente' || r.status === 'Justificado'
    ).length
    const percentage = total > 0 ? (present / total) * 100 : 100

    return { total, present, absent, percentage }
  }, [attendances])

  const enrichedRecords = useMemo(() => {
    return attendances
      .map((record) => {
        const subject = subjects.find((s) => 
          s.id === record.lesson?.class_teacher_subject?.subject_id
        )

        return {
          id: record.id,
          date: record.lesson?.lesson_date || record.attendance_date || '',
          subjectName: subject?.name || record.lesson?.class_teacher_subject?.subject?.name || 'Geral',
          schoolName: record.lesson?.class_teacher_subject?.class?.school?.name || 'N/A',
          present: record.status === 'Presente',
          justification: record.notes || undefined,
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [attendances, subjects])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Frequência Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Percentual de presença
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Presenças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold">{stats.present}</div>
            </div>
            <p className="text-xs text-muted-foreground">Aulas comparecidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faltas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="text-2xl font-bold">{stats.absent}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ausências registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Registro de Frequência
          </CardTitle>
          <CardDescription>
            Histórico detalhado de presenças e faltas por dia e disciplina.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrichedRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum registro de frequência encontrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Justificativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(parseISO(record.date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.subjectName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {record.schoolName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={record.present ? 'outline' : 'destructive'}
                        className={
                          record.present
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : ''
                        }
                      >
                        {record.present ? 'Presente' : 'Falta'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground italic">
                      {record.justification || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
