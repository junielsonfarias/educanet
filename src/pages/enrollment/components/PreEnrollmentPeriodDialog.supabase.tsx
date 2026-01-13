/**
 * PreEnrollmentPeriodDialog - Dialog para criar/editar periodos de pre-matricula (Versao Supabase)
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Calendar, Loader2 } from 'lucide-react'
import { usePreEnrollmentStore } from '@/stores/usePreEnrollmentStore.supabase'
import type { PreEnrollmentPeriod, PriorityCriteria } from '@/lib/supabase/services'

const criteriosDisponiveis: { value: PriorityCriteria; label: string; points: number }[] = [
  { value: 'Vulnerabilidade_Social', label: 'Vulnerabilidade Social', points: 1000 },
  { value: 'Proximidade', label: 'Proximidade da Escola', points: 500 },
  { value: 'Ordem_Inscricao', label: 'Ordem de Inscricao', points: 100 },
]

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  academic_year_id: z.number().min(1, 'Ano letivo e obrigatorio'),
  data_inicio: z.string().min(1, 'Data de inicio e obrigatoria'),
  data_fim: z.string().min(1, 'Data de fim e obrigatoria'),
  data_resultado: z.string().optional(),
  is_active: z.boolean().default(true),
  permite_escolha_escola: z.boolean().default(true),
  max_opcoes_escola: z.number().min(1).max(5).default(3),
  dias_para_comparecer: z.number().min(1).max(30).default(5),
  criterios_prioridade: z.array(z.string()).min(1, 'Selecione pelo menos um criterio'),
}).refine((data) => {
  const inicio = new Date(data.data_inicio)
  const fim = new Date(data.data_fim)
  return fim > inicio
}, {
  message: 'Data de fim deve ser posterior a data de inicio',
  path: ['data_fim'],
})

type FormData = z.infer<typeof formSchema>

interface PreEnrollmentPeriodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  periodo?: PreEnrollmentPeriod | null
  academicYearId: number
  onSuccess?: () => void
}

export function PreEnrollmentPeriodDialog({
  open,
  onOpenChange,
  periodo,
  academicYearId,
  onSuccess,
}: PreEnrollmentPeriodDialogProps) {
  const { criarPeriodo, atualizarPeriodo, loading } = usePreEnrollmentStore()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      academic_year_id: academicYearId,
      data_inicio: '',
      data_fim: '',
      data_resultado: '',
      is_active: true,
      permite_escolha_escola: true,
      max_opcoes_escola: 3,
      dias_para_comparecer: 5,
      criterios_prioridade: ['Vulnerabilidade_Social', 'Proximidade', 'Ordem_Inscricao'],
    },
  })

  // Preencher form ao editar
  useEffect(() => {
    if (periodo) {
      form.reset({
        name: periodo.name,
        description: periodo.description || '',
        academic_year_id: periodo.academic_year_id,
        data_inicio: periodo.data_inicio ? format(new Date(periodo.data_inicio), 'yyyy-MM-dd') : '',
        data_fim: periodo.data_fim ? format(new Date(periodo.data_fim), 'yyyy-MM-dd') : '',
        data_resultado: periodo.data_resultado ? format(new Date(periodo.data_resultado), 'yyyy-MM-dd') : '',
        is_active: periodo.is_active,
        permite_escolha_escola: periodo.permite_escolha_escola,
        max_opcoes_escola: periodo.max_opcoes_escola,
        dias_para_comparecer: periodo.dias_para_comparecer,
        criterios_prioridade: periodo.criterios_prioridade || [],
      })
    } else {
      form.reset({
        name: '',
        description: '',
        academic_year_id: academicYearId,
        data_inicio: '',
        data_fim: '',
        data_resultado: '',
        is_active: true,
        permite_escolha_escola: true,
        max_opcoes_escola: 3,
        dias_para_comparecer: 5,
        criterios_prioridade: ['Vulnerabilidade_Social', 'Proximidade', 'Ordem_Inscricao'],
      })
    }
  }, [periodo, academicYearId, form])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        academic_year_id: data.academic_year_id,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        data_resultado: data.data_resultado || null,
        is_active: data.is_active,
        permite_escolha_escola: data.permite_escolha_escola,
        max_opcoes_escola: data.max_opcoes_escola,
        dias_para_comparecer: data.dias_para_comparecer,
        criterios_prioridade: data.criterios_prioridade,
      }

      if (periodo) {
        await atualizarPeriodo(periodo.id, payload)
      } else {
        await criarPeriodo(payload)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao salvar periodo:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {periodo ? 'Editar Periodo' : 'Novo Periodo de Pre-Matricula'}
          </DialogTitle>
          <DialogDescription>
            {periodo
              ? 'Altere as informacoes do periodo de pre-matricula.'
              : 'Configure um novo periodo para receber pre-matriculas.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Periodo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pre-Matricula 2025 - 1o Semestre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descricao */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descricao</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descricao opcional do periodo..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Inicio *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data do Resultado */}
            <FormField
              control={form.control}
              name="data_resultado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Divulgacao do Resultado</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Data prevista para divulgacao dos resultados
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Ativo */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Periodo Ativo</FormLabel>
                    <FormDescription>
                      Permite receber novas pre-matriculas
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Opcoes de Escola */}
            <div className="rounded-lg border p-4 space-y-4">
              <h4 className="font-medium">Preferencias de Escola</h4>

              <FormField
                control={form.control}
                name="permite_escolha_escola"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Permitir Escolha de Escola</FormLabel>
                      <FormDescription>
                        Familia pode indicar preferencias de escola
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('permite_escolha_escola') && (
                <FormField
                  control={form.control}
                  name="max_opcoes_escola"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximo de Opcoes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Quantidade maxima de escolas que podem ser escolhidas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Dias para Comparecimento */}
            <FormField
              control={form.control}
              name="dias_para_comparecer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias para Comparecimento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Prazo em dias para o responsavel comparecer apos aprovacao
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Criterios de Prioridade */}
            <FormField
              control={form.control}
              name="criterios_prioridade"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Criterios de Prioridade</FormLabel>
                    <FormDescription>
                      Selecione os criterios que serao usados para ordenar as pre-matriculas
                    </FormDescription>
                  </div>
                  <div className="space-y-3">
                    {criteriosDisponiveis.map((criterio) => (
                      <FormField
                        key={criterio.value}
                        control={form.control}
                        name="criterios_prioridade"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={criterio.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(criterio.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, criterio.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== criterio.value
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal">
                                  {criterio.label}
                                </FormLabel>
                                <FormDescription>
                                  {criterio.points} pontos
                                </FormDescription>
                              </div>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {periodo ? 'Salvar Alteracoes' : 'Criar Periodo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
