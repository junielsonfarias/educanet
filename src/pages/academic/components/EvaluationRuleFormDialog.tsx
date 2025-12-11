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
import { EvaluationRule } from '@/lib/mock-data'

const ruleSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.enum(['numeric', 'descriptive']),
  description: z.string().min(5, 'Descrição é obrigatória'),
  minGrade: z.coerce.number().min(0).max(100).optional(),
  maxGrade: z.coerce.number().min(0).max(100).optional(),
  passingGrade: z.coerce.number().min(0).max(100).optional(),
  minDependencyGrade: z.coerce.number().min(0).max(100).optional(),
  minAttendance: z.coerce.number().min(0).max(100).optional(),
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
        })
      }
    }
  }, [open, initialData, form])

  const watchType = form.watch('type')

  const handleSubmit = (data: z.infer<typeof ruleSchema>) => {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Regra' : 'Nova Regra de Avaliação'}
          </DialogTitle>
          <DialogDescription>
            Defina os critérios de aprovação, reprovação e dependência.
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

            {watchType === 'numeric' && (
              <div className="space-y-4 border rounded-md p-4">
                <h4 className="font-medium text-sm">Escala de Notas</h4>
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

                <h4 className="font-medium text-sm pt-2">
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
                          Abaixo desta nota (e acima da nota de dependência), o
                          aluno entra em recuperação/dependência.
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
                          Abaixo desta nota, o aluno é reprovado direto na
                          disciplina.
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
