import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import useTransferStore from '@/stores/useTransferStore'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import useUserStore from '@/stores/useUserStore'

const transferSchema = z.object({
  studentId: z.string().min(1, 'Aluno é obrigatório'),
  fromSchoolId: z.string().min(1, 'Escola de origem é obrigatória'),
  toSchoolId: z.string().optional(),
  toSchoolExternal: z.string().optional(),
  type: z.enum(['internal', 'external']),
  reason: z.string().min(5, 'Motivo é obrigatório'),
  transferDate: z.date({ required_error: 'Data é obrigatória' }),
  academicYearId: z.string().min(1, 'Ano letivo é obrigatório'),
  fromClassroomId: z.string().optional(),
  toClassroomId: z.string().optional(),
  transferHistory: z.boolean().default(true),
  transferAssessments: z.boolean().default(true),
  transferDocuments: z.boolean().default(true),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.type === 'internal') {
    return !!data.toSchoolId
  } else {
    return !!data.toSchoolExternal
  }
}, {
  message: 'Escola de destino é obrigatória',
  path: ['toSchoolId'],
})

interface TransferFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transferId?: string | null
  onSuccess: () => void
}

export function TransferFormDialog({
  open,
  onOpenChange,
  transferId,
  onSuccess,
}: TransferFormDialogProps) {
  const { transfers, addTransfer, updateTransfer, getTransfer } = useTransferStore()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const { currentUser } = useUserStore()
  const { toast } = useToast()

  const editingTransfer = transferId ? getTransfer(transferId) : null
  const [transferType, setTransferType] = useState<'internal' | 'external'>('internal')

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      studentId: '',
      fromSchoolId: '',
      toSchoolId: '',
      toSchoolExternal: '',
      type: 'internal',
      reason: '',
      transferDate: new Date(),
      academicYearId: '',
      fromClassroomId: '',
      toClassroomId: '',
      transferHistory: true,
      transferAssessments: true,
      transferDocuments: true,
      notes: '',
    },
  })

  const studentId = form.watch('studentId')
  const fromSchoolId = form.watch('fromSchoolId')
  const type = form.watch('type')

  const selectedStudent = students.find((s) => s.id === studentId)
  const selectedFromSchool = schools.find((s) => s.id === fromSchoolId)
  const availableToSchools = schools.filter((s) => s.id !== fromSchoolId && s.status === 'active')
  const activeYear = selectedFromSchool?.academicYears.find((y) => y.status === 'active')
  const availableClassrooms = activeYear?.turmas || []

  useEffect(() => {
    setTransferType(type)
  }, [type])

  useEffect(() => {
    if (open) {
      if (editingTransfer) {
        form.reset({
          studentId: editingTransfer.studentId,
          fromSchoolId: editingTransfer.fromSchoolId,
          toSchoolId: editingTransfer.toSchoolId || '',
          toSchoolExternal: editingTransfer.toSchoolExternal || '',
          type: editingTransfer.type,
          reason: editingTransfer.reason,
          transferDate: new Date(editingTransfer.transferDate),
          academicYearId: editingTransfer.academicYearId,
          fromClassroomId: editingTransfer.fromClassroomId || '',
          toClassroomId: editingTransfer.toClassroomId || '',
          transferHistory: editingTransfer.transferHistory,
          transferAssessments: editingTransfer.transferAssessments,
          transferDocuments: editingTransfer.transferDocuments,
          notes: editingTransfer.notes || '',
        })
        setTransferType(editingTransfer.type)
      } else {
        form.reset({
          studentId: '',
          fromSchoolId: '',
          toSchoolId: '',
          toSchoolExternal: '',
          type: 'internal',
          reason: '',
          transferDate: new Date(),
          academicYearId: activeYear?.id || '',
          fromClassroomId: '',
          toClassroomId: '',
          transferHistory: true,
          transferAssessments: true,
          transferDocuments: true,
          notes: '',
        })
        setTransferType('internal')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingTransfer?.id, activeYear?.id])

  const handleSubmit = (data: z.infer<typeof transferSchema>) => {
    if (editingTransfer) {
      updateTransfer(editingTransfer.id, {
        ...data,
        transferDate: data.transferDate.toISOString(),
      })
      toast({
        title: 'Transferência atualizada',
        description: 'A transferência foi atualizada com sucesso.',
      })
    } else {
      const student = students.find((s) => s.id === data.studentId)
      const fromSchool = schools.find((s) => s.id === data.fromSchoolId)
      const toSchool = data.toSchoolId ? schools.find((s) => s.id === data.toSchoolId) : undefined

      addTransfer({
        studentId: data.studentId,
        studentName: student?.name || '',
        fromSchoolId: data.fromSchoolId,
        fromSchoolName: fromSchool?.name || '',
        toSchoolId: data.toSchoolId,
        toSchoolName: toSchool?.name,
        toSchoolExternal: data.toSchoolExternal,
        type: data.type,
        reason: data.reason,
        transferDate: data.transferDate.toISOString(),
        academicYearId: data.academicYearId,
        fromClassroomId: data.fromClassroomId,
        toClassroomId: data.toClassroomId && data.toClassroomId !== 'none' ? data.toClassroomId : undefined,
        transferHistory: data.transferHistory,
        transferAssessments: data.transferAssessments,
        transferDocuments: data.transferDocuments,
        notes: data.notes,
        createdBy: currentUser?.id || 'system',
      })
      toast({
        title: 'Transferência criada',
        description: 'A transferência foi criada e a notificação será enviada automaticamente.',
      })
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTransfer ? 'Editar Transferência' : 'Nova Transferência'}
          </DialogTitle>
          <DialogDescription>
            {editingTransfer
              ? 'Atualize as informações da transferência.'
              : 'Crie uma nova transferência de aluno entre escolas.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aluno</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            <FormField
              control={form.control}
              name="fromSchoolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escola de Origem</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a escola de origem" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {schools
                        .filter((s) => s.status === 'active')
                        .map((school) => (
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Transferência</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value)
                        setTransferType(value as 'internal' | 'external')
                      }}
                      value={field.value}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="internal" id="internal" />
                        <Label htmlFor="internal">Interna (mesma rede)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="external" id="external" />
                        <Label htmlFor="external">Externa (outra rede)</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {transferType === 'internal' ? (
              <FormField
                control={form.control}
                name="toSchoolId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola de Destino</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a escola de destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableToSchools.map((school) => (
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
            ) : (
              <FormField
                control={form.control}
                name="toSchoolExternal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola de Destino (Externa)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome da escola de destino"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="academicYearId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano Letivo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!fromSchoolId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano letivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedFromSchool?.academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromClassroomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma de Origem (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!activeYear}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {availableClassrooms.map((classroom) => (
                          <SelectItem key={classroom.id} value={classroom.id}>
                            {classroom.name}
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
                name="toClassroomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma de Destino (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Turma de destino"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="transferDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Transferência</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Transferência</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo da transferência..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label>Opções de Transferência</Label>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="transferHistory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Transferir histórico completo</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transferAssessments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Transferir avaliações e notas</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transferDocuments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Transferir documentos escolares</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      {...field}
                      rows={2}
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
              <Button type="submit">
                {editingTransfer ? 'Atualizar' : 'Criar'} Transferência
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

