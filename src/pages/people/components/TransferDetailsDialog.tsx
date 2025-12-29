import { ArrowRight, CheckCircle, XCircle, Clock, AlertCircle, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import useTransferStore from '@/stores/useTransferStore'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'

interface TransferDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transferId: string | null
  onApprove: () => void
  onReject: (reason?: string) => void
  onComplete: () => void
}

export function TransferDetailsDialog({
  open,
  onOpenChange,
  transferId,
  onApprove,
  onReject,
  onComplete,
}: TransferDetailsDialogProps) {
  const { getTransfer } = useTransferStore()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()

  const transfer = transferId ? getTransfer(transferId) : undefined
  const student = transfer ? students.find((s) => s.id === transfer.studentId) : undefined
  const fromSchool = transfer ? schools.find((s) => s.id === transfer.fromSchoolId) : undefined
  const toSchool = transfer?.toSchoolId ? schools.find((s) => s.id === transfer.toSchoolId) : undefined

  if (!transfer) {
    return null
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'secondary',
      rejected: 'destructive',
      completed: 'default',
    }

    const labels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovada',
      rejected: 'Rejeitada',
      completed: 'Concluída',
    }

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      approved: <CheckCircle className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
    }

    return (
      <Badge variant={variants[status] || 'default'} className="flex items-center gap-1">
        {icons[status]}
        {labels[status] || status}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Transferência de Aluno
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da transferência
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Informações Gerais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="mt-1">{getStatusBadge(transfer.status)}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Tipo</span>
                <div className="mt-1">
                  <Badge variant="outline">
                    {transfer.type === 'internal' ? 'Interna' : 'Externa'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Data da Transferência</span>
                <p className="font-medium">
                  {format(new Date(transfer.transferDate), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Notificação Enviada</span>
                <p className="font-medium">
                  {transfer.notificationSent ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Sim
                      {transfer.notificationSentAt && (
                        <span className="text-xs text-muted-foreground">
                          ({format(new Date(transfer.notificationSentAt), 'dd/MM/yyyy HH:mm', {
                            locale: ptBR,
                          })})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Não
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dados do Aluno */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Dados do Aluno</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Nome</span>
                <p className="font-medium">{transfer.studentName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Registro</span>
                <p className="font-medium">{student?.registration || 'N/A'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Escolas */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Escolas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <span className="text-sm text-muted-foreground">Escola de Origem</span>
                <p className="font-medium mt-1">{transfer.fromSchoolName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {fromSchool?.address || 'N/A'}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <span className="text-sm text-muted-foreground">Escola de Destino</span>
                <p className="font-medium mt-1">
                  {transfer.type === 'internal'
                    ? transfer.toSchoolName || 'N/A'
                    : transfer.toSchoolExternal || 'N/A'}
                </p>
                {transfer.type === 'internal' && toSchool && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {toSchool.address || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Motivo */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Motivo da Transferência</h3>
            <p className="text-sm whitespace-pre-wrap">{transfer.reason}</p>
          </div>

          <Separator />

          {/* Opções de Transferência */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Opções de Transferência</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Histórico</span>
                <p className="font-medium mt-1">
                  {transfer.transferHistory ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Sim
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Não
                    </span>
                  )}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Avaliações</span>
                <p className="font-medium mt-1">
                  {transfer.transferAssessments ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Sim
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Não
                    </span>
                  )}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Documentos</span>
                <p className="font-medium mt-1">
                  {transfer.transferDocuments ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Sim
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Não
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {transfer.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Observações</h3>
                <p className="text-sm whitespace-pre-wrap">{transfer.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Informações de Criação */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Informações de Criação</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Criado em</span>
                <p className="font-medium">
                  {format(new Date(transfer.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Última atualização</span>
                <p className="font-medium">
                  {format(new Date(transfer.updatedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              {transfer.approvedBy && (
                <>
                  <div>
                    <span className="text-muted-foreground">Aprovado por</span>
                    <p className="font-medium">{transfer.approvedBy}</p>
                  </div>
                  {transfer.approvedAt && (
                    <div>
                      <span className="text-muted-foreground">Aprovado em</span>
                      <p className="font-medium">
                        {format(new Date(transfer.approvedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Ações */}
          {transfer.status === 'pending' && (
            <>
              <Separator />
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => onReject()}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeitar
                </Button>
                <Button onClick={onApprove}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar
                </Button>
              </div>
            </>
          )}

          {transfer.status === 'approved' && (
            <>
              <Separator />
              <div className="flex items-center justify-end gap-2">
                <Button onClick={onComplete}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar como Concluída
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

