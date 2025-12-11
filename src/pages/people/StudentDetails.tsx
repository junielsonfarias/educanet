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
  MapPin,
  Bus,
  HeartPulse,
  Users,
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
import useSchoolStore from '@/stores/useSchoolStore'
import useProjectStore from '@/stores/useProjectStore'
import useUserStore from '@/stores/useUserStore'
import { useState } from 'react'
import { StudentFormDialog } from './components/StudentFormDialog'
import { EnrollmentFormDialog } from './components/EnrollmentFormDialog'
import { ProjectEnrollmentDialog } from './components/ProjectEnrollmentDialog'
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

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    getStudent,
    updateStudent,
    deleteStudent,
    addEnrollment,
    addProjectEnrollment,
    removeProjectEnrollment,
  } = useStudentStore()
  const { schools } = useSchoolStore()
  const { projects } = useProjectStore()
  const { currentUser } = useUserStore()
  const { toast } = useToast()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
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

  const getSchoolName = (schoolId: string) => {
    return schools.find((s) => s.id === schoolId)?.name || 'Escola desconhecida'
  }

  const getProjectName = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId)
    return proj ? `${proj.name} (${proj.schedule})` : 'Projeto desconhecido'
  }

  // Robustly handle missing or non-iterable enrollments property
  const enrollments =
    student.enrollments && Array.isArray(student.enrollments)
      ? student.enrollments
      : []

  // Sort enrollments by year descending
  const sortedEnrollments = [...enrollments].sort((a, b) => b.year - a.year)

  // Robustly handle missing or non-iterable projectIds property
  const projectIds =
    student.projectIds && Array.isArray(student.projectIds)
      ? student.projectIds
      : []

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
        <Card className="col-span-1 h-fit">
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

        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais Detalhados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">CPF</span>
                  <p className="font-medium">{student.cpf || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">NIS</span>
                  <p className="font-medium">{student.social?.nis || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Nome do Pai
                  </span>
                  <p className="font-medium">{student.fatherName || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Nome da Mãe
                  </span>
                  <p className="font-medium">{student.motherName || '-'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4" /> Endereço
                </span>
                {student.address ? (
                  <>
                    <p className="font-medium">
                      {student.address.street}, {student.address.number} -{' '}
                      {student.address.neighborhood}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.address.city}/{student.address.state} - CEP:{' '}
                      {student.address.zipCode}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground italic">
                    Endereço não cadastrado
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <Bus className="h-3 w-3" /> Transporte
                  </span>
                  <Badge
                    variant={student.transport?.uses ? 'default' : 'outline'}
                    className="w-fit"
                  >
                    {student.transport?.uses
                      ? `Sim (${student.transport.routeNumber})`
                      : 'Não'}
                  </Badge>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <Users className="h-3 w-3" /> Bolsa Família
                  </span>
                  <Badge
                    variant={
                      student.social?.bolsaFamilia ? 'default' : 'outline'
                    }
                    className="w-fit"
                  >
                    {student.social?.bolsaFamilia ? 'Beneficiário' : 'Não'}
                  </Badge>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <HeartPulse className="h-3 w-3" /> Nec. Especiais
                  </span>
                  {student.health?.hasSpecialNeeds ? (
                    <div className="flex flex-col">
                      <Badge variant="destructive" className="w-fit mb-1">
                        Sim
                      </Badge>
                      <span className="text-xs">{student.health.cid}</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="w-fit">
                      Não
                    </Badge>
                  )}
                </div>
              </div>
              {student.health?.observation && (
                <div className="bg-muted/30 p-3 rounded-md text-sm mt-2">
                  <span className="font-semibold block text-xs uppercase text-muted-foreground mb-1">
                    Observações de Saúde
                  </span>
                  {student.health.observation}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Histórico de Matrículas</CardTitle>
                <CardDescription>Registro acadêmico completo</CardDescription>
              </div>
              {isAdminOrSupervisor && (
                <Button
                  size="sm"
                  onClick={() => setIsEnrollmentDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Nova Matrícula
                </Button>
              )}
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
                      <TableHead>Ano</TableHead>
                      <TableHead>Escola</TableHead>
                      <TableHead>Série</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {enrollment.year}
                        </TableCell>
                        <TableCell>
                          {getSchoolName(enrollment.schoolId)}
                        </TableCell>
                        <TableCell>{enrollment.grade}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              enrollment.type === 'dependency'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {enrollment.type === 'dependency'
                              ? 'Dependência'
                              : 'Regular'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              enrollment.status === 'Cursando'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {enrollment.status}
                          </Badge>
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
              {projectIds.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum projeto matriculado.
                </p>
              ) : (
                <div className="space-y-2">
                  {projectIds.map((projectId) => (
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
        excludeProjectIds={projectIds}
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
