import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  Shield,
  School,
  User as UserIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useUserStore from '@/stores/useUserStore'
import { UserFormDialog } from './components/UserFormDialog'
import { mockSchools, User } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

export default function UsersList() {
  const { users, currentUser, addUser, updateUser, deleteUser } = useUserStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'email'
    direction: 'asc' | 'desc'
  }>({ key: 'name', direction: 'asc' })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { toast } = useToast()
  const navigate = useNavigate()

  // Access Control
  useEffect(() => {
    if (currentUser && !['admin', 'supervisor'].includes(currentUser.role)) {
      toast({
        variant: 'destructive',
        title: 'Acesso Negado',
        description: 'Você não tem permissão para acessar esta página.',
      })
      navigate('/dashboard')
    }
  }, [currentUser, navigate, toast])

  const handleCreateUser = async (data: any) => {
    try {
      await addUser(data)
      toast({
        title: 'Usuário criado',
        description: `O usuário ${data.name} foi criado com sucesso.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar usuário',
        description: 'Não foi possível criar o usuário. Tente novamente.',
      })
    }
  }

  const handleUpdateUser = async (data: any) => {
    if (editingUser) {
      try {
        await updateUser(editingUser.id, data)
        toast({
          title: 'Usuário atualizado',
          description: `Os dados de ${data.name} foram atualizados.`,
        })
        setEditingUser(null)
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao atualizar usuário',
          description: 'Não foi possível atualizar o usuário. Tente novamente.',
        })
      }
    }
  }

  const handleDeleteUser = () => {
    if (deleteId) {
      deleteUser(deleteId)
      toast({
        title: 'Usuário removido',
        description: 'O usuário foi removido do sistema.',
      })
      setDeleteId(null)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const toggleSort = (key: 'name' | 'email') => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700">
            Administrador
          </Badge>
        )
      case 'supervisor':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">Supervisor</Badge>
        )
      case 'coordinator':
        return (
          <Badge className="bg-orange-600 hover:bg-orange-700">
            Coordenador
          </Badge>
        )
      case 'administrative':
        return (
          <Badge className="bg-slate-600 hover:bg-slate-700">
            Administrativo
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getSchoolNames = (user: User) => {
    if (user.role === 'coordinator' && user.schoolIds) {
      if (user.schoolIds.length === 0) return 'Nenhuma'
      const names = user.schoolIds
        .map((id) => mockSchools.find((s) => s.id === id)?.name)
        .filter(Boolean)
        .join(', ')
      return names || 'Desconhecida'
    }
    if (user.role === 'administrative' && user.schoolId) {
      return (
        mockSchools.find((s) => s.id === user.schoolId)?.name || 'Desconhecida'
      )
    }
    return '-'
  }

  // Filtering and Sorting
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    const matchesSchool =
      schoolFilter === 'all' ||
      user.schoolId === schoolFilter ||
      (user.schoolIds && user.schoolIds.includes(schoolFilter))

    return matchesSearch && matchesRole && matchesSchool
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortConfig.key].toLowerCase()
    const bValue = b[sortConfig.key].toLowerCase()

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Block rendering if not authorized (UX improvement while useEffect redirects)
  if (currentUser && !['admin', 'supervisor'].includes(currentUser.role)) {
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Gerenciamento de Usuários
          </h2>
          <p className="text-muted-foreground">
            Controle de acesso e perfis do sistema.
          </p>
        </div>
        <Button 
          onClick={openCreateDialog} 
          className="w-full sm:w-auto bg-gradient-to-r from-primary via-blue-600 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
        >
          <div className="p-1 rounded-md bg-white/20 mr-2">
            <Plus className="h-5 w-5" />
          </div>
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listagem de Usuários</CardTitle>
          <CardDescription>
            Visualize, filtre e gerencie todos os usuários cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou login..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-[200px]">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filtrar por Perfil" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Perfis</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="coordinator">Coordenador</SelectItem>
                    <SelectItem value="administrative">
                      Administrativo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[250px]">
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filtrar por Escola" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Escolas</SelectItem>
                    {mockSchools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">
                    <Button
                      variant="ghost"
                      onClick={() => toggleSort('name')}
                      className="-ml-4 h-8 data-[state=open]:bg-accent"
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
                  <TableHead className="w-[25%]">
                    <Button
                      variant="ghost"
                      onClick={() => toggleSort('email')}
                      className="-ml-4 h-8 data-[state=open]:bg-accent"
                    >
                      Login (E-mail)
                      {sortConfig.key === 'email' ? (
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
                  <TableHead className="w-[15%]">Perfil</TableHead>
                  <TableHead className="w-[20%]">Escolas</TableHead>
                  <TableHead className="text-right w-[10%]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div
                          className="text-sm text-muted-foreground line-clamp-2"
                          title={getSchoolNames(user)}
                        >
                          {getSchoolNames(user)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(user)}
                            >
                              Editar Dados
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(user.id)}
                            >
                              Excluir Usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        initialData={editingUser}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode
              ser desfeita e o usuário perderá o acesso ao sistema
              imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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
