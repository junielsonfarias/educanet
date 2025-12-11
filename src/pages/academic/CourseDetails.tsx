import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Book, Clock, Trash2, FileBadge } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { courses, evaluationRules, addGrade, addSubject } = useCourseStore()
  const { toast } = useToast()

  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null)

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

  const handleAddGrade = (data: any) => {
    addGrade(course.id, data)
    toast({
      title: 'Série adicionada',
      description: `${data.name} adicionada ao curso.`,
    })
  }

  const handleOpenSubjectDialog = (gradeId: string) => {
    setSelectedGradeId(gradeId)
    setIsSubjectDialogOpen(true)
  }

  const handleAddSubject = (data: any) => {
    if (selectedGradeId) {
      addSubject(course.id, selectedGradeId, data)
      toast({
        title: 'Disciplina adicionada',
        description: `${data.name} adicionada à série.`,
      })
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
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            {course.name}
          </h2>
          <p className="text-muted-foreground">
            Estrutura curricular e regras de avaliação.
          </p>
        </div>
        <Button onClick={() => setIsGradeDialogOpen(true)}>
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
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 w-full pr-4">
                        <span className="font-semibold text-lg">
                          {grade.name}
                        </span>
                        <Badge variant="secondary" className="font-normal">
                          {grade.subjects.length} Disciplinas
                        </Badge>
                        <div className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
                          <FileBadge className="h-3 w-3" />
                          {getRuleName(grade.evaluationRuleId)}
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
                            onClick={() => handleOpenSubjectDialog(grade.id)}
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
                                className="flex items-center justify-between p-3 border rounded-md bg-secondary/10"
                              >
                                <span className="font-medium">
                                  {subject.name}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {subject.workload}h
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

      <GradeFormDialog
        open={isGradeDialogOpen}
        onOpenChange={setIsGradeDialogOpen}
        onSubmit={handleAddGrade}
        evaluationRules={evaluationRules}
      />

      <SubjectFormDialog
        open={isSubjectDialogOpen}
        onOpenChange={setIsSubjectDialogOpen}
        onSubmit={handleAddSubject}
        gradeName={
          course.grades.find((g) => g.id === selectedGradeId)?.name || 'Série'
        }
      />
    </div>
  )
}
