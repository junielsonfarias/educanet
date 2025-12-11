import { useEffect } from 'react'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { EvaluationRule } from '@/lib/mock-data'
import useAssessmentStore from '@/stores/useAssessmentStore'
import { ScrollArea } from '@/components/ui/scroll-area'

const ruleSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.enum(['numeric', 'descriptive']),
  description: z.string().min(5, 'Descrição é obrigatória'),
  minGrade: z.coerce.number().min(0).max(100).optional(),
  maxGrade: z.coerce.number().min(0).max(100).optional(),
  passingGrade: z.coerce.number().min(0).max(100).optional(),
  minDependencyGrade: z.coerce.number().min(0).max(100).optional(),
  minAttendance: z.coerce.number().min(0).max(100).optional(),
  formula: z.string().optional(),
  isStandard: z.boolean().default(false),
  periodCount: z.coerce.number().min(1).max(10).optional(),
  allowedExclusions: z.boolean().default(false),
  typeWeights: z.record(z.string(), z.coerce.number()).optional(),
})

interface EvaluationRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: EvaluationRule | null
}

export function EvaluationRuleFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: EvaluationRuleFormDialogProps) {
  const { assessmentTypes } = useAssessmentStore()

  const form = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      type: 'numeric',
      description: '',
      minGrade: 0,
      maxGrade: 10,
      passingGrade: 6.0,
      minDependencyGrade: 4.0,
      minAttendance: 75,
      formula: '',
      isStandard: false,
      periodCount: 4,
      allowedExclusions: false,
      typeWeights: {},
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          type: initialData.type,
          description: initialData.description,
          minGrade: initialData.minGrade ?? 0,
          maxGrade: initialData.maxGrade ?? 10,
          passingGrade: initialData.passingGrade ?? 6.0,
          minDependencyGrade: initialData.minDependencyGrade ?? 4.0,
          minAttendance: initialData.minAttendance ?? 75,
          formula: initialData.formula ?? '',
          isStandard: initialData.isStandard ?? false,
          periodCount: initialData.periodCount ?? 4,
          allowedExclusions: initialData.allowedExclusions ?? false,
          typeWeights: initialData.typeWeights || {},
        })
      } else {
        form.reset({
          name: '',
          type: 'numeric',
          description: '',
          minGrade: 0,
          maxGrade: 10,
          passingGrade: 6.0,
          minDependencyGrade: 4.0,
          minAttendance: 75,
          formula: '',
          isStandard: false,
          periodCount: 4,
          allowedExclusions: false,
          typeWeights: {},
        })
      }
    }
  }, [open, initialData, form])

  const watchType = form.watch('type')

  const handleSubmit = (data: z.infer<typeof ruleSchema>) => {
    if (initialData) {
      onSubmit({ ...data, id: initialData.id })
    } else {
      onSubmit(data)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Regra' : 'Nova Regra de Avaliação'}
          </DialogTitle>
          <DialogDescription>
            Defina os critérios de aprovação, cálculo e dependência.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Regra</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Padrão Fundamental" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Avaliação</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="numeric">Numérica</SelectItem>
                        <SelectItem value="descriptive">Descritiva</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva brevemente como funciona esta regra..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isStandard"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Definir como Regra Padrão</FormLabel>
                    <FormDescription>
                      Esta regra poderá ser rapidamente associada a novas
                      séries.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {watchType === 'numeric' && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/5">
                <h4 className="font-medium text-sm text-primary">
                  Configurações de Cálculo e Pesos
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="periodCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Avaliações</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Número de períodos/bimestres no ano.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="allowedExclusions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background h-full">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Permitir Exclusão de Notas</FormLabel>
                          <FormDescription>
                            Permite excluir a pior nota do cálculo final se
                            aplicável.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel>Pesos por Tipo de Avaliação (%)</FormLabel>
                  <ScrollArea className="h-[150px] w-full rounded-md border p-2 bg-background">
                    {assessmentTypes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Nenhum tipo de avaliação cadastrado.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {assessmentTypes.map((type) => (
                          <FormField
                            key={type.id}
                            control={form.control}
                            name={`typeWeights.${type.id}`}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-4 space-y-0">
                                <FormLabel className="w-1/2 text-xs font-normal truncate">
                                  {type.name}
                                </FormLabel>
                                <FormControl>
                                  <div className="relative w-1/2">
                                    <Input
                                      type="number"
                                      className="h-8"
                                      placeholder="Peso (ex: 50)"
                                      value={field.value || ''}
                                      onChange={field.onChange}
                                    />
                                    <span className="absolute right-3 top-2 text-xs text-muted-foreground">
                                      %
                                    </span>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="formula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fórmula Personalizada (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: (eval1 + eval2 + eval3 + eval4) / 4"
                            className="font-mono h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Use <code>eval1</code>, <code>eval2</code>, etc. para
                          representar as notas de cada período. Se definido,
                          sobrepõe o cálculo por pesos.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nota Mínima (Escala)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nota Máxima (Escala)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h4 className="font-medium text-sm pt-2 text-primary">
                  Critérios de Aprovação
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="passingGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Média para Aprovação</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Abaixo desta nota, entra em dependência.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minDependencyGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nota Mínima para Dependência</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Abaixo desta nota, reprovação direta.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4 border rounded-md p-4">
              <h4 className="font-medium text-sm">Frequência</h4>
              <FormField
                control={form.control}
                name="minAttendance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência Mínima (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Porcentagem mínima de presença para aprovação.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Regra</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
