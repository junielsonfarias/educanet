import { FileText, Clock, CheckCircle, XCircle, User, Phone, Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Protocol } from '@/lib/mock-data'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProtocolDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocol: Protocol
}

export function ProtocolDetailsDialog({
  open,
  onOpenChange,
  protocol,
}: ProtocolDetailsDialogProps) {
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()

  const student = protocol.studentId
    ? students.find((s) => s.id === protocol.studentId)
    : undefined
  const school = schools.find((s) => s.id === protocol.schoolId)

  const getStatusBadge = (status: Protocol['status']) => {
    const variants: Record<Protocol['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'default',
      cancelled: 'destructive',
    }
    const labels: Record<Protocol['status'], string> = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const getTypeLabel = (type: Protocol['type']): string => {
    const labels: Record<Protocol['type'], string> = {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Protocolo {protocol.number}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do protocolo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Informações Gerais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Tipo</span>
                <p className="font-medium">{getTypeLabel(protocol.type)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="mt-1">{getStatusBadge(protocol.status)}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Prioridade</span>
                <div className="mt-1">{getPriorityBadge(protocol.priority)}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Data de Criação</span>
                <p className="font-medium">
                  {format(new Date(protocol.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              {protocol.updatedAt && (
                <div>
                  <span className="text-sm text-muted-foreground">Última Atualização</span>
                  <p className="font-medium">
                    {format(new Date(protocol.updatedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Dados do Solicitante */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Dados do Solicitante</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome
                </span>
                <p className="font-medium">{protocol.requester.name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">CPF</span>
                <p className="font-medium">{protocol.requester.cpf}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </span>
                <p className="font-medium">{protocol.requester.phone}</p>
              </div>
              {protocol.requester.email && (
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </span>
                  <p className="font-medium">{protocol.requester.email}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Parentesco</span>
                <p className="font-medium capitalize">{protocol.requester.relationship}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dados do Aluno e Escola */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Dados Relacionados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Escola</span>
                <p className="font-medium">{school?.name || 'N/A'}</p>
              </div>
              {student && (
                <div>
                  <span className="text-sm text-muted-foreground">Aluno</span>
                  <p className="font-medium">
                    {student.name} - {student.registration}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Descrição */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Descrição da Solicitação</h3>
            <p className="text-sm whitespace-pre-wrap">{protocol.description}</p>
          </div>

          {/* Histórico */}
          {protocol.history && protocol.history.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Histórico de Movimentações</h3>
                <div className="space-y-2">
                  {protocol.history.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-3 bg-muted/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{entry.action}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {entry.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Documentos */}
          {protocol.documents && protocol.documents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Documentos</h3>
                <div className="space-y-2">
                  {protocol.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{doc.type}</p>
                        <p className="text-sm text-muted-foreground">
                          Status: {doc.status === 'requested' ? 'Solicitado' : doc.status === 'preparing' ? 'Em Preparação' : doc.status === 'ready' ? 'Pronto' : 'Entregue'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {format(new Date(doc.requestedAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

