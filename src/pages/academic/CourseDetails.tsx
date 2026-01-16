import { useState, useEffect } from 'react'
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
  Loader2,
  FileCheck,
  Calculator,
  Percent,
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
import { evaluationRulesService } from '@/lib/supabase/services'
import { supabase } from '@/lib/supabase/client'
import type { EvaluationRule } from '@/lib/supabase/services/evaluation-rules-service'
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

interface SerieAno {
  id: number | string;
  name: string;
  numero?: number;
  evaluationRuleId?: string;
  subjects?: SubjectItem[];
}

interface SubjectItem {
  id: number | string;
  name: string;
  workload: number;
}

interface CourseFormData {
  name?: string;
  codigoCenso?: string;
  description?: string;
}

interface SerieAnoFormData {
  name?: string;
  numero?: number;
  evaluationRuleId?: string;
}

interface SubjectFormData {
  name?: string;
  workload?: number;
  display_order?: number;
}

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    courses,
    loading,
    fetchCourses,
    updateCourse,
    addSerieAno,
    updateSerieAno,
    addSubjectToSeries,
    updateSubjectInSeries,
    removeSubjectFromSeries,
  } = useCourseStore()

  const { toast } = useToast()
  const [evaluationRules, setEvaluationRules] = useState<EvaluationRule[]>([])
  const [courseSubjects, setCourseSubjects] = useState<Map<number, SubjectItem[]>>(new Map())
  const [loadingData, setLoadingData] = useState(false)

  // Carregar cursos ao montar o componente
  useEffect(() => {
    if (courses.length === 0) {
      fetchCourses()
    }
  }, [courses.length, fetchCourses])

  // Converter id para número para busca
  const courseId = id ? Number(id) : null

  // Carregar regras de avaliação e disciplinas quando tiver o courseId
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return

      setLoadingData(true)
      try {
        // Carregar regras de avaliação do curso
        const rules = await evaluationRulesService.getByCourse(courseId)

        // Também buscar regras de todas as séries do curso
        const course = courses.find(c => Number(c.id) === courseId)
        if (course?.series) {
          for (const serie of course.series as any[]) {
            const gradeRules = await evaluationRulesService.getByGrade(serie.id)
            rules.push(...gradeRules.filter(r => !rules.some(existing => existing.id === r.id)))
          }
        }
        setEvaluationRules(rules)

        // Carregar disciplinas vinculadas ao curso por série
        const { data: subjectsData } = await supabase
          .from('course_subjects')
          .select(`
            id,
            course_id,
            subject_id,
            education_grade_id,
            workload_hours,
            is_mandatory,
            subject:subjects(id, name, code)
          `)
          .eq('course_id', courseId)
          .is('deleted_at', null)

        // Organizar disciplinas por série
        const subjectsByGrade = new Map<number, SubjectItem[]>()
        for (const cs of subjectsData || []) {
          const gradeId = cs.education_grade_id || 0
          if (!subjectsByGrade.has(gradeId)) {
            subjectsByGrade.set(gradeId, [])
          }
          if (cs.subject) {
            subjectsByGrade.get(gradeId)!.push({
              id: cs.subject.id,
              name: cs.subject.name,
              workload: cs.workload_hours || 0,
            })
          }
        }
        setCourseSubjects(subjectsByGrade)
      } catch (error) {
        console.error('Erro ao carregar dados do curso:', error)
      } finally {
        setLoadingData(false)
      }
    }

    if (courses.length > 0 && courseId) {
      loadCourseData()
    }
  }, [courseId, courses])

  // Alias para compatibilidade com código antigo
  const etapasEnsino = courses || []

  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false)

  const [selectedSerieAnoId, setSelectedSerieAnoId] = useState<number | string | null>(null)
  const [editingSerieAno, setEditingSerieAno] = useState<SerieAno | null>(null)
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null)
  const [deleteSubjectData, setDeleteSubjectData] = useState<{
    serieAnoId: number | string
    subjectId: number | string
  } | null>(null)

  // Buscar etapa de ensino pelo ID
  const etapaEnsino = courseId
    ? etapasEnsino.find((e) => Number(e.id) === courseId)
    : null

  // Mapear series do formato do banco para o formato do componente
  // Inclui as disciplinas carregadas do course_subjects
  const seriesAnos: SerieAno[] = etapaEnsino?.series?.map((s: Record<string, unknown>) => ({
    id: s.id as number,
    name: (s.grade_name || s.name) as string,
    numero: (s.grade_order || s.numero) as number,
    subjects: courseSubjects.get(s.id as number) || courseSubjects.get(0) || []
  })) || []

  // Buscar regra de avaliação para uma série específica
  const getRuleForGrade = (gradeId: number | string): EvaluationRule | undefined => {
    // Primeiro busca regra específica da série
    const gradeRule = evaluationRules.find(r => r.education_grade_id === Number(gradeId))
    if (gradeRule) return gradeRule
    // Se não encontrar, busca regra do curso
    return evaluationRules.find(r => r.course_id === courseId && !r.education_grade_id)
  }

  // Exibir loading enquanto carrega
  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

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
  const handleUpdateEtapaEnsino = async (data: CourseFormData) => {
    if (courseId) {
      await updateCourse(courseId, data)
      toast({
        title: 'Etapa de Ensino atualizada',
        description: 'Alterações salvas com sucesso.',
      })
    }
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

  const openEditSerieAnoDialog = (serieAno: SerieAno) => {
    setEditingSerieAno(serieAno)
    setIsGradeDialogOpen(true)
  }

  const handleSerieAnoSubmit = async (data: SerieAnoFormData) => {
    if (!courseId) return

    if (editingSerieAno) {
      await updateSerieAno(courseId, Number(editingSerieAno.id), data)
      toast({ title: 'Série/Ano atualizada', description: 'Alterações salvas.' })
    } else {
      await addSerieAno(courseId, data)
      toast({ title: 'Série/Ano adicionada', description: 'Nova série/ano criada.' })
    }
    setIsGradeDialogOpen(false)
  }

  // Alias para compatibilidade
  const handleGradeSubmit = handleSerieAnoSubmit

  // Handlers for Subject
  const openAddSubjectDialog = (serieAnoId: number | string) => {
    setSelectedSerieAnoId(serieAnoId)
    setEditingSubject(null)
    setIsSubjectDialogOpen(true)
  }

  const openEditSubjectDialog = (serieAnoId: number | string, subject: SubjectItem) => {
    setSelectedSerieAnoId(serieAnoId)
    setEditingSubject(subject)
    setIsSubjectDialogOpen(true)
  }

  const handleSubjectSubmit = async (data: SubjectFormData) => {
    if (!selectedSerieAnoId || !courseId) return

    if (editingSubject) {
      await updateSubjectInSeries(courseId, Number(selectedSerieAnoId), Number(editingSubject.id), data)
      toast({
        title: 'Disciplina atualizada',
        description: 'Alterações salvas.',
      })
    } else {
      await addSubjectToSeries(courseId, Number(selectedSerieAnoId), data)
      toast({
        title: 'Disciplina adicionada',
        description: 'Disciplina criada com sucesso.',
      })
    }
    setIsSubjectDialogOpen(false)
  }

  const handleDeleteSubject = async () => {
    if (deleteSubjectData && courseId) {
      await removeSubjectFromSeries(
        courseId,
        Number(deleteSubjectData.serieAnoId),
        Number(deleteSubjectData.subjectId),
      )
      toast({
        title: 'Disciplina removida',
        description: 'A disciplina foi excluída da série.',
      })
      setDeleteSubjectData(null)
    }
  }

  const getRuleName = (gradeId?: number | string) => {
    if (!gradeId) return 'Regra não definida'
    const rule = getRuleForGrade(gradeId)
    return rule?.name || 'Regra não definida'
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
        {/* Card de Regras de Avaliação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              Regras de Avaliação
            </CardTitle>
            <CardDescription>
              Regras de avaliação vinculadas a esta etapa de ensino.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando regras...</span>
              </div>
            ) : evaluationRules.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Nenhuma regra de avaliação cadastrada para esta etapa de ensino.</p>
                <p className="text-xs mt-2">
                  Acesse o menu <strong>Configurações &gt; Acadêmico &gt; Regras de Avaliação</strong> para cadastrar.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {evaluationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-800/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{rule.name}</h4>
                      {rule.education_grade?.grade_name && (
                        <Badge variant="outline" className="text-xs">
                          {rule.education_grade.grade_name}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calculator className="h-3 w-3" />
                        <span>
                          {rule.calculation_type === 'Media_Simples' ? 'Média Simples' :
                           rule.calculation_type === 'Media_Ponderada' ? 'Média Ponderada' :
                           rule.calculation_type === 'Descritiva' ? 'Descritiva' :
                           rule.calculation_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        <span>Aprovação: ≥{rule.min_approval_grade?.toFixed(1)} | Freq: ≥{rule.min_attendance_percent}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{rule.academic_period_type} ({rule.periods_per_year}x/ano)</span>
                      </div>
                    </div>
                    {rule.formula_description && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        <span className="font-medium">Fórmula:</span> {rule.formula_description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Séries/Anos e Currículo */}
        <Card>
          <CardHeader>
            <CardTitle>Séries/Anos e Currículo</CardTitle>
            <CardDescription>
              Gerencie as séries/anos, disciplinas e regras de avaliação desta etapa de ensino.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {safeLength(seriesAnos) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma série/ano cadastrada nesta etapa de ensino.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {/* Ordena séries/anos por número se disponível */}
                {[...safeArray(seriesAnos)]
                  .sort((a: SerieAno, b: SerieAno) => {
                    const numA = a.numero || parseInt(String(a.name)) || 0
                    const numB = b.numero || parseInt(String(b.name)) || 0
                    return numA - numB
                  })
                  .map((serieAno) => (
                  <AccordionItem key={String(serieAno.id)} value={String(serieAno.id)}>
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
                            {getRuleName(serieAno.id)}
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
          safeFind(safeArray(seriesAnos), (s) => String(s.id) === String(selectedSerieAnoId))?.name || 'Série'
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
