import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettingsStore } from '@/stores/useSettingsStore.supabase'
import { DashboardLayout, DashboardWidget } from '@/lib/mock-data'
import { GripVertical } from 'lucide-react'

interface DashboardCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DashboardCustomizer({
  open,
  onOpenChange,
}: DashboardCustomizerProps) {
  const { activeLayout, saveDashboardLayout } = useSettingsStore()
  const [widgets, setWidgets] = useState<DashboardWidget[]>(
    activeLayout?.widgets || [],
  )
  const [layoutName, setLayoutName] = useState('')

  const toggleWidget = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
    )
  }

  // Simple reordering mock (move up)
  const moveUp = (index: number) => {
    if (index === 0) return
    const newWidgets = [...widgets]
    const temp = newWidgets[index]
    newWidgets[index] = newWidgets[index - 1]
    newWidgets[index - 1] = temp
    setWidgets(newWidgets)
  }

  const handleSave = () => {
    const newLayout: DashboardLayout = {
      id: layoutName
        ? layoutName.toLowerCase().replace(/\s/g, '-')
        : activeLayout?.id || 'custom',
      name: layoutName || activeLayout?.name || 'Layout Personalizado',
      widgets,
    }
    saveDashboardLayout(newLayout)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Personalizar Dashboard</DialogTitle>
          <DialogDescription>
            Escolha quais informações exibir e organize sua visão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Layout (Opcional para salvar novo)</Label>
            <Input
              placeholder="Ex: Minha Visão Gerencial"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Widgets Disponíveis</Label>
            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-2">
                {widgets.map((widget, index) => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-2 border rounded bg-background hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 cursor-move"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={widget.id}
                          checked={widget.visible}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                        <label
                          htmlFor={widget.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {widget.title}
                        </label>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground uppercase">
                      {widget.type}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Layout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
