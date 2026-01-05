import { useState, useMemo, useEffect } from 'react'
import {
  Users,
  Calendar,
  FileText,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useAssessmentStore } from '@/stores/useAssessmentStore.supabase'
import { useAttendanceStore } from '@/stores/useAttendanceStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { classService } from '@/lib/supabase/services'
import { CouncilFormDialog } from './components/CouncilFormDialog'
import { CouncilDetailsDialog } from './components/CouncilDetailsDialog'
import { RequirePermission } from '@/components/RequirePermission'
import { EmptyState } from '@/components/ui/empty-state'

// Tipo temporário até implementar councils no BD
interface Council {
  id: string
  schoolId: string
  academicYearId: string
  classroomId: string
  classroomName: string
  periodName: string
  type: 'bimestral' | 'final' | 'extraordinary'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  scheduledDate: string
}

export default function ClassCouncil() {
  const { schools, loading: schoolsLoading, fetchSchools } = useSchoolStore()
  const { students, loading: studentsLoading, fetchStudents } = useStudentStore()
  const { grades, loading: gradesLoading, fetchGrades } = useAssessmentStore()
  const { attendanceRecords, loading: attendanceLoading, fetchAttendanceRecords } = useAttendanceStore()
  const { courses, loading: coursesLoading, fetchCourses } = useCourseStore()

  const [councils, setCouncils] = useState<Council[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [classroomFilter, setClassroomFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'bimestral' | 'final' | 'extraordinary'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all')
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedCouncil, setSelectedCouncil] = useState<string | null>(null)
  const [editingCouncil, setEditingCouncil] = useState<string | null>(null)

  // Fetch data on mount
  useEffect(() => {
    fetchSchools()
    fetchStudents()
    fetchGrades()
    fetchAttendanceRecords()
    fetchCourses()
    // TODO: Buscar councils do BD quando implementado
  }, [fetchSchools, fetchStudents, fetchGrades, fetchAttendanceRecords, fetchCourses])

  // Filtrar conselhos
  const filteredCouncils = useMemo(() => {
    return councils.filter((council) => {
      const matchesSearch =
        searchTerm === '' ||
        council.classroomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        council.periodName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSchool = schoolFilter === 'all' || council.schoolId === schoolFilter
      const matchesYear = yearFilter === 'all' || council.academicYearId === yearFilter
      const matchesClassroom = classroomFilter === 'all' || council.classroomId === classroomFilter
      const matchesType = typeFilter === 'all' || council.type === typeFilter
      const matchesStatus = statusFilter === 'all' || council.status === statusFilter

      return (
        matchesSearch &&
        matchesSchool &&
        matchesYear &&
        matchesClassroom &&
        matchesType &&
        matchesStatus
      )
    })
  }, [councils, searchTerm, schoolFilter, yearFilter, classroomFilter, typeFilter, statusFilter])

  // Obter escolas e turmas disponíveis
  const safeSchools = Array.isArray(schools) ? schools : []
  const availableSchools = safeSchools.filter((s) => !s.deleted_at)
  
  // Buscar turmas disponíveis
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  
  useEffect(() => {
    const fetchClasses = async () => {
      if (schoolFilter !== 'all') {
        try {
          const classes = await classService.getBySchool(parseInt(schoolFilter))
          setAvailableClasses(classes || [])
        } catch {
          // Silent fail for class filter
        }
      } else {
        setAvailableClasses([])
      }
    }
    fetchClasses()
  }, [schoolFilter])

  const handleCreateCouncil = () => {
    setEditingCouncil(null)
    setIsFormDialogOpen(true)
  }

  const handleViewCouncil = (councilId: string) => {
    setSelectedCouncil(councilId)
    setIsDetailsDialogOpen(true)
  }

  const handleEditCouncil = (councilId: string) => {
    setEditingCouncil(councilId)
    setIsFormDialogOpen(true)
  }

  const handleDeleteCouncil = async (councilId: string) => {
    // TODO: Implementar quando councils forem adicionados ao BD
    setCouncils(councils => councils.filter(c => c.id !== councilId))
    toast.success('Conselho removido com sucesso.')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'outline',
      in_progress: 'secondary',
      completed: 'default',
      cancelled: 'destructive',
    }

    const labels: Record<string, string> = {
      scheduled: 'Agendado',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    }

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      bimestral: 'Bimestral',
      final: 'Final',
      extraordinary: 'Extraordinário',
    }

    return <Badge variant="outline">{labels[type] || type}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conselho de Classe</h1>
          <p className="text-muted-foreground">
            Gerencie e registre os conselhos de classe das turmas.
          </p>
        </div>
        <RequirePermission permission="create:assessment">
          <Button 
            onClick={handleCreateCouncil}
            className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Novo Conselho
          </Button>
        </RequirePermission>
      </div>

      {/* Filtros */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-white border-purple-200/50 hover:shadow-lg transition-all duration-300 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
              <Filter className="h-5 w-5 text-purple-600" />
            </div>
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por turma ou período..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Escolas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Escolas</SelectItem>
                {availableSchools.map((school) => (
                  <SelectItem key={school.id} value={school.id.toString()}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={yearFilter}
              onValueChange={setYearFilter}
              disabled={schoolFilter === 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os Anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {/* TODO: Buscar anos letivos quando implementado */}
              </SelectContent>
            </Select>

            <Select
              value={classroomFilter}
              onValueChange={setClassroomFilter}
              disabled={schoolFilter === 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as Turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Turmas</SelectItem>
                {availableClasses.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id.toString()}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="bimestral">Bimestral</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="extraordinary">Extraordinário</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Conselhos */}
      <Card>
        <CardHeader>
          <CardTitle>Conselhos de Classe</CardTitle>
          <CardDescription>
            {filteredCouncils.length} conselho(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || schoolsLoading || studentsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : filteredCouncils.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum conselho encontrado"
              description={
                councils.length === 0
                  ? 'Comece criando um novo conselho de classe. Esta funcionalidade será implementada em breve no banco de dados.'
                  : 'Tente ajustar os filtros para encontrar conselhos.'
              }
              action={
                councils.length === 0 ? (
                  <RequirePermission permission="create:assessment">
                    <Button 
                      onClick={handleCreateCouncil}
                      className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
                    >
                      <div className="p-1 rounded-md bg-white/20 mr-2">
                        <Plus className="h-5 w-5" />
                      </div>
                      Criar Primeiro Conselho
                    </Button>
                  </RequirePermission>
                ) : undefined
              }
              theme="purple"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCouncils.map((council) => (
                  <TableRow key={`council-${council.id}`}>
                    <TableCell>
                      {council.scheduledDate
                        ? format(new Date(council.scheduledDate), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {council.classroomName}
                    </TableCell>
                    <TableCell>{council.periodName}</TableCell>
                    <TableCell>{getTypeBadge(council.type)}</TableCell>
                    <TableCell>{getStatusBadge(council.status)}</TableCell>
                    <TableCell>
                      {/* TODO: Buscar contagem real de alunos quando implementado */}
                      N/A
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewCouncil(council.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {council.status !== 'completed' && (
                          <RequirePermission permission="edit:assessment">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCouncil(council.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </RequirePermission>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CouncilFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        councilId={editingCouncil}
        onSuccess={() => {
          setIsFormDialogOpen(false)
          setEditingCouncil(null)
        }}
      />

      <CouncilDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        councilId={selectedCouncil}
        onEdit={() => {
          if (selectedCouncil) {
            setIsDetailsDialogOpen(false)
            handleEditCouncil(selectedCouncil)
          }
        }}
        onDelete={() => {
          if (selectedCouncil) {
            handleDeleteCouncil(selectedCouncil)
            setIsDetailsDialogOpen(false)
            setSelectedCouncil(null)
          }
        }}
      />
    </div>
  )
}

