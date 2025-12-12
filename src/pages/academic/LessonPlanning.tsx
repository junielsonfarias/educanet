import { useState } from 'react'
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
import useLessonPlanStore from '@/stores/useLessonPlanStore'
import useUserStore from '@/stores/useUserStore'
import useCourseStore from '@/stores/useCourseStore'
import { useToast } from '@/hooks/use-toast'

const planSchema = z.object({
  topic: z.string().min(3, 'Tema é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  objectives: z.string().min(10, 'Objetivos são obrigatórios'),
  methodology: z.string().min(10, 'Metodologia é obrigatória'),
  resources: z.string().optional(),
  evaluation: z.string().optional(),
})

export default function LessonPlanning() {
  const { lessonPlans, addLessonPlan } = useLessonPlanStore()
  const { currentUser } = useUserStore()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)

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

  // Mock filtering for current user context
  const myPlans = lessonPlans // In real app filter by teacher ID

  const onSubmit = (values: z.infer<typeof planSchema>) => {
    addLessonPlan({
      ...values,
      teacherId: currentUser?.id || 'unknown',
      schoolId: '1', // Mocked context
      yearId: 'y2024',
      classroomId: 'cl1',
      subjectId: 's1',
      status: 'draft',
      attachments: [],
    })
    setOpen(false)
    form.reset()
    toast({
      title: 'Plano Salvo',
      description: 'O plano de aula foi criado como rascunho.',
    })
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
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Plano de Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Plano de Aula</DialogTitle>
              <DialogDescription>
                Defina os objetivos e metodologia para sua aula.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" /> Salvar Plano
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {myPlans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge
                  variant={plan.status === 'approved' ? 'default' : 'secondary'}
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
        ))}
      </div>
    </div>
  )
}
