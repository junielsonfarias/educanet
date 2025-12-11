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
import { Student } from '@/lib/mock-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useSchoolStore from '@/stores/useSchoolStore'

const studentSchema = z.object({
  // Personal Info
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().optional(),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  guardian: z.string().min(3, 'Nome do responsável é obrigatório'),

  // Address
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(3, 'Bairro é obrigatório'),
  city: z.string().min(3, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().optional(),

  // Contacts
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),

  // Identifiers
  registration: z.string().min(3, 'Matrícula é obrigatória'),

  // Social
  nis: z.string().optional(),
  bolsaFamilia: z.enum(['yes', 'no']),

  // Transport
  usesTransport: z.enum(['yes', 'no']),
  transportRoute: z.string().optional(),

  // Health
  hasSpecialNeeds: z.enum(['yes', 'no']),
  cid: z.string().optional(),
  observation: z.string().optional(),

  // Initial Enrollment (Only for new students)
  enrollmentSchoolId: z.string().optional(),
  enrollmentYearId: z.string().optional(),
  enrollmentClassId: z.string().optional(),
})

interface StudentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any, initialEnrollment?: any) => void
  initialData?: Student | null
}

export function StudentFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: StudentFormDialogProps) {
  const [activeTab, setActiveTab] = useState('personal')
  const { schools } = useSchoolStore()

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      cpf: '',
      birthDate: '',
      fatherName: '',
      motherName: '',
      guardian: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      email: '',
      phone: '',
      registration: '',
      nis: '',
      bolsaFamilia: 'no',
      usesTransport: 'no',
      transportRoute: '',
      hasSpecialNeeds: 'no',
      cid: '',
      observation: '',
      enrollmentSchoolId: '',
      enrollmentYearId: '',
      enrollmentClassId: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          cpf: initialData.cpf || '',
          birthDate: initialData.birthDate || '',
          fatherName: initialData.fatherName || '',
          motherName: initialData.motherName || '',
          guardian: initialData.guardian,
          street: initialData.address.street,
          number: initialData.address.number,
          neighborhood: initialData.address.neighborhood,
          city: initialData.address.city,
          state: initialData.address.state,
          zipCode: initialData.address.zipCode,
          email: initialData.contacts.email || '',
          phone: initialData.contacts.phone || '',
          registration: initialData.registration,
          nis: initialData.social.nis || '',
          bolsaFamilia: initialData.social.bolsaFamilia ? 'yes' : 'no',
          usesTransport: initialData.transport.uses ? 'yes' : 'no',
          transportRoute: initialData.transport.routeNumber || '',
          hasSpecialNeeds: initialData.health.hasSpecialNeeds ? 'yes' : 'no',
          cid: initialData.health.cid || '',
          observation: initialData.health.observation || '',
          enrollmentSchoolId: '',
          enrollmentYearId: '',
          enrollmentClassId: '',
        })
      } else {
        form.reset({
          name: '',
          cpf: '',
          birthDate: '',
          fatherName: '',
          motherName: '',
          guardian: '',
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: '',
          email: '',
          phone: '',
          registration: '',
          nis: '',
          bolsaFamilia: 'no',
          usesTransport: 'no',
          transportRoute: '',
          hasSpecialNeeds: 'no',
          cid: '',
          observation: '',
          enrollmentSchoolId: '',
          enrollmentYearId: '',
          enrollmentClassId: '',
        })
      }
      setActiveTab('personal')
    }
  }, [open, initialData, form])

  // Logic to filter options for Enrollment
  const selectedSchoolId = form.watch('enrollmentSchoolId')
  const selectedYearId = form.watch('enrollmentYearId')

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId)
  const academicYears = selectedSchool?.academicYears || []

  const selectedYear = academicYears.find((y) => y.id === selectedYearId)
  const classes = selectedYear?.classes || []

  const handleSubmit = (values: z.infer<typeof studentSchema>) => {
    // Structure data for Student object
    const studentData = {
      name: values.name,
      cpf: values.cpf,
      birthDate: values.birthDate,
      fatherName: values.fatherName,
      motherName: values.motherName,
      guardian: values.guardian,
      registration: values.registration,
      address: {
        street: values.street,
        number: values.number,
        neighborhood: values.neighborhood,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
      },
      contacts: {
        email: values.email,
        phone: values.phone,
      },
      transport: {
        uses: values.usesTransport === 'yes',
        routeNumber:
          values.usesTransport === 'yes' ? values.transportRoute : undefined,
      },
      social: {
        nis: values.nis,
        bolsaFamilia: values.bolsaFamilia === 'yes',
      },
      health: {
        hasSpecialNeeds: values.hasSpecialNeeds === 'yes',
        cid: values.hasSpecialNeeds === 'yes' ? values.cid : undefined,
        observation:
          values.hasSpecialNeeds === 'yes' ? values.observation : undefined,
      },
    }

    let enrollmentData = undefined
    if (!initialData && values.enrollmentSchoolId && values.enrollmentClassId) {
      const selectedClass = classes.find(
        (c) => c.id === values.enrollmentClassId,
      )
      // Extract year number from name or use current date?
      // Mock data AcademicYear.name usually is "2024".
      const yearName = selectedYear?.name || new Date().getFullYear().toString()
      const yearNumber = parseInt(yearName) || new Date().getFullYear()

      enrollmentData = {
        year: yearNumber,
        schoolId: values.enrollmentSchoolId,
        grade: selectedClass ? selectedClass.name : 'Turma Indefinida', // Using Class Name as grade string for compatibility
      }
    }

    onSubmit(studentData, enrollmentData)
    onOpenChange(false)
  }

  const usesTransport = form.watch('usesTransport')
  const hasSpecialNeeds = form.watch('hasSpecialNeeds')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Aluno' : 'Novo Aluno'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize as informações completas do aluno.'
              : 'Preencha os dados para matricular um novo aluno.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
                <TabsTrigger value="social">Social/Saúde</TabsTrigger>
                {!initialData && (
                  <TabsTrigger value="enrollment">Matrícula</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="personal" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Matrícula</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Pai</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Mãe</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardian"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Responsável Legal</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone de Contato</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="UF" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Logradouro</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do NIS</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bolsaFamilia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recebe Bolsa Família?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Sim</SelectItem>
                            <SelectItem value="no">Não</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="usesTransport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usa Transporte Escolar?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Sim</SelectItem>
                            <SelectItem value="no">Não</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {usesTransport === 'yes' && (
                    <FormField
                      control={form.control}
                      name="transportRoute"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da Rota</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="space-y-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="hasSpecialNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Portador de Necessidades Especiais?
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Sim</SelectItem>
                            <SelectItem value="no">Não</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {hasSpecialNeeds === 'yes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cid"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CID (se houver)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="observation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações / Laudo</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              {!initialData && (
                <TabsContent value="enrollment" className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="enrollmentSchoolId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escola</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val)
                              form.setValue('enrollmentYearId', '')
                              form.setValue('enrollmentClassId', '')
                            }}
                            defaultValue={field.value}
                          >
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
                      name="enrollmentYearId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano Letivo</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val)
                              form.setValue('enrollmentClassId', '')
                            }}
                            defaultValue={field.value}
                            disabled={!selectedSchoolId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o ano" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {academicYears.map((year) => (
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
                      name="enrollmentClassId"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Turma (Série/Turno)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!selectedYearId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a turma" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name} ({cls.gradeName}) - {cls.shift}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>

            <DialogFooter className="mt-6">
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
