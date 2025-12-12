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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, ArrowRightLeft, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'
import { ExportActions } from '@/components/ExportActions'

export default function TransferReport() {
  const navigate = useNavigate()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()

  const [selectedSchool, setSelectedSchool] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')

  // Get unique years for filter
  const years = Array.from(
    new Set(
      students.flatMap((s) => s.enrollments.map((e) => e.year.toString())),
    ),
  ).sort((a, b) => b.localeCompare(a))

  // Filter transfers
  const transferData = students
    .flatMap((student) =>
      student.enrollments
        .filter((e) => e.status === 'Transferido')
        .map((enrollment) => {
          const school = schools.find((s) => s.id === enrollment.schoolId)
          return {
            studentName: student.name,
            registration: student.registration,
            schoolId: enrollment.schoolId,
            schoolName: school?.name || 'N/A',
            grade: enrollment.grade,
            year: enrollment.year.toString(),
            type: enrollment.type,
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/relatorios')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
              <ArrowRightLeft className="h-8 w-8" />
              Relatório de Transferências
            </h2>
            <p className="text-muted-foreground">
              Alunos transferidos da rede ou entre unidades escolares.
            </p>
          </div>
        </div>
        <ExportActions
          data={transferData}
          filename="relatorio_transferencias"
          columns={[
            'studentName',
            'registration',
            'schoolName',
            'grade',
            'year',
          ]}
        />
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
          <CardTitle>Listagem de Transferências</CardTitle>
        </CardHeader>
        <CardContent>
          {transferData.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum registro de transferência encontrado para os filtros
              selecionados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Escola de Origem</TableHead>
                  <TableHead>Série/Turma</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead>Tipo de Matrícula</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {row.studentName}
                    </TableCell>
                    <TableCell>{row.registration}</TableCell>
                    <TableCell>{row.schoolName}</TableCell>
                    <TableCell>{row.grade}</TableCell>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>
                      {row.type === 'regular' ? 'Regular' : 'Dependência'}
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
