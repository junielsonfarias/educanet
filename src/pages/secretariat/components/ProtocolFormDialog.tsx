import { useEffect, useState } from 'react'
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
import { Protocol, ProtocolType, ProtocolPriority } from '@/lib/mock-data'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'

const protocolSchema = z.object({
  type: z.enum(['matricula', 'transferencia', 'declaracao', 'recurso', 'outros']),
  requesterName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  requesterCpf: z.string().min(11, 'CPF inválido'),
  requesterPhone: z.string().min(8, 'Telefone inválido'),
  requesterEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  requesterRelationship: z.enum(['pai', 'mae', 'responsavel', 'aluno', 'outro']),
  studentId: z.string().optional(),
  schoolId: z.string().min(1, 'Selecione uma escola'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  priority: z.enum(['normal', 'preferential', 'urgent']),
})

interface ProtocolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Omit<Protocol, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'status' | 'history' | 'documents'>) => void
  initialData?: Protocol | null
}

export function ProtocolFormDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: ProtocolFormDialogProps) {
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const [selectedStudent, setSelectedStudent] = useState<string>('')

  const form = useForm<z.infer<typeof protocolSchema>>({
    resolver: zodResolver(protocolSchema),
    defaultValues: {
      type: 'outros',
      requesterName: '',
      requesterCpf: '',
      requesterPhone: '',
      requesterEmail: '',
      requesterRelationship: 'responsavel',
      studentId: '',
      schoolId: '',
      description: '',
      priority: 'normal',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          type: initialData.type,
          requesterName: initialData.requester.name,
          requesterCpf: initialData.requester.cpf,
          requesterPhone: initialData.requester.phone,
          requesterEmail: initialData.requester.email || '',
          requesterRelationship: initialData.requester.relationship,
          studentId: initialData.studentId || '',
          schoolId: initialData.schoolId,
          description: initialData.description,
          priority: initialData.priority,
        })
        setSelectedStudent(initialData.studentId || '')
      } else {
        form.reset({
          type: 'outros',
          requesterName: '',
          requesterCpf: '',
          requesterPhone: '',
          requesterEmail: '',
          requesterRelationship: 'responsavel',
          studentId: '',
          schoolId: '',
          description: '',
          priority: 'normal',
        })
          setSelectedStudent('')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const handleSubmit = (data: z.infer<typeof protocolSchema>) => {
    onSave({
      type: data.type,
      requester: {
        name: data.requesterName,
        cpf: data.requesterCpf,
        phone: data.requesterPhone,
        email: data.requesterEmail || undefined,
        relationship: data.requesterRelationship,
      },
      studentId: data.studentId && data.studentId !== 'none' ? data.studentId : undefined,
      schoolId: data.schoolId,
      description: data.description,
      priority: data.priority,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Protocolo' : 'Novo Protocolo'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize os dados do protocolo.'
              : 'Registre um novo protocolo de solicitação de documento ou serviço.'}
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
                    <FormLabel>Tipo de Protocolo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="matricula">Matrícula</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="declaracao">Declaração</SelectItem>
                        <SelectItem value="recurso">Recurso</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="preferential">Preferencial</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedStudent(value)
                    }}
                    defaultValue={field.value}
                  >
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

            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-semibold">Dados do Solicitante</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requesterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do solicitante" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requesterCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
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

                <FormField
                  control={form.control}
                  name="requesterEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requesterRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parentesco *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pai">Pai</SelectItem>
                          <SelectItem value="mae">Mãe</SelectItem>
                          <SelectItem value="responsavel">Responsável</SelectItem>
                          <SelectItem value="aluno">Aluno</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Solicitação *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhadamente a solicitação..."
                      className="min-h-[120px]"
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
              <Button type="submit">Salvar Protocolo</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

