import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Mail, Phone, Filter } from 'lucide-react'
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
import useTeacherStore from '@/stores/useTeacherStore'
import { useNavigate } from 'react-router-dom'
import { TeacherFormDialog } from './components/TeacherFormDialog'
import { Teacher } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/usePermissions'
import { RequirePermission } from '@/components/RequirePermission'
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

export default function TeachersList() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } =
    useTeacherStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const navigate = useNavigate()
  const { toast } = useToast()

  // Safely ensure teachers is an array
  const safeTeachers = Array.isArray(teachers) ? teachers : []

  const filteredTeachers = safeTeachers.filter((teacher) => {
    if (!teacher) return false
    const name = teacher.name || ''
    const subject = teacher.subject || ''
    const term = searchTerm || ''
    return (
      name.toLowerCase().includes(term.toLowerCase()) ||
      subject.toLowerCase().includes(term.toLowerCase())
    )
  })

  const handleCreate = (data: any) => {
    // Preparar dados com estrutura completa do Censo Escolar
    const teacherData = {
      ...data,
      education: {
        graduation: data.graduationCourse
          ? {
              course: data.graduationCourse,
              institution: data.graduationInstitution || '',
              year: data.graduationYear || new Date().getFullYear(),
              area: data.graduationArea || '',
            }
          : undefined,
        specialization: data.specializationCourse
          ? {
              course: data.specializationCourse,
              institution: data.specializationInstitution || '',
              year: data.specializationYear || new Date().getFullYear(),
            }
          : undefined,
        master: data.masterCourse
          ? {
              course: data.masterCourse,
              institution: data.masterInstitution || '',
              year: data.masterYear || new Date().getFullYear(),
            }
          : undefined,
        doctorate: data.doctorateCourse
          ? {
              course: data.doctorateCourse,
              institution: data.doctorateInstitution || '',
              year: data.doctorateYear || new Date().getFullYear(),
            }
          : undefined,
      },
      enabledSubjects: data.enabledSubjects || [],
      functionalSituation: data.functionalSituation || 'efetivo',
      contractType: data.contractType || 'estatutario',
      experienceYears: data.experienceYears || 0,
      workload: {
        total: data.totalWorkload || 0,
        bySubject: {},
      },
    }

    addTeacher(teacherData)
    toast({
      title: 'Professor cadastrado',
      description: `${data.name} adicionado com sucesso.`,
    })
  }

  const handleUpdate = (data: any) => {
    if (editingTeacher) {
      // Preparar dados com estrutura completa do Censo Escolar
      const teacherData = {
        ...data,
        education: {
          graduation: data.graduationCourse
            ? {
                course: data.graduationCourse,
                institution: data.graduationInstitution || '',
                year: data.graduationYear || new Date().getFullYear(),
                area: data.graduationArea || '',
              }
            : undefined,
          specialization: data.specializationCourse
            ? {
                course: data.specializationCourse,
                institution: data.specializationInstitution || '',
                year: data.specializationYear || new Date().getFullYear(),
              }
            : undefined,
          master: data.masterCourse
            ? {
                course: data.masterCourse,
                institution: data.masterInstitution || '',
                year: data.masterYear || new Date().getFullYear(),
              }
            : undefined,
          doctorate: data.doctorateCourse
            ? {
                course: data.doctorateCourse,
                institution: data.doctorateInstitution || '',
                year: data.doctorateYear || new Date().getFullYear(),
              }
            : undefined,
        },
        enabledSubjects: data.enabledSubjects || [],
        functionalSituation: data.functionalSituation || 'efetivo',
        contractType: data.contractType || 'estatutario',
        experienceYears: data.experienceYears || 0,
        workload: {
          total: data.totalWorkload || 0,
          bySubject: editingTeacher.workload?.bySubject || {},
        },
      }

      updateTeacher(editingTeacher.id, teacherData)
      toast({
        title: 'Dados atualizados',
        description: 'Informações do professor atualizadas.',
      })
      setEditingTeacher(null)
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteTeacher(deleteId)
      toast({
        title: 'Professor removido',
        description: 'Registro do professor excluído.',
      })
      setDeleteId(null)
    }
  }

  const openCreateDialog = () => {
    setEditingTeacher(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Professores
          </h2>
          <p className="text-muted-foreground">
            Gerenciamento do corpo docente da rede.
          </p>
        </div>
        <RequirePermission permission="create:teacher">
          <Button 
            onClick={openCreateDialog} 
            className="w-full sm:w-auto bg-gradient-to-r from-primary via-blue-600 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Novo Professor
          </Button>
        </RequirePermission>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listagem de Professores</CardTitle>
          <CardDescription>
            Visualize e gerencie os professores cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou disciplina..."
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
                  <TableHead>Disciplina</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contato
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum professor encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => {
                    if (!teacher) return null
                    return (
                      <TableRow
                        key={teacher.id}
                        className="cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200"
                        onClick={() =>
                          navigate(`/pessoas/professores/${teacher.id}`)
                        }
                      >
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${teacher.id}`}
                            />
                            <AvatarFallback>
                              {(teacher.name || '')
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{teacher.name}</span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              {teacher.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {teacher.subject}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {teacher.email}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {teacher.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`flex items-center gap-1.5 px-2.5 py-1 font-medium ${
                              teacher.status === 'active'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                            }`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${
                                teacher.status === 'active' ? 'bg-white' : 'bg-white/80'
                              }`}
                            />
                            {teacher.status === 'active' ? 'Ativo' : 'Inativo'}
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
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/pessoas/professores/${teacher.id}`)
                                }}
                              >
                                Ver Detalhes
                              </DropdownMenuItem>
                              <RequirePermission permission="edit:teacher">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditDialog(teacher)
                                  }}
                                >
                                  Editar Dados
                                </DropdownMenuItem>
                              </RequirePermission>
                              <RequirePermission permission="delete:teacher">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteId(teacher.id)
                                  }}
                                >
                                  Excluir
                                </DropdownMenuItem>
                              </RequirePermission>
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

      <TeacherFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingTeacher ? handleUpdate : handleCreate}
        initialData={editingTeacher}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este professor?
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
