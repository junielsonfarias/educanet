import { useState, useEffect } from 'react'
import { Plus, Search, MoreHorizontal, Mail, Phone, Filter, Loader2 } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useTeacherStore } from '@/stores/useTeacherStore.supabase'
import { useNavigate } from 'react-router-dom'
import { TeacherFormDialog } from './components/TeacherFormDialog'
import type { TeacherFullInfo } from '@/lib/database-types'
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
  const { 
    teachers, 
    loading, 
    fetchTeachers, 
    createTeacher, 
    updateTeacher, 
    deleteTeacher 
  } = useTeacherStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherFullInfo | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const navigate = useNavigate()
  const { toast } = useToast()

  // Carregar professores ao montar
  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  // Safely ensure teachers is an array
  const safeTeachers = Array.isArray(teachers) ? teachers : []

  const filteredTeachers = safeTeachers.filter((teacher) => {
    if (!teacher || !teacher.person) return false
    const fullName = `${teacher.person.first_name || ''} ${teacher.person.last_name || ''}`.trim()
    const term = searchTerm || ''
    return (
      fullName.toLowerCase().includes(term.toLowerCase()) ||
      (teacher.person.email || '').toLowerCase().includes(term.toLowerCase())
    )
  })

  const handleCreate = async (data: any) => {
    try {
      // Separar dados de person e teacher
      const personData = {
        first_name: data.firstName || data.name?.split(' ')[0] || '',
        last_name: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
        email: data.email || '',
        phone: data.phone || '',
        date_of_birth: data.dateOfBirth || new Date().toISOString().split('T')[0],
        cpf: data.cpf || '',
        type: 'Professor' as const,
      }

      const teacherData = {
        school_id: data.schoolId || null,
        employment_status: data.employmentStatus || 'active',
        hire_date: data.hireDate || new Date().toISOString().split('T')[0],
      }

      await createTeacher(personData, teacherData)
      setIsDialogOpen(false)
    } catch (error) {
      // Erro já tratado pelo store
    }
  }

  const handleUpdate = async (data: any) => {
    if (editingTeacher) {
      try {
        // Separar dados de person e teacher
        const personData = {
          first_name: data.firstName || editingTeacher.person.first_name,
          last_name: data.lastName || editingTeacher.person.last_name,
          email: data.email || editingTeacher.person.email,
          phone: data.phone || editingTeacher.person.phone,
        }

        const teacherData = {
          school_id: data.schoolId || editingTeacher.school_id,
          employment_status: data.employmentStatus || editingTeacher.employment_status,
        }

        await updateTeacher(editingTeacher.id, personData, teacherData)
        setIsDialogOpen(false)
        setEditingTeacher(null)
      } catch (error) {
        // Erro já tratado pelo store
      }
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteTeacher(deleteId)
        setDeleteId(null)
      } catch (error) {
        // Erro já tratado pelo store
      }
    }
  }

  const openCreateDialog = () => {
    setEditingTeacher(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (teacher: TeacherFullInfo) => {
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchTerm ? 'Nenhum professor encontrado com os filtros aplicados.' : 'Nenhum professor cadastrado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => {
                    if (!teacher || !teacher.person) return null
                    const fullName = `${teacher.person.first_name || ''} ${teacher.person.last_name || ''}`.trim()
                    const initials = `${teacher.person.first_name?.[0] || ''}${teacher.person.last_name?.[0] || ''}`.toUpperCase()
                    const isActive = teacher.employment_status === 'active'
                    
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
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{fullName}</span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              {teacher.person.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {teacher.school?.name || 'Sem escola'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {teacher.person.email || 'Sem email'}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {teacher.person.phone || 'Sem telefone'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`flex items-center gap-1.5 px-2.5 py-1 font-medium ${
                              isActive
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                            }`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${
                                isActive ? 'bg-white' : 'bg-white/80'
                              }`}
                            />
                            {isActive ? 'Ativo' : 'Inativo'}
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
