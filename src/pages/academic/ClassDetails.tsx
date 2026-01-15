import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Users,
  School,
  Calendar,
  BookOpen,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  UserPlus,
  GraduationCap,
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
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { StudentDetailsModal } from '@/components/academic/StudentDetailsModal'
import { Accessibility, Eye } from 'lucide-react'

// Função para calcular idade a partir da data de nascimento
const calculateAge = (dateOfBirth: string | null | undefined): number | null => {
  if (!dateOfBirth) return null
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export default function ClassDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { schools, fetchSchools } = useSchoolStore()

  const [classData, setClassData] = useState<ClassWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)

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

      // Carregar alunos matriculados na turma
      if (fullInfo) {
        const classStudents = await classService.getClassStudents(classId)
        setStudents(classStudents)
      }
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Erro ao carregar dados da turma')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!classData) return

    try {
      const updateData = {
        name: data.name || classData.name,
        shift: data.shift || classData.shift,
        max_students: data.maxCapacity || data.capacity || classData.max_students,
        room: data.room || classData.room,
        course_id: data.courseId ? parseInt(data.courseId as string) : classData.course_id,
      }

      await classService.update(classData.id, updateData)
      await loadClassData()
      setIsEditDialogOpen(false)
    } catch {
      // Erro já tratado pelo service
    }
  }

  const handleDelete = async () => {
    if (!classData) return

    try {
      await classService.delete(classData.id)
      toast.success('Turma removida com sucesso!')
      navigate('/academico/turmas')
    } catch {
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
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
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
  const capacity = classData.max_students || classData.capacity || 35
  const totalStudents = stats?.totalStudents || students.length || 0
  const occupancyRate = capacity > 0 ? Math.round((totalStudents / capacity) * 100) : 0
  const availableSpots = capacity - totalStudents

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
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
            <Badge variant="outline" className="ml-2">
              <Clock className="h-3 w-3 mr-1" />
              {classData.shift}
            </Badge>
          </h2>
          <p className="text-muted-foreground flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1">
              <School className="h-4 w-4" />
              {school?.trade_name || school?.name || 'Escola não informada'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {academicYear?.name || 'Ano não informado'}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} disabled={loading}>
            <span className="mr-2 h-4 w-4 inline-flex items-center justify-center">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            </span>
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={loading}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Curso/Série</p>
                <p className="font-bold text-blue-700 truncate">{course?.name || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Alunos Matriculados</p>
                <p className="text-2xl font-bold text-purple-700">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600">Vagas Disponíveis</p>
                <p className="text-2xl font-bold text-green-700">{availableSpots > 0 ? availableSpots : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-600">Ocupação</p>
                <p className="text-sm font-bold text-amber-700">{occupancyRate}%</p>
              </div>
              <Progress
                value={occupancyRate}
                className="h-2"
              />
              <p className="text-xs text-amber-600">
                {totalStudents} / {capacity} alunos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Alunos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Alunos Matriculados
              </CardTitle>
              <CardDescription>
                Lista de alunos matriculados nesta turma ordenados alfabeticamente.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {students.length} aluno(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum aluno matriculado nesta turma.</p>
              <p className="text-sm mt-2">
                Os alunos serão exibidos aqui após serem matriculados.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[60px] text-center">Nº</TableHead>
                  <TableHead>Nome do Aluno</TableHead>
                  <TableHead className="w-[80px] text-center">Idade</TableHead>
                  <TableHead className="w-[150px]">Matrícula</TableHead>
                  <TableHead className="w-[80px] text-center">PCD</TableHead>
                  <TableHead className="w-[120px] text-center">Situação</TableHead>
                  <TableHead className="w-[80px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => {
                  const person = student?.person
                  const fullName = person?.full_name
                    || (person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() : 'Nome não informado')

                  // Badge de situação
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

                  return (
                    <TableRow
                      key={student?.id || student?.class_enrollment_id}
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                        student.class_enrollment_status === 'Transferido' ? 'opacity-70' : ''
                      }`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {student.order_number || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{fullName}</span>
                              {student.is_pcd && (
                                <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs flex-shrink-0">
                                  <Accessibility className="h-3 w-3 mr-1" />
                                  PCD
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const age = calculateAge(person?.date_of_birth)
                          return age !== null ? (
                            <span className="text-sm font-medium">{age} anos</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {student?.student_registration_number || '-'}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        {student.is_pcd ? (
                          <div className="flex flex-col items-center gap-1">
                            <Accessibility className="h-4 w-4 text-cyan-500" />
                            {student.has_medical_report && (
                              <span className="text-[10px] text-cyan-600">Laudo</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {getSituacaoBadge()}
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Ver detalhes do aluno"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
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

      {/* Dialog de Exclusão */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a turma do sistema. Esta ação não pode ser desfeita.
              {totalStudents > 0 && (
                <span className="block mt-2 text-amber-600">
                  Atenção: Esta turma possui {totalStudents} aluno(s) matriculado(s).
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
              <span className="inline-flex items-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Excluir Definitivamente
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de detalhes do aluno com abas (Info, Boletim, Frequência) */}
      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          classId={parseInt(id || '0')}
          academicYearId={classData?.academic_year?.id}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  )
}
