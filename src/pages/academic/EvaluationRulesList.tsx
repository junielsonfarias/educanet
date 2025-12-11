import { useState } from 'react'
import { Plus, Edit, Scale, Star, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import useCourseStore from '@/stores/useCourseStore'
import { EvaluationRuleFormDialog } from './components/EvaluationRuleFormDialog'
import { useToast } from '@/hooks/use-toast'
import { EvaluationRule } from '@/lib/mock-data'

export default function EvaluationRulesList() {
  const { evaluationRules, addEvaluationRule, updateEvaluationRule } =
    useCourseStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<EvaluationRule | null>(null)
  const { toast } = useToast()

  const handleCreate = (data: any) => {
    addEvaluationRule(data)
    toast({
      title: 'Regra Criada',
      description: 'A nova regra de avaliação foi adicionada com sucesso.',
    })
  }

  const handleUpdate = (data: any) => {
    if (editingRule?.id) {
      updateEvaluationRule(editingRule.id, data)
      toast({
        title: 'Regra Atualizada',
        description: 'As alterações na regra de avaliação foram salvas.',
      })
    }
    setEditingRule(null)
  }

  const openEditDialog = (rule: EvaluationRule) => {
    setEditingRule(rule)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingRule(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Regras de Avaliação
          </h2>
          <p className="text-muted-foreground">
            Defina critérios de aprovação, fórmulas e recuperação.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Regra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conjuntos de Regras Definidos</CardTitle>
          <CardDescription>
            Estas regras podem ser aplicadas às séries e turmas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cálculo</TableHead>
                <TableHead>Critérios</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluationRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span>{rule.name}</span>
                        {rule.isStandard && (
                          <Badge
                            variant="outline"
                            className="text-amber-500 border-amber-500/20 bg-amber-500/10 gap-1 h-5 px-1.5 text-[10px]"
                          >
                            <Star className="h-3 w-3 fill-amber-500" /> Padrão
                          </Badge>
                        )}
                      </div>
                      <span
                        className="text-xs text-muted-foreground truncate max-w-[200px]"
                        title={rule.description}
                      >
                        {rule.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rule.type === 'numeric' ? 'default' : 'secondary'
                      }
                    >
                      {rule.type === 'numeric' ? 'Numérica' : 'Descritiva'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rule.formula ? (
                      <div
                        className="flex items-center gap-1 text-sm font-mono text-muted-foreground"
                        title={rule.formula}
                      >
                        <Calculator className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">
                          {rule.formula}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rule.type === 'numeric' ? (
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <Scale className="h-3 w-3 text-muted-foreground" />
                          <span>Média: ≥ {rule.passingGrade?.toFixed(1)}</span>
                        </div>
                        {rule.minDependencyGrade !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            Dep: ≥ {rule.minDependencyGrade?.toFixed(1)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Qualitativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EvaluationRuleFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingRule ? handleUpdate : handleCreate}
        initialData={editingRule}
      />
    </div>
  )
}
