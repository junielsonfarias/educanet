/**
 * PreEnrollmentManager - Gerenciamento de Pre-Matriculas (Versao Supabase)
 *
 * Gerencia todo o fluxo de pre-matricula online:
 * - Periodos de pre-matricula
 * - Analise de solicitacoes
 * - Aprovacao/Rejeicao
 * - Lista de espera
 * - Confirmacao de comparecimento
 */

import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Building2,
  CalendarDays,
  FileText,
  Loader2,
  RefreshCw,
  ListOrdered,
  UserCheck,
  AlertTriangle,
  Settings,
  BarChart3,
  GraduationCap,
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
import { Progress } from '@/components/ui/progress'
import { usePreEnrollmentStore } from '@/stores/usePreEnrollmentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useUserStore } from '@/stores/useUserStore.supabase'
import { PreEnrollmentDetailsDialogSupabase } from './components/PreEnrollmentDetailsDialog.supabase'
import { PreEnrollmentPeriodDialog } from './components/PreEnrollmentPeriodDialog.supabase'
import { RequirePermission } from '@/components/RequirePermission'
import type { PreEnrollmentStatus, PreEnrollmentWithDetails } from '@/lib/supabase/services'

export default function PreEnrollmentManagerSupabase() {
  // Stores
  const {
    preEnrollments,
    periodoAtivo,
    periodos,
    pendentes,
    listaEspera,
    stats,
    loading,
    fetchPeriodoAtivo,
    fetchPeriodosByAnoLetivo,
    fetchByPeriodo,
    fetchByEscola,
    fetchPendentes,
    fetchListaEspera,
    fetchEstatisticasPeriodo,
    aprovar,
    colocarListaEspera,
    rejeitar,
    confirmarComparecimento,
  } = usePreEnrollmentStore()

  const { schools, fetchSchools } = useSchoolStore()
  const { currentUser } = useUserStore()

  // Estado local
  const [searchTerm, setSearchTerm] = useState('')
  const [schoolFilter, setSchoolFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<PreEnrollmentStatus | 'all'>('all')
  const [serieFilter, setSerieFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('todas')

  // Dialogs
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false)
  const [selectedPreEnrollmentId, setSelectedPreEnrollmentId] = useState<number | null>(null)

  // Dialog de rejeicao
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Dialog de aprovacao com escola
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [approvingId, setApprovingId] = useState<number | null>(null)
  const [selectedSchoolForApproval, setSelectedSchoolForApproval] = useState<string>('')

  // Dialog de confirmacao
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  // Carregar dados iniciais
  useEffect(() => {
    fetchSchools()
    fetchPeriodoAtivo()
  }, [fetchSchools, fetchPeriodoAtivo])

  // Carregar dados quando periodo ativo mudar
  useEffect(() => {
    if (periodoAtivo) {
      fetchByPeriodo(periodoAtivo.id)
      fetchPendentes(periodoAtivo.id)
      fetchEstatisticasPeriodo(periodoAtivo.id)
    }
  }, [periodoAtivo, fetchByPeriodo, fetchPendentes, fetchEstatisticasPeriodo])

  // Carregar por escola quando filtro mudar
  useEffect(() => {
    if (schoolFilter !== 'all') {
      const escolaId = parseInt(schoolFilter)
      fetchByEscola(escolaId)
    }
  }, [schoolFilter, fetchByEscola])

  // Escolas ativas
  const activeSchools = useMemo(() => {
    return (schools || []).filter((s) => !s.deleted_at)
  }, [schools])

  // Series unicas das pre-matriculas
  const seriesDisponiveis = useMemo(() => {
    const series = new Set<string>()
    preEnrollments.forEach((p) => {
      if (p.serie_desejada) series.add(p.serie_desejada)
    })
    return Array.from(series).sort()
  }, [preEnrollments])

  // Filtrar pre-matriculas
  const filteredPreEnrollments = useMemo(() => {
    const list = activeTab === 'pendentes' ? pendentes : preEnrollments

    return list.filter((preEnrollment) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        searchTerm === '' ||
        preEnrollment.aluno_nome?.toLowerCase().includes(searchLower) ||
        preEnrollment.responsavel_nome?.toLowerCase().includes(searchLower) ||
        preEnrollment.protocolo?.toLowerCase().includes(searchLower) ||
        preEnrollment.responsavel_cpf?.includes(searchTerm)

      const matchesSchool =
        schoolFilter === 'all' ||
        preEnrollment.escola_alocada_id === parseInt(schoolFilter)

      const matchesStatus = statusFilter === 'all' || preEnrollment.status === statusFilter

      const matchesSerie = serieFilter === 'all' || preEnrollment.serie_desejada === serieFilter

      return matchesSearch && matchesSchool && matchesStatus && matchesSerie
    })
  }, [preEnrollments, pendentes, activeTab, searchTerm, schoolFilter, statusFilter, serieFilter])

  // Handlers
  const handleViewDetails = (id: number) => {
    setSelectedPreEnrollmentId(id)
    setIsDetailsDialogOpen(true)
  }

  const handleAprovar = (id: number) => {
    setApprovingId(id)
    setSelectedSchoolForApproval('')
    setApproveDialogOpen(true)
  }

  const handleListaEspera = async (id: number, escolaId: number) => {
    if (!currentUser?.person_id) return
    await colocarListaEspera(id, escolaId, currentUser.person_id)
    handleRefresh()
  }

  const handleRejeitar = (id: number) => {
    setRejectingId(id)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleConfirmarComparecimento = (id: number) => {
    setConfirmingId(id)
    setConfirmDialogOpen(true)
  }

  const confirmApproval = async () => {
    if (!approvingId || !selectedSchoolForApproval || !currentUser?.person_id) return

    await aprovar(approvingId, parseInt(selectedSchoolForApproval), currentUser.person_id)
    setApproveDialogOpen(false)
    setApprovingId(null)
    handleRefresh()
  }

  const confirmReject = async () => {
    if (!rejectingId || !rejectReason || !currentUser?.person_id) return

    await rejeitar(rejectingId, rejectReason, currentUser.person_id)
    setRejectDialogOpen(false)
    setRejectingId(null)
    setRejectReason('')
    handleRefresh()
  }

  const confirmComparecimento = async () => {
    if (!confirmingId || !currentUser?.person_id) return

    await confirmarComparecimento(confirmingId, currentUser.person_id)
    setConfirmDialogOpen(false)
    setConfirmingId(null)
    handleRefresh()
  }

  const handleRefresh = () => {
    if (periodoAtivo) {
      fetchByPeriodo(periodoAtivo.id)
      fetchPendentes(periodoAtivo.id)
      fetchEstatisticasPeriodo(periodoAtivo.id)
    }
  }

  // Renderizar badge de status
  const getStatusBadge = (status: PreEnrollmentStatus) => {
    const config: Record<PreEnrollmentStatus, { label: string; className: string; icon: React.ReactNode }> = {
      Pendente: {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3" />,
      },
      Em_Analise: {
        label: 'Em Analise',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Search className="h-3 w-3" />,
      },
      Aprovada: {
        label: 'Aprovada',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Lista_Espera: {
        label: 'Lista de Espera',
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <ListOrdered className="h-3 w-3" />,
      },
      Rejeitada: {
        label: 'Rejeitada',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="h-3 w-3" />,
      },
      Confirmada: {
        label: 'Confirmada',
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: <UserCheck className="h-3 w-3" />,
      },
      Nao_Compareceu: {
        label: 'Nao Compareceu',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <AlertTriangle className="h-3 w-3" />,
      },
      Cancelada: {
        label: 'Cancelada',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: <XCircle className="h-3 w-3" />,
      },
      Matriculada: {
        label: 'Matriculada',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <GraduationCap className="h-3 w-3" />,
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

  // Calcular progresso do periodo
  const periodoProgress = useMemo(() => {
    if (!periodoAtivo) return 0
    const inicio = new Date(periodoAtivo.data_inicio)
    const fim = new Date(periodoAtivo.data_fim)
    const hoje = new Date()

    if (hoje < inicio) return 0
    if (hoje > fim) return 100

    const total = fim.getTime() - inicio.getTime()
    const decorrido = hoje.getTime() - inicio.getTime()
    return Math.round((decorrido / total) * 100)
  }, [periodoAtivo])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pre-Matricula Online</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitacoes de pre-matricula do portal publico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <RequirePermission permission="create:pre_enrollment">
            <Button variant="outline" onClick={() => setIsPeriodDialogOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Periodos
            </Button>
          </RequirePermission>
        </div>
      </div>

      {/* Card do Periodo Ativo */}
      {periodoAtivo ? (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <CalendarDays className="h-5 w-5" />
                Periodo Ativo: {periodoAtivo.name}
              </CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {periodoAtivo.is_active ? 'Em andamento' : 'Encerrado'}
              </Badge>
            </div>
            <CardDescription>
              {format(new Date(periodoAtivo.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} ate{' '}
              {format(new Date(periodoAtivo.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso do periodo</span>
                <span>{periodoProgress}%</span>
              </div>
              <Progress value={periodoProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Nenhum periodo ativo</h3>
              <p className="text-sm text-yellow-700">
                Configure um periodo de pre-matricula para receber solicitacoes.
              </p>
            </div>
            <RequirePermission permission="create:pre_enrollment">
              <Button
                variant="outline"
                className="ml-auto"
                onClick={() => setIsPeriodDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Periodo
              </Button>
            </RequirePermission>
          </CardContent>
        </Card>
      )}

      {/* Cards de Estatisticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">solicitacoes recebidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.por_status?.Pendente || 0}
            </div>
            <p className="text-xs text-muted-foreground">aguardando analise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.por_status?.Aprovada || 0}
            </div>
            <p className="text-xs text-muted-foreground">prontas p/ comparecer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lista Espera</CardTitle>
            <ListOrdered className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.por_status?.Lista_Espera || 0}
            </div>
            <p className="text-xs text-muted-foreground">aguardando vaga</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilidade</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.vulnerabilidade || 0}
            </div>
            <p className="text-xs text-muted-foreground">com prioridade social</p>
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
                  placeholder="Buscar por aluno, responsavel, protocolo ou CPF..."
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

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PreEnrollmentStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em_Analise">Em Analise</SelectItem>
                <SelectItem value="Aprovada">Aprovada</SelectItem>
                <SelectItem value="Lista_Espera">Lista de Espera</SelectItem>
                <SelectItem value="Confirmada">Confirmada</SelectItem>
                <SelectItem value="Matriculada">Matriculada</SelectItem>
                <SelectItem value="Rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serieFilter} onValueChange={setSerieFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Series" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Series</SelectItem>
                {seriesDisponiveis.map((serie) => (
                  <SelectItem key={serie} value={serie}>
                    {serie}
                  </SelectItem>
                ))}
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
            Todas ({preEnrollments.length})
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({pendentes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Matriculas</CardTitle>
              <CardDescription>
                {filteredPreEnrollments.length} solicitacao(es) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredPreEnrollments.length === 0 ? (
                <EmptyState />
              ) : (
                <PreEnrollmentsTable
                  preEnrollments={filteredPreEnrollments}
                  onView={handleViewDetails}
                  onAprovar={handleAprovar}
                  onRejeitar={handleRejeitar}
                  onConfirmar={handleConfirmarComparecimento}
                  getStatusBadge={getStatusBadge}
                  schools={activeSchools}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendentes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pendentes de Analise</CardTitle>
              <CardDescription>
                Solicitacoes aguardando aprovacao ou rejeicao
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredPreEnrollments.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500/50" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhuma pendencia</h3>
                  <p className="text-muted-foreground">
                    Todas as solicitacoes foram analisadas.
                  </p>
                </div>
              ) : (
                <PreEnrollmentsTable
                  preEnrollments={filteredPreEnrollments}
                  onView={handleViewDetails}
                  onAprovar={handleAprovar}
                  onRejeitar={handleRejeitar}
                  onConfirmar={handleConfirmarComparecimento}
                  getStatusBadge={getStatusBadge}
                  schools={activeSchools}
                  showActions
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PreEnrollmentDetailsDialogSupabase
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        preEnrollmentId={selectedPreEnrollmentId}
        onAprovar={() => selectedPreEnrollmentId && handleAprovar(selectedPreEnrollmentId)}
        onRejeitar={() => selectedPreEnrollmentId && handleRejeitar(selectedPreEnrollmentId)}
        onConfirmar={() => selectedPreEnrollmentId && handleConfirmarComparecimento(selectedPreEnrollmentId)}
      />

      <PreEnrollmentPeriodDialog
        open={isPeriodDialogOpen}
        onOpenChange={setIsPeriodDialogOpen}
        onSuccess={() => {
          setIsPeriodDialogOpen(false)
          fetchPeriodoAtivo()
        }}
      />

      {/* Dialog de Aprovacao */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Pre-Matricula</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione a escola onde o aluno sera alocado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="school-approval">Escola de Destino</Label>
            <Select value={selectedSchoolForApproval} onValueChange={setSelectedSchoolForApproval}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione a escola" />
              </SelectTrigger>
              <SelectContent>
                {activeSchools.map((school) => (
                  <SelectItem key={school.id} value={school.id.toString()}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApproval}
              disabled={!selectedSchoolForApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Rejeicao */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Pre-Matricula</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeicao. O responsavel sera notificado.
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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Rejeitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmacao de Comparecimento */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Comparecimento</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar, a matricula sera efetivada automaticamente no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmComparecimento}>
              Confirmar e Matricular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Componente de tabela separado
function PreEnrollmentsTable({
  preEnrollments,
  onView,
  onAprovar,
  onRejeitar,
  onConfirmar,
  getStatusBadge,
  schools,
  showActions = false,
}: {
  preEnrollments: PreEnrollmentWithDetails[]
  onView: (id: number) => void
  onAprovar: (id: number) => void
  onRejeitar: (id: number) => void
  onConfirmar: (id: number) => void
  getStatusBadge: (status: PreEnrollmentStatus) => React.ReactNode
  schools: { id: number; name: string }[]
  showActions?: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Protocolo</TableHead>
          <TableHead>Aluno</TableHead>
          <TableHead>Responsavel</TableHead>
          <TableHead>Serie</TableHead>
          <TableHead>Pontuacao</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-right">Acoes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {preEnrollments.map((preEnrollment) => (
          <TableRow key={preEnrollment.id}>
            <TableCell className="font-mono text-sm">
              {preEnrollment.protocolo}
            </TableCell>
            <TableCell className="font-medium">
              {preEnrollment.aluno_nome}
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {preEnrollment.responsavel_nome}
                <div className="text-xs text-muted-foreground">
                  {preEnrollment.responsavel_telefone}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{preEnrollment.serie_desejada}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{preEnrollment.pontuacao_total}</span>
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(preEnrollment.status)}</TableCell>
            <TableCell>
              {preEnrollment.data_solicitacao
                ? format(new Date(preEnrollment.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })
                : 'N/A'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(preEnrollment.id)}
                  title="Ver detalhes"
                >
                  <Eye className="h-4 w-4" />
                </Button>

                {preEnrollment.status === 'Pendente' && (
                  <>
                    <RequirePermission permission="edit:pre_enrollment">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAprovar(preEnrollment.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Aprovar"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </RequirePermission>
                    <RequirePermission permission="edit:pre_enrollment">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRejeitar(preEnrollment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Rejeitar"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </RequirePermission>
                  </>
                )}

                {preEnrollment.status === 'Aprovada' && (
                  <RequirePermission permission="edit:pre_enrollment">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onConfirmar(preEnrollment.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Confirmar Comparecimento"
                    >
                      <UserCheck className="h-4 w-4" />
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
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mb-4 p-4 rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent inline-flex">
        <FileText className="h-12 w-12 text-blue-600/60" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Nenhuma pre-matricula encontrada</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        As solicitacoes do portal publico aparecerao aqui quando forem recebidas.
      </p>
    </div>
  )
}
