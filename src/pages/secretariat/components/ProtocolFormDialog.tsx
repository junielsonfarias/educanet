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
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { personService } from '@/lib/supabase/services'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type ProtocolRow = Database['public']['Tables']['secretariat_protocols']['Row']

const protocolSchema = z.object({
  request_type: z.enum(['matricula', 'transferencia', 'declaracao', 'recurso', 'outros']),
  requester_person_id: z.string().min(1, 'Selecione ou cadastre o solicitante'),
  student_profile_id: z.string().optional(),
  school_id: z.string().min(1, 'Selecione uma escola'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  priority: z.enum(['normal', 'preferential', 'urgent']),
  // Campos para criar pessoa se não existir
  requesterName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  requesterCpf: z.string().min(11, 'CPF inválido').optional(),
  requesterPhone: z.string().min(8, 'Telefone inválido').optional(),
  requesterEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
})

interface ProtocolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    requester_person_id: number
    request_type: string
    description: string
    priority: string
    student_profile_id?: number
    school_id?: number
  }) => void
  initialData?: ProtocolRow | null
}

export function ProtocolFormDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: ProtocolFormDialogProps) {
  const { students, fetchStudents } = useStudentStore()
  const { schools, fetchSchools } = useSchoolStore()
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [createNewPerson, setCreateNewPerson] = useState(false)

  const form = useForm<z.infer<typeof protocolSchema>>({
    resolver: zodResolver(protocolSchema),
    defaultValues: {
      request_type: 'outros',
      requester_person_id: '',
      student_profile_id: '',
      school_id: '',
      description: '',
      priority: 'normal',
      requesterName: '',
      requesterCpf: '',
      requesterPhone: '',
      requesterEmail: '',
    },
  })

  useEffect(() => {
    if (open) {
      fetchStudents()
      fetchSchools()
    }
  }, [open, fetchStudents, fetchSchools])

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          request_type: (initialData.request_type as any) || 'outros',
          requester_person_id: initialData.requester_person_id?.toString() || '',
          student_profile_id: (initialData as any).student_profile_id?.toString() || '',
          school_id: (initialData as any).school_id?.toString() || '',
          description: initialData.description || '',
          priority: (initialData.priority as any) || 'normal',
          requesterName: (initialData as any).requester?.first_name || '',
          requesterCpf: (initialData as any).requester?.cpf || '',
          requesterPhone: (initialData as any).requester?.phone || '',
          requesterEmail: (initialData as any).requester?.email || '',
        })
        setSelectedStudent((initialData as any).student_profile_id?.toString() || '')
        setCreateNewPerson(false)
      } else {
        form.reset({
          request_type: 'outros',
          requester_person_id: '',
          student_profile_id: '',
          school_id: '',
          description: '',
          priority: 'normal',
          requesterName: '',
          requesterCpf: '',
          requesterPhone: '',
          requesterEmail: '',
        })
        setSelectedStudent('')
        setCreateNewPerson(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const handleSubmit = async (data: z.infer<typeof protocolSchema>) => {
    try {
      let requesterPersonId: number

      if (createNewPerson && data.requesterName && data.requesterCpf) {
        // Criar nova pessoa
        // Buscar usuário atual para created_by
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')
        
        // Buscar person_id do usuário
        const { data: authUser } = await supabase
          .from('auth_users')
          .select('person_id')
          .eq('id', user.id)
          .single()
        
        const createdBy = authUser?.person_id || 1 // Fallback para 1 se não encontrar
        
        const newPerson = await personService.create({
          first_name: data.requesterName.split(' ')[0] || '',
          last_name: data.requesterName.split(' ').slice(1).join(' ') || '',
          date_of_birth: new Date().toISOString().split('T')[0], // Data padrão, pode ser ajustada
          cpf: data.requesterCpf,
          phone: data.requesterPhone || null,
          email: data.requesterEmail || null,
          type: 'Funcionario' as const, // Tipo padrão para solicitantes externos
          created_by: createdBy,
        })
        if (!newPerson?.id) throw new Error('Erro ao criar pessoa')
        requesterPersonId = newPerson.id
      } else {
        requesterPersonId = parseInt(data.requester_person_id)
      }

      onSave({
        requester_person_id: requesterPersonId,
        request_type: data.request_type,
        description: data.description,
        priority: data.priority,
        student_profile_id: data.student_profile_id && data.student_profile_id !== 'none' 
          ? parseInt(data.student_profile_id) 
          : undefined,
        school_id: data.school_id ? parseInt(data.school_id) : undefined,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar protocolo:', error)
      form.setError('requester_person_id', { message: 'Erro ao processar solicitante' })
    }
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
                name="request_type"
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
              name="school_id"
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
                        <SelectItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Dados do Solicitante</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateNewPerson(!createNewPerson)}
                >
                  {createNewPerson ? 'Usar pessoa existente' : 'Cadastrar nova pessoa'}
                </Button>
              </div>

              {!createNewPerson ? (
                <FormField
                  control={form.control}
                  name="requester_person_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pessoa Solicitante *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione ou cadastre o solicitante" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Selecione uma pessoa</SelectItem>
                          {/* TODO: Buscar pessoas do banco via personService */}
                          <SelectItem value="new">Cadastrar nova pessoa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

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

