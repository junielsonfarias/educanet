import { useState, useEffect } from 'react'
import { Plus, BookOpen, Layers, Loader2, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { useNavigate } from 'react-router-dom'
import { CourseFormDialog } from './components/CourseFormDialog'
import { useToast } from '@/hooks/use-toast'

interface CourseWithSeries {
  id: number
  name: string
  education_level?: string
  description?: string
  codigoCenso?: string
  seriesCount?: number
  series?: Array<{ id: number; grade_name: string; grade_order?: number }>
}

export default function CoursesList() {
  const { courses, fetchCourses, createCourse, updateCourse, deleteCourse, loading } = useCourseStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseWithSeries | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<CourseWithSeries | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleCreate = async (data: Record<string, unknown>) => {
    const result = await createCourse(data)
    if (result) {
      toast({
        title: 'Etapa de ensino criada',
        description: `${data.name} foi adicionada com sucesso.`,
      })
      setIsDialogOpen(false)
    }
  }

  const handleEdit = (course: CourseWithSeries) => {
    setEditingCourse(course)
    setIsDialogOpen(true)
  }

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editingCourse) return

    const result = await updateCourse(editingCourse.id, data)
    if (result) {
      toast({
        title: 'Etapa de ensino atualizada',
        description: `${data.name} foi atualizada com sucesso.`,
      })
      setIsDialogOpen(false)
      setEditingCourse(null)
    }
  }

  const handleDelete = async () => {
    if (!courseToDelete) return

    await deleteCourse(courseToDelete.id)
    toast({
      title: 'Etapa de ensino excluída',
      description: `${courseToDelete.name} foi removida com sucesso.`,
    })
    setCourseToDelete(null)
  }

  const handleCloseDialog = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingCourse(null)
    }
  }

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando etapas de ensino...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Etapas de Ensino
          </h2>
          <p className="text-muted-foreground">
            Gerencie as etapas de ensino, séries/anos e grades curriculares.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCourse(null)
            setIsDialogOpen(true)
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
        >
          <div className="p-1 rounded-md bg-white/20 mr-2">
            <Plus className="h-5 w-5" />
          </div>
          Nova Etapa de Ensino
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Lista de Etapas de Ensino
          </CardTitle>
          <CardDescription>
            {courses.length} etapa{courses.length !== 1 ? 's' : ''} cadastrada{courses.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma etapa de ensino cadastrada.</p>
              <p className="text-sm mt-2">Comece adicionando uma nova etapa.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[300px]">Nome</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Séries/Anos</TableHead>
                  <TableHead className="w-[300px]">Séries Cadastradas</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => {
                  const courseData = course as CourseWithSeries
                  const courseLevel = courseData.education_level || ''
                  const seriesCount = courseData.seriesCount || courseData.series?.length || 0
                  const series = courseData.series || []

                  return (
                    <TableRow
                      key={courseData.id}
                      className="cursor-pointer hover:bg-primary/5 transition-colors group"
                      onClick={() => navigate(`/academico/cursos/${courseData.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800">
                            <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                          </div>
                          <div>
                            <div className="font-medium">{courseData.name}</div>
                            {courseData.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {courseData.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {courseLevel && (
                          <Badge variant="outline" className="text-xs">
                            {courseLevel}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          <Layers className="h-3 w-3 mr-1" />
                          {seriesCount} série{seriesCount !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {series.slice(0, 4).map((s: { id: number; grade_name: string }) => (
                            <Badge key={s.id} variant="outline" className="text-xs font-normal">
                              {s.grade_name}
                            </Badge>
                          ))}
                          {series.length > 4 && (
                            <Badge variant="outline" className="text-xs font-normal">
                              +{series.length - 4}
                            </Badge>
                          )}
                          {series.length === 0 && (
                            <span className="text-xs text-muted-foreground">Nenhuma série</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/academico/cursos/${courseData.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar / Séries
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(courseData)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setCourseToDelete(courseData)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criar/Editar */}
      <CourseFormDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        onSubmit={editingCourse ? handleUpdate : handleCreate}
        initialData={editingCourse ? {
          id: editingCourse.id,
          name: editingCourse.name,
          codigoCenso: editingCourse.codigoCenso || '',
          description: editingCourse.description || '',
          series: editingCourse.series?.map((s, idx) => ({
            name: s.grade_name,
            order: s.grade_order || idx + 1,
            is_final: idx === (editingCourse.series?.length || 0) - 1,
          })) || [],
        } : undefined}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Etapa de Ensino</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir a etapa <strong>{courseToDelete?.name}</strong>?
                <div className="mt-3">
                  Esta ação irá remover:
                </div>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>A etapa de ensino</li>
                  <li>Todas as séries/anos vinculadas ({courseToDelete?.seriesCount || courseToDelete?.series?.length || 0} séries)</li>
                  <li>Vínculos com turmas e disciplinas</li>
                </ul>
                <div className="mt-3 text-destructive font-medium">
                  Esta ação não pode ser desfeita.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Etapa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
