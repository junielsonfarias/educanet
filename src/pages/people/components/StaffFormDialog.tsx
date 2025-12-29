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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Staff } from '@/lib/mock-data'
import { Upload, X } from 'lucide-react'
import { fileToBase64 } from '@/lib/file-utils'
import useSchoolStore from '@/stores/useSchoolStore'

const staffSchema = z.object({
  // Dados pessoais
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(8, 'Telefone inválido'),
  cpf: z.string().optional(),
  photo: z.string().optional(),
  
  // Dados profissionais
  role: z.enum([
    'secretary',
    'coordinator',
    'director',
    'pedagogue',
    'librarian',
    'janitor',
    'cook',
    'security',
    'nurse',
    'psychologist',
    'social_worker',
    'administrative',
    'other',
  ]),
  roleLabel: z.string().optional(),
  schoolId: z.string().optional(),
  admissionDate: z.string().min(1, 'Data de admissão obrigatória'),
  employmentBond: z.enum(['Contratado', 'Efetivo', 'Terceirizado', 'Estagiário']),
  contractType: z.enum(['CLT', 'Estatutário', 'Terceirizado', 'Estágio']),
  functionalSituation: z.enum(['efetivo', 'temporario', 'terceirizado', 'estagiario']),
  workload: z.coerce.number().min(0, 'Carga horária deve ser positiva'),
  salary: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'on_leave']),
  
  // Endereço
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  
  // Contato de emergência
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  
  // Qualificações
  qualifications: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  observations: z.string().optional(),
})

const roleLabels: Record<Staff['role'], string> = {
  secretary: 'Secretário(a)',
  coordinator: 'Coordenador(a)',
  director: 'Diretor(a)',
  pedagogue: 'Pedagogo(a)',
  librarian: 'Bibliotecário(a)',
  janitor: 'Zelador(a)',
  cook: 'Cozinheiro(a)',
  security: 'Segurança',
  nurse: 'Enfermeiro(a)',
  psychologist: 'Psicólogo(a)',
  social_worker: 'Assistente Social',
  administrative: 'Administrativo',
  other: 'Outro',
}

interface StaffFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: Staff | null
}

export function StaffFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: StaffFormDialogProps) {
  const [activeTab, setActiveTab] = useState('personal')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { schools } = useSchoolStore()

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      photo: '',
      role: 'administrative',
      roleLabel: '',
      schoolId: '',
      admissionDate: '',
      employmentBond: 'Contratado',
      contractType: 'CLT',
      functionalSituation: 'efetivo',
      workload: 40,
      salary: undefined,
      status: 'active',
      address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
      qualifications: [],
      certifications: [],
      observations: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          email: initialData.email,
          phone: initialData.phone,
          cpf: initialData.cpf || '',
          photo: initialData.photo || '',
          role: initialData.role,
          roleLabel: initialData.roleLabel || roleLabels[initialData.role] || '',
          schoolId: initialData.schoolId || '',
          admissionDate: initialData.admissionDate || '',
          employmentBond: initialData.employmentBond || 'Contratado',
          contractType: initialData.contractType || 'CLT',
          functionalSituation: initialData.functionalSituation || 'efetivo',
          workload: initialData.workload || 40,
          salary: initialData.salary,
          status: initialData.status,
          address: initialData.address || {
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
          },
          emergencyContact: initialData.emergencyContact || {
            name: '',
            phone: '',
            relationship: '',
          },
          qualifications: initialData.qualifications || [],
          certifications: initialData.certifications || [],
          observations: initialData.observations || '',
        })
        setPhotoPreview(initialData.photo || null)
      } else {
        form.reset({
          name: '',
          email: '',
          phone: '',
          cpf: '',
          photo: '',
          role: 'administrative',
          roleLabel: '',
          schoolId: '',
          admissionDate: '',
          employmentBond: 'Contratado',
          contractType: 'CLT',
          functionalSituation: 'efetivo',
          workload: 40,
          salary: undefined,
          status: 'active',
          address: {
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
          },
          emergencyContact: {
            name: '',
            phone: '',
            relationship: '',
          },
          qualifications: [],
          certifications: [],
          observations: '',
        })
        setPhotoPreview(null)
      }
      setActiveTab('personal')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const handleSubmit = (data: z.infer<typeof staffSchema>) => {
    onSubmit({
      ...data,
      schoolId: data.schoolId && data.schoolId !== 'central' ? data.schoolId : '',
      roleLabel: roleLabels[data.role] || data.roleLabel || 'Outro',
    })
    onOpenChange(false)
  }

  const selectedRole = form.watch('role')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Funcionário' : 'Novo Funcionário'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize os dados do funcionário.'
              : 'Cadastre um novo funcionário não-docente na rede municipal.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="professional">Profissional</TabsTrigger>
                <TabsTrigger value="additional">Adicional</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 py-4">
                {/* Foto do Funcionário */}
                <div className="flex gap-4 items-start">
                  <div className="w-32 shrink-0">
                    <FormLabel>Foto</FormLabel>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} />
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
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail Institucional *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="funcionario@edu.gov" {...field} />
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
                            <FormLabel>Telefone *</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold text-sm">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="address.zipCode"
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
                      name="address.street"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, Avenida..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="address.number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="UF" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contato de Emergência */}
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
                            <Input placeholder="Ex: Cônjuge, Filho(a), etc." {...field} />
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

              <TabsContent value="professional" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo/Função *</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val as Staff['role'])
                            form.setValue('roleLabel', roleLabels[val as Staff['role']] || '')
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o cargo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="secretary">Secretário(a)</SelectItem>
                            <SelectItem value="coordinator">Coordenador(a)</SelectItem>
                            <SelectItem value="director">Diretor(a)</SelectItem>
                            <SelectItem value="pedagogue">Pedagogo(a)</SelectItem>
                            <SelectItem value="librarian">Bibliotecário(a)</SelectItem>
                            <SelectItem value="janitor">Zelador(a)</SelectItem>
                            <SelectItem value="cook">Cozinheiro(a)</SelectItem>
                            <SelectItem value="security">Segurança</SelectItem>
                            <SelectItem value="nurse">Enfermeiro(a)</SelectItem>
                            <SelectItem value="psychologist">Psicólogo(a)</SelectItem>
                            <SelectItem value="social_worker">Assistente Social</SelectItem>
                            <SelectItem value="administrative">Administrativo</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="schoolId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escola (Opcional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a escola" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="central">Secretaria (Central)</SelectItem>
                            {schools.map((school) => (
                              <SelectItem key={school.id} value={school.id}>
                                {school.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Deixe em branco se trabalha na secretaria central.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="admissionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Admissão *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
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
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="on_leave">Afastado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="employmentBond"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vínculo Empregatício</FormLabel>
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
                            <SelectItem value="Contratado">Contratado</SelectItem>
                            <SelectItem value="Efetivo">Efetivo</SelectItem>
                            <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                            <SelectItem value="Estagiário">Estagiário</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Contrato</FormLabel>
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
                            <SelectItem value="CLT">CLT</SelectItem>
                            <SelectItem value="Estatutário">Estatutário</SelectItem>
                            <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                            <SelectItem value="Estágio">Estágio</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="functionalSituation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Situação Funcional</FormLabel>
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
                            <SelectItem value="efetivo">Efetivo</SelectItem>
                            <SelectItem value="temporario">Temporário</SelectItem>
                            <SelectItem value="terceirizado">Terceirizado</SelectItem>
                            <SelectItem value="estagiario">Estagiário</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workload"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carga Horária Semanal (horas) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="40"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salário (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="additional" className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="qualifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualificações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Liste as qualificações do funcionário (ex: Curso de Primeiros Socorros, Treinamento em Segurança, etc.)"
                          {...field}
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => {
                            const lines = e.target.value.split('\n').filter((l) => l.trim())
                            field.onChange(lines)
                          }}
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        Uma qualificação por linha.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Liste as certificações do funcionário (ex: Certificado de Segurança do Trabalho, etc.)"
                          {...field}
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => {
                            const lines = e.target.value.split('\n').filter((l) => l.trim())
                            field.onChange(lines)
                          }}
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        Uma certificação por linha.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais sobre o funcionário..."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

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

