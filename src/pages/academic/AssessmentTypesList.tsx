import { useState, useEffect } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  AlertCircle,
  Search,
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
import { useAssessmentStore } from '@/stores/useAssessmentStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { AssessmentTypeFormDialog } from './components/AssessmentTypeFormDialog'
import { toast } from 'sonner'
import { RequirePermission } from '@/components/RequirePermission'
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

// Tipo temporário até implementar assessment types no BD
interface AssessmentType {
  id: string
  name: string
  description?: string
  applicableGradeIds: string[]
  excludeFromAverage: boolean
}

export default function AssessmentTypesList() {
  const { grades, loading: gradesLoading, fetchGrades } = useAssessmentStore()
  const { courses, loading: coursesLoading, fetchCourses } = useCourseStore()
  
  // TODO: Assessment types precisam ser implementadas no BD
  // Por enquanto, usando array local temporário
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<AssessmentType | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchGrades()
    fetchCourses()
    // TODO: Buscar assessment types do BD quando implementado
  }, [fetchGrades, fetchCourses])

  const handleCreate = (data: Record<string, unknown>) => {
    // TODO: Criar no BD quando implementado
    const newType: AssessmentType = {
      id: `type-${Date.now()}`,
      ...data,
    }
    setAssessmentTypes(types => [...types, newType])
    toast.success('Tipo de avaliação criado com sucesso.')
    setIsDialogOpen(false)
  }

  const handleUpdate = (data: Record<string, unknown>) => {
    if (editingType?.id) {
      // TODO: Atualizar no BD quando implementado
      setAssessmentTypes(types =>
        types.map(t => t.id === editingType.id ? { ...editingType, ...data } : t)
      )
      toast.success('Tipo de avaliação atualizado com sucesso.')
      setEditingType(null)
      setIsDialogOpen(false)
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      // TODO: Deletar no BD quando implementado
      setAssessmentTypes(types => types.filter(t => t.id !== deleteId))
      toast.success('Tipo de avaliação excluído com sucesso.')
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

  const getGradeNames = (gradeIds: string[]) => {
    // TODO: Adaptar quando courses estiverem no formato correto
    // Por enquanto, retornar IDs
    return gradeIds.length > 0 ? `${gradeIds.length} série(s)` : 'Nenhuma'
  }

  const filteredTypes = assessmentTypes.filter((type) =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Tipos de Avaliação
          </h2>
          <p className="text-muted-foreground">
            Gerencie os tipos de atividades avaliativas e suas regras.
          </p>
        </div>
        <RequirePermission permission="create:assessment">
          <Button onClick={openCreateDialog} className="w-full sm:w-auto">
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Novo Tipo
          </Button>
        </RequirePermission>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos Definidos</CardTitle>
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

          {loading || gradesLoading || coursesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
              <p className="mb-2">Nenhum tipo de avaliação encontrado.</p>
              <p className="text-sm">Esta funcionalidade será implementada em breve no banco de dados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Séries Aplicáveis</TableHead>
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
                        {type.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {type.description || '-'}
                    </TableCell>
                    <TableCell
                      className="max-w-[250px] truncate"
                      title={getGradeNames(type.applicableGradeIds)}
                    >
                      {getGradeNames(type.applicableGradeIds) || 'Nenhuma'}
                    </TableCell>
                    <TableCell>
                      {type.excludeFromAverage ? (
                        <Badge variant="secondary">Não Contabiliza</Badge>
                      ) : (
                        <Badge variant="default">Contabiliza</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <RequirePermission permission="edit:assessment">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(type)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </RequirePermission>
                        <RequirePermission permission="delete:assessment">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(type.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </RequirePermission>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AssessmentTypeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingType ? handleUpdate : handleCreate}
        initialData={editingType}
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
