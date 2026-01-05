import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Users,
  School,
  Calendar,
  BookOpen,
  Edit,
  Trash2,
  Loader2,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { classService } from '@/lib/supabase/services'
import type { ClassWithDetails } from '@/lib/supabase/services/class-service'
import { ClassroomDialog } from '@/pages/schools/components/ClassroomDialog'
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
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { enrollmentService } from '@/lib/supabase/services'

export default function ClassDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { schools, fetchSchools } = useSchoolStore()
  
  const [classData, setClassData] = useState<ClassWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Carregar dados da turma ao montar
  useEffect(() => {
    if (id) {
      loadClassData()
      fetchSchools()
    }
  }, [id])

  const loadClassData = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const classId = parseInt(id)
      
      // Carregar informações completas da turma
      const fullInfo = await classService.getClassFullInfo(classId)
      setClassData(fullInfo)
      
      // Carregar alunos matriculados
      if (fullInfo) {
        const enrollments = await enrollmentService.getByClass(classId)
        setStudents(enrollments.map(e => e.student_profile))
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar dados da turma')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!classData) return
    
    try {
      const updateData = {
        name: data.name || classData.name,
        shift: data.shift || classData.shift,
        max_students: data.maxCapacity || data.capacity || classData.max_students,
        room: data.room || classData.room,
        course_id: data.courseId ? parseInt(data.courseId) : classData.course_id,
      }

      await classService.update(classData.id, updateData)
      await loadClassData()
      setIsEditDialogOpen(false)
    } catch (error) {
      // Erro já tratado pelo service
    }
  }

  const handleDelete = async () => {
    if (!classData) return
    
    try {
      await classService.delete(classData.id)
      toast.success('Turma removida com sucesso!')
      navigate('/academico/turmas')
    } catch (error) {
      // Erro já tratado pelo service
    }
  }

  // Loading state
  if (loading && !classData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
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
  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Turma não encontrada</h2>
        <Button onClick={() => navigate('/academico/turmas')}>
          Voltar para Lista
        </Button>
      </div>
    )
  }

  const school = classData.school
  const academicYear = classData.academic_year
  const course = classData.course
  const stats = classData.stats

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/academico/turmas')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            {classData.name}
            <Badge variant="outline">{classData.shift}</Badge>
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <School className="h-4 w-4" /> {school?.name || 'Escola não informada'}
          </p>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Informações da Turma</CardTitle>
            <CardDescription>
              Dados gerais e configurações da turma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <School className="h-4 w-4" /> Escola
                </span>
                <p className="font-medium">{school?.name || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Ano Letivo
                </span>
                <p className="font-medium">{academicYear?.name || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Curso/Série
                </span>
                <p className="font-medium">{course?.name || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Capacidade
                </span>
                <p className="font-medium">
                  {classData.max_students || classData.capacity || 'Ilimitada'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                Total de Alunos
              </span>
              <p className="font-semibold text-2xl">
                {stats?.totalStudents || students.length || 0}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                Vagas Disponíveis
              </span>
              <p className="font-semibold text-2xl">
                {classData.max_students 
                  ? (classData.max_students - (stats?.totalStudents || 0))
                  : 'Ilimitadas'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Alunos Matriculados ({students.length})
            </CardTitle>
            <CardDescription>
              Lista de alunos matriculados nesta turma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Nenhum aluno matriculado nesta turma.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {students.map((student: any) => {
                  const person = student?.person
                  const fullName = person 
                    ? `${person.first_name} ${person.last_name}`
                    : 'Nome não informado'
                  const initials = person
                    ? `${person.first_name?.[0] || ''}${person.last_name?.[0] || ''}`.toUpperCase()
                    : 'NN'
                  
                  return (
                    <div
                      key={student?.id}
                      className="flex items-center gap-3 p-3 border rounded-md bg-secondary/10 hover:bg-secondary/20 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{fullName}</p>
                        {student?.enrollment_number && (
                          <p className="text-xs text-muted-foreground">
                            Matrícula: {student.enrollment_number}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ClassroomDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        schools={schools}
        initialData={classData ? {
          ...classData,
          schoolId: classData.school_id?.toString(),
          yearId: classData.academic_year_id?.toString(),
          courseId: classData.course_id?.toString(),
          maxCapacity: classData.max_students || classData.capacity,
        } : undefined}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a turma do sistema. Esta ação não pode ser desfeita.
              {stats?.totalStudents && stats.totalStudents > 0 && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Esta turma possui {stats.totalStudents} aluno(s) matriculado(s). 
                  Os dados relacionados serão atualizados automaticamente.
                </span>
              )}
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

