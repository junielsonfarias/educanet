/**
 * ReenrollmentItemsTable - Dialog para visualizar itens de um lote de rematricula (Versao Supabase)
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
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
  User,
  GraduationCap,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  ArrowRight,
  RefreshCcw,
  Loader2,
  Play,
  Trash2,
} from 'lucide-react'
import { useReenrollmentStore } from '@/stores/useReenrollmentStore.supabase'
import { RequirePermission } from '@/components/RequirePermission'
import type {
  ReenrollmentBatchWithDetails,
  ReenrollmentItemWithDetails,
  ReenrollmentItemStatus,
} from '@/lib/supabase/services'

interface ReenrollmentItemsTableProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch: ReenrollmentBatchWithDetails | null
  items: ReenrollmentItemWithDetails[]
  loading: boolean
}

export function ReenrollmentItemsTableSupabase({
  open,
  onOpenChange,
  batch,
  items,
  loading,
}: ReenrollmentItemsTableProps) {
  const {
    escolasAlternativas,
    buscarEscolasAlternativas,
    definirEscolaItem,
    excluirItem,
    executarItem,
    loading: storeLoading,
  } = useReenrollmentStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedItemForSchool, setSelectedItemForSchool] = useState<number | null>(null)
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null)

  // Filtrar itens
  const filteredItems = items.filter((item) => {
    const studentName = `${item.student?.person?.first_name || ''} ${item.student?.person?.last_name || ''}`.toLowerCase()
    const matchesSearch = studentName.includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Renderizar badge de status do item
  const getStatusBadge = (status: ReenrollmentItemStatus) => {
    const config: Record<ReenrollmentItemStatus, { label: string; className: string; icon: React.ReactNode }> = {
      Pendente: {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3" />,
      },
      Rematriculado: {
        label: 'Rematriculado',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Concluido_Ciclo: {
        label: 'Concluiu Ciclo',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <GraduationCap className="h-3 w-3" />,
      },
      Necessita_Escola: {
        label: 'Necessita Escola',
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <Building2 className="h-3 w-3" />,
      },
      Erro: {
        label: 'Erro',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="h-3 w-3" />,
      },
      Excluido: {
        label: 'Excluido',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <Trash2 className="h-3 w-3" />,
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
    if (!resultado) return <Badge variant="outline">-</Badge>

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

  // Handler para buscar escolas alternativas
  const handleBuscarEscolas = async (item: ReenrollmentItemWithDetails) => {
    setSelectedItemForSchool(item.id)
    // Supondo que temos o education_level baseado na serie destino
    const educationLevel = getEducationLevelFromSerie(item.serie_destino || '')
    if (batch?.school_id) {
      await buscarEscolasAlternativas(batch.school_id, educationLevel)
    }
  }

  // Helper para determinar nivel de ensino pela serie
  const getEducationLevelFromSerie = (serie: string): string => {
    if (serie.includes('Creche') || serie.includes('Pre')) return 'Infantil'
    if (['1o Ano', '2o Ano', '3o Ano', '4o Ano', '5o Ano'].includes(serie)) return 'Fundamental_I'
    if (['6o Ano', '7o Ano', '8o Ano', '9o Ano'].includes(serie)) return 'Fundamental_II'
    return 'Fundamental_I'
  }

  // Handler para definir escola
  const handleDefinirEscola = async () => {
    if (!selectedItemForSchool || !selectedSchoolId) return

    await definirEscolaItem(selectedItemForSchool, selectedSchoolId)
    setSelectedItemForSchool(null)
    setSelectedSchoolId(null)
  }

  // Handler para excluir item
  const handleExcluirItem = async (itemId: number) => {
    await excluirItem(itemId)
  }

  // Handler para executar item individual
  const handleExecutarItem = async (itemId: number) => {
    const userId = 1 // Em producao, pegar do usuario logado
    await executarItem(itemId, userId)
  }

  // Contagem por status
  const statusCounts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Itens do Lote #{batch?.id}
          </DialogTitle>
          <DialogDescription>
            {batch?.status === 'Pendente'
              ? 'Revise e execute a rematricula dos alunos'
              : 'Visualize o resultado da rematricula'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo por Status */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterStatus('all')}
            >
              Todos ({items.length})
            </Badge>
            {Object.entries(statusCounts).map(([status, count]) => (
              <Badge
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterStatus(status)}
              >
                {status.replace('_', ' ')} ({count})
              </Badge>
            ))}
          </div>

          {/* Filtro de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabela de Itens */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  Nenhum item encontrado
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
                    <TableHead>Escola Destino</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {item.student?.person?.first_name} {item.student?.person?.last_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.serie_atual}</Badge>
                      </TableCell>
                      <TableCell>
                        {getResultadoBadge(item.resultado_final)}
                      </TableCell>
                      <TableCell>
                        {item.serie_destino ? (
                          <div className="flex items-center gap-1">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="secondary">{item.serie_destino}</Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.status === 'Necessita_Escola' ? (
                          selectedItemForSchool === item.id ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={selectedSchoolId?.toString() || ''}
                                onValueChange={(v) => setSelectedSchoolId(parseInt(v))}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue placeholder="Escola" />
                                </SelectTrigger>
                                <SelectContent>
                                  {escolasAlternativas.map((escola) => (
                                    <SelectItem key={escola.school_id} value={escola.school_id.toString()}>
                                      {escola.school_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={handleDefinirEscola}
                                disabled={!selectedSchoolId || storeLoading}
                              >
                                {storeLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                OK
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedItemForSchool(null)
                                  setSelectedSchoolId(null)
                                }}
                              >
                                X
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600"
                              onClick={() => handleBuscarEscolas(item)}
                            >
                              <Building2 className="mr-1 h-3 w-3" />
                              Definir
                            </Button>
                          )
                        ) : item.escola_destino ? (
                          <span className="text-sm">
                            {(item.escola_destino as Record<string, unknown>)?.name as string}
                          </span>
                        ) : item.escola_destino_sugerida ? (
                          <span className="text-sm text-muted-foreground">Mesma escola</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {batch?.status === 'Pendente' && item.status === 'Pendente' && (
                            <>
                              <RequirePermission permission="execute:reenrollment">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => handleExecutarItem(item.id)}
                                  disabled={storeLoading}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              </RequirePermission>
                              <RequirePermission permission="execute:reenrollment">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleExcluirItem(item.id)}
                                  disabled={storeLoading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </RequirePermission>
                            </>
                          )}
                          {item.motivo_status && (
                            <span className="text-xs text-muted-foreground" title={item.motivo_status}>
                              <AlertCircle className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
