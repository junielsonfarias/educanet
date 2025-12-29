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
import { NotificationTemplate } from '@/lib/mock-data'

const templateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  channel: z.enum(['email', 'sms', 'push']),
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  variables: z.array(z.string()).optional(),
})

interface TemplateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Omit<NotificationTemplate, 'id'>) => void
  initialData?: NotificationTemplate | null
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: TemplateFormDialogProps) {
  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      channel: 'email',
      subject: '',
      content: '',
      variables: [],
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          channel: initialData.channel,
          subject: initialData.subject,
          content: initialData.content,
          variables: initialData.variables || [],
        })
      } else {
        form.reset({
          name: '',
          channel: 'email',
          subject: '',
          content: '',
          variables: [],
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const handleSubmit = (data: z.infer<typeof templateSchema>) => {
    onSave({
      name: data.name,
      channel: data.channel,
      subject: data.subject,
      content: data.content,
      variables: data.variables || [],
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Template' : 'Novo Template'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize os dados do template.'
              : 'Crie um template reutilizável para notificações.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Template</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Boletim Bimestral" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal</FormLabel>
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
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Assunto da notificação" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use variáveis como {'{nome}'}, {'{escola}'}, {'{data}'} para personalização.
                  </FormDescription>
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
                      placeholder="Conteúdo do template..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use variáveis como {'{nome}'}, {'{escola}'}, {'{nota}'}, {'{frequencia}'} para
                    personalização.
                  </FormDescription>
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

