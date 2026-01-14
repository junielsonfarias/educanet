import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { useEvaluationRulesStore } from '@/stores/useEvaluationRulesStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import type { EvaluationRule } from '@/lib/supabase/services'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EducationGrade {
  id: number;
  grade_name: string;
  grade_order: number;
  education_level?: string;
}

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  course_id: z.coerce.number().optional().nullable(),
  education_grade_id: z.coerce.number().optional().nullable(),
  min_approval_grade: z.coerce.number().min(0).max(10).default(7.0),
  min_attendance_percent: z.coerce.number().min(0).max(100).default(75),
  min_evaluations_per_period: z.coerce.number().min(0).max(10).default(2),
  max_single_evaluation_weight: z.coerce.number().min(0).max(100).optional(),
  academic_period_type: z.enum(['Bimestre', 'Trimestre', 'Semestre', 'Anual']).default('Bimestre'),
  periods_per_year: z.coerce.number().min(1).max(12).default(4),
  calculation_type: z.enum(['Media_Simples', 'Media_Ponderada', 'Soma_Notas', 'Descritiva']).default('Media_Simples'),
  allow_recovery: z.boolean().default(true),
  recovery_replaces_lowest: z.boolean().default(true),
})

type FormData = z.infer<typeof formSchema>

interface EvaluationRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: EvaluationRule | null
  onSaveSuccess?: () => void
}

// Estilo base para os selects nativos
const selectClassName = cn(
  'flex h-10 w-full items-center justify-between rounded-md border border-input',
  'bg-background px-3 py-2 text-sm ring-offset-background',
  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
  'transition-all duration-200 hover:border-primary/30',
  'disabled:cursor-not-allowed disabled:opacity-50'
)

export function EvaluationRuleFormDialog({
  open,
  onOpenChange,
  rule,
  onSaveSuccess,
}: EvaluationRuleFormDialogProps) {
  const { createRule, updateRule, loading } = useEvaluationRulesStore()
  const { courses, fetchCourses } = useCourseStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [educationGrades, setEducationGrades] = useState<EducationGrade[]>([])
  const [loadingGrades, setLoadingGrades] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      course_id: null,
      education_grade_id: null,
      min_approval_grade: 7.0,
      min_attendance_percent: 75,
      min_evaluations_per_period: 2,
      max_single_evaluation_weight: 40,
      academic_period_type: 'Bimestre',
      periods_per_year: 4,
      calculation_type: 'Media_Simples',
      allow_recovery: true,
      recovery_replaces_lowest: true,
    },
  })

  useEffect(() => {
    fetchCourses()
    fetchEducationGrades()
  }, [fetchCourses])

  const fetchEducationGrades = async () => {
    setLoadingGrades(true)
    try {
      const { data, error } = await supabase
        .from('education_grades')
        .select('id, grade_name, grade_order, education_level')
        .order('education_level')
        .order('grade_order')

      if (error) throw error
      setEducationGrades(data || [])
    } catch (error) {
      console.error('Erro ao carregar séries:', error)
    } finally {
      setLoadingGrades(false)
    }
  }

  useEffect(() => {
    if (!open) return

    if (rule) {
      form.reset({
        name: rule.name,
        description: rule.description || '',
        course_id: rule.course_id || null,
        education_grade_id: rule.education_grade_id || null,
        min_approval_grade: rule.min_approval_grade,
        min_attendance_percent: rule.min_attendance_percent,
        min_evaluations_per_period: rule.min_evaluations_per_period,
        max_single_evaluation_weight: rule.max_single_evaluation_weight || 40,
        academic_period_type: rule.academic_period_type as FormData['academic_period_type'],
        periods_per_year: rule.periods_per_year,
        calculation_type: rule.calculation_type as FormData['calculation_type'],
        allow_recovery: rule.allow_recovery,
        recovery_replaces_lowest: rule.recovery_replaces_lowest,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        course_id: null,
        education_grade_id: null,
        min_approval_grade: 7.0,
        min_attendance_percent: 75,
        min_evaluations_per_period: 2,
        max_single_evaluation_weight: 40,
        academic_period_type: 'Bimestre',
        periods_per_year: 4,
        calculation_type: 'Media_Simples',
        allow_recovery: true,
        recovery_replaces_lowest: true,
      })
    }
  }, [rule, form, open])

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true)
    try {
      const data = {
        name: values.name,
        description: values.description || undefined,
        course_id: values.course_id || undefined,
        education_grade_id: values.education_grade_id || undefined,
        min_approval_grade: values.min_approval_grade,
        min_attendance_percent: values.min_attendance_percent,
        min_evaluations_per_period: values.min_evaluations_per_period,
        max_single_evaluation_weight: values.max_single_evaluation_weight,
        academic_period_type: values.academic_period_type,
        periods_per_year: values.periods_per_year,
        calculation_type: values.calculation_type,
        allow_recovery: values.allow_recovery,
        recovery_replaces_lowest: values.recovery_replaces_lowest,
      }

      let result
      const isUpdate = !!rule

      if (rule) {
        result = await updateRule(rule.id, data)
      } else {
        result = await createRule(data)
      }

      if (result) {
        onOpenChange(false)
        setTimeout(() => {
          toast.success(isUpdate ? 'Regra atualizada com sucesso.' : 'Regra criada com sucesso.')
          onSaveSuccess?.()
        }, 200)
      } else {
        toast.error('Erro ao salvar regra.')
      }
    } catch (error) {
      console.error('Erro ao salvar regra:', error)
      toast.error('Erro ao salvar regra.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCalculationType = form.watch('calculation_type')
  const allowRecovery = form.watch('allow_recovery')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Editar Regra de Avaliação' : 'Nova Regra de Avaliação'}
          </DialogTitle>
          <DialogDescription>
            Configure as regras de aprovação, frequência e cálculo de médias.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome e Descrição */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Regra *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Regra Padrão - Fundamental I" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Vínculo com Curso (opcional) - usando select nativo */}
            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vincular a Curso (Opcional)</FormLabel>
                  <FormControl>
                    <select
                      className={selectClassName}
                      value={field.value?.toString() || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Nenhum (Regra Geral)</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id.toString()}>
                          {course.name} ({course.education_level})
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    Se não vincular a um curso, a regra pode ser usada como padrão.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vínculo com Série (opcional) - usando select nativo */}
            <FormField
              control={form.control}
              name="education_grade_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vincular a Série/Ano (Opcional)</FormLabel>
                  <FormControl>
                    <select
                      className={selectClassName}
                      value={field.value?.toString() || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      disabled={loadingGrades}
                    >
                      <option value="">Nenhuma (Todas as séries)</option>
                      {educationGrades.map((grade) => (
                        <option key={grade.id} value={grade.id.toString()}>
                          {grade.grade_name} {grade.education_level ? `(${grade.education_level})` : ''}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    Se vincular a uma série específica, esta regra será aplicada apenas a ela.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Critérios de Aprovação */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-sm">Critérios de Aprovação</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_approval_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nota Mínima para Aprovação</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>De 0 a 10</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_attendance_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência Mínima (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>LDB: mínimo 75%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Configuração de Períodos */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-sm">Configuração de Períodos</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="academic_period_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Período</FormLabel>
                      <FormControl>
                        <select
                          className={selectClassName}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="Bimestre">Bimestre</option>
                          <option value="Trimestre">Trimestre</option>
                          <option value="Semestre">Semestre</option>
                          <option value="Anual">Anual</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="periods_per_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Períodos por Ano</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="min_evaluations_per_period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avaliações Mínimas por Período</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Quantas avaliações devem ser aplicadas em cada período
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cálculo da Média */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-sm">Cálculo da Média</h4>

              <FormField
                control={form.control}
                name="calculation_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cálculo</FormLabel>
                    <FormControl>
                      <select
                        className={selectClassName}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="Media_Simples">Média Simples</option>
                        <option value="Media_Ponderada">Média Ponderada</option>
                        <option value="Soma_Notas">Soma de Notas</option>
                        <option value="Descritiva">Descritiva (sem nota)</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      {selectedCalculationType === 'Descritiva'
                        ? 'Avaliação qualitativa - ideal para Educação Infantil'
                        : selectedCalculationType === 'Media_Ponderada'
                        ? 'Cada avaliação terá peso diferente no cálculo'
                        : 'Soma das notas dividida pelo número de avaliações'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCalculationType !== 'Descritiva' && (
                <FormField
                  control={form.control}
                  name="max_single_evaluation_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso Máximo de Uma Avaliação (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Limite máximo que uma única avaliação pode ter na média
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Recuperação */}
            {selectedCalculationType !== 'Descritiva' && (
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-sm">Recuperação</h4>

                <FormField
                  control={form.control}
                  name="allow_recovery"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Permitir Recuperação</FormLabel>
                        <FormDescription>
                          Permite que o aluno faça prova de recuperação
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

                {allowRecovery && (
                  <FormField
                    control={form.control}
                    name="recovery_replaces_lowest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Substituir Menor Nota</FormLabel>
                          <FormDescription>
                            A nota da recuperação substitui a menor nota do período
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
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {rule ? 'Salvar Alterações' : 'Criar Regra'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
