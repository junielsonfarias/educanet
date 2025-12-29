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
import { Appointment, AppointmentType } from '@/lib/mock-data'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'

const appointmentSchema = z.object({
  type: z.enum(['matricula', 'documentos', 'informacoes', 'reuniao', 'outros']),
  requesterName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  requesterPhone: z.string().min(8, 'Telefone inválido'),
  requesterEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  studentId: z.string().optional(),
  schoolId: z.string().min(1, 'Selecione uma escola'),
  dateTime: z.string().min(1, 'Data e hora são obrigatórias'),
  duration: z.coerce.number().min(15, 'Duração mínima de 15 minutos'),
  notes: z.string().optional(),
})

interface AppointmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Omit<Appointment, 'id' | 'status' | 'confirmedAt' | 'reminderSent'>) => void
  initialData?: Appointment | null
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: AppointmentFormDialogProps) {
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: 'informacoes',
      requesterName: '',
      requesterPhone: '',
      requesterEmail: '',
      studentId: '',
      schoolId: '',
      dateTime: '',
      duration: 30,
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        const dateTime = new Date(initialData.dateTime)
        const localDateTime = new Date(dateTime.getTime() - dateTime.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)

        form.reset({
          type: initialData.type,
          requesterName: initialData.requesterName,
          requesterPhone: initialData.requesterPhone,
          requesterEmail: initialData.requesterEmail || '',
          studentId: initialData.studentId || '',
          schoolId: initialData.schoolId,
          dateTime: localDateTime,
          duration: initialData.duration || 30,
          notes: initialData.notes || '',
        })
      } else {
        // Data padrão: hoje às 14:00
        const defaultDate = new Date()
        defaultDate.setHours(14, 0, 0, 0)
        const localDateTime = new Date(
          defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16)

        form.reset({
          type: 'informacoes',
          requesterName: '',
          requesterPhone: '',
          requesterEmail: '',
          studentId: '',
          schoolId: '',
          dateTime: localDateTime,
          duration: 30,
          notes: '',
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const handleSubmit = (data: z.infer<typeof appointmentSchema>) => {
    // Converter data/hora local para ISO string
    const dateTime = new Date(data.dateTime)
    const isoDateTime = dateTime.toISOString()

    onSave({
      type: data.type,
      requesterName: data.requesterName,
      requesterPhone: data.requesterPhone,
      requesterEmail: data.requesterEmail || undefined,
      studentId: data.studentId && data.studentId !== 'none' ? data.studentId : undefined,
      schoolId: data.schoolId,
      dateTime: isoDateTime,
      duration: data.duration,
      notes: data.notes || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize os dados do agendamento.'
              : 'Crie um novo agendamento de atendimento.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Atendimento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="matricula">Matrícula</SelectItem>
                        <SelectItem value="documentos">Documentos</SelectItem>
                        <SelectItem value="informacoes">Informações</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="schoolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escola *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aluno (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum aluno</SelectItem>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} - {student.registration}
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
                name="requesterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Solicitante *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requesterPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requesterEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Hora *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre o agendamento..."
                      className="min-h-[100px]"
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
              <Button type="submit">Salvar Agendamento</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

