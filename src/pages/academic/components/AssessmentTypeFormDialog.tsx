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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, GraduationCap } from 'lucide-react'
import { courseService } from '@/lib/supabase/services'

interface EducationGrade {
  id: number
  grade_name: string
  education_level: string
  grade_order: number
}

// Interface para dados do formulário
export interface AssessmentTypeFormData {
  id?: number
  name: string
  code?: string
  description?: string
  weight: number
  maxScore: number
  passingScore: number
  excludeFromAverage: boolean
  isRecovery: boolean
  replacesLowest: boolean
  isMandatory: boolean
  applicablePeriodType: string
  applicableGradeIds: number[]
}

const typeSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  code: z.string().optional(),
  description: z.string().optional(),
  weight: z.coerce.number().min(0.1, 'Peso mínimo é 0.1').max(10, 'Peso máximo é 10').default(1),
  maxScore: z.coerce.number().min(1, 'Nota máxima mínima é 1').max(100, 'Nota máxima é 100').default(10),
  passingScore: z.coerce.number().min(0, 'Nota mínima não pode ser negativa').default(6),
  excludeFromAverage: z.boolean().default(false),
  isRecovery: z.boolean().default(false),
  replacesLowest: z.boolean().default(false),
  isMandatory: z.boolean().default(true),
  applicablePeriodType: z.string().default('bimester'),
  applicableGradeIds: z.array(z.number()).default([]),
})

interface AssessmentTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AssessmentTypeFormData) => void
  initialData?: AssessmentTypeFormData | null
}

export function AssessmentTypeFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: AssessmentTypeFormDialogProps) {
  const [allGrades, setAllGrades] = useState<EducationGrade[]>([])
  const [loadingGrades, setLoadingGrades] = useState(false)

  const form = useForm<z.infer<typeof typeSchema>>({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      weight: 1,
      maxScore: 10,
      passingScore: 6,
      excludeFromAverage: false,
      isRecovery: false,
      replacesLowest: false,
      isMandatory: true,
      applicablePeriodType: 'bimester',
      applicableGradeIds: [],
    },
  })

  // Carregar séries quando o dialog abrir
  useEffect(() => {
    if (open && allGrades.length === 0) {
      loadGrades()
    }
  }, [open])

  const loadGrades = async () => {
    setLoadingGrades(true)
    try {
      const grades = await courseService.getAllSeries()
      setAllGrades(grades || [])
    } catch (error) {
      console.error('Erro ao carregar séries:', error)
    } finally {
      setLoadingGrades(false)
    }
  }

  // Agrupar séries por nível de ensino
  const gradesByLevel = allGrades.reduce((acc, grade) => {
    const level = grade.education_level || 'Outros'
    if (!acc[level]) acc[level] = []
    acc[level].push(grade)
    return acc
  }, {} as Record<string, EducationGrade[]>)

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          code: initialData.code || '',
          description: initialData.description || '',
          weight: initialData.weight || 1,
          maxScore: initialData.maxScore || 10,
          passingScore: initialData.passingScore || 6,
          excludeFromAverage: initialData.excludeFromAverage || false,
          isRecovery: initialData.isRecovery || false,
          replacesLowest: initialData.replacesLowest || false,
          isMandatory: initialData.isMandatory !== false,
          applicablePeriodType: initialData.applicablePeriodType || 'bimester',
          applicableGradeIds: initialData.applicableGradeIds || [],
        })
      } else {
        form.reset({
          name: '',
          code: '',
          description: '',
          weight: 1,
          maxScore: 10,
          passingScore: 6,
          excludeFromAverage: false,
          isRecovery: false,
          replacesLowest: false,
          isMandatory: true,
          applicablePeriodType: 'bimester',
          applicableGradeIds: [],
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const handleSubmit = (data: z.infer<typeof typeSchema>) => {
    onSubmit(data as AssessmentTypeFormData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? 'Editar Tipo de Avaliação'
              : 'Novo Tipo de Avaliação'}
          </DialogTitle>
          <DialogDescription>
            Defina as configurações para este tipo de avaliação.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Linha 1: Nome e Código */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Avaliação *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Prova Bimestral 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: PB1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 2: Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o propósito deste tipo de avaliação..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linha 3: Peso, Nota Máxima, Nota Mínima */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Peso no cálculo da média
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Máxima</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="1"
                        max="100"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Valor máximo da nota
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Mínima</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Nota para aprovação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Linha 4: Período de Aplicação */}
            <FormField
              control={form.control}
              name="applicablePeriodType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de Aplicação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bimester">Bimestral</SelectItem>
                      <SelectItem value="semester">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linha 5: Séries Aplicáveis */}
            <FormField
              control={form.control}
              name="applicableGradeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Séries Aplicáveis
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Selecione as séries onde este tipo de avaliação será disponibilizado.
                    Se nenhuma for selecionada, estará disponível para todas.
                  </FormDescription>

                  {/* Séries selecionadas */}
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1 p-2 rounded-md border bg-muted/30">
                      {field.value.map((gradeId) => {
                        const grade = allGrades.find(g => g.id === gradeId)
                        return (
                          <Badge
                            key={gradeId}
                            variant="secondary"
                            className="pl-2 pr-1 gap-1"
                          >
                            {grade?.grade_name || `ID ${gradeId}`}
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange(field.value.filter(id => id !== gradeId))
                              }}
                              className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}

                  {/* Lista de séries para selecionar */}
                  <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-3">
                    {loadingGrades ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        Carregando séries...
                      </div>
                    ) : Object.keys(gradesByLevel).length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma série cadastrada
                      </div>
                    ) : (
                      Object.entries(gradesByLevel).map(([level, grades]) => (
                        <div key={level}>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            {level}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                            {grades
                              .sort((a, b) => a.grade_order - b.grade_order)
                              .map((grade) => {
                                const isSelected = field.value?.includes(grade.id)
                                return (
                                  <button
                                    key={grade.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        field.onChange(field.value.filter(id => id !== grade.id))
                                      } else {
                                        field.onChange([...(field.value || []), grade.id])
                                      }
                                    }}
                                    className={`text-left text-xs px-2 py-1.5 rounded-md border transition-colors ${
                                      isSelected
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-muted border-input'
                                    }`}
                                  >
                                    {grade.grade_name}
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Botões de ação rápida */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => field.onChange(allGrades.map(g => g.id))}
                      disabled={loadingGrades || allGrades.length === 0}
                    >
                      Selecionar Todas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => field.onChange([])}
                      disabled={!field.value || field.value.length === 0}
                    >
                      Limpar Seleção
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linha 6: Opções (Checkboxes) */}
            <div className="space-y-3 rounded-md border p-4">
              <FormLabel className="text-base">Configurações</FormLabel>

              <FormField
                control={form.control}
                name="isRecovery"
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
                        Avaliação de Recuperação
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Marque se esta é uma avaliação de recuperação
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excludeFromAverage"
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
                        Não contabilizar na média
                      </FormLabel>
                      <FormDescription className="text-xs">
                        A nota será registrada mas não afetará a média
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="replacesLowest"
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
                        Substitui a menor nota
                      </FormLabel>
                      <FormDescription className="text-xs">
                        A nota desta avaliação substituirá a menor nota do período
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isMandatory"
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
                        Obrigatória para todos os alunos
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Todos os alunos devem ter nota registrada
                      </FormDescription>
                    </div>
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
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
