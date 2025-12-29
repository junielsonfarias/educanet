import { useState } from 'react'
import { Users, Plus, Search, Filter, CheckCircle, Clock, XCircle, Phone } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import useQueueStore from '@/stores/useQueueStore'
import { ServiceQueue, ServiceType } from '@/lib/mock-data'
import { QueueTicketFormDialog } from './components/QueueTicketFormDialog'
import { RequirePermission } from '@/components/RequirePermission'

export default function ServiceQueue() {
  const { queue, addTicket, updateTicket, deleteTicket } = useQueueStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ServiceType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'calling' | 'attending' | 'completed' | 'cancelled'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filtrar tickets
  const filteredQueue = queue.filter((ticket) => {
    const matchesSearch =
      searchTerm === '' ||
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.requesterName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || ticket.type === typeFilter
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  // Ordenar por prioridade e data
  const sortedQueue = [...filteredQueue].sort((a, b) => {
    // Urgente primeiro
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
    if (b.priority === 'urgent' && a.priority !== 'urgent') return 1
    // Preferencial depois
    if (a.priority === 'preferential' && b.priority === 'normal') return -1
    if (b.priority === 'preferential' && a.priority === 'normal') return 1
    // Por data de criação
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const handleCreateTicket = () => {
    setIsDialogOpen(true)
  }

  const handleCallTicket = (id: string) => {
    updateTicket(id, { status: 'calling' })
    toast({
      title: 'Senha chamada',
      description: 'A senha foi chamada para atendimento.',
    })
  }

  const handleStartAttending = (id: string) => {
    updateTicket(id, { status: 'attending' })
    toast({
      title: 'Atendimento iniciado',
      description: 'O atendimento foi iniciado.',
    })
  }

  const handleCompleteTicket = (id: string) => {
    updateTicket(id, { status: 'completed' })
    toast({
      title: 'Atendimento concluído',
      description: 'O atendimento foi finalizado com sucesso.',
    })
  }

  const handleCancelTicket = (id: string) => {
    updateTicket(id, { status: 'cancelled' })
    toast({
      title: 'Senha cancelada',
      description: 'A senha foi cancelada.',
    })
  }

  const getStatusBadge = (status: ServiceQueue['status']) => {
    const labels: Record<ServiceQueue['status'], string> = {
      waiting: 'Aguardando',
      calling: 'Chamando',
      attending: 'Em Atendimento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    }
    const statusClasses: Record<ServiceQueue['status'], string> = {
      waiting: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md',
      calling: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md',
      attending: 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-md',
      completed: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md',
      cancelled: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md',
    }
    return (
      <Badge className={`flex items-center gap-1.5 px-2.5 py-1 font-medium ${statusClasses[status]}`}>
        <div className="h-2 w-2 rounded-full bg-white" />
        {labels[status]}
      </Badge>
    )
  }

  const getTypeLabel = (type: ServiceType): string => {
    const labels: Record<ServiceType, string> = {
      matricula: 'Matrícula',
      documentos: 'Documentos',
      informacoes: 'Informações',
      outros: 'Outros',
    }
    return labels[type] || type
  }

  const getPriorityBadge = (priority: ServiceQueue['priority']) => {
    const labels: Record<ServiceQueue['priority'], string> = {
      normal: 'Normal',
      preferential: 'Preferencial',
      urgent: 'Urgente',
    }
    const priorityClasses: Record<ServiceQueue['priority'], string> = {
      normal: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
      preferential: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md',
      urgent: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md animate-pulse',
    }
    return (
      <Badge className={`flex items-center gap-1.5 px-2.5 py-1 font-medium ${priorityClasses[priority]}`}>
        <div className={`h-2 w-2 rounded-full ${priority === 'urgent' ? 'bg-white animate-pulse' : 'bg-white'}`} />
        {labels[priority]}
      </Badge>
    )
  }

  const waitingTickets = sortedQueue.filter((t) => t.status === 'waiting')
  const activeTickets = sortedQueue.filter((t) => t.status === 'calling' || t.status === 'attending')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Fila de Atendimento
          </h2>
          <p className="text-muted-foreground">
            Gerencie a fila de atendimento da secretaria escolar.
          </p>
        </div>
        <RequirePermission permission="manage:queue">
          <Button 
            onClick={handleCreateTicket} 
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Nova Senha
          </Button>
        </RequirePermission>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-yellow-50/30 to-white border-yellow-200/50 hover:border-yellow-300 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-yellow-100 to-yellow-200">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              Aguardando
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-yellow-700">{waitingTickets.length}</div>
            <p className="text-xs text-muted-foreground">senhas na fila</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-white border-blue-200/50 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-100 to-blue-200">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              Em Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-blue-700">{activeTickets.length}</div>
            <p className="text-xs text-muted-foreground">senhas ativas</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/30 to-white border-indigo-200/50 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-100 to-indigo-200">
                <Clock className="h-4 w-4 text-indigo-600" />
              </div>
              Total Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sortedQueue.filter((t) => {
                const today = new Date().toDateString()
                return new Date(t.createdAt).toDateString() === today
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">senhas emitidas hoje</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Fila de Atendimento</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as senhas de atendimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por senha ou solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ServiceType | 'all')}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="matricula">Matrícula</SelectItem>
                <SelectItem value="documentos">Documentos</SelectItem>
                <SelectItem value="informacoes">Informações</SelectItem>
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
                <SelectItem value="waiting">Aguardando</SelectItem>
                <SelectItem value="calling">Chamando</SelectItem>
                <SelectItem value="attending">Em Atendimento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Senha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Nenhuma senha encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedQueue.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-lg font-bold">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell>{getTypeLabel(ticket.type)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{ticket.requesterName}</span>
                          {ticket.requesterPhone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {ticket.requesterPhone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        {new Date(ticket.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {ticket.status === 'waiting' && (
                            <RequirePermission permission="manage:queue">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCallTicket(ticket.id)}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            </RequirePermission>
                          )}
                          {ticket.status === 'calling' && (
                            <RequirePermission permission="manage:queue">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartAttending(ticket.id)}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </RequirePermission>
                          )}
                          {ticket.status === 'attending' && (
                            <RequirePermission permission="manage:queue">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCompleteTicket(ticket.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </RequirePermission>
                          )}
                          {ticket.status !== 'completed' && ticket.status !== 'cancelled' && (
                            <RequirePermission permission="manage:queue">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelTicket(ticket.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </RequirePermission>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <QueueTicketFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={(data) => {
          addTicket(data)
          toast({
            title: 'Senha criada',
            description: 'A senha foi criada com sucesso.',
          })
        }}
      />
    </div>
  )
}

