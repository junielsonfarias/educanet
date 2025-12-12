import { useState } from 'react'
import { Plus, Pencil, Calculator, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import useCourseStore from '@/stores/useCourseStore'
import { EvaluationRule } from '@/lib/mock-data'
import { EvaluationRuleFormDialog } from './components/EvaluationRuleFormDialog'

export default function EvaluationRulesList() {
  const { evaluationRules, addEvaluationRule, updateEvaluationRule } =
    useCourseStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<EvaluationRule | null>(null)

  const handleAdd = () => {
    setSelectedRule(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (rule: EvaluationRule) => {
    setSelectedRule(rule)
    setIsDialogOpen(true)
  }

  const handleSave = (data: Omit<EvaluationRule, 'id'>) => {
    if (selectedRule) {
      updateEvaluationRule(selectedRule.id, data)
    } else {
      addEvaluationRule(data)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Regras de Avaliação
          </h2>
          <p className="text-muted-foreground">
            Gerencie as fórmulas de cálculo de notas e critérios de aprovação.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Nova Regra
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Regras Configuradas</CardTitle>
            <CardDescription>
              Lista de todas as regras de avaliação disponíveis para uso nos
              cursos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Média Aprovação</TableHead>
                  <TableHead>Fórmula Personalizada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluationRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{rule.name}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {rule.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.type === 'numeric' ? 'Numérica' : 'Descritiva'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rule.type === 'numeric' ? rule.passingGrade : '-'}
                    </TableCell>
                    <TableCell>
                      {rule.formula ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calculator className="h-4 w-4 text-muted-foreground" />
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                            {rule.formula}
                          </code>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm flex items-center gap-2">
                          {rule.type === 'numeric' && (
                            <Check className="h-3 w-3" />
                          )}
                          {rule.type === 'numeric' ? 'Média Aritmética' : 'N/A'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">
              Como funcionam as fórmulas?
            </h4>
            <p className="text-sm opacity-90">
              Caso nenhuma fórmula seja definida, o sistema utilizará a média
              aritmética simples das notas dos períodos. Para fórmulas
              personalizadas, utilize as variáveis <code>eval1</code>,{' '}
              <code>eval2</code>, etc. para representar a nota de cada
              bimestre/período.
            </p>
            <p className="text-sm font-mono mt-2 bg-white/50 p-2 rounded">
              Exemplo Ponderado: ((eval1 * 2) + (eval2 * 3) + (eval3 * 2) +
              (eval4 * 3)) / 10
            </p>
          </div>
        </div>
      </div>

      <EvaluationRuleFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        rule={selectedRule}
        onSave={handleSave}
      />
    </div>
  )
}
