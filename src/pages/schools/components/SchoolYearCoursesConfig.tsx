/**
 * SchoolYearCoursesConfig - Componente para configurar cursos por ano letivo
 *
 * Permite:
 * - Selecionar ano letivo
 * - Adicionar/remover cursos que a escola oferece naquele ano
 * - Selecionar quais séries de cada curso a escola oferece
 * - Visualizar histórico de cursos por ano
 */

import { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Calendar,
  GraduationCap,
  History,
  Loader2,
  CheckCircle,
  Copy,
  X,
  ChevronRight,
  ChevronDown,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { toast } from 'sonner'
import {
  schoolCourseService,
  type SchoolCourseWithDetails,
  type EducationGrade,
  type SchoolCourseGrade
} from '@/lib/supabase/services'
import { academicYearService } from '@/lib/supabase/services'
import { courseService } from '@/lib/supabase/services'

interface SchoolYearCoursesConfigProps {
  schoolId: number
  schoolName: string
}

interface AcademicYear {
  id: number
  year: number
  start_date: string
  end_date: string
  is_current?: boolean
}

interface Course {
  id: number
  name: string
  education_level: string
  description?: string
}

interface CourseWithGrades extends SchoolCourseWithDetails {
  grades: SchoolCourseGrade[]
}

// Estado para seleção de cursos com séries
interface CourseSelection {
  courseId: number
  courseName: string
  educationLevel: string
  selectedGradeIds: number[]
  availableGrades: EducationGrade[]
}

export function SchoolYearCoursesConfig({ schoolId, schoolName }: SchoolYearCoursesConfigProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Anos letivos
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)

  // Cursos
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [configuredCourses, setConfiguredCourses] = useState<CourseWithGrades[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])

  // Histórico
  const [history, setHistory] = useState<{
    year: number
    academic_year_id: number
    courses: Array<{
      id: number
      course_id: number
      course_name: string
      education_level: string
      is_active: boolean
    }>
  }[]>([])

  // Modais
  const [showAddCoursesModal, setShowAddCoursesModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [sourceYearId, setSourceYearId] = useState<number | null>(null)

  // Novo: seleção de cursos com séries
  const [courseSelections, setCourseSelections] = useState<CourseSelection[]>([])
  const [expandedCourses, setExpandedCourses] = useState<number[]>([])

  // Modal para configurar séries de um curso existente
  const [showGradesModal, setShowGradesModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseWithGrades | null>(null)
  const [editingGrades, setEditingGrades] = useState<number[]>([])
  const [availableGradesForEdit, setAvailableGradesForEdit] = useState<EducationGrade[]>([])

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [schoolId])

  // Carregar cursos configurados quando muda o ano
  useEffect(() => {
    if (selectedYearId) {
      loadConfiguredCourses(selectedYearId)
    }
  }, [selectedYearId, allCourses])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const yearsData = await academicYearService.getAll()
      setAcademicYears(yearsData || [])

      const currentYear = (yearsData || []).find((y: AcademicYear) => y.is_current) || (yearsData || [])[0]
      if (currentYear) {
        setSelectedYearId(currentYear.id)
      }

      const coursesData = await courseService.getAll()
      setAllCourses(coursesData || [])

      if (!coursesData || coursesData.length === 0) {
        toast.warning('Nenhum curso cadastrado no sistema. Cadastre cursos em Acadêmico > Cursos.')
      }

      const historyData = await schoolCourseService.getSchoolHistory(schoolId)
      setHistory(historyData || [])
    } catch (error) {
      toast.error('Erro ao carregar dados')
      console.error('Erro ao carregar dados iniciais:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConfiguredCourses = async (yearId: number) => {
    try {
      const courses = await schoolCourseService.getCoursesWithGrades(schoolId, yearId)
      setConfiguredCourses(courses || [])

      const configuredIds = (courses || []).map(c => c.course_id)
      const available = allCourses.filter(c => !configuredIds.includes(c.id))
      setAvailableCourses(available)
    } catch (error) {
      console.error('Erro ao carregar cursos configurados:', error)
      setConfiguredCourses([])
      setAvailableCourses(allCourses)
    }
  }

  // Abrir modal de adicionar cursos
  const openAddCoursesModal = async () => {
    // Preparar seleções com grades disponíveis para cada curso
    const selections: CourseSelection[] = []

    for (const course of availableCourses) {
      const grades = await schoolCourseService.getGradesByEducationLevel(course.education_level)
      selections.push({
        courseId: course.id,
        courseName: course.name,
        educationLevel: course.education_level,
        selectedGradeIds: grades.map(g => g.id), // Todas selecionadas por padrão
        availableGrades: grades
      })
    }

    setCourseSelections(selections)
    setExpandedCourses([])
    setShowAddCoursesModal(true)
  }

  // Toggle seleção de curso
  const toggleCourseSelection = (courseId: number) => {
    setCourseSelections(prev => {
      const course = prev.find(c => c.courseId === courseId)
      if (!course) return prev

      // Se o curso está selecionado (tem séries), desselecionar todas
      // Se não está selecionado, selecionar todas as séries
      const isSelected = course.selectedGradeIds.length > 0

      return prev.map(c =>
        c.courseId === courseId
          ? { ...c, selectedGradeIds: isSelected ? [] : c.availableGrades.map(g => g.id) }
          : c
      )
    })
  }

  // Toggle seleção de série
  const toggleGradeSelection = (courseId: number, gradeId: number) => {
    setCourseSelections(prev =>
      prev.map(c => {
        if (c.courseId !== courseId) return c

        const isSelected = c.selectedGradeIds.includes(gradeId)
        return {
          ...c,
          selectedGradeIds: isSelected
            ? c.selectedGradeIds.filter(id => id !== gradeId)
            : [...c.selectedGradeIds, gradeId]
        }
      })
    )
  }

  // Toggle expansão do curso
  const toggleCourseExpansion = (courseId: number) => {
    setExpandedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  // Selecionar/desselecionar todas as séries de um curso
  const toggleAllGrades = (courseId: number, selectAll: boolean) => {
    setCourseSelections(prev =>
      prev.map(c => {
        if (c.courseId !== courseId) return c
        return {
          ...c,
          selectedGradeIds: selectAll ? c.availableGrades.map(g => g.id) : []
        }
      })
    )
  }

  const handleAddCourses = async () => {
    const selectedCourses = courseSelections.filter(c => c.selectedGradeIds.length > 0)

    if (!selectedYearId || selectedCourses.length === 0) {
      toast.error('Selecione pelo menos um curso com séries')
      return
    }

    setSaving(true)
    try {
      for (const selection of selectedCourses) {
        await schoolCourseService.addCourseWithGrades(
          schoolId,
          selectedYearId,
          selection.courseId,
          selection.selectedGradeIds
        )
      }

      toast.success(`${selectedCourses.length} curso(s) adicionado(s) com sucesso!`)
      setShowAddCoursesModal(false)
      setCourseSelections([])

      await loadConfiguredCourses(selectedYearId)
      const historyData = await schoolCourseService.getSchoolHistory(schoolId)
      setHistory(historyData)
    } catch (error) {
      toast.error('Erro ao adicionar cursos')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveCourse = async (id: number, courseName: string) => {
    if (!confirm(`Remover "${courseName}" da configuração deste ano letivo?`)) return

    try {
      await schoolCourseService.removeCourse(id)
      toast.success('Curso removido da configuração')

      if (selectedYearId) {
        await loadConfiguredCourses(selectedYearId)
        const historyData = await schoolCourseService.getSchoolHistory(schoolId)
        setHistory(historyData)
      }
    } catch (error) {
      toast.error('Erro ao remover curso')
      console.error(error)
    }
  }

  // Abrir modal para editar séries de um curso existente
  const openEditGradesModal = async (course: CourseWithGrades) => {
    const grades = await schoolCourseService.getGradesByEducationLevel(course.course?.education_level || '')
    setAvailableGradesForEdit(grades)
    setEditingCourse(course)
    setEditingGrades(course.grades.map(g => g.education_grade_id))
    setShowGradesModal(true)
  }

  // Salvar edição de séries
  const handleSaveGrades = async () => {
    if (!editingCourse) return

    setSaving(true)
    try {
      // Identificar séries a adicionar e remover
      const currentGradeIds = editingCourse.grades.map(g => g.education_grade_id)
      const toAdd = editingGrades.filter(id => !currentGradeIds.includes(id))
      const toRemove = editingCourse.grades.filter(g => !editingGrades.includes(g.education_grade_id))

      // Adicionar novas séries
      if (toAdd.length > 0) {
        await schoolCourseService.addGradesToCourse(editingCourse.id, toAdd)
      }

      // Remover séries
      for (const grade of toRemove) {
        await schoolCourseService.removeGradeFromCourse(grade.id)
      }

      toast.success('Séries atualizadas com sucesso!')
      setShowGradesModal(false)
      setEditingCourse(null)

      if (selectedYearId) {
        await loadConfiguredCourses(selectedYearId)
      }
    } catch (error) {
      toast.error('Erro ao atualizar séries')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyFromYear = async () => {
    if (!selectedYearId || !sourceYearId) return

    setSaving(true)
    try {
      const result = await schoolCourseService.copyFromYear(schoolId, sourceYearId, selectedYearId)

      toast.success(`${result.length} curso(s) copiado(s) com sucesso!`)
      setShowCopyModal(false)
      setSourceYearId(null)

      await loadConfiguredCourses(selectedYearId)
      const historyData = await schoolCourseService.getSchoolHistory(schoolId)
      setHistory(historyData)
    } catch (error) {
      toast.error('Erro ao copiar cursos')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const selectedYear = academicYears.find(y => y.id === selectedYearId)
  const selectedCoursesCount = courseSelections.filter(c => c.selectedGradeIds.length > 0).length

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Ano Letivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configuração de Ano Letivo
          </CardTitle>
          <CardDescription>
            Configure quais cursos/etapas de ensino e séries a escola oferece em cada ano letivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="academic-year">Ano Letivo</Label>
              <select
                id="academic-year"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedYearId?.toString() || ''}
                onChange={(e) => setSelectedYearId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Selecione o ano letivo</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id.toString()}>
                    {year.year} {year.is_current ? '(Atual)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedYearId && (
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  <Button
                    onClick={openAddCoursesModal}
                    disabled={allCourses.length === 0 || availableCourses.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Cursos
                  </Button>
                  {history.length > 0 && (
                    <Button variant="outline" onClick={() => setShowCopyModal(true)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar de Outro Ano
                    </Button>
                  )}
                </div>
                {allCourses.length === 0 && (
                  <p className="text-xs text-destructive">
                    Nenhum curso cadastrado. Vá em Acadêmico → Cursos para cadastrar.
                  </p>
                )}
                {allCourses.length > 0 && availableCourses.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Todos os cursos já estão configurados para este ano.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cursos Configurados */}
      {selectedYearId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Cursos Oferecidos em {selectedYear?.year}
            </CardTitle>
            <CardDescription>
              {configuredCourses.length} curso(s) configurado(s) para este ano letivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configuredCourses.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum curso configurado para este ano letivo.</p>
                <p className="text-sm mt-2">
                  Clique em "Adicionar Cursos" para configurar os cursos e séries oferecidos.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {configuredCourses.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{item.course?.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {item.course?.education_level}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditGradesModal(item)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Séries
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCourse(item.id, item.course?.name || '')}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Séries configuradas */}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Séries oferecidas ({item.grades.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.grades.length === 0 ? (
                          <span className="text-sm text-orange-500">
                            Nenhuma série configurada - clique em "Séries" para adicionar
                          </span>
                        ) : (
                          item.grades
                            .sort((a, b) => (a.education_grade?.grade_order || 0) - (b.education_grade?.grade_order || 0))
                            .map((grade) => (
                              <Badge key={grade.id} variant="outline">
                                {grade.education_grade?.grade_name}
                              </Badge>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico de Cursos */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Cursos por Ano
            </CardTitle>
            <CardDescription>
              Evolução dos cursos oferecidos pela escola ao longo dos anos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {history.map((yearData) => (
                <AccordionItem key={yearData.year} value={yearData.year.toString()}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-semibold">{yearData.year}</span>
                      <Badge variant="outline">{yearData.courses.length} curso(s)</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {yearData.courses.map((course) => (
                        <Badge
                          key={course.id}
                          variant={course.is_active ? 'default' : 'secondary'}
                        >
                          {course.course_name}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Modal: Adicionar Cursos com Séries */}
      {showAddCoursesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowAddCoursesModal(false)}
          />
          <div className="relative z-50 w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-background rounded-lg shadow-lg border p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Adicionar Cursos ao Ano {selectedYear?.year}</h2>
                <p className="text-sm text-muted-foreground">
                  Selecione os cursos e as séries que a escola oferecerá.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddCoursesModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 py-4">
              {courseSelections.map((selection) => {
                const isSelected = selection.selectedGradeIds.length > 0
                const isExpanded = expandedCourses.includes(selection.courseId)
                const allSelected = selection.selectedGradeIds.length === selection.availableGrades.length

                return (
                  <div
                    key={selection.courseId}
                    className={`border rounded-lg ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                  >
                    {/* Cabeçalho do curso */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => toggleCourseExpansion(selection.courseId)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleCourseSelection(selection.courseId)
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />

                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}

                      <div className="flex-1">
                        <span className="font-medium">{selection.courseName}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {selection.educationLevel}
                        </Badge>
                      </div>

                      <span className="text-sm text-muted-foreground">
                        {selection.selectedGradeIds.length}/{selection.availableGrades.length} séries
                      </span>
                    </div>

                    {/* Lista de séries (expandida) */}
                    {isExpanded && selection.availableGrades.length > 0 && (
                      <div className="border-t px-3 py-2 bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Séries disponíveis:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAllGrades(selection.courseId, !allSelected)}
                          >
                            {allSelected ? 'Desmarcar todas' : 'Marcar todas'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {selection.availableGrades
                            .sort((a, b) => a.grade_order - b.grade_order)
                            .map((grade) => (
                              <label
                                key={grade.id}
                                className={`flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent ${
                                  selection.selectedGradeIds.includes(grade.id)
                                    ? 'bg-primary/10 border-primary'
                                    : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selection.selectedGradeIds.includes(grade.id)}
                                  onChange={() => toggleGradeSelection(selection.courseId, grade.id)}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <span className="text-sm">{grade.grade_name}</span>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}

                    {isExpanded && selection.availableGrades.length === 0 && (
                      <div className="border-t px-3 py-2 bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                          Nenhuma série cadastrada para este nível educacional.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}

              {courseSelections.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Todos os cursos já estão configurados para este ano letivo.
                </p>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedCoursesCount} curso(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddCoursesModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddCourses}
                  disabled={selectedCoursesCount === 0 || saving}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Adicionar {selectedCoursesCount > 0 ? `(${selectedCoursesCount})` : ''}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Séries de um Curso */}
      {showGradesModal && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowGradesModal(false)}
          />
          <div className="relative z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto bg-background rounded-lg shadow-lg border p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Séries de {editingCourse.course?.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Selecione as séries que a escola oferece para este curso.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGradesModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {editingGrades.length}/{availableGradesForEdit.length} séries selecionadas
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (editingGrades.length === availableGradesForEdit.length) {
                      setEditingGrades([])
                    } else {
                      setEditingGrades(availableGradesForEdit.map(g => g.id))
                    }
                  }}
                >
                  {editingGrades.length === availableGradesForEdit.length
                    ? 'Desmarcar todas'
                    : 'Marcar todas'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {availableGradesForEdit
                  .sort((a, b) => a.grade_order - b.grade_order)
                  .map((grade) => (
                    <label
                      key={grade.id}
                      className={`flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-accent ${
                        editingGrades.includes(grade.id)
                          ? 'bg-primary/10 border-primary'
                          : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editingGrades.includes(grade.id)}
                        onChange={() => {
                          setEditingGrades(prev =>
                            prev.includes(grade.id)
                              ? prev.filter(id => id !== grade.id)
                              : [...prev, grade.id]
                          )
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span>{grade.grade_name}</span>
                    </label>
                  ))}
              </div>

              {availableGradesForEdit.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma série cadastrada para este nível educacional.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowGradesModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveGrades} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Copiar de Outro Ano */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowCopyModal(false)}
          />
          <div className="relative z-50 w-full max-w-md bg-background rounded-lg shadow-lg border p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Copiar Cursos de Outro Ano</h2>
                <p className="text-sm text-muted-foreground">
                  Copie a configuração de cursos de um ano anterior para o ano {selectedYear?.year}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCopyModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="py-4">
              <Label htmlFor="source-year">Copiar cursos de:</Label>
              <select
                id="source-year"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={sourceYearId?.toString() || ''}
                onChange={(e) => setSourceYearId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Selecione o ano de origem</option>
                {history
                  .filter(h => h.academic_year_id !== selectedYearId && h.courses.length > 0)
                  .map((yearData) => (
                    <option key={yearData.academic_year_id} value={yearData.academic_year_id.toString()}>
                      {yearData.year} ({yearData.courses.length} cursos)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCopyModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCopyFromYear} disabled={!sourceYearId || saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Copiar Cursos
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
