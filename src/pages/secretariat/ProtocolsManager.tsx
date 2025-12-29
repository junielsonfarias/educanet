import { useState } from 'react'
import { FileText, Plus, Search, Filter, Eye, Edit, CheckCircle, XCircle, Clock } from 'lucide-react'
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
import useProtocolStore from '@/stores/useProtocolStore'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'
import { Protocol, ProtocolStatus, ProtocolType } from '@/lib/mock-data'
import { ProtocolFormDialog } from './components/ProtocolFormDialog'
import { ProtocolDetailsDialog } from './components/ProtocolDetailsDialog'
import { RequirePermission } from '@/components/RequirePermission'

export default function ProtocolsManager() {
  const {
    protocols,
    addProtocol,
    updateProtocol,
    deleteProtocol,
  } = useProtocolStore()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ProtocolType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ProtocolStatus | 'all'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null)
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null)

  // Filtrar protocolos
  const filteredProtocols = protocols.filter((protocol) => {
    const matchesSearch =
      searchTerm === '' ||
      protocol.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || protocol.type === typeFilter
    const matchesStatus = statusFilter === 'all' || protocol.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const handleCreateProtocol = () => {
    setEditingProtocol(null)
    setIsDialogOpen(true)
  }

  const handleViewProtocol = (protocol: Protocol) => {
    setSelectedProtocol(protocol)
    setIsDetailsDialogOpen(true)
  }

  const handleEditProtocol = (protocol: Protocol) => {
    setEditingProtocol(protocol)
    setIsDialogOpen(true)
  }

  const handleUpdateStatus = (id: string, status: ProtocolStatus) => {
    updateProtocol(id, { status })
    toast({
      title: 'Status atualizado',
      description: `Protocolo ${status === 'completed' ? 'concluído' : 'atualizado'} com sucesso.`,
    })
  }

  const getStatusBadge = (status: ProtocolStatus) => {
    const variants: Record<ProtocolStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'default',
      cancelled: 'destructive',
    }
    const labels: Record<ProtocolStatus, string> = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const getTypeLabel = (type: ProtocolType): string => {
    const labels: Record<ProtocolType, string> = {
      matricula: 'Matrícula',
      transferencia: 'Transferência',
      declaracao: 'Declaração',
      recurso: 'Recurso',
      outros: 'Outros',
    }
    return labels[type] || type
  }

  const getPriorityBadge = (priority: Protocol['priority']) => {
    const variants: Record<Protocol['priority'], 'default' | 'secondary' | 'destructive'> = {
      normal: 'default',
      preferential: 'secondary',
      urgent: 'destructive',
    }
    const labels: Record<Protocol['priority'], string> = {
      normal: 'Normal',
      preferential: 'Preferencial',
      urgent: 'Urgente',
    }
    return <Badge variant={variants[priority]}>{labels[priority]}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Protocolos de Documentos
          </h2>
          <p className="text-muted-foreground">
            Gerencie protocolos de solicitação de documentos e serviços.
          </p>
        </div>
        <RequirePermission permission="create:protocol">
          <Button 
            onClick={handleCreateProtocol} 
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Novo Protocolo
          </Button>
        </RequirePermission>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Protocolos Registrados</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os protocolos de documentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, solicitante ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ProtocolType | 'all')}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="matricula">Matrícula</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="declaracao">Declaração</SelectItem>
                <SelectItem value="recurso">Recurso</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ProtocolStatus | 'all')}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProtocols.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Nenhum protocolo encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProtocols.map((protocol) => {
                    const student = protocol.studentId
                      ? students.find((s) => s.id === protocol.studentId)
                      : undefined
                    const school = schools.find((s) => s.id === protocol.schoolId)

                    return (
                      <TableRow key={protocol.id}>
                        <TableCell className="font-mono text-sm font-semibold">
                          {protocol.number}
                        </TableCell>
                        <TableCell>{getTypeLabel(protocol.type)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{protocol.requester.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {protocol.requester.relationship}
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
                        <TableCell>{getPriorityBadge(protocol.priority)}</TableCell>
                        <TableCell>{getStatusBadge(protocol.status)}</TableCell>
                        <TableCell>
                          {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProtocol(protocol)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {protocol.status !== 'completed' && protocol.status !== 'cancelled' && (
                              <>
                                <RequirePermission permission="edit:protocol">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditProtocol(protocol)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </RequirePermission>
                                {protocol.status === 'pending' && (
                                  <RequirePermission permission="edit:protocol">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpdateStatus(protocol.id, 'in_progress')}
                                    >
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                  </RequirePermission>
                                )}
                                {protocol.status === 'in_progress' && (
                                  <RequirePermission permission="edit:protocol">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpdateStatus(protocol.id, 'completed')}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </RequirePermission>
                                )}
                              </>
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

      <ProtocolFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={(data) => {
          if (editingProtocol) {
            updateProtocol(editingProtocol.id, data)
            toast({
              title: 'Protocolo atualizado',
              description: 'O protocolo foi atualizado com sucesso.',
            })
          } else {
            addProtocol(data)
            toast({
              title: 'Protocolo criado',
              description: 'O protocolo foi criado com sucesso.',
            })
          }
          setEditingProtocol(null)
        }}
        initialData={editingProtocol}
      />

      {selectedProtocol && (
        <ProtocolDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          protocol={selectedProtocol}
        />
      )}
    </div>
  )
}

