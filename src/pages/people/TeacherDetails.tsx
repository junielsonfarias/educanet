import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
  Edit,
  Trash2,
  Calendar,
  Plus,
  Briefcase,
  GraduationCap,
  FileText,
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
import useTeacherStore from '@/stores/useTeacherStore'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'
import { useState } from 'react'
import { TeacherFormDialog } from './components/TeacherFormDialog'
import { TeacherAllocationDialog } from './components/TeacherAllocationDialog'
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
import { format } from 'date-fns'

export default function TeacherDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getTeacher, updateTeacher, deleteTeacher, addAllocation } =
    useTeacherStore()
  const { getSchool } = useSchoolStore()
  const { courses } = useCourseStore()
  const { toast } = useToast()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const teacher = getTeacher(id || '')

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Professor não encontrado</h2>
        <Button onClick={() => navigate('/pessoas/professores')}>
          Voltar para Lista
        </Button>
      </div>
    )
  }

  // Safely access properties
  const allocations = Array.isArray(teacher.allocations)
    ? teacher.allocations
    : []
  const name = teacher.name || 'Sem nome'
  const subject = teacher.subject || 'N/A'
  const email = teacher.email || 'N/A'
  const phone = teacher.phone || 'N/A'
  const status = teacher.status || 'inactive'
  const cpf = teacher.cpf || 'Não informado'
  const role = teacher.role || 'Não informado'
  const bond = teacher.employmentBond || 'Não informado'
  const admission = teacher.admissionDate
    ? format(new Date(teacher.admissionDate), 'dd/MM/yyyy')
    : 'Não informada'
  const academic = teacher.academicBackground || 'Não informada'

  const handleUpdate = (data: any) => {
    updateTeacher(teacher.id, data)
    toast({
      title: 'Professor atualizado',
      description: 'Dados atualizados com sucesso.',
    })
  }

  const handleDelete = () => {
    deleteTeacher(teacher.id)
    toast({
      title: 'Professor excluído',
      description: 'Registro removido com sucesso.',
    })
    navigate('/pessoas/professores')
  }

  const handleAddAllocation = (data: any) => {
    addAllocation(teacher.id, data)
    toast({
      title: 'Alocação realizada',
      description: 'Professor vinculado à turma com sucesso.',
    })
  }

  const getAllocationDetails = (allocation: any) => {
    if (!allocation)
      return {
        schoolName: 'N/A',
        yearName: 'N/A',
        className: 'N/A',
        subjectName: 'N/A',
      }

    const school = getSchool(allocation.schoolId)
    const year = school?.academicYears?.find(
      (y) => y.id === allocation.academicYearId,
    )
    const classroom = year?.classes?.find(
      (c) => c.id === allocation.classroomId,
    )

    // Flatten grades to find subject
    const safeCourses = Array.isArray(courses) ? courses : []
    const allGrades = safeCourses.flatMap((c) => c.grades || [])
    const allSubjects = allGrades.flatMap((g) => g.subjects || [])
    const subject = allSubjects.find((s) => s.id === allocation.subjectId)

    return {
      schoolName: school?.name || 'Escola desconhecida',
      yearName: year?.name || '-',
      className: classroom?.name || 'Turma desconhecida',
      subjectName: subject?.name || 'Regente',
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/pessoas/professores')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            Detalhes do Professor
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteId(teacher.id)}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 h-fit">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 mb-4 border-4 border-primary/10">
              <AvatarImage
                src={`https://img.usecurling.com/ppl/medium?gender=male&seed=${teacher.id}`}
              />
              <AvatarFallback className="text-2xl">
                {name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{role}</p>
            <Badge
              variant={status === 'active' ? 'default' : 'secondary'}
              className="mt-2"
            >
              {status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
            <CardDescription>
              Dados completos e vínculo empregatício.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Disciplina Principal
                </span>
                <p className="font-medium">{subject}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Telefone
                </span>
                <p className="font-medium">{phone}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" /> E-mail Institucional
                </span>
                <p className="font-medium">{email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> CPF
                </span>
                <p className="font-medium">{cpf}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Cargo/Função
                </span>
                <p className="font-medium">{role}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Vínculo
                </span>
                <p className="font-medium">{bond}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Data de Admissão
                </span>
                <p className="font-medium">{admission}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4" /> Formação Acadêmica
              </span>
              <p className="text-sm leading-relaxed text-justify bg-muted/20 p-3 rounded-md">
                {academic}
              </p>
            </div>

            <Separator />

            <div className="pt-2">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Histórico de Alocações
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAllocationDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Nova Alocação
                </Button>
              </div>

              {allocations.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Nenhuma alocação registrada.
                </p>
              ) : (
                <div className="grid gap-2">
                  {allocations.map((alloc) => {
                    const details = getAllocationDetails(alloc)
                    return (
                      <div
                        key={alloc.id}
                        className="p-3 border rounded-md bg-secondary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {details.className} - {details.subjectName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {details.schoolName}
                          </span>
                        </div>
                        <Badge variant="outline">{details.yearName}</Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TeacherFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        initialData={teacher}
      />

      <TeacherAllocationDialog
        open={isAllocationDialogOpen}
        onOpenChange={setIsAllocationDialogOpen}
        onSubmit={handleAddAllocation}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Professor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o professor do quadro de funcionários.
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
