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

  // New Censo Fields
  susCard: z.string().optional(),
  birthCertificate: z.string().optional(),
  nationality: z.string().optional(),
  birthCountry: z.string().optional(),
  raceColor: z
    .enum(['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não declarada'])
    .optional(),
  motherEducation: z.string().optional(),
  fatherEducation: z.string().optional(),

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
  // Derived fields for enrollment logic are handled in UI, not necessarily schema validation if optional
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
      susCard: '',
      birthCertificate: '',
      nationality: 'Brasileira',
      birthCountry: 'Brasil',
      raceColor: 'Não declarada',
      motherEducation: '',
      fatherEducation: '',
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
          street: initialData.address?.street || '',
          number: initialData.address?.number || '',
          neighborhood: initialData.address?.neighborhood || '',
          city: initialData.address?.city || '',
          state: initialData.address?.state || '',
          zipCode: initialData.address?.zipCode || '',
          email: initialData.contacts?.email || '',
          phone: initialData.contacts?.phone || '',
          registration: initialData.registration,
          nis: initialData.social?.nis || '',
          bolsaFamilia: initialData.social?.bolsaFamilia ? 'yes' : 'no',
          usesTransport: initialData.transport?.uses ? 'yes' : 'no',
          transportRoute: initialData.transport?.routeNumber || '',
          hasSpecialNeeds: initialData.health?.hasSpecialNeeds ? 'yes' : 'no',
          cid: initialData.health?.cid || '',
          observation: initialData.health?.observation || '',
          enrollmentSchoolId: '',
          enrollmentYearId: '',
          enrollmentClassId: '',
          susCard: initialData.susCard || '',
          birthCertificate: initialData.birthCertificate || '',
          nationality: initialData.nationality || 'Brasileira',
          birthCountry: initialData.birthCountry || 'Brasil',
          raceColor: initialData.raceColor || 'Não declarada',
          motherEducation: initialData.motherEducation || '',
          fatherEducation: initialData.fatherEducation || '',
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
          susCard: '',
          birthCertificate: '',
          nationality: 'Brasileira',
          birthCountry: 'Brasil',
          raceColor: 'Não declarada',
          motherEducation: '',
          fatherEducation: '',
        })
      }
      setActiveTab('personal')
    }
  }, [open, initialData, form])

  // Logic to filter options for Enrollment
  const selectedSchoolId = form.watch('enrollmentSchoolId')
  const selectedYearId = form.watch('enrollmentYearId')
  const selectedClassId = form.watch('enrollmentClassId')

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId)
  const academicYears = selectedSchool?.academicYears || []

  const selectedYear = academicYears.find((y) => y.id === selectedYearId)
  const classes = selectedYear?.classes || []

  const selectedClass = classes.find((c) => c.id === selectedClassId)
  const displayGrade = selectedClass?.gradeName || ''
  const displayShift = selectedClass?.shift || ''

  const handleSubmit = (values: z.infer<typeof studentSchema>) => {
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
      susCard: values.susCard,
      birthCertificate: values.birthCertificate,
      nationality: values.nationality,
      birthCountry: values.birthCountry,
      raceColor: values.raceColor,
      motherEducation: values.motherEducation,
      fatherEducation: values.fatherEducation,
    }

    let enrollmentData = undefined
    if (!initialData && values.enrollmentSchoolId && values.enrollmentClassId) {
      const selectedClass = classes.find(
        (c) => c.id === values.enrollmentClassId,
      )
      const yearName = selectedYear?.name || new Date().getFullYear().toString()
      const yearNumber = parseInt(yearName) || new Date().getFullYear()

      enrollmentData = {
        year: yearNumber,
        schoolId: values.enrollmentSchoolId,
        grade: selectedClass ? selectedClass.name : 'Turma Indefinida',
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
              : 'Preencha os dados para cadastrar e matricular um novo aluno.'}
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
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
                <TabsTrigger value="social">Social/Saúde</TabsTrigger>
                {!initialData && (
                  <TabsTrigger value="enrollment">Matrícula</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="personal" className="space-y-4 py-4">
                {/* Personal Info Fields */}
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
                  {/* ... other personal fields ... */}
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
                    name="guardian"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável Legal</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {/* ... other doc fields ... */}
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
                  {/* ... other address fields ... */}
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
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-4 py-4">
                {/* Social fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIS</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                          <FormLabel>Turma</FormLabel>
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
                                  {cls.name} ({cls.gradeName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Derived/Display Fields for Confirmation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-md">
                    <FormItem>
                      <FormLabel>Série (Grade)</FormLabel>
                      <Input
                        value={displayGrade}
                        disabled
                        placeholder="Automático"
                        className="bg-muted/50"
                      />
                    </FormItem>
                    <FormItem>
                      <FormLabel>Turno</FormLabel>
                      <Input
                        value={displayShift}
                        disabled
                        placeholder="Automático"
                        className="bg-muted/50"
                      />
                    </FormItem>
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
