import { useState } from 'react'
import { Plus, Edit, Trash2, GraduationCap, AlertCircle } from 'lucide-react'
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
import useAssessmentStore from '@/stores/useAssessmentStore'
import useCourseStore from '@/stores/useCourseStore'
import { AssessmentTypeFormDialog } from './components/AssessmentTypeFormDialog'
import { useToast } from '@/hooks/use-toast'
import { AssessmentType } from '@/lib/mock-data'
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

export default function AssessmentTypesList() {
  const {
    assessmentTypes,
    addAssessmentType,
    updateAssessmentType,
    deleteAssessmentType,
  } = useAssessmentStore()
  const { courses } = useCourseStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<AssessmentType | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCreate = (data: any) => {
    addAssessmentType(data)
    toast({
      title: 'Tipo Criado',
      description: 'O novo tipo de avaliação foi adicionado com sucesso.',
    })
  }

  const handleUpdate = (data: any) => {
    if (editingType?.id) {
      updateAssessmentType(editingType.id, data)
      toast({
        title: 'Tipo Atualizado',
        description: 'As alterações foram salvas.',
      })
    }
    setEditingType(null)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteAssessmentType(deleteId)
      toast({
        title: 'Tipo Excluído',
        description: 'Registro removido com sucesso.',
      })
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
    const allGrades = courses.flatMap((c) =>
      c.grades.map((g) => ({ ...g, courseName: c.name })),
    )
    const names = gradeIds.map((id) => allGrades.find((g) => g.id === id)?.name)
    return names.filter(Boolean).join(', ')
  }

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
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos Definidos</CardTitle>
          <CardDescription>
            Configurações de avaliações disponíveis para lançamento de notas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessmentTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
              <p>Nenhum tipo de avaliação cadastrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Séries Aplicáveis</TableHead>
                  <TableHead>Média</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessmentTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        {type.name}
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-[300px] truncate"
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
