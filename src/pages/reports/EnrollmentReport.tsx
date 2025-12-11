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
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'

export default function EnrollmentReport() {
  const navigate = useNavigate()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()

  // Flatten enrollments
  const reportData = students.flatMap((student) =>
    student.enrollments.map((enrollment) => {
      const school = schools.find((s) => s.id === enrollment.schoolId)
      return {
        studentName: student.name,
        registration: student.registration,
        schoolName: school?.name || 'N/A',
        grade: enrollment.grade,
        year: enrollment.year,
        status: enrollment.status,
        type: enrollment.type,
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
            Relatório de Matrículas
          </h2>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Escola</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.studentName}</TableCell>
                  <TableCell>{row.registration}</TableCell>
                  <TableCell>{row.schoolName}</TableCell>
                  <TableCell>{row.grade}</TableCell>
                  <TableCell>{row.year}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
