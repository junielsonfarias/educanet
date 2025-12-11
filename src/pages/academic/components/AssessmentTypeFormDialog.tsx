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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { AssessmentType } from '@/lib/mock-data'
import useCourseStore from '@/stores/useCourseStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'

const typeSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  applicableGradeIds: z
    .array(z.string())
    .min(1, 'Selecione pelo menos uma série'),
  excludeFromAverage: z.boolean().default(false),
})

interface AssessmentTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: AssessmentType | null
}

export function AssessmentTypeFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: AssessmentTypeFormDialogProps) {
  const { courses } = useCourseStore()

  const form = useForm<z.infer<typeof typeSchema>>({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      name: '',
      description: '',
      applicableGradeIds: [],
      excludeFromAverage: false,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          description: initialData.description || '',
          applicableGradeIds: initialData.applicableGradeIds,
          excludeFromAverage: initialData.excludeFromAverage,
        })
      } else {
        form.reset({
          name: '',
          description: '',
          applicableGradeIds: [],
          excludeFromAverage: false,
        })
      }
    }
  }, [open, initialData, form])

  const handleSubmit = (data: z.infer<typeof typeSchema>) => {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? 'Editar Tipo de Avaliação'
              : 'Novo Tipo de Avaliação'}
          </DialogTitle>
          <DialogDescription>
            Defina o nome e as regras de aplicação para este tipo de avaliação.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Avaliação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Prova Mensal" {...field} />
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
                      placeholder="Descreva o propósito deste tipo de avaliação..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excludeFromAverage"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Não considerar no cálculo da média do aluno
                    </FormLabel>
                    <FormDescription>
                      As notas deste tipo serão registradas mas não afetarão a
                      média final.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applicableGradeIds"
              render={() => (
                <FormItem>
                  <FormLabel>Séries Aplicáveis</FormLabel>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/10">
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div key={course.id}>
                          <h4 className="mb-2 text-sm font-semibold leading-none tracking-tight text-primary">
                            {course.name}
                          </h4>
                          <div className="grid grid-cols-1 gap-2 pl-2 border-l-2 border-primary/20 ml-1">
                            {course.grades.length === 0 ? (
                              <p className="text-xs text-muted-foreground pl-2">
                                Nenhuma série cadastrada.
                              </p>
                            ) : (
                              course.grades.map((grade) => (
                                <FormField
                                  key={grade.id}
                                  control={form.control}
                                  name="applicableGradeIds"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={grade.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(
                                              grade.id,
                                            )}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([
                                                    ...field.value,
                                                    grade.id,
                                                  ])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) =>
                                                        value !== grade.id,
                                                    ),
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <Label className="font-normal cursor-pointer">
                                          {grade.name}
                                        </Label>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
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
