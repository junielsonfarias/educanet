import { useState } from 'react'
import {
  Plus,
  Search,
  MapPin,
  Phone,
  MoreHorizontal,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Link, useNavigate } from 'react-router-dom'
import useSchoolStore from '@/stores/useSchoolStore'
import { SchoolFormDialog } from './components/SchoolFormDialog'
import { School } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/usePermissions'
import { RequirePermission } from '@/components/RequirePermission'

export default function SchoolsList() {
  const { schools, addSchool, updateSchool, deleteSchool } = useSchoolStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const navigate = useNavigate()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreate = (data: any) => {
    addSchool(data)
    toast({
      title: 'Escola criada',
      description: `${data.name} foi adicionada com sucesso.`,
    })
  }

  const handleUpdate = (data: any) => {
    if (editingSchool) {
      updateSchool(editingSchool.id, data)
      toast({
        title: 'Escola atualizada',
        description: 'Dados atualizados com sucesso.',
      })
      setEditingSchool(null)
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteSchool(deleteId)
      toast({
        title: 'Escola removida',
        description: 'A escola foi removida do sistema.',
      })
      setDeleteId(null)
    }
  }

  const openCreateDialog = () => {
    setEditingSchool(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (school: School) => {
    setEditingSchool(school)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Escolas
          </h2>
          <p className="text-muted-foreground">
            Gerencie as unidades escolares da rede municipal.
          </p>
        </div>
        <RequirePermission permission="create:school">
          <Button 
            onClick={openCreateDialog} 
            className="w-full sm:w-auto bg-gradient-to-r from-primary via-blue-600 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Nova Escola
          </Button>
        </RequirePermission>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listagem de Escolas</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as escolas cadastradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
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
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Diretor(a)
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Contato
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhuma escola encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchools.map((school) => (
                    <TableRow
                      key={school.id}
                      className="cursor-pointer border-l-4 border-l-transparent hover:border-l-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200"
                      onClick={() => navigate(`/escolas/${school.id}`)}
                    >
                      <TableCell
                        className="font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={`/escolas/${school.id}`}
                          className="hover:underline"
                        >
                          {school.code}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{school.name}</span>
                          <span className="text-xs text-muted-foreground md:hidden flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {school.address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {school.director}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {school.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`flex items-center gap-1.5 px-2.5 py-1 font-medium ${
                            school.status === 'active'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                          }`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${
                              school.status === 'active' ? 'bg-white' : 'bg-white/80'
                            }`}
                          />
                          {school.status === 'active' ? 'Ativa' : 'Inativa'}
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
                                navigate(`/escolas/${school.id}`)
                              }}
                            >
                              Ver Detalhes
                            </DropdownMenuItem>
                            <RequirePermission permission="edit:school">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditDialog(school)
                                }}
                              >
                                Editar Dados
                              </DropdownMenuItem>
                            </RequirePermission>
                            <RequirePermission permission="delete:school">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteId(school.id)
                                }}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </RequirePermission>
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

      <SchoolFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingSchool ? handleUpdate : handleCreate}
        initialData={editingSchool}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta escola? Esta ação não pode ser
              desfeita.
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
