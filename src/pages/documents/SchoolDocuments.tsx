import { useState, useEffect } from 'react'
import { FileText, Download, Search, Filter, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import useDocumentStore from '@/stores/useDocumentStore'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useAttendanceStore from '@/stores/useAttendanceStore'
import useCourseStore from '@/stores/useCourseStore'
import { DocumentType, SchoolDocument } from '@/lib/mock-data'
import {
  generateHistoricoEscolar,
  generateDeclaracaoMatricula,
  generateFichaIndividual,
  generateDeclaracaoTransferencia,
  generateAtaResultados,
  generateCertificado,
  type HistoricoGeneratorOptions,
  type FichaIndividualOptions,
  type DeclaracaoTransferenciaOptions,
  type AtaResultadosOptions,
  type CertificadoOptions,
} from '@/lib/document-generators'
import { getAcademicYearFromEnrollment, getClassroomFromEnrollment } from '@/lib/enrollment-utils'
import { calculateGrades } from '@/lib/grade-calculator'
import { DocumentGenerationDialog } from './components/DocumentGenerationDialog'

export default function SchoolDocuments() {
  const {
    documents,
    addDocument,
    getDocumentsByStudent,
    getDocumentsBySchool,
    generateProtocolNumber,
    getNextSequentialNumber,
  } = useDocumentStore()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const { assessments } = useAssessmentStore()
  const { attendanceRecords } = useAttendanceStore()
  const { etapasEnsino } = useCourseStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all')
  const [schoolFilter, setSchoolFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filtrar documentos
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchTerm === '' ||
      doc.protocolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.studentId
        ? students.find((s) => s.id === doc.studentId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
        : false

    const matchesType = typeFilter === 'all' || doc.type === typeFilter
    const matchesSchool = schoolFilter === 'all' || doc.schoolId === schoolFilter

    return matchesSearch && matchesType && matchesSchool
  })

  const handleGenerateDocument = async (
    type: DocumentType,
    studentId: string,
    schoolId: string,
    academicYearId?: string,
    classroomId?: string,
  ) => {
    try {
      const student = students.find((s) => s.id === studentId)
      const school = schools.find((s) => s.id === schoolId)

      if (!student || !school) {
        toast({
          title: 'Erro',
          description: 'Aluno ou escola não encontrados.',
          variant: 'destructive',
        })
        return
      }

      let blob: Blob
      let content: Record<string, unknown> = {}

      if (type === 'historico') {
        // Preparar dados para histórico
        const allEnrollments = student.enrollments.map((enrollment) => {
          const academicYear = getAcademicYearFromEnrollment(enrollment, schools)
          const classroom = academicYear
            ? getClassroomFromEnrollment(
                enrollment.classroomId,
                enrollment.grade,
                academicYear,
              )
            : undefined

          if (!academicYear || !classroom) {
            return null
          }

          // Buscar serieAno e subjects
          const allSeriesAnos = etapasEnsino.flatMap((e) => e.seriesAnos)
          const grade = allSeriesAnos.find((s) => s.id === classroom.serieAnoId)
          const subjects = grade?.subjects || []

          // Buscar avaliações e frequência
          const enrollmentAssessments = assessments.filter(
            (a) =>
              a.studentId === student.id &&
              a.schoolId === enrollment.schoolId &&
              a.yearId === academicYear.id &&
              a.classroomId === enrollment.classroomId,
          )

          const enrollmentAttendance = attendanceRecords.filter(
            (r) =>
              r.studentId === student.id &&
              r.schoolId === enrollment.schoolId &&
              r.yearId === academicYear.id &&
              r.classroomId === enrollment.classroomId,
          )

          // Buscar regra de avaliação - simplificado por enquanto
          const evaluationRule = grade?.evaluationRuleId
            ? {
                id: grade.evaluationRuleId,
                name: 'Regra Padrão',
                type: 'numeric' as const,
                description: '',
                minGrade: 0,
                maxGrade: 10,
                passingGrade: 6.0,
                minDependencyGrade: 4.0,
                minAttendance: 75,
                isStandard: true,
                periodCount: 4,
              }
            : undefined

          if (!evaluationRule) {
            return null
          }

          return {
            enrollmentId: enrollment.id,
            academicYearName: academicYear.name,
            gradeName: enrollment.grade,
            className: classroom.name,
            schoolName: school.name,
            assessments: enrollmentAssessments,
            attendanceRecords: enrollmentAttendance,
            periods: academicYear.periods || [],
            subjects,
            evaluationRule,
          }
        }).filter((e) => e !== null) as HistoricoGeneratorOptions['allEnrollments']

        const options: HistoricoGeneratorOptions = {
          student,
          school,
          academicYear: academicYearId
            ? school.academicYears.find((y) => y.id === academicYearId)
            : undefined,
          classroom: classroomId
            ? school.academicYears
                .flatMap((y) => y.classes)
                .find((c) => c.id === classroomId)
            : undefined,
          allEnrollments,
        }

        const protocolNumber = generateProtocolNumber(schoolId)
        const sequentialNumber = getNextSequentialNumber('historico', schoolId)

        blob = generateHistoricoEscolar(options, protocolNumber, sequentialNumber)
        content = { type: 'historico', allEnrollments }
      } else if (type === 'declaracao_matricula') {
        const academicYear = academicYearId
          ? school.academicYears.find((y) => y.id === academicYearId)
          : undefined
        const turmas = academicYear?.turmas || []
        const classroom = classroomId && academicYear
          ? turmas.find((c) => c.id === classroomId)
          : undefined

        if (!academicYear || !classroom) {
          toast({
            title: 'Erro',
            description: 'Ano letivo ou turma não encontrados.',
            variant: 'destructive',
          })
          return
        }

        const options = {
          student,
          school,
          academicYear,
          classroom,
        }

        const protocolNumber = generateProtocolNumber(schoolId)
        const sequentialNumber = getNextSequentialNumber('declaracao_matricula', schoolId)

        blob = generateDeclaracaoMatricula(options, protocolNumber, sequentialNumber)
        content = { type: 'declaracao_matricula' }
      } else if (type === 'ficha_individual') {
        // Preparar dados para ficha individual (similar ao histórico)
        const allEnrollments = student.enrollments.map((enrollment) => {
          const academicYear = getAcademicYearFromEnrollment(enrollment, schools)
          const classroom = academicYear
            ? getClassroomFromEnrollment(
                enrollment.classroomId,
                enrollment.grade,
                academicYear,
              )
            : undefined

          if (!academicYear || !classroom) {
            return null
          }

          const enrollmentAssessments = assessments.filter(
            (a) =>
              a.studentId === student.id &&
              a.schoolId === enrollment.schoolId &&
              a.yearId === academicYear.id &&
              a.classroomId === enrollment.classroomId,
          )

          const enrollmentAttendance = attendanceRecords.filter(
            (r) =>
              r.studentId === student.id &&
              r.schoolId === enrollment.schoolId &&
              r.yearId === academicYear.id &&
              r.classroomId === enrollment.classroomId,
          )

          return {
            academicYearName: academicYear.name,
            gradeName: enrollment.grade,
            className: classroom.name,
            schoolName: school.name,
            assessments: enrollmentAssessments,
            attendanceRecords: enrollmentAttendance,
            finalStatus: enrollment.status,
          }
        }).filter((e) => e !== null) as FichaIndividualOptions['allEnrollments']

        const options: FichaIndividualOptions = {
          student,
          school,
          academicYear: academicYearId
            ? school.academicYears.find((y) => y.id === academicYearId)
            : undefined,
          classroom: classroomId
            ? school.academicYears
                .flatMap((y) => y.classes)
                .find((c) => c.id === classroomId)
            : undefined,
          allEnrollments,
        }

        const protocolNumber = generateProtocolNumber(schoolId)
        const sequentialNumber = getNextSequentialNumber('ficha_individual', schoolId)

        blob = generateFichaIndividual(options, protocolNumber, sequentialNumber)
        content = { type: 'ficha_individual', allEnrollments }
      } else if (type === 'declaracao_transferencia') {
        const academicYear = academicYearId
          ? school.academicYears.find((y) => y.id === academicYearId)
          : undefined
        const turmas = academicYear?.turmas || []
        const classroom = classroomId && academicYear
          ? turmas.find((c) => c.id === classroomId)
          : undefined

        if (!academicYear || !classroom) {
          toast({
            title: 'Erro',
            description: 'Ano letivo ou turma não encontrados.',
            variant: 'destructive',
          })
          return
        }

        // Buscar dependências do aluno
        const currentEnrollment = student.enrollments.find(
          (e) => e.schoolId === schoolId && e.status === 'Cursando',
        )
        const dependencies = currentEnrollment?.type === 'dependency' ? [
          { subject: 'Disciplina em Dependência', grade: currentEnrollment.grade },
        ] : []

        const options: DeclaracaoTransferenciaOptions = {
          student,
          school,
          academicYear,
          classroom,
          transferDate: new Date().toISOString(),
          dependencies,
        }

        const protocolNumber = generateProtocolNumber(schoolId)
        const sequentialNumber = getNextSequentialNumber('declaracao_transferencia', schoolId)

        blob = generateDeclaracaoTransferencia(options, protocolNumber, sequentialNumber)
        content = { type: 'declaracao_transferencia' }
      } else if (type === 'ata_resultados') {
        const academicYear = academicYearId
          ? school.academicYears.find((y) => y.id === academicYearId)
          : undefined
        const turmas = academicYear?.turmas || []
        const classroom = classroomId && academicYear
          ? turmas.find((c) => c.id === classroomId)
          : undefined

        if (!academicYear || !classroom) {
          toast({
            title: 'Erro',
            description: 'Ano letivo ou turma não encontrados.',
            variant: 'destructive',
          })
          return
        }

        // Buscar todos os alunos da turma
        const allSeriesAnos = etapasEnsino.flatMap((e) => e.seriesAnos)
        const grade = allSeriesAnos.find((s) => s.id === classroom.serieAnoId)
        const subjects = grade?.subjects || []

        const classroomStudents = students.filter((s) => {
          return s.enrollments.some(
            (e) =>
              e.schoolId === schoolId &&
              e.academicYearId === academicYearId &&
              e.classroomId === classroomId &&
              e.status === 'Cursando',
          )
        })

        const studentsData = classroomStudents.map((s) => ({
          student: s,
          assessments: assessments.filter(
            (a) =>
              a.studentId === s.id &&
              a.schoolId === schoolId &&
              a.yearId === academicYearId &&
              a.classroomId === classroomId,
          ),
          attendanceRecords: attendanceRecords.filter(
            (r) =>
              r.studentId === s.id &&
              r.schoolId === schoolId &&
              r.yearId === academicYearId &&
              r.classroomId === classroomId,
          ),
        }))

        const evaluationRule = grade?.evaluationRuleId
          ? {
              id: grade.evaluationRuleId,
              name: 'Regra Padrão',
              type: 'numeric' as const,
              description: '',
              minGrade: 0,
              maxGrade: 10,
              passingGrade: 6.0,
              minDependencyGrade: 4.0,
              minAttendance: 75,
              isStandard: true,
              periodCount: 4,
            }
          : undefined

        if (!evaluationRule) {
          toast({
            title: 'Erro',
            description: 'Regra de avaliação não encontrada.',
            variant: 'destructive',
          })
          return
        }

        const options: AtaResultadosOptions = {
          school,
          academicYear,
          classroom,
          students: studentsData,
          periods: academicYear.periods || [],
          subjects,
          evaluationRule,
        }

        const protocolNumber = generateProtocolNumber(schoolId)
        const sequentialNumber = getNextSequentialNumber('ata_resultados', schoolId)

        blob = generateAtaResultados(options, protocolNumber, sequentialNumber)
        content = { type: 'ata_resultados' }
      } else if (type === 'certificado') {
        const academicYear = academicYearId
          ? school.academicYears.find((y) => y.id === academicYearId)
          : undefined
        const turmas = academicYear?.turmas || []
        const classroom = classroomId && academicYear
          ? turmas.find((c) => c.id === classroomId)
          : undefined

        if (!academicYear || !classroom) {
          toast({
            title: 'Erro',
            description: 'Ano letivo ou turma não encontrados.',
            variant: 'destructive',
          })
          return
        }

        // Verificar se aluno concluiu
        const enrollment = student.enrollments.find(
          (e) =>
            e.schoolId === schoolId &&
            e.academicYearId === academicYearId &&
            e.classroomId === classroomId,
        )

        if (enrollment?.status !== 'Aprovado') {
          toast({
            title: 'Aviso',
            description: 'Aluno precisa estar aprovado para gerar certificado.',
            variant: 'destructive',
          })
          return
        }

        // Calcular média final
        const allSeriesAnos = etapasEnsino.flatMap((e) => e.seriesAnos)
        const grade = allSeriesAnos.find((s) => s.id === classroom.serieAnoId)
        const subjects = grade?.subjects || []

        const studentAssessments = assessments.filter(
          (a) =>
            a.studentId === student.id &&
            a.schoolId === schoolId &&
            a.yearId === academicYearId &&
            a.classroomId === classroomId,
        )

        let totalGrade = 0
        let subjectCount = 0

        subjects.forEach((subject) => {
          const subjectAssessments = studentAssessments.filter((a) => a.subjectId === subject.id)
          if (subjectAssessments.length > 0) {
            const evaluationRule = grade?.evaluationRuleId
              ? {
                  id: grade.evaluationRuleId,
                  name: 'Regra Padrão',
                  type: 'numeric' as const,
                  description: '',
                  minGrade: 0,
                  maxGrade: 10,
                  passingGrade: 6.0,
                  minDependencyGrade: 4.0,
                  minAttendance: 75,
                  isStandard: true,
                  periodCount: 4,
                }
              : undefined

            if (evaluationRule) {
              const calculation = calculateGrades(
                subjectAssessments,
                evaluationRule,
                academicYear.periods || [],
                [],
                'replace_if_higher',
              )
              totalGrade += calculation.finalGrade
              subjectCount++
            }
          }
        })

        const finalGrade = subjectCount > 0 ? totalGrade / subjectCount : 0

        const options: CertificadoOptions = {
          student,
          school,
          academicYear,
          classroom,
          completionDate: new Date().toISOString(),
          courseName: grade?.name || classroom?.serieAnoName,
          finalGrade,
        }

        const protocolNumber = generateProtocolNumber(schoolId)
        const sequentialNumber = getNextSequentialNumber('certificado', schoolId)

        blob = generateCertificado(options, protocolNumber, sequentialNumber)
        content = { type: 'certificado', finalGrade }
      } else {
        toast({
          title: 'Aviso',
          description: 'Tipo de documento ainda não implementado.',
        })
        return
      }

      // Salvar documento no store
      addDocument({
        type,
        studentId,
        schoolId,
        academicYearId,
        classroomId,
        content,
        generatedBy: 'system',
        status: 'issued',
      })

      // Download do PDF
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}_${student.registration}_${new Date().getTime()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Sucesso',
        description: 'Documento gerado com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao gerar documento:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao gerar documento. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      historico: 'Histórico Escolar',
      declaracao_matricula: 'Declaração de Matrícula',
      ficha_individual: 'Ficha Individual',
      declaracao_transferencia: 'Declaração de Transferência',
      ata_resultados: 'Ata de Resultados',
      certificado: 'Certificado',
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: SchoolDocument['status']) => {
    const variants: Record<SchoolDocument['status'], 'default' | 'secondary' | 'destructive'> = {
      draft: 'secondary',
      issued: 'default',
      cancelled: 'destructive',
    }
    return (
      <Badge variant={variants[status]}>
        {status === 'draft' ? 'Rascunho' : status === 'issued' ? 'Emitido' : 'Cancelado'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Documentos Escolares
          </h2>
          <p className="text-muted-foreground">
            Gere e gerencie documentos oficiais dos alunos.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Gerar Documento
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Documentos Gerados</CardTitle>
          <CardDescription>
            Visualize e baixe os documentos já gerados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo ou aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as DocumentType | 'all')}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="historico">Histórico Escolar</SelectItem>
                <SelectItem value="declaracao_matricula">Declaração de Matrícula</SelectItem>
                <SelectItem value="ficha_individual">Ficha Individual</SelectItem>
                <SelectItem value="declaracao_transferencia">Declaração de Transferência</SelectItem>
                <SelectItem value="ata_resultados">Ata de Resultados</SelectItem>
                <SelectItem value="certificado">Certificado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Escola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as escolas</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Nenhum documento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => {
                    const student = students.find((s) => s.id === doc.studentId)
                    const school = schools.find((s) => s.id === doc.schoolId)

                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono text-sm">
                          {doc.protocolNumber}
                        </TableCell>
                        <TableCell>{getDocumentTypeLabel(doc.type)}</TableCell>
                        <TableCell>{student?.name || 'N/A'}</TableCell>
                        <TableCell>{school?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(doc.generatedAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Implementar download do documento salvo
                              toast({
                                title: 'Aviso',
                                description: 'Download será implementado em breve.',
                              })
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DocumentGenerationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onGenerate={handleGenerateDocument}
      />
    </div>
  )
}

