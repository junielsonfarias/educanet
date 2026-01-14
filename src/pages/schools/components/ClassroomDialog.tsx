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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useEffect, useMemo } from 'react'
import { useTeacherStore } from '@/stores/useTeacherStore.supabase'
import { validateModalidadeCode, validateTipoRegimeCode } from '@/lib/validations'
import type { School } from '@/lib/database-types'
import {
  safeArray,
  safeFind,
  safeMap,
  safeFlatMap,
} from '@/lib/array-utils'
import { cn } from '@/lib/utils'

const classroomSchema = z.object({
  name: z.string().min(2, 'Nome da turma obrigatório'),
  acronym: z.string().optional(),
  shift: z.enum(['Matutino', 'Vespertino', 'Noturno', 'Integral']),
  etapaEnsinoId: z.string().min(1, 'Etapa de Ensino obrigatória'),
  serieAnoId: z.string().optional(),
  gradeId: z.string().optional(),
  operatingHours: z.string().optional(),
  minStudents: z.coerce.number().min(0).optional(),
  maxDependencySubjects: z.coerce.number().min(0).optional(),
  operatingDays: z.array(z.string()).optional(),
  isMultiGrade: z.boolean().default(false),
  maxCapacity: z.coerce.number().min(1, 'Capacidade mínima é 1 aluno').optional(),
  regentTeacherId: z.string().optional(),
  educationModality: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateModalidadeCode(val).valid,
      (val) => ({
        message: validateModalidadeCode(val || '').error || 'Código de modalidade inválido',
      }),
    ),
  tipoRegime: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateTipoRegimeCode(val).valid,
      (val) => ({
        message: validateTipoRegimeCode(val || '').error || 'Código de tipo de regime inválido',
      }),
    ),
  schoolId: z.string().optional(),
  yearId: z.string().optional(),
})

interface SerieAno {
  id: string
  name: string
  numero?: number
}

interface ClassroomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
  etapasEnsino?: Array<{
    id: string
    name: string
    codigoCenso?: string
    seriesAnos?: SerieAno[]
  }>
  schools?: School[]
  initialData?: Record<string, unknown>
}

const daysOfWeek = [
  { id: 'seg', label: 'Segunda' },
  { id: 'ter', label: 'Terça' },
  { id: 'qua', label: 'Quarta' },
  { id: 'qui', label: 'Quinta' },
  { id: 'sex', label: 'Sexta' },
  { id: 'sab', label: 'Sábado' },
]

// Classe CSS para selects nativos (mesmo estilo do shadcn/ui)
const selectClassName = cn(
  'flex h-10 w-full items-center justify-between rounded-md border border-input',
  'bg-background px-3 py-2 text-sm ring-offset-background',
  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
  'transition-all duration-200 hover:border-primary/30',
  'disabled:cursor-not-allowed disabled:opacity-50'
)

export function ClassroomDialog({
  open,
  onOpenChange,
  onSubmit,
  etapasEnsino: etapasEnsinoProp = [],
  schools,
  initialData,
}: ClassroomDialogProps) {
  const { teachers, loading: teachersLoading, fetchTeachers } = useTeacherStore()

  const etapasEnsino = etapasEnsinoProp || []

  // Carregar professores se necessário
  useEffect(() => {
    if (open && teachers.length === 0 && !teachersLoading) {
      fetchTeachers()
    }
  }, [open, teachers.length, teachersLoading, fetchTeachers])

  const form = useForm<z.infer<typeof classroomSchema>>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: '',
      acronym: '',
      shift: 'Matutino',
      gradeId: '',
      operatingHours: '',
      minStudents: 0,
      maxDependencySubjects: 0,
      operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
      isMultiGrade: false,
      maxCapacity: 30,
      regentTeacherId: '',
      educationModality: '',
      schoolId: '',
      yearId: '',
    },
  })

  // Flatten seriesAnos from etapasEnsino com referência à etapa (memoizado)
  const flattenGrades = useMemo(
    () =>
      safeFlatMap(etapasEnsino, (etapa) =>
        safeMap(etapa.seriesAnos, (s: SerieAno) => ({
          ...s,
          courseName: etapa.name,
          etapaEnsinoId: etapa.id,
          etapaEnsinoCodigo: etapa.codigoCenso,
        })),
      ),
    [etapasEnsino],
  )

  useEffect(() => {
    if (open) {
      if (initialData) {
        const serieAnoId = (initialData.serieAnoId || initialData.gradeId) as string | undefined
        const etapaEnsinoIdFromSerieAno =
          serieAnoId && flattenGrades.length > 0
            ? flattenGrades.find((s) => s.id === serieAnoId)?.etapaEnsinoId || ''
            : ''

        form.reset({
          name: initialData.name as string || '',
          acronym: initialData.acronym as string || '',
          shift: (initialData.shift as 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral') || 'Matutino',
          etapaEnsinoId: (initialData.etapaEnsinoId as string) || etapaEnsinoIdFromSerieAno,
          serieAnoId: (initialData.serieAnoId || initialData.gradeId) as string || '',
          gradeId: (initialData.gradeId || initialData.serieAnoId) as string || '',
          operatingHours: initialData.operatingHours as string || '',
          minStudents: (initialData.minStudents as number) || 0,
          maxDependencySubjects: (initialData.maxDependencySubjects as number) || 0,
          operatingDays: (initialData.operatingDays as string[]) || ['seg', 'ter', 'qua', 'qui', 'sex'],
          isMultiGrade: (initialData.isMultiGrade as boolean) || false,
          maxCapacity: (initialData.maxCapacity as number) || 30,
          regentTeacherId: initialData.regentTeacherId as string || '',
          educationModality: initialData.educationModality as string || '',
          tipoRegime: initialData.tipoRegime as string || '',
          schoolId: initialData.schoolId as string || '',
          yearId: initialData.yearId as string || '',
        })
      } else {
        form.reset({
          name: '',
          acronym: '',
          shift: 'Matutino',
          etapaEnsinoId: '',
          serieAnoId: '',
          gradeId: '',
          operatingHours: '',
          minStudents: 0,
          maxDependencySubjects: 0,
          operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
          isMultiGrade: false,
          maxCapacity: 30,
          regentTeacherId: '',
          educationModality: '',
          tipoRegime: '',
          schoolId: '',
          yearId: '',
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const isMultiGrade = form.watch('isMultiGrade')
  const selectedSchoolId = form.watch('schoolId')
  const selectedEtapaEnsinoId = form.watch('etapaEnsinoId')
  const selectedSchool = schools?.find((s) => s.id === selectedSchoolId)
  const academicYears = selectedSchool?.academicYears || []

  // Filtra séries/anos baseado na etapa de ensino selecionada (memoizado)
  const selectedEtapa = useMemo(
    () => safeFind(etapasEnsino, (e) => e.id === selectedEtapaEnsinoId),
    [etapasEnsino, selectedEtapaEnsinoId],
  )

  // Ordena séries/anos por número se disponível (memoizado)
  const availableSeriesAnos = useMemo(() => {
    if (!selectedEtapa || !Array.isArray(selectedEtapa.seriesAnos)) {
      return []
    }
    return [...selectedEtapa.seriesAnos]
      .filter((s): s is SerieAno => Boolean(s) && Boolean(s.id) && Boolean(s.name))
      .sort((a, b) => {
        const numA = a.numero || parseInt(a.name) || 0
        const numB = b.numero || parseInt(b.name) || 0
        return numA - numB
      })
  }, [selectedEtapa])

  const handleSubmit = (data: z.infer<typeof classroomSchema>) => {
    // Validação: se não for multissérie, deve ter série/ano selecionada
    if (!data.isMultiGrade && !data.serieAnoId && !data.gradeId) {
      form.setError('serieAnoId', {
        type: 'manual',
        message: 'Série/Ano é obrigatória para turmas não multissérie',
      })
      return
    }

    // Validação: etapa de ensino é obrigatória
    if (!data.etapaEnsinoId) {
      form.setError('etapaEnsinoId', {
        type: 'manual',
        message: 'Etapa de Ensino é obrigatória',
      })
      return
    }

    // Usa serieAnoId se disponível, senão usa gradeId (compatibilidade)
    const serieAnoId = data.serieAnoId || data.gradeId
    const selectedGrade = serieAnoId
      ? flattenGrades.find((g) => g.id === serieAnoId)
      : null
    const selectedEtapaData = safeFind(etapasEnsino, (e) => e.id === data.etapaEnsinoId)

    // Validação: série/ano deve pertencer à etapa de ensino selecionada
    if (selectedGrade && selectedGrade.etapaEnsinoId !== data.etapaEnsinoId) {
      form.setError('serieAnoId', {
        type: 'manual',
        message: 'A série/ano selecionada não pertence à etapa de ensino escolhida',
      })
      return
    }

    // Prepara dados para submissão
    const submitData = {
      ...data,
      serieAnoId: serieAnoId || undefined,
      serieAnoName: selectedGrade ? selectedGrade.name : isMultiGrade ? 'Multissérie' : undefined,
      etapaEnsinoName: selectedEtapaData ? selectedEtapaData.name : '',
      etapaEnsinoCodigo: selectedEtapaData ? selectedEtapaData.codigoCenso : '',
      gradeId: serieAnoId || undefined,
      gradeName: selectedGrade ? selectedGrade.name : isMultiGrade ? 'Multissérie' : undefined,
      studentCount: (initialData?.studentCount as number) || 0,
    }

    onSubmit(submitData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Turma' : 'Nova Turma'}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da turma e grade curricular.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* If creating from global list, show School/Year selection */}
            {schools && !initialData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="schoolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escola</FormLabel>
                      <FormControl>
                        <select
                          className={selectClassName}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="">Selecione...</option>
                          {(schools || [])
                            .filter((s) => Boolean(s) && Boolean(s.id) && Boolean(s.name))
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano Letivo</FormLabel>
                      <FormControl>
                        <select
                          className={selectClassName}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={!selectedSchoolId}
                        >
                          <option value="">Selecione...</option>
                          {academicYears
                            .filter((y) => Boolean(y) && Boolean(y.id) && Boolean(y.name))
                            .map((y) => (
                              <option key={y.id} value={y.id}>
                                {y.name}
                              </option>
                            ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Turma</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 5º Ano A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="acronym"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sigla (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 5A-M" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno</FormLabel>
                    <FormControl>
                      <select
                        className={selectClassName}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="Matutino">Matutino</option>
                        <option value="Vespertino">Vespertino</option>
                        <option value="Noturno">Noturno</option>
                        <option value="Integral">Integral</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isMultiGrade"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-1">
                    <div className="space-y-0.5">
                      <FormLabel>Turma Multissérie</FormLabel>
                      <FormDescription>
                        Permite alunos de diferentes séries
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Etapa de Ensino - Campo obrigatório do Censo Escolar */}
            <FormField
              control={form.control}
              name="etapaEnsinoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa de Ensino *</FormLabel>
                  <FormControl>
                    <select
                      className={selectClassName}
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        // Limpa a seleção de série/ano quando muda a etapa
                        form.setValue('serieAnoId', '')
                        form.setValue('gradeId', '')
                      }}
                    >
                      <option value="">Selecione a Etapa de Ensino...</option>
                      {(etapasEnsino || [])
                        .filter((e) => Boolean(e) && Boolean(e.id) && Boolean(e.name))
                        .map((etapa) => (
                          <option key={etapa.id} value={etapa.id}>
                            {etapa.name} {etapa.codigoCenso && `(Código: ${etapa.codigoCenso})`}
                          </option>
                        ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    Etapa de ensino conforme Censo Escolar (obrigatório)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Série/Ano - Agora filtrado pela Etapa de Ensino */}
            <FormField
              control={form.control}
              name="serieAnoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isMultiGrade
                      ? 'Série Principal (Referência)'
                      : 'Série/Ano'}
                  </FormLabel>
                  <FormControl>
                    <select
                      className={selectClassName}
                      value={field.value || form.watch('gradeId') || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        // Mantém compatibilidade com gradeId
                        form.setValue('gradeId', e.target.value)
                      }}
                      disabled={!selectedEtapaEnsinoId}
                    >
                      <option value="">
                        {selectedEtapaEnsinoId ? "Selecione..." : "Selecione primeiro a Etapa de Ensino"}
                      </option>
                      {availableSeriesAnos.map((serieAno) => (
                        <option key={serieAno.id} value={serieAno.id}>
                          {serieAno.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    Série ou ano escolar da turma
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo legado gradeId - mantido para compatibilidade, mas oculto */}
            <FormField
              control={form.control}
              name="gradeId"
              render={() => <></>}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="operatingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Funcionamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 07:00 - 12:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minStudents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mínimo de Alunos</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade Máxima de Alunos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Número máximo de alunos que a turma pode comportar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="educationModality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidade de Ensino</FormLabel>
                    <FormControl>
                      <select
                        className={selectClassName}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        <option value="Regular">Ensino Regular</option>
                        <option value="EJA">EJA - Educação de Jovens e Adultos</option>
                        <option value="Especial">Educação Especial</option>
                        <option value="Integral">Tempo Integral</option>
                        <option value="Tecnico">Ensino Técnico</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Modalidade conforme Censo Escolar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo adicional do Censo Escolar */}
            <FormField
              control={form.control}
              name="tipoRegime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Regime</FormLabel>
                  <FormControl>
                    <select
                      className={selectClassName}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="Seriado">Seriado</option>
                      <option value="Nao Seriado">Não Seriado</option>
                    </select>
                  </FormControl>
                  <FormDescription>
                    Tipo de regime da turma conforme Censo Escolar
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="regentTeacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professor Regente</FormLabel>
                  <FormControl>
                    <select
                      className={selectClassName}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="">Selecione o professor regente (opcional)</option>
                      {teachers
                        .filter((t) => {
                          if (!t || !t.person) return false
                          return t.employment_status === 'active'
                        })
                        .map((teacher) => {
                          const teacherName = teacher.person
                            ? `${teacher.person.first_name} ${teacher.person.last_name}`
                            : 'Professor'
                          return (
                            <option key={teacher.id} value={teacher.id.toString()}>
                              {teacherName}
                            </option>
                          )
                        })}
                    </select>
                  </FormControl>
                  <FormDescription>
                    Professor responsável pela turma (opcional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border rounded-md p-4 bg-secondary/10">
              <h4 className="font-medium text-sm mb-3">
                Critérios de Dependência
              </h4>
              <FormField
                control={form.control}
                name="maxDependencySubjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de Disciplinas em Dependência</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormDescription>
                      Número máximo de disciplinas reprovadas que o aluno pode
                      levar para o próximo ano.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="operatingDays"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">
                      Dias de Funcionamento
                    </FormLabel>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {daysOfWeek.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="operatingDays"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...(field.value || []),
                                          item.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id,
                                          ),
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
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
              <Button type="submit">Salvar Turma</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
