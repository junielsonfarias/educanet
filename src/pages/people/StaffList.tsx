import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, MoreHorizontal, Mail, Phone, Filter, UserCog } from 'lucide-react'
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
import { useStaffStore } from '@/stores/useStaffStore.supabase'
import { toast } from 'sonner'
import { StaffFormDialog } from './components/StaffFormDialog'
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
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import useUserStore from '@/stores/useUserStore'
import type { StaffFullInfo } from '@/lib/supabase/services'

export default function StaffList() {
  const { staff, loading, fetchStaff, createStaff, updateStaff, deleteStaff } = useStaffStore()
  const { schools, fetchSchools } = useSchoolStore()
  const { currentUser } = useUserStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffFullInfo | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch data on mount
  useEffect(() => {
    fetchStaff()
    fetchSchools()
  }, [fetchStaff, fetchSchools])

  // Filter staff
  const filteredStaff = useMemo(() => {
    if (!Array.isArray(staff)) return []
    
    return staff.filter((s) => {
      if (!s || !s.person) return false
      
      const fullName = `${s.person.first_name} ${s.person.last_name}`
      const email = s.person.email || ''
      const position = s.position?.name || ''
      const department = s.department?.name || ''
      const term = searchTerm.toLowerCase()
      
      return (
        fullName.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        position.toLowerCase().includes(term) ||
        department.toLowerCase().includes(term) ||
        s.functional_registration.toLowerCase().includes(term)
      )
    })
  }, [staff, searchTerm])

  const handleCreate = async (data: any) => {
    if (!currentUser?.person_id) {
      toast.error('Usuário não autenticado')
      return
    }

    const personData = {
      first_name: data.firstName,
      last_name: data.lastName,
      cpf: data.cpf,
      rg: data.rg || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      date_of_birth: data.dateOfBirth,
      type: 'Funcionario' as const,
      created_by: currentUser.person_id,
    }

    const staffData = {
      functional_registration: data.functionalRegistration,
      position_id: data.positionId,
      department_id: data.departmentId,
      school_id: data.schoolId || null,
      created_by: currentUser.person_id,
    }

    const result = await createStaff(personData, staffData)
    if (result) {
      setIsDialogOpen(false)
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingStaff || !currentUser?.person_id) return

    const personData = {
      first_name: data.firstName,
      last_name: data.lastName,
      cpf: data.cpf,
      rg: data.rg || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      date_of_birth: data.dateOfBirth,
      updated_by: currentUser.person_id,
    }

    const staffData = {
      functional_registration: data.functionalRegistration,
      position_id: data.positionId,
      department_id: data.departmentId,
      school_id: data.schoolId || null,
      updated_by: currentUser.person_id,
    }

    const result = await updateStaff(editingStaff.id, personData, staffData)
    if (result) {
      setEditingStaff(null)
      setIsDialogOpen(false)
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      const success = await deleteStaff(deleteId)
      if (success) {
        setDeleteId(null)
      }
    }
  }

  const openEditDialog = (staffMember: StaffFullInfo) => {
    setEditingStaff(staffMember)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingStaff(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Funcionários
          </h2>
          <p className="text-muted-foreground">
            Gerenciamento de funcionários não-docentes da rede.
          </p>
        </div>
        <RequirePermission permission="create:staff">
          <Button 
            onClick={openCreateDialog} 
            className="w-full sm:w-auto bg-gradient-to-r from-primary via-blue-600 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Novo Funcionário
          </Button>
        </RequirePermission>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listagem de Funcionários</CardTitle>
          <CardDescription>
            Visualize e gerencie os funcionários cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cargo ou e-mail..."
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
                  <TableHead>Cargo</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Escola
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contato
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[180px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhum funcionário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staffMember) => {
                    if (!staffMember || !staffMember.person) return null
                    
                    const fullName = `${staffMember.person.first_name} ${staffMember.person.last_name}`
                    const initials = `${staffMember.person.first_name[0]}${staffMember.person.last_name[0]}`.toUpperCase()
                    const school = staffMember.school
                    const isActive = !staffMember.deleted_at
                    
                    return (
                      <TableRow
                        key={`staff-${staffMember.id}`}
                        className="cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200"
                      >
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${staffMember.id}`}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{fullName}</span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              {staffMember.person.email || 'Sem e-mail'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="font-normal w-fit">
                              {staffMember.position?.name || 'Sem cargo'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {staffMember.department?.name || 'Sem departamento'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {school ? (
                            <span className="text-sm">{school.name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Secretaria
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col text-sm gap-1">
                            {staffMember.person.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {staffMember.person.email}
                              </div>
                            )}
                            {staffMember.person.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {staffMember.person.phone}
                              </div>
                            )}
                            {!staffMember.person.email && !staffMember.person.phone && (
                              <span className="text-muted-foreground">Sem contato</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive ? 'default' : 'destructive'}>
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
                              <RequirePermission permission="edit:staff">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditDialog(staffMember)
                                  }}
                                >
                                  Editar Dados
                                </DropdownMenuItem>
                              </RequirePermission>
                              <RequirePermission permission="delete:staff">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteId(staffMember.id)
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

      <StaffFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingStaff ? handleUpdate : handleCreate}
        initialData={editingStaff}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este funcionário?
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

