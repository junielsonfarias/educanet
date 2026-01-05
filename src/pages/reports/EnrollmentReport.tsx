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
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { enrollmentService } from '@/lib/supabase/services'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function EnrollmentReport() {
  const navigate = useNavigate()
  const { students, fetchStudents } = useStudentStore()
  const { schools, fetchSchools } = useSchoolStore()
  const [reportData, setReportData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
    fetchSchools()
  }, [fetchStudents, fetchSchools])

  useEffect(() => {
    const loadEnrollments = async () => {
      setLoading(true)
      try {
        // Buscar todas as matrículas
        const allEnrollments: any[] = []
        
        for (const student of students) {
          try {
            const enrollments = await enrollmentService.getByStudent(student.id)
            for (const enrollment of enrollments) {
              const school = schools.find((s) => s.id === enrollment.school_id)
              const className = enrollment.class?.name || 'N/A'
              const academicYear = enrollment.academic_year?.name || 'N/A'
              
              allEnrollments.push({
                studentName: `${student.person?.first_name || ''} ${student.person?.last_name || ''}`.trim(),
                registration: student.registration_number || student.id,
                schoolName: school?.name || 'N/A',
                grade: className,
                year: academicYear,
                status: enrollment.status || 'Ativo',
                type: enrollment.enrollment_type || 'Regular',
              })
            }
          } catch {
            // Skip this student on error
          }
        }
        
        setReportData(allEnrollments)
      } catch {
        toast.error('Erro ao carregar dados do relatório')
      } finally {
        setLoading(false)
      }
    }

    if (students.length > 0 && schools.length > 0) {
      loadEnrollments()
    }
  }, [students, schools])

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
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={`skeleton-${index}`} className="h-12 w-full" />
              ))}
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma matrícula encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Ano Letivo</TableHead>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
