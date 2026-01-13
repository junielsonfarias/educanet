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
import { FormDescription } from '@/components/ui/form'
import { EvaluationRule } from '@/lib/mock-data'

const gradeSchema = z.object({
  name: z.string().min(2, 'Nome da série/ano deve ter pelo menos 2 caracteres'),
  numero: z.coerce.number().min(1).max(9, 'Número deve ser entre 1 e 9'),
  evaluationRuleId: z.string().min(1, 'Regra de avaliação é obrigatória'),
})

interface GradeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
  evaluationRules: EvaluationRule[]
  initialData?: any
}

export function GradeFormDialog({
  open,
  onOpenChange,
  onSubmit,
  evaluationRules,
  initialData,
}: GradeFormDialogProps) {
  const form = useForm<z.infer<typeof gradeSchema>>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      name: '',
      numero: 1,
      evaluationRuleId: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          numero: initialData.numero || 1,
          evaluationRuleId: initialData.evaluationRuleId || '',
        })
      } else {
        form.reset({
          name: '',
          numero: 1,
          evaluationRuleId: '',
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const handleSubmit = (data: z.infer<typeof gradeSchema>) => {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Série/Ano' : 'Nova Série/Ano'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Modifique os detalhes da série e regra de avaliação.'
              : 'Adicione uma série ao curso e vincule uma regra de avaliação.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Série/Ano *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="9"
                        placeholder="1"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1
                          field.onChange(value)
                          // Atualiza o nome automaticamente se estiver vazio
                          if (!form.getValues('name')) {
                            form.setValue('name', `${value}º Ano`)
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Número para ordenação (1-9)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Série/Ano *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1º Ano" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome completo da série/ano
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="evaluationRuleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regra de Avaliação *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {evaluationRules.map((rule) => (
                        <SelectItem key={rule.id} value={rule.id}>
                          {rule.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Regra de avaliação aplicada a esta série/ano
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
