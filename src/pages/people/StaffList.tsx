import { useState } from 'react'
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
import useStaffStore from '@/stores/useStaffStore'
import { Staff } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
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
import useSchoolStore from '@/stores/useSchoolStore'

const roleLabels: Record<Staff['role'], string> = {
  secretary: 'Secretário(a)',
  coordinator: 'Coordenador(a)',
  director: 'Diretor(a)',
  pedagogue: 'Pedagogo(a)',
  librarian: 'Bibliotecário(a)',
  janitor: 'Zelador(a)',
  cook: 'Cozinheiro(a)',
  security: 'Segurança',
  nurse: 'Enfermeiro(a)',
  psychologist: 'Psicólogo(a)',
  social_worker: 'Assistente Social',
  administrative: 'Administrativo',
  other: 'Outro',
}

export default function StaffList() {
  const { staff, addStaff, updateStaff, deleteStaff } = useStaffStore()
  const { schools } = useSchoolStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<Staff['role'] | 'all'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { toast } = useToast()

  const filteredStaff = staff.filter((s) => {
    const name = s.name || ''
    const roleLabel = s.roleLabel || roleLabels[s.role] || ''
    const term = searchTerm || ''
    const matchesSearch =
      name.toLowerCase().includes(term.toLowerCase()) ||
      roleLabel.toLowerCase().includes(term.toLowerCase()) ||
      s.email.toLowerCase().includes(term.toLowerCase())
    const matchesRole = roleFilter === 'all' || s.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleCreate = (data: any) => {
    addStaff({
      ...data,
      roleLabel: roleLabels[data.role] || data.roleLabel || 'Outro',
    })
    toast({
      title: 'Funcionário cadastrado',
      description: `${data.name} adicionado com sucesso.`,
    })
  }

  const handleUpdate = (data: any) => {
    if (editingStaff) {
      updateStaff(editingStaff.id, {
        ...data,
        roleLabel: roleLabels[data.role] || data.roleLabel || 'Outro',
      })
      toast({
        title: 'Funcionário atualizado',
        description: `Os dados de ${data.name} foram atualizados.`,
      })
      setEditingStaff(null)
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteStaff(deleteId)
      toast({
        title: 'Funcionário removido',
        description: 'O funcionário foi removido do sistema.',
      })
      setDeleteId(null)
    }
  }

  const openEditDialog = (staffMember: Staff) => {
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
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhum funcionário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staffMember) => {
                    if (!staffMember) return null
                    const school = staffMember.schoolId
                      ? schools.find((s) => s.id === staffMember.schoolId)
                      : null
                    return (
                      <TableRow
                        key={staffMember.id}
                        className="cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200"
                      >
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={staffMember.photo || `https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${staffMember.id}`}
                            />
                            <AvatarFallback>
                              {(staffMember.name || '')
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{staffMember.name}</span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              {staffMember.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {staffMember.roleLabel || roleLabels[staffMember.role]}
                          </Badge>
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
                          <div className="flex flex-col text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {staffMember.email}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {staffMember.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              staffMember.status === 'active'
                                ? 'default'
                                : staffMember.status === 'on_leave'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {staffMember.status === 'active'
                              ? 'Ativo'
                              : staffMember.status === 'on_leave'
                              ? 'Afastado'
                              : 'Inativo'}
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

