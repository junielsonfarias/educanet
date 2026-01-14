import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Copy, Calculator, Check, AlertCircle, Percent, BookOpen } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useEvaluationRulesStore } from '@/stores/useEvaluationRulesStore.supabase'
import type { EvaluationRule } from '@/lib/supabase/services'
import { toast } from 'sonner'
import { EvaluationRuleFormDialog } from './components/EvaluationRuleFormDialog'

export default function EvaluationRulesList() {
  const {
    rules,
    loading,
    error,
    fetchRules,
    deleteRule,
    duplicateRule
  } = useEvaluationRulesStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<EvaluationRule | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ruleToDelete, setRuleToDelete] = useState<EvaluationRule | null>(null)

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleAdd = () => {
    setSelectedRule(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (rule: EvaluationRule) => {
    setSelectedRule(rule)
    setIsDialogOpen(true)
  }

  const handleDelete = (rule: EvaluationRule) => {
    setRuleToDelete(rule)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (ruleToDelete) {
      await deleteRule(ruleToDelete.id)
      toast.success('Regra excluída com sucesso.')
      setDeleteDialogOpen(false)
      setRuleToDelete(null)
    }
  }

  const handleDuplicate = async (rule: EvaluationRule) => {
    const newName = `${rule.name} (Cópia)`
    const result = await duplicateRule(rule.id, newName)
    if (result) {
      toast.success('Regra duplicada com sucesso.')
    } else {
      toast.error('Erro ao duplicar regra.')
    }
  }

  const handleSaveSuccess = () => {
    setSelectedRule(null)
    setIsDialogOpen(false)
    fetchRules()
  }

  const getCalculationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'Media_Simples': 'Média Simples',
      'Media_Ponderada': 'Média Ponderada',
      'Soma_Notas': 'Soma de Notas',
      'Descritiva': 'Descritiva'
    }
    return types[type] || type
  }

  const getPeriodTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'Bimestre': 'Bimestral',
      'Trimestre': 'Trimestral',
      'Semestre': 'Semestral',
      'Anual': 'Anual'
    }
    return types[type] || type
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Regras de Avaliação
          </h2>
          <p className="text-muted-foreground">
            Gerencie as regras de aprovação, frequência mínima e cálculo de médias.
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
        >
          <div className="p-1 rounded-md bg-white/20 mr-2">
            <Plus className="h-5 w-5" />
          </div>
          Nova Regra
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Total de Regras</p>
                <p className="text-2xl font-bold text-purple-700">{rules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600">Média Simples</p>
                <p className="text-2xl font-bold text-green-700">
                  {rules.filter(r => r.calculation_type === 'Media_Simples').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Percent className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Média Ponderada</p>
                <p className="text-2xl font-bold text-blue-700">
                  {rules.filter(r => r.calculation_type === 'Media_Ponderada').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Descritiva</p>
                <p className="text-2xl font-bold text-amber-700">
                  {rules.filter(r => r.calculation_type === 'Descritiva').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error}
        </div>
      )}

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
              Lista de todas as regras de avaliação disponíveis para uso nos cursos e séries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nota Mín.</TableHead>
                  <TableHead>Freq. Mín.</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Cálculo</TableHead>
                  <TableHead>Recuperação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 opacity-50" />
                        <p>Nenhuma regra de avaliação configurada.</p>
                        <p className="text-sm">Clique em "Nova Regra" para criar.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow
                      key={`rule-${rule.id}`}
                      className="border-l-4 border-l-transparent hover:border-l-purple-500 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all duration-200"
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{rule.name}</span>
                          {rule.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                              {rule.description}
                            </span>
                          )}
                          {(rule.course || rule.education_grade) && (
                            <div className="flex gap-1 mt-1">
                              {rule.course && (
                                <Badge variant="outline" className="text-xs">
                                  {rule.course.name}
                                </Badge>
                              )}
                              {rule.education_grade && (
                                <Badge variant="secondary" className="text-xs">
                                  {rule.education_grade.grade_name}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {rule.min_approval_grade.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {rule.min_attendance_percent}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getPeriodTypeLabel(rule.academic_period_type)}
                          <span className="text-muted-foreground ml-1">
                            ({rule.periods_per_year}x)
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.calculation_type === 'Descritiva' ? 'secondary' : 'default'}
                          className={
                            rule.calculation_type === 'Media_Ponderada'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : rule.calculation_type === 'Descritiva'
                              ? 'bg-amber-100 text-amber-700'
                              : ''
                          }
                        >
                          {getCalculationTypeLabel(rule.calculation_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.allow_recovery ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500">
                            Não
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(rule)}
                            title="Duplicar"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rule)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
              Como funcionam as regras?
            </h4>
            <p className="text-sm opacity-90">
              As regras de avaliação definem os critérios de aprovação para cada curso ou série.
              Incluem nota mínima, frequência mínima obrigatória e o tipo de cálculo da média final.
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li><strong>Média Simples:</strong> Soma das notas dividida pelo número de avaliações</li>
              <li><strong>Média Ponderada:</strong> Cada avaliação tem peso diferente no cálculo</li>
              <li><strong>Descritiva:</strong> Avaliação qualitativa sem nota numérica (Educação Infantil)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Dialog de Edição/Criação */}
      <EvaluationRuleFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        rule={selectedRule}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Regra de Avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a regra "{ruleToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
