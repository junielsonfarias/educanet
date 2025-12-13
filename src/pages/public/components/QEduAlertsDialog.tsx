import { useState, useEffect } from 'react'
import { Bell, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export type AlertRule = {
  id: string
  indicator: 'IDEB' | 'Approval'
  operator: 'gt' | 'lt'
  value: number
  enabled: boolean
}

interface QEduAlertsDialogProps {
  onRulesChange: (rules: AlertRule[]) => void
  currentRules: AlertRule[]
}

export function QEduAlertsDialog({
  onRulesChange,
  currentRules,
}: QEduAlertsDialogProps) {
  const [open, setOpen] = useState(false)
  const [rules, setRules] = useState<AlertRule[]>(currentRules)
  const { toast } = useToast()

  // New Rule State
  const [newIndicator, setNewIndicator] = useState<'IDEB' | 'Approval'>('IDEB')
  const [newOperator, setNewOperator] = useState<'gt' | 'lt'>('gt')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    setRules(currentRules)
  }, [currentRules, open])

  const addRule = () => {
    if (!newValue) return

    const rule: AlertRule = {
      id: Math.random().toString(36).substring(2, 11),
      indicator: newIndicator,
      operator: newOperator,
      value: Number(newValue),
      enabled: true,
    }

    setRules([...rules, rule])
    setNewValue('')
  }

  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id))
  }

  const handleSave = () => {
    onRulesChange(rules)
    setOpen(false)
    toast({
      title: 'Alertas configurados',
      description: 'Você será notificado quando os dados forem atualizados.',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Bell className="h-4 w-4" />
          Configurar Alertas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Alertas Personalizados</DialogTitle>
          <DialogDescription>
            Receba notificações quando os indicadores atingirem determinados
            valores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add Rule Form */}
          <div className="bg-secondary/20 p-4 rounded-lg space-y-4">
            <h4 className="text-sm font-medium">Adicionar Nova Regra</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Indicador</Label>
                <Select
                  value={newIndicator}
                  onValueChange={(v: any) => setNewIndicator(v)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDEB">IDEB</SelectItem>
                    <SelectItem value="Approval">Aprovação %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Condição</Label>
                <Select
                  value={newOperator}
                  onValueChange={(v: any) => setNewOperator(v)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">Maior que</SelectItem>
                    <SelectItem value="lt">Menor que</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    className="h-8"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Ex: 6.0"
                  />
                  <Button
                    size="sm"
                    className="h-8 px-2"
                    onClick={addRule}
                    disabled={!newValue}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* List Rules */}
          <div className="space-y-2">
            <Label>Regras Ativas</Label>
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4 border rounded-md border-dashed">
                Nenhum alerta configurado.
              </p>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 border rounded-md bg-background"
                  >
                    <div className="text-sm">
                      <span className="font-semibold">{rule.indicator}</span>{' '}
                      {rule.operator === 'gt' ? 'maior que' : 'menor que'}{' '}
                      <span className="font-bold">{rule.value}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => removeRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Preferências</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
