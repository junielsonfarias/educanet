import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  Search,
  RefreshCw,
  BookOpen,
  Target,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAssessmentStore } from '@/stores/useAssessmentStore.supabase'
import { AssessmentTypeFormDialog, type AssessmentTypeFormData } from './components/AssessmentTypeFormDialog'
import { EmptyState } from '@/components/ui/empty-state'
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
import type { AssessmentType } from '@/stores/useAssessmentStore.supabase'

export default function AssessmentTypesList() {
  const {
    assessmentTypes,
    loadingTypes,
    fetchAssessmentTypes,
    createAssessmentType,
    updateAssessmentType,
    deleteAssessmentType,
  } = useAssessmentStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<AssessmentType | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAssessmentTypes()
  }, [fetchAssessmentTypes])

  // Converter dados do formulário para o formato do service (camelCase -> snake_case)
  const formDataToServiceData = (data: AssessmentTypeFormData) => ({
    name: data.name,
    code: data.code || undefined,
    description: data.description || undefined,
    weight: data.weight,
    max_score: data.maxScore,
    passing_score: data.passingScore,
    exclude_from_average: data.excludeFromAverage,
    is_recovery: data.isRecovery,
    replaces_lowest: data.replacesLowest,
    is_mandatory: data.isMandatory,
    applicable_period_type: data.applicablePeriodType,
    applicable_grade_ids: data.applicableGradeIds || [],
  })

  // Converter dados do service para o formato do formulário (snake_case -> camelCase)
  const serviceDataToFormData = (type: AssessmentType): AssessmentTypeFormData => ({
    id: type.id,
    name: type.name,
    code: type.code || '',
    description: type.description || '',
    weight: type.weight || 1,
    maxScore: type.max_score || 10,
    passingScore: type.passing_score || 6,
    excludeFromAverage: type.exclude_from_average || false,
    isRecovery: type.is_recovery || false,
    replacesLowest: type.replaces_lowest || false,
    isMandatory: type.is_mandatory !== false,
    applicablePeriodType: type.applicable_period_type || 'bimester',
    applicableGradeIds: type.applicable_grade_ids || [],
  })

  const handleCreate = async (data: AssessmentTypeFormData) => {
    const createData = formDataToServiceData(data)
    const result = await createAssessmentType(createData)
    if (result) {
      setIsDialogOpen(false)
    }
  }

  const handleUpdate = async (data: AssessmentTypeFormData) => {
    if (!editingType?.id) return

    const updateData = formDataToServiceData(data)
    const result = await updateAssessmentType(editingType.id, updateData)
    if (result) {
      setEditingType(null)
      setIsDialogOpen(false)
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAssessmentType(deleteId)
      setDeleteId(null)
    }
  }

  const openEditDialog = (type: AssessmentType) => {
    setEditingType(type)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingType(null)
    setIsDialogOpen(true)
  }

  // Obter dados iniciais para o dialog
  const getInitialData = (type: AssessmentType | null): AssessmentTypeFormData | null => {
    if (!type) return null
    return serviceDataToFormData(type)
  }

  const filteredTypes = useMemo(() => {
    return (assessmentTypes || []).filter((type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [assessmentTypes, searchTerm])

  // Estatísticas
  const stats = useMemo(() => ({
    total: assessmentTypes?.length || 0,
    recovery: assessmentTypes?.filter(t => t.is_recovery)?.length || 0,
    excludedFromAverage: assessmentTypes?.filter(t => t.exclude_from_average)?.length || 0,
  }), [assessmentTypes])

  // Função para traduzir o período
  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      bimester: 'Bimestral',
      semester: 'Semestral',
      annual: 'Anual',
    }
    return labels[period] || period
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Tipos de Avaliação
          </h2>
          <p className="text-muted-foreground">
            Gerencie os tipos de atividades avaliativas (Provas, Trabalhos, Recuperações, etc.)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchAssessmentTypes()}
            disabled={loadingTypes}
          >
            <RefreshCw className={`h-4 w-4 ${loadingTypes ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Novo Tipo
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-white border-purple-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              Total de Tipos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-orange-50/20 to-white border-orange-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              Recuperações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.recovery}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-white border-blue-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-500" />
              Não Contabilizam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.excludedFromAverage}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos Cadastrados</CardTitle>
          <CardDescription>
            Configurações de avaliações disponíveis para lançamento de notas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tipo de avaliação..."
                className="pl-8 max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loadingTypes ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : filteredTypes.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Nenhum tipo de avaliação encontrado"
              description={
                assessmentTypes?.length === 0
                  ? 'Comece criando tipos de avaliação como Prova Bimestral, Trabalho, Recuperação, etc.'
                  : 'Tente ajustar os filtros para encontrar o tipo desejado.'
              }
              action={
                assessmentTypes?.length === 0 ? (
                  <Button
                    onClick={openCreateDialog}
                    className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Tipo
                  </Button>
                ) : undefined
              }
              theme="purple"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Nota Máx.</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Séries</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Média</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.map((type) => (
                    <TableRow
                      key={`type-${type.id}`}
                      className="border-l-4 border-l-transparent hover:border-l-purple-500 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all duration-200"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-gradient-to-br from-purple-100 to-purple-200">
                            <GraduationCap className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div>{type.name}</div>
                            {type.description && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-muted-foreground truncate max-w-[180px] cursor-help">
                                    {type.description}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  {type.description}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {type.code ? (
                          <Badge variant="outline">{type.code}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{type.weight || 1}x</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{type.max_score || 10}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getPeriodLabel(type.applicable_period_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {type.applicable_grade_ids && type.applicable_grade_ids.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="cursor-help">
                                {type.applicable_grade_ids.length} série(s)
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Vinculado a {type.applicable_grade_ids.length} série(s) específica(s)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            Todas
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {type.is_recovery ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            Recuperação
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Regular
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {type.exclude_from_average ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Não Contabiliza
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-100 text-green-700">
                            Contabiliza
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(type)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteId(type.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AssessmentTypeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingType ? handleUpdate : handleCreate}
        initialData={getInitialData(editingType)}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tipo de Avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tipo? Avaliações já lançadas
              podem perder a referência.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
