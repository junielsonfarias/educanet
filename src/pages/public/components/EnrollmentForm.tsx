import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Upload, FileText } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import useSchoolStore from '@/stores/useSchoolStore'
import useStudentStore from '@/stores/useStudentStore'
import { AttachmentUpload } from '@/components/AttachmentUpload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { validateCPF, validateAgeGrade } from '@/lib/validations'

const enrollmentSchema = z.object({
  // Dados do Aluno
  studentName: z.string().min(3, 'Nome do aluno é obrigatório'),
  studentCpf: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateCPF(val).valid,
      (val) => ({
        message: validateCPF(val || '').error || 'CPF inválido',
      }),
    ),
  studentBirthDate: z.date({ required_error: 'Data de nascimento é obrigatória' }),
  studentGender: z.enum(['Masculino', 'Feminino', 'Outro']),
  studentNationality: z.string().min(1, 'Nacionalidade é obrigatória'),
  studentRaceColor: z.enum(['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não declarada']),
  studentNis: z.string().optional(),
  studentSusCard: z.string().optional(),

  // Dados do Responsável
  guardianName: z.string().min(3, 'Nome do responsável é obrigatório'),
  guardianCpf: z
    .string()
    .min(1, 'CPF do responsável é obrigatório')
    .refine(
      (val) => validateCPF(val).valid,
      (val) => ({
        message: validateCPF(val).error || 'CPF inválido',
      }),
    ),
  guardianRg: z.string().optional(),
  guardianPhone: z.string().min(10, 'Telefone é obrigatório'),
  guardianEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  guardianRelationship: z.enum(['Pai', 'Mãe', 'Avô', 'Avó', 'Tio', 'Tia', 'Outro']),
  guardianAddress: z.string().min(5, 'Endereço é obrigatório'),
  guardianNumber: z.string().min(1, 'Número é obrigatório'),
  guardianNeighborhood: z.string().min(2, 'Bairro é obrigatório'),
  guardianCity: z.string().min(2, 'Cidade é obrigatória'),
  guardianState: z.string().min(2, 'Estado é obrigatório'),
  guardianZipCode: z.string().optional(),

  // Dados da Matrícula
  schoolId: z.string().min(1, 'Escola é obrigatória'),
  academicYearId: z.string().min(1, 'Ano letivo é obrigatório'),
  gradeId: z.string().min(1, 'Série/Ano é obrigatório'),
  shift: z.enum(['Matutino', 'Vespertino', 'Noturno', 'Integral']),
  previousSchool: z.string().optional(),
  previousGrade: z.string().optional(),
  transferReason: z.string().optional(),

  // Informações Adicionais
  hasSpecialNeeds: z.boolean().default(false),
  specialNeedsDescription: z.string().optional(),
  usesTransport: z.boolean().default(false),
  transportRoute: z.string().optional(),
  receivesBolsaFamilia: z.boolean().default(false),
  observations: z.string().optional(),

  // Declarações
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'Você deve concordar com os termos',
  }),
})

interface EnrollmentFormProps {
  onSuccess: (protocol: string) => void
}

export function EnrollmentForm({ onSuccess }: EnrollmentFormProps) {
  const { schools } = useSchoolStore()
  const { addStudent } = useStudentStore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('student')

  const form = useForm<z.infer<typeof enrollmentSchema>>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      studentName: '',
      studentCpf: '',
      studentBirthDate: undefined,
      studentGender: 'Masculino',
      studentNationality: 'Brasileira',
      studentRaceColor: 'Não declarada',
      studentNis: '',
      studentSusCard: '',
      guardianName: '',
      guardianCpf: '',
      guardianRg: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianRelationship: 'Mãe',
      guardianAddress: '',
      guardianNumber: '',
      guardianNeighborhood: '',
      guardianCity: '',
      guardianState: '',
      guardianZipCode: '',
      schoolId: '',
      academicYearId: '',
      gradeId: '',
      shift: 'Matutino',
      previousSchool: '',
      previousGrade: '',
      transferReason: '',
      hasSpecialNeeds: false,
      specialNeedsDescription: '',
      usesTransport: false,
      transportRoute: '',
      receivesBolsaFamilia: false,
      observations: '',
      agreeTerms: false,
    },
  })

  const schoolId = form.watch('schoolId')
  const academicYearId = form.watch('academicYearId')
  const hasSpecialNeeds = form.watch('hasSpecialNeeds')
  const usesTransport = form.watch('usesTransport')

  const selectedSchool = schools.find((s) => s.id === schoolId)
  const selectedYear = selectedSchool?.academicYears.find((y) => y.id === academicYearId)
  const turmas = selectedYear?.turmas || selectedYear?.classes || []
  const availableGrades = turmas.map((c) => c.serieAnoName || c.gradeName).filter((g, i, arr) => arr.indexOf(g) === i) || []

  const generateProtocol = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `MAT-${timestamp}-${random}`
  }

  const handleSubmit = async (data: z.infer<typeof enrollmentSchema>) => {
    setIsSubmitting(true)

    try {
      // Gerar protocolo
      const protocol = generateProtocol()

      // Criar registro de aluno (com status pendente)
      const registration = `PEND-${Date.now()}`
      
      const newStudent = {
        registration,
        name: data.studentName,
        cpf: data.studentCpf || undefined,
        birthDate: format(data.studentBirthDate, 'yyyy-MM-dd'),
        guardian: data.guardianName,
        address: {
          street: data.guardianAddress,
          number: data.guardianNumber,
          neighborhood: data.guardianNeighborhood,
          city: data.guardianCity,
          state: data.guardianState,
          zipCode: data.guardianZipCode || '',
        },
        contacts: {
          phone: data.guardianPhone,
          email: data.guardianEmail || undefined,
        },
        transport: {
          uses: data.usesTransport,
          routeNumber: data.transportRoute || undefined,
        },
        social: {
          nis: data.studentNis || undefined,
          bolsaFamilia: data.receivesBolsaFamilia,
        },
        health: {
          hasSpecialNeeds: data.hasSpecialNeeds,
          cid: data.specialNeedsDescription || undefined,
          observation: data.observations || undefined,
        },
        nationality: data.studentNationality,
        raceColor: data.studentRaceColor,
        susCard: data.studentSusCard || undefined,
        // Campos adicionais para controle de matrícula online (não fazem parte da interface Student, mas serão armazenados)
        enrollmentProtocol: protocol,
        enrollmentRequestDate: new Date().toISOString(),
        enrollmentStatus: 'pending_enrollment' as const,
      }

      // Criar matrícula inicial pendente
      const initialEnrollment = {
        schoolId: data.schoolId,
        academicYearId: data.academicYearId,
        grade: data.gradeId,
        year: new Date().getFullYear(),
      }

      addStudent(newStudent as any, initialEnrollment)

      toast({
        title: 'Solicitação enviada com sucesso!',
        description: `Seu protocolo é: ${protocol}. Anote este número para acompanhar sua solicitação.`,
      })

      onSuccess(protocol)
      form.reset()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar solicitação',
        description: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="student">Aluno</TabsTrigger>
            <TabsTrigger value="guardian">Responsável</TabsTrigger>
            <TabsTrigger value="enrollment">Matrícula</TabsTrigger>
            <TabsTrigger value="additional">Adicional</TabsTrigger>
          </TabsList>

          {/* Dados do Aluno */}
          <TabsContent value="student" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo do Aluno *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do Aluno</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentBirthDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Nascimento *</FormLabel>
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
                          disabled={(date) => date > new Date()}
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
                name="studentGender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentNationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nacionalidade *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Brasileira" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentRaceColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raça/Cor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Branca">Branca</SelectItem>
                        <SelectItem value="Preta">Preta</SelectItem>
                        <SelectItem value="Parda">Parda</SelectItem>
                        <SelectItem value="Amarela">Amarela</SelectItem>
                        <SelectItem value="Indígena">Indígena</SelectItem>
                        <SelectItem value="Não declarada">Não declarada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentNis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIS (Número de Identificação Social)</FormLabel>
                    <FormControl>
                      <Input placeholder="NIS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentSusCard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cartão SUS</FormLabel>
                    <FormControl>
                      <Input placeholder="Número do cartão SUS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Dados do Responsável */}
          <TabsContent value="guardian" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="guardianName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo do Responsável *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do Responsável *</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianRg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG do Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="RG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parentesco *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pai">Pai</SelectItem>
                        <SelectItem value="Mãe">Mãe</SelectItem>
                        <SelectItem value="Avô">Avô</SelectItem>
                        <SelectItem value="Avó">Avó</SelectItem>
                        <SelectItem value="Tio">Tio</SelectItem>
                        <SelectItem value="Tia">Tia</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianPhone"
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
                name="guardianEmail"
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
                name="guardianAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Endereço *</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Avenida, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número *</FormLabel>
                    <FormControl>
                      <Input placeholder="Número" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianNeighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro *</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <FormControl>
                      <Input placeholder="UF" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guardianZipCode"
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
            </div>
          </TabsContent>

          {/* Dados da Matrícula */}
          <TabsContent value="enrollment" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="schoolId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola *</FormLabel>
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
                    <FormLabel>Ano Letivo *</FormLabel>
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
                name="gradeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série/Ano *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1º Ano, 2º Ano, etc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Informe a série/ano que o aluno irá cursar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Matutino">Matutino</SelectItem>
                        <SelectItem value="Vespertino">Vespertino</SelectItem>
                        <SelectItem value="Noturno">Noturno</SelectItem>
                        <SelectItem value="Integral">Integral</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previousSchool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola Anterior (se houver)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da escola anterior" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previousGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série/Ano Anterior</FormLabel>
                    <FormControl>
                      <Input placeholder="Série/ano cursado anteriormente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transferReason"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Motivo da Transferência (se aplicável)</FormLabel>
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
            </div>
          </TabsContent>

          {/* Informações Adicionais */}
          <TabsContent value="additional" className="space-y-4 mt-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hasSpecialNeeds"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Aluno possui necessidades especiais</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {hasSpecialNeeds && (
                <FormField
                  control={form.control}
                  name="specialNeedsDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição das Necessidades Especiais</FormLabel>
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
              )}

              <FormField
                control={form.control}
                name="usesTransport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Aluno utiliza transporte escolar</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {usesTransport && (
                <FormField
                  control={form.control}
                  name="transportRoute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rota do Transporte</FormLabel>
                      <FormControl>
                        <Input placeholder="Informe a rota do transporte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="receivesBolsaFamilia"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Família recebe Bolsa Família</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações Adicionais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais que considere relevantes..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-4">
                <FormField
                  control={form.control}
                  name="agreeTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Declaro que as informações fornecidas são verdadeiras e estou ciente de que
                          informações falsas podem resultar no cancelamento da matrícula. *
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Limpar Formulário
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <FileText className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Enviar Solicitação
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

