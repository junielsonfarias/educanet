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
  Hash,
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
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { GradeFormDialog } from './components/GradeFormDialog'
import { SubjectFormDialog } from './components/SubjectFormDialog'
import { CourseFormDialog } from './components/CourseFormDialog'
import { useToast } from '@/hooks/use-toast'
import {
  safeArray,
  safeFind,
  safeMap,
  safeLength,
} from '@/lib/array-utils'
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
    etapasEnsino,
    evaluationRules,
    addSerieAno,
    updateSerieAno,
    addSubject,
    updateSubject,
    removeSubject,
    updateEtapaEnsino,
    // Aliases para compatibilidade
    courses,
    addGrade,
    updateGrade,
    updateCourse,
  } = useCourseStore()
  const { toast } = useToast()

  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false)

  const [selectedSerieAnoId, setSelectedSerieAnoId] = useState<string | null>(null)
  const [editingSerieAno, setEditingSerieAno] = useState<any>(null)
  const [editingSubject, setEditingSubject] = useState<any>(null)
  const [deleteSubjectData, setDeleteSubjectData] = useState<{
    serieAnoId: string
    subjectId: string
  } | null>(null)

  const etapaEnsino = etapasEnsino.find((e) => e.id === id)
  // Alias para compatibilidade
  const course = etapaEnsino

  if (!etapaEnsino) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Etapa de Ensino não encontrada</h2>
        <Button onClick={() => navigate('/academico/cursos')}>
          Voltar para Lista
        </Button>
      </div>
    )
  }

  // Handlers for EtapaEnsino
  const handleUpdateEtapaEnsino = (data: any) => {
    updateEtapaEnsino(etapaEnsino.id, data)
    toast({
      title: 'Etapa de Ensino atualizada',
      description: 'Alterações salvas com sucesso.',
    })
  }

  // Alias para compatibilidade
  const handleUpdateCourse = handleUpdateEtapaEnsino

  // Handlers for SerieAno
  const openAddSerieAnoDialog = () => {
    setEditingSerieAno(null)
    setIsGradeDialogOpen(true)
  }

  // Alias para compatibilidade
  const openAddGradeDialog = openAddSerieAnoDialog

  const openEditSerieAnoDialog = (serieAno: any) => {
    setEditingSerieAno(serieAno)
    setIsGradeDialogOpen(true)
  }

  // Alias para compatibilidade
  const openEditGradeDialog = openEditSerieAnoDialog

  const handleSerieAnoSubmit = (data: any) => {
    if (editingSerieAno) {
      updateSerieAno(etapaEnsino.id, editingSerieAno.id, data)
      toast({ title: 'Série/Ano atualizada', description: 'Alterações salvas.' })
    } else {
      addSerieAno(etapaEnsino.id, data)
      toast({ title: 'Série/Ano adicionada', description: 'Nova série/ano criada.' })
    }
  }

  // Alias para compatibilidade
  const handleGradeSubmit = handleSerieAnoSubmit

  // Handlers for Subject
  const openAddSubjectDialog = (serieAnoId: string) => {
    setSelectedSerieAnoId(serieAnoId)
    setEditingSubject(null)
    setIsSubjectDialogOpen(true)
  }

  const openEditSubjectDialog = (serieAnoId: string, subject: any) => {
    setSelectedSerieAnoId(serieAnoId)
    setEditingSubject(subject)
    setIsSubjectDialogOpen(true)
  }

  const handleSubjectSubmit = (data: any) => {
    if (!selectedSerieAnoId) return

    if (editingSubject) {
      updateSubject(etapaEnsino.id, selectedSerieAnoId, editingSubject.id, data)
      toast({
        title: 'Disciplina atualizada',
        description: 'Alterações salvas.',
      })
    } else {
      addSubject(etapaEnsino.id, selectedSerieAnoId, data)
      toast({
        title: 'Disciplina adicionada',
        description: 'Disciplina criada com sucesso.',
      })
    }
  }

  const handleDeleteSubject = () => {
    if (deleteSubjectData) {
      removeSubject(
        etapaEnsino.id,
        deleteSubjectData.serieAnoId,
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
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-3xl font-bold tracking-tight text-primary">
              {etapaEnsino.name}
            </h2>
            {etapaEnsino.codigoCenso && (
              <Badge variant="outline" className="ml-2">
                <Hash className="h-3 w-3 mr-1" />
                Código INEP: {etapaEnsino.codigoCenso}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCourseDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Estrutura curricular e regras de avaliação - Etapa de Ensino conforme Censo Escolar (INEP).
          </p>
          {etapaEnsino.codigoCenso && (
            <div className="mt-2 text-xs text-muted-foreground">
              Esta etapa de ensino está cadastrada com o código oficial do Censo Escolar.
            </div>
          )}
        </div>
        <Button onClick={openAddGradeDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Série/Ano
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Séries/Anos e Currículo</CardTitle>
            <CardDescription>
              Gerencie as séries/anos, disciplinas e regras de avaliação desta etapa de ensino.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {safeLength(etapaEnsino.seriesAnos) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma série/ano cadastrada nesta etapa de ensino.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {/* Ordena séries/anos por número se disponível */}
                {[...safeArray(etapaEnsino.seriesAnos)]
                  .sort((a: any, b: any) => {
                    const numA = a.numero || parseInt(a.name) || 0
                    const numB = b.numero || parseInt(b.name) || 0
                    return numA - numB
                  })
                  .map((serieAno) => (
                  <AccordionItem key={serieAno.id} value={serieAno.id}>
                    <AccordionTrigger className="hover:no-underline group">
                      <div className="flex items-center gap-4 w-full pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">
                            {serieAno.name}
                          </span>
                          {serieAno.numero && (
                            <Badge variant="outline" className="text-xs">
                              Nº {serieAno.numero}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary" className="font-normal">
                          {safeLength(serieAno.subjects)} Disciplinas
                        </Badge>
                        <div className="ml-auto flex items-center gap-4">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <FileBadge className="h-3 w-3" />
                            {getRuleName(serieAno.evaluationRuleId)}
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            className="inline-flex items-center justify-center h-10 w-10 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground opacity-0 group-hover:opacity-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditSerieAnoDialog(serieAno)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                e.stopPropagation()
                                openEditSerieAnoDialog(serieAno)
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </div>
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
                            onClick={() => openAddSubjectDialog(serieAno.id)}
                          >
                            <Plus className="mr-2 h-3 w-3" /> Adicionar
                            Disciplina
                          </Button>
                        </div>
                        <Separator />
                        {safeLength(serieAno.subjects) === 0 ? (
                          <p className="text-sm text-muted-foreground italic">
                            Nenhuma disciplina cadastrada.
                          </p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {safeMap(serieAno.subjects, (subject) => (
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
                                      openEditSubjectDialog(serieAno.id, subject)
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
                                        serieAnoId: serieAno.id,
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
        initialData={etapaEnsino}
      />

      <GradeFormDialog
        open={isGradeDialogOpen}
        onOpenChange={setIsGradeDialogOpen}
        onSubmit={handleGradeSubmit}
        evaluationRules={evaluationRules}
        initialData={editingSerieAno}
      />

      <SubjectFormDialog
        open={isSubjectDialogOpen}
        onOpenChange={setIsSubjectDialogOpen}
        onSubmit={handleSubjectSubmit}
        gradeName={
          safeFind(safeArray(etapaEnsino.seriesAnos), (s) => s.id === selectedSerieAnoId)?.name || 'Série'
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
