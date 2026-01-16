/**
 * GradeEntry.tsx
 *
 * Página para lançamento de notas finais
 *
 * Dois modos de operação:
 * 1. Por Disciplina: Lança notas para uma disciplina específica
 * 2. Todas Disciplinas: Lança notas de todas as disciplinas em uma tabela única
 *
 * Fluxo: Ano Letivo → Escola → Série → Turma → Disciplina → Período → Tipo de Avaliação
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Save, RefreshCw } from 'lucide-react'
import { assessmentTypeService, AssessmentType } from '@/lib/supabase/services/assessment-type-service'
import { gradeService, GradeData } from '@/lib/supabase/services/grade-service'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Interfaces
interface AcademicYear {
  id: number
  year: number
}

interface School {
  id: number
  name: string
}

interface EducationGrade {
  id: number
  grade_name: string
  grade_order: number
}

interface ClassInfo {
  id: number
  name: string
  code: string | null
  education_grade_id: number | null
}

interface SubjectOption {
  id: number
  name: string
  class_teacher_subject_id: number
  display_order: number
}

interface AcademicPeriod {
  id: number
  name: string
  type: string
}

// Aluno com nota para uma disciplina
interface StudentGrade {
  student_enrollment_id: number
  order_number: number
  full_name: string
  status: string
  grade_value: string
  absences: string
  has_changed: boolean
  evaluation_instance_id: number | null
}

// Aluno com notas para todas as disciplinas
interface StudentMultiGrade {
  student_enrollment_id: number
  order_number: number
  full_name: string
  status: string
  absences: string
  grades: Record<number, { value: string; has_changed: boolean; instance_id: number | null }>
}

export default function GradeEntry() {
  const { toast } = useToast()
  const { userData } = useAuth()

  // Determinar nível de acesso
  const userRole = userData?.role || 'professor'
  const isAdmin = userRole === 'admin' || userRole === 'tecnico'
  const userSchoolId: number | null = null

  // Estados dos filtros
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<string>('')

  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('')

  const [grades, setGrades] = useState<EducationGrade[]>([])
  const [selectedGradeId, setSelectedGradeId] = useState<string>('')
  const [selectedGradeOrder, setSelectedGradeOrder] = useState<number>(0)

  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [isAllSubjects, setIsAllSubjects] = useState(false)

  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('')

  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([])
  const [selectedAssessmentTypeId, setSelectedAssessmentTypeId] = useState<string>('')

  // Estados dos dados
  const [students, setStudents] = useState<StudentGrade[]>([])
  const [studentsMulti, setStudentsMulti] = useState<StudentMultiGrade[]>([])

  // Estados de loading
  const [loading, setLoading] = useState({
    years: true,
    schools: false,
    grades: false,
    classes: false,
    subjects: false,
    periods: false,
    types: false,
    students: false,
    saving: false,
  })

  // Detectar se é Anos Finais (6º ao 9º ano)
  const isAnosFinais = selectedGradeOrder > 5

  // ============================================
  // 1. Carregar Anos Letivos ao montar
  // ============================================
  useEffect(() => {
    loadAcademicYears()
  }, [])

  const loadAcademicYears = async () => {
    try {
      setLoading(prev => ({ ...prev, years: true }))
      const { data, error } = await supabase
        .from('academic_years')
        .select('id, year')
        .is('deleted_at', null)
        .order('year', { ascending: false })

      if (error) throw error
      setAcademicYears(data || [])

      const currentYear = new Date().getFullYear()
      const current = data?.find(y => y.year === currentYear)
      if (current) {
        setSelectedYearId(String(current.id))
        await loadSchools(String(current.id))
      }
    } catch (error) {
      console.error('Erro ao carregar anos letivos:', error)
      toast({ title: 'Erro', description: 'Não foi possível carregar os anos letivos.', variant: 'destructive' })
    } finally {
      setLoading(prev => ({ ...prev, years: false }))
    }
  }

  // ============================================
  // 2. Carregar Escolas
  // ============================================
  const handleYearChange = async (yearId: string) => {
    setSelectedYearId(yearId)
    resetFrom('schools')
    if (yearId) await loadSchools(yearId)
  }

  const loadSchools = async (yearId: string) => {
    try {
      setLoading(prev => ({ ...prev, schools: true }))
      let query = supabase.from('schools').select('id, name').is('deleted_at', null).order('name')
      if (!isAdmin && userSchoolId) query = query.eq('id', userSchoolId)

      const { data, error } = await query
      if (error) throw error
      setSchools(data || [])

      if (data?.length === 1) {
        setSelectedSchoolId(String(data[0].id))
        await loadGrades(yearId, String(data[0].id))
      }
    } catch (error) {
      console.error('Erro ao carregar escolas:', error)
      toast({ title: 'Erro', description: 'Não foi possível carregar as escolas.', variant: 'destructive' })
    } finally {
      setLoading(prev => ({ ...prev, schools: false }))
    }
  }

  // ============================================
  // 3. Carregar Séries
  // ============================================
  const handleSchoolChange = async (schoolId: string) => {
    setSelectedSchoolId(schoolId)
    resetFrom('grades')
    if (schoolId && selectedYearId) await loadGrades(selectedYearId, schoolId)
  }

  const loadGrades = async (yearId: string, schoolId: string) => {
    try {
      setLoading(prev => ({ ...prev, grades: true }))
      const { data, error } = await supabase
        .from('classes')
        .select('education_grade_id, education_grades!inner(id, grade_name, grade_order)')
        .eq('school_id', parseInt(schoolId))
        .eq('academic_year_id', parseInt(yearId))
        .is('deleted_at', null)
        .not('education_grade_id', 'is', null)

      if (error) throw error

      const uniqueGrades = new Map<number, EducationGrade>()
      data?.forEach((item: Record<string, unknown>) => {
        const eg = item.education_grades as EducationGrade
        if (eg && !uniqueGrades.has(eg.id)) uniqueGrades.set(eg.id, eg)
      })

      setGrades(Array.from(uniqueGrades.values()).sort((a, b) => a.grade_order - b.grade_order))
    } catch (error) {
      console.error('Erro ao carregar séries:', error)
      toast({ title: 'Erro', description: 'Não foi possível carregar as séries.', variant: 'destructive' })
    } finally {
      setLoading(prev => ({ ...prev, grades: false }))
    }
  }

  // ============================================
  // 4. Carregar Turmas
  // ============================================
  const handleEducationGradeChange = async (gradeId: string) => {
    setSelectedGradeId(gradeId)
    const grade = grades.find(g => g.id === parseInt(gradeId))
    setSelectedGradeOrder(grade?.grade_order || 0)
    resetFrom('classes')
    if (gradeId && selectedYearId && selectedSchoolId) {
      await loadClasses(selectedYearId, selectedSchoolId, gradeId)
    }
  }

  const loadClasses = async (yearId: string, schoolId: string, gradeId: string) => {
    try {
      setLoading(prev => ({ ...prev, classes: true }))
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, code, education_grade_id')
        .eq('school_id', parseInt(schoolId))
        .eq('academic_year_id', parseInt(yearId))
        .eq('education_grade_id', parseInt(gradeId))
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error('Erro ao carregar turmas:', error)
      toast({ title: 'Erro', description: 'Não foi possível carregar as turmas.', variant: 'destructive' })
    } finally {
      setLoading(prev => ({ ...prev, classes: false }))
    }
  }

  // ============================================
  // 5. Carregar Disciplinas
  // ============================================
  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId)
    resetFrom('subjects')
    if (classId) {
      await loadSubjects(classId)
      await loadPeriods(selectedYearId)
    }
  }

  const loadSubjects = async (classId: string) => {
    try {
      setLoading(prev => ({ ...prev, subjects: true }))
      const { data, error } = await supabase
        .from('class_teacher_subjects')
        .select('id, subject_id, subjects!inner(id, name, display_order)')
        .eq('class_id', parseInt(classId))
        .is('deleted_at', null)

      if (error) throw error

      const subjectOptions: SubjectOption[] = (data || []).map((item: Record<string, unknown>) => {
        const subject = item.subjects as { id: number; name: string; display_order: number | null }
        return {
          id: subject.id,
          name: subject.name,
          class_teacher_subject_id: item.id as number,
          display_order: subject.display_order ?? 999
        }
      })

      // Remover duplicatas e ordenar por display_order
      const unique = new Map<number, SubjectOption>()
      subjectOptions.forEach(s => { if (!unique.has(s.id)) unique.set(s.id, s) })
      setSubjects(Array.from(unique.values()).sort((a, b) => a.display_order - b.display_order))
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error)
      toast({ title: 'Erro', description: 'Não foi possível carregar as disciplinas.', variant: 'destructive' })
    } finally {
      setLoading(prev => ({ ...prev, subjects: false }))
    }
  }

  const loadPeriods = async (yearId: string) => {
    try {
      setLoading(prev => ({ ...prev, periods: true }))
      const { data, error } = await supabase
        .from('academic_periods')
        .select('id, name, type')
        .eq('academic_year_id', parseInt(yearId))
        .is('deleted_at', null)
        .order('start_date')

      if (error) throw error
      setPeriods(data || [])
    } catch (error) {
      console.error('Erro ao carregar períodos:', error)
      toast({ title: 'Erro', description: 'Não foi possível carregar os períodos.', variant: 'destructive' })
    } finally {
      setLoading(prev => ({ ...prev, periods: false }))
    }
  }

  // ============================================
  // 6. Handlers de seleção
  // ============================================
  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId)
    setIsAllSubjects(subjectId === 'all')
    setStudents([])
    setStudentsMulti([])
  }

  const handlePeriodChange = async (periodId: string) => {
    setSelectedPeriodId(periodId)
    setSelectedAssessmentTypeId('')
    setStudents([])
    setStudentsMulti([])
    if (periodId && selectedGradeId) await loadAssessmentTypes(selectedGradeId)
  }

  const loadAssessmentTypes = async (gradeId: string) => {
    try {
      setLoading(prev => ({ ...prev, types: true }))
      const allTypes = await assessmentTypeService.getAll()
      const filtered = allTypes.filter(type => {
        if (!type.applicable_grade_ids || type.applicable_grade_ids.length === 0) return true
        return type.applicable_grade_ids.includes(parseInt(gradeId))
      })
      setAssessmentTypes(filtered)
    } catch (error) {
      console.error('Erro ao carregar tipos de avaliação:', error)
      toast({ title: 'Erro', description: 'Não foi possível carregar os tipos de avaliação.', variant: 'destructive' })
    } finally {
      setLoading(prev => ({ ...prev, types: false }))
    }
  }

  const handleAssessmentTypeChange = (typeId: string) => {
    setSelectedAssessmentTypeId(typeId)
    setStudents([])
    setStudentsMulti([])
  }

  // ============================================
  // Reset helper
  // ============================================
  const resetFrom = (level: string) => {
    const levels = ['schools', 'grades', 'classes', 'subjects', 'periods', 'types', 'students']
    const startIdx = levels.indexOf(level)
    if (startIdx >= 0) {
      if (startIdx <= 0) { setSchools([]); setSelectedSchoolId('') }
      if (startIdx <= 1) { setGrades([]); setSelectedGradeId(''); setSelectedGradeOrder(0) }
      if (startIdx <= 2) { setClasses([]); setSelectedClassId('') }
      if (startIdx <= 3) { setSubjects([]); setSelectedSubjectId(''); setIsAllSubjects(false) }
      if (startIdx <= 4) { setPeriods([]); setSelectedPeriodId('') }
      if (startIdx <= 5) { setAssessmentTypes([]); setSelectedAssessmentTypeId('') }
      if (startIdx <= 6) { setStudents([]); setStudentsMulti([]) }
    }
  }

  // ============================================
  // Carregar Alunos - Modo Disciplina Única
  // ============================================
  const loadStudentsSingle = useCallback(async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedPeriodId || !selectedAssessmentTypeId) {
      toast({ title: 'Atenção', description: 'Preencha todos os filtros.', variant: 'destructive' })
      return
    }

    setLoading(prev => ({ ...prev, students: true }))

    try {
      // 1. Buscar alunos da turma (incluindo todos os status)
      const { data: classStudents, error: studentsError } = await supabase
        .from('class_enrollments')
        .select(`
          id,
          student_enrollment_id,
          status,
          student_enrollments!inner(
            id,
            student_profiles!inner(
              id,
              person_id,
              people!inner(first_name, last_name)
            )
          )
        `)
        .eq('class_id', parseInt(selectedClassId))
        .is('deleted_at', null)
        .order('id')

      if (studentsError) throw studentsError

      // 2. Buscar class_teacher_subject_id
      const { data: ctsData } = await supabase
        .from('class_teacher_subjects')
        .select('id')
        .eq('class_id', parseInt(selectedClassId))
        .eq('subject_id', parseInt(selectedSubjectId))
        .is('deleted_at', null)
        .limit(1)
        .single()

      if (!ctsData) {
        toast({ title: 'Erro', description: 'Disciplina não vinculada a esta turma.', variant: 'destructive' })
        setLoading(prev => ({ ...prev, students: false }))
        return
      }

      const classTeacherSubjectId = ctsData.id

      // 3. Buscar ou criar evaluation_instance
      const { data: existingInstance } = await supabase
        .from('evaluation_instances')
        .select('id')
        .eq('class_teacher_subject_id', classTeacherSubjectId)
        .eq('academic_period_id', parseInt(selectedPeriodId))
        .eq('assessment_type_id', parseInt(selectedAssessmentTypeId))
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle()

      let instanceId: number

      if (existingInstance) {
        instanceId = existingInstance.id
      } else {
        const selectedType = assessmentTypes.find(t => t.id === parseInt(selectedAssessmentTypeId))
        const selectedPeriod = periods.find(p => p.id === parseInt(selectedPeriodId))

        const { data: newInstance, error: createError } = await supabase
          .from('evaluation_instances')
          .insert({
            class_teacher_subject_id: classTeacherSubjectId,
            academic_period_id: parseInt(selectedPeriodId),
            assessment_type_id: parseInt(selectedAssessmentTypeId),
            title: `${selectedType?.name || 'Avaliação'} - ${selectedPeriod?.name || ''}`,
            description: 'Lançamento de notas',
            evaluation_type: selectedType?.is_recovery ? 'Recuperacao' : 'Prova',
            max_grade: selectedType?.max_score || 10,
            evaluation_date: new Date().toISOString().split('T')[0],
            created_by: 1,
          })
          .select('id')
          .single()

        if (createError || !newInstance) {
          console.error('Erro ao criar instância:', createError)
          toast({ title: 'Erro', description: 'Não foi possível criar a avaliação.', variant: 'destructive' })
          setLoading(prev => ({ ...prev, students: false }))
          return
        }
        instanceId = newInstance.id
      }

      // 4. Buscar notas existentes
      const { data: existingGrades } = await supabase
        .from('grades')
        .select('student_enrollment_id, grade_value')
        .eq('evaluation_instance_id', instanceId)
        .is('deleted_at', null)

      const gradesMap = new Map<number, number>()
      existingGrades?.forEach(g => gradesMap.set(g.student_enrollment_id, g.grade_value))

      // 5. Montar lista
      const studentsList: StudentGrade[] = (classStudents || []).map((item: Record<string, unknown>) => {
        const enrollmentId = item.student_enrollment_id as number
        const existingGrade = gradesMap.get(enrollmentId)
        const se = item.student_enrollments as Record<string, unknown>
        const sp = se?.student_profiles as Record<string, unknown>
        const person = sp?.people as { first_name: string; last_name: string }
        const fullName = person ? `${person.first_name} ${person.last_name}`.trim() : 'Nome não disponível'

        return {
          student_enrollment_id: enrollmentId,
          order_number: 0,
          full_name: fullName,
          status: (item.status as string) || 'Ativo',
          grade_value: existingGrade !== undefined ? String(existingGrade) : '',
          absences: '',
          has_changed: false,
          evaluation_instance_id: instanceId,
        }
      })
        .sort((a, b) => a.full_name.localeCompare(b.full_name))

      studentsList.forEach((s, i) => { s.order_number = i + 1 })

      setStudents(studentsList)
      toast({ title: 'Sucesso', description: `${studentsList.length} aluno(s) carregado(s).` })

    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
      toast({ title: 'Erro', description: 'Não foi possível carregar os alunos.', variant: 'destructive' })
    } finally {
      setLoading(prev => ({ ...prev, students: false }))
    }
  }, [selectedClassId, selectedSubjectId, selectedPeriodId, selectedAssessmentTypeId, assessmentTypes, periods, toast])

  // ============================================
  // Carregar Alunos - Modo Todas Disciplinas
  // ============================================
  const loadStudentsAll = useCallback(async () => {
    if (!selectedClassId || !selectedPeriodId || !selectedAssessmentTypeId) {
      toast({ title: 'Atenção', description: 'Preencha todos os filtros.', variant: 'destructive' })
      return
    }

    setLoading(prev => ({ ...prev, students: true }))

    try {
      // 1. Buscar alunos
      const { data: classStudents, error: studentsError } = await supabase
        .from('class_enrollments')
        .select(`
          id,
          student_enrollment_id,
          status,
          student_enrollments!inner(
            id,
            student_profiles!inner(
              id,
              person_id,
              people!inner(first_name, last_name)
            )
          )
        `)
        .eq('class_id', parseInt(selectedClassId))
        .is('deleted_at', null)
        .order('id')

      if (studentsError) throw studentsError

      // 2. Para cada disciplina, buscar/criar evaluation_instance e notas
      const instanceMap = new Map<number, number>() // subject_id -> instance_id
      const gradesMap = new Map<string, number>() // `${enrollmentId}_${subjectId}` -> grade

      for (const subject of subjects) {
        // Buscar class_teacher_subject_id
        const { data: ctsData } = await supabase
          .from('class_teacher_subjects')
          .select('id')
          .eq('class_id', parseInt(selectedClassId))
          .eq('subject_id', subject.id)
          .is('deleted_at', null)
          .limit(1)
          .maybeSingle()

        if (!ctsData) continue

        // Buscar ou criar instance
        const { data: existingInstance } = await supabase
          .from('evaluation_instances')
          .select('id')
          .eq('class_teacher_subject_id', ctsData.id)
          .eq('academic_period_id', parseInt(selectedPeriodId))
          .eq('assessment_type_id', parseInt(selectedAssessmentTypeId))
          .is('deleted_at', null)
          .limit(1)
          .maybeSingle()

        let instanceId: number

        if (existingInstance) {
          instanceId = existingInstance.id
        } else {
          const selectedType = assessmentTypes.find(t => t.id === parseInt(selectedAssessmentTypeId))
          const selectedPeriod = periods.find(p => p.id === parseInt(selectedPeriodId))

          const { data: newInstance, error: createError } = await supabase
            .from('evaluation_instances')
            .insert({
              class_teacher_subject_id: ctsData.id,
              academic_period_id: parseInt(selectedPeriodId),
              assessment_type_id: parseInt(selectedAssessmentTypeId),
              title: `${selectedType?.name || 'Avaliação'} - ${subject.name} - ${selectedPeriod?.name || ''}`,
              description: 'Lançamento de notas',
              evaluation_type: selectedType?.is_recovery ? 'Recuperacao' : 'Prova',
              max_grade: selectedType?.max_score || 10,
              evaluation_date: new Date().toISOString().split('T')[0],
              created_by: 1,
            })
            .select('id')
            .single()

          if (createError || !newInstance) continue
          instanceId = newInstance.id
        }

        instanceMap.set(subject.id, instanceId)

        // Buscar notas existentes
        const { data: existingGrades } = await supabase
          .from('grades')
          .select('student_enrollment_id, grade_value')
          .eq('evaluation_instance_id', instanceId)
          .is('deleted_at', null)

        existingGrades?.forEach(g => {
          gradesMap.set(`${g.student_enrollment_id}_${subject.id}`, g.grade_value)
        })
      }

      // 3. Montar lista
      const studentsList: StudentMultiGrade[] = (classStudents || []).map((item: Record<string, unknown>) => {
        const enrollmentId = item.student_enrollment_id as number
        const se = item.student_enrollments as Record<string, unknown>
        const sp = se?.student_profiles as Record<string, unknown>
        const person = sp?.people as { first_name: string; last_name: string }
        const fullName = person ? `${person.first_name} ${person.last_name}`.trim() : 'Nome não disponível'

        const gradesObj: Record<number, { value: string; has_changed: boolean; instance_id: number | null }> = {}
        subjects.forEach(subject => {
          const existingGrade = gradesMap.get(`${enrollmentId}_${subject.id}`)
          gradesObj[subject.id] = {
            value: existingGrade !== undefined ? String(existingGrade) : '',
            has_changed: false,
            instance_id: instanceMap.get(subject.id) || null,
          }
        })

        return {
          student_enrollment_id: enrollmentId,
          order_number: 0,
          full_name: fullName,
          status: (item.status as string) || 'Ativo',
          absences: '',
          grades: gradesObj,
        }
      })
        .sort((a, b) => a.full_name.localeCompare(b.full_name))

      studentsList.forEach((s, i) => { s.order_number = i + 1 })

      setStudentsMulti(studentsList)
      toast({ title: 'Sucesso', description: `${studentsList.length} aluno(s) carregado(s).` })

    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
      toast({ title: 'Erro', description: 'Não foi possível carregar os alunos.', variant: 'destructive' })
    } finally {
      setLoading(prev => ({ ...prev, students: false }))
    }
  }, [selectedClassId, selectedPeriodId, selectedAssessmentTypeId, subjects, assessmentTypes, periods, toast])

  // ============================================
  // Handler principal de carregar
  // ============================================
  const loadStudentsAndGrades = () => {
    if (isAllSubjects) {
      loadStudentsAll()
    } else {
      loadStudentsSingle()
    }
  }

  // ============================================
  // Handlers de alteração de notas
  // ============================================
  const handleGradeChangeSingle = (enrollmentId: number, value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.student_enrollment_id === enrollmentId) {
        return { ...s, grade_value: value, has_changed: true }
      }
      return s
    }))
  }

  const handleAbsenceChangeSingle = (enrollmentId: number, value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.student_enrollment_id === enrollmentId) {
        return { ...s, absences: value }
      }
      return s
    }))
  }

  const handleGradeChangeMulti = (enrollmentId: number, subjectId: number, value: string) => {
    setStudentsMulti(prev => prev.map(s => {
      if (s.student_enrollment_id === enrollmentId) {
        return {
          ...s,
          grades: {
            ...s.grades,
            [subjectId]: { ...s.grades[subjectId], value, has_changed: true }
          }
        }
      }
      return s
    }))
  }

  const handleAbsenceChangeMulti = (enrollmentId: number, value: string) => {
    setStudentsMulti(prev => prev.map(s => {
      if (s.student_enrollment_id === enrollmentId) {
        return { ...s, absences: value }
      }
      return s
    }))
  }

  // ============================================
  // Salvar notas
  // ============================================
  const handleSaveGrades = async () => {
    setLoading(prev => ({ ...prev, saving: true }))

    try {
      const gradesToSave: GradeData[] = []

      if (isAllSubjects) {
        // Modo todas disciplinas
        studentsMulti.forEach(student => {
          Object.entries(student.grades).forEach(([subjectId, gradeInfo]) => {
            if (gradeInfo.value !== '' && !isNaN(parseFloat(gradeInfo.value)) && gradeInfo.instance_id) {
              gradesToSave.push({
                evaluation_instance_id: gradeInfo.instance_id,
                student_enrollment_id: student.student_enrollment_id,
                grade_value: parseFloat(gradeInfo.value),
              })
            }
          })
        })
      } else {
        // Modo disciplina única
        students.forEach(student => {
          if (student.grade_value !== '' && !isNaN(parseFloat(student.grade_value)) && student.evaluation_instance_id) {
            gradesToSave.push({
              evaluation_instance_id: student.evaluation_instance_id,
              student_enrollment_id: student.student_enrollment_id,
              grade_value: parseFloat(student.grade_value),
            })
          }
        })
      }

      if (gradesToSave.length === 0) {
        toast({ title: 'Atenção', description: 'Nenhuma nota para salvar.' })
        setLoading(prev => ({ ...prev, saving: false }))
        return
      }

      await gradeService.saveMultipleGrades(gradesToSave)

      // Marcar como salvo
      if (isAllSubjects) {
        setStudentsMulti(prev => prev.map(s => ({
          ...s,
          grades: Object.fromEntries(
            Object.entries(s.grades).map(([k, v]) => [k, { ...v, has_changed: false }])
          )
        })))
      } else {
        setStudents(prev => prev.map(s => ({ ...s, has_changed: false })))
      }

      toast({ title: 'Sucesso', description: `${gradesToSave.length} nota(s) salva(s)!` })

    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast({ title: 'Erro', description: 'Não foi possível salvar as notas.', variant: 'destructive' })
    } finally {
      setLoading(prev => ({ ...prev, saving: false }))
    }
  }

  // ============================================
  // Stats
  // ============================================
  const getStats = () => {
    if (isAllSubjects) {
      const total = studentsMulti.length
      let changed = 0
      studentsMulti.forEach(s => {
        Object.values(s.grades).forEach(g => { if (g.has_changed) changed++ })
      })
      return { total, changed }
    } else {
      return {
        total: students.length,
        changed: students.filter(s => s.has_changed).length,
      }
    }
  }

  const stats = getStats()
  const selectedType = assessmentTypes.find(t => t.id === parseInt(selectedAssessmentTypeId))

  // Estilo para selects nativos
  const selectClass = cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-primary/50',
    'disabled:cursor-not-allowed disabled:opacity-50'
  )

  // Helper para mapear status do banco para exibição
  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'Ativo': return 'Cursando'
      case 'Transferido': return 'Transferido'
      case 'Evadido': return 'Abandonou'
      case 'Concluido': return 'Concluído'
      case 'Inativo': return 'Inativo'
      case 'Cancelado': return 'Cancelado'
      default: return status
    }
  }

  // Helper para cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'text-green-700 bg-green-50'
      case 'Transferido': return 'text-orange-700 bg-orange-50'
      case 'Evadido': return 'text-red-700 bg-red-50'
      case 'Cancelado': return 'text-gray-700 bg-gray-50'
      case 'Concluido': return 'text-blue-700 bg-blue-50'
      case 'Inativo': return 'text-gray-700 bg-gray-50'
      default: return 'text-gray-700 bg-gray-50'
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Lançamento de Notas</h1>
        <p className="text-muted-foreground">
          Selecione os filtros para lançar notas. {isAdmin ? '(Acesso completo)' : `(${userRole})`}
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Preencha os campos na ordem para carregar os alunos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {/* 1. Ano Letivo */}
            <div className="space-y-2">
              <Label>Ano Letivo</Label>
              <select className={selectClass} value={selectedYearId} onChange={(e) => handleYearChange(e.target.value)} disabled={loading.years}>
                <option value="">{loading.years ? 'Carregando...' : 'Selecione'}</option>
                {academicYears.map(y => <option key={y.id} value={String(y.id)}>{y.year}</option>)}
              </select>
            </div>

            {/* 2. Escola */}
            <div className="space-y-2">
              <Label>Escola</Label>
              <select className={selectClass} value={selectedSchoolId} onChange={(e) => handleSchoolChange(e.target.value)} disabled={!selectedYearId || loading.schools}>
                <option value="">{loading.schools ? 'Carregando...' : 'Selecione'}</option>
                {schools.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            </div>

            {/* 3. Série */}
            <div className="space-y-2">
              <Label>Série</Label>
              <select className={selectClass} value={selectedGradeId} onChange={(e) => handleEducationGradeChange(e.target.value)} disabled={!selectedSchoolId || loading.grades}>
                <option value="">{loading.grades ? 'Carregando...' : 'Selecione'}</option>
                {grades.map(g => <option key={g.id} value={String(g.id)}>{g.grade_name}</option>)}
              </select>
            </div>

            {/* 4. Turma */}
            <div className="space-y-2">
              <Label>Turma</Label>
              <select className={selectClass} value={selectedClassId} onChange={(e) => handleClassChange(e.target.value)} disabled={!selectedGradeId || loading.classes}>
                <option value="">{loading.classes ? 'Carregando...' : 'Selecione'}</option>
                {classes.map(c => <option key={c.id} value={String(c.id)}>{c.name} {c.code ? `(${c.code})` : ''}</option>)}
              </select>
            </div>

            {/* 5. Disciplina */}
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <select className={selectClass} value={selectedSubjectId} onChange={(e) => handleSubjectChange(e.target.value)} disabled={!selectedClassId || loading.subjects}>
                <option value="">{loading.subjects ? 'Carregando...' : 'Selecione'}</option>
                <option value="all">📋 Todas as Disciplinas</option>
                {subjects.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            </div>

            {/* 6. Período */}
            <div className="space-y-2">
              <Label>Período</Label>
              <select className={selectClass} value={selectedPeriodId} onChange={(e) => handlePeriodChange(e.target.value)} disabled={!selectedSubjectId || loading.periods}>
                <option value="">{loading.periods ? 'Carregando...' : 'Selecione'}</option>
                {periods.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </select>
            </div>

            {/* 7. Tipo de Avaliação */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select className={selectClass} value={selectedAssessmentTypeId} onChange={(e) => handleAssessmentTypeChange(e.target.value)} disabled={!selectedPeriodId || loading.types}>
                <option value="">{loading.types ? 'Carregando...' : 'Selecione'}</option>
                {assessmentTypes.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Botão Carregar */}
          <div className="mt-4">
            <Button onClick={loadStudentsAndGrades} disabled={!selectedAssessmentTypeId || loading.students}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {loading.students ? 'Carregando...' : 'Carregar Alunos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      {selectedType && selectedPeriodId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center text-sm">
              <span><strong>Escola:</strong> {schools.find(s => s.id === parseInt(selectedSchoolId))?.name}</span>
              <span><strong>Série:</strong> {grades.find(g => g.id === parseInt(selectedGradeId))?.grade_name}</span>
              <span><strong>Turma:</strong> {classes.find(c => c.id === parseInt(selectedClassId))?.name}</span>
              <span><strong>Período:</strong> {periods.find(p => p.id === parseInt(selectedPeriodId))?.name}</span>
              <span><strong>Tipo:</strong> {selectedType.name}</span>
              <span><strong>Nota Máx:</strong> {selectedType.max_score}</span>
              {isAllSubjects && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Todas Disciplinas</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela - Modo Disciplina Única */}
      {!isAllSubjects && students.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Alunos - {stats.total} total</CardTitle>
                <CardDescription>{stats.changed} nota(s) alterada(s)</CardDescription>
              </div>
              <Button onClick={handleSaveGrades} disabled={loading.saving || stats.changed === 0}>
                <Save className="mr-2 h-4 w-4" />
                {loading.saving ? 'Salvando...' : 'Salvar Notas'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Nº</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-28">Situação</TableHead>
                    <TableHead className="w-24 text-center">Nota</TableHead>
                    {isAnosFinais && <TableHead className="w-24 text-center">Faltas</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={student.student_enrollment_id} className={student.status !== 'Ativo' ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">{student.order_number}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>
                        <span className={cn('px-2 py-1 rounded text-xs font-medium', getStatusColor(student.status))}>
                          {getDisplayStatus(student.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={selectedType?.max_score || 10}
                          step="0.1"
                          value={student.grade_value}
                          onChange={(e) => handleGradeChangeSingle(student.student_enrollment_id, e.target.value)}
                          placeholder="0.0"
                          className="w-20 text-center"
                          disabled={student.status !== 'Ativo'}
                        />
                      </TableCell>
                      {isAnosFinais && (
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={student.absences}
                            onChange={(e) => handleAbsenceChangeSingle(student.student_enrollment_id, e.target.value)}
                            placeholder="0"
                            className="w-20 text-center"
                            disabled={student.status !== 'Ativo'}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela - Modo Todas Disciplinas */}
      {isAllSubjects && studentsMulti.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Alunos - {stats.total} total</CardTitle>
                <CardDescription>{stats.changed} nota(s) alterada(s)</CardDescription>
              </div>
              <Button onClick={handleSaveGrades} disabled={loading.saving || stats.changed === 0}>
                <Save className="mr-2 h-4 w-4" />
                {loading.saving ? 'Salvando...' : 'Salvar Notas'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 sticky left-0 bg-background">Nº</TableHead>
                    <TableHead className="min-w-[200px] sticky left-12 bg-background">Nome</TableHead>
                    <TableHead className="w-28">Situação</TableHead>
                    {isAnosFinais && <TableHead className="w-20 text-center">Faltas</TableHead>}
                    {subjects.map(subject => (
                      <TableHead
                        key={subject.id}
                        className="min-w-[70px] text-center text-xs whitespace-nowrap px-1"
                        title={subject.name}
                      >
                        {subject.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsMulti.map(student => (
                    <TableRow key={student.student_enrollment_id} className={student.status !== 'Ativo' ? 'opacity-60' : ''}>
                      <TableCell className="font-medium sticky left-0 bg-background">{student.order_number}</TableCell>
                      <TableCell className="sticky left-12 bg-background">{student.full_name}</TableCell>
                      <TableCell>
                        <span className={cn('px-2 py-1 rounded text-xs font-medium', getStatusColor(student.status))}>
                          {getDisplayStatus(student.status)}
                        </span>
                      </TableCell>
                      {isAnosFinais && (
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={student.absences}
                            onChange={(e) => handleAbsenceChangeMulti(student.student_enrollment_id, e.target.value)}
                            placeholder="0"
                            className="w-14 text-center text-xs mx-auto"
                            disabled={student.status !== 'Ativo'}
                          />
                        </TableCell>
                      )}
                      {subjects.map(subject => (
                        <TableCell key={subject.id} className="text-center px-1">
                          <Input
                            type="number"
                            min="0"
                            max={selectedType?.max_score || 10}
                            step="0.1"
                            value={student.grades[subject.id]?.value || ''}
                            onChange={(e) => handleGradeChangeMulti(student.student_enrollment_id, subject.id, e.target.value)}
                            placeholder="0"
                            className="w-14 text-center text-xs mx-auto"
                            disabled={student.status !== 'Ativo'}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {((isAllSubjects && studentsMulti.length === 0) || (!isAllSubjects && students.length === 0)) && selectedAssessmentTypeId && !loading.students && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              Clique em "Carregar Alunos" para visualizar a lista.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
