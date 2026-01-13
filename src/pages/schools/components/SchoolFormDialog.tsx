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
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadFile } from '@/lib/supabase/storage'
import { toast } from 'sonner'
import { validateSchoolINEPCode, validateCNPJ } from '@/lib/validations'
import type { School } from '@/lib/database-types'

const educationTypesList = [
  'Educação Infantil',
  'Ensino Fundamental - Anos Iniciais',
  'Ensino Fundamental - Anos Finais',
  'Ensino Médio',
  'Educação Profissional',
  'Educação de Jovens e Adultos (EJA)',
  'Educação Especial',
]

const schoolSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  code: z.string().min(2, 'Código deve ter pelo menos 2 caracteres'),
  cnpj: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateCNPJ(val).valid,
      (val) => ({
        message: validateCNPJ(val || '').error || 'CNPJ inválido',
      }),
    ),
  inepCode: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateSchoolINEPCode(val).valid,
      (val) => ({
        message: validateSchoolINEPCode(val || '').error || 'Código INEP inválido',
      }),
    ),
  director: z.string().min(3, 'Nome do diretor é obrigatório'),
  address: z.string().min(5, 'Endereço é obrigatório'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
  logo: z.string().optional(),
  administrativeDependency: z
    .enum(['Federal', 'Estadual', 'Municipal', 'Privada'])
    .optional(),
  locationType: z.enum(['Urbana', 'Rural']).optional(),
  polo: z.string().optional(),
  educationTypes: z.array(z.string()).optional(),
  coordinates: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  maxCapacity: z.coerce.number().min(0).optional(),
  operatingHours: z.string().optional(),
  // Infraestrutura completa do Censo Escolar (aceita estrutura completa ou simplificada)
  infrastructure: z.any(),
  administrativeRooms: z.object({
    secretariat: z.coerce.number().min(0).optional(),
    direction: z.coerce.number().min(0).optional(),
    coordination: z.coerce.number().min(0).optional(),
    storage: z.coerce.number().min(0).optional(),
    teachersRoom: z.coerce.number().min(0).optional(),
    meetingRoom: z.coerce.number().min(0).optional(),
  }).optional(),
})

interface SchoolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
  initialData?: School | null
}

export function SchoolFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: SchoolFormDialogProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof schoolSchema>>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      code: '',
      cnpj: '',
      inepCode: '',
      director: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      status: 'active',
      logo: '',
      administrativeDependency: 'Municipal',
      locationType: 'Urbana',
      polo: '',
      educationTypes: [],
      coordinates: {
        lat: undefined,
        lng: undefined,
      },
      maxCapacity: 0,
      operatingHours: '',
      infrastructure: {
        classrooms: {
          total: 0,
          regular: 0,
          accessible: 0,
          capacity: 0,
        },
        specialRooms: {
          lab: 0,
          library: 0,
          computer: 0,
          science: 0,
          art: 0,
        },
        bathrooms: {
          total: 0,
          accessible: 0,
        },
        dependencies: {
          kitchen: false,
          cafeteria: false,
          court: false,
          playground: false,
        },
        utilities: {
          water: 'public',
          energy: 'public',
          sewage: 'public',
          internet: {
            type: 'none',
            speed: undefined,
          },
        },
        equipment: {
          computers: 0,
          projectors: 0,
          tvs: 0,
          printers: 0,
        },
      },
      administrativeRooms: {
        secretariat: 0,
        direction: 0,
        coordination: 0,
        storage: 0,
        teachersRoom: 0,
        meetingRoom: 0,
      },
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.trade_name || initialData.name || '',
          code: initialData.inep_code || '',
          cnpj: initialData.cnpj || '',
          inepCode: initialData.inep_code || '',
          director: '', // Diretor será vinculado separadamente
          address: initialData.address || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          website: '', // Website não está no schema atual
          status: initialData.deleted_at ? 'inactive' : 'active',
          logo: initialData.logo_url || '',
          administrativeDependency:
            initialData.administrativeDependency || 'Municipal',
          locationType: initialData.locationType || 'Urbana',
          polo: initialData.polo || '',
          educationTypes: initialData.educationTypes || [],
          coordinates: initialData.coordinates || {
            lat: undefined,
            lng: undefined,
          },
          maxCapacity: (initialData as any).maxCapacity || 0,
          operatingHours: (initialData as any).operatingHours || '',
          infrastructure: (() => {
            const infra = initialData.infrastructure
            if (infra && typeof infra === 'object' && 'classrooms' in infra && typeof infra.classrooms === 'object') {
              return infra as any
            }
            // Converter estrutura antiga para nova
            const old = infra as any
            return {
              classrooms: {
                total: old?.classrooms || 0,
                regular: old?.classrooms || 0,
                accessible: old?.accessible ? 1 : 0,
                capacity: 0,
              },
              specialRooms: {
                lab: old?.lab ? 1 : 0,
                library: old?.library ? 1 : 0,
                computer: 0,
                science: 0,
                art: 0,
              },
              bathrooms: {
                total: 0,
                accessible: 0,
              },
              dependencies: {
                kitchen: false,
                cafeteria: false,
                court: false,
                playground: false,
              },
              utilities: {
                water: 'public',
                energy: 'public',
                sewage: 'public',
                internet: {
                  type: old?.internet ? 'fiber' : 'none',
                  speed: old?.internet ? 100 : undefined,
                },
              },
              equipment: {
                computers: 0,
                projectors: 0,
                tvs: 0,
                printers: 0,
              },
            }
          })(),
          administrativeRooms: initialData.administrativeRooms || {
            secretariat: 0,
            direction: 0,
            coordination: 0,
            storage: 0,
            teachersRoom: 0,
            meetingRoom: 0,
          },
        })
        setLogoPreview(initialData.logo_url || initialData.logo || null)
      } else {
        form.reset({
          name: '',
          code: '',
          inepCode: '',
          director: '',
          address: '',
          phone: '',
          status: 'active',
          logo: '',
          administrativeDependency: 'Municipal',
          locationType: 'Urbana',
          polo: '',
          educationTypes: [],
          infrastructure: {
            classrooms: 0,
            accessible: false,
            internet: false,
            library: false,
            lab: false,
          },
        })
        setLogoPreview(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      
      // Upload to Supabase Storage
      const filePath = `schools/${Date.now()}-${file.name}`
      const uploadResult = await uploadFile({
        bucket: 'photos',
        file,
        path: filePath,
        upsert: true,
      })

      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Erro ao fazer upload da logo')
      }

      setLogoPreview(uploadResult.publicUrl)
      form.setValue('logo', uploadResult.publicUrl)
      toast.success('Logo carregada com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload da logo')
    } finally {
      setUploading(false)
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    form.setValue('logo', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (data: z.infer<typeof schoolSchema>) => {
    // Normalizar estrutura de infraestrutura para formato completo
    let normalizedInfrastructure = data.infrastructure
    
    // Se for estrutura simplificada, converter para completa
    if (typeof data.infrastructure === 'object' && !('classrooms' in data.infrastructure) || typeof data.infrastructure.classrooms === 'number') {
      const simple = data.infrastructure as any
      normalizedInfrastructure = {
        classrooms: {
          total: simple.classrooms || 0,
          regular: simple.classrooms || 0,
          accessible: simple.accessible ? 1 : 0,
          capacity: 0,
        },
        specialRooms: {
          lab: simple.lab ? 1 : 0,
          library: simple.library ? 1 : 0,
          computer: 0,
          science: 0,
          art: 0,
        },
        bathrooms: {
          total: 0,
          accessible: 0,
        },
        dependencies: {
          kitchen: false,
          cafeteria: false,
          court: false,
          playground: false,
        },
        utilities: {
          water: 'public',
          energy: 'public',
          sewage: 'public',
          internet: {
            type: simple.internet ? 'fiber' : 'none',
            speed: simple.internet ? 100 : undefined,
          },
        },
        equipment: {
          computers: 0,
          projectors: 0,
          tvs: 0,
          printers: 0,
        },
      }
    }

    onSubmit({
      ...data,
      infrastructure: normalizedInfrastructure,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Escola' : 'Nova Escola'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize as informações da escola.'
              : 'Preencha os dados para cadastrar uma nova escola.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                <TabsTrigger value="census">Censo Escolar / INEP</TabsTrigger>
                <TabsTrigger value="infrastructure">Infraestrutura</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 py-4">
                <div className="flex gap-4">
                  {/* Logo Upload Section */}
                  <div className="w-32 shrink-0">
                    <FormLabel>Logo da Escola</FormLabel>
                    <div
                      className="mt-2 w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20 relative cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : logoPreview ? (
                        <>
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            className="w-full h-full object-contain p-1"
                          />
                          <div
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 cursor-pointer shadow-md hover:bg-destructive/90"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeLogo()
                            }}
                          >
                            <X className="h-3 w-3" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Upload className="h-6 w-6 mb-1" />
                          <span className="text-[10px]">Enviar Logo</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código Interno</FormLabel>
                            <FormControl>
                              <Input placeholder="EX: 001" {...field} />
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
                            <FormLabel>Situação</FormLabel>
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
                                <SelectItem value="active">Ativa</SelectItem>
                                <SelectItem value="inactive">
                                  Inativa
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Escola</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Escola Municipal..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="director"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diretor(a)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 0000-0000" {...field} />
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
                        <FormLabel>E-mail Institucional</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="escola@edu.gov.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Logradouro, número" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site da Escola (opcional)</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://escola.edu.gov.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="operatingHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de Funcionamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 07:00 às 17:00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="coordinates.lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude (GPS)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Ex: -23.5505"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coordinates.lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude (GPS)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Ex: -46.6333"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidade Máxima (alunos)</FormLabel>
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
                </div>
              </TabsContent>

              <TabsContent value="census" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="00.000.000/0000-00" {...field} />
                        </FormControl>
                        <FormDescription>
                          CNPJ da instituição de ensino
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="inepCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código INEP</FormLabel>
                        <FormControl>
                          <Input placeholder="8 dígitos" {...field} />
                        </FormControl>
                        <FormDescription>
                          Código do Censo Escolar/INEP
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="administrativeDependency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dependência ADM</FormLabel>
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
                            <SelectItem value="Municipal">Municipal</SelectItem>
                            <SelectItem value="Estadual">Estadual</SelectItem>
                            <SelectItem value="Federal">Federal</SelectItem>
                            <SelectItem value="Privada">Privada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="locationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização</FormLabel>
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
                            <SelectItem value="Urbana">Urbana</SelectItem>
                            <SelectItem value="Rural">Rural</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="polo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Polo (Cluster)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Polo Sede" {...field} />
                      </FormControl>
                      <FormDescription>
                        Grupo ou região a qual a escola pertence.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3 border rounded-md p-4">
                  <h4 className="font-medium text-sm">
                    Níveis de Ensino Ofertados
                  </h4>
                  <FormField
                    control={form.control}
                    name="educationTypes"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {educationTypesList.map((type) => (
                            <FormField
                              key={type}
                              control={form.control}
                              name="educationTypes"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={type}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(type)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                type,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== type,
                                                ),
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {type}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="infrastructure" className="space-y-4 py-4">
                <div className="space-y-6 max-h-[600px] overflow-y-auto">
                  {/* Salas de Aula */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">Salas de Aula</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="infrastructure.classrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total de Salas de Aula</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={typeof field.value === 'object' ? field.value?.total || 0 : field.value || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0
                                  if (typeof field.value === 'object') {
                                    field.onChange({ ...field.value, total: val })
                                  } else {
                                    field.onChange(val)
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.classrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Salas Acessíveis</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                value={typeof field.value === 'object' ? field.value?.accessible || 0 : 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0
                                  if (typeof field.value === 'object') {
                                    field.onChange({ ...field.value, accessible: val })
                                  } else {
                                    field.onChange({ total: field.value || 0, accessible: val })
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Salas Administrativas */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">Salas Administrativas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="administrativeRooms.secretariat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secretaria</FormLabel>
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
                        name="administrativeRooms.direction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diretoria</FormLabel>
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
                        name="administrativeRooms.coordination"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coordenação</FormLabel>
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
                        name="administrativeRooms.teachersRoom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sala dos Professores</FormLabel>
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
                        name="administrativeRooms.storage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Almoxarifado</FormLabel>
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
                        name="administrativeRooms.meetingRoom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sala de Reuniões</FormLabel>
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
                    </div>
                  </div>

                  {/* Salas Especiais */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">Salas Especiais</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="infrastructure.specialRooms.lab"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Laboratório de Informática</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.specialRooms.library"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biblioteca</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.specialRooms.computer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sala de Informática</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.specialRooms.science"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Laboratório de Ciências</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.specialRooms.art"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sala de Artes</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Banheiros */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">Banheiros</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="infrastructure.bathrooms.total"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total de Banheiros</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.bathrooms.accessible"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banheiros Acessíveis</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Dependências */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">Dependências</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="infrastructure.dependencies.kitchen"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Cozinha</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.dependencies.cafeteria"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Refeitório</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.dependencies.court"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Quadra Esportiva</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.dependencies.playground"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Parque Infantil</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Utilidades */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">Utilidades</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="infrastructure.utilities.water"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Abastecimento de Água</FormLabel>
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
                                <SelectItem value="public">Rede Pública</SelectItem>
                                <SelectItem value="well">Poço Artesiano</SelectItem>
                                <SelectItem value="cistern">Cisterna</SelectItem>
                                <SelectItem value="none">Não possui</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.utilities.energy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Energia Elétrica</FormLabel>
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
                                <SelectItem value="public">Rede Pública</SelectItem>
                                <SelectItem value="generator">Gerador</SelectItem>
                                <SelectItem value="none">Não possui</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.utilities.sewage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Esgoto</FormLabel>
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
                                <SelectItem value="public">Rede Pública</SelectItem>
                                <SelectItem value="septic">Fossa Séptica</SelectItem>
                                <SelectItem value="none">Não possui</SelectItem>
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
                        name="infrastructure.utilities.internet.type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Internet</FormLabel>
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
                                <SelectItem value="fiber">Fibra Óptica</SelectItem>
                                <SelectItem value="radio">Rádio</SelectItem>
                                <SelectItem value="satellite">Satélite</SelectItem>
                                <SelectItem value="none">Não possui</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.utilities.internet.speed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Velocidade (Mbps)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Equipamentos */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold">Equipamentos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="infrastructure.equipment.computers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Computadores</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.equipment.projectors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Projetores</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.equipment.tvs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Televisões</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="infrastructure.equipment.printers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Impressoras</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value || 0}
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
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
