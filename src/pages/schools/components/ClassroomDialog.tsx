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
import { Course, School } from '@/lib/mock-data'
import { useEffect } from 'react'

const classroomSchema = z.object({
  name: z.string().min(2, 'Nome da turma obrigatório'),
  acronym: z.string().optional(),
  shift: z.enum(['Matutino', 'Vespertino', 'Noturno', 'Integral']),
  gradeId: z.string().optional(),
  operatingHours: z.string().optional(),
  minStudents: z.coerce.number().min(0).optional(),
  maxDependencySubjects: z.coerce.number().min(0).optional(),
  operatingDays: z.array(z.string()).optional(),
  isMultiGrade: z.boolean().default(false),
  // Context fields for when created from list
  schoolId: z.string().optional(),
  yearId: z.string().optional(),
})

interface ClassroomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  courses: Course[]
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
  courses,
  schools,
  initialData,
}: ClassroomDialogProps) {
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
      schoolId: '',
      yearId: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          acronym: initialData.acronym || '',
          shift: initialData.shift,
          gradeId: initialData.gradeId || '',
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
          schoolId: initialData.schoolId || '',
          yearId: initialData.yearId || '',
        })
      } else {
        form.reset({
          name: '',
          acronym: '',
          shift: 'Matutino',
          gradeId: '',
          operatingHours: '',
          minStudents: 0,
          maxDependencySubjects: 0,
          operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
          isMultiGrade: false,
          schoolId: '',
          yearId: '',
        })
      }
    }
  }, [open, initialData, form])

  const flattenGrades = courses.flatMap((c) =>
    c.grades.map((g) => ({ ...g, courseName: c.name })),
  )

  const isMultiGrade = form.watch('isMultiGrade')
  const selectedSchoolId = form.watch('schoolId')
  const selectedSchool = schools?.find((s) => s.id === selectedSchoolId)
  const academicYears = selectedSchool?.academicYears || []

  const handleSubmit = (data: z.infer<typeof classroomSchema>) => {
    const selectedGrade = flattenGrades.find((g) => g.id === data.gradeId)
    onSubmit({
      ...data,
      gradeName: selectedGrade ? selectedGrade.name : 'Multissérie',
      studentCount: initialData?.studentCount || 0,
    })
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
                          {schools.map((s) => (
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
                          {academicYears.map((y) => (
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

            <FormField
              control={form.control}
              name="gradeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isMultiGrade
                      ? 'Série Principal (Referência)'
                      : 'Série/Ano'}
                  </FormLabel>
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
                      {flattenGrades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name} ({grade.courseName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
