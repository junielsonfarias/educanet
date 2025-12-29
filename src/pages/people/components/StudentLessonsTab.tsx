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
import { CheckCircle2, Circle } from 'lucide-react'
import { Student } from '@/lib/mock-data'
import useLessonPlanStore from '@/stores/useLessonPlanStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'
import { format, parseISO } from 'date-fns'

interface StudentLessonsTabProps {
  student: Student
}

export function StudentLessonsTab({ student }: StudentLessonsTabProps) {
  const { lessonPlans } = useLessonPlanStore()
  const { schools } = useSchoolStore()
  const { etapasEnsino } = useCourseStore()

  // Find active enrollment
  const enrollment = student.enrollments.find((e) => e.status === 'Cursando')

  if (!enrollment) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        O aluno não possui matrícula ativa.
      </div>
    )
  }

  // Find school and active year
  const school = schools.find((s) => s.id === enrollment.schoolId)
  const academicYear = school?.academicYears.find(
    (y) => y.name === enrollment.year.toString(),
  )
    const turmas = academicYear?.turmas || []
    const classroom = turmas.find(
    (c) => c.name === enrollment.grade,
  )

  if (!classroom) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Turma não encontrada.
      </div>
    )
  }

  // Filter plans for this class
  const classPlans = lessonPlans.filter((p) => p.classroomId === classroom.id)

  // Enrich plan data with subject names
  const enrichedPlans = classPlans
    .map((plan) => {
      // Find subject name
      const allSeriesAnos = etapasEnsino.flatMap((e) => e.seriesAnos)
      const allSubjects = allSeriesAnos.flatMap((s) => s.subjects)
      const subject = allSubjects.find((s) => s.id === plan.subjectId)

      return {
        ...plan,
        subjectName: subject?.name || 'Geral',
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo Ministrado</CardTitle>
          <CardDescription>
            Acompanhamento dos planos de aula executados na turma{' '}
            {enrollment.grade}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrichedPlans.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum plano de aula registrado para esta turma.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Tema/Conteúdo</TableHead>
                  <TableHead>Recursos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      {new Date(plan.date) <= new Date() ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(plan.date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {plan.subjectName}
                    </TableCell>
                    <TableCell>{plan.topic}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {plan.attachments && plan.attachments.length > 0 ? (
                        <Badge variant="outline">
                          {plan.attachments.length} anexo(s)
                        </Badge>
                      ) : (
                        '-'
                      )}
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
