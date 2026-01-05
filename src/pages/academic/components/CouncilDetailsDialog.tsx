import { Users, Calendar, FileText, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import useCouncilStore from '@/stores/useCouncilStore'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'

interface CouncilDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  councilId: string | null
  onEdit: () => void
  onDelete: () => void
}

export function CouncilDetailsDialog({
  open,
  onOpenChange,
  councilId,
  onEdit,
  onDelete,
}: CouncilDetailsDialogProps) {
  const { getCouncil } = useCouncilStore()
  const { schools } = useSchoolStore()
  const { students } = useStudentStore()

  const council = councilId ? getCouncil(councilId) : undefined
  const school = council ? schools.find((s) => s.id === council.schoolId) : undefined

  if (!council) {
    return null
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'outline',
      in_progress: 'secondary',
      completed: 'default',
      cancelled: 'destructive',
    }

    const labels: Record<string, string> = {
      scheduled: 'Agendado',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    }

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      bimestral: 'Bimestral',
      final: 'Final',
      extraordinary: 'Extraordinário',
    }

    return <Badge variant="outline">{labels[type] || type}</Badge>
  }

  const getDecisionBadge = (decision: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      approved: 'default',
      approved_with_recovery: 'secondary',
      dependency: 'outline',
      retained: 'destructive',
      pending: 'outline',
    }

    const labels: Record<string, string> = {
      approved: 'Aprovado',
      approved_with_recovery: 'Aprovado com Recuperação',
      dependency: 'Dependência',
      retained: 'Retido',
      pending: 'Pendente',
    }

    return (
      <Badge variant={variants[decision] || 'default'}>
        {labels[decision] || decision}
      </Badge>
    )
  }

  const getPerformanceBadge = (performance: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      excellent: 'default',
      good: 'default',
      regular: 'secondary',
      poor: 'destructive',
    }

    const labels: Record<string, string> = {
      excellent: 'Excelente',
      good: 'Bom',
      regular: 'Regular',
      poor: 'Ruim',
    }

    return (
      <Badge variant={variants[performance] || 'default'}>
        {labels[performance] || performance}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Conselho de Classe - {council.classroomName}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do conselho de classe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Informações Gerais</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Data</span>
                <p className="font-medium">
                  {format(new Date(council.date), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Turma</span>
                <p className="font-medium">{council.classroomName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Período</span>
                <p className="font-medium">{council.periodName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Tipo</span>
                <div className="mt-1">{getTypeBadge(council.type)}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="mt-1">{getStatusBadge(council.status)}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Escola</span>
                <p className="font-medium">{school?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Membros</span>
                <p className="font-medium">{council.members.length} membro(s)</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Alunos Analisados</span>
                <p className="font-medium">{council.studentsAnalysis.length} aluno(s)</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Membros do Conselho */}
          {council.members.length > 0 && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Membros do Conselho
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {council.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {member.role === 'director' && 'Diretor(a)'}
                          {member.role === 'coordinator' && 'Coordenador(a)'}
                          {member.role === 'teacher' && 'Professor(a)'}
                          {member.role === 'pedagogue' && 'Pedagogo(a)'}
                          {member.role === 'other' && 'Outro'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Análise dos Alunos */}
          {council.studentsAnalysis.length > 0 && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Análise dos Alunos</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Desempenho</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Média</TableHead>
                        <TableHead>Decisão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {council.studentsAnalysis.map((analysis) => {
                        const student = students.find((s) => s.id === analysis.studentId)
                        return (
                          <TableRow key={analysis.studentId}>
                            <TableCell className="font-medium">
                              {student?.name || analysis.studentName}
                            </TableCell>
                            <TableCell>
                              {getPerformanceBadge(analysis.overallPerformance)}
                            </TableCell>
                            <TableCell>{analysis.attendanceRate.toFixed(1)}%</TableCell>
                            <TableCell>{analysis.averageGrade.toFixed(1)}</TableCell>
                            <TableCell>
                              {getDecisionBadge(analysis.finalDecision)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Observações Gerais */}
          {council.generalObservations && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Observações Gerais</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {council.generalObservations}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Decisões */}
          {council.decisions.length > 0 && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Decisões do Conselho</h3>
                <div className="space-y-2">
                  {council.decisions.map((decision) => (
                    <div key={decision.id} className="p-3 border rounded-lg">
                      <p className="font-medium">{decision.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Responsável: {decision.responsible}</span>
                        {decision.deadline && (
                          <span>
                            Prazo:{' '}
                            {format(new Date(decision.deadline), "dd 'de' MMMM 'de' yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Ata do Conselho */}
          {council.minutes && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Ata do Conselho</h3>
                <p className="text-sm whitespace-pre-wrap">{council.minutes}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Informações de Criação */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Informações de Criação</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Criado em</span>
                <p className="font-medium">
                  {format(new Date(council.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Última atualização</span>
                <p className="font-medium">
                  {format(new Date(council.updatedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          {council.status !== 'completed' && (
            <>
              <Separator />
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button variant="destructive" onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

