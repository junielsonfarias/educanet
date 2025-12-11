import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  GraduationCap,
  Calendar,
  Edit,
  Trash2,
  Printer,
  FileText,
  Briefcase,
  Book,
  ArrowRightLeft,
  Plus,
  Trophy,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StudentInfoCard } from './components/StudentInfoCard'
import { StudentPerformanceCard } from './components/StudentPerformanceCard'

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
  const { toast } = useToast()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [enrollmentSort, setEnrollmentSort] = useState<'year' | 'status'>(
    'year',
  )

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

  const enrollments = student.enrollments || []
  const sortedEnrollments = [...enrollments].sort((a, b) => {
    if (enrollmentSort === 'year') return b.year - a.year
    return a.status.localeCompare(b.status)
  })

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/pessoas/alunos')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            Detalhes do Aluno
          </h2>
        </div>
        {isAdminOrSupervisor && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteId(student.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column */}
        <div className="col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-32 w-32 mb-4 border-4 border-primary/10">
                <AvatarImage
                  src={`https://img.usecurling.com/ppl/medium?seed=${student.id}`}
                />
                <AvatarFallback className="text-2xl">
                  {student.name?.substring(0, 2).toUpperCase() || 'AL'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">{student.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Matrícula: {student.registration}
              </p>
              {student.status && (
                <Badge
                  variant={
                    student.status === 'Cursando' ? 'default' : 'secondary'
                  }
                  className="mt-2"
                >
                  {student.status}
                </Badge>
              )}

              <div className="w-full mt-6 text-left space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Nasc: {student.birthDate || 'N/A'} ({student.age} anos)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Resp: {student.guardian}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.contacts?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.contacts?.email || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" /> Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => generateDocument('Ficha do Aluno')}
              >
                <FileText className="mr-2 h-4 w-4" /> Gerar Ficha
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => generateDocument('Carteira de Estudante')}
              >
                <Briefcase className="mr-2 h-4 w-4" /> Carteira de Estudante
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => generateDocument('Boletim')}
              >
                <GraduationCap className="mr-2 h-4 w-4" /> Gerar Boletim
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => generateDocument('Histórico Escolar')}
              >
                <Book className="mr-2 h-4 w-4" /> Histórico Escolar
              </Button>
              <Separator className="my-2" />
              <Button
                variant="default"
                className="justify-start bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => setIsTransferDialogOpen(true)}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Transferência
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (2 spans) */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <StudentInfoCard student={student} />

          <StudentPerformanceCard student={student} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex flex-col gap-1">
                <CardTitle>Histórico de Matrículas</CardTitle>
                <CardDescription>Registro acadêmico completo</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={enrollmentSort}
                  onValueChange={(v: any) => setEnrollmentSort(v)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Por Ano</SelectItem>
                    <SelectItem value="status">Por Status</SelectItem>
                  </SelectContent>
                </Select>
                {isAdminOrSupervisor && (
                  <Button
                    size="sm"
                    onClick={() => setIsEnrollmentDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Nova
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sortedEnrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma matrícula registrada.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ano Letivo</TableHead>
                      <TableHead>Série / Turma</TableHead>
                      <TableHead>Escola</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEnrollments.map((enrollment) => {
                      const schoolName =
                        schools.find((s) => s.id === enrollment.schoolId)
                          ?.name || 'Escola Externa'
                      return (
                        <TableRow
                          key={enrollment.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            {enrollment.year}
                          </TableCell>
                          <TableCell>{enrollment.grade}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {schoolName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                enrollment.status === 'Cursando'
                                  ? 'default'
                                  : enrollment.status === 'Aprovado'
                                    ? 'default'
                                    : 'secondary'
                              }
                            >
                              {enrollment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Projetos Extracurriculares</CardTitle>
                <CardDescription>Atividades complementares</CardDescription>
              </div>
              {isAdminOrSupervisor && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsProjectDialogOpen(true)}
                >
                  <Trophy className="h-4 w-4 mr-1" /> Adicionar Projeto
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {student.projectIds.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum projeto matriculado.
                </p>
              ) : (
                <div className="space-y-2">
                  {student.projectIds.map((projectId) => (
                    <div
                      key={projectId}
                      className="flex items-center justify-between p-3 border rounded-md bg-secondary/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">
                          {getProjectName(projectId)}
                        </span>
                      </div>
                      {isAdminOrSupervisor && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveProject(projectId)}
                        >
                          <Trash2 className="h-4 w-4" />
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
              Esta ação é irreversível. O histórico e dados do aluno serão
              perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
