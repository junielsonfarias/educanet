import { useState } from 'react'
import { Plus, Edit, Trash2, Search, Newspaper } from 'lucide-react'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import usePublicContentStore from '@/stores/usePublicContentStore'
import { NewsFormDialog } from './components/NewsFormDialog'
import { NewsPost } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { RequirePermission } from '@/components/RequirePermission'

export default function NewsManager() {
  const { news, addNews, updateNews, deleteNews } = usePublicContentStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<NewsPost | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filteredNews = news.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreate = (data: any) => {
    addNews(data)
    toast({
      title: 'Notícia publicada',
      description: 'A notícia foi adicionada ao site com sucesso.',
    })
  }

  const handleUpdate = (data: any) => {
    if (editingNews) {
      updateNews(editingNews.id, data)
      toast({
        title: 'Notícia atualizada',
        description: 'As alterações foram salvas.',
      })
      setEditingNews(null)
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteNews(deleteId)
      toast({
        title: 'Notícia removida',
        description: 'O item foi excluído do sistema.',
      })
      setDeleteId(null)
    }
  }

  const openCreateDialog = () => {
    setEditingNews(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: NewsPost) => {
    setEditingNews(item)
    setIsDialogOpen(true)
  }

  const toggleStatus = (item: NewsPost) => {
    updateNews(item.id, { active: !item.active })
    toast({
      title: item.active ? 'Notícia ocultada' : 'Notícia publicada',
      description: `Status alterado para ${!item.active ? 'Ativo' : 'Inativo'}.`,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Gerenciamento de Notícias
          </h2>
          <p className="text-muted-foreground">
            Publique e gerencie as notícias do site institucional.
          </p>
        </div>
        <RequirePermission permission="create:news">
          <Button 
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Nova Notícia
          </Button>
        </RequirePermission>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listagem de Notícias</CardTitle>
          <CardDescription>Histórico de todas as publicações.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título..."
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
                  <TableHead>Título</TableHead>
                  <TableHead>Data Publicação</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhuma notícia encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNews.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        <div className="flex items-center gap-2">
                          <Newspaper className="h-4 w-4 text-muted-foreground" />
                          {item.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(item.publishDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{item.author}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.active ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleStatus(item)}
                        >
                          {item.active ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <RequirePermission permission="edit:news">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </RequirePermission>
                          <RequirePermission permission="delete:news">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </RequirePermission>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NewsFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingNews ? handleUpdate : handleCreate}
        initialData={editingNews}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Notícia</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação removerá a notícia do site permanentemente.
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
