import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Book,
  Clock,
  Trash2,
  FileBadge,
  Edit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useCourseStore from '@/stores/useCourseStore'
import { GradeFormDialog } from './components/GradeFormDialog'
import { SubjectFormDialog } from './components/SubjectFormDialog'
import { CourseFormDialog } from './components/CourseFormDialog'
import { useToast } from '@/hooks/use-toast'
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

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    courses,
    evaluationRules,
    addGrade,
    updateGrade,
    addSubject,
    updateSubject,
    removeSubject,
    updateCourse,
  } = useCourseStore()
  const { toast } = useToast()

  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false)

  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null)
  const [editingGrade, setEditingGrade] = useState<any>(null)
  const [editingSubject, setEditingSubject] = useState<any>(null)
  const [deleteSubjectData, setDeleteSubjectData] = useState<{
    gradeId: string
    subjectId: string
  } | null>(null)

  const course = courses.find((c) => c.id === id)

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Curso não encontrado</h2>
        <Button onClick={() => navigate('/academico/cursos')}>
          Voltar para Lista
        </Button>
      </div>
    )
  }

  // Handlers for Course
  const handleUpdateCourse = (data: any) => {
    updateCourse(course.id, data)
    toast({
      title: 'Curso atualizado',
      description: 'Nome do curso alterado com sucesso.',
    })
  }

  // Handlers for Grade
  const openAddGradeDialog = () => {
    setEditingGrade(null)
    setIsGradeDialogOpen(true)
  }

  const openEditGradeDialog = (grade: any) => {
    setEditingGrade(grade)
    setIsGradeDialogOpen(true)
  }

  const handleGradeSubmit = (data: any) => {
    if (editingGrade) {
      updateGrade(course.id, editingGrade.id, data)
      toast({ title: 'Série atualizada', description: 'Alterações salvas.' })
    } else {
      addGrade(course.id, data)
      toast({ title: 'Série adicionada', description: 'Nova série criada.' })
    }
  }

  // Handlers for Subject
  const openAddSubjectDialog = (gradeId: string) => {
    setSelectedGradeId(gradeId)
    setEditingSubject(null)
    setIsSubjectDialogOpen(true)
  }

  const openEditSubjectDialog = (gradeId: string, subject: any) => {
    setSelectedGradeId(gradeId)
    setEditingSubject(subject)
    setIsSubjectDialogOpen(true)
  }

  const handleSubjectSubmit = (data: any) => {
    if (!selectedGradeId) return

    if (editingSubject) {
      updateSubject(course.id, selectedGradeId, editingSubject.id, data)
      toast({
        title: 'Disciplina atualizada',
        description: 'Alterações salvas.',
      })
    } else {
      addSubject(course.id, selectedGradeId, data)
      toast({
        title: 'Disciplina adicionada',
        description: 'Disciplina criada com sucesso.',
      })
    }
  }

  const handleDeleteSubject = () => {
    if (deleteSubjectData) {
      removeSubject(
        course.id,
        deleteSubjectData.gradeId,
        deleteSubjectData.subjectId,
      )
      toast({
        title: 'Disciplina removida',
        description: 'A disciplina foi excluída da série.',
      })
      setDeleteSubjectData(null)
    }
  }

  const getRuleName = (ruleId?: string) => {
    return (
      evaluationRules.find((r) => r.id === ruleId)?.name || 'Regra não definida'
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/academico/cursos')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-primary">
              {course.name}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCourseDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Estrutura curricular e regras de avaliação.
          </p>
        </div>
        <Button onClick={openAddGradeDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Série
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Séries e Curriculo</CardTitle>
            <CardDescription>
              Gerencie as séries, disciplinas e regras de avaliação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {course.grades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma série cadastrada neste curso.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {course.grades.map((grade) => (
                  <AccordionItem key={grade.id} value={grade.id}>
                    <AccordionTrigger className="hover:no-underline group">
                      <div className="flex items-center gap-4 w-full pr-4">
                        <span className="font-semibold text-lg">
                          {grade.name}
                        </span>
                        <Badge variant="secondary" className="font-normal">
                          {grade.subjects.length} Disciplinas
                        </Badge>
                        <div className="ml-auto flex items-center gap-4">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <FileBadge className="h-3 w-3" />
                            {getRuleName(grade.evaluationRuleId)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditGradeDialog(grade)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6 px-1">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Book className="h-4 w-4" /> Componentes
                            Curriculares
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAddSubjectDialog(grade.id)}
                          >
                            <Plus className="mr-2 h-3 w-3" /> Adicionar
                            Disciplina
                          </Button>
                        </div>
                        <Separator />
                        {grade.subjects.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">
                            Nenhuma disciplina cadastrada.
                          </p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {grade.subjects.map((subject) => (
                              <div
                                key={subject.id}
                                className="flex items-center justify-between p-3 border rounded-md bg-secondary/10 group/subject"
                              >
                                <div>
                                  <span className="font-medium block">
                                    {subject.name}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3" />
                                    {subject.workload}h
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover/subject:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      openEditSubjectDialog(grade.id, subject)
                                    }
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() =>
                                      setDeleteSubjectData({
                                        gradeId: grade.id,
                                        subjectId: subject.id,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      <CourseFormDialog
        open={isCourseDialogOpen}
        onOpenChange={setIsCourseDialogOpen}
        onSubmit={handleUpdateCourse}
        initialData={course}
      />

      <GradeFormDialog
        open={isGradeDialogOpen}
        onOpenChange={setIsGradeDialogOpen}
        onSubmit={handleGradeSubmit}
        evaluationRules={evaluationRules}
        initialData={editingGrade}
      />

      <SubjectFormDialog
        open={isSubjectDialogOpen}
        onOpenChange={setIsSubjectDialogOpen}
        onSubmit={handleSubjectSubmit}
        gradeName={
          course.grades.find((g) => g.id === selectedGradeId)?.name || 'Série'
        }
        initialData={editingSubject}
      />

      <AlertDialog
        open={!!deleteSubjectData}
        onOpenChange={(open) => !open && setDeleteSubjectData(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Disciplina</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta disciplina?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubject}
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
