import { useEffect, useState } from 'react'
import { CheckCircle, Clock, XCircle, AlertCircle, FileText, Calendar, School, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'

interface EnrollmentStatusProps {
  protocol: string
}

export function EnrollmentStatus({ protocol }: EnrollmentStatusProps) {
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const [enrollment, setEnrollment] = useState<any>(null)

  useEffect(() => {
    // Buscar aluno pelo protocolo
    const student = students.find(
      (s) => (s as any).enrollmentProtocol === protocol || (s as any).enrollmentStatus === 'pending_enrollment'
    )
    
    if (student) {
      const currentEnrollment = student.enrollments?.[0]
      setEnrollment({
        protocol,
        studentName: student.name,
        studentRegistration: student.registration,
        status: (student as any).enrollmentStatus || 'pending_enrollment',
        requestDate: (student as any).enrollmentRequestDate || new Date().toISOString(),
        schoolId: currentEnrollment?.schoolId,
        academicYearId: currentEnrollment?.academicYearId,
        gradeId: currentEnrollment?.grade,
        observations: student.health?.observation,
      })
    } else {
      setEnrollment(null)
    }
  }, [protocol, students])

  if (!enrollment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Protocolo não encontrado</h3>
            <p className="text-muted-foreground">
              Não foi encontrada nenhuma solicitação de matrícula com o protocolo informado.
              Verifique se o número está correto.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const school = enrollment.schoolId ? schools.find((s) => s.id === enrollment.schoolId) : undefined

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, icon: React.ReactNode }> = {
      pending_enrollment: {
        variant: 'outline',
        label: 'Pendente de Análise',
        icon: <Clock className="h-4 w-4" />,
      },
      approved: {
        variant: 'default',
        label: 'Aprovada',
        icon: <CheckCircle className="h-4 w-4" />,
      },
      rejected: {
        variant: 'destructive',
        label: 'Rejeitada',
        icon: <XCircle className="h-4 w-4" />,
      },
      under_review: {
        variant: 'secondary',
        label: 'Em Análise',
        icon: <AlertCircle className="h-4 w-4" />,
      },
    }

    const statusInfo = statusMap[status] || statusMap.pending_enrollment

    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    )
  }

  const getStatusMessage = (status: string) => {
    const messages: Record<string, string> = {
      pending_enrollment: 'Sua solicitação de matrícula foi recebida e está aguardando análise pela equipe pedagógica. O prazo de análise é de até 5 dias úteis.',
      approved: 'Parabéns! Sua solicitação de matrícula foi aprovada. Entre em contato com a escola para finalizar o processo.',
      rejected: 'Sua solicitação de matrícula foi rejeitada. Entre em contato com a secretaria de educação para mais informações.',
      under_review: 'Sua solicitação está sendo analisada pela equipe pedagógica. Em breve você receberá uma resposta.',
    }

    return messages[status] || messages.pending_enrollment
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Status da Matrícula
            </CardTitle>
            <CardDescription className="mt-1">
              Protocolo: <span className="font-mono font-semibold">{protocol}</span>
            </CardDescription>
          </div>
          {getStatusBadge(enrollment.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm">{getStatusMessage(enrollment.status)}</p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Informações da Solicitação</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Aluno</p>
                <p className="font-medium">{enrollment.studentName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Matrícula</p>
                <p className="font-medium font-mono">{enrollment.studentRegistration}</p>
              </div>
            </div>

            {school && (
              <div className="flex items-start gap-3">
                <School className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Escola Solicitada</p>
                  <p className="font-medium">{school.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Data da Solicitação</p>
                <p className="font-medium">
                  {format(new Date(enrollment.requestDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {enrollment.observations && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Observações</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {enrollment.observations}
              </p>
            </div>
          </>
        )}

        {enrollment.status === 'pending_enrollment' && (
          <>
            <Separator />
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Próximos Passos
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Aguarde a análise da equipe pedagógica (até 5 dias úteis)</li>
                    <li>Você receberá uma notificação por e-mail ou telefone quando houver atualização</li>
                    <li>Documentos adicionais podem ser solicitados durante a análise</li>
                    <li>Mantenha este protocolo para consultas futuras</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {enrollment.status === 'approved' && (
          <>
            <Separator />
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Matrícula Aprovada!
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Entre em contato com a escola para finalizar o processo de matrícula e obter mais informações sobre o início das aulas.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {enrollment.status === 'rejected' && (
          <>
            <Separator />
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Matrícula Rejeitada
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Entre em contato com a secretaria de educação para entender os motivos da rejeição e verificar possíveis alternativas.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

