import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Check, ChevronsUpDown, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  FormDescription,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockSchools, User } from '@/lib/mock-data'

// Validation Schema
const baseSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  role: z.enum(['admin', 'supervisor', 'coordinator', 'administrative'], {
    required_error: 'Selecione um perfil',
  }),
  schoolIds: z.array(z.string()).optional(),
  schoolId: z.string().optional(),
})

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: User | null
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: UserFormDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [comboboxOpen, setComboboxOpen] = useState(false)

  // Dynamic schema based on initialData (Create vs Edit)
  const formSchema = useMemo(() => {
    return baseSchema.superRefine((data, ctx) => {
      // Password validation
      if (!initialData && !data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Senha é obrigatória para novos usuários',
          path: ['password'],
        })
      }

      if (data.password && data.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A senha deve ter no mínimo 6 caracteres',
          path: ['password'],
        })
      }

      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'As senhas não conferem',
          path: ['confirmPassword'],
        })
      }

      // Role specific validation
      if (
        data.role === 'coordinator' &&
        (!data.schoolIds || data.schoolIds.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione pelo menos uma escola',
          path: ['schoolIds'],
        })
      }

      if (data.role === 'administrative' && !data.schoolId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione uma escola',
          path: ['schoolId'],
        })
      }
    })
  }, [initialData])

  const form = useForm<z.infer<typeof baseSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'administrative',
      schoolIds: [],
      schoolId: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          email: initialData.email,
          password: '',
          confirmPassword: '',
          role: initialData.role,
          schoolIds: initialData.schoolIds || [],
          schoolId: initialData.schoolId || '',
        })
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'administrative',
          schoolIds: [],
          schoolId: '',
        })
      }
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [open, initialData, form])

  const role = form.watch('role')

  const handleSubmit = (data: z.infer<typeof baseSchema>) => {
    const submitData = { ...data }

    // Remove password if empty (edit mode)
    if (!submitData.password) {
      delete submitData.password
    }
    // Always remove confirmPassword
    delete (submitData as any).confirmPassword

    // Clean up school data based on role
    if (submitData.role === 'admin' || submitData.role === 'supervisor') {
      delete submitData.schoolId
      delete submitData.schoolIds
    } else if (submitData.role === 'coordinator') {
      delete submitData.schoolId
    } else if (submitData.role === 'administrative') {
      delete submitData.schoolIds
    }

    onSubmit(submitData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Atualize as informações do usuário.'
              : 'Preencha os dados para criar um novo usuário.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
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
                    <FormLabel>E-mail (Login)</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario@escola.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Perfil</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="coordinator">Coordenador</SelectItem>
                        <SelectItem value="administrative">
                          Administrativo
                        </SelectItem>
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha {initialData && '(Opcional)'}</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={initialData ? 'Nova senha' : 'Senha'}
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirme a senha"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {role === 'coordinator' && (
              <FormField
                control={form.control}
                name="schoolIds"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Escolas Vinculadas</FormLabel>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between',
                              !field.value || field.value.length === 0
                                ? 'text-muted-foreground'
                                : '',
                            )}
                          >
                            {field.value && field.value.length > 0
                              ? `${field.value.length} escola(s) selecionada(s)`
                              : 'Selecione as escolas'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar escola..." />
                          <CommandList>
                            <CommandEmpty>
                              Nenhuma escola encontrada.
                            </CommandEmpty>
                            <CommandGroup>
                              {mockSchools.map((school) => (
                                <CommandItem
                                  key={school.id}
                                  value={school.name}
                                  onSelect={() => {
                                    const current = field.value || []
                                    if (current.includes(school.id)) {
                                      field.onChange(
                                        current.filter(
                                          (id) => id !== school.id,
                                        ),
                                      )
                                    } else {
                                      field.onChange([...current, school.id])
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value?.includes(school.id)
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {school.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value?.map((id) => {
                        const school = mockSchools.find((s) => s.id === id)
                        return school ? (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="mr-1 mb-1"
                          >
                            {school.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {role === 'administrative' && (
              <FormField
                control={form.control}
                name="schoolId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola Vinculada</FormLabel>
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
                        {mockSchools.map((school) => (
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
            )}

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
