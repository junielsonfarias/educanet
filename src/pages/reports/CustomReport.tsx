import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Search,
  Filter,
  CheckSquare,
  Square,
  LayoutTemplate,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import useReportStore, { CustomReportConfig } from '@/stores/useReportStore'
import { ExportActions } from '@/components/ExportActions'
import { useToast } from '@/hooks/use-toast'

const AVAILABLE_FIELDS = [
  { id: 'name', label: 'Nome do Aluno' },
  { id: 'registration', label: 'Matrícula' },
  { id: 'school', label: 'Escola' },
  { id: 'grade', label: 'Turma/Série' },
  { id: 'year', label: 'Ano Letivo' },
  { id: 'status', label: 'Status' },
  { id: 'cpf', label: 'CPF' },
  { id: 'phone', label: 'Telefone' },
  { id: 'guardian', label: 'Responsável' },
]

export default function CustomReport() {
  const navigate = useNavigate()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const { savedReports, saveReportConfig, deleteReportConfig } =
    useReportStore()
  const { toast } = useToast()

  // State for Filters
  const [selectedSchool, setSelectedSchool] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name',
    'registration',
    'school',
    'grade',
    'status',
  ])

  // State for Saving
  const [reportName, setReportName] = useState('')
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [selectedSavedReportId, setSelectedSavedReportId] = useState<string>('')

  // Toggle Field
  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((f) => f !== fieldId)
        : [...prev, fieldId],
    )
  }

  // Load Saved Report
  useEffect(() => {
    if (selectedSavedReportId && selectedSavedReportId !== 'new') {
      const report = savedReports.find((r) => r.id === selectedSavedReportId)
      if (report) {
        setSelectedFields(report.fields)
        setSelectedSchool(report.filters.schoolId || 'all')
        setSelectedYear(report.filters.yearId || 'all')
        setSelectedStatus(report.filters.status || 'all')
      }
    }
  }, [selectedSavedReportId, savedReports])

  // Generate Data
  const reportData = useMemo(() => {
    return students.flatMap((student) => {
      // If filtering by school/year, we need to check enrollments
      const relevantEnrollments = student.enrollments.filter((e) => {
        const matchSchool =
          selectedSchool === 'all' || e.schoolId === selectedSchool
        const matchYear =
          selectedYear === 'all' || e.year.toString() === selectedYear
        const matchStatus =
          selectedStatus === 'all' || e.status === selectedStatus
        return matchSchool && matchYear && matchStatus
      })

      if (relevantEnrollments.length === 0) return []

      // If multiple enrollments match, we might produce multiple rows per student
      return relevantEnrollments.map((e) => {
        const school = schools.find((s) => s.id === e.schoolId)
        return {
          id: `${student.id}-${e.id}`,
          name: student.name,
          registration: student.registration,
          school: school?.name || 'N/A',
          grade: e.grade,
          year: e.year,
          status: e.status,
          cpf: student.cpf || '-',
          phone: student.contacts.phone || '-',
          guardian: student.guardian,
        }
      })
    })
  }, [students, schools, selectedSchool, selectedYear, selectedStatus])

  const handleSaveReport = () => {
    if (!reportName) return
    saveReportConfig({
      name: reportName,
      fields: selectedFields,
      filters: {
        schoolId: selectedSchool !== 'all' ? selectedSchool : undefined,
        yearId: selectedYear !== 'all' ? selectedYear : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      },
    })
    setIsSaveDialogOpen(false)
    setReportName('')
    toast({ title: 'Sucesso', description: 'Configuração de relatório salva.' })
  }

  const handleDeleteReport = (id: string) => {
    deleteReportConfig(id)
    if (selectedSavedReportId === id) setSelectedSavedReportId('new')
    toast({ title: 'Excluído', description: 'Configuração removida.' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
              <LayoutTemplate className="h-8 w-8" />
              Relatórios Personalizados
            </h2>
            <p className="text-muted-foreground">
              Crie relatórios sob medida selecionando campos e filtros.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={selectedSavedReportId}
            onValueChange={setSelectedSavedReportId}
          >
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Carregar relatório salvo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">-- Novo Relatório --</SelectItem>
              {savedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between w-full"
                >
                  <SelectItem value={report.id}>{report.name}</SelectItem>
                </div>
              ))}
            </SelectContent>
          </Select>
          {selectedSavedReportId && selectedSavedReportId !== 'new' && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDeleteReport(selectedSavedReportId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters & Config Panel */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fields Selection */}
            <div className="space-y-3">
              <Label>Campos para Exibição</Label>
              <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-[200px] overflow-y-auto">
                {AVAILABLE_FIELDS.map((field) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`field-${field.id}`}
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                    />
                    <label
                      htmlFor={`field-${field.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {field.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Escola</Label>
                <Select
                  value={selectedSchool}
                  onValueChange={setSelectedSchool}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Escolas</SelectItem>
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ano Letivo</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Cursando">Cursando</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                    <SelectItem value="Reprovado">Reprovado</SelectItem>
                    <SelectItem value="Transferido">Transferido</SelectItem>
                    <SelectItem value="Abandono">Abandono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <Dialog
                open={isSaveDialogOpen}
                onOpenChange={setIsSaveDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Save className="mr-2 h-4 w-4" /> Salvar Configuração
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Salvar Relatório Personalizado</DialogTitle>
                    <DialogDescription>
                      Dê um nome para este relatório para acessá-lo facilmente
                      depois.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label>Nome do Relatório</Label>
                    <Input
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Ex: Alunos Ativos 2024"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveReport}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>
                {reportData.length} registros encontrados com os filtros atuais.
              </CardDescription>
            </div>
            <ExportActions
              data={reportData}
              filename={`relatorio_personalizado_${new Date().toISOString().split('T')[0]}`}
              columns={selectedFields}
            />
          </CardHeader>
          <CardContent>
            {reportData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum dado encontrado para os critérios selecionados.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedFields.map((fieldId) => {
                        const field = AVAILABLE_FIELDS.find(
                          (f) => f.id === fieldId,
                        )
                        return (
                          <TableHead key={fieldId}>
                            {field?.label || fieldId}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.slice(0, 50).map((row: any) => (
                      <TableRow key={row.id}>
                        {selectedFields.map((fieldId) => (
                          <TableCell key={fieldId}>{row[fieldId]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {reportData.length > 50 && (
                  <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20">
                    Mostrando os primeiros 50 registros. Exporte para ver todos.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
