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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormDescription } from '@/components/ui/form'
import { validateEtapaEnsinoCode, ETAPA_ENSINO_CODES } from '@/lib/validations'

// Códigos INEP para Etapas de Ensino (Censo Escolar)
const CODIGOS_CENSO = Object.entries(ETAPA_ENSINO_CODES).map(([code, data]) => ({
  codigo: code,
  name: data.name,
}))

const courseSchema = z.object({
  name: z.string().min(3, 'Nome da etapa de ensino deve ter pelo menos 3 caracteres'),
  codigoCenso: z
    .string()
    .min(1, 'Código do Censo Escolar é obrigatório')
    .refine(
      (val) => validateEtapaEnsinoCode(val).valid,
      (val) => ({
        message: validateEtapaEnsinoCode(val).error || 'Código do Censo Escolar inválido',
      }),
    ),
  duration_months: z.coerce.number().min(1, 'Duração mínima é 1 mês').optional(),
})

interface CourseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: any
}

export function CourseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CourseFormDialogProps) {
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      codigoCenso: '',
      duration_months: undefined,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          codigoCenso: initialData.codigoCenso || '',
          duration_months: initialData.duration_months || undefined,
        })
      } else {
        form.reset({
          name: '',
          codigoCenso: '',
          duration_months: undefined,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const handleSubmit = (data: z.infer<typeof courseSchema>) => {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Etapa de Ensino' : 'Nova Etapa de Ensino'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize os dados da etapa de ensino.'
              : 'Crie uma nova etapa de ensino conforme Censo Escolar (INEP).'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="codigoCenso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Censo Escolar (INEP) *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Preenche automaticamente o nome baseado no código
                      const selected = CODIGOS_CENSO.find((c) => c.codigo === value)
                      if (selected && !form.getValues('name')) {
                        form.setValue('name', selected.name)
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o código INEP..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CODIGOS_CENSO.map((item) => (
                        <SelectItem key={item.codigo} value={item.codigo}>
                          {item.codigo} - {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Código oficial do Censo Escolar (Educacenso) do INEP
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
                  <FormLabel>Nome da Etapa de Ensino *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ensino Fundamental - Anos Iniciais" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome descritivo da etapa de ensino
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração (meses)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 12"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Duração prevista em meses para conclusão da etapa (opcional)
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
