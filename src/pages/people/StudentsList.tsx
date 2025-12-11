import { useState } from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  User,
  FileText,
  Filter,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useStudentStore from '@/stores/useStudentStore'
import useUserStore from '@/stores/useUserStore'
import { useNavigate } from 'react-router-dom'
import { StudentFormDialog } from './components/StudentFormDialog'
import { Student } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
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
  const { students, addStudent, updateStudent, deleteStudent } =
    useStudentStore()
  const { currentUser } = useUserStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const navigate = useNavigate()
  const { toast } = useToast()

  const isAdminOrSupervisor =
    currentUser?.role === 'admin' || currentUser?.role === 'supervisor'

  const filteredStudents = students.filter((student) => {
    // Safety check for student object and required fields
    if (!student) return false
    const name = student.name || ''
    const registration = student.registration || ''
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleCreate = (data: any, initialEnrollment: any) => {
    addStudent(data, initialEnrollment)
    toast({
      title: 'Aluno matriculado',
      description: `${data.name} adicionado com sucesso.`,
    })
  }

  const handleUpdate = (data: any) => {
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
          {isAdminOrSupervisor && (
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Aluno
            </Button>
          )}
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
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Série/Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum aluno encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    // Safe access to enrollments to avoid TypeError
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
                        className="cursor-pointer hover:bg-muted/50"
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
                            variant={
                              displayStatus === 'Cursando'
                                ? 'outline'
                                : 'secondary'
                            }
                            className={
                              displayStatus === 'Cursando'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : ''
                            }
                          >
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
                              {isAdminOrSupervisor && (
                                <>
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
                                </>
                              )}
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
