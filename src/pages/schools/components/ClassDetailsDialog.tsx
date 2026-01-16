/**
 * ClassDetailsDialog - Dialog completo para gerenciamento de turma
 *
 * Exibe informações detalhadas da turma com abas:
 * - Informações gerais
 * - Alunos matriculados
 * - Professores e disciplinas
 * - Notas e avaliações
 */

import { useState, useEffect } from 'react'
import {
  X,
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  Loader2,
  UserPlus,
  Trash2,
  Search,
  Calendar,
  Clock,
  Building,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Hash,
  FileText,
  Scale,
  Percent,
  CheckCircle2,
  Edit,
  Accessibility,
  MoreHorizontal,
  Printer,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { classService, assessmentTypeService, evaluationRulesService, academicPeriodService } from '@/lib/supabase/services'
import { gradeService } from '@/lib/supabase/services'
import { evaluationInstanceService } from '@/lib/supabase/services/evaluation-instance-service'
import type { AssessmentType } from '@/lib/supabase/services/assessment-type-service'
import type { EvaluationRule } from '@/lib/supabase/services/evaluation-rules-service'
import { supabase } from '@/lib/supabase/client'
import { StudentDetailsModal } from '@/components/academic/StudentDetailsModal'

interface ClassDetailsDialogProps {
  classId: number
  onClose: () => void
  onUpdated?: () => void
  onEdit?: () => void
}

interface ClassInfo {
  id: number
  name: string
  code?: string
  shift: string
  capacity: number
  operating_hours?: string
  operating_days?: string[]
  unified_attendance?: boolean
  is_early_years?: boolean
  teacher_model?: string
  homeroom_teacher_id?: number
  homeroom_teacher_name?: string
  assistant_teacher_id?: number
  assistant_teacher_name?: string
  regent_teacher_id?: number
  regent_teacher_name?: string
  school?: { id: number; name: string; trade_name?: string }
  course?: { id: number; name: string; education_level: string }
  academic_year?: { id: number; year: number }
  education_grade?: { id: number; grade_name: string; grade_order: number }
  stats?: {
    totalStudents: number
    studentsPCD: number
    capacity: number
    availableSpots: number
    occupancyRate: number
    totalTeachers: number
    totalSubjects: number
  }
}

interface StudentInfo {
  id: number
  person?: {
    id: number
    full_name: string
    first_name?: string
    last_name?: string
    cpf?: string
    birth_date?: string
    date_of_birth?: string
    gender?: string
    photo_url?: string
  }
  registration_number?: string
  enrollment_code?: string
  student_registration_number?: string
  // Campos PCD
  is_pcd?: boolean
  cid_code?: string
  cid_description?: string
  has_medical_report?: boolean
  // Campos de enrollment
  class_enrollment_id?: number
  class_enrollment_status?: string
  class_enrollment_date?: string
  class_exit_date?: string
  is_transfer_entry?: boolean
  enrollment_order?: number
  is_consolidated?: boolean
  final_result?: string
  enrollment_notes?: string
  student_enrollment_id?: number
  order_number?: number
}

// Função para calcular idade a partir da data de nascimento
const calculateAge = (dateOfBirth: string | null | undefined): number | null => {
  if (!dateOfBirth) return null
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

interface TeacherSubjectInfo {
  id: number
  teacher?: {
    id: number
    person?: {
      full_name: string
    }
  }
  subject?: {
    id: number
    name: string
    code?: string
  }
  workload_hours?: number
}

interface SubjectWithTeachers {
  id: number
  name: string
  code?: string
  workload_hours?: number
  teachers: Array<{
    id: number
    class_teacher_subject_id: number
    workload_hours?: number
    person?: { full_name: string }
  }>
}

export function ClassDetailsDialog({ classId, onClose, onUpdated, onEdit }: ClassDetailsDialogProps) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'students' | 'teachers' | 'grades' | 'rules'>('info')

  // Dados
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubjectInfo[]>([])
  const [subjects, setSubjects] = useState<SubjectWithTeachers[]>([])
  const [studentGrades, setStudentGrades] = useState<Record<string, unknown>[]>([])
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([])
  const [evaluationRule, setEvaluationRule] = useState<EvaluationRule | null>(null)

  // Filtros
  const [studentSearch, setStudentSearch] = useState('')
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null)

  // Modal de vinculação de professor
  const [showTeacherAssignmentModal, setShowTeacherAssignmentModal] = useState(false)
  const [selectedSubjectForAssignment, setSelectedSubjectForAssignment] = useState<number | null>(null)
  const [editingTeacherAssignment, setEditingTeacherAssignment] = useState<{
    id: number
    teacher_id: number
    subject_id: number
    workload_hours?: number
  } | null>(null)
  const [availableTeachers, setAvailableTeachers] = useState<Array<{
    id: number
    person: { full_name: string }
  }>>([])
  const [availableSubjectsForAssignment, setAvailableSubjectsForAssignment] = useState<Array<{
    id: number
    name: string
    code?: string
  }>>([])
  const [assignmentForm, setAssignmentForm] = useState({
    teacher_id: '',
    subject_id: '',
    workload_hours: ''
  })
  const [savingAssignment, setSavingAssignment] = useState(false)

  // Modal de visualização de aluno
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null)
  const [showStudentModal, setShowStudentModal] = useState(false)

  // Modal de matrícula
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [enrollSearch, setEnrollSearch] = useState('')
  const [loadingEnroll, setLoadingEnroll] = useState(false)
  const [enrollingStudent, setEnrollingStudent] = useState(false)
  const [enrollFeedback, setEnrollFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Estados para aba de Notas
  const [academicPeriods, setAcademicPeriods] = useState<any[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [selectedAssessmentTypeId, setSelectedAssessmentTypeId] = useState<number | null>(null)
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null)
  const [gradesData, setGradesData] = useState<Array<{
    studentId: number
    studentName: string
    isPcd: boolean
    originalGrade: number | null
    grade: number | string
    recoveryGrade: number | string
    absences: number | string
    notes: string
    gradeId?: number
    recoveryGradeId?: number
  }>>([])
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [savingGrades, setSavingGrades] = useState(false)
  const [gradesFeedback, setGradesFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [currentEvaluationInstanceId, setCurrentEvaluationInstanceId] = useState<number | null>(null)
  const [originalEvaluationInstanceId, setOriginalEvaluationInstanceId] = useState<number | null>(null)

  // Carregar dados iniciais
  useEffect(() => {
    loadClassData()
  }, [classId])

  const loadClassData = async () => {
    setLoading(true)
    try {
      // Carregar informações da turma
      const info = await classService.getClassWithGradeInfo(classId)
      setClassInfo(info as ClassInfo)

      // Carregar alunos
      const studentsData = await classService.getClassStudents(classId)
      setStudents(studentsData || [])

      // Carregar professores/disciplinas
      const teachersData = await classService.getClassTeachers(classId)
      setTeacherSubjects(teachersData || [])

      // Carregar disciplinas agrupadas
      const subjectsData = await classService.getClassSubjects(classId)
      setSubjects(subjectsData || [])

    } catch (error) {
      console.error('Erro ao carregar dados da turma:', error)
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados para aba de notas quando selecionada
  useEffect(() => {
    if (activeTab === 'grades' && classInfo) {
      loadGradesTabData()
    }
  }, [activeTab, classInfo])

  // Carregar regras e tipos de avaliação quando a aba for selecionada
  useEffect(() => {
    if (activeTab === 'rules' && !evaluationRule && classInfo) {
      loadEvaluationData()
    }
  }, [activeTab, classInfo])

  // Carregar dados iniciais da aba de notas (períodos e tipos de avaliação)
  const loadGradesTabData = async () => {
    if (!classInfo?.academic_year?.id || !classInfo?.course?.id) return

    try {
      // Carregar períodos acadêmicos do ano letivo
      const periods = await academicPeriodService.getByAcademicYear(classInfo.academic_year.id)
      setAcademicPeriods(periods || [])

      // Carregar tipos de avaliação
      const types = await assessmentTypeService.getAll({
        courseId: classInfo.course.id
      })

      // Filtrar por série se houver
      if (classInfo.education_grade?.id) {
        const gradeId = classInfo.education_grade.id
        const filteredTypes = types.filter(t =>
          !t.applicable_grade_ids || t.applicable_grade_ids.length === 0 ||
          t.applicable_grade_ids.includes(gradeId)
        )
        setAssessmentTypes(filteredTypes)
      } else {
        setAssessmentTypes(types)
      }
    } catch (error) {
      console.error('Erro ao carregar dados da aba de notas:', error)
    }
  }

  // Carregar notas com base nos filtros selecionados
  const loadGradesForFilters = async () => {
    if (!selectedSubjectId || !selectedAssessmentTypeId || !selectedPeriodId) {
      setGradesFeedback({ type: 'error', message: 'Selecione todos os filtros para carregar os dados.' })
      return
    }

    setLoadingGrades(true)
    setGradesFeedback(null)
    setGradesData([])

    try {
      const selectedAssessmentType = assessmentTypes.find(t => t.id === selectedAssessmentTypeId)
      const isRecovery = selectedAssessmentType?.is_recovery || false
      setIsRecoveryMode(isRecovery)

      // Buscar avaliação existente para os filtros selecionados
      const { data: evaluationInstances, error: evalError } = await supabase
        .from('evaluation_instances')
        .select(`
          *,
          class_teacher_subject:class_teacher_subjects!inner(
            class_id,
            subject_id
          )
        `)
        .eq('class_teacher_subject.class_id', classId)
        .eq('class_teacher_subject.subject_id', selectedSubjectId)
        .eq('academic_period_id', selectedPeriodId)
        .eq('assessment_type_id', selectedAssessmentTypeId)
        .is('deleted_at', null)
        .limit(1)

      if (evalError) throw evalError

      const currentEvalInstance = evaluationInstances?.[0]
      setCurrentEvaluationInstanceId(currentEvalInstance?.id || null)

      // Se for recuperação, buscar também a avaliação original do bimestre
      let originalEvalInstance = null
      let originalGradesMap = new Map<number, { grade: number, gradeId: number }>()

      if (isRecovery) {
        // Buscar o tipo de avaliação NÃO recuperação do mesmo período
        const regularTypes = assessmentTypes.filter(t => !t.is_recovery)
        const regularTypeId = regularTypes[0]?.id

        if (regularTypeId) {
          const { data: originalInstances } = await supabase
            .from('evaluation_instances')
            .select(`
              *,
              class_teacher_subject:class_teacher_subjects!inner(
                class_id,
                subject_id
              )
            `)
            .eq('class_teacher_subject.class_id', classId)
            .eq('class_teacher_subject.subject_id', selectedSubjectId)
            .eq('academic_period_id', selectedPeriodId)
            .eq('assessment_type_id', regularTypeId)
            .is('deleted_at', null)
            .limit(1)

          originalEvalInstance = originalInstances?.[0]
          setOriginalEvaluationInstanceId(originalEvalInstance?.id || null)

          // Buscar notas da avaliação original
          if (originalEvalInstance) {
            const { data: originalGrades } = await supabase
              .from('grades')
              .select('*')
              .eq('evaluation_instance_id', originalEvalInstance.id)
              .is('deleted_at', null)

            originalGrades?.forEach(g => {
              originalGradesMap.set(g.student_profile_id, { grade: g.grade_value, gradeId: g.id })
            })
          }
        }
      }

      // Buscar notas existentes da avaliação atual (se existir)
      let existingGradesMap = new Map<number, { grade: number, gradeId: number, notes: string }>()
      if (currentEvalInstance) {
        const { data: existingGrades } = await supabase
          .from('grades')
          .select('*')
          .eq('evaluation_instance_id', currentEvalInstance.id)
          .is('deleted_at', null)

        existingGrades?.forEach(g => {
          existingGradesMap.set(g.student_profile_id, {
            grade: g.grade_value,
            gradeId: g.id,
            notes: g.notes || ''
          })
        })
      }

      // Montar lista de alunos com notas
      const gradesFormData = students.map(student => {
        const studentProfileId = student.id
        const existingGrade = existingGradesMap.get(studentProfileId)
        const originalGrade = originalGradesMap.get(studentProfileId)

        return {
          studentId: studentProfileId,
          studentName: student.person?.full_name || 'Nome não informado',
          isPcd: student.is_pcd || false,
          originalGrade: isRecovery ? (originalGrade?.grade ?? null) : null,
          grade: isRecovery ? '' : (existingGrade?.grade?.toString() || ''),
          recoveryGrade: isRecovery ? (existingGrade?.grade?.toString() || '') : '',
          absences: '',
          notes: existingGrade?.notes || '',
          gradeId: existingGrade?.gradeId,
          recoveryGradeId: isRecovery ? existingGrade?.gradeId : undefined
        }
      })

      setGradesData(gradesFormData)

      if (gradesFormData.length === 0) {
        setGradesFeedback({ type: 'error', message: 'Nenhum aluno matriculado nesta turma.' })
      }

    } catch (error) {
      console.error('Erro ao carregar notas:', error)
      setGradesFeedback({ type: 'error', message: 'Erro ao carregar notas. Tente novamente.' })
    } finally {
      setLoadingGrades(false)
    }
  }

  // Atualizar nota de um aluno no estado
  const handleGradeChange = (studentId: number, field: 'grade' | 'recoveryGrade' | 'absences' | 'notes', value: string) => {
    setGradesData(prev => prev.map(item => {
      if (item.studentId === studentId) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  // Salvar notas em lote
  const handleSaveGrades = async () => {
    if (!selectedSubjectId || !selectedAssessmentTypeId || !selectedPeriodId) {
      setGradesFeedback({ type: 'error', message: 'Selecione todos os filtros antes de salvar.' })
      return
    }

    setSavingGrades(true)
    setGradesFeedback(null)

    try {
      // Se não existe evaluation_instance, criar uma
      let evalInstanceId = currentEvaluationInstanceId

      if (!evalInstanceId) {
        // Buscar class_teacher_subject_id
        const { data: cts } = await supabase
          .from('class_teacher_subjects')
          .select('id')
          .eq('class_id', classId)
          .eq('subject_id', selectedSubjectId)
          .limit(1)
          .single()

        if (!cts) {
          throw new Error('Professor/Disciplina não encontrado para esta turma.')
        }

        // Criar evaluation_instance
        const selectedAssessmentType = assessmentTypes.find(t => t.id === selectedAssessmentTypeId)
        const selectedPeriod = academicPeriods.find(p => p.id === selectedPeriodId)

        const { data: newInstance, error: insertError } = await supabase
          .from('evaluation_instances')
          .insert({
            name: `${selectedAssessmentType?.name || 'Avaliação'} - ${selectedPeriod?.name || 'Período'}`,
            class_teacher_subject_id: cts.id,
            academic_period_id: selectedPeriodId,
            assessment_type_id: selectedAssessmentTypeId,
            evaluation_date: new Date().toISOString().split('T')[0],
            max_grade: selectedAssessmentType?.max_score || 10,
            weight: selectedAssessmentType?.weight || 1
          })
          .select()
          .single()

        if (insertError) throw insertError
        evalInstanceId = newInstance.id
        setCurrentEvaluationInstanceId(evalInstanceId)
      }

      // Salvar as notas
      const gradesToSave = gradesData
        .filter(item => {
          const gradeValue = isRecoveryMode ? item.recoveryGrade : item.grade
          return gradeValue !== '' && gradeValue !== null
        })
        .map(item => ({
          evaluation_instance_id: evalInstanceId!,
          student_profile_id: item.studentId,
          grade_value: parseFloat(isRecoveryMode ? item.recoveryGrade.toString() : item.grade.toString()),
          notes: item.notes || null
        }))

      if (gradesToSave.length > 0) {
        await gradeService.saveMultipleGrades(gradesToSave)
      }

      // Contar quantas foram salvas
      const savedCount = gradesToSave.length
      const totalCount = gradesData.length

      setGradesFeedback({
        type: 'success',
        message: `${savedCount} nota(s) salva(s) com sucesso!`
      })

      // Recarregar dados
      await loadGradesForFilters()

    } catch (error: any) {
      console.error('Erro ao salvar notas:', error)
      setGradesFeedback({ type: 'error', message: error.message || 'Erro ao salvar notas.' })
    } finally {
      setSavingGrades(false)
    }
  }

  // Calcular nota final (para recuperação)
  const calculateFinalGrade = (originalGrade: number | null, recoveryGrade: number | string): number | null => {
    if (originalGrade === null) return null
    if (recoveryGrade === '' || recoveryGrade === null) return originalGrade
    const recovery = parseFloat(recoveryGrade.toString())
    if (isNaN(recovery)) return originalGrade
    return Math.max(originalGrade, recovery)
  }

  // Obter estatísticas das notas
  const getGradesStats = () => {
    const selectedAssessmentType = assessmentTypes.find(t => t.id === selectedAssessmentTypeId)
    const passingGrade = selectedAssessmentType?.passing_score || 7

    let total = gradesData.length
    let filled = 0
    let sum = 0
    let approved = 0
    let failed = 0

    gradesData.forEach(item => {
      const gradeValue = isRecoveryMode
        ? calculateFinalGrade(item.originalGrade, item.recoveryGrade)
        : (item.grade !== '' ? parseFloat(item.grade.toString()) : null)

      if (gradeValue !== null && !isNaN(gradeValue)) {
        filled++
        sum += gradeValue
        if (gradeValue >= passingGrade) {
          approved++
        } else {
          failed++
        }
      }
    })

    return {
      total,
      filled,
      pending: total - filled,
      average: filled > 0 ? (sum / filled).toFixed(1) : '-',
      approved,
      failed,
      passingGrade
    }
  }

  const loadEvaluationData = async () => {
    if (!classInfo?.course?.id) return

    try {
      // Carregar regra de avaliação aplicável
      const rule = await evaluationRulesService.getRuleForClass(
        classInfo.course.id,
        classInfo.education_grade?.id
      )
      setEvaluationRule(rule)

      // Carregar tipos de avaliação
      const types = await assessmentTypeService.getAll({
        courseId: classInfo.course.id
      })

      // Filtrar por série se houver
      if (classInfo.education_grade?.id) {
        const gradeId = classInfo.education_grade.id
        const filteredTypes = types.filter(t =>
          t.applicable_grade_ids.length === 0 ||
          t.applicable_grade_ids.includes(gradeId)
        )
        setAssessmentTypes(filteredTypes)
      } else {
        setAssessmentTypes(types)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de avaliação:', error)
    }
  }

  // Filtrar alunos
  const filteredStudents = students.filter(student => {
    if (!studentSearch) return true
    const name = student.person?.full_name?.toLowerCase() || ''
    const code = student.enrollment_code?.toLowerCase() || ''
    const search = studentSearch.toLowerCase()
    return name.includes(search) || code.includes(search)
  })

  // Handler para visualizar aluno
  const handleViewStudent = (student: StudentInfo) => {
    setSelectedStudent(student)
    setShowStudentModal(true)
  }

  // Handler para imprimir relação de alunos
  const handlePrintStudents = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desativado.')
      return
    }

    const studentsHtml = filteredStudents.map((student, index) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.person?.full_name || 'Nome não informado'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${student.student_registration_number || student.registration_number || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${student.class_enrollment_status || 'Ativo'}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relação de Alunos - ${classInfo?.name || 'Turma'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          h2 { font-size: 14px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #f5f5f5; padding: 10px; border: 1px solid #ddd; text-align: left; }
          .header-info { margin-bottom: 20px; }
          .header-info p { margin: 3px 0; font-size: 12px; }
          .footer { margin-top: 30px; font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header-info">
          <h1>Relação de Alunos</h1>
          <h2>${classInfo?.name || 'Turma'} - ${classInfo?.academic_year?.year || ''}</h2>
          <p><strong>Escola:</strong> ${classInfo?.school?.name || ''}</p>
          <p><strong>Curso:</strong> ${classInfo?.course?.name || ''}</p>
          <p><strong>Turno:</strong> ${classInfo?.shift || ''}</p>
          <p><strong>Total de alunos:</strong> ${filteredStudents.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">Nº</th>
              <th>Nome do Aluno</th>
              <th style="width: 120px;">Matrícula</th>
              <th style="width: 100px;">Situação</th>
            </tr>
          </thead>
          <tbody>
            ${studentsHtml}
          </tbody>
        </table>
        <div class="footer">
          Impresso em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Handler para abrir modal de matrícula
  const handleOpenEnrollModal = async () => {
    setShowEnrollModal(true)
    setLoadingEnroll(true)
    setEnrollSearch('')
    setEnrollFeedback(null)
    try {
      const available = await classService.getAvailableStudentsForClass(classId)
      setAvailableStudents(available)
    } catch (error) {
      console.error('Erro ao carregar alunos disponíveis:', error)
      setEnrollFeedback({ type: 'error', message: 'Erro ao carregar alunos disponíveis' })
    } finally {
      setLoadingEnroll(false)
    }
  }

  // Handler para matricular aluno selecionado
  const handleEnrollStudent = async (studentEnrollmentId: number, studentName: string) => {
    setEnrollingStudent(true)
    setEnrollFeedback(null)
    try {
      await classService.enrollStudent(studentEnrollmentId, classId)
      setEnrollFeedback({ type: 'success', message: `${studentName} matriculado(a) com sucesso!` })

      // Recarregar dados da turma
      await loadClassData()

      // Remover aluno da lista de disponíveis
      setAvailableStudents(prev => prev.filter(s => s.student_enrollment_id !== studentEnrollmentId))

      // Limpar feedback após 3 segundos
      setTimeout(() => setEnrollFeedback(null), 3000)
    } catch (error: any) {
      console.error('Erro ao matricular aluno:', error)
      setEnrollFeedback({ type: 'error', message: error.message || 'Erro ao matricular aluno' })
    } finally {
      setEnrollingStudent(false)
    }
  }

  // Filtrar alunos disponíveis pela busca
  const filteredAvailableStudents = availableStudents.filter(student => {
    if (!enrollSearch) return true
    const name = student.person?.full_name?.toLowerCase() || ''
    const enrollment = student.enrollment_number?.toLowerCase() || ''
    const search = enrollSearch.toLowerCase()
    return name.includes(search) || enrollment.includes(search)
  })

  // Handler para abrir modal de vinculação de professor
  const handleOpenTeacherAssignmentModal = async () => {
    setShowTeacherAssignmentModal(true)
    try {
      // Carregar professores disponíveis
      const { data: teachersData } = await supabase
        .from('teachers')
        .select(`
          id,
          person:people(first_name, last_name)
        `)
        .is('deleted_at', null)
        .order('person(first_name)')

      const formattedTeachers = (teachersData || []).map((t: Record<string, unknown>) => {
        const person = t.person as Record<string, unknown> | undefined
        return {
          id: t.id as number,
          person: {
            full_name: person
              ? `${person.first_name || ''} ${person.last_name || ''}`.trim()
              : 'Professor sem nome'
          }
        }
      })
      setAvailableTeachers(formattedTeachers)

      // Carregar disciplinas disponíveis
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name, code')
        .is('deleted_at', null)
        .order('name')

      setAvailableSubjectsForAssignment(subjectsData || [])

      // Preencher formulário se estiver editando
      if (editingTeacherAssignment) {
        setAssignmentForm({
          teacher_id: editingTeacherAssignment.teacher_id.toString(),
          subject_id: editingTeacherAssignment.subject_id.toString(),
          workload_hours: editingTeacherAssignment.workload_hours?.toString() || ''
        })
      } else if (selectedSubjectForAssignment) {
        setAssignmentForm({
          teacher_id: '',
          subject_id: selectedSubjectForAssignment.toString(),
          workload_hours: ''
        })
      } else {
        setAssignmentForm({
          teacher_id: '',
          subject_id: '',
          workload_hours: ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados para vinculação:', error)
    }
  }

  // Efeito para carregar dados quando modal abre
  useEffect(() => {
    if (showTeacherAssignmentModal) {
      handleOpenTeacherAssignmentModal()
    }
  }, [showTeacherAssignmentModal])

  // Handler para salvar vinculação de professor
  const handleSaveTeacherAssignment = async () => {
    if (!assignmentForm.teacher_id || !assignmentForm.subject_id) {
      return
    }

    setSavingAssignment(true)
    try {
      const payload = {
        class_id: classId,
        teacher_id: parseInt(assignmentForm.teacher_id),
        subject_id: parseInt(assignmentForm.subject_id),
        workload_hours: assignmentForm.workload_hours ? parseInt(assignmentForm.workload_hours) : null,
        created_by: 1
      }

      if (editingTeacherAssignment) {
        // Atualizar vinculação existente
        const { error } = await supabase
          .from('class_teacher_subjects')
          .update({
            teacher_id: payload.teacher_id,
            workload_hours: payload.workload_hours,
            updated_by: 1
          })
          .eq('id', editingTeacherAssignment.id)

        if (error) throw error
      } else {
        // Verificar se já existe vinculação
        const { data: existing } = await supabase
          .from('class_teacher_subjects')
          .select('id')
          .eq('class_id', classId)
          .eq('teacher_id', payload.teacher_id)
          .eq('subject_id', payload.subject_id)
          .is('deleted_at', null)
          .maybeSingle()

        if (existing) {
          throw new Error('Este professor já está vinculado a esta disciplina nesta turma')
        }

        // Criar nova vinculação
        const { error } = await supabase
          .from('class_teacher_subjects')
          .insert(payload)

        if (error) throw error
      }

      // Recarregar dados e fechar modal
      await loadClassData()
      setShowTeacherAssignmentModal(false)
      setEditingTeacherAssignment(null)
      setSelectedSubjectForAssignment(null)
    } catch (error: unknown) {
      console.error('Erro ao salvar vinculação:', error)
      alert(error instanceof Error ? error.message : 'Erro ao salvar vinculação')
    } finally {
      setSavingAssignment(false)
    }
  }

  // Handler para remover vinculação de professor
  const handleRemoveTeacherAssignment = async (assignmentId: number) => {
    if (!confirm('Deseja remover esta vinculação de professor?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('class_teacher_subjects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', assignmentId)

      if (error) throw error

      // Recarregar dados
      await loadClassData()
    } catch (error) {
      console.error('Erro ao remover vinculação:', error)
      alert('Erro ao remover vinculação')
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative z-50 w-full max-w-5xl bg-background rounded-lg shadow-lg border p-6 mx-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  if (!classInfo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative z-50 w-full max-w-md bg-background rounded-lg shadow-lg border p-6 mx-4">
          <div className="flex flex-col items-center gap-4 py-10">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Turma não encontrada</p>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    )
  }

  const stats = classInfo.stats

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-5xl max-h-[90vh] overflow-hidden bg-background rounded-lg shadow-lg border mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {classInfo.name}
              {classInfo.code && (
                <Badge variant="secondary" className="font-mono">
                  {classInfo.code}
                </Badge>
              )}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="outline">{classInfo.course?.education_level}</Badge>
              <span>•</span>
              <span>{classInfo.shift}</span>
              <span>•</span>
              <span>{classInfo.academic_year?.year}</span>
              {classInfo.education_grade && (
                <>
                  <span>•</span>
                  <Badge variant="secondary">{classInfo.education_grade.grade_name}</Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('info')}
          >
            <Building className="h-4 w-4" />
            Informações
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('students')}
          >
            <Users className="h-4 w-4" />
            Alunos ({students.length})
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'teachers'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('teachers')}
          >
            <BookOpen className="h-4 w-4" />
            Disciplinas ({subjects.length})
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'grades'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('grades')}
          >
            <BarChart3 className="h-4 w-4" />
            Notas
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('rules')}
          >
            <Scale className="h-4 w-4" />
            Regras
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Aba: Informações */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Cards de estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Alunos</p>
                        <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Accessibility className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Alunos PCD</p>
                        <p className="text-2xl font-bold">{stats?.studentsPCD || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Award className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Capacidade</p>
                        <p className="text-2xl font-bold">{stats?.capacity || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <GraduationCap className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Professores</p>
                        <p className="text-2xl font-bold">{stats?.totalTeachers || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <BookOpen className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Disciplinas</p>
                        <p className="text-2xl font-bold">{stats?.totalSubjects || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ocupação */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Taxa de Ocupação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{stats?.totalStudents || 0} de {stats?.capacity || 0} vagas</span>
                      <span className="font-medium">{stats?.occupancyRate || 0}%</span>
                    </div>
                    <Progress value={stats?.occupancyRate || 0} />
                    <p className="text-sm text-muted-foreground">
                      {stats?.availableSpots || 0} vagas disponíveis
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações detalhadas */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dados da Turma</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {classInfo.code && (
                      <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Sigla</p>
                          <p className="font-medium font-mono">{classInfo.code}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Escola</p>
                        <p className="font-medium">{classInfo.school?.trade_name || classInfo.school?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Curso</p>
                        <p className="font-medium">{classInfo.course?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Turno</p>
                        <p className="font-medium">{classInfo.shift}</p>
                      </div>
                    </div>
                    {classInfo.operating_hours && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Horário de Funcionamento</p>
                          <p className="font-medium">{classInfo.operating_hours}</p>
                        </div>
                      </div>
                    )}
                    {classInfo.operating_days && classInfo.operating_days.length > 0 && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Dias de Funcionamento</p>
                          <p className="font-medium capitalize">
                            {classInfo.operating_days.map(day => {
                              const dayMap: Record<string, string> = {
                                'seg': 'Seg', 'ter': 'Ter', 'qua': 'Qua',
                                'qui': 'Qui', 'sex': 'Sex', 'sab': 'Sáb', 'dom': 'Dom'
                              }
                              return dayMap[day] || day
                            }).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ano Letivo</p>
                        <p className="font-medium">{classInfo.academic_year?.year}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Série/Ano</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {classInfo.education_grade ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Série</p>
                            <p className="font-medium">{classInfo.education_grade.grade_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Nível</p>
                            <p className="font-medium">{classInfo.course?.education_level}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Série não definida para esta turma.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Card: Modelo de Professor */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Professores da Turma
                    <Badge variant={classInfo.is_early_years ? 'default' : 'secondary'} className="ml-auto">
                      {classInfo.teacher_model || (classInfo.is_early_years ? 'Anos Iniciais' : 'Anos Finais')}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {classInfo.is_early_years
                      ? 'Professor Titular leciona todas as disciplinas. Frequência unificada.'
                      : 'Cada disciplina possui seu próprio professor. Frequência por disciplina.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {classInfo.is_early_years ? (
                    <div className="space-y-4">
                      {/* Professor Titular */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium uppercase">Professor Titular</p>
                            <p className="font-medium">
                              {classInfo.homeroom_teacher_name || 'Não definido'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Responsável por todas as disciplinas
                            </p>
                          </div>
                        </div>
                        {classInfo.unified_attendance && (
                          <Badge variant="outline" className="text-xs">
                            Frequência Unificada
                          </Badge>
                        )}
                      </div>

                      {/* Professor Assistente */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-xs text-orange-600 font-medium uppercase">Professor Assistente</p>
                            <p className="font-medium">
                              {classInfo.assistant_teacher_name || 'Não definido'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Auxiliar do professor titular
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm">
                            Esta turma utiliza o modelo de <strong>1 professor por disciplina</strong>.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Acesse a aba "Professores" para visualizar e gerenciar os professores de cada disciplina.
                          </p>
                        </div>
                      </div>
                      {classInfo.regent_teacher_name && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Award className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-600 font-medium uppercase">Professor Regente</p>
                            <p className="font-medium">{classInfo.regent_teacher_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Aba: Alunos */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {/* Barra de pesquisa e ações */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar aluno por nome ou matrícula..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handlePrintStudents} disabled={students.length === 0}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button onClick={handleOpenEnrollModal}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Matricular Aluno
                  </Button>
                </div>
              </div>

              {/* Estatísticas rápidas */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Total: <strong className="text-foreground">{students.length}</strong>
                </span>
                {stats?.studentsPCD ? (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Accessibility className="h-3.5 w-3.5 text-cyan-500" />
                    PCD: <strong className="text-foreground">{stats.studentsPCD}</strong>
                  </span>
                ) : null}
              </div>

              {/* Lista de alunos */}
              {filteredStudents.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {studentSearch
                        ? 'Nenhum aluno encontrado com este termo.'
                        : 'Nenhum aluno matriculado nesta turma.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[60px] text-center">Nº</TableHead>
                          <TableHead>Nome do Aluno</TableHead>
                          <TableHead className="w-[80px] text-center">Idade</TableHead>
                          <TableHead className="w-[150px]">Matrícula</TableHead>
                          <TableHead className="w-[110px] text-center">Dt. Entrada</TableHead>
                          <TableHead className="w-[110px] text-center">Dt. Saída</TableHead>
                          <TableHead className="w-[80px] text-center">PCD</TableHead>
                          <TableHead className="w-[120px] text-center">Situação</TableHead>
                          <TableHead className="w-[80px] text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => {
                          const person = student?.person
                          const fullName = person?.full_name
                            || (person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() : 'Nome não informado')

                          // Badge de situação
                          const getSituacaoBadge = () => {
                            const status = student.class_enrollment_status || 'Ativo'
                            switch (status) {
                              case 'Ativo':
                                return <Badge className="bg-green-500 hover:bg-green-600">Cursando</Badge>
                              case 'Transferido':
                                return <Badge className="bg-orange-500 hover:bg-orange-600">Transferido</Badge>
                              case 'Abandono':
                                return <Badge variant="destructive">Abandono</Badge>
                              case 'Aprovado':
                                return <Badge className="bg-blue-500 hover:bg-blue-600">Aprovado</Badge>
                              case 'Reprovado':
                                return <Badge variant="destructive">Reprovado</Badge>
                              default:
                                return <Badge variant="outline">{status}</Badge>
                            }
                          }

                          const isTransferred = student.class_enrollment_status === 'Transferido'
                          const isTransferEntry = student.is_transfer_entry === true

                          return (
                            <TableRow
                              key={student?.id || student?.class_enrollment_id}
                              className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                                isTransferred ? 'bg-orange-50/50 opacity-80' : ''
                              } ${isTransferEntry && !isTransferred ? 'bg-blue-50/30' : ''}`}
                              onClick={() => handleViewStudent(student)}
                            >
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className={`font-mono ${isTransferred ? 'bg-orange-100 border-orange-300' : ''}`}
                                >
                                  {student.order_number || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                    isTransferred
                                      ? 'bg-orange-100 text-orange-600'
                                      : isTransferEntry
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-primary/10 text-primary'
                                  }`}>
                                    {fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-medium truncate ${isTransferred ? 'line-through text-muted-foreground' : ''}`}>
                                        {fullName}
                                      </span>
                                      {student.is_pcd && (
                                        <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs flex-shrink-0">
                                          <Accessibility className="h-3 w-3 mr-1" />
                                          PCD
                                        </Badge>
                                      )}
                                      {isTransferEntry && !isTransferred && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] px-1 py-0">
                                          Novo
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {(() => {
                                  const age = calculateAge(person?.date_of_birth || person?.birth_date)
                                  return age !== null ? (
                                    <span className="text-sm font-medium">{age} anos</span>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )
                                })()}
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {student?.student_registration_number || student?.registration_number || student?.enrollment_code || '-'}
                                </code>
                              </TableCell>
                              <TableCell className="text-center">
                                {student.class_enrollment_date ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs font-medium">
                                      {format(new Date(student.class_enrollment_date), 'dd/MM/yyyy', { locale: ptBR })}
                                    </span>
                                    {student.is_transfer_entry && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5 bg-blue-50 text-blue-600 border-blue-200">
                                        Transferência
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {student.class_exit_date ? (
                                  <span className="text-xs font-medium text-orange-600">
                                    {format(new Date(student.class_exit_date), 'dd/MM/yyyy', { locale: ptBR })}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {student.is_pcd ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <Accessibility className="h-4 w-4 text-cyan-500" />
                                    {student.cid_description && (
                                      <span className="text-[10px] text-cyan-600 max-w-[80px] truncate" title={student.cid_description}>
                                        {student.cid_description}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {getSituacaoBadge()}
                              </TableCell>
                              <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Ver detalhes do aluno"
                                  onClick={() => handleViewStudent(student)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {filteredStudents.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Exibindo {filteredStudents.length} de {students.length} aluno(s)
                  {stats?.studentsPCD ? ` (${stats.studentsPCD} PCD)` : ''}
                </p>
              )}
            </div>
          )}

          {/* Aba: Professores/Disciplinas */}
          {activeTab === 'teachers' && (
            <div className="space-y-4">
              {/* Header com badge do modelo */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Badge variant={classInfo?.is_early_years === true ? 'default' : 'secondary'}>
                    {classInfo?.teacher_model || 'Anos Finais'}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {classInfo?.is_early_years === true
                      ? 'Professor Titular leciona todas as disciplinas'
                      : `${subjects.length} disciplina(s) com ${subjects.reduce((acc, s) => acc + s.teachers.length, 0)} professor(es)`}
                  </p>
                </div>
                {/* Botão de Alocar Professor - aparece para Anos Finais ou quando is_early_years não está definido */}
                {classInfo?.is_early_years !== true && (
                  <Button onClick={() => setShowTeacherAssignmentModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Alocar Professor
                  </Button>
                )}
              </div>

              {/* Anos Iniciais: Exibir professor titular */}
              {classInfo?.is_early_years === true ? (
                <div className="space-y-4">
                  {/* Card informativo */}
                  <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-700">Modelo Anos Iniciais</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Neste modelo, o <strong>Professor Titular</strong> é responsável por lecionar todas as disciplinas da turma.
                            O vínculo com as disciplinas é feito automaticamente quando o professor titular é definido na turma.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Professor Titular */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Professor Titular
                      </CardTitle>
                      <CardDescription>
                        Responsável por todas as {subjects.length} disciplinas da turma
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {classInfo?.homeroom_teacher_name ? (
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-lg font-medium text-blue-500">
                              {classInfo.homeroom_teacher_name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-lg">{classInfo.homeroom_teacher_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Leciona: {subjects.map(s => s.name).join(', ')}
                            </p>
                          </div>
                          {classInfo.unified_attendance && (
                            <Badge variant="outline">Frequência Unificada</Badge>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">
                            Nenhum professor titular definido.
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Edite a turma para definir o professor titular.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Professor Assistente */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Professor Assistente
                      </CardTitle>
                      <CardDescription>
                        Auxiliar do professor titular (opcional)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {classInfo?.assistant_teacher_name ? (
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <span className="text-lg font-medium text-orange-500">
                              {classInfo.assistant_teacher_name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-lg">{classInfo.assistant_teacher_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Auxilia o professor titular em sala de aula
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">
                            Nenhum professor assistente definido.
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Edite a turma para definir um professor assistente (opcional).
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Lista de disciplinas (apenas visualização) */}
                  {subjects.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Disciplinas da Turma
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {subjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                            >
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{subject.name}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                /* Anos Finais: Exibir professores por disciplina */
                <>
                  {subjects.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">
                          Nenhuma disciplina configurada para esta turma.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Configure as disciplinas e aloque os professores responsáveis.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {subjects.map((subject) => (
                        <Card key={subject.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <BookOpen className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{subject.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {subject.code ? `Código: ${subject.code}` : 'Sem código'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubjectForAssignment(subject.id)
                                  setEditingTeacherAssignment(null)
                                  setShowTeacherAssignmentModal(true)
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Lista de professores */}
                            <div className="mt-3 space-y-2">
                              {subject.teachers.length === 0 ? (
                                <p className="text-sm text-orange-500 italic">
                                  Nenhum professor alocado
                                </p>
                              ) : (
                                subject.teachers.map((teacher, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/70"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                        <span className="text-xs font-medium text-orange-500">
                                          {teacher.person?.full_name?.charAt(0) || '?'}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">
                                          {teacher.person?.full_name || 'Professor não identificado'}
                                        </p>
                                        {teacher.workload_hours && (
                                          <p className="text-xs text-muted-foreground">
                                            Carga horária: {teacher.workload_hours}h/semana
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedSubjectForAssignment(subject.id)
                                          setEditingTeacherAssignment({
                                            id: teacher.class_teacher_subject_id,
                                            teacher_id: teacher.id,
                                            subject_id: subject.id,
                                            workload_hours: teacher.workload_hours
                                          })
                                          setShowTeacherAssignmentModal(true)
                                        }}
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleRemoveTeacherAssignment(teacher.class_teacher_subject_id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Aba: Notas */}
          {activeTab === 'grades' && (
            <div className="space-y-4">
              {/* Card de Filtros */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Lançamento de Notas
                  </CardTitle>
                  <CardDescription>
                    Selecione os filtros para carregar os dados de lançamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Filtro Disciplina */}
                    <div className="space-y-2">
                      <Label htmlFor="subject-filter">Disciplina</Label>
                      <select
                        id="subject-filter"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        value={selectedSubjectId || ''}
                        onChange={(e) => {
                          setSelectedSubjectId(e.target.value ? parseInt(e.target.value) : null)
                          setGradesData([])
                          setGradesFeedback(null)
                        }}
                      >
                        <option value="">Selecione a disciplina</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro Tipo de Avaliação */}
                    <div className="space-y-2">
                      <Label htmlFor="assessment-type-filter">Tipo de Avaliação</Label>
                      <select
                        id="assessment-type-filter"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        value={selectedAssessmentTypeId || ''}
                        onChange={(e) => {
                          setSelectedAssessmentTypeId(e.target.value ? parseInt(e.target.value) : null)
                          setGradesData([])
                          setGradesFeedback(null)
                        }}
                      >
                        <option value="">Selecione o tipo</option>
                        {assessmentTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name} {type.is_recovery && '(Recuperação)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro Período */}
                    <div className="space-y-2">
                      <Label htmlFor="period-filter">Período</Label>
                      <select
                        id="period-filter"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        value={selectedPeriodId || ''}
                        onChange={(e) => {
                          setSelectedPeriodId(e.target.value ? parseInt(e.target.value) : null)
                          setGradesData([])
                          setGradesFeedback(null)
                        }}
                      >
                        <option value="">Selecione o período</option>
                        {academicPeriods.map((period) => (
                          <option key={period.id} value={period.id}>
                            {period.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={loadGradesForFilters}
                      disabled={!selectedSubjectId || !selectedAssessmentTypeId || !selectedPeriodId || loadingGrades}
                    >
                      {loadingGrades && (
                        <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      )}
                      {!loadingGrades && <Search className="h-4 w-4 mr-2" />}
                      Carregar Dados
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback de sucesso/erro */}
              {gradesFeedback && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                  gradesFeedback.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {gradesFeedback.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="text-sm">{gradesFeedback.message}</span>
                </div>
              )}

              {/* Estado inicial - nenhum filtro selecionado */}
              {(!selectedSubjectId || !selectedAssessmentTypeId || !selectedPeriodId) && (
                <Card>
                  <CardContent className="py-10 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      Selecione os filtros acima para carregar os dados de lançamento.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Estado de carregamento */}
              {selectedSubjectId && selectedAssessmentTypeId && selectedPeriodId && loadingGrades && (
                <Card>
                  <CardContent className="py-10 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dados carregados */}
              {selectedSubjectId && selectedAssessmentTypeId && selectedPeriodId && !loadingGrades && gradesData.length > 0 && (
                <div className="space-y-4">
                  {/* Header da avaliação */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {subjects.find(s => s.id === selectedSubjectId)?.name} - {assessmentTypes.find(t => t.id === selectedAssessmentTypeId)?.name}
                          </CardTitle>
                          <CardDescription>
                            {academicPeriods.find(p => p.id === selectedPeriodId)?.name} •
                            Peso: {assessmentTypes.find(t => t.id === selectedAssessmentTypeId)?.weight || 1} •
                            Nota Máx: {assessmentTypes.find(t => t.id === selectedAssessmentTypeId)?.max_score || 10}
                          </CardDescription>
                        </div>
                        {isRecoveryMode && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            Modo Recuperação
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Estatísticas */}
                      {(() => {
                        const stats = getGradesStats()
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                            <div className="p-3 bg-muted/50 rounded-lg text-center">
                              <p className="text-lg font-bold">{stats.total}</p>
                              <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg text-center">
                              <p className="text-lg font-bold text-blue-600">{stats.filled}</p>
                              <p className="text-xs text-muted-foreground">Lançadas</p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg text-center">
                              <p className="text-lg font-bold text-orange-600">{stats.pending}</p>
                              <p className="text-xs text-muted-foreground">Pendentes</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg text-center">
                              <p className="text-lg font-bold text-green-600">{stats.approved}</p>
                              <p className="text-xs text-muted-foreground">Aprovados</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg text-center">
                              <p className="text-lg font-bold text-red-600">{stats.failed}</p>
                              <p className="text-xs text-muted-foreground">Abaixo Média</p>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Tabela de Notas */}
                      <div className="border rounded-lg overflow-hidden">
                        {/* Header da tabela */}
                        <div className={`grid ${isRecoveryMode ? 'grid-cols-[50px_1fr_80px_80px_80px_120px]' : 'grid-cols-[50px_1fr_80px_80px_1fr]'} gap-2 p-3 bg-muted/70 font-medium text-sm`}>
                          <div className="text-center">Nº</div>
                          <div>Aluno</div>
                          {isRecoveryMode ? (
                            <>
                              <div className="text-center">Original</div>
                              <div className="text-center">Recup.</div>
                              <div className="text-center">Final</div>
                            </>
                          ) : (
                            <>
                              <div className="text-center">Nota</div>
                              <div className="text-center">Faltas</div>
                            </>
                          )}
                          <div>Observações</div>
                        </div>

                        {/* Linhas de dados */}
                        <div className="divide-y max-h-[400px] overflow-y-auto">
                          {gradesData.map((item, index) => {
                            const finalGrade = isRecoveryMode
                              ? calculateFinalGrade(item.originalGrade, item.recoveryGrade)
                              : (item.grade !== '' ? parseFloat(item.grade.toString()) : null)
                            const passingGrade = assessmentTypes.find(t => t.id === selectedAssessmentTypeId)?.passing_score || 7
                            const isApproved = finalGrade !== null && finalGrade >= passingGrade

                            return (
                              <div
                                key={item.studentId}
                                className={`grid ${isRecoveryMode ? 'grid-cols-[50px_1fr_80px_80px_80px_120px]' : 'grid-cols-[50px_1fr_80px_80px_1fr]'} gap-2 p-3 items-center hover:bg-muted/30`}
                              >
                                <div className="text-center text-sm font-medium text-muted-foreground">
                                  {index + 1}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{item.studentName}</span>
                                  {item.isPcd && (
                                    <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200">
                                      PCD
                                    </Badge>
                                  )}
                                </div>

                                {isRecoveryMode ? (
                                  <>
                                    {/* Nota Original (somente leitura) */}
                                    <div className="text-center">
                                      <span className={`text-sm font-medium ${
                                        item.originalGrade !== null && item.originalGrade >= passingGrade
                                          ? 'text-green-600'
                                          : item.originalGrade !== null
                                          ? 'text-red-600'
                                          : 'text-muted-foreground'
                                      }`}>
                                        {item.originalGrade !== null ? item.originalGrade.toFixed(1) : '-'}
                                      </span>
                                    </div>

                                    {/* Nota Recuperação (editável) */}
                                    <div className="text-center">
                                      <Input
                                        type="number"
                                        min="0"
                                        max={assessmentTypes.find(t => t.id === selectedAssessmentTypeId)?.max_score || 10}
                                        step="0.1"
                                        className="h-8 w-16 text-center mx-auto text-sm"
                                        value={item.recoveryGrade}
                                        onChange={(e) => handleGradeChange(item.studentId, 'recoveryGrade', e.target.value)}
                                        placeholder="-"
                                      />
                                    </div>

                                    {/* Nota Final (calculada) */}
                                    <div className="text-center">
                                      <span className={`text-sm font-bold ${
                                        isApproved ? 'text-green-600' : finalGrade !== null ? 'text-red-600' : 'text-muted-foreground'
                                      }`}>
                                        {finalGrade !== null ? finalGrade.toFixed(1) : '-'}
                                      </span>
                                      {finalGrade !== null && (
                                        <span className="ml-1">
                                          {isApproved ? '✅' : '⚠️'}
                                        </span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {/* Nota (editável) */}
                                    <div className="text-center">
                                      <Input
                                        type="number"
                                        min="0"
                                        max={assessmentTypes.find(t => t.id === selectedAssessmentTypeId)?.max_score || 10}
                                        step="0.1"
                                        className="h-8 w-16 text-center mx-auto text-sm"
                                        value={item.grade}
                                        onChange={(e) => handleGradeChange(item.studentId, 'grade', e.target.value)}
                                        placeholder="-"
                                      />
                                    </div>

                                    {/* Faltas */}
                                    <div className="text-center">
                                      <Input
                                        type="number"
                                        min="0"
                                        className="h-8 w-16 text-center mx-auto text-sm"
                                        value={item.absences}
                                        onChange={(e) => handleGradeChange(item.studentId, 'absences', e.target.value)}
                                        placeholder="0"
                                      />
                                    </div>
                                  </>
                                )}

                                {/* Observações */}
                                <div>
                                  <Input
                                    type="text"
                                    className="h-8 text-sm"
                                    value={item.notes}
                                    onChange={(e) => handleGradeChange(item.studentId, 'notes', e.target.value)}
                                    placeholder="Observações"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Legenda para recuperação */}
                      {isRecoveryMode && (
                        <div className="mt-3 text-xs text-muted-foreground">
                          Legenda: ✅ Aprovado (≥{assessmentTypes.find(t => t.id === selectedAssessmentTypeId)?.passing_score || 7}) • ⚠️ Abaixo da média •
                          Nota Final = MAIOR(Original, Recuperação)
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Botões de ação */}
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGradesData([])
                        setGradesFeedback(null)
                      }}
                    >
                      Limpar
                    </Button>
                    <Button
                      onClick={handleSaveGrades}
                      disabled={savingGrades}
                    >
                      {savingGrades && (
                        <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      )}
                      {!savingGrades && <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Salvar Notas
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba: Regras de Avaliação */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {/* Regra de Avaliação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Regra de Avaliação
                  </CardTitle>
                  <CardDescription>
                    Critérios de aprovação e cálculo de média
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {evaluationRule ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Coluna 1: Critérios de Aprovação */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Critérios de Aprovação
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">Nota Mínima</span>
                            </div>
                            <Badge variant="secondary" className="font-mono">
                              {evaluationRule.min_approval_grade.toFixed(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">Frequência Mínima</span>
                            </div>
                            <Badge variant="secondary" className="font-mono">
                              {evaluationRule.min_attendance_percent.toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-purple-500" />
                              <span className="text-sm">Avaliações por Período</span>
                            </div>
                            <Badge variant="secondary" className="font-mono">
                              Mín. {evaluationRule.min_evaluations_per_period}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Coluna 2: Configurações */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-500" />
                          Configurações de Cálculo
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-sm">Tipo de Cálculo</span>
                            <Badge variant="outline">
                              {evaluationRule.calculation_type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-sm">Período Acadêmico</span>
                            <Badge variant="outline">
                              {evaluationRule.academic_period_type}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-sm">Períodos por Ano</span>
                            <Badge variant="secondary" className="font-mono">
                              {evaluationRule.periods_per_year}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-sm">Permite Recuperação</span>
                            <Badge variant={evaluationRule.allow_recovery ? 'default' : 'secondary'}>
                              {evaluationRule.allow_recovery ? 'Sim' : 'Não'}
                            </Badge>
                          </div>
                          {evaluationRule.allow_recovery && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-sm">Recuperação Substitui Menor Nota</span>
                              <Badge variant={evaluationRule.recovery_replaces_lowest ? 'default' : 'secondary'}>
                                {evaluationRule.recovery_replaces_lowest ? 'Sim' : 'Não'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Scale className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        Nenhuma regra de avaliação definida para esta série/curso.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure uma regra na área de Configurações.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tipos de Avaliação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tipos de Avaliação
                  </CardTitle>
                  <CardDescription>
                    Avaliações aplicáveis para esta turma/série
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assessmentTypes.length > 0 ? (
                    <div className="space-y-3">
                      {assessmentTypes.map((type) => (
                        <div
                          key={type.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              type.is_recovery
                                ? 'bg-orange-500/10'
                                : 'bg-blue-500/10'
                            }`}>
                              {type.is_recovery ? (
                                <Award className="h-4 w-4 text-orange-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{type.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {type.code && (
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {type.code}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  Peso: {type.weight.toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  • Nota máx: {type.max_score.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {type.is_recovery && (
                              <Badge variant="secondary" className="text-xs">
                                Recuperação
                              </Badge>
                            )}
                            {type.is_mandatory && (
                              <Badge variant="default" className="text-xs">
                                Obrigatória
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        Nenhum tipo de avaliação configurado.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure os tipos na área de Configurações.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      {/* Modal de visualização do aluno com abas (Info, Boletim, Frequência) */}
      {showStudentModal && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          classId={classId}
          academicYearId={classInfo?.academic_year?.id}
          onClose={() => setShowStudentModal(false)}
        />
      )}

      {/* Modal de matrícula de aluno */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEnrollModal(false)} />
          <div className="relative z-[60] w-full max-w-lg bg-background rounded-lg shadow-lg border mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <div>
                <h3 className="font-semibold text-lg">Matricular Aluno</h3>
                <p className="text-sm text-muted-foreground">
                  {classInfo?.name} • {classInfo?.academic_year?.year}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowEnrollModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno por nome ou matrícula..."
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Feedback de sucesso/erro */}
            {enrollFeedback && (
              <div className={`mx-4 mt-2 p-3 rounded-lg flex items-center gap-2 ${
                enrollFeedback.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {enrollFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="text-sm">{enrollFeedback.message}</span>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingEnroll ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAvailableStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {enrollSearch
                      ? 'Nenhum aluno encontrado com este termo.'
                      : 'Não há alunos disponíveis para matrícula nesta turma.'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Todos os alunos da escola já estão matriculados ou não há matrículas ativas.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setShowEnrollModal(false)
                      // Abrir página de cadastro de aluno (navegar para /people/students/new)
                      window.open('/pessoas/alunos?action=new', '_blank')
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Cadastrar Novo Aluno
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    {filteredAvailableStudents.length} aluno(s) disponível(is)
                  </p>
                  {filteredAvailableStudents.map((student) => (
                    <div
                      key={student.student_enrollment_id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {student.person?.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{student.person?.full_name || 'Nome não informado'}</p>
                          <p className="text-sm text-muted-foreground">
                            Matrícula: {student.enrollment_number || student.student_registration_number || '-'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleEnrollStudent(student.student_enrollment_id, student.person?.full_name || 'Aluno')}
                        disabled={enrollingStudent}
                      >
                        {enrollingStudent ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Matricular
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between gap-2 p-4 border-t flex-shrink-0">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEnrollModal(false)
                  window.open('/pessoas/alunos?action=new', '_blank')
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Novo Aluno
              </Button>
              <Button variant="outline" onClick={() => setShowEnrollModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de vinculação de professor */}
      {showTeacherAssignmentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              setShowTeacherAssignmentModal(false)
              setEditingTeacherAssignment(null)
              setSelectedSubjectForAssignment(null)
            }}
          />
          <div className="relative z-[60] w-full max-w-md bg-background rounded-lg shadow-lg border mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold">
                {editingTeacherAssignment ? 'Editar Vinculação' : 'Nova Vinculação de Professor'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowTeacherAssignmentModal(false)
                  setEditingTeacherAssignment(null)
                  setSelectedSubjectForAssignment(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Disciplina */}
              <div className="space-y-2">
                <Label htmlFor="assignment-subject">Disciplina *</Label>
                <select
                  id="assignment-subject"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={assignmentForm.subject_id}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, subject_id: e.target.value }))}
                  disabled={!!editingTeacherAssignment || !!selectedSubjectForAssignment}
                >
                  <option value="">Selecione a disciplina</option>
                  {availableSubjectsForAssignment.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} {subject.code ? `(${subject.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Professor */}
              <div className="space-y-2">
                <Label htmlFor="assignment-teacher">Professor *</Label>
                <select
                  id="assignment-teacher"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={assignmentForm.teacher_id}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, teacher_id: e.target.value }))}
                >
                  <option value="">Selecione o professor</option>
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.person.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Carga Horária */}
              <div className="space-y-2">
                <Label htmlFor="assignment-workload">Carga Horária (horas/semana)</Label>
                <Input
                  id="assignment-workload"
                  type="number"
                  min="1"
                  max="40"
                  placeholder="Ex: 4"
                  value={assignmentForm.workload_hours}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, workload_hours: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Quantidade de horas semanais desta disciplina nesta turma
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTeacherAssignmentModal(false)
                  setEditingTeacherAssignment(null)
                  setSelectedSubjectForAssignment(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTeacherAssignment}
                disabled={savingAssignment || !assignmentForm.teacher_id || !assignmentForm.subject_id}
              >
                {savingAssignment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingTeacherAssignment ? 'Salvar Alterações' : 'Vincular Professor'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
