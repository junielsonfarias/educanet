/**
 * PreEnrollmentDetailsDialog - Dialog para visualizar detalhes de pre-matricula (Versao Supabase)
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  User,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  UserCircle,
  Star,
  ListOrdered,
  Shield,
  ClipboardCheck,
} from 'lucide-react'
import { usePreEnrollmentStore } from '@/stores/usePreEnrollmentStore.supabase'
import { RequirePermission } from '@/components/RequirePermission'
import type { PreEnrollmentStatus, PreEnrollmentType, PreEnrollmentWithDetails } from '@/lib/supabase/services'

interface PreEnrollmentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preEnrollmentId: number | null
  onAprovar?: () => void
  onListaEspera?: () => void
  onRejeitar?: () => void
  onConfirmarComparecimento?: () => void
  onCancelar?: () => void
}

export function PreEnrollmentDetailsDialogSupabase({
  open,
  onOpenChange,
  preEnrollmentId,
  onAprovar,
  onListaEspera,
  onRejeitar,
  onConfirmarComparecimento,
  onCancelar,
}: PreEnrollmentDetailsDialogProps) {
  const { currentPreEnrollment, loading, fetchPreEnrollmentDetails } = usePreEnrollmentStore()

  // Carregar detalhes quando abrir
  useEffect(() => {
    if (open && preEnrollmentId) {
      fetchPreEnrollmentDetails(preEnrollmentId)
    }
  }, [open, preEnrollmentId, fetchPreEnrollmentDetails])

  const preEnrollment = currentPreEnrollment

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
        icon: <FileText className="h-3 w-3" />,
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
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <ClipboardCheck className="h-3 w-3" />,
      },
      Nao_Compareceu: {
        label: 'Nao Compareceu',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <AlertCircle className="h-3 w-3" />,
      },
      Cancelada: {
        label: 'Cancelada',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <XCircle className="h-3 w-3" />,
      },
      Matriculada: {
        label: 'Matriculada',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
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

  // Renderizar badge de tipo
  const getTipoBadge = (tipo: PreEnrollmentType) => {
    const labels: Record<PreEnrollmentType, string> = {
      Aluno_Novo: 'Aluno Novo',
      Transferencia_Externa: 'Transferencia Externa',
      Transferencia_Interna: 'Transferencia Interna',
      Retorno: 'Retorno',
    }
    return <Badge variant="secondary">{labels[tipo] || tipo}</Badge>
  }

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  // Formatar endereco
  const formatEndereco = (pre: PreEnrollmentWithDetails) => {
    const parts = [
      pre.endereco_logradouro,
      pre.endereco_numero ? `, ${pre.endereco_numero}` : '',
      pre.endereco_complemento ? ` - ${pre.endereco_complemento}` : '',
      ` - ${pre.endereco_bairro}`,
      ` - ${pre.endereco_cidade}/${pre.endereco_estado}`,
      pre.endereco_cep ? ` - CEP: ${pre.endereco_cep}` : '',
    ]
    return parts.join('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Pre-Matricula
          </DialogTitle>
          <DialogDescription>
            {preEnrollment ? `Protocolo: ${preEnrollment.protocolo}` : 'Carregando...'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : preEnrollment ? (
            <div className="space-y-6 py-4 pr-4">
              {/* Status, Tipo e Pontuacao */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(preEnrollment.status)}
                  {getTipoBadge(preEnrollment.tipo)}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{preEnrollment.pontuacao_total} pts</span>
                  </div>
                  {preEnrollment.posicao_lista_espera && (
                    <div className="flex items-center gap-1 text-sm text-orange-600">
                      <ListOrdered className="h-4 w-4" />
                      <span>Posicao: {preEnrollment.posicao_lista_espera}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Dados do Aluno */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados do Aluno
                </h4>
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Nome</span>
                      <p className="font-medium">{preEnrollment.aluno_nome}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Data de Nascimento</span>
                      <p>{formatDate(preEnrollment.aluno_data_nascimento)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">CPF</span>
                      <p>{preEnrollment.aluno_cpf || 'Nao informado'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Certidao de Nascimento</span>
                      <p>{preEnrollment.aluno_certidao_nascimento || 'Nao informada'}</p>
                    </div>
                    {preEnrollment.aluno_sexo && (
                      <div>
                        <span className="text-xs text-muted-foreground">Sexo</span>
                        <p>{preEnrollment.aluno_sexo}</p>
                      </div>
                    )}
                    {preEnrollment.aluno_cor_raca && (
                      <div>
                        <span className="text-xs text-muted-foreground">Cor/Raca</span>
                        <p>{preEnrollment.aluno_cor_raca}</p>
                      </div>
                    )}
                  </div>

                  {preEnrollment.aluno_deficiencia && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <span>Pessoa com Deficiencia</span>
                        {preEnrollment.aluno_tipo_deficiencia && (
                          <Badge variant="outline">{preEnrollment.aluno_tipo_deficiencia}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Serie e Turno */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Serie Desejada
                </h4>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-base">
                      {preEnrollment.serie_desejada}
                    </Badge>
                    {preEnrollment.turno_desejado && (
                      <span className="text-sm text-muted-foreground">
                        Turno: {preEnrollment.turno_desejado}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Escola de Origem (se transferencia) */}
              {preEnrollment.escola_origem_nome && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Escola de Origem
                  </h4>
                  <div className="rounded-lg border p-4">
                    <p className="font-medium">{preEnrollment.escola_origem_nome}</p>
                    {(preEnrollment.escola_origem_cidade || preEnrollment.escola_origem_estado) && (
                      <p className="text-sm text-muted-foreground">
                        {preEnrollment.escola_origem_cidade}
                        {preEnrollment.escola_origem_estado && `, ${preEnrollment.escola_origem_estado}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Dados do Responsavel */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Responsavel
                </h4>
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Nome</span>
                      <p className="font-medium">{preEnrollment.responsavel_nome}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">CPF</span>
                      <p>{preEnrollment.responsavel_cpf}</p>
                    </div>
                    {preEnrollment.responsavel_rg && (
                      <div>
                        <span className="text-xs text-muted-foreground">RG</span>
                        <p>{preEnrollment.responsavel_rg}</p>
                      </div>
                    )}
                    {preEnrollment.responsavel_parentesco && (
                      <div>
                        <span className="text-xs text-muted-foreground">Parentesco</span>
                        <p>{preEnrollment.responsavel_parentesco}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {preEnrollment.responsavel_telefone}
                    </div>
                    {preEnrollment.responsavel_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {preEnrollment.responsavel_email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereco */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereco
                </h4>
                <div className="rounded-lg border p-4">
                  <p className="text-sm">{formatEndereco(preEnrollment)}</p>
                </div>
              </div>

              {/* Preferencias de Escola */}
              {preEnrollment.school_choices && preEnrollment.school_choices.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Preferencias de Escola
                  </h4>
                  <div className="rounded-lg border p-4 space-y-2">
                    {preEnrollment.school_choices
                      .sort((a, b) => a.ordem_preferencia - b.ordem_preferencia)
                      .map((choice) => (
                        <div
                          key={choice.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                              {choice.ordem_preferencia}
                            </Badge>
                            <span>
                              {(choice.school as Record<string, unknown>)?.name as string || 'Escola nao encontrada'}
                            </span>
                            {choice.escola_sugerida && (
                              <Badge variant="secondary" className="text-xs">
                                Sugerida
                              </Badge>
                            )}
                          </div>
                          {choice.distancia_km !== null && (
                            <span className="text-sm text-muted-foreground">
                              {choice.distancia_km.toFixed(1)} km
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Escola Alocada */}
              {preEnrollment.escola_alocada && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-green-600">
                    <Building2 className="h-4 w-4" />
                    Escola Alocada
                  </h4>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="font-medium">
                      {(preEnrollment.escola_alocada as Record<string, unknown>)?.name as string}
                    </p>
                    {(preEnrollment.escola_alocada as Record<string, unknown>)?.address && (
                      <p className="text-sm text-muted-foreground">
                        {(preEnrollment.escola_alocada as Record<string, unknown>)?.address as string}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Criterios de Prioridade */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Pontuacao
                </h4>
                <div className="rounded-lg border p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {preEnrollment.pontuacao_vulnerabilidade}
                      </p>
                      <p className="text-xs text-muted-foreground">Vulnerabilidade</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {preEnrollment.pontuacao_proximidade}
                      </p>
                      <p className="text-xs text-muted-foreground">Proximidade</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {preEnrollment.pontuacao_ordem}
                      </p>
                      <p className="text-xs text-muted-foreground">Ordem</p>
                    </div>
                  </div>

                  {preEnrollment.vulnerabilidade_social && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Vulnerabilidade Social</span>
                      </div>
                      {preEnrollment.nis_cadunico && (
                        <p className="text-sm text-muted-foreground mt-1">
                          NIS/CadUnico: {preEnrollment.nis_cadunico}
                        </p>
                      )}
                      {preEnrollment.comprovante_vulnerabilidade && (
                        <Badge variant="outline" className="mt-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Comprovante Apresentado
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Observacoes */}
              {preEnrollment.observacoes && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observacoes
                  </h4>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm">{preEnrollment.observacoes}</p>
                  </div>
                </div>
              )}

              {/* Motivo de Rejeicao */}
              {preEnrollment.status === 'Rejeitada' && preEnrollment.motivo_rejeicao && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    Motivo da Rejeicao
                  </h4>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">{preEnrollment.motivo_rejeicao}</p>
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
                    <span>{formatDate(preEnrollment.data_solicitacao)}</span>
                  </div>
                  {preEnrollment.data_analise && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Analise</span>
                      <span>{formatDate(preEnrollment.data_analise)}</span>
                    </div>
                  )}
                  {preEnrollment.data_aprovacao && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Aprovacao</span>
                      <span>{formatDate(preEnrollment.data_aprovacao)}</span>
                    </div>
                  )}
                  {preEnrollment.data_notificacao && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Notificacao</span>
                      <span>{formatDate(preEnrollment.data_notificacao)}</span>
                    </div>
                  )}
                  {preEnrollment.data_limite_comparecimento && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Limite para Comparecimento</span>
                      <span className="font-medium text-orange-600">
                        {formatDate(preEnrollment.data_limite_comparecimento)}
                      </span>
                    </div>
                  )}
                  {preEnrollment.data_comparecimento && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Comparecimento</span>
                      <span>{formatDate(preEnrollment.data_comparecimento)}</span>
                    </div>
                  )}
                  {preEnrollment.data_matricula && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Matricula</span>
                      <span className="text-green-600 font-medium">
                        {formatDate(preEnrollment.data_matricula)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Nao foi possivel carregar os detalhes da pre-matricula.
              </p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>

          {preEnrollment?.status === 'Pendente' && (
            <>
              <RequirePermission permission="edit:pre_enrollment">
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={onAprovar}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar
                </Button>
              </RequirePermission>
              <RequirePermission permission="edit:pre_enrollment">
                <Button
                  variant="outline"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  onClick={onListaEspera}
                >
                  <ListOrdered className="mr-2 h-4 w-4" />
                  Lista de Espera
                </Button>
              </RequirePermission>
              <RequirePermission permission="edit:pre_enrollment">
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

          {(preEnrollment?.status === 'Aprovada' || preEnrollment?.status === 'Confirmada') && (
            <RequirePermission permission="edit:pre_enrollment">
              <Button
                variant="default"
                onClick={onConfirmarComparecimento}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Confirmar Comparecimento
              </Button>
            </RequirePermission>
          )}

          {(preEnrollment?.status === 'Pendente' || preEnrollment?.status === 'Em_Analise') && (
            <RequirePermission permission="delete:pre_enrollment">
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
