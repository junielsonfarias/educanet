import { useState, useEffect, useMemo } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { protocolService } from '@/lib/supabase/services'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { ProtocolFormDialog } from './components/ProtocolFormDialog'
import { ProtocolDetailsDialog } from './components/ProtocolDetailsDialog'
import { RequirePermission } from '@/components/RequirePermission'
import type { Database } from '@/lib/supabase/database.types'

type ProtocolRow = Database['public']['Tables']['secretariat_protocols']['Row']
type ProtocolWithDetails = ProtocolRow & {
  requester?: {
    id: number
    first_name: string
    last_name: string
    email?: string | null
    phone?: string | null
  }
  assigned_to_person?: {
    id: number
    first_name: string
    last_name: string
  } | null
}

type ProtocolStatus = 'Aberto' | 'Em_Analise' | 'Resolvido' | 'Cancelado'
type ProtocolType = 'matricula' | 'transferencia' | 'declaracao' | 'recurso' | 'outros'

export default function ProtocolsManager() {
  const { students, fetchStudents } = useStudentStore()
  const { schools, fetchSchools } = useSchoolStore()
  
  const [protocols, setProtocols] = useState<ProtocolWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ProtocolType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ProtocolStatus | 'all'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolWithDetails | null>(null)
  const [editingProtocol, setEditingProtocol] = useState<ProtocolWithDetails | null>(null)

  // Fetch data on mount
  useEffect(() => {
    fetchProtocols()
    fetchStudents()
    fetchSchools()
  }, [fetchStudents, fetchSchools])

  const fetchProtocols = async () => {
    setLoading(true)
    try {
      const data = await protocolService.getAll()
      // Buscar informações completas para cada protocolo
      const protocolsWithDetails = await Promise.all(
        (data || []).map(async (protocol: any) => {
          const fullInfo = await protocolService.getProtocolFullInfo(protocol.id)
          return fullInfo || protocol
        })
      )
      setProtocols(protocolsWithDetails.filter(Boolean))
    } catch (error) {
      console.error('Erro ao buscar protocolos:', error)
      toast.error('Erro ao carregar protocolos')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar protocolos
  const filteredProtocols = useMemo(() => {
    if (!Array.isArray(protocols)) return []
    
    return protocols.filter((protocol) => {
      const requesterName = protocol.requester
        ? `${protocol.requester.first_name} ${protocol.requester.last_name}`
        : ''
      
      const matchesSearch =
        searchTerm === '' ||
        protocol.protocol_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === 'all' || protocol.request_type === typeFilter
      const matchesStatus = statusFilter === 'all' || protocol.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [protocols, searchTerm, typeFilter, statusFilter])

  const handleCreateProtocol = () => {
    setEditingProtocol(null)
    setIsDialogOpen(true)
  }

  const handleViewProtocol = (protocol: ProtocolWithDetails) => {
    setSelectedProtocol(protocol)
    setIsDetailsDialogOpen(true)
  }

  const handleEditProtocol = (protocol: ProtocolWithDetails) => {
    setEditingProtocol(protocol)
    setIsDialogOpen(true)
  }

  const handleUpdateStatus = async (id: number, status: ProtocolStatus) => {
    try {
      await protocolService.updateStatus(id, status)
      toast.success(`Protocolo ${status === 'Resolvido' ? 'concluído' : 'atualizado'} com sucesso.`)
      fetchProtocols()
    } catch (error) {
      toast.error('Erro ao atualizar status do protocolo')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'Aberto': { variant: 'secondary', label: 'Aberto' },
      'Em_Analise': { variant: 'default', label: 'Em Análise' },
      'Resolvido': { variant: 'default', label: 'Resolvido' },
      'Cancelado': { variant: 'destructive', label: 'Cancelado' },
    }
    const config = statusMap[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
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

  const getPriorityBadge = (priority: string | null | undefined) => {
    const priorityMap: Record<string, { variant: 'default' | 'secondary' | 'destructive', label: string }> = {
      'normal': { variant: 'default', label: 'Normal' },
      'preferential': { variant: 'secondary', label: 'Preferencial' },
      'urgent': { variant: 'destructive', label: 'Urgente' },
    }
    const config = priority ? priorityMap[priority.toLowerCase()] : { variant: 'default' as const, label: 'Normal' }
    return <Badge variant={config.variant}>{config.label}</Badge>
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
                <SelectItem value="Aberto">Aberto</SelectItem>
                <SelectItem value="Em_Analise">Em Análise</SelectItem>
                <SelectItem value="Resolvido">Resolvido</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
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
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredProtocols.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Nenhum protocolo encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProtocols.map((protocol) => {
                    const requesterName = protocol.requester
                      ? `${protocol.requester.first_name} ${protocol.requester.last_name}`
                      : 'N/A'

                    return (
                      <TableRow key={`protocol-${protocol.id}`}>
                        <TableCell className="font-mono text-sm font-semibold">
                          {protocol.protocol_number || `PROT-${protocol.id}`}
                        </TableCell>
                        <TableCell>{getTypeLabel(protocol.request_type as ProtocolType)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{requesterName}</span>
                            {protocol.requester?.email && (
                              <span className="text-xs text-muted-foreground">
                                {protocol.requester.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">N/A</span>
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(protocol.priority || 'normal')}
                        </TableCell>
                        <TableCell>{getStatusBadge(protocol.status || 'Aberto')}</TableCell>
                        <TableCell>
                          {protocol.opening_date
                            ? new Date(protocol.opening_date).toLocaleDateString('pt-BR')
                            : 'N/A'}
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
                            {protocol.status !== 'Resolvido' && protocol.status !== 'Cancelado' && (
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
                                {protocol.status === 'Aberto' && (
                                  <RequirePermission permission="edit:protocol">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpdateStatus(protocol.id, 'Em_Analise')}
                                    >
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                  </RequirePermission>
                                )}
                                {protocol.status === 'Em_Analise' && (
                                  <RequirePermission permission="edit:protocol">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpdateStatus(protocol.id, 'Resolvido')}
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
        onSave={async (data) => {
          try {
            if (editingProtocol) {
              await protocolService.update(editingProtocol.id, data)
              toast.success('Protocolo atualizado com sucesso.')
            } else {
              await protocolService.createProtocol({
                requester_person_id: data.requester_person_id,
                request_type: data.request_type,
                description: data.description,
                priority: data.priority,
                student_profile_id: data.student_profile_id,
                school_id: data.school_id,
              })
              toast.success('Protocolo criado com sucesso.')
            }
            setEditingProtocol(null)
            fetchProtocols()
          } catch (error) {
            toast.error('Erro ao salvar protocolo')
          }
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

