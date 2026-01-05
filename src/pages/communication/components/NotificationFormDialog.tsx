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
import { Textarea } from '@/components/ui/textarea'
import { useNotificationStore } from '@/stores/useNotificationStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import type { Database } from '@/lib/supabase/database.types'

type CommunicationRow = Database['public']['Tables']['communications']['Row']

const notificationSchema = z.object({
  channel: z.enum(['email', 'sms', 'push']),
  recipientId: z.string().min(1, 'Selecione um destinatário'),
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  templateId: z.string().optional(),
})

interface NotificationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    recipient_person_id: number;
    channel: string;
    subject: string;
    content: string;
    priority?: string;
    status?: string;
  }) => void
  initialData?: CommunicationRow | null
}

export function NotificationFormDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: NotificationFormDialogProps) {
  const { students, fetchStudents } = useStudentStore()
  
  // Templates ainda não implementados no Supabase
  const templates: any[] = []

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      channel: 'email',
      recipientId: '',
      subject: '',
      content: '',
      templateId: '',
    },
  })

  useEffect(() => {
    if (open) {
      fetchStudents()
      if (initialData) {
        // Extrair recipient_person_id do initialData (pode estar em recipients ou outro campo)
        const recipientId = (initialData as any).recipient_person_id || 
                           (initialData as any).recipients?.[0]?.person_id || 
                           ''
        form.reset({
          channel: (initialData as any).channel || initialData.communication_type || 'email',
          recipientId: recipientId.toString(),
          subject: initialData.title || (initialData as any).subject || '',
          content: initialData.content || '',
          templateId: '',
        })
      } else {
        form.reset({
          channel: 'email',
          recipientId: '',
          subject: '',
          content: '',
          templateId: '',
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id, fetchStudents])

  const selectedTemplate = form.watch('templateId')
  const selectedChannel = form.watch('channel')

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate)
      if (template) {
        form.setValue('subject', template.subject)
        form.setValue('content', template.content)
        form.setValue('channel', template.channel)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate])

  const handleSubmit = (data: z.infer<typeof notificationSchema>) => {
    const student = students.find((s) => s.id.toString() === data.recipientId)
    if (!student) {
      form.setError('recipientId', { message: 'Aluno não encontrado' })
      return
    }

    // Obter person_id do student_profile
    const personId = student.person_id || student.person?.id
    if (!personId) {
      form.setError('recipientId', { message: 'ID da pessoa não encontrado' })
      return
    }

    onSave({
      recipient_person_id: typeof personId === 'number' ? personId : parseInt(personId.toString()),
      channel: data.channel,
      subject: data.subject,
      content: data.content,
      priority: 'normal',
      status: initialData ? (initialData as any).status : 'pending',
    })
    onOpenChange(false)
  }

  const availableTemplates = templates.filter((t) => t.channel === selectedChannel)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Notificação' : 'Nova Notificação'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize os dados da notificação.'
              : 'Crie uma nova notificação para enviar a responsáveis ou alunos.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal de Comunicação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o canal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Notificação Push</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={availableTemplates.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum template</SelectItem>
                      {availableTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
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
              name="recipientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinatário</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => {
                        const fullName = `${student.person?.first_name || ''} ${student.person?.last_name || ''}`.trim()
                        return (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {fullName} - {student.registration_number || student.id}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Assunto da notificação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Conteúdo da notificação..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
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

