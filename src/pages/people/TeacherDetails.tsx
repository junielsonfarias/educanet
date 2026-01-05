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
  Loader2,
  Award,
  Users,
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
import { Skeleton } from '@/components/ui/skeleton'
import { useTeacherStore } from '@/stores/useTeacherStore.supabase'
import { useState, useEffect } from 'react'
import { TeacherFormDialog } from './components/TeacherFormDialog'
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
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function TeacherDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { 
    currentTeacher,
    loading,
    fetchTeacherById, 
    updateTeacher, 
    deleteTeacher,
    fetchTeacherClasses,
    fetchTeacherSubjects,
    fetchCertifications,
    assignToClass,
  } = useTeacherStore()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [certifications, setCertifications] = useState<any[]>([])

  // Carregar dados do professor ao montar
  useEffect(() => {
    if (id) {
      fetchTeacherById(parseInt(id))
      loadAdditionalData()
    }
  }, [id])

  const loadAdditionalData = async () => {
    if (!id) return
    
    const teacherId = parseInt(id)
    const [classesData, subjectsData, certificationsData] = await Promise.all([
      fetchTeacherClasses(teacherId),
      fetchTeacherSubjects(teacherId),
      fetchCertifications(teacherId),
    ])
    
    setClasses(classesData)
    setSubjects(subjectsData)
    setCertifications(certificationsData)
  }

  const handleUpdate = async (data: any) => {
    if (!currentTeacher) return
    
    try {
      // Separar dados de person e teacher
      const personData = {
        first_name: data.firstName || currentTeacher.person.first_name,
        last_name: data.lastName || currentTeacher.person.last_name,
        email: data.email || currentTeacher.person.email,
        phone: data.phone || currentTeacher.person.phone,
        cpf: data.cpf || currentTeacher.person.cpf,
      }

      const teacherData = {
        school_id: data.schoolId || currentTeacher.school_id,
        employment_status: data.employmentStatus || currentTeacher.employment_status,
        hire_date: data.hireDate || currentTeacher.hire_date,
      }

      await updateTeacher(currentTeacher.id, personData, teacherData)
      setIsEditDialogOpen(false)
    } catch (error) {
      // Erro já tratado pelo store
    }
  }

  const handleDelete = async () => {
    if (!currentTeacher) return
    
    try {
      await deleteTeacher(currentTeacher.id)
      navigate('/pessoas/professores')
    } catch (error) {
      // Erro já tratado pelo store
    }
  }

  // Loading state
  if (loading && !currentTeacher) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="col-span-1">
            <CardContent className="pt-6 flex flex-col items-center">
              <Skeleton className="h-32 w-32 rounded-full mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Not found state
  if (!currentTeacher) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Professor não encontrado</h2>
        <Button onClick={() => navigate('/pessoas/professores')}>
          Voltar para Lista
        </Button>
      </div>
    )
  }

  // Extract data safely
  const teacher = currentTeacher
  const person = teacher.person
  const fullName = `${person.first_name} ${person.last_name}`.trim()
  const initials = `${person.first_name?.[0] || ''}${person.last_name?.[0] || ''}`.toUpperCase()
  const isActive = teacher.employment_status === 'active'
  const school = teacher.school
  const hireDate = teacher.hire_date 
    ? format(new Date(teacher.hire_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Não informada'

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
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={loading}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 h-fit">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 mb-4 border-4 border-primary/10">
              <AvatarImage
                src={person.avatar_url || `https://img.usecurling.com/ppl/medium?gender=male&seed=${teacher.id}`}
              />
              <AvatarFallback className="text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{fullName}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {school?.name || 'Sem escola vinculada'}
            </p>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className="mt-2"
            >
              {isActive ? 'Ativo' : 'Inativo'}
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
                  <Mail className="h-4 w-4" /> E-mail
                </span>
                <p className="font-medium">{person.email || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Telefone
                </span>
                <p className="font-medium">{person.phone || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> CPF
                </span>
                <p className="font-medium">{person.cpf || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Data de Admissão
                </span>
                <p className="font-medium">{hireDate}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Escola
                </span>
                <p className="font-medium">{school?.name || 'Sem vínculo'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Status
                </span>
                <p className="font-medium">{isActive ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>

            <Separator />

            {/* Disciplinas */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Disciplinas
              </h4>
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma disciplina atribuída
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject: any) => (
                    <Badge key={subject.id} variant="outline">
                      {subject.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Turmas */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Turmas ({classes.length})
              </h4>
              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma turma atribuída
                </p>
              ) : (
                <div className="grid gap-2">
                  {classes.map((classItem: any) => (
                    <div
                      key={classItem.id}
                      className="p-3 border rounded-md bg-secondary/20 flex justify-between items-center"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{classItem.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {classItem.school?.name || 'Escola não informada'}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {classItem.academic_year?.name || 'Ano não informado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Certificações */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Award className="h-4 w-4" /> Certificações ({certifications.length})
              </h4>
              {certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma certificação registrada
                </p>
              ) : (
                <div className="grid gap-2">
                  {certifications.map((cert: any) => (
                    <div
                      key={cert.id}
                      className="p-3 border rounded-md bg-secondary/20"
                    >
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cert.institution} - {cert.year || 'Ano não informado'}
                      </p>
                    </div>
                  ))}
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
        initialData={currentTeacher}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Professor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o professor do quadro de funcionários. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
