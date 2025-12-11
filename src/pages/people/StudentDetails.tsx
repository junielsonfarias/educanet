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
  Filter,
  FileText,
  Printer,
  ArrowRightLeft,
  Briefcase,
  Book,
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
import useAssessmentStore from '@/stores/useAssessmentStore'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  const { schools } = useSchoolStore()
  const { projects } = useProjectStore()
  const { currentUser } = useUserStore()
  const { getStudentAssessments, assessmentTypes } = useAssessmentStore()
  const { toast } = useToast()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Enrollment List State
  const [enrollmentSort, setEnrollmentSort] = useState<'year' | 'status'>(
    'year',
  )
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<
    string | null
  >(null)

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

  const assessments = getStudentAssessments(student.id)

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
    // Determine status
    const newStatus = 'Transferido'

    // Update Student Status
    updateStudent(student.id, {
      status: newStatus,
    })

    // Update active enrollment status
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
      description: `Transferência para ${destination} registrada. Status alterado para Transferido.`,
    })
  }

  const generateDocument = (docName: string) => {
    toast({
      title: 'Gerando Documento',
      description: `O documento "${docName}" está sendo gerado e será baixado em breve.`,
    })
    // Mock download delay
    setTimeout(() => {
      toast({
        title: 'Download Concluído',
        description: `O arquivo ${docName}.pdf foi baixado com sucesso.`,
      })
    }, 2000)
  }

  const getSchoolName = (schoolId: string) => {
    return schools.find((s) => s.id === schoolId)?.name || 'Escola desconhecida'
  }

  const getProjectName = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId)
    return proj ? `${proj.name} (${proj.schedule})` : 'Projeto desconhecido'
  }

  const enrollments = student.enrollments || []

  // Sort enrollments
  const sortedEnrollments = [...enrollments].sort((a, b) => {
    if (enrollmentSort === 'year') {
      return b.year - a.year
    }
    return a.status.localeCompare(b.status)
  })

  // Calculate Consolidated Performance for an enrollment
  const getEnrollmentPerformance = (enrollment: any) => {
    // Only include assessments from same school year AND where type does not exclude from average
    const relevantAssessments = assessments.filter((a) => {
      if (a.schoolId !== enrollment.schoolId) return false
      // Check type exclusion
      if (a.assessmentTypeId) {
        const type = assessmentTypes.find((t) => t.id === a.assessmentTypeId)
        if (type?.excludeFromAverage) return false
      }
      return true
    })

    const subjects: Record<string, { total: number; count: number }> = {}
    relevantAssessments.forEach((a) => {
      if (typeof a.value === 'number') {
        if (!subjects[a.subjectId])
          subjects[a.subjectId] = { total: 0, count: 0 }
        subjects[a.subjectId].total += a.value
        subjects[a.subjectId].count++
      }
    })

    return Object.entries(subjects).map(([subjectId, data]) => ({
      subjectId,
      average: data.count > 0 ? (data.total / data.count).toFixed(1) : '-',
    }))
  }

  const selectedEnrollment = enrollments.find(
    (e) => e.id === selectedEnrollmentId,
  )
  const performanceData = selectedEnrollment
    ? getEnrollmentPerformance(selectedEnrollment)
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
                <FileText className="mr-2 h-4 w-4" /> Gerar Ficha do Aluno
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => generateDocument('Carteira de Estudante')}
              >
                <Briefcase className="mr-2 h-4 w-4" /> Gerar Carteira de
                Estudante
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
                <Book className="mr-2 h-4 w-4" /> Gerar Histórico Escolar
              </Button>
              <Separator className="my-2" />
              <Button
                variant="default"
                className="justify-start bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => setIsTransferDialogOpen(true)}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Transferência de
                Aluno
              </Button>
            </CardContent>
          </Card>
        </div>

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
                  <span className="text-sm text-muted-foreground">
                    Cartão SUS
                  </span>
                  <p className="font-medium">{student.susCard || '-'}</p>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Certidão de Nascimento
                  </span>
                  <p className="font-medium">
                    {student.birthCertificate || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">NIS</span>
                  <p className="font-medium">{student.social?.nis || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Raça/Cor
                  </span>
                  <p className="font-medium">{student.raceColor || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Nome do Pai
                  </span>
                  <p className="font-medium">{student.fatherName || '-'}</p>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {student.fatherEducation || 'Escolaridade não inf.'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Nome da Mãe
                  </span>
                  <p className="font-medium">{student.motherName || '-'}</p>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {student.motherEducation || 'Escolaridade não inf.'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Nacionalidade
                  </span>
                  <p className="font-medium">
                    {student.nationality} - {student.birthCountry}
                  </p>
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
                      {student.address?.street}, {student.address?.number} -{' '}
                      {student.address?.neighborhood}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.address?.city}/{student.address?.state} - CEP:{' '}
                      {student.address?.zipCode}
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
              <div className="flex flex-col gap-1">
                <CardTitle>Histórico de Matrícula</CardTitle>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Série</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEnrollments.map((enrollment) => (
                      <TableRow
                        key={enrollment.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedEnrollmentId(enrollment.id)}
                      >
                        <TableCell className="font-medium">
                          {enrollment.year}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              enrollment.status === 'Cursando'
                                ? 'default'
                                : enrollment.status === 'Aprovado'
                                  ? 'default' // Should use success color ideally
                                  : 'secondary'
                            }
                          >
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{enrollment.grade}</TableCell>
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

      {/* Enrollment Detail Dialog */}
      <Dialog
        open={!!selectedEnrollment}
        onOpenChange={(open) => !open && setSelectedEnrollmentId(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Matrícula</DialogTitle>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">Escola</span>
                  <span className="font-medium">
                    {getSchoolName(selectedEnrollment.schoolId)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Série/Ano</span>
                  <span className="font-medium">
                    {selectedEnrollment.grade} ({selectedEnrollment.year})
                  </span>
                </div>
              </div>
              <Separator />
              <h4 className="text-sm font-semibold">
                Desempenho Consolidado (Disciplinas Cursadas)
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                Nota: Avaliações configuradas para "Não considerar no cálculo"
                são excluídas desta média.
              </p>
              {performanceData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disciplina</TableHead>
                      <TableHead className="text-right">Média Atual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.map((p) => (
                      <TableRow key={p.subjectId}>
                        <TableCell>
                          {/* In a real app we'd fetch the subject name properly */}
                          {p.subjectId === 's10'
                            ? 'Matemática'
                            : p.subjectId === 's9'
                              ? 'Português'
                              : `Disciplina ${p.subjectId}`}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {p.average}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma avaliação contabilizada para este período.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
