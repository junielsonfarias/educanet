import { useEffect, useState, useMemo } from 'react'
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
import useCouncilStore from '@/stores/useCouncilStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useUserStore from '@/stores/useUserStore'

const councilSchema = z.object({
  schoolId: z.string().min(1, 'Escola é obrigatória'),
  academicYearId: z.string().min(1, 'Ano letivo é obrigatório'),
  classroomId: z.string().min(1, 'Turma é obrigatória'),
  date: z.date({ required_error: 'Data é obrigatória' }),
  periodId: z.string().min(1, 'Período é obrigatório'),
  type: z.enum(['bimestral', 'final', 'extraordinary']),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  generalObservations: z.string().optional(),
})

interface CouncilFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  councilId?: string | null
  onSuccess: () => void
}

export function CouncilFormDialog({
  open,
  onOpenChange,
  councilId,
  onSuccess,
}: CouncilFormDialogProps) {
  const { councils, addCouncil, updateCouncil, getCouncil } = useCouncilStore()
  const { schools } = useSchoolStore()
  const { currentUser } = useUserStore()
  const { toast } = useToast()

  const editingCouncil = councilId ? getCouncil(councilId) : null

  const form = useForm<z.infer<typeof councilSchema>>({
    resolver: zodResolver(councilSchema),
    defaultValues: {
      schoolId: '',
      academicYearId: '',
      classroomId: '',
      date: new Date(),
      periodId: '',
      type: 'bimestral',
      status: 'scheduled',
      generalObservations: '',
    },
  })

  const schoolId = form.watch('schoolId')
  const academicYearId = form.watch('academicYearId')

  const selectedSchool = schools.find((s) => s.id === schoolId)
  const selectedYear = selectedSchool?.academicYears.find((y) => y.id === academicYearId)
  const availableClassrooms = selectedYear?.turmas || []
  const availablePeriods = selectedYear?.periods || []

  useEffect(() => {
    if (open) {
      if (editingCouncil) {
        form.reset({
          schoolId: editingCouncil.schoolId,
          academicYearId: editingCouncil.academicYearId,
          classroomId: editingCouncil.classroomId,
          date: new Date(editingCouncil.date),
          periodId: editingCouncil.periodId,
          type: editingCouncil.type,
          status: editingCouncil.status,
          generalObservations: editingCouncil.generalObservations,
        })
      } else {
        form.reset({
          schoolId: '',
          academicYearId: '',
          classroomId: '',
          date: new Date(),
          periodId: '',
          type: 'bimestral',
          status: 'scheduled',
          generalObservations: '',
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingCouncil?.id])

  const handleSubmit = (data: z.infer<typeof councilSchema>) => {
    if (editingCouncil) {
      updateCouncil(editingCouncil.id, {
        ...data,
        date: data.date.toISOString(),
      })
      toast({
        title: 'Conselho atualizado',
        description: 'O conselho de classe foi atualizado com sucesso.',
      })
    } else {
      const selectedClassroom = availableClassrooms.find((c) => c.id === data.classroomId)
      const selectedPeriod = availablePeriods.find((p) => p.id === data.periodId)

      addCouncil({
        schoolId: data.schoolId,
        academicYearId: data.academicYearId,
        classroomId: data.classroomId,
        classroomName: selectedClassroom?.name || '',
        date: data.date.toISOString(),
        periodId: data.periodId,
        periodName: selectedPeriod?.name || '',
        type: data.type,
        status: data.status,
        members: [],
        studentsAnalysis: [],
        generalObservations: data.generalObservations || '',
        decisions: [],
        minutes: '',
        createdBy: currentUser?.id || 'system',
      })
      toast({
        title: 'Conselho criado',
        description: 'O conselho de classe foi criado com sucesso.',
      })
    }
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCouncil ? 'Editar Conselho de Classe' : 'Novo Conselho de Classe'}
          </DialogTitle>
          <DialogDescription>
            {editingCouncil
              ? 'Atualize as informações do conselho de classe.'
              : 'Crie um novo conselho de classe para uma turma.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="schoolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escola</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a escola" />
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
              name="academicYearId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano Letivo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!schoolId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano letivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedSchool?.academicYears.map((year) => (
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

            <FormField
              control={form.control}
              name="classroomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!academicYearId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!academicYearId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availablePeriods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
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
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bimestral">Bimestral</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="extraordinary">Extraordinário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Conselho</FormLabel>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="generalObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Gerais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre o conselho..."
                      {...field}
                      rows={3}
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
                {editingCouncil ? 'Atualizar' : 'Criar'} Conselho
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

