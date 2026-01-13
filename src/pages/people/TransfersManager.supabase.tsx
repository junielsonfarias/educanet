/**
 * TransfersManager - Gerenciamento de Transferencias (Versao Supabase)
 *
 * Gerencia todo o fluxo de transferencias de alunos:
 * - Transferencia interna (entre escolas do municipio)
 * - Transferencia externa (saida para outros municipios)
 * - Fluxo de aprovacao (solicitar -> aprovar -> efetivar)
 */

import { useState, useMemo, useEffect } from 'react'
import {
  ArrowRight,
  ArrowLeftRight,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Users,
  TrendingUp,
  Loader2,
  RefreshCw,
  FileText,
  Send,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useTransferStore } from '@/stores/useTransferStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useUserStore } from '@/stores/useUserStore.supabase'
import { TransferFormDialogSupabase } from './components/TransferFormDialog.supabase'
import { TransferDetailsDialogSupabase } from './components/TransferDetailsDialog.supabase'
import { RequirePermission } from '@/components/RequirePermission'
import type { TransferStatus, TransferWithDetails } from '@/lib/supabase/services'

export default function TransfersManagerSupabase() {
  // Stores
  const {
    transfers,
    pendentesAprovacao,
    stats,
    loading,
    fetchByEscolaOrigem,
    fetchByEscolaDestino,
    fetchPendentesAprovacao,
    fetchStats,
    aprovarTransferencia,
    efetivarTransferencia,
    rejeitarTransferencia,
    cancelarTransferencia,
  } = useTransferStore()

  const { schools, fetchSchools } = useSchoolStore()
  const { currentUser } = useUserStore()

  // Estado local
  const [searchTerm, setSearchTerm] = useState('')
  const [schoolFilter, setSchoolFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Interna' | 'Externa_Saida'>('all')
  const [activeTab, setActiveTab] = useState('todas')

  // Dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null)

  // Dialog de rejeicao
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingTransferId, setRejectingTransferId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Dialog de efetivacao
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmingTransferId, setConfirmingTransferId] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<'aprovar' | 'efetivar' | 'cancelar'>('aprovar')

  // Carregar dados iniciais
  useEffect(() => {
    fetchSchools()
    fetchStats()

    // Se usuario tem escola vinculada, carregar transferencias dessa escola
    if (currentUser?.school_id) {
      fetchByEscolaOrigem(currentUser.school_id)
      fetchPendentesAprovacao(currentUser.school_id)
    }
  }, [fetchSchools, fetchStats, fetchByEscolaOrigem, fetchPendentesAprovacao, currentUser?.school_id])

  // Carregar transferencias quando escola filtrada mudar
  useEffect(() => {
    if (schoolFilter !== 'all') {
      const escolaId = parseInt(schoolFilter)
      fetchByEscolaOrigem(escolaId)
      fetchByEscolaDestino(escolaId)
      fetchPendentesAprovacao(escolaId)
    }
  }, [schoolFilter, fetchByEscolaOrigem, fetchByEscolaDestino, fetchPendentesAprovacao])

  // Escolas ativas
  const activeSchools = useMemo(() => {
    return (schools || []).filter((s) => !s.deleted_at)
  }, [schools])

  // Filtrar transferencias
  const filteredTransfers = useMemo(() => {
    const list = activeTab === 'pendentes' ? pendentesAprovacao : transfers

    return list.filter((transfer) => {
      // Busca por texto
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        searchTerm === '' ||
        transfer.student?.person?.first_name?.toLowerCase().includes(searchLower) ||
        transfer.student?.person?.last_name?.toLowerCase().includes(searchLower) ||
        transfer.escola_origem?.name?.toLowerCase().includes(searchLower) ||
        transfer.escola_destino?.name?.toLowerCase().includes(searchLower)

      // Filtro por escola
      const matchesSchool =
        schoolFilter === 'all' ||
        transfer.escola_origem_id === parseInt(schoolFilter) ||
        transfer.escola_destino_id === parseInt(schoolFilter)

      // Filtro por status
      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter

      // Filtro por tipo
      const matchesType = typeFilter === 'all' || transfer.tipo === typeFilter

      return matchesSearch && matchesSchool && matchesStatus && matchesType
    })
  }, [transfers, pendentesAprovacao, activeTab, searchTerm, schoolFilter, statusFilter, typeFilter])

  // Handlers
  const handleCreateTransfer = () => {
    setSelectedTransferId(null)
    setIsFormDialogOpen(true)
  }

  const handleViewTransfer = (transferId: number) => {
    setSelectedTransferId(transferId)
    setIsDetailsDialogOpen(true)
  }

  const handleAprovar = (transferId: number) => {
    setConfirmingTransferId(transferId)
    setConfirmAction('aprovar')
    setConfirmDialogOpen(true)
  }

  const handleEfetivar = (transferId: number) => {
    setConfirmingTransferId(transferId)
    setConfirmAction('efetivar')
    setConfirmDialogOpen(true)
  }

  const handleRejeitar = (transferId: number) => {
    setRejectingTransferId(transferId)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleCancelar = (transferId: number) => {
    setConfirmingTransferId(transferId)
    setConfirmAction('cancelar')
    setConfirmDialogOpen(true)
  }

  const confirmActionHandler = async () => {
    if (!confirmingTransferId || !currentUser?.person_id) return

    if (confirmAction === 'aprovar') {
      await aprovarTransferencia(confirmingTransferId, currentUser.person_id)
    } else if (confirmAction === 'efetivar') {
      await efetivarTransferencia(confirmingTransferId)
    } else if (confirmAction === 'cancelar') {
      await cancelarTransferencia(confirmingTransferId, currentUser.person_id)
    }

    setConfirmDialogOpen(false)
    setConfirmingTransferId(null)

    // Recarregar dados
    if (schoolFilter !== 'all') {
      const escolaId = parseInt(schoolFilter)
      fetchByEscolaOrigem(escolaId)
      fetchPendentesAprovacao(escolaId)
    }
  }

  const confirmRejectHandler = async () => {
    if (!rejectingTransferId || !currentUser?.person_id || !rejectReason) return

    await rejeitarTransferencia(rejectingTransferId, currentUser.person_id, rejectReason)

    setRejectDialogOpen(false)
    setRejectingTransferId(null)
    setRejectReason('')

    // Recarregar dados
    if (schoolFilter !== 'all') {
      const escolaId = parseInt(schoolFilter)
      fetchByEscolaOrigem(escolaId)
      fetchPendentesAprovacao(escolaId)
    }
  }

  const handleRefresh = () => {
    fetchStats()
    if (schoolFilter !== 'all') {
      const escolaId = parseInt(schoolFilter)
      fetchByEscolaOrigem(escolaId)
      fetchByEscolaDestino(escolaId)
      fetchPendentesAprovacao(escolaId)
    }
  }

  // Renderizar badge de status
  const getStatusBadge = (status: TransferStatus) => {
    const config: Record<TransferStatus, { label: string; className: string; icon: React.ReactNode }> = {
      Pendente: {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3" />,
      },
      Aprovada: {
        label: 'Aprovada',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Efetivada: {
        label: 'Efetivada',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Rejeitada: {
        label: 'Rejeitada',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="h-3 w-3" />,
      },
      Cancelada: {
        label: 'Cancelada',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <XCircle className="h-3 w-3" />,
      },
    }

    const { label, className, icon } = config[status] || config.Pendente

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
        {icon}
        {label}
      </Badge>
    )
  }

  // Renderizar badge de tipo
  const getTypeBadge = (tipo: string) => {
    const isInternal = tipo === 'Interna'
    return (
      <Badge variant="outline" className={isInternal ? 'border-blue-200 text-blue-700' : 'border-orange-200 text-orange-700'}>
        {isInternal ? 'Interna' : 'Externa'}
      </Badge>
    )
  }

  // Nome completo do aluno
  const getStudentName = (transfer: TransferWithDetails) => {
    const person = transfer.student?.person
    if (!person) return 'N/A'
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'N/A'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transferencias</h1>
          <p className="text-muted-foreground">
            Gerencie transferencias de alunos entre escolas da rede municipal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <RequirePermission permission="create:transfer">
            <Button onClick={handleCreateTransfer}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transferencia
            </Button>
          </RequirePermission>
        </div>
      </div>

      {/* Cards de Estatisticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">transferencias registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendentes || 0}</div>
            <p className="text-xs text-muted-foreground">aguardando aprovacao</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.aprovadas || 0}</div>
            <p className="text-xs text-muted-foreground">prontas para efetivar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efetivadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.efetivadas || 0}</div>
            <p className="text-xs text-muted-foreground">concluidas com sucesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por aluno ou escola..."
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
                {activeSchools.map((school) => (
                  <SelectItem key={school.id} value={school.id.toString()}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TransferStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovada">Aprovada</SelectItem>
                <SelectItem value="Efetivada">Efetivada</SelectItem>
                <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'Interna' | 'Externa_Saida')}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Interna">Interna</SelectItem>
                <SelectItem value="Externa_Saida">Externa (Saida)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Visualizacao */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todas" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Todas ({transfers.length})
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendentes de Aprovacao ({pendentesAprovacao.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transferencias</CardTitle>
              <CardDescription>
                {filteredTransfers.length} transferencia(s) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredTransfers.length === 0 ? (
                <EmptyState onCreateClick={handleCreateTransfer} />
              ) : (
                <TransfersTable
                  transfers={filteredTransfers}
                  onView={handleViewTransfer}
                  onAprovar={handleAprovar}
                  onEfetivar={handleEfetivar}
                  onRejeitar={handleRejeitar}
                  onCancelar={handleCancelar}
                  getStatusBadge={getStatusBadge}
                  getTypeBadge={getTypeBadge}
                  getStudentName={getStudentName}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendentes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pendentes de Aprovacao</CardTitle>
              <CardDescription>
                Transferencias aguardando aprovacao da escola destino
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredTransfers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500/50" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhuma pendencia</h3>
                  <p className="text-muted-foreground">
                    Todas as transferencias foram processadas.
                  </p>
                </div>
              ) : (
                <TransfersTable
                  transfers={filteredTransfers}
                  onView={handleViewTransfer}
                  onAprovar={handleAprovar}
                  onEfetivar={handleEfetivar}
                  onRejeitar={handleRejeitar}
                  onCancelar={handleCancelar}
                  getStatusBadge={getStatusBadge}
                  getTypeBadge={getTypeBadge}
                  getStudentName={getStudentName}
                  showActions
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TransferFormDialogSupabase
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSuccess={() => {
          setIsFormDialogOpen(false)
          handleRefresh()
        }}
      />

      <TransferDetailsDialogSupabase
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        transferId={selectedTransferId}
        onAprovar={() => selectedTransferId && handleAprovar(selectedTransferId)}
        onEfetivar={() => selectedTransferId && handleEfetivar(selectedTransferId)}
        onRejeitar={() => selectedTransferId && handleRejeitar(selectedTransferId)}
        onCancelar={() => selectedTransferId && handleCancelar(selectedTransferId)}
      />

      {/* Dialog de Confirmacao */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'aprovar' && 'Aprovar Transferencia'}
              {confirmAction === 'efetivar' && 'Efetivar Transferencia'}
              {confirmAction === 'cancelar' && 'Cancelar Transferencia'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'aprovar' && 'Ao aprovar, a escola destino aceita receber o aluno.'}
              {confirmAction === 'efetivar' && 'Ao efetivar, a matricula sera criada na escola destino e encerrada na origem.'}
              {confirmAction === 'cancelar' && 'Ao cancelar, a solicitacao sera encerrada sem efeito.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmActionHandler}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Rejeicao */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Transferencia</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeicao. Esta informacao sera enviada a escola de origem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Motivo da Rejeicao</Label>
            <Textarea
              id="reject-reason"
              placeholder="Descreva o motivo da rejeicao..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRejectHandler}
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Rejeitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Componente de tabela separado
function TransfersTable({
  transfers,
  onView,
  onAprovar,
  onEfetivar,
  onRejeitar,
  onCancelar,
  getStatusBadge,
  getTypeBadge,
  getStudentName,
  showActions = false,
}: {
  transfers: TransferWithDetails[]
  onView: (id: number) => void
  onAprovar: (id: number) => void
  onEfetivar: (id: number) => void
  onRejeitar: (id: number) => void
  onCancelar: (id: number) => void
  getStatusBadge: (status: TransferStatus) => React.ReactNode
  getTypeBadge: (tipo: string) => React.ReactNode
  getStudentName: (transfer: TransferWithDetails) => string
  showActions?: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Aluno</TableHead>
          <TableHead>Origem</TableHead>
          <TableHead>Destino</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-right">Acoes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transfers.map((transfer) => (
          <TableRow key={transfer.id}>
            <TableCell className="font-medium">
              {getStudentName(transfer)}
            </TableCell>
            <TableCell>
              {transfer.escola_origem?.name || 'N/A'}
            </TableCell>
            <TableCell>
              {transfer.escola_destino?.name || transfer.escola_destino_externa || 'N/A'}
            </TableCell>
            <TableCell>{getTypeBadge(transfer.tipo)}</TableCell>
            <TableCell>{getStatusBadge(transfer.status)}</TableCell>
            <TableCell>
              {transfer.data_solicitacao
                ? format(new Date(transfer.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })
                : 'N/A'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(transfer.id)}
                  title="Ver detalhes"
                >
                  <Eye className="h-4 w-4" />
                </Button>

                {transfer.status === 'Pendente' && (
                  <>
                    <RequirePermission permission="edit:transfer">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAprovar(transfer.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Aprovar"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </RequirePermission>
                    <RequirePermission permission="edit:transfer">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRejeitar(transfer.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Rejeitar"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </RequirePermission>
                  </>
                )}

                {transfer.status === 'Aprovada' && (
                  <RequirePermission permission="edit:transfer">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEfetivar(transfer.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Efetivar"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </RequirePermission>
                )}

                {(transfer.status === 'Pendente' || transfer.status === 'Aprovada') && (
                  <RequirePermission permission="delete:transfer">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCancelar(transfer.id)}
                      className="text-gray-600 hover:text-gray-700"
                      title="Cancelar"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </RequirePermission>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Componente de estado vazio
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mb-4 p-4 rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent inline-flex">
        <ArrowLeftRight className="h-12 w-12 text-blue-600/60" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Nenhuma transferencia encontrada</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Selecione uma escola no filtro para ver as transferencias ou crie uma nova.
      </p>
      <RequirePermission permission="create:transfer">
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transferencia
        </Button>
      </RequirePermission>
    </div>
  )
}
