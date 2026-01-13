/**
 * TransferDetailsDialog - Dialog para visualizar detalhes de transferencia (Versao Supabase)
 */

import { useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Building2,
  ArrowRight,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  GraduationCap,
  BarChart3,
} from 'lucide-react'
import { useTransferStore } from '@/stores/useTransferStore.supabase'
import { RequirePermission } from '@/components/RequirePermission'
import type { TransferStatus, TransferWithDetails } from '@/lib/supabase/services'

interface TransferDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transferId: number | null
  onAprovar?: () => void
  onEfetivar?: () => void
  onRejeitar?: () => void
  onCancelar?: () => void
}

export function TransferDetailsDialogSupabase({
  open,
  onOpenChange,
  transferId,
  onAprovar,
  onEfetivar,
  onRejeitar,
  onCancelar,
}: TransferDetailsDialogProps) {
  const { currentTransfer, loading, fetchTransferDetails, getFrequenciaConsolidadaAluno } = useTransferStore()

  // Carregar detalhes quando abrir
  useEffect(() => {
    if (open && transferId) {
      fetchTransferDetails(transferId)
    }
  }, [open, transferId, fetchTransferDetails])

  const transfer = currentTransfer

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

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  // Nome do aluno
  const getStudentName = () => {
    const person = transfer?.student?.person
    if (!person) return 'N/A'
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'N/A'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Transferencia
          </DialogTitle>
          <DialogDescription>
            {transfer ? `Transferencia #${transfer.id}` : 'Carregando...'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : transfer ? (
          <div className="space-y-6 py-4">
            {/* Status e Tipo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusBadge(transfer.status)}
                <Badge variant="outline">
                  {transfer.tipo === 'Interna' ? 'Interna' : 'Externa'}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(transfer.data_solicitacao)}
              </span>
            </div>

            <Separator />

            {/* Aluno */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Aluno
              </h4>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{getStudentName()}</span>
                  {transfer.student?.registration_number && (
                    <Badge variant="secondary">
                      {transfer.student.registration_number}
                    </Badge>
                  )}
                </div>
                {transfer.serie && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    {transfer.serie} - {transfer.turno || 'Turno nao informado'}
                  </div>
                )}
              </div>
            </div>

            {/* Escolas */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Escolas
              </h4>
              <div className="flex items-center gap-4">
                {/* Origem */}
                <div className="flex-1 rounded-lg border p-4">
                  <span className="text-xs text-muted-foreground">Origem</span>
                  <p className="font-medium">{transfer.escola_origem?.name || 'N/A'}</p>
                </div>

                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                {/* Destino */}
                <div className="flex-1 rounded-lg border p-4">
                  <span className="text-xs text-muted-foreground">Destino</span>
                  <p className="font-medium">
                    {transfer.escola_destino?.name || transfer.escola_destino_externa || 'N/A'}
                  </p>
                  {transfer.cidade_destino && (
                    <p className="text-xs text-muted-foreground">
                      {transfer.cidade_destino}
                      {transfer.estado_destino && `, ${transfer.estado_destino}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Motivo
              </h4>
              <div className="rounded-lg border p-4">
                <p className="text-sm">{transfer.motivo || 'Nao informado'}</p>
              </div>
            </div>

            {/* Opcoes de Transferencia */}
            {transfer.tipo === 'Interna' && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Opcoes de Transferencia
                </h4>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {transfer.manter_notas ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">Manter notas e avaliacoes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {transfer.manter_frequencia ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">Manter frequencia</span>
                  </div>
                </div>
              </div>
            )}

            {/* Observacoes */}
            {transfer.observacoes && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Observacoes
                </h4>
                <div className="rounded-lg border p-4">
                  <p className="text-sm">{transfer.observacoes}</p>
                </div>
              </div>
            )}

            {/* Motivo de Rejeicao */}
            {transfer.status === 'Rejeitada' && transfer.motivo_rejeicao && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  Motivo da Rejeicao
                </h4>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">{transfer.motivo_rejeicao}</p>
                </div>
              </div>
            )}

            {/* Timeline de Datas */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Historico
              </h4>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Solicitacao</span>
                  <span>{formatDate(transfer.data_solicitacao)}</span>
                </div>
                {transfer.data_aprovacao && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Aprovacao</span>
                    <span>{formatDate(transfer.data_aprovacao)}</span>
                  </div>
                )}
                {transfer.data_efetivacao && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Efetivacao</span>
                    <span>{formatDate(transfer.data_efetivacao)}</span>
                  </div>
                )}
                {transfer.data_rejeicao && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rejeicao</span>
                    <span>{formatDate(transfer.data_rejeicao)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              Nao foi possivel carregar os detalhes da transferencia.
            </p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>

          {transfer?.status === 'Pendente' && (
            <>
              <RequirePermission permission="edit:transfer">
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={onAprovar}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar
                </Button>
              </RequirePermission>
              <RequirePermission permission="edit:transfer">
                <Button
                  variant="destructive"
                  onClick={onRejeitar}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeitar
                </Button>
              </RequirePermission>
            </>
          )}

          {transfer?.status === 'Aprovada' && (
            <RequirePermission permission="edit:transfer">
              <Button
                variant="default"
                onClick={onEfetivar}
              >
                <Send className="mr-2 h-4 w-4" />
                Efetivar Transferencia
              </Button>
            </RequirePermission>
          )}

          {(transfer?.status === 'Pendente' || transfer?.status === 'Aprovada') && (
            <RequirePermission permission="delete:transfer">
              <Button
                variant="outline"
                onClick={onCancelar}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </RequirePermission>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
