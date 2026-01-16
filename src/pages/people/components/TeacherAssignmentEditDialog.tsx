import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Assignment {
  id: number
  class_id: number
  subject_id: number
  teacher_id: number
  workload_hours?: number
  class?: {
    id: number
    name: string
    code?: string
    shift?: string
    school_id: number
    school?: { id: number; name: string }
    academic_period?: {
      id: number
      name: string
      academic_year?: { id: number; year: number }
    }
  }
  subject?: { id: number; name: string }
}

interface ConflictInfo {
  has_conflict: boolean
  conflicting_class_id?: number
  conflicting_class_name?: string
  conflicting_shift?: string
}

interface TeacherAssignmentEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: Assignment | null
  teacherId: number
  teacherName: string
  onSuccess: () => void
}

interface ClassOption {
  id: number
  name: string
  code?: string
  shift?: string
  school_id: number
  school_name: string
  academic_year: number
}

interface SubjectOption {
  id: number
  name: string
}

export function TeacherAssignmentEditDialog({
  open,
  onOpenChange,
  assignment,
  teacherId,
  teacherName,
  onSuccess,
}: TeacherAssignmentEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [checkingConflict, setCheckingConflict] = useState(false)
  const [conflict, setConflict] = useState<ConflictInfo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form state
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('')
  const [selectedYearId, setSelectedYearId] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [workloadHours, setWorkloadHours] = useState<string>('')

  // Data
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([])
  const [academicYears, setAcademicYears] = useState<{ id: number; year: number }[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [existingAssignments, setExistingAssignments] = useState<Assignment[]>([])

  const isEditing = !!assignment

  // Load initial data
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  // Initialize form when editing
  useEffect(() => {
    if (assignment && open) {
      setSelectedSchoolId(String(assignment.class?.school_id || ''))
      setSelectedYearId(String(assignment.class?.academic_period?.academic_year?.id || ''))
      setSelectedClassId(String(assignment.class_id))
      setSelectedSubjectId(String(assignment.subject_id))
      setWorkloadHours(assignment.workload_hours ? String(assignment.workload_hours) : '')
    } else if (open) {
      // Reset form for new assignment
      setSelectedSchoolId('')
      setSelectedYearId('')
      setSelectedClassId('')
      setSelectedSubjectId('')
      setWorkloadHours('')
    }
    setConflict(null)
  }, [assignment, open])

  // Load classes when school and year change
  useEffect(() => {
    if (selectedSchoolId && selectedYearId) {
      loadClasses()
    } else {
      setClasses([])
    }
  }, [selectedSchoolId, selectedYearId])

  // Load subjects when class changes
  useEffect(() => {
    if (selectedClassId) {
      loadSubjects()
      checkConflict()
    } else {
      setSubjects([])
      setConflict(null)
    }
  }, [selectedClassId])

  // Check conflict when class changes
  useEffect(() => {
    if (selectedClassId) {
      checkConflict()
    }
  }, [selectedClassId])

  const loadInitialData = async () => {
    try {
      // Load schools
      const { data: schoolsData } = await supabase
        .from('schools')
        .select('id, name')
        .is('deleted_at', null)
        .order('name')

      // Load academic years
      const { data: yearsData } = await supabase
        .from('academic_years')
        .select('id, year')
        .is('deleted_at', null)
        .order('year', { ascending: false })

      // Load existing assignments for this teacher
      const { data: assignmentsData } = await supabase
        .from('class_teacher_subjects')
        .select(`
          id,
          class_id,
          subject_id,
          teacher_id,
          workload_hours,
          class:classes(
            id, name, code, shift, school_id,
            school:schools(id, name),
            academic_period:academic_periods(
              id, name,
              academic_year:academic_years(id, year)
            )
          ),
          subject:subjects(id, name)
        `)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)

      setSchools(schoolsData || [])
      setAcademicYears(yearsData || [])
      setExistingAssignments((assignmentsData as unknown as Assignment[]) || [])
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id, name, code, shift, school_id,
          school:schools(id, name),
          academic_period:academic_periods!inner(
            id, name,
            academic_year:academic_years!inner(id, year)
          )
        `)
        .eq('school_id', parseInt(selectedSchoolId))
        .eq('academic_period.academic_year.id', parseInt(selectedYearId))
        .is('deleted_at', null)
        .order('name')

      if (error) throw error

      const classOptions: ClassOption[] = (data || []).map((c: Record<string, unknown>) => {
        const period = c.academic_period as Record<string, unknown>
        const year = period?.academic_year as { id: number; year: number }
        const school = c.school as { id: number; name: string }

        return {
          id: c.id as number,
          name: c.name as string,
          code: c.code as string | undefined,
          shift: c.shift as string | undefined,
          school_id: c.school_id as number,
          school_name: school?.name || '',
          academic_year: year?.year || 0,
        }
      })

      setClasses(classOptions)
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const loadSubjects = async () => {
    try {
      // Get the course_id from the selected class
      const { data: classData } = await supabase
        .from('classes')
        .select('course_id')
        .eq('id', parseInt(selectedClassId))
        .single()

      if (!classData) return

      // Get subjects for this course
      const { data: courseSubjectsData } = await supabase
        .from('course_subjects')
        .select('subject:subjects(id, name)')
        .eq('course_id', classData.course_id)
        .is('deleted_at', null)

      const subjectOptions: SubjectOption[] = (courseSubjectsData || [])
        .map((cs: Record<string, unknown>) => cs.subject as SubjectOption)
        .filter(Boolean)

      setSubjects(subjectOptions)
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }

  const checkConflict = async () => {
    if (!selectedClassId) {
      setConflict(null)
      return
    }

    setCheckingConflict(true)
    try {
      // Check if there's a schedule conflict
      const { data, error } = await supabase.rpc('check_teacher_schedule_conflict', {
        p_teacher_id: teacherId,
        p_class_id: parseInt(selectedClassId),
        p_exclude_id: assignment?.id || null,
      })

      if (error) {
        // If function doesn't exist, do manual check
        const selectedClass = classes.find(c => c.id === parseInt(selectedClassId))
        if (!selectedClass?.shift) {
          setConflict(null)
          return
        }

        // Manual conflict check
        const conflicting = existingAssignments.find(a => {
          if (a.id === assignment?.id) return false
          if (a.class_id === parseInt(selectedClassId)) return false
          return a.class?.shift === selectedClass.shift &&
            a.class?.academic_period?.academic_year?.id === parseInt(selectedYearId)
        })

        if (conflicting) {
          setConflict({
            has_conflict: true,
            conflicting_class_id: conflicting.class_id,
            conflicting_class_name: conflicting.class?.name,
            conflicting_shift: conflicting.class?.shift,
          })
        } else {
          setConflict(null)
        }
      } else if (data && data.length > 0 && data[0].has_conflict) {
        setConflict(data[0])
      } else {
        setConflict(null)
      }
    } catch (error) {
      console.error('Error checking conflict:', error)
    } finally {
      setCheckingConflict(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error('Selecione a turma e a disciplina')
      return
    }

    if (conflict?.has_conflict) {
      toast.error('Existe conflito de horário. Resolva antes de salvar.')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (isEditing) {
        // Update existing assignment
        const { error } = await supabase
          .from('class_teacher_subjects')
          .update({
            class_id: parseInt(selectedClassId),
            subject_id: parseInt(selectedSubjectId),
            workload_hours: workloadHours ? parseInt(workloadHours) : null,
            updated_by: user?.id || 1,
          })
          .eq('id', assignment!.id)

        if (error) throw error
        toast.success('Vinculação atualizada com sucesso!')
      } else {
        // Check if assignment already exists
        const { data: existing } = await supabase
          .from('class_teacher_subjects')
          .select('id')
          .eq('teacher_id', teacherId)
          .eq('class_id', parseInt(selectedClassId))
          .eq('subject_id', parseInt(selectedSubjectId))
          .is('deleted_at', null)
          .single()

        if (existing) {
          toast.error('Esta vinculação já existe')
          setLoading(false)
          return
        }

        // Create new assignment
        const { error } = await supabase
          .from('class_teacher_subjects')
          .insert({
            teacher_id: teacherId,
            class_id: parseInt(selectedClassId),
            subject_id: parseInt(selectedSubjectId),
            workload_hours: workloadHours ? parseInt(workloadHours) : null,
            created_by: user?.id || 1,
          })

        if (error) throw error
        toast.success('Vinculação criada com sucesso!')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving assignment:', error)
      toast.error('Erro ao salvar vinculação')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!assignment) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('class_teacher_subjects')
        .delete()
        .eq('id', assignment.id)

      if (error) throw error

      toast.success('Vinculação removida com sucesso!')
      setDeleteDialogOpen(false)
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error('Erro ao remover vinculação')
    } finally {
      setLoading(false)
    }
  }

  // Get selected class info for display
  const selectedClassInfo = useMemo(() => {
    return classes.find(c => c.id === parseInt(selectedClassId))
  }, [classes, selectedClassId])

  // Filter classes that already have this subject assigned to another teacher
  const availableClasses = useMemo(() => {
    // For now, show all classes - could filter out already assigned ones
    return classes
  }, [classes])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Vinculação' : 'Nova Vinculação'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? `Editar vinculação de ${teacherName}`
                : `Adicionar nova vinculação para ${teacherName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* School Select */}
            <div className="space-y-2">
              <Label>Escola</Label>
              <Select
                value={selectedSchoolId}
                onValueChange={(value) => {
                  setSelectedSchoolId(value)
                  setSelectedClassId('')
                  setSelectedSubjectId('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escola" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={String(school.id)}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year Select */}
            <div className="space-y-2">
              <Label>Ano Letivo</Label>
              <Select
                value={selectedYearId}
                onValueChange={(value) => {
                  setSelectedYearId(value)
                  setSelectedClassId('')
                  setSelectedSubjectId('')
                }}
                disabled={!selectedSchoolId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano letivo" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      {year.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Select */}
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select
                value={selectedClassId}
                onValueChange={(value) => {
                  setSelectedClassId(value)
                  setSelectedSubjectId('')
                }}
                disabled={!selectedYearId || classes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>
                      <div className="flex items-center gap-2">
                        <span>{cls.name}</span>
                        {cls.code && (
                          <span className="text-muted-foreground text-xs">({cls.code})</span>
                        )}
                        {cls.shift && (
                          <Badge variant="outline" className="text-xs ml-1">
                            {cls.shift}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {classes.length === 0 && selectedYearId && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma turma encontrada para esta escola e ano letivo
                </p>
              )}
            </div>

            {/* Conflict Warning */}
            {checkingConflict && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando conflitos de horário...
              </div>
            )}

            {conflict?.has_conflict && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Conflito de horário!</strong> O professor já está alocado na turma{' '}
                  <strong>{conflict.conflicting_class_name}</strong> no mesmo turno (
                  {conflict.conflicting_shift}).
                </AlertDescription>
              </Alert>
            )}

            {/* Shift Info */}
            {selectedClassInfo?.shift && !conflict?.has_conflict && (
              <div className="text-sm text-muted-foreground">
                Turno: <Badge variant="secondary">{selectedClassInfo.shift}</Badge>
              </div>
            )}

            {/* Subject Select */}
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={setSelectedSubjectId}
                disabled={!selectedClassId || subjects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {subjects.length === 0 && selectedClassId && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma disciplina configurada para esta turma
                </p>
              )}
            </div>

            {/* Workload Hours */}
            <div className="space-y-2">
              <Label>Carga Horária Semanal (horas)</Label>
              <Input
                type="number"
                min="1"
                max="40"
                placeholder="Ex: 4"
                value={workloadHours}
                onChange={(e) => setWorkloadHours(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Quantidade de horas semanais nesta turma/disciplina.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
                className="sm:mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Vinculação
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                loading ||
                !selectedClassId ||
                !selectedSubjectId ||
                conflict?.has_conflict ||
                checkingConflict
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Vinculação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Vinculação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta vinculação?
              {assignment?.class?.name && (
                <>
                  <br />
                  <br />
                  <strong>Turma:</strong> {assignment.class.name}
                  <br />
                  <strong>Disciplina:</strong> {assignment.subject?.name}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
