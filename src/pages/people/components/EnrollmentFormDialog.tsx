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
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'
import { useEffect } from 'react'

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

  // Watch fields for reactivity
  const selectedSchoolId = form.watch('schoolId')
  const selectedYearId = form.watch('yearId')
  const selectedClassId = form.watch('classId')

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId)
  const academicYears = selectedSchool?.academicYears || []

  const selectedYear = academicYears.find((y) => y.id === selectedYearId)
  const classes = selectedYear?.classes || []

  const selectedClass = classes.find((c) => c.id === selectedClassId)
  const isMultiGrade = selectedClass?.isMultiGrade

  // Determine Grade and Shift to display
  const displayGrade = selectedClass?.gradeName || ''
  const displayShift = selectedClass?.shift || ''

  // Flatten grades for selection
  const flattenGrades = courses.flatMap((c) =>
    c.grades.map((g) => ({ ...g, courseName: c.name })),
  )

  // Reset downstream fields when upstream changes
  useEffect(() => {
    if (!selectedSchoolId) {
      form.setValue('yearId', '')
      form.setValue('classId', '')
    }
  }, [selectedSchoolId, form])

  useEffect(() => {
    if (!selectedYearId) {
      form.setValue('classId', '')
    }
  }, [selectedYearId, form])

  const handleSubmit = (data: z.infer<typeof enrollmentSchema>) => {
    const currentClass = classes.find((c) => c.id === data.classId)
    // Extract year number from name
    const yearName = selectedYear?.name || new Date().getFullYear().toString()
    const yearNumber = parseInt(yearName) || new Date().getFullYear()

    // Determine grade name
    let gradeName = currentClass ? currentClass.name : 'Turma Indefinida'
    if (isMultiGrade && data.multiSeriesGradeId) {
      const mg = flattenGrades.find((g) => g.id === data.multiSeriesGradeId)
      if (mg) gradeName = mg.name
    } else if (currentClass?.gradeName) {
      gradeName = currentClass.gradeName
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Matrícula</DialogTitle>
          <DialogDescription>
            Preencha os dados da matrícula do aluno.
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
                      onValueChange={field.onChange}
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
            </div>

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
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Read-only fields for Grade and Shift */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Série (Grade)</FormLabel>
                <Input
                  value={displayGrade}
                  disabled
                  placeholder="Selecione uma turma"
                  className="bg-muted/50"
                />
              </FormItem>
              <FormItem>
                <FormLabel>Turno</FormLabel>
                <Input
                  value={displayShift}
                  disabled
                  placeholder="Selecione uma turma"
                  className="bg-muted/50"
                />
              </FormItem>
            </div>

            {isMultiGrade && (
              <FormField
                control={form.control}
                name="multiSeriesGradeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série Específica (Multissérie)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a série do aluno" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Confirmar Matrícula</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
