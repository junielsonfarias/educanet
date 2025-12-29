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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Teacher } from '@/lib/mock-data'
import useCourseStore from '@/stores/useCourseStore'
import { Upload, X } from 'lucide-react'
import { fileToBase64 } from '@/lib/file-utils'

const teacherSchema = z.object({
  // Dados pessoais
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(8, 'Telefone inválido'),
  cpf: z.string().min(11, 'CPF inválido').optional(),
  status: z.enum(['active', 'inactive']),
  
  // Dados profissionais
  subject: z.string().min(2, 'Disciplina é obrigatória'),
  role: z.string().min(2, 'Cargo/Função é obrigatório'),
  admissionDate: z.string().min(1, 'Data de admissão obrigatória'),
  employmentBond: z.enum(['Contratado', 'Efetivo']).optional(),
  functionalSituation: z.enum(['efetivo', 'temporario', 'terceirizado', 'estagiario']).optional(),
  contractType: z.enum(['CLT', 'estatutario', 'terceirizado']).optional(),
  experienceYears: z.number().min(0).optional(),
  
  // Formação acadêmica
  academicBackground: z.string().optional(),
  graduationCourse: z.string().optional(),
  graduationInstitution: z.string().optional(),
  graduationYear: z.number().min(1900).max(2100).optional(),
  graduationArea: z.string().optional(),
  specializationCourse: z.string().optional(),
  specializationInstitution: z.string().optional(),
  specializationYear: z.number().min(1900).max(2100).optional(),
  masterCourse: z.string().optional(),
  masterInstitution: z.string().optional(),
  masterYear: z.number().min(1900).max(2100).optional(),
  doctorateCourse: z.string().optional(),
  doctorateInstitution: z.string().optional(),
  doctorateYear: z.number().min(1900).max(2100).optional(),
  
  // Disciplinas habilitadas
  enabledSubjects: z.array(z.string()).optional(),
  
  // Carga horária
  totalWorkload: z.number().min(0).optional(),
  
  // Foto
  photo: z.string().optional(),
})

interface TeacherFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: Teacher | null
}

export function TeacherFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: TeacherFormDialogProps) {
  const [activeTab, setActiveTab] = useState('personal')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { etapasEnsino } = useCourseStore()
  
  // Obter todas as disciplinas disponíveis
  const allSubjects = etapasEnsino.flatMap((e) => e.seriesAnos.flatMap((s) => s.subjects))

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      phone: '',
      status: 'active',
      cpf: '',
      employmentBond: 'Contratado',
      admissionDate: '',
      role: '',
      academicBackground: '',
      functionalSituation: 'efetivo',
      contractType: 'estatutario',
      experienceYears: 0,
      enabledSubjects: [],
      totalWorkload: 0,
      photo: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          email: initialData.email,
          subject: initialData.subject,
          phone: initialData.phone,
          status: initialData.status,
          cpf: initialData.cpf || '',
          employmentBond: initialData.employmentBond || 'Contratado',
          admissionDate: initialData.admissionDate || '',
          role: initialData.role || '',
          academicBackground: initialData.academicBackground || '',
          functionalSituation: initialData.functionalSituation || 'efetivo',
          contractType: initialData.contractType || 'estatutario',
          experienceYears: initialData.experienceYears || 0,
          enabledSubjects: initialData.enabledSubjects || [],
          totalWorkload: initialData.workload?.total || 0,
          graduationCourse: initialData.education?.graduation?.course || '',
          graduationInstitution: initialData.education?.graduation?.institution || '',
          graduationYear: initialData.education?.graduation?.year || undefined,
          graduationArea: initialData.education?.graduation?.area || '',
          specializationCourse: initialData.education?.specialization?.course || '',
          specializationInstitution: initialData.education?.specialization?.institution || '',
          specializationYear: initialData.education?.specialization?.year || undefined,
          masterCourse: initialData.education?.master?.course || '',
          masterInstitution: initialData.education?.master?.institution || '',
          masterYear: initialData.education?.master?.year || undefined,
          doctorateCourse: initialData.education?.doctorate?.course || '',
          doctorateInstitution: initialData.education?.doctorate?.institution || '',
          doctorateYear: initialData.education?.doctorate?.year || undefined,
          photo: (initialData as any).photo || '',
        })
        setPhotoPreview((initialData as any).photo || null)
      } else {
        form.reset({
          name: '',
          email: '',
          subject: '',
          phone: '',
          status: 'active',
          cpf: '',
          employmentBond: 'Contratado',
          admissionDate: '',
          role: '',
          academicBackground: '',
          functionalSituation: 'efetivo',
          contractType: 'estatutario',
          experienceYears: 0,
          enabledSubjects: [],
          totalWorkload: 0,
          photo: '',
        })
        setPhotoPreview(null)
      }
      setActiveTab('personal')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const handleSubmit = (data: z.infer<typeof teacherSchema>) => {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Professor' : 'Novo Professor'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize os dados profissionais e acadêmicos.'
              : 'Cadastre um novo professor na rede municipal.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="education">Formação</TabsTrigger>
                <TabsTrigger value="professional">Profissional</TabsTrigger>
                <TabsTrigger value="subjects">Disciplinas</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 py-4">
                {/* Foto do Professor */}
                <div className="flex gap-4 items-start">
                  <div className="w-32 shrink-0">
                    <FormLabel>Foto do Professor</FormLabel>
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
                              <Input placeholder="Nome do professor" {...field} />
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
                          <Input
                            type="email"
                            placeholder="professor@edu.gov"
                            {...field}
                          />
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
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="education" className="space-y-4 py-4">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Graduação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="graduationCourse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Curso</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Licenciatura em Matemática" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="graduationInstitution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instituição</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da instituição" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="graduationYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano de Conclusão</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="2020"
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
                        name="graduationArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Área de Conhecimento</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Ciências Exatas" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Especialização</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="specializationCourse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Curso</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da especialização" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specializationInstitution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instituição</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da instituição" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specializationYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="2022"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Mestrado (Opcional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="masterCourse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Curso</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do mestrado" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="masterInstitution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instituição</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da instituição" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="masterYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="2023"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Doutorado (Opcional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="doctorateCourse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Curso</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do doutorado" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="doctorateInstitution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instituição</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da instituição" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="doctorateYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="2024"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                        <FormControl>
                          <Input placeholder="Ex: Professor II" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disciplina Principal *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Matemática" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                    name="experienceYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anos de Experiência</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
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
                              <SelectValue placeholder="Selecione" />
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
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CLT">CLT</SelectItem>
                            <SelectItem value="estatutario">Estatutário</SelectItem>
                            <SelectItem value="terceirizado">Terceirizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Contratado">Contratado</SelectItem>
                            <SelectItem value="Efetivo">Efetivo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalWorkload"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carga Horária Total (horas/mês)</FormLabel>
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
                </div>
              </TabsContent>

              <TabsContent value="subjects" className="space-y-4 py-4">
                <div className="space-y-4">
                  <div>
                    <FormLabel className="text-base font-semibold">
                      Disciplinas Habilitadas
                    </FormLabel>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecione as disciplinas que o professor está habilitado a lecionar.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto border rounded-lg p-4">
                    {allSubjects.map((subject) => (
                      <FormField
                        key={subject.id}
                        control={form.control}
                        name="enabledSubjects"
                        render={({ field }) => {
                          return (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(subject.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), subject.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== subject.id),
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">
                                {subject.name}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>

                  {allSubjects.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma disciplina cadastrada. Cadastre disciplinas nos cursos primeiro.
                    </p>
                  )}
                </div>
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
