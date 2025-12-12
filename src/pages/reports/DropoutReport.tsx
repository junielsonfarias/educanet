import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Printer, AlertTriangle, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'
import { Badge } from '@/components/ui/badge'

export default function DropoutReport() {
  const navigate = useNavigate()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()

  const [selectedSchool, setSelectedSchool] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')

  const years = Array.from(
    new Set(
      students.flatMap((s) => s.enrollments.map((e) => e.year.toString())),
    ),
  ).sort((a, b) => b.localeCompare(a))

  // Filter dropouts (Abandono)
  const dropoutData = students
    .flatMap((student) =>
      student.enrollments
        .filter((e) => e.status === 'Abandono')
        .map((enrollment) => {
          const school = schools.find((s) => s.id === enrollment.schoolId)
          return {
            studentName: student.name,
            registration: student.registration,
            schoolId: enrollment.schoolId,
            schoolName: school?.name || 'N/A',
            grade: enrollment.grade,
            year: enrollment.year.toString(),
            contacts: student.contacts, // Useful for contact attempt
          }
        }),
    )
    .filter((item) => {
      const matchSchool =
        selectedSchool === 'all' || item.schoolId === selectedSchool
      const matchYear = selectedYear === 'all' || item.year === selectedYear
      return matchSchool && matchYear
    })

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
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            Relatório de Evasão (Abandono)
          </h2>
          <p className="text-muted-foreground">
            Alunos em situação de abandono escolar.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Escolas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Escolas</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Listagem de Abandono</CardTitle>
            <Badge variant="destructive">Total: {dropoutData.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {dropoutData.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum registro de abandono encontrado para os filtros
              selecionados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Série/Turma</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead>Contato (Resp.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dropoutData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-destructive">
                      {row.studentName}
                    </TableCell>
                    <TableCell>{row.registration}</TableCell>
                    <TableCell>{row.schoolName}</TableCell>
                    <TableCell>{row.grade}</TableCell>
                    <TableCell>{row.year}</TableCell>
                    <TableCell className="text-sm">
                      <div>{row.contacts?.phone || '-'}</div>
                      <div className="text-muted-foreground text-xs">
                        {row.contacts?.email || '-'}
                      </div>
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
