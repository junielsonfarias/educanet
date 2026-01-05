import { useState, useEffect, useMemo } from 'react'
import { Calendar, Plus, Search, Filter, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
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
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { AppointmentFormDialog } from './components/AppointmentFormDialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RequirePermission } from '@/components/RequirePermission'

// Tipo temporário até implementar appointments no BD
interface Appointment {
  id: string
  type: 'matricula' | 'documentos' | 'informacoes' | 'reuniao' | 'outros'
  requesterName: string
  requesterPhone: string
  dateTime: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  confirmedAt?: string
  notes?: string
}

type AppointmentType = 'matricula' | 'documentos' | 'informacoes' | 'reuniao' | 'outros'

export default function AppointmentsManager() {
  const { students, loading: studentsLoading, fetchStudents } = useStudentStore()
  const { schools, loading: schoolsLoading, fetchSchools } = useSchoolStore()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<AppointmentType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    fetchStudents()
    fetchSchools()
    // TODO: Buscar appointments do BD quando implementado
  }, [fetchStudents, fetchSchools])

  // Filtrar agendamentos
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        searchTerm === '' ||
        appointment.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.requesterPhone.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === 'all' || appointment.type === typeFilter
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [appointments, searchTerm, typeFilter, statusFilter])

  // Ordenar por data
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    })
  }, [filteredAppointments])

  const handleCreateAppointment = () => {
    setEditingAppointment(null)
    setIsDialogOpen(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setIsDialogOpen(true)
  }

  const handleConfirmAppointment = async (id: string) => {
    // TODO: Atualizar no BD quando implementado
    setAppointments(appointments =>
      appointments.map(a => a.id === id ? { ...a, status: 'confirmed', confirmedAt: new Date().toISOString() } : a)
    )
    toast.success('Agendamento confirmado com sucesso.')
  }

  const handleCompleteAppointment = async (id: string) => {
    // TODO: Atualizar no BD quando implementado
    setAppointments(appointments =>
      appointments.map(a => a.id === id ? { ...a, status: 'completed' } : a)
    )
    toast.success('Agendamento concluído com sucesso.')
  }

  const handleCancelAppointment = async (id: string) => {
    // TODO: Atualizar no BD quando implementado
    setAppointments(appointments =>
      appointments.map(a => a.id === id ? { ...a, status: 'cancelled' } : a)
    )
    toast.success('Agendamento cancelado com sucesso.')
  }

  const getStatusBadge = (status: Appointment['status']) => {
    const variants: Record<Appointment['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'secondary',
      confirmed: 'default',
      completed: 'default',
      cancelled: 'destructive',
    }
    const labels: Record<Appointment['status'], string> = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const getTypeLabel = (type: AppointmentType): string => {
    const labels: Record<AppointmentType, string> = {
      matricula: 'Matrícula',
      documentos: 'Documentos',
      informacoes: 'Informações',
      reuniao: 'Reunião',
      outros: 'Outros',
    }
    return labels[type] || type
  }

  const upcomingAppointments = sortedAppointments.filter(
    (a) => new Date(a.dateTime) >= new Date() && a.status !== 'completed' && a.status !== 'cancelled',
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Agendamentos
          </h2>
          <p className="text-muted-foreground">
            Gerencie agendamentos de atendimento na secretaria.
          </p>
        </div>
        <RequirePermission permission="create:appointment">
          <Button 
            onClick={handleCreateAppointment} 
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Novo Agendamento
          </Button>
        </RequirePermission>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/30 to-white border-indigo-200/50 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-100 to-indigo-200">
                <Calendar className="h-4 w-4 text-indigo-600" />
              </div>
              Próximos
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-indigo-700">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">agendamentos futuros</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-white border-blue-200/50 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-100 to-blue-200">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortedAppointments.filter((a) => {
                const today = new Date().toDateString()
                return new Date(a.dateTime).toDateString() === today && a.status !== 'cancelled'
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">agendamentos hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortedAppointments.filter((a) => a.status === 'confirmed').length}
            </div>
            <p className="text-xs text-muted-foreground">agendamentos confirmados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Agendamentos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os agendamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por solicitante ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as AppointmentType | 'all')}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="matricula">Matrícula</SelectItem>
                <SelectItem value="documentos">Documentos</SelectItem>
                <SelectItem value="informacoes">Informações</SelectItem>
                <SelectItem value="reuniao">Reunião</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || studentsLoading || schoolsLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-8 w-8 opacity-50" />
                        <p>Nenhum agendamento encontrado.</p>
                        <p className="text-sm">Esta funcionalidade será implementada em breve no banco de dados.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAppointments.map((appointment) => {
                    // TODO: Buscar aluno quando appointments tiverem studentId
                    const student = undefined

                    return (
                      <TableRow key={`appointment-${appointment.id}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(new Date(appointment.dateTime), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(appointment.dateTime), "HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeLabel(appointment.type)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{appointment.requesterName}</span>
                            <span className="text-xs text-muted-foreground">
                              {appointment.requesterPhone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {student ? (
                            <div className="flex flex-col">
                              <span>{student.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {student.registration}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {appointment.status === 'scheduled' && (
                              <RequirePermission permission="edit:appointment">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleConfirmAppointment(appointment.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </RequirePermission>
                            )}
                            {appointment.status === 'confirmed' && (
                              <RequirePermission permission="edit:appointment">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCompleteAppointment(appointment.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </RequirePermission>
                            )}
                            <RequirePermission permission="edit:appointment">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAppointment(appointment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </RequirePermission>
                            {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                              <RequirePermission permission="edit:appointment">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelAppointment(appointment.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </RequirePermission>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AppointmentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={async (data) => {
          try {
            if (editingAppointment) {
              // TODO: Atualizar no BD quando implementado
              setAppointments(appointments =>
                appointments.map(a => a.id === editingAppointment.id ? { ...editingAppointment, ...data } : a)
              )
              toast.success('Agendamento atualizado com sucesso.')
            } else {
              // TODO: Criar no BD quando implementado
              const newAppointment: Appointment = {
                id: `appointment-${Date.now()}`,
                ...data,
                status: 'scheduled',
              }
              setAppointments([...appointments, newAppointment])
              toast.success('Agendamento criado com sucesso.')
            }
            setEditingAppointment(null)
            setIsDialogOpen(false)
          } catch (error) {
            toast.error('Erro ao salvar agendamento')
          }
        }}
        initialData={editingAppointment}
      />
    </div>
  )
}

