import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Check, ChevronsUpDown } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { mockSchools, User } from '@/lib/mock-data'

const formSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    role: z.enum(['admin', 'supervisor', 'coordinator', 'administrative'], {
      required_error: 'Selecione um perfil',
    }),
    schoolIds: z.array(z.string()).optional(),
    schoolId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.role === 'coordinator' &&
        (!data.schoolIds || data.schoolIds.length === 0)
      ) {
        return false
      }
      return true
    },
    {
      message: 'Selecione pelo menos uma escola',
      path: ['schoolIds'],
    },
  )
  .refine(
    (data) => {
      if (data.role === 'administrative' && !data.schoolId) {
        return false
      }
      return true
    },
    {
      message: 'Selecione uma escola',
      path: ['schoolId'],
    },
  )

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: z.infer<typeof formSchema>) => void
  initialData?: User | null
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: UserFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
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
          password: initialData.password || '',
          role: initialData.role,
          schoolIds: initialData.schoolIds || [],
          schoolId: initialData.schoolId || '',
        })
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
          role: 'administrative',
          schoolIds: [],
          schoolId: '',
        })
      }
    }
  }, [open, initialData, form])

  const role = form.watch('role')
  const [comboboxOpen, setComboboxOpen] = useState(false)

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para {initialData ? 'editar' : 'criar'} um
            usuário.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
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
                      <Input placeholder="joao@escola.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil de Acesso</FormLabel>
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
                    <FormDescription>
                      Define o nível de permissão no sistema.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
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
              <Button type="submit">Salvar Usuário</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
