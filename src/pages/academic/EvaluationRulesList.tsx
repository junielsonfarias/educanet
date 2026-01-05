import { useState, useEffect } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { toast } from 'sonner'
import { EvaluationRuleFormDialog } from './components/EvaluationRuleFormDialog'
import { RequirePermission } from '@/components/RequirePermission'

// Tipo temporário até implementar evaluation rules no BD
interface EvaluationRule {
  id: string
  name: string
  description?: string
  type: 'numeric' | 'descriptive'
  passingGrade?: number
  formula?: string
}

export default function EvaluationRulesList() {
  const { courses, loading, fetchCourses } = useCourseStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<EvaluationRule | null>(null)
  
  // TODO: Evaluation rules precisam ser implementadas no BD
  // Por enquanto, usando array local temporário
  const [evaluationRules, setEvaluationRules] = useState<EvaluationRule[]>([])

  useEffect(() => {
    fetchCourses()
    // TODO: Buscar evaluation rules do BD quando implementado
    // Por enquanto, manter array vazio ou carregar de system_settings
  }, [fetchCourses])

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
      // TODO: Atualizar no BD quando implementado
      setEvaluationRules(rules => 
        rules.map(r => r.id === selectedRule.id ? { ...selectedRule, ...data } : r)
      )
      toast.success('Regra atualizada com sucesso.')
    } else {
      // TODO: Criar no BD quando implementado
      const newRule: EvaluationRule = {
        id: `rule-${Date.now()}`,
        ...data,
      }
      setEvaluationRules(rules => [...rules, newRule])
      toast.success('Regra criada com sucesso.')
    }
    setSelectedRule(null)
    setIsDialogOpen(false)
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
        <RequirePermission permission="create:course">
          <Button 
            onClick={handleAdd}
            className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Nova Regra
          </Button>
        </RequirePermission>
      </div>

      <div className="grid gap-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-white border-purple-200/50 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
              Regras Configuradas
            </CardTitle>
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
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : evaluationRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 opacity-50" />
                        <p>Nenhuma regra de avaliação configurada.</p>
                        <p className="text-sm">Esta funcionalidade será implementada em breve.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  evaluationRules.map((rule) => (
                    <TableRow 
                      key={`rule-${rule.id}`}
                      className="border-l-4 border-l-transparent hover:border-l-purple-500 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all duration-200"
                    >
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
                        <RequirePermission permission="edit:course">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rule)}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </Button>
                        </RequirePermission>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
