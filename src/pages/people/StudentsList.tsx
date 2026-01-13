import { useState } from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  User,
  Users,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import useUserStore from '@/stores/useUserStore'
import { useNavigate } from 'react-router-dom'
import { StudentFormDialog } from './components/StudentFormDialog'
import { Student, Enrollment } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect } from 'react'
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

export default function StudentsList() {
  const {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    fetchStudents,
    loading: loadingSupabase
  } = useStudentStore()
  
  const { currentUser } = useUserStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'grade'
    direction: 'asc' | 'desc'
  }>({ key: 'name', direction: 'asc' })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const navigate = useNavigate()
  const { toast } = useToast()
  
  // Buscar dados do Supabase na montagem do componente
  useEffect(() => {
    fetchStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Permissões serão verificadas via RequirePermission

  // Unique grades for filter
  const uniqueGrades = Array.from(
    new Set(
      students
        .map((s) => {
          if (!s) return null
          // Attempt to get current grade from enrollments or fallback
          const enrollments = s.enrollments || []
          const current = enrollments.find((e) => e.status === 'Cursando')
          return current ? current.grade : s.grade
        })
        .filter(Boolean),
    ),
  ) as string[]

  const filteredStudents = students.filter((student) => {
    if (!student) return false

    // Determine current/display grade and status
    const enrollments = student.enrollments || []
    const currentEnrollment = enrollments.find((e) => e.status === 'Cursando')
    const displayGrade = currentEnrollment
      ? currentEnrollment.grade
      : student.grade
    const displayStatus = currentEnrollment
      ? currentEnrollment.status
      : student.status

    const matchesSearch =
      (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.registration || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    const matchesGrade = gradeFilter === 'all' || displayGrade === gradeFilter
    const matchesStatus =
      statusFilter === 'all' || displayStatus === statusFilter

    return matchesSearch && matchesGrade && matchesStatus
  })

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const aEnrollments = a.enrollments || []
    const bEnrollments = b.enrollments || []

    const aEnrollment = aEnrollments.find((e) => e.status === 'Cursando')
    const bEnrollment = bEnrollments.find((e) => e.status === 'Cursando')

    const aValue =
      sortConfig.key === 'grade'
        ? aEnrollment?.grade || a.grade || ''
        : a.name || ''
    const bValue =
      sortConfig.key === 'grade'
        ? bEnrollment?.grade || b.grade || ''
        : b.name || ''

    if (aValue.toLowerCase() < bValue.toLowerCase())
      return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue.toLowerCase() > bValue.toLowerCase())
      return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Pagination Logic
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedStudents = sortedStudents.slice(
    startIndex,
    startIndex + itemsPerPage,
  )

  const toggleSort = (key: 'name' | 'grade') => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleCreate = (
    data: Omit<Student, 'id' | 'enrollments' | 'projectIds'>,
    initialEnrollment: Omit<Enrollment, 'id' | 'status' | 'type'>
  ) => {
    addStudent(data, initialEnrollment)
    toast({
      title: 'Aluno matriculado',
      description: `${data.name} adicionado com sucesso.`,
    })
  }

  const handleUpdate = (data: Partial<Student>) => {
    if (editingStudent) {
      updateStudent(editingStudent.id, data)
      toast({
        title: 'Dados atualizados',
        description: 'Informações do aluno atualizadas com sucesso.',
      })
      setEditingStudent(null)
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteStudent(deleteId)
      toast({
        title: 'Aluno removido',
        description: 'Registro do aluno excluído.',
      })
      setDeleteId(null)
    }
  }

  const openCreateDialog = () => {
    setEditingStudent(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (student: Student) => {
    setEditingStudent(student)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Alunos
          </h2>
          <p className="text-muted-foreground">
            Gestão completa de discentes da rede.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            Exportar Lista
          </Button>
          <Button
            onClick={openCreateDialog}
            className="w-full sm:w-auto bg-gradient-to-r from-primary via-blue-600 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Novo Aluno
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Diretório de Alunos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os alunos matriculados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Série/Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Séries</SelectItem>
                  {uniqueGrades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Cursando">Cursando</SelectItem>
                  <SelectItem value="Transferido">Transferido</SelectItem>
                  <SelectItem value="Abandono">Abandono</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Reprovado">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => toggleSort('name')}
                      className="-ml-4 h-8"
                    >
                      Nome
                      {sortConfig.key === 'name' ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => toggleSort('grade')}
                      className="-ml-4 h-8"
                    >
                      Série/Turma
                      {sortConfig.key === 'grade' ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowDown className="ml-2 h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="mb-3 p-3 rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
                          <Users className="h-8 w-8 text-blue-600/60" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Nenhum aluno encontrado.</p>
                        <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros de busca.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((student) => {
                    const enrollments = student.enrollments || []
                    const activeEnrollment = enrollments.find(
                      (e) => e && e.status === 'Cursando',
                    )
                    const displayGrade = activeEnrollment
                      ? activeEnrollment.grade
                      : student.grade
                    const displayStatus = activeEnrollment
                      ? activeEnrollment.status
                      : student.status
                    const studentName = student.name || 'Sem Nome'
                    const studentId = student.id
                    const studentRegistration = student.registration || '-'

                    return (
                      <TableRow
                        key={studentId}
                        className="cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200"
                        onClick={() => navigate(`/pessoas/alunos/${studentId}`)}
                      >
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={`https://img.usecurling.com/ppl/thumbnail?seed=${studentId}`}
                            />
                            <AvatarFallback>
                              {studentName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          {studentName}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {studentRegistration}
                        </TableCell>
                        <TableCell>{displayGrade || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            className={`flex items-center gap-1.5 px-2.5 py-1 font-medium ${
                              displayStatus === 'Cursando'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                                : displayStatus === 'Transferido'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : displayStatus === 'Aprovado'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                            }`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${
                                displayStatus === 'Cursando' ? 'bg-white' : 'bg-white/80'
                              }`}
                            />
                            {displayStatus || 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aluno</DropdownMenuLabel>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/pessoas/alunos/${studentId}`)
                                }}
                              >
                                <User className="h-4 w-4" /> Perfil Completo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileText className="h-4 w-4" /> Histórico
                                Escolar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditDialog(student)
                                }}
                              >
                                Editar Cadastro
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteId(studentId)
                                }}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="text-sm font-medium">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <StudentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingStudent ? handleUpdate : handleCreate}
        initialData={editingStudent}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o aluno do sistema.
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
