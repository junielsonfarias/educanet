import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Trash2, GripVertical } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { validateEtapaEnsinoCode, ETAPA_ENSINO_CODES } from '@/lib/validations'

// Códigos INEP para Etapas de Ensino (Censo Escolar)
const CODIGOS_CENSO = Object.entries(ETAPA_ENSINO_CODES).map(([code, data]) => ({
  codigo: code,
  name: data.name,
}))

// Séries padrão por código de etapa de ensino
const SERIES_POR_ETAPA: Record<string, { name: string; order: number }[]> = {
  '01': [ // Creche
    { name: 'Berçário I', order: 1 },
    { name: 'Berçário II', order: 2 },
    { name: 'Maternal I', order: 3 },
    { name: 'Maternal II', order: 4 },
  ],
  '02': [ // Pré-escola
    { name: 'Pré I', order: 1 },
    { name: 'Pré II', order: 2 },
  ],
  '03': [ // Anos Iniciais (Fundamental I)
    { name: '1º Ano', order: 1 },
    { name: '2º Ano', order: 2 },
    { name: '3º Ano', order: 3 },
    { name: '4º Ano', order: 4 },
    { name: '5º Ano', order: 5 },
  ],
  '04': [ // Anos Finais (Fundamental II)
    { name: '6º Ano', order: 1 },
    { name: '7º Ano', order: 2 },
    { name: '8º Ano', order: 3 },
    { name: '9º Ano', order: 4 },
  ],
  '05': [ // Ensino Médio
    { name: '1ª Série', order: 1 },
    { name: '2ª Série', order: 2 },
    { name: '3ª Série', order: 3 },
  ],
  '06': [ // EJA
    { name: 'EJA - Fase I', order: 1 },
    { name: 'EJA - Fase II', order: 2 },
    { name: 'EJA - Fase III', order: 3 },
    { name: 'EJA - Fase IV', order: 4 },
  ],
}

const serieSchema = z.object({
  name: z.string().min(1, 'Nome da série é obrigatório'),
  order: z.number().min(1, 'Ordem deve ser maior que 0'),
  is_final: z.boolean().default(false),
})

const courseSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  codigoCenso: z
    .string()
    .min(1, 'Código do Censo é obrigatório')
    .refine(
      (val) => validateEtapaEnsinoCode(val).valid,
      (val) => ({
        message: validateEtapaEnsinoCode(val).error || 'Código inválido',
      }),
    ),
  description: z.string().optional(),
  series: z.array(serieSchema).min(1, 'Adicione pelo menos uma série'),
})

type CourseFormData = z.infer<typeof courseSchema>

interface CourseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CourseFormData) => void
  initialData?: Partial<CourseFormData> & { id?: number }
}

export function CourseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CourseFormDialogProps) {
  const [autoFillSeries, setAutoFillSeries] = useState(true)

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      codigoCenso: '',
      description: '',
      series: [],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'series',
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name || '',
          codigoCenso: initialData.codigoCenso || '',
          description: initialData.description || '',
          series: initialData.series || [],
        })
      } else {
        form.reset({
          name: '',
          codigoCenso: '',
          description: '',
          series: [],
        })
      }
    }
  }, [open, initialData, form])

  const handleCodigoChange = (codigo: string) => {
    form.setValue('codigoCenso', codigo)

    // Preenche nome automaticamente
    const selected = CODIGOS_CENSO.find((c) => c.codigo === codigo)
    if (selected) {
      form.setValue('name', selected.name)
    }

    // Preenche séries automaticamente se habilitado
    if (autoFillSeries && SERIES_POR_ETAPA[codigo]) {
      const seriesDefault = SERIES_POR_ETAPA[codigo].map((s, idx, arr) => ({
        name: s.name,
        order: s.order,
        is_final: idx === arr.length - 1, // última série é final
      }))
      replace(seriesDefault)
    }
  }

  const addSerie = () => {
    const currentSeries = form.getValues('series')
    const nextOrder = currentSeries.length > 0
      ? Math.max(...currentSeries.map(s => s.order)) + 1
      : 1
    append({ name: '', order: nextOrder, is_final: false })
  }

  const handleSubmit = (data: CourseFormData) => {
    // Marcar a última série como final
    const seriesWithFinal = data.series.map((s, idx, arr) => ({
      ...s,
      is_final: idx === arr.length - 1,
    }))
    onSubmit({ ...data, series: seriesWithFinal })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? 'Editar Etapa de Ensino' : 'Nova Etapa de Ensino'}
          </DialogTitle>
          <DialogDescription>
            {initialData?.id
              ? 'Atualize os dados da etapa de ensino e suas séries.'
              : 'Cadastre uma nova etapa de ensino com suas séries/anos.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Código INEP */}
                <FormField
                  control={form.control}
                  name="codigoCenso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etapa de Ensino (INEP) *</FormLabel>
                      <Select
                        onValueChange={handleCodigoChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a etapa de ensino..." />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nome */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Ensino Fundamental - Anos Iniciais" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descrição */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição opcional..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Auto-preenchimento */}
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="autoFill"
                    checked={autoFillSeries}
                    onCheckedChange={(checked) => setAutoFillSeries(checked as boolean)}
                  />
                  <label
                    htmlFor="autoFill"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Preencher séries automaticamente ao selecionar etapa
                  </label>
                </div>

                {/* Séries */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base">
                      Séries/Anos *
                    </FormLabel>
                    <Badge variant="secondary">
                      {fields.length} série{fields.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <FormDescription>
                    Adicione as séries/anos desta etapa de ensino na ordem correta.
                  </FormDescription>

                  {fields.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      Nenhuma série adicionada.
                      <br />
                      <span className="text-sm">
                        Selecione uma etapa de ensino ou adicione manualmente.
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />

                        <div className="w-12 text-center">
                          <Badge variant="outline">{index + 1}º</Badge>
                        </div>

                        <FormField
                          control={form.control}
                          name={`series.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Nome da série (ex: 1º Ano)"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`series.${index}.order`}
                          render={({ field }) => (
                            <FormItem className="w-20">
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="Ordem"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSerie}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Série
                  </Button>

                  {form.formState.errors.series?.message && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.series.message}
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {initialData?.id ? 'Atualizar' : 'Criar Etapa de Ensino'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
