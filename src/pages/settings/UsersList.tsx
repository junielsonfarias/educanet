import { useState } from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  Shield,
  School,
  User,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useUserStore from '@/stores/useUserStore'
import { UserFormDialog } from './components/UserFormDialog'
import { mockSchools, User as UserType } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'

export default function UsersList() {
  const { users, currentUser, addUser, updateUser, deleteUser } = useUserStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const { toast } = useToast()

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreateUser = (data: any) => {
    addUser(data)
    toast({
      title: 'Usuário criado',
      description: `O usuário ${data.name} foi criado com sucesso.`,
    })
  }

  const handleUpdateUser = (data: any) => {
    if (editingUser) {
      updateUser(editingUser.id, data)
      toast({
        title: 'Usuário atualizado',
        description: `Os dados de ${data.name} foram atualizados.`,
      })
      setEditingUser(null)
    }
  }

  const handleDeleteUser = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUser(id)
      toast({
        title: 'Usuário removido',
        description: 'O usuário foi removido do sistema.',
      })
    }
  }

  const openEditDialog = (user: UserType) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-600">Administrador</Badge>
      case 'supervisor':
        return <Badge className="bg-blue-600">Supervisor</Badge>
      case 'coordinator':
        return <Badge className="bg-orange-600">Coordenador</Badge>
      case 'administrative':
        return <Badge className="bg-slate-600">Administrativo</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getSchoolNames = (user: UserType) => {
    if (user.role === 'coordinator' && user.schoolIds) {
      if (user.schoolIds.length === 0) return 'Nenhuma'
      if (user.schoolIds.length === 1) {
        return (
          mockSchools.find((s) => s.id === user.schoolIds![0])?.name ||
          'Desconhecida'
        )
      }
      return `${user.schoolIds.length} escolas vinculadas`
    }
    if (user.role === 'administrative' && user.schoolId) {
      return (
        mockSchools.find((s) => s.id === user.schoolId)?.name || 'Desconhecida'
      )
    }
    return 'Todas as escolas'
  }

  // Permission check
  const canManageUsers =
    currentUser?.role === 'admin' || currentUser?.role === 'supervisor'

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
        <p className="text-muted-foreground">
          Você não tem permissão para gerenciar usuários.
        </p>
      </div>
    )
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
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os usuários com acesso ao sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Acesso</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <School className="h-3 w-3" />
                        <span
                          className="truncate max-w-[200px]"
                          title={getSchoolNames(user)}
                        >
                          {getSchoolNames(user)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
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
                          <DropdownMenuItem>Redefinir Senha</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Excluir Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  )
}
