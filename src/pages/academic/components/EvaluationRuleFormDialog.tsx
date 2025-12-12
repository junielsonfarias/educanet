import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EvaluationRule } from '@/lib/mock-data'
import { useEffect } from 'react'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['numeric', 'descriptive']),
  description: z.string().min(1, 'Descrição é obrigatória'),
  passingGrade: z.coerce.number().min(0).max(10).optional(),
  minAttendance: z.coerce.number().min(0).max(100).optional(),
  formula: z.string().optional(),
  recoveryStrategy: z
    .enum(['replace_if_higher', 'always_replace', 'average'])
    .optional(),
})

interface EvaluationRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: EvaluationRule | null
  onSave: (data: Omit<EvaluationRule, 'id'>) => void
}

export function EvaluationRuleFormDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: EvaluationRuleFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'numeric',
      description: '',
      passingGrade: 6,
      minAttendance: 75,
      formula: '',
      recoveryStrategy: 'replace_if_higher',
    },
  })

  useEffect(() => {
    if (rule) {
      form.reset({
        name: rule.name,
        type: rule.type,
        description: rule.description,
        passingGrade: rule.passingGrade,
        minAttendance: rule.minAttendance,
        formula: rule.formula || '',
        recoveryStrategy: rule.recoveryStrategy || 'replace_if_higher',
      })
    } else {
      form.reset({
        name: '',
        type: 'numeric',
        description: '',
        passingGrade: 6,
        minAttendance: 75,
        formula: '',
        recoveryStrategy: 'replace_if_higher',
      })
    }
  }, [rule, form])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave({
      ...values,
      formula: values.formula || undefined,
    })
    onOpenChange(false)
  }

  const selectedType = form.watch('type')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Editar Regra de Avaliação' : 'Nova Regra de Avaliação'}
          </DialogTitle>
          <DialogDescription>
            Configure as regras de cálculo, aprovação e recuperação.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Regra</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Média Aritmética" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="numeric">Numérica (0-10)</SelectItem>
                        <SelectItem value="descriptive">
                          Parecer Descritivo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minAttendance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência Mínima (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedType === 'numeric' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="passingGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Média para Aprovação</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="6.0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recoveryStrategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estratégia de Recuperação</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="replace_if_higher">
                              Substituir se Maior
                            </SelectItem>
                            <SelectItem value="always_replace">
                              Sempre Substituir
                            </SelectItem>
                            <SelectItem value="average">
                              Média (Original + Rec)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="formula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fórmula da Média Final (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: (eval1 + eval2 + eval3 + eval4) / 4"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use <code>eval1</code>, <code>eval2</code>, etc. para
                        representar as notas dos períodos. Suporta{' '}
                        <code>+</code>, <code>-</code>, <code>*</code> (ou{' '}
                        <code>x</code>), <code>/</code> e parênteses.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva como esta regra funciona..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Regra</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
