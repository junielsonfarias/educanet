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
import { School } from '@/lib/mock-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, X } from 'lucide-react'
import { fileToBase64 } from '@/lib/file-utils'

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
  inepCode: z.string().optional(),
  director: z.string().min(3, 'Nome do diretor é obrigatório'),
  address: z.string().min(5, 'Endereço é obrigatório'),
  phone: z.string().min(8, 'Telefone inválido'),
  status: z.enum(['active', 'inactive']),
  logo: z.string().optional(),
  administrativeDependency: z
    .enum(['Federal', 'Estadual', 'Municipal', 'Privada'])
    .optional(),
  locationType: z.enum(['Urbana', 'Rural']).optional(),
  educationTypes: z.array(z.string()).optional(),
  infrastructure: z.object({
    classrooms: z.coerce.number().min(0),
    accessible: z.boolean(),
    internet: z.boolean(),
    library: z.boolean(),
    lab: z.boolean(),
  }),
})

interface SchoolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: School | null
}

export function SchoolFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: SchoolFormDialogProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof schoolSchema>>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
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
      educationTypes: [],
      infrastructure: {
        classrooms: 0,
        accessible: false,
        internet: false,
        library: false,
        lab: false,
      },
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          code: initialData.code,
          inepCode: initialData.inepCode || '',
          director: initialData.director,
          address: initialData.address,
          phone: initialData.phone,
          status: initialData.status,
          logo: initialData.logo || '',
          administrativeDependency:
            initialData.administrativeDependency || 'Municipal',
          locationType: initialData.locationType || 'Urbana',
          educationTypes: initialData.educationTypes || [],
          infrastructure: initialData.infrastructure || {
            classrooms: 0,
            accessible: false,
            internet: false,
            library: false,
            lab: false,
          },
        })
        setLogoPreview(initialData.logo || null)
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
  }, [open, initialData, form])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const base64 = await fileToBase64(file)
        setLogoPreview(base64)
        form.setValue('logo', base64)
      } catch (error) {
        console.error('Error reading file', error)
      }
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    form.setValue('logo', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (data: z.infer<typeof schoolSchema>) => {
    onSubmit(data)
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                <TabsTrigger value="census">Censo Escolar / INEP</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 py-4">
                <div className="flex gap-4">
                  {/* Logo Upload Section */}
                  <div className="w-32 shrink-0">
                    <FormLabel>Logo da Escola</FormLabel>
                    <div
                      className="mt-2 w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20 relative cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoPreview ? (
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
                </div>
              </TabsContent>

              <TabsContent value="census" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="inepCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código INEP</FormLabel>
                        <FormControl>
                          <Input placeholder="8 dígitos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

                <div className="space-y-3 border rounded-md p-4">
                  <h4 className="font-medium text-sm">Infraestrutura</h4>

                  <FormField
                    control={form.control}
                    name="infrastructure.classrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Salas de Aula</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <FormField
                      control={form.control}
                      name="infrastructure.accessible"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Acessibilidade</FormLabel>
                            <FormDescription>
                              Recursos disponíveis?
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="infrastructure.internet"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Acesso à Internet</FormLabel>
                            <FormDescription>
                              Banda larga disponível?
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="infrastructure.library"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Biblioteca</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="infrastructure.lab"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Laboratório de Informática</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
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
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
