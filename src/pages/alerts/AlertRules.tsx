import { useState } from 'react'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import useAlertStore from '@/stores/useAlertStore'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

const ruleSchema = z.object({
  name: z.string().min(3, 'Nome da regra obrigatório'),
  type: z.enum(['dropout_risk', 'low_performance', 'system']),
  target: z.enum(['attendance', 'grade']),
  condition: z.enum(['lt', 'gt']),
  threshold: z.coerce.number().min(0),
  roles: z.array(z.string()).min(1, 'Selecione pelo menos um destinatário'),
  active: z.boolean().default(true),
})

export default function AlertRules() {
  const { rules, addRule, deleteRule, updateRule } = useAlertStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      type: 'low_performance',
      target: 'grade',
      condition: 'lt',
      threshold: 60,
      roles: ['admin', 'coordinator'],
      active: true,
    },
  })

  const onSubmit = (data: z.infer<typeof ruleSchema>) => {
    addRule(data as any)
    setOpen(false)
    form.reset()
    toast({
      title: 'Regra Criada',
      description: 'A nova regra de alerta foi configurada com sucesso.',
    })
  }

  const toggleActive = (id: string, current: boolean) => {
    updateRule(id, { active: !current })
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/alertas')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Regras de Alerta
          </h1>
          <p className="text-muted-foreground">
            Configure os critérios automáticos para geração de notificações.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Regras Ativas</CardTitle>
            <CardDescription>
              Definições de monitoramento automático.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Configurar Nova Regra</DialogTitle>
                <DialogDescription>
                  Defina as condições para disparar alertas automáticos.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Regra</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Alerta de Nota Vermelha"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Alerta</FormLabel>
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
                              <SelectItem value="low_performance">
                                Baixo Desempenho
                              </SelectItem>
                              <SelectItem value="dropout_risk">
                                Risco de Evasão
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Métrica Alvo</FormLabel>
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
                              <SelectItem value="grade">
                                Nota (Média)
                              </SelectItem>
                              <SelectItem value="attendance">
                                Frequência (%)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condição</FormLabel>
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
                              <SelectItem value="lt">Menor que</SelectItem>
                              <SelectItem value="gt">Maior que</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Limite</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="roles"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">
                            Destinatários
                          </FormLabel>
                          <FormDescription>
                            Quem deve receber este alerta?
                          </FormDescription>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {[
                            'admin',
                            'supervisor',
                            'coordinator',
                            'teacher',
                          ].map((role) => (
                            <FormField
                              key={role}
                              control={form.control}
                              name="roles"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={role}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(role)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...field.value,
                                                role,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== role,
                                                ),
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal capitalize">
                                      {role === 'teacher'
                                        ? 'Professor'
                                        : role === 'coordinator'
                                          ? 'Coordenador'
                                          : role}
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

                  <DialogFooter>
                    <Button type="submit">Salvar Regra</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <Badge variant="outline">{rule.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Se {rule.target === 'grade' ? 'Nota' : 'Frequência'}{' '}
                    {rule.condition === 'lt' ? 'menor que' : 'maior que'}{' '}
                    <strong>{rule.threshold}</strong>.
                  </p>
                  <div className="text-xs text-muted-foreground mt-1 flex gap-1">
                    Destinatários:{' '}
                    {rule.roles.map((r) => (
                      <Badge
                        key={r}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.active}
                      onCheckedChange={() => toggleActive(rule.id, rule.active)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
