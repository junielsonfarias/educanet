import { useEffect, useState, useRef } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Student } from '@/lib/mock-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { validateEnrollment } from '@/lib/enrollment-utils'
import { useToast } from '@/hooks/use-toast'
import { Upload, X } from 'lucide-react'
import { fileToBase64 } from '@/lib/file-utils'
import { handleError } from '@/lib/error-handling'
import { validateCPF } from '@/lib/validations'

const studentSchema = z.object({
  // Personal Info
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateCPF(val).valid,
      (val) => ({
        message: validateCPF(val || '').error || 'CPF inválido',
      }),
    ),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  guardian: z.string().min(3, 'Nome do responsável é obrigatório'),
  photo: z.string().optional(), // Base64 ou URL da foto

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
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não informado']).optional(),
  allergies: z.string().optional(),
  receivesSchoolMeal: z.boolean().default(true),
  
  // Emergency Contact
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),

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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      photo: '',
      bloodType: 'Não informado',
      allergies: '',
      receivesSchoolMeal: true,
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
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
          photo: (initialData as any).photo || '',
          bloodType: (initialData as any).bloodType || 'Não informado',
          allergies: (initialData as any).allergies || '',
          receivesSchoolMeal: (initialData as any).receivesSchoolMeal !== false,
          emergencyContact: (initialData as any).emergencyContact || {
            name: '',
            phone: '',
            relationship: '',
          },
        })
        setPhotoPreview((initialData as any).photo || null)
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
          photo: '',
          bloodType: 'Não informado',
          allergies: '',
          receivesSchoolMeal: true,
          emergencyContact: {
            name: '',
            phone: '',
            relationship: '',
          },
        })
        setPhotoPreview(null)
      }
      setActiveTab('personal')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

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
      photo: values.photo,
      bloodType: values.bloodType,
      allergies: values.allergies,
      receivesSchoolMeal: values.receivesSchoolMeal,
      emergencyContact: values.emergencyContact,
    }

    let enrollmentData = undefined
    if (!initialData && values.enrollmentSchoolId && values.enrollmentClassId) {
      const selectedClass = classes.find(
        (c) => c.id === values.enrollmentClassId,
      )
      const yearName = selectedYear?.name || new Date().getFullYear().toString()
      const yearNumber = parseInt(yearName) || new Date().getFullYear()

      enrollmentData = {
        schoolId: values.enrollmentSchoolId,
        academicYearId: values.enrollmentYearId, // ID do ano letivo
        classroomId: values.enrollmentClassId, // ID da turma
        year: yearNumber, // Mantido para compatibilidade
        grade: selectedClass ? selectedClass.name : 'Turma Indefinida', // Mantido para compatibilidade
      }

      // Validar relacionamentos antes de criar
      if (enrollmentData) {
        const validation = validateEnrollment(
          {
            id: 'temp',
            ...enrollmentData,
            type: 'regular',
            status: 'Cursando',
          },
          schools,
        )
        if (!validation.valid) {
          // Toast será mostrado pelo componente pai se necessário
          // Por enquanto, apenas logamos o erro
          console.error('Erro de validação de matrícula:', validation.errors)
        }
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
                {/* Foto do Aluno */}
                <div className="flex gap-4 items-start">
                  <div className="w-32 shrink-0">
                    <FormLabel>Foto do Aluno</FormLabel>
                    <div
                      className="mt-2 w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20 relative cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {photoPreview ? (
                        <>
                          <img
                            src={photoPreview}
                            alt="Foto Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 cursor-pointer shadow-md hover:bg-destructive/90"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPhotoPreview(null)
                              form.setValue('photo', '')
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                          >
                            <X className="h-3 w-3" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Upload className="h-6 w-6 mb-1" />
                          <span className="text-[10px]">Enviar Foto</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          try {
                            const base64 = await fileToBase64(file)
                            setPhotoPreview(base64)
                            form.setValue('photo', base64)
                          } catch (error) {
                            console.error('Error reading file', error)
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="flex-1">
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
                    </div>
                  </div>
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
                  <FormField
                    control={form.control}
                    name="bolsaFamilia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recebe Bolsa Família</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                {/* Transport */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="usesTransport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Utiliza Transporte Escolar</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <FormLabel>Rota do Transporte</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Rota 05" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Health */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold text-sm">Informações de Saúde</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bloodType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo Sanguíneo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                              <SelectItem value="Não informado">Não informado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receivesSchoolMeal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Recebe Alimentação Escolar</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alergias</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informe as alergias do aluno (medicamentos, alimentos, etc.)"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hasSpecialNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Possui Necessidades Especiais</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <>
                      <FormField
                        control={form.control}
                        name="cid"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CID (Código Internacional de Doenças)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: F84.0" {...field} />
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
                            <FormLabel>Observações sobre Necessidades Especiais</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descreva as necessidades especiais do aluno..."
                                {...field}
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold text-sm">Contato de Emergência</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContact.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Contato</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyContact.relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parentesco</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Avô, Tio, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyContact.phone"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Telefone de Emergência</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
