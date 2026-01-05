import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Save, BookOpen, Link as LinkIcon, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useLessonStore } from '@/stores/useLessonStore.supabase'
import useUserStore from '@/stores/useUserStore'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { useAcademicYearStore } from '@/stores/useAcademicYearStore.supabase'
import { classService } from '@/lib/supabase/services'
import { toast } from 'sonner'
import { RequirePermission } from '@/components/RequirePermission'

const planSchema = z.object({
  schoolId: z.string().min(1, 'Escola é obrigatória'),
  yearId: z.string().min(1, 'Ano Letivo é obrigatório'),
  classroomId: z.string().min(1, 'Turma é obrigatória'),
  subjectId: z.string().min(1, 'Disciplina é obrigatória'),
  topic: z.string().min(3, 'Tema é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  objectives: z.string().min(10, 'Objetivos são obrigatórios'),
  methodology: z.string().min(10, 'Metodologia é obrigatória'),
  resources: z.string().optional(),
  evaluation: z.string().optional(),
})

export default function LessonPlanning() {
  const { lessons, loading: lessonsLoading, fetchLessons, addLesson } = useLessonStore()
  const { currentUser } = useUserStore()
  const { schools, loading: schoolsLoading, fetchSchools } = useSchoolStore()
  const { courses, loading: coursesLoading, fetchCourses } = useCourseStore()
  const { academicYears, loading: yearsLoading, fetchAcademicYears } = useAcademicYearStore()

  const [open, setOpen] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<any[]>([])

  useEffect(() => {
    fetchSchools()
    fetchCourses()
    fetchAcademicYears()
    fetchLessons()
  }, [fetchSchools, fetchCourses, fetchAcademicYears, fetchLessons])

  const form = useForm<z.infer<typeof planSchema>>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      topic: '',
      date: new Date().toISOString().split('T')[0],
      objectives: '',
      methodology: '',
      resources: '',
      evaluation: '',
    },
  })

  // Watch fields for dynamic selection
  const selectedSchoolId = form.watch('schoolId')
  const selectedYearId = form.watch('yearId')
  const selectedClassId = form.watch('classroomId')

  // Dynamic Options
  const safeSchools = Array.isArray(schools) ? schools : []
  const safeAcademicYears = Array.isArray(academicYears) ? academicYears : []

  // Buscar turmas quando escola e ano são selecionados
  useEffect(() => {
    const fetchClasses = async () => {
      if (selectedSchoolId && selectedYearId) {
        try {
          const classes = await classService.getBySchool(parseInt(selectedSchoolId))
          setAvailableClasses(classes || [])
        } catch {
          setAvailableClasses([])
        }
      } else {
        setAvailableClasses([])
      }
    }
    fetchClasses()
  }, [selectedSchoolId, selectedYearId])

  // Buscar disciplinas quando turma é selecionada
  const availableSubjects = useMemo(() => {
    if (!selectedClassId) return []
    const selectedClass = availableClasses.find((c) => c.id.toString() === selectedClassId)
    if (!selectedClass) return []
    
    // TODO: Buscar disciplinas da turma quando implementado
    // Por enquanto, retornar array vazio
    return []
  }, [selectedClassId, availableClasses])

  // Filter plans for current user
  const safeLessons = Array.isArray(lessons) ? lessons : []
  const myPlans = useMemo(() => {
    if (!currentUser) return []
    // Admin sees all
    if (currentUser.role === 'admin') return safeLessons
    // Teachers see their own
    return safeLessons.filter((p) => p.teacher_id === currentUser.id)
  }, [safeLessons, currentUser])

  const onSubmit = async (values: z.infer<typeof planSchema>) => {
    if (!currentUser) {
      toast.error('Usuário não identificado.')
      return
    }

    try {
      await addLesson({
        class_id: parseInt(values.classroomId),
        subject_id: parseInt(values.subjectId),
        teacher_id: currentUser.id,
        lesson_date: values.date,
        topic: values.topic,
        objectives: values.objectives,
        methodology: values.methodology,
        resources: values.resources || null,
        evaluation: values.evaluation || null,
        status: 'draft',
      })
      setOpen(false)
      form.reset()
      toast.success('Plano de aula criado com sucesso.')
      fetchLessons()
    } catch {
      toast.error('Erro ao criar plano de aula.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <BookOpen className="h-8 w-8" /> Planejamento de Aulas
          </h1>
          <p className="text-muted-foreground">
            Crie, organize e compartilhe seus planos de ensino.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <RequirePermission permission="create:assessment">
              <Button
                className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
              >
                <div className="p-1 rounded-md bg-white/20 mr-2">
                  <Plus className="h-5 w-5" />
                </div>
                Novo Plano de Aula
              </Button>
            </RequirePermission>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Plano de Aula</DialogTitle>
              <DialogDescription>
                Defina o contexto, objetivos e metodologia para sua aula.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Context Selection Row */}
                <div className="grid gap-4 md:grid-cols-2">
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
                            form.setValue('classroomId', '')
                            form.setValue('subjectId', '')
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a escola" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {safeSchools.map((s) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
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
                          onValueChange={(val) => {
                            field.onChange(val)
                            form.setValue('classroomId', '')
                            form.setValue('subjectId', '')
                          }}
                          value={field.value}
                          disabled={!selectedSchoolId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o ano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {safeAcademicYears.map((y) => (
                              <SelectItem key={y.id} value={y.id.toString()}>
                                {y.name}
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
                    name="classroomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turma</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val)
                            form.setValue('subjectId', '')
                          }}
                          value={field.value}
                          disabled={!selectedYearId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a turma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableClasses.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name}
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
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disciplina</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedClassId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a disciplina" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableSubjects.map((s) => (
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
                </div>

                <div className="border-t my-2" />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tema da Aula</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: Introdução à Álgebra"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Prevista</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="objectives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivos de Aprendizagem</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="h-24"
                          placeholder="O que o aluno deve aprender?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="methodology"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metodologia / Estratégias</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="h-24"
                          placeholder="Como a aula será conduzida?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="resources"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recursos Didáticos</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Livro, vídeo, slide..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="evaluation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avaliação</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Como será avaliado?" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
                  >
                    <div className="p-1 rounded-md bg-white/20 mr-2">
                      <Save className="h-5 w-5" />
                    </div>
                    Salvar Plano
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {myPlans.length > 0 ? (
          myPlans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge
                    variant={
                      plan.status === 'approved' ? 'default' : 'secondary'
                    }
                    className="mb-2"
                  >
                    {plan.status === 'approved'
                      ? 'Aprovado'
                      : plan.status === 'submitted'
                        ? 'Enviado'
                        : 'Rascunho'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(plan.date).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="line-clamp-1">{plan.topic}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {plan.objectives}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="truncate">
                      Metodologia: {plan.methodology}
                    </span>
                  </div>
                  {plan.attachments && plan.attachments.length > 0 && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <LinkIcon className="h-4 w-4" />
                      <span>{plan.attachments.length} anexo(s)</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full">
                  Ver Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            Você ainda não possui planos de aula cadastrados.
          </div>
        )}
      </div>
    </div>
  )
}
