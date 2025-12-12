import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  FileText,
  User,
  GraduationCap,
  CalendarDays,
  BookOpen,
  School,
  ArrowRightLeft,
  Edit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import useStudentStore from '@/stores/useStudentStore'
import useUserStore from '@/stores/useUserStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useCourseStore from '@/stores/useCourseStore'
import useProjectStore from '@/stores/useProjectStore'
import { useState } from 'react'
import { StudentFormDialog } from './components/StudentFormDialog'
import { EnrollmentFormDialog } from './components/EnrollmentFormDialog'
import { ProjectEnrollmentDialog } from './components/ProjectEnrollmentDialog'
import { StudentTransferDialog } from './components/StudentTransferDialog'
import { StudentInfoCard } from './components/StudentInfoCard'
import { StudentPerformanceCard } from './components/StudentPerformanceCard'
import { StudentAssessmentHistory } from './components/StudentAssessmentHistory'
import { StudentAttendanceCard } from './components/StudentAttendanceCard'
import { useToast } from '@/hooks/use-toast'

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    getStudent,
    updateStudent,
    addEnrollment,
    addProjectEnrollment,
    removeProjectEnrollment,
    updateEnrollment,
  } = useStudentStore()
  const { schools } = useSchoolStore()
  const { assessments, assessmentTypes } = useAssessmentStore()
  const { courses } = useCourseStore()
  const { projects } = useProjectStore()
  const { currentUser } = useUserStore()
  const { toast } = useToast()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

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

  // Current Info
  const activeEnrollment = student.enrollments.find(
    (e) => e.status === 'Cursando',
  )
  const currentSchool = schools.find((s) => s.id === activeEnrollment?.schoolId)
  const currentYear = currentSchool?.academicYears.find(
    (y) => y.name === activeEnrollment?.year.toString(),
  )

  // Grade Structure for Assessments
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

  // Handlers
  const handleUpdate = (data: any) => {
    updateStudent(student.id, data)
    toast({
      title: 'Aluno atualizado',
      description: 'Dados atualizados com sucesso.',
    })
  }

  const handleAddEnrollment = (data: any) => {
    addEnrollment(student.id, data)
    toast({
      title: 'Matrícula realizada',
      description: 'Nova matrícula registrada.',
    })
  }

  const handleTransfer = (
    type: 'internal' | 'external',
    destination: string,
    notes?: string,
  ) => {
    const newStatus = 'Transferido'
    updateStudent(student.id, { status: newStatus })
    if (activeEnrollment) {
      updateEnrollment(student.id, activeEnrollment.id, {
        status: 'Transferido',
      })
    }
    toast({
      title: 'Transferência Registrada',
      description: `Aluno transferido para ${destination}.`,
    })
  }

  const handleAddProject = (projectId: string) => {
    addProjectEnrollment(student.id, projectId)
    toast({ title: 'Projeto', description: 'Aluno inscrito no projeto.' })
  }

  const handleRemoveProject = (projectId: string) => {
    removeProjectEnrollment(student.id, projectId)
    toast({ title: 'Projeto', description: 'Inscrição cancelada.' })
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
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir Ficha
          </Button>
          {isAdminOrSupervisor && (
            <Button variant="default" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Editar Cadastro
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="personal" className="gap-2 py-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Dados Pessoais</span>
            <span className="md:hidden">Pessoal</span>
          </TabsTrigger>
          <TabsTrigger value="enrollment" className="gap-2 py-2">
            <School className="h-4 w-4" />
            <span className="hidden md:inline">Matrículas</span>
            <span className="md:hidden">Matr.</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="gap-2 py-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden md:inline">Histórico/Projetos</span>
            <span className="md:hidden">Hist.</span>
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-2 py-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden md:inline">Notas e Avaliações</span>
            <span className="md:hidden">Notas</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2 py-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden md:inline">Faltas</span>
            <span className="md:hidden">Freq.</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="personal">
            <StudentInfoCard student={student} />
          </TabsContent>

          <TabsContent value="enrollment" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Histórico de Matrículas</CardTitle>
                  <CardDescription>
                    Registro de todas as movimentações do aluno.
                  </CardDescription>
                </div>
                {isAdminOrSupervisor && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsTransferDialogOpen(true)}
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" /> Transferir
                    </Button>
                    <Button onClick={() => setIsEnrollmentDialogOpen(true)}>
                      Nova Matrícula
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ano Letivo</TableHead>
                      <TableHead>Escola</TableHead>
                      <TableHead>Série/Turma</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.enrollments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          Nenhuma matrícula registrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      student.enrollments.map((e) => {
                        const school = schools.find((s) => s.id === e.schoolId)
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium">
                              {e.year}
                            </TableCell>
                            <TableCell>{school?.name || 'N/A'}</TableCell>
                            <TableCell>{e.grade}</TableCell>
                            <TableCell>
                              {e.type === 'regular' ? 'Regular' : 'Dependência'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  e.status === 'Cursando'
                                    ? 'outline'
                                    : e.status === 'Aprovado'
                                      ? 'default'
                                      : 'secondary'
                                }
                                className={
                                  e.status === 'Cursando'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : ''
                                }
                              >
                                {e.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Atividades Complementares (Projetos)</CardTitle>
                  <CardDescription>
                    Participação em projetos extracurriculares.
                  </CardDescription>
                </div>
                {isAdminOrSupervisor && (
                  <Button onClick={() => setIsProjectDialogOpen(true)}>
                    Inscrever em Projeto
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {student.projectIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    O aluno não participa de nenhum projeto no momento.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {student.projectIds.map((pid) => {
                      const proj = projects.find((p) => p.id === pid)
                      if (!proj) return null
                      return (
                        <div
                          key={pid}
                          className="flex flex-col gap-2 p-4 border rounded-lg bg-secondary/10"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold">{proj.name}</span>
                            {isAdminOrSupervisor && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-destructive"
                                onClick={() => handleRemoveProject(pid)}
                              >
                                Sair
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {proj.description}
                          </p>
                          <div className="mt-2 text-xs flex items-center gap-2">
                            <Badge variant="outline">{proj.schedule}</Badge>
                            <span className="text-muted-foreground">
                              Instrutor: {proj.instructor}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades" className="space-y-6">
            <div className="grid gap-6">
              <StudentPerformanceCard student={student} />
              <StudentAssessmentHistory
                assessments={assessments.filter(
                  (a) => a.studentId === student.id,
                )}
                assessmentTypes={assessmentTypes}
                subjects={subjects}
                periods={periods}
              />
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <StudentAttendanceCard studentId={student.id} />
          </TabsContent>
        </div>
      </Tabs>

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
    </div>
  )
}
