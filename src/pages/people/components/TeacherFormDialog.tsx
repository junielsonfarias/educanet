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
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadFile } from '@/lib/supabase/storage'
import { toast } from 'sonner'
import type { TeacherFullInfo } from '@/lib/database-types'

const teacherSchema = z.object({
  // Dados pessoais
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(8, 'Telefone inválido'),
  cpf: z.string().optional(),
  dateOfBirth: z.string().optional(),
  
  // Dados profissionais
  schoolId: z.number().optional(),
  employmentStatus: z.enum(['active', 'inactive', 'on_leave', 'retired']),
  hireDate: z.string().min(1, 'Data de contratação obrigatória'),
  
  // Avatar
  avatarUrl: z.string().optional(),
})

interface TeacherFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
  initialData?: TeacherFullInfo | null
}

export function TeacherFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: TeacherFormDialogProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      cpf: '',
      dateOfBirth: '',
      employmentStatus: 'active',
      hireDate: '',
      schoolId: undefined,
      avatarUrl: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          firstName: initialData.person.first_name,
          lastName: initialData.person.last_name,
          email: initialData.person.email || '',
          phone: initialData.person.phone || '',
          cpf: initialData.person.cpf || '',
          dateOfBirth: initialData.person.date_of_birth || '',
          employmentStatus: initialData.employment_status || 'active',
          hireDate: initialData.hire_date || '',
          schoolId: initialData.school_id || undefined,
          avatarUrl: initialData.person.avatar_url || '',
        })
        setPhotoPreview(initialData.person.avatar_url || null)
      } else {
        form.reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          cpf: '',
          dateOfBirth: '',
          employmentStatus: 'active',
          hireDate: '',
          schoolId: undefined,
          avatarUrl: '',
        })
        setPhotoPreview(null)
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
      const filePath = `teachers/${Date.now()}-${file.name}`
      const uploadResult = await uploadFile({
        bucket: 'avatars',
        file,
        path: filePath,
        upsert: true,
      })

      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Erro ao fazer upload da foto')
      }

      setPhotoPreview(uploadResult.publicUrl)
      form.setValue('avatarUrl', uploadResult.publicUrl)
      toast.success('Foto carregada com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload da foto')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (data: z.infer<typeof teacherSchema>) => {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Professor' : 'Novo Professor'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize os dados do professor.'
              : 'Cadastre um novo professor na rede municipal.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="space-y-4 py-4">
              {/* Foto do Professor */}
              <div className="flex gap-4 items-start">
                <div className="w-24 shrink-0">
                  <FormLabel>Foto</FormLabel>
                  <div
                    className="mt-2 w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20 relative cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : photoPreview ? (
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
                            form.setValue('avatarUrl', '')
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                        >
                          <X className="h-3 w-3" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Upload className="h-5 w-5 mb-1" />
                        <span className="text-[9px]">Upload</span>
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

                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome *</FormLabel>
                          <FormControl>
                            <Input placeholder="Sobrenome" {...field} />
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
                      name="dateOfBirth"
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
                  </div>
                </div>
              </div>

              {/* Outros campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail *</FormLabel>
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
                  name="hireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Contratação *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employmentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                          <SelectItem value="on_leave">De Licença</SelectItem>
                          <SelectItem value="retired">Aposentado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
