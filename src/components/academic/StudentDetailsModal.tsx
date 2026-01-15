/**
 * StudentDetailsModal - Modal completo para visualização de aluno
 *
 * Exibe informações detalhadas do aluno com abas:
 * - Informações gerais e matrícula
 * - Boletim (notas por período com sub-abas: Notas e Recuperação)
 * - Frequência (presença por disciplina)
 */

import { useState, useEffect, Fragment } from 'react'
import {
  X,
  Users,
  Calendar,
  Loader2,
  Accessibility,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { gradeService, academicPeriodService, evaluationRulesService } from '@/lib/supabase/services'
import { supabase } from '@/lib/supabase/client'
import type { EvaluationRule, PeriodWeights } from '@/lib/supabase/services/evaluation-rules-service'

export interface StudentInfo {
  id?: number
  class_enrollment_id?: number
  student_enrollment_id?: number
  student_profile_id?: number
  order_number?: number
  student_registration_number?: string
  registration_number?: string
  enrollment_code?: string
  class_enrollment_status?: string
  class_enrollment_date?: string
  student_enrollment_status?: string
  is_pcd?: boolean
  has_medical_report?: boolean
  cid_code?: string
  cid_description?: string
  person?: {
    id?: number
    full_name?: string
    first_name?: string
    last_name?: string
    birth_date?: string
    cpf?: string
    email?: string
    phone?: string
    gender?: string
  }
}

interface StudentDetailsModalProps {
  student: StudentInfo
  classId: number
  academicYearId?: number
  onClose: () => void
}

interface AcademicPeriod {
  id: number
  name: string
  start_date?: string
  end_date?: string
}

// Estrutura para notas organizadas por período
interface PeriodGrades {
  periodId: number
  periodName: string
  periodOrder: number
  regularGrade: number | null  // Nota da avaliação normal
  recoveryGrade: number | null // Nota da recuperação
  finalGrade: number | null    // Maior nota entre regular e recovery
}

// Estrutura para disciplina com todas as notas
interface SubjectGradesData {
  subjectId: number
  subjectName: string
  periodGrades: PeriodGrades[]
  finalAverage: number | null
  attendanceRate: number
}

interface AttendanceBySubject {
  subjectId: number
  subjectName: string
  totalClasses: number
  present: number
  absent: number
  justified: number
  attendanceRate: number
}

type TabType = 'info' | 'boletim' | 'frequencia'
type BoletimSubTab = 'notas' | 'recuperacao'

export function StudentDetailsModal({
  student,
  classId,
  academicYearId,
  onClose,
}: StudentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [boletimSubTab, setBoletimSubTab] = useState<BoletimSubTab>('notas')
  const [loading, setLoading] = useState(false)
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [subjectGrades, setSubjectGrades] = useState<SubjectGradesData[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceBySubject[]>([])
  const [overallAttendance, setOverallAttendance] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    justified: 0,
    rate: 0,
  })
  const [evaluationRule, setEvaluationRule] = useState<EvaluationRule | null>(null)

  const studentProfileId = student.student_profile_id || student.id

  useEffect(() => {
    if (activeTab === 'boletim') {
      loadGradesAndAttendance()
    } else if (activeTab === 'frequencia') {
      loadAttendance()
    }
  }, [activeTab])

  const loadGradesAndAttendance = async () => {
    if (!studentProfileId) return

    setLoading(true)
    try {
      // Carregar períodos acadêmicos
      const periodsData = academicYearId
        ? await academicPeriodService.getByAcademicYear(academicYearId)
        : []

      // Ordenar períodos por nome (1º Bimestre, 2º Bimestre, etc.)
      const sortedPeriods = (periodsData || []).sort((a: AcademicPeriod, b: AcademicPeriod) => {
        const orderA = extractPeriodOrder(a.name)
        const orderB = extractPeriodOrder(b.name)
        return orderA - orderB
      })
      setPeriods(sortedPeriods)

      // Carregar disciplinas da turma com class_teacher_subject_id
      const { data: classTeacherSubjectsData } = await supabase
        .from('class_teacher_subjects')
        .select(`
          id,
          subject:subjects(id, name, code)
        `)
        .eq('class_id', classId)

      // Buscar informações da turma para obter course_id
      const { data: classData } = await supabase
        .from('classes')
        .select('course_id')
        .eq('id', classId)
        .single()

      // Buscar regra de avaliação da turma
      let rule: EvaluationRule | null = null
      if (classData?.course_id) {
        rule = await evaluationRulesService.getRuleForClass(classData.course_id)
        setEvaluationRule(rule)
      }

      // Mapear class_teacher_subjects com subject info para uso na frequência
      const ctsWithSubjects = (classTeacherSubjectsData || [])
        .filter((cts: any) => cts.subject)
        .map((cts: any) => ({
          classTeacherSubjectId: cts.id,
          subjectId: cts.subject.id,
          subjectName: cts.subject.name,
          subjectCode: cts.subject.code,
        }))
        .sort((a: any, b: any) => a.subjectName.localeCompare(b.subjectName))

      // Subjects únicos para organização de notas
      const subjects = ctsWithSubjects
        .filter((cts: any, i: number, arr: any[]) => arr.findIndex(x => x.subjectId === cts.subjectId) === i)

      // Carregar notas do aluno
      const gradesData = await gradeService.getStudentGrades(studentProfileId)

      // Carregar frequência por disciplina usando class_teacher_subject_id
      const attendanceBySubject = await loadAttendanceBySubject(ctsWithSubjects, student.student_enrollment_id)

      // Organizar notas por disciplina e período
      const organizedGrades: SubjectGradesData[] = subjects.map((subject: any) => {
        const subjectGradesData = (gradesData || []).filter(
          (g: any) => g.evaluation_instance?.class_teacher_subject?.subject_id === subject.subjectId
        )

        // Organizar por período
        const periodGrades: PeriodGrades[] = sortedPeriods.map((period: AcademicPeriod, index: number) => {
          const periodGradesData = subjectGradesData.filter(
            (g: any) => g.evaluation_instance?.academic_period_id === period.id
          )

          // Separar notas regulares e de recuperação
          const regularGrades = periodGradesData.filter(
            (g: any) => g.evaluation_instance?.evaluation_type !== 'Recuperacao'
          )
          const recoveryGrades = periodGradesData.filter(
            (g: any) => g.evaluation_instance?.evaluation_type === 'Recuperacao'
          )

          // Calcular média das notas regulares
          let regularGrade: number | null = null
          if (regularGrades.length > 0) {
            const sum = regularGrades.reduce((acc: number, g: any) => acc + (g.grade_value || 0), 0)
            regularGrade = sum / regularGrades.length
          }

          // Pegar a maior nota de recuperação (caso tenha mais de uma)
          let recoveryGrade: number | null = null
          if (recoveryGrades.length > 0) {
            recoveryGrade = Math.max(...recoveryGrades.map((g: any) => g.grade_value || 0))
          }

          // A nota final é a maior entre regular e recuperação
          let finalGrade: number | null = null
          if (regularGrade !== null || recoveryGrade !== null) {
            finalGrade = Math.max(regularGrade || 0, recoveryGrade || 0)
          }

          return {
            periodId: period.id,
            periodName: period.name,
            periodOrder: index + 1,
            regularGrade,
            recoveryGrade,
            finalGrade,
          }
        })

        // Calcular média final usando regra de avaliação (ponderada ou simples)
        const gradesArray = periodGrades.map(p => p.finalGrade)
        let finalAverage: number | null = null

        if (gradesArray.some(g => g !== null)) {
          // Verificar se há regra de avaliação e se é média ponderada
          if (rule?.calculation_type === 'Media_Ponderada' && rule.period_weights) {
            // Usar cálculo ponderado
            finalAverage = evaluationRulesService.calculateWeightedAverage(gradesArray, rule.period_weights)
          } else if (rule?.period_weights) {
            // Usar pesos configurados mesmo para média simples
            finalAverage = evaluationRulesService.calculateWeightedAverage(gradesArray, rule.period_weights)
          } else {
            // Cálculo padrão (média simples)
            const validFinalGrades = periodGrades.filter(p => p.finalGrade !== null)
            finalAverage = validFinalGrades.length > 0
              ? Math.round((validFinalGrades.reduce((sum, p) => sum + (p.finalGrade || 0), 0) / validFinalGrades.length) * 100) / 100
              : null
          }
        }

        // Buscar frequência da disciplina
        const subjectAttendance = attendanceBySubject.find(a => a.subjectId === subject.subjectId)

        return {
          subjectId: subject.subjectId,
          subjectName: subject.subjectName,
          periodGrades,
          finalAverage,
          attendanceRate: subjectAttendance?.attendanceRate || 0,
        }
      })

      setSubjectGrades(organizedGrades)
      setAttendanceData(attendanceBySubject)
    } catch (error) {
      console.error('Erro ao carregar notas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceBySubject = async (ctsWithSubjects: any[], studentEnrollmentId?: number): Promise<AttendanceBySubject[]> => {
    const attendanceBySubject: AttendanceBySubject[] = []
    let totalPresent = 0
    let totalAbsent = 0
    let totalJustified = 0
    let totalClasses = 0

    // Se não temos o enrollment_id, tentar buscar
    let enrollmentId = studentEnrollmentId
    if (!enrollmentId && studentProfileId) {
      const { data: enrollment } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_profile_id', studentProfileId)
        .maybeSingle()
      enrollmentId = enrollment?.id
    }

    if (!enrollmentId) {
      // Sem enrollment, retornar dados vazios
      return ctsWithSubjects.map(cts => ({
        subjectId: cts.subjectId,
        subjectName: cts.subjectName,
        totalClasses: 0,
        present: 0,
        absent: 0,
        justified: 0,
        attendanceRate: 0,
      }))
    }

    for (const cts of ctsWithSubjects) {
      // Buscar aulas da disciplina usando class_teacher_subject_id
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('class_teacher_subject_id', cts.classTeacherSubjectId)

      const lessonIds = (lessons || []).map((l: any) => l.id)

      if (lessonIds.length === 0) {
        attendanceBySubject.push({
          subjectId: cts.subjectId,
          subjectName: cts.subjectName,
          totalClasses: 0,
          present: 0,
          absent: 0,
          justified: 0,
          attendanceRate: 0,
        })
        continue
      }

      // Buscar frequência do aluno nessas aulas (usando student_enrollment_id e status)
      const { data: attendances } = await supabase
        .from('attendances')
        .select('status')
        .eq('student_enrollment_id', enrollmentId)
        .in('lesson_id', lessonIds)

      const present = (attendances || []).filter(a => a.status === 'Presente').length
      const absent = (attendances || []).filter(a =>
        a.status === 'Ausente' || a.status === 'Falta Injustificada'
      ).length
      const justified = (attendances || []).filter(a =>
        a.status === 'Justificado' ||
        a.status === 'Atestado' ||
        a.status === 'Falta Justificada'
      ).length
      const subjectTotal = present + absent + justified
      const rate = subjectTotal > 0 ? ((present + justified) / subjectTotal) * 100 : 0

      attendanceBySubject.push({
        subjectId: cts.subjectId,
        subjectName: cts.subjectName,
        totalClasses: subjectTotal,
        present,
        absent,
        justified,
        attendanceRate: Math.round(rate * 10) / 10,
      })

      totalPresent += present
      totalAbsent += absent
      totalJustified += justified
      totalClasses += subjectTotal
    }

    setOverallAttendance({
      totalClasses,
      present: totalPresent,
      absent: totalAbsent,
      justified: totalJustified,
      rate: totalClasses > 0 ? Math.round(((totalPresent + totalJustified) / totalClasses) * 1000) / 10 : 0,
    })

    return attendanceBySubject
  }

  const loadAttendance = async () => {
    if (!studentProfileId) return

    setLoading(true)
    try {
      // Carregar disciplinas da turma com class_teacher_subject_id
      const { data: classTeacherSubjectsData } = await supabase
        .from('class_teacher_subjects')
        .select(`
          id,
          subject:subjects(id, name, code)
        `)
        .eq('class_id', classId)

      // Mapear class_teacher_subjects com subject info para uso na frequência
      const ctsWithSubjects = (classTeacherSubjectsData || [])
        .filter((cts: any) => cts.subject)
        .map((cts: any) => ({
          classTeacherSubjectId: cts.id,
          subjectId: cts.subject.id,
          subjectName: cts.subject.name,
          subjectCode: cts.subject.code,
        }))
        .sort((a: any, b: any) => a.subjectName.localeCompare(b.subjectName))

      await loadAttendanceBySubject(ctsWithSubjects, student.student_enrollment_id)
    } catch (error) {
      console.error('Erro ao carregar frequência:', error)
    } finally {
      setLoading(false)
    }
  }

  // Extrai o número do período do nome (ex: "1º Bimestre" -> 1)
  const extractPeriodOrder = (name: string): number => {
    const match = name.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 999
  }

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

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-muted-foreground'
    const minApproval = evaluationRule?.min_approval_grade || 7
    if (grade >= minApproval) return 'text-green-600'
    if (grade >= 5) return 'text-amber-600'
    return 'text-red-600'
  }

  const getAttendanceColor = (rate: number) => {
    const minAttendance = evaluationRule?.min_attendance_percent || 75
    if (rate >= minAttendance) return 'text-green-600'
    if (rate >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const getSituacaoFromGrade = (grade: number | null, attendance: number) => {
    const minApproval = evaluationRule?.min_approval_grade || 7
    const minAttendance = evaluationRule?.min_attendance_percent || 75
    if (grade === null) return { label: '-', variant: 'outline' as const, icon: null }
    if (attendance < minAttendance) return { label: 'Reprovado', variant: 'destructive' as const, icon: XCircle }
    if (grade >= minApproval) return { label: 'Aprovado', variant: 'success' as const, icon: CheckCircle2 }
    if (grade >= 5) return { label: 'Recuperação', variant: 'warning' as const, icon: AlertCircle }
    return { label: 'Reprovado', variant: 'destructive' as const, icon: XCircle }
  }

  const formatGrade = (grade: number | null): string => {
    if (grade === null) return '-'
    return grade.toFixed(1)
  }

  // Verifica se há recuperações registradas
  const hasRecoveryGrades = subjectGrades.some(
    subject => subject.periodGrades.some(p => p.recoveryGrade !== null)
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-[60] w-full max-w-6xl bg-background rounded-lg shadow-lg border max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-medium text-primary">
                {student.person?.full_name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {student.person?.full_name || 'Nome não informado'}
                {student.is_pcd && (
                  <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                    <Accessibility className="h-3 w-3 mr-1" />
                    PCD
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                Nº {student.order_number || '-'} • Matrícula: {student.student_registration_number || student.registration_number || 'Não informado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getSituacaoBadge()}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4 flex-shrink-0">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('info')}
          >
            <Users className="h-4 w-4 inline-block mr-2" />
            Informações
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'boletim'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('boletim')}
          >
            <FileText className="h-4 w-4 inline-block mr-2" />
            Boletim
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'frequencia'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('frequencia')}
          >
            <Calendar className="h-4 w-4 inline-block mr-2" />
            Frequência
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Aba: Informações */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Dados Pessoais */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Nome Completo</Label>
                      <p className="font-medium">{student.person?.full_name || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Data de Nascimento</Label>
                      <p className="font-medium">
                        {student.person?.birth_date
                          ? format(new Date(student.person.birth_date), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Gênero</Label>
                      <p className="font-medium">{student.person?.gender || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">CPF</Label>
                      <p className="font-medium">{student.person?.cpf || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">E-mail</Label>
                      <p className="font-medium">{student.person?.email || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Telefone</Label>
                      <p className="font-medium">{student.person?.phone || 'Não informado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados de Matrícula */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dados de Matrícula</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Nº de Ordem</Label>
                      <p className="font-medium">{student.order_number || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Código de Matrícula</Label>
                      <p className="font-medium">
                        {student.student_registration_number || student.registration_number || student.enrollment_code || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Situação</Label>
                      <div className="mt-1">{getSituacaoBadge()}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Data de Matrícula na Turma</Label>
                      <p className="font-medium">
                        {student.class_enrollment_date
                          ? format(new Date(student.class_enrollment_date), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações PCD */}
              {student.is_pcd && (
                <Card className="border-cyan-200 bg-cyan-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-cyan-700">
                      <Accessibility className="h-4 w-4" />
                      Informações PCD
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-cyan-600">CID</Label>
                        <p className="font-medium text-cyan-700">
                          {student.cid_code || 'Não informado'}
                          {student.cid_description && ` - ${student.cid_description}`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-cyan-600">Laudo Médico</Label>
                        <p className="font-medium text-cyan-700">
                          {student.has_medical_report ? '✓ Possui laudo médico' : 'Não possui'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Aba: Boletim */}
          {activeTab === 'boletim' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : subjectGrades.length === 0 && periods.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhuma disciplina ou período cadastrado para esta turma.</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Verifique se há disciplinas vinculadas à turma e períodos acadêmicos configurados.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Sub-abas do Boletim */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={boletimSubTab === 'notas' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBoletimSubTab('notas')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Boletim
                    </Button>
                    <Button
                      variant={boletimSubTab === 'recuperacao' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBoletimSubTab('recuperacao')}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recuperação
                    </Button>
                  </div>

                  {/* Tabela de Notas Principal */}
                  {boletimSubTab === 'notas' && (
                    <Card>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold min-w-[180px]">Disciplina</TableHead>
                                {periods.map((period, index) => (
                                  <TableHead key={period.id} className="text-center font-semibold min-w-[70px]">
                                    {index + 1}ª Av.
                                  </TableHead>
                                ))}
                                <TableHead className="text-center font-semibold min-w-[80px]">Média</TableHead>
                                <TableHead className="text-center font-semibold min-w-[70px]">Freq.(%)</TableHead>
                                <TableHead className="text-center font-semibold min-w-[100px]">Situação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subjectGrades.map((subject) => {
                                const situacao = getSituacaoFromGrade(subject.finalAverage, subject.attendanceRate)
                                const IconComponent = situacao.icon

                                return (
                                  <TableRow key={subject.subjectId}>
                                    <TableCell className="font-medium">{subject.subjectName}</TableCell>
                                    {subject.periodGrades.map((periodGrade) => (
                                      <TableCell key={periodGrade.periodId} className="text-center">
                                        <span className={`font-semibold ${getGradeColor(periodGrade.finalGrade)}`}>
                                          {formatGrade(periodGrade.finalGrade)}
                                        </span>
                                      </TableCell>
                                    ))}
                                    <TableCell className="text-center">
                                      <span className={`font-bold text-lg ${getGradeColor(subject.finalAverage)}`}>
                                        {formatGrade(subject.finalAverage)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className={`font-semibold ${getAttendanceColor(subject.attendanceRate)}`}>
                                        {subject.attendanceRate}%
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {situacao.label === '-' ? (
                                        <Badge variant="outline">-</Badge>
                                      ) : situacao.variant === 'success' ? (
                                        <Badge className="bg-green-500">
                                          {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                                          {situacao.label}
                                        </Badge>
                                      ) : situacao.variant === 'warning' ? (
                                        <Badge className="bg-amber-500">
                                          {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                                          {situacao.label}
                                        </Badge>
                                      ) : (
                                        <Badge variant="destructive">
                                          {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                                          {situacao.label}
                                        </Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tabela de Recuperação */}
                  {boletimSubTab === 'recuperacao' && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Boletim de Recuperação
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          A maior nota entre a avaliação regular e a recuperação é considerada para a média final (Boletim).
                        </p>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold min-w-[180px]">Disciplina</TableHead>
                                {periods.map((period, index) => (
                                  <Fragment key={`header-${period.id}`}>
                                    <TableHead className="text-center font-semibold min-w-[60px] border-l">
                                      {index + 1}ª Av.
                                    </TableHead>
                                    <TableHead className="text-center font-semibold min-w-[60px]">
                                      {index + 1}ª Rec.
                                    </TableHead>
                                    <TableHead className="text-center font-semibold min-w-[70px] bg-blue-50 text-blue-700">
                                      Boletim
                                    </TableHead>
                                  </Fragment>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subjectGrades.map((subject) => (
                                <TableRow key={subject.subjectId}>
                                  <TableCell className="font-medium">{subject.subjectName}</TableCell>
                                  {subject.periodGrades.map((periodGrade) => {
                                    const isRecoveryBetter =
                                      periodGrade.recoveryGrade !== null &&
                                      periodGrade.regularGrade !== null &&
                                      periodGrade.recoveryGrade > periodGrade.regularGrade

                                    return (
                                      <Fragment key={`grades-${periodGrade.periodId}`}>
                                        <TableCell
                                          className={`text-center border-l ${
                                            !isRecoveryBetter && periodGrade.regularGrade !== null
                                              ? 'bg-green-100 ring-2 ring-inset ring-green-400'
                                              : ''
                                          }`}
                                        >
                                          <span className={`font-semibold ${getGradeColor(periodGrade.regularGrade)}`}>
                                            {formatGrade(periodGrade.regularGrade)}
                                          </span>
                                        </TableCell>
                                        <TableCell
                                          className={`text-center ${
                                            isRecoveryBetter ? 'bg-green-100 ring-2 ring-inset ring-green-400' : ''
                                          }`}
                                        >
                                          <span className={`font-semibold ${getGradeColor(periodGrade.recoveryGrade)}`}>
                                            {formatGrade(periodGrade.recoveryGrade)}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-center bg-blue-50">
                                          <span className={`font-bold ${getGradeColor(periodGrade.finalGrade)}`}>
                                            {formatGrade(periodGrade.finalGrade)}
                                          </span>
                                        </TableCell>
                                      </Fragment>
                                    )
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Legenda */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      Aprovado (≥{evaluationRule?.min_approval_grade?.toFixed(1) || '7,0'})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      Recuperação (5,0-{((evaluationRule?.min_approval_grade || 7) - 0.1).toFixed(1)})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      Reprovado (&lt;5,0 ou Freq.&lt;{evaluationRule?.min_attendance_percent || 75}%)
                    </span>
                    {boletimSubTab === 'recuperacao' && (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-green-100 ring-1 ring-green-400" />
                        Maior nota (usada no Boletim)
                      </span>
                    )}
                  </div>

                  {/* Regra de Avaliação */}
                  {evaluationRule && (
                    <Card className="bg-slate-50 border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                          <Info className="h-4 w-4" />
                          Regra de Avaliação: {evaluationRule.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">Nota Mínima:</span>
                            <span className="ml-1 font-medium text-slate-700">{evaluationRule.min_approval_grade?.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Frequência Mínima:</span>
                            <span className="ml-1 font-medium text-slate-700">{evaluationRule.min_attendance_percent}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Período:</span>
                            <span className="ml-1 font-medium text-slate-700">{evaluationRule.academic_period_type} ({evaluationRule.periods_per_year}x/ano)</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Tipo de Cálculo:</span>
                            <span className="ml-1 font-medium text-slate-700">
                              {evaluationRule.calculation_type === 'Media_Simples' ? 'Média Simples' :
                               evaluationRule.calculation_type === 'Media_Ponderada' ? 'Média Ponderada' :
                               evaluationRule.calculation_type === 'Descritiva' ? 'Descritiva' :
                               evaluationRule.calculation_type}
                            </span>
                          </div>
                        </div>

                        {/* Fórmula de Cálculo */}
                        <div className="bg-white rounded-md p-3 border border-slate-200">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Fórmula de Cálculo da Média:</p>
                          <p className="text-sm font-mono text-slate-700">
                            {evaluationRule.formula_description ||
                             evaluationRulesService.generateFormulaDescription(evaluationRule)}
                          </p>
                          {evaluationRule.period_weights && evaluationRule.calculation_type === 'Media_Ponderada' && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <p className="text-xs text-slate-500">
                                <strong>Pesos por período:</strong>{' '}
                                {evaluationRule.period_weights.weights.map((w, i) => `${i + 1}º: ${w}`).join(' | ')}
                                {' | '}
                                <strong>Divisor:</strong> {evaluationRule.period_weights.divisor}
                              </p>
                            </div>
                          )}
                        </div>

                        {evaluationRule.allow_recovery && (
                          <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                            <strong>Recuperação:</strong> {evaluationRule.recovery_replaces_lowest
                              ? 'A maior nota entre avaliação e recuperação é considerada para o cálculo da média final.'
                              : 'A nota de recuperação é somada à média do período.'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Aba: Frequência */}
          {activeTab === 'frequencia' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : attendanceData.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhuma frequência registrada para este aluno.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Resumo Geral */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-blue-600">Total de Aulas</p>
                        <p className="text-2xl font-bold text-blue-700">{overallAttendance.totalClasses}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-green-600">Presenças</p>
                        <p className="text-2xl font-bold text-green-700">{overallAttendance.present}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-red-600">Faltas</p>
                        <p className="text-2xl font-bold text-red-700">{overallAttendance.absent}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-amber-600">Justificadas</p>
                        <p className="text-2xl font-bold text-amber-700">{overallAttendance.justified}</p>
                      </CardContent>
                    </Card>
                    <Card className={`bg-gradient-to-br ${
                      overallAttendance.rate >= 75
                        ? 'from-green-50 to-green-100/50 border-green-200'
                        : overallAttendance.rate >= 60
                          ? 'from-amber-50 to-amber-100/50 border-amber-200'
                          : 'from-red-50 to-red-100/50 border-red-200'
                    }`}>
                      <CardContent className="p-4 text-center">
                        <p className={`text-sm ${getAttendanceColor(overallAttendance.rate)}`}>Frequência Geral</p>
                        <p className={`text-2xl font-bold ${getAttendanceColor(overallAttendance.rate)}`}>
                          {overallAttendance.rate}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabela por Disciplina */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Frequência por Disciplina</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Disciplina</TableHead>
                            <TableHead className="text-center font-semibold">Total Aulas</TableHead>
                            <TableHead className="text-center font-semibold">Presenças</TableHead>
                            <TableHead className="text-center font-semibold">Faltas</TableHead>
                            <TableHead className="text-center font-semibold">Justificadas</TableHead>
                            <TableHead className="text-center font-semibold w-[150px]">Frequência</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceData.map((item) => (
                            <TableRow key={item.subjectId}>
                              <TableCell className="font-medium">{item.subjectName}</TableCell>
                              <TableCell className="text-center">{item.totalClasses}</TableCell>
                              <TableCell className="text-center text-green-600 font-medium">{item.present}</TableCell>
                              <TableCell className="text-center text-red-600 font-medium">{item.absent}</TableCell>
                              <TableCell className="text-center text-amber-600 font-medium">{item.justified}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className={`font-semibold ${getAttendanceColor(item.attendanceRate)}`}>
                                      {item.attendanceRate}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={item.attendanceRate}
                                    className="h-2"
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Alerta de frequência baixa */}
                  {overallAttendance.rate < 75 && (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-700">Atenção: Frequência abaixo do mínimo</p>
                          <p className="text-sm text-red-600">
                            A frequência mínima exigida é de 75%. O aluno está com {overallAttendance.rate}%.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default StudentDetailsModal
