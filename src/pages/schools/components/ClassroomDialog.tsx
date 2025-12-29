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
import { EtapaEnsino, School, SerieAno } from '@/lib/mock-data'
import { useEffect, useMemo } from 'react'
import useTeacherStore from '@/stores/useTeacherStore'
import { validateModalidadeCode, validateTipoRegimeCode } from '@/lib/validations'
import {
  safeArray,
  safeFind,
  safeMap,
  safeFlatMap,
} from '@/lib/array-utils'

const classroomSchema = z.object({
  name: z.string().min(2, 'Nome da turma obrigatório'),
  acronym: z.string().optional(),
  shift: z.enum(['Matutino', 'Vespertino', 'Noturno', 'Integral']),
  etapaEnsinoId: z.string().min(1, 'Etapa de Ensino obrigatória'), // NOVO: Campo obrigatório do Censo
  serieAnoId: z.string().optional(), // NOVO: Preferencial
  gradeId: z.string().optional(), // Mantido para compatibilidade
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
  // Context fields for when created from list
  schoolId: z.string().optional(),
  yearId: z.string().optional(),
})

interface ClassroomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  etapasEnsino: EtapaEnsino[]
  schools?: School[] // Optional, used when creating from ClassesList
  initialData?: any // For editing
}

const daysOfWeek = [
  { id: 'seg', label: 'Segunda' },
  { id: 'ter', label: 'Terça' },
  { id: 'qua', label: 'Quarta' },
  { id: 'qui', label: 'Quinta' },
  { id: 'sex', label: 'Sexta' },
  { id: 'sab', label: 'Sábado' },
]

export function ClassroomDialog({
  open,
  onOpenChange,
  onSubmit,
  etapasEnsino: etapasEnsinoProp,
  schools,
  initialData,
}: ClassroomDialogProps) {
  const { teachers } = useTeacherStore()
  
  const etapasEnsino = etapasEnsinoProp || []
  
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

  // Flatten seriesAnos from etapasEnsino com referência à etapa (memoizado para evitar recálculos)
  const flattenGrades = useMemo(
    () =>
      safeFlatMap(etapasEnsino, (etapa) =>
        safeMap(etapa.seriesAnos, (s: any) => ({
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
        // Tenta encontrar a etapa de ensino baseado no gradeId/serieAnoId
        const serieAnoId = initialData.serieAnoId || initialData.gradeId
        const etapaEnsinoIdFromSerieAno =
          serieAnoId && flattenGrades.length > 0
            ? flattenGrades.find((s) => s.id === serieAnoId)?.etapaEnsinoId || ''
            : ''

        form.reset({
          name: initialData.name,
          acronym: initialData.acronym || '',
          shift: initialData.shift,
          etapaEnsinoId: initialData.etapaEnsinoId || etapaEnsinoIdFromSerieAno,
          serieAnoId: initialData.serieAnoId || initialData.gradeId || '',
          gradeId: initialData.gradeId || initialData.serieAnoId || '',
          operatingHours: initialData.operatingHours || '',
          minStudents: initialData.minStudents || 0,
          maxDependencySubjects: initialData.maxDependencySubjects || 0,
          operatingDays: initialData.operatingDays || [
            'seg',
            'ter',
            'qua',
            'qui',
            'sex',
          ],
          isMultiGrade: initialData.isMultiGrade || false,
          maxCapacity: initialData.maxCapacity || 30,
          regentTeacherId: initialData.regentTeacherId || '',
          educationModality: initialData.educationModality || '',
          tipoRegime: initialData.tipoRegime || '',
          schoolId: initialData.schoolId || '',
          yearId: initialData.yearId || '',
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

  // Filtra séries/anos baseado na etapa de ensino selecionada (memoizado para evitar recálculos)
  const selectedEtapa = useMemo(
    () => safeFind(etapasEnsino, (e) => e.id === selectedEtapaEnsinoId),
    [etapasEnsino, selectedEtapaEnsinoId],
  )
  // Ordena séries/anos por número (campo numero) se disponível (memoizado)
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
    const selectedEtapa = safeFind(etapasEnsino, (e) => e.id === data.etapaEnsinoId)

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
      etapaEnsinoName: selectedEtapa ? selectedEtapa.name : '',
      etapaEnsinoCodigo: selectedEtapa ? selectedEtapa.codigoCenso : '',
      // Mantém campos legados para compatibilidade
      gradeId: serieAnoId || undefined,
      gradeName: selectedGrade ? selectedGrade.name : isMultiGrade ? 'Multissérie' : undefined,
      studentCount: initialData?.studentCount || 0,
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
                          {(schools || [])
                            .filter((s) => Boolean(s) && Boolean(s.id) && Boolean(s.name))
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!selectedSchoolId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears
                            .filter((y) => Boolean(y) && Boolean(y.id) && Boolean(y.name))
                            .map((y) => (
                              <SelectItem key={y.id} value={y.id}>
                                {y.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
                        <SelectItem value="Matutino">Matutino</SelectItem>
                        <SelectItem value="Vespertino">Vespertino</SelectItem>
                        <SelectItem value="Noturno">Noturno</SelectItem>
                        <SelectItem value="Integral">Integral</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Limpa a seleção de série/ano quando muda a etapa
                      form.setValue('serieAnoId', '')
                      form.setValue('gradeId', '')
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a Etapa de Ensino..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(etapasEnsino || [])
                        .filter((e) => Boolean(e) && Boolean(e.id) && Boolean(e.name))
                        .map((etapa) => (
                          <SelectItem key={etapa.id} value={etapa.id}>
                            {etapa.name} {etapa.codigoCenso && `(Código: ${etapa.codigoCenso})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Mantém compatibilidade com gradeId
                      form.setValue('gradeId', value)
                    }}
                    defaultValue={field.value || form.watch('gradeId')}
                    disabled={!selectedEtapaEnsinoId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedEtapaEnsinoId ? "Selecione..." : "Selecione primeiro a Etapa de Ensino"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableSeriesAnos.map((serieAno) => (
                        <SelectItem key={serieAno.id} value={serieAno.id}>
                          {serieAno.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        <SelectItem value="Regular">Ensino Regular</SelectItem>
                        <SelectItem value="EJA">EJA - Educação de Jovens e Adultos</SelectItem>
                        <SelectItem value="Especial">Educação Especial</SelectItem>
                        <SelectItem value="Integral">Tempo Integral</SelectItem>
                        <SelectItem value="Tecnico">Ensino Técnico</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <SelectItem value="Seriado">Seriado</SelectItem>
                      <SelectItem value="Nao Seriado">Não Seriado</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o professor regente (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(teachers || [])
                        .filter((t) => Boolean(t) && Boolean(t.id) && t.status === 'active')
                        .map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name} - {teacher.subject}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
