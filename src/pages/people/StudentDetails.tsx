import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  FileText,
  Briefcase,
  Book,
  ArrowRightLeft,
  Plus,
  Trophy,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useStudentStore from '@/stores/useStudentStore'
import useProjectStore from '@/stores/useProjectStore'
import useUserStore from '@/stores/useUserStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useCourseStore from '@/stores/useCourseStore'
import useAttendanceStore from '@/stores/useAttendanceStore'
import { useState } from 'react'
import { StudentFormDialog } from './components/StudentFormDialog'
import { EnrollmentFormDialog } from './components/EnrollmentFormDialog'
import { ProjectEnrollmentDialog } from './components/ProjectEnrollmentDialog'
import { StudentTransferDialog } from './components/StudentTransferDialog'
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
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StudentInfoCard } from './components/StudentInfoCard'
import { StudentPerformanceCard } from './components/StudentPerformanceCard'
import { StudentAssessmentHistory } from './components/StudentAssessmentHistory'

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    getStudent,
    updateStudent,
    deleteStudent,
    addEnrollment,
    updateEnrollment,
    addProjectEnrollment,
    removeProjectEnrollment,
  } = useStudentStore()
  const { projects } = useProjectStore()
  const { currentUser } = useUserStore()
  const { schools } = useSchoolStore()
  const { assessments, assessmentTypes } = useAssessmentStore()
  const { courses } = useCourseStore()
  const { getStudentAttendance } = useAttendanceStore()
  const { toast } = useToast()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const student = getStudent(id || '')
  const isAdminOrSupervisor =
    currentUser?.role === 'admin' || currentUser?.role === 'supervisor'

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Aluno não encontrado</h2>
        <Button onClick={() => navigate('/pessoas/alunos')}>
          Voltar para Lista
        </Button>
      </div>
    )
  }

  // --- Prepare Data for Enhanced Views ---

  // 1. Current Enrollment & School Info
  const activeEnrollment = student.enrollments.find(
    (e) => e.status === 'Cursando',
  )
  const currentSchool = schools.find((s) => s.id === activeEnrollment?.schoolId)
  const currentYear = currentSchool?.academicYears.find(
    (y) => y.name === activeEnrollment?.year.toString(),
  )

  // 2. Attendance Stats
  const attendanceRecords = getStudentAttendance(student.id)
  const totalAttendance = attendanceRecords.length
  const presentCount = attendanceRecords.filter((r) => r.present).length
  const attendancePercentage =
    totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100

  // 3. Subjects & Periods (for Assessment History)
  // Need to find the correct Course/Grade structure
  let gradeStructure: any = null
  let periods: any[] = currentYear?.periods || []

  if (activeEnrollment && currentYear) {
    const classroom = currentYear.classes.find(
      (c) => c.name === activeEnrollment.grade,
    )
    for (const course of courses) {
      const g = course.grades.find(
        (gr) =>
          gr.name === activeEnrollment.grade ||
          (classroom && gr.id === classroom.gradeId),
      )
      if (g) {
        gradeStructure = g
        break
      }
    }
  }
  const subjects = gradeStructure?.subjects || []

  // --- Handlers ---

  const handleUpdate = (data: any) => {
    updateStudent(student.id, data)
    toast({
      title: 'Aluno atualizado',
      description: 'Dados atualizados com sucesso.',
    })
  }

  const handleDelete = () => {
    deleteStudent(student.id)
    toast({
      title: 'Aluno excluído',
      description: 'Registro removido com sucesso.',
    })
    navigate('/pessoas/alunos')
  }

  const handleAddEnrollment = (data: any) => {
    addEnrollment(student.id, data)
    toast({
      title: 'Matrícula adicionada',
      description: 'Nova matrícula registrada com sucesso.',
    })
  }

  const handleAddProject = (projectId: string) => {
    addProjectEnrollment(student.id, projectId)
    toast({
      title: 'Projeto adicionado',
      description: 'Aluno matriculado no projeto.',
    })
  }

  const handleRemoveProject = (projectId: string) => {
    removeProjectEnrollment(student.id, projectId)
    toast({
      title: 'Projeto removido',
      description: 'Matrícula no projeto cancelada.',
    })
  }

  const handleTransfer = (
    type: 'internal' | 'external',
    destination: string,
    notes?: string,
  ) => {
    const newStatus = 'Transferido'
    updateStudent(student.id, { status: newStatus })

    const activeEnrollment = student.enrollments.find(
      (e) => e.status === 'Cursando',
    )
    if (activeEnrollment) {
      updateEnrollment(student.id, activeEnrollment.id, {
        status: 'Transferido',
      })
    }
    toast({
      title: 'Processo Iniciado',
      description: `Transferência para ${destination} registrada.`,
    })
  }

  const generateDocument = (docName: string) => {
    toast({
      title: 'Gerando Documento',
      description: `O documento "${docName}" está sendo gerado.`,
    })
  }

  const getProjectName = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId)
    return proj ? `${proj.name} (${proj.schedule})` : 'Projeto desconhecido'
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/pessoas/alunos')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage
                src={`https://img.usecurling.com/ppl/medium?seed=${student.id}`}
              />
              <AvatarFallback className="text-lg">
                {student.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-primary tracking-tight">
                {student.name}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                  {student.registration}
                </span>
                <span>•</span>
                <span>
                  {activeEnrollment
                    ? `${activeEnrollment.grade} - ${currentSchool?.name}`
                    : 'Sem matrícula ativa'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 self-end md:self-auto">
          <Button variant="outline" onClick={() => generateDocument('Boletim')}>
            <Printer className="mr-2 h-4 w-4" /> Boletim
          </Button>
          {isAdminOrSupervisor && (
            <Button variant="default" onClick={() => setIsEditDialogOpen(true)}>
              Editar Cadastro
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Info & Stats */}
        <div className="col-span-1 space-y-6">
          {/* Quick Stats Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Resumo Acadêmico
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">
                  {attendancePercentage.toFixed(0)}%
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Frequência
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">
                  {activeEnrollment ? activeEnrollment.status : student.status}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Situação
                </span>
              </div>
            </CardContent>
          </Card>

          <StudentInfoCard student={student} />

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Documentos & Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start h-9"
                onClick={() => generateDocument('Ficha do Aluno')}
              >
                <FileText className="mr-2 h-4 w-4" /> Ficha Cadastral
              </Button>
              <Button
                variant="outline"
                className="justify-start h-9"
                onClick={() => generateDocument('Histórico Escolar')}
              >
                <Book className="mr-2 h-4 w-4" /> Histórico Escolar
              </Button>
              {isAdminOrSupervisor && (
                <>
                  <Separator className="my-1" />
                  <Button
                    variant="default"
                    className="justify-start h-9 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => setIsTransferDialogOpen(true)}
                  >
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Transferência
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Academic Performance */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <StudentPerformanceCard student={student} />

          {/* New Assessment History Component */}
          <StudentAssessmentHistory
            assessments={assessments.filter((a) => a.studentId === student.id)}
            assessmentTypes={assessmentTypes}
            subjects={subjects}
            periods={periods}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Matrículas</CardTitle>
                {isAdminOrSupervisor && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEnrollmentDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {student.enrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ano</TableHead>
                        <TableHead>Série</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.enrollments.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.year}</TableCell>
                          <TableCell className="font-medium">
                            {e.grade}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{e.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Projetos</CardTitle>
                {isAdminOrSupervisor && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsProjectDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {student.projectIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 italic">
                    Não participa de projetos.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {student.projectIds.map((pid) => (
                      <div
                        key={pid}
                        className="flex items-center justify-between p-2 bg-secondary/10 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium">
                            {getProjectName(pid)}
                          </span>
                        </div>
                        {isAdminOrSupervisor && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleRemoveProject(pid)}
                          >
                            <Plus className="h-3 w-3 rotate-45" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <StudentFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        initialData={student}
      />
      <EnrollmentFormDialog
        open={isEnrollmentDialogOpen}
        onOpenChange={setIsEnrollmentDialogOpen}
        onSubmit={handleAddEnrollment}
      />
      <ProjectEnrollmentDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onSubmit={handleAddProject}
        excludeProjectIds={student.projectIds}
      />
      <StudentTransferDialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        onTransfer={handleTransfer}
        student={student}
      />
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
