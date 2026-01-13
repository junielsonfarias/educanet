/**
 * TransferFormDialog - Dialog para criar transferencias (Versao Supabase)
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ArrowRight, Building2 } from 'lucide-react'
import { useTransferStore } from '@/stores/useTransferStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useUserStore } from '@/stores/useUserStore.supabase'
import type { SolicitarTransferenciaData, TransferenciaExternaSaidaData } from '@/lib/supabase/services'

const transferSchema = z.object({
  tipo: z.enum(['interna', 'externa']),
  studentProfileId: z.string().min(1, 'Aluno e obrigatorio'),
  escolaOrigemId: z.string().min(1, 'Escola de origem e obrigatoria'),
  escolaDestinoId: z.string().optional(),
  escolaDestinoExterna: z.string().optional(),
  cidadeDestino: z.string().optional(),
  estadoDestino: z.string().optional(),
  motivo: z.string().min(5, 'Motivo e obrigatorio (minimo 5 caracteres)'),
  observacoes: z.string().optional(),
  manterNotas: z.boolean().default(true),
  manterFrequencia: z.boolean().default(true),
}).refine((data) => {
  if (data.tipo === 'interna') {
    return !!data.escolaDestinoId
  } else {
    return !!data.escolaDestinoExterna
  }
}, {
  message: 'Escola de destino e obrigatoria',
  path: ['escolaDestinoId'],
})

type TransferFormData = z.infer<typeof transferSchema>

interface TransferFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TransferFormDialogSupabase({
  open,
  onOpenChange,
  onSuccess,
}: TransferFormDialogProps) {
  const { solicitarTransferenciaInterna, registrarTransferenciaExternaSaida, loading } = useTransferStore()
  const { students, fetchStudents } = useStudentStore()
  const { schools, fetchSchools } = useSchoolStore()
  const { currentUser } = useUserStore()

  const [transferType, setTransferType] = useState<'interna' | 'externa'>('interna')
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      tipo: 'interna',
      studentProfileId: '',
      escolaOrigemId: currentUser?.school_id?.toString() || '',
      escolaDestinoId: '',
      escolaDestinoExterna: '',
      cidadeDestino: '',
      estadoDestino: '',
      motivo: '',
      observacoes: '',
      manterNotas: true,
      manterFrequencia: true,
    },
  })

  const watchEscolaOrigem = form.watch('escolaOrigemId')
  const watchTipo = form.watch('tipo')

  // Carregar dados iniciais
  useEffect(() => {
    if (open) {
      fetchStudents()
      fetchSchools()
    }
  }, [open, fetchStudents, fetchSchools])

  // Atualizar tipo de transferencia
  useEffect(() => {
    setTransferType(watchTipo)
  }, [watchTipo])

  // Resetar form quando abrir
  useEffect(() => {
    if (open) {
      form.reset({
        tipo: 'interna',
        studentProfileId: '',
        escolaOrigemId: currentUser?.school_id?.toString() || '',
        escolaDestinoId: '',
        escolaDestinoExterna: '',
        cidadeDestino: '',
        estadoDestino: '',
        motivo: '',
        observacoes: '',
        manterNotas: true,
        manterFrequencia: true,
      })
      setTransferType('interna')
    }
  }, [open, currentUser?.school_id, form])

  // Filtrar escolas
  const activeSchools = (schools || []).filter((s) => !s.deleted_at)
  const availableDestinationSchools = activeSchools.filter(
    (s) => s.id.toString() !== watchEscolaOrigem
  )

  // Filtrar alunos da escola de origem
  const studentsFromSchool = (students || []).filter((s) => {
    if (!watchEscolaOrigem) return true
    // Verificar se o aluno tem matricula na escola selecionada
    return s.enrollments?.some(
      (e: Record<string, unknown>) => e.school_id?.toString() === watchEscolaOrigem && e.enrollment_status === 'Ativo'
    )
  })

  const handleSubmit = async (data: TransferFormData) => {
    if (!currentUser?.person_id) {
      return
    }

    setSubmitting(true)

    try {
      if (data.tipo === 'interna') {
        const transferData: SolicitarTransferenciaData = {
          student_profile_id: parseInt(data.studentProfileId),
          escola_origem_id: parseInt(data.escolaOrigemId),
          escola_destino_id: parseInt(data.escolaDestinoId!),
          motivo: data.motivo,
          observacoes: data.observacoes,
          manter_notas: data.manterNotas,
          manter_frequencia: data.manterFrequencia,
        }

        await solicitarTransferenciaInterna(transferData, currentUser.person_id)
      } else {
        const transferData: TransferenciaExternaSaidaData = {
          student_profile_id: parseInt(data.studentProfileId),
          escola_origem_id: parseInt(data.escolaOrigemId),
          escola_destino_externa: data.escolaDestinoExterna!,
          cidade_destino: data.cidadeDestino,
          estado_destino: data.estadoDestino,
          motivo: data.motivo,
          observacoes: data.observacoes,
        }

        await registrarTransferenciaExternaSaida(transferData, currentUser.person_id)
      }

      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Nova Transferencia
          </DialogTitle>
          <DialogDescription>
            Solicite a transferencia de um aluno para outra escola.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Tipo de Transferencia */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Transferencia</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value)
                        setTransferType(value as 'interna' | 'externa')
                      }}
                      value={field.value}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="interna" id="interna" />
                        <Label htmlFor="interna">Interna (mesma rede)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="externa" id="externa" />
                        <Label htmlFor="externa">Externa (outro municipio)</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    {transferType === 'interna'
                      ? 'Transferencia entre escolas da rede municipal'
                      : 'Saida do aluno para escola de outro municipio/estado'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Escola de Origem */}
            <FormField
              control={form.control}
              name="escolaOrigemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escola de Origem</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a escola de origem" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeSchools.map((school) => (
                        <SelectItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aluno */}
            <FormField
              control={form.control}
              name="studentProfileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aluno</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!watchEscolaOrigem}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {studentsFromSchool.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.person?.first_name} {student.person?.last_name}
                          {student.registration_number && ` - ${student.registration_number}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {!watchEscolaOrigem
                      ? 'Selecione primeiro a escola de origem'
                      : `${studentsFromSchool.length} aluno(s) ativo(s) nesta escola`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Escola de Destino - Interna */}
            {transferType === 'interna' && (
              <FormField
                control={form.control}
                name="escolaDestinoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola de Destino</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a escola de destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableDestinationSchools.map((school) => (
                          <SelectItem key={school.id} value={school.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {school.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      A escola de destino precisara aprovar a transferencia
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Escola de Destino - Externa */}
            {transferType === 'externa' && (
              <>
                <FormField
                  control={form.control}
                  name="escolaDestinoExterna"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Escola de Destino</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome da escola externa"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cidadeDestino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade de Destino</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estadoDestino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((uf) => (
                              <SelectItem key={uf} value={uf}>
                                {uf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Motivo */}
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Transferencia</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo da transferencia..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Opcoes de Transferencia (apenas interna) */}
            {transferType === 'interna' && (
              <div className="space-y-3 rounded-lg border p-4">
                <Label className="font-medium">Opcoes de Transferencia</Label>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="manterNotas"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal">
                            Manter notas e avaliacoes
                          </FormLabel>
                          <FormDescription>
                            As notas serao mantidas e continuarao na nova escola
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manterFrequencia"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal">
                            Manter frequencia
                          </FormLabel>
                          <FormDescription>
                            O historico de frequencia sera preservado
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Observacoes */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observacoes (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observacoes adicionais..."
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || loading}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Solicitando...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Solicitar Transferencia
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
