/**
 * ReenrollmentManager - Pagina de gerenciamento de rematricula automatica (Versao Supabase)
 *
 * Permite gerenciar o processo de rematricula de alunos para o proximo ano letivo:
 * - Visualizar previa de rematricula
 * - Criar lotes de rematricula
 * - Executar rematricula em lote ou individual
 * - Acompanhar status e estatisticas
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
import {
  Users,
  GraduationCap,
  Building2,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  RefreshCcw,
  Eye,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Loader2,
  FileText,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useReenrollmentStore } from '@/stores/useReenrollmentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { RequirePermission } from '@/components/RequirePermission'
import { ReenrollmentBatchDialogSupabase } from './components/ReenrollmentBatchDialog.supabase'
import { ReenrollmentItemsTableSupabase } from './components/ReenrollmentItemsTable.supabase'
import type {
  ReenrollmentStatus,
  ReenrollmentBatchWithDetails,
  PreviaRematricula,
} from '@/lib/supabase/services'

// Mock de anos letivos (em producao virá do banco)
const anosLetivos = [
  { id: 1, year_name: '2024' },
  { id: 2, year_name: '2025' },
  { id: 3, year_name: '2026' },
]

export default function ReenrollmentManagerSupabase() {
  const {
    previa,
    resumoPrevia,
    lotes,
    currentLote,
    itensLote,
    stats,
    loading,
    fetchPreviaRematricula,
    fetchResumoPreviaRematricula,
    fetchLotesByEscola,
    fetchLotesPendentes,
    fetchLoteWithDetails,
    fetchItensLote,
    criarLote,
    executarLote,
    cancelarLote,
    fetchEstatisticasGerais,
  } = useReenrollmentStore()

  const { schools, fetchSchools } = useSchoolStore()

  // Estados locais
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null)
  const [selectedAnoOrigemId, setSelectedAnoOrigemId] = useState<number>(1)
  const [selectedAnoDestinoId, setSelectedAnoDestinoId] = useState<number>(2)
  const [activeTab, setActiveTab] = useState('previa')

  // Dialogs
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [showItemsDialog, setShowItemsDialog] = useState(false)
  const [batchToView, setBatchToView] = useState<ReenrollmentBatchWithDetails | null>(null)

  // Confirmacoes
  const [showExecuteConfirm, setShowExecuteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [batchToExecute, setBatchToExecute] = useState<number | null>(null)
  const [batchToCancel, setBatchToCancel] = useState<number | null>(null)

  // Carregar escolas ao montar
  useEffect(() => {
    fetchSchools()
    fetchEstatisticasGerais()
  }, [fetchSchools, fetchEstatisticasGerais])

  // Carregar dados quando selecionar escola
  useEffect(() => {
    if (selectedSchoolId && selectedAnoOrigemId) {
      fetchPreviaRematricula(selectedSchoolId, selectedAnoOrigemId)
      fetchResumoPreviaRematricula(selectedSchoolId, selectedAnoOrigemId)
      fetchLotesByEscola(selectedSchoolId)
    }
  }, [selectedSchoolId, selectedAnoOrigemId, fetchPreviaRematricula, fetchResumoPreviaRematricula, fetchLotesByEscola])

  // Handler para criar lote
  const handleCriarLote = async () => {
    if (!selectedSchoolId) return

    // Usar ID do usuario logado (mockado aqui)
    const userId = 1

    const batchId = await criarLote(
      selectedSchoolId,
      selectedAnoOrigemId,
      selectedAnoDestinoId,
      userId
    )

    if (batchId) {
      fetchLotesByEscola(selectedSchoolId)
      setShowBatchDialog(false)
    }
  }

  // Handler para executar lote
  const handleExecutarLote = async () => {
    if (!batchToExecute) return

    const userId = 1
    const resultado = await executarLote(batchToExecute, userId)

    if (resultado) {
      setShowExecuteConfirm(false)
      setBatchToExecute(null)
      if (selectedSchoolId) {
        fetchLotesByEscola(selectedSchoolId)
      }
    }
  }

  // Handler para cancelar lote
  const handleCancelarLote = async () => {
    if (!batchToCancel) return

    const success = await cancelarLote(batchToCancel)

    if (success) {
      setShowCancelConfirm(false)
      setBatchToCancel(null)
      if (selectedSchoolId) {
        fetchLotesByEscola(selectedSchoolId)
      }
    }
  }

  // Handler para ver detalhes do lote
  const handleVerLote = async (batch: ReenrollmentBatchWithDetails) => {
    setBatchToView(batch)
    await fetchLoteWithDetails(batch.id)
    await fetchItensLote(batch.id)
    setShowItemsDialog(true)
  }

  // Renderizar badge de status do lote
  const getStatusBadge = (status: ReenrollmentStatus) => {
    const config: Record<ReenrollmentStatus, { label: string; className: string; icon: React.ReactNode }> = {
      Pendente: {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3" />,
      },
      Em_Processamento: {
        label: 'Processando',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <RefreshCcw className="h-3 w-3 animate-spin" />,
      },
      Concluido: {
        label: 'Concluido',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Cancelado: {
        label: 'Cancelado',
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

  // Renderizar badge de resultado
  const getResultadoBadge = (resultado: string | null) => {
    if (!resultado) return <Badge variant="outline">Pendente</Badge>

    const config: Record<string, { className: string }> = {
      Aprovado: { className: 'bg-green-100 text-green-800' },
      Aprovado_Conselho: { className: 'bg-blue-100 text-blue-800' },
      Reprovado: { className: 'bg-red-100 text-red-800' },
      Concluido: { className: 'bg-purple-100 text-purple-800' },
      Desistente: { className: 'bg-gray-100 text-gray-800' },
      Transferido: { className: 'bg-orange-100 text-orange-800' },
    }

    return (
      <Badge variant="outline" className={config[resultado]?.className}>
        {resultado.replace('_', ' ')}
      </Badge>
    )
  }

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <RefreshCcw className="h-8 w-8" />
            Rematricula Automatica
          </h1>
          <p className="text-muted-foreground">
            Gerencie o processo de rematricula de alunos para o proximo ano letivo
          </p>
        </div>
      </div>

      {/* Cards de Estatisticas Gerais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_lotes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Lotes de rematricula criados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Processados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_alunos_processados || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total de alunos em lotes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rematriculados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.total_rematriculados || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Matriculas criadas com sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluiram Ciclo</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.total_concluidos_ciclo || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Alunos que finalizaram o nivel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Selecao de Escola e Ano */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecione a Escola e Ano Letivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Escola</label>
              <Select
                value={selectedSchoolId?.toString() || ''}
                onValueChange={(value) => setSelectedSchoolId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma escola" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ano Letivo (Origem)</label>
              <Select
                value={selectedAnoOrigemId.toString()}
                onValueChange={(value) => setSelectedAnoOrigemId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ano de origem" />
                </SelectTrigger>
                <SelectContent>
                  {anosLetivos.map((ano) => (
                    <SelectItem key={ano.id} value={ano.id.toString()}>
                      {ano.year_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ano Letivo (Destino)</label>
              <Select
                value={selectedAnoDestinoId.toString()}
                onValueChange={(value) => setSelectedAnoDestinoId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ano de destino" />
                </SelectTrigger>
                <SelectContent>
                  {anosLetivos.map((ano) => (
                    <SelectItem key={ano.id} value={ano.id.toString()}>
                      {ano.year_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteudo Principal - Exibir apenas se escola selecionada */}
      {selectedSchoolId ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="previa" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Previa
              </TabsTrigger>
              <TabsTrigger value="lotes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Lotes
              </TabsTrigger>
            </TabsList>

            <RequirePermission permission="execute:reenrollment">
              <Button onClick={() => setShowBatchDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Lote
              </Button>
            </RequirePermission>
          </div>

          {/* Tab Previa */}
          <TabsContent value="previa" className="space-y-4">
            {/* Resumo da Previa */}
            {resumoPrevia && (
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Alunos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{resumoPrevia.total_alunos}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      Aprovados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {resumoPrevia.total_aprovados}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                      Reprovados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {resumoPrevia.total_reprovados}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      Concluiram Ciclo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {resumoPrevia.total_concluidos}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-orange-500" />
                      Trocam Escola
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {resumoPrevia.total_trocam_escola}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Distribuicao por Serie Destino */}
            {resumoPrevia && Object.keys(resumoPrevia.por_serie_destino).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribuicao por Serie Destino</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(resumoPrevia.por_serie_destino)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([serie, count]) => (
                        <div
                          key={serie}
                          className="flex flex-col items-center p-3 rounded-lg border"
                        >
                          <span className="text-lg font-bold">{count}</span>
                          <span className="text-xs text-muted-foreground">{serie}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabela de Previa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lista de Alunos</CardTitle>
                <CardDescription>
                  Previa da rematricula para o proximo ano letivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : previa.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                      Nenhum aluno encontrado para rematricula
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Serie Atual</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Serie Destino</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previa.map((item) => (
                        <TableRow key={item.enrollment_id}>
                          <TableCell className="font-medium">
                            {item.student_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.serie_atual}</Badge>
                          </TableCell>
                          <TableCell>
                            {getResultadoBadge(item.resultado_final)}
                          </TableCell>
                          <TableCell>
                            {item.concluiu_ciclo ? (
                              <span className="text-purple-600 font-medium">
                                Concluiu o Ciclo
                              </span>
                            ) : (
                              <Badge variant="secondary">{item.serie_destino}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.precisa_trocar_escola ? (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                <Building2 className="mr-1 h-3 w-3" />
                                Troca de Escola
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                OK
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Lotes */}
          <TabsContent value="lotes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lotes de Rematricula</CardTitle>
                <CardDescription>
                  Historico de lotes criados para esta escola
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : lotes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                      Nenhum lote de rematricula criado
                    </p>
                    <RequirePermission permission="execute:reenrollment">
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setShowBatchDialog(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Primeiro Lote
                      </Button>
                    </RequirePermission>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Ano Origem</TableHead>
                        <TableHead>Ano Destino</TableHead>
                        <TableHead>Total Alunos</TableHead>
                        <TableHead>Rematriculados</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Criacao</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotes.map((lote) => (
                        <TableRow key={lote.id}>
                          <TableCell className="font-medium">#{lote.id}</TableCell>
                          <TableCell>
                            {(lote.ano_letivo_origem as Record<string, unknown>)?.year_name as string}
                          </TableCell>
                          <TableCell>
                            {(lote.ano_letivo_destino as Record<string, unknown>)?.year_name as string}
                          </TableCell>
                          <TableCell>{lote.total_alunos}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-medium">
                                {lote.total_rematriculados}
                              </span>
                              {lote.total_alunos > 0 && (
                                <Progress
                                  value={(lote.total_rematriculados / lote.total_alunos) * 100}
                                  className="w-16 h-2"
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(lote.status)}</TableCell>
                          <TableCell>{formatDate(lote.data_criacao)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVerLote(lote)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {lote.status === 'Pendente' && (
                                <>
                                  <RequirePermission permission="execute:reenrollment">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600"
                                      onClick={() => {
                                        setBatchToExecute(lote.id)
                                        setShowExecuteConfirm(true)
                                      }}
                                    >
                                      <Play className="h-4 w-4" />
                                    </Button>
                                  </RequirePermission>
                                  <RequirePermission permission="execute:reenrollment">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600"
                                      onClick={() => {
                                        setBatchToCancel(lote.id)
                                        setShowCancelConfirm(true)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </RequirePermission>
                                </>
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
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Selecione uma Escola</h3>
              <p className="mt-2 text-muted-foreground">
                Escolha uma escola para visualizar a previa de rematricula e gerenciar lotes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Criar Lote */}
      <ReenrollmentBatchDialogSupabase
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        schoolId={selectedSchoolId}
        anoOrigemId={selectedAnoOrigemId}
        anoDestinoId={selectedAnoDestinoId}
        resumoPrevia={resumoPrevia}
        onConfirm={handleCriarLote}
        loading={loading}
      />

      {/* Dialog Ver Itens do Lote */}
      <ReenrollmentItemsTableSupabase
        open={showItemsDialog}
        onOpenChange={setShowItemsDialog}
        batch={batchToView}
        items={itensLote}
        loading={loading}
      />

      {/* Confirmacao de Execucao */}
      <AlertDialog open={showExecuteConfirm} onOpenChange={setShowExecuteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              Executar Rematricula
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja executar este lote de rematricula?
              <br />
              <br />
              Esta acao ira:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Criar novas matriculas para todos os alunos aprovados</li>
                <li>Mover alunos reprovados para a mesma serie</li>
                <li>Marcar como concluidos os alunos que finalizaram o ciclo</li>
              </ul>
              <br />
              <strong className="text-destructive">Esta acao nao pode ser desfeita!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecutarLote}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Executar Rematricula
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmacao de Cancelamento */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Cancelar Lote
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este lote de rematricula?
              <br />
              <br />
              O lote sera marcado como cancelado e nenhuma rematricula sera executada.
              Voce podera criar um novo lote posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelarLote}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancelar Lote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
