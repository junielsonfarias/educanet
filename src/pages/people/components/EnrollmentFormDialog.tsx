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
import { Button } from '@/components/ui/button'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'

const enrollmentSchema = z.object({
  schoolId: z.string().min(1, 'Escola é obrigatória'),
  yearId: z.string().min(1, 'Ano Letivo é obrigatório'),
  classId: z.string().min(1, 'Turma é obrigatória'),
  type: z.enum(['regular', 'dependency']),
  status: z.enum([
    'Cursando',
    'Aprovado',
    'Reprovado',
    'Transferido',
    'Abandono',
  ]),
  multiSeriesGradeId: z.string().optional(),
})

interface EnrollmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function EnrollmentFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: EnrollmentFormDialogProps) {
  const { schools } = useSchoolStore()
  const { courses } = useCourseStore()

  const form = useForm<z.infer<typeof enrollmentSchema>>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      schoolId: '',
      yearId: '',
      classId: '',
      type: 'regular',
      status: 'Cursando',
      multiSeriesGradeId: '',
    },
  })

  // Dependent dropdown logic
  const selectedSchoolId = form.watch('schoolId')
  const selectedYearId = form.watch('yearId')
  const selectedClassId = form.watch('classId')

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId)
  const academicYears = selectedSchool?.academicYears || []

  const selectedYear = academicYears.find((y) => y.id === selectedYearId)
  const classes = selectedYear?.classes || []

  const selectedClass = classes.find((c) => c.id === selectedClassId)
  const isMultiGrade = selectedClass?.isMultiGrade

  // Flatten grades for selection
  const flattenGrades = courses.flatMap((c) =>
    c.grades.map((g) => ({ ...g, courseName: c.name })),
  )

  const handleSubmit = (data: z.infer<typeof enrollmentSchema>) => {
    const selectedClass = classes.find((c) => c.id === data.classId)
    // Extract year number from name
    const yearName = selectedYear?.name || new Date().getFullYear().toString()
    const yearNumber = parseInt(yearName) || new Date().getFullYear()

    // Determine grade name: if multiseries, find selected grade name, else use class grade name
    let gradeName = selectedClass ? selectedClass.name : 'Turma Indefinida'
    if (isMultiGrade && data.multiSeriesGradeId) {
      const mg = flattenGrades.find((g) => g.id === data.multiSeriesGradeId)
      if (mg) gradeName = mg.name
    } else if (selectedClass?.gradeName) {
      gradeName = selectedClass.gradeName
    }

    onSubmit({
      schoolId: data.schoolId,
      year: yearNumber,
      grade: gradeName,
      type: data.type,
      status: data.status,
    })
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Matrícula</DialogTitle>
          <DialogDescription>
            Selecione a turma e o ano letivo para o aluno.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Matrícula</FormLabel>
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
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="dependency">Dependência</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Inicial</FormLabel>
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
                      <SelectItem value="Cursando">Cursando</SelectItem>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                      <SelectItem value="Reprovado">Reprovado</SelectItem>
                      <SelectItem value="Transferido">Transferido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schoolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escola</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue('yearId', '')
                      form.setValue('classId', '')
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a escola" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
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
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue('classId', '')
                    }}
                    defaultValue={field.value}
                    disabled={!selectedSchoolId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name} (
                          {year.status === 'active' ? 'Ativo' : year.status})
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
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!selectedYearId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.gradeName}) - {cls.shift}{' '}
                          {cls.isMultiGrade ? '(Multi)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isMultiGrade && (
              <FormField
                control={form.control}
                name="multiSeriesGradeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série do Aluno (Turma Multissérie)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a série específica" />
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
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Matricular</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
