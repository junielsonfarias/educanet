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
import useTeacherStore from '@/stores/useTeacherStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'

export default function TeacherAllocationReport() {
  const navigate = useNavigate()
  const { teachers } = useTeacherStore()
  const { schools } = useSchoolStore()
  const { courses } = useCourseStore()

  const reportData = teachers.flatMap((teacher) =>
    teacher.allocations.map((alloc) => {
      const school = schools.find((s) => s.id === alloc.schoolId)
      const year = school?.academicYears.find(
        (y) => y.id === alloc.academicYearId,
      )
      const classroom = year?.classes.find((c) => c.id === alloc.classroomId)

      // Find subject name
      const allGrades = courses.flatMap((c) => c.grades)
      const allSubjects = allGrades.flatMap((g) => g.subjects)
      const subject = allSubjects.find((s) => s.id === alloc.subjectId)

      return {
        teacherName: teacher.name,
        schoolName: school?.name || 'N/A',
        yearName: year?.name || 'N/A',
        className: classroom?.name || 'N/A',
        subjectName: subject?.name || 'Regente',
      }
    }),
  )

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
            Alocação de Professores
          </h2>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quadro de Horários/Alocações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Escola</TableHead>
                <TableHead>Ano Letivo</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Disciplina</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {row.teacherName}
                  </TableCell>
                  <TableCell>{row.schoolName}</TableCell>
                  <TableCell>{row.yearName}</TableCell>
                  <TableCell>{row.className}</TableCell>
                  <TableCell>{row.subjectName}</TableCell>
                </TableRow>
              ))}
              {reportData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhuma alocação registrada.
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
