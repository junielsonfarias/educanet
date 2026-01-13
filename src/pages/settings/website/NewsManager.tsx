import { useState, useEffect, useMemo } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
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
import { usePublicContentStore } from '@/stores/usePublicContentStore.supabase'
import { NewsFormDialog } from './components/NewsFormDialog'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { RequirePermission } from '@/components/RequirePermission'
import type { Database } from '@/lib/supabase/database.types'

type PublicContentRow = Database['public']['Tables']['public_portal_content']['Row']

export default function NewsManager() {
  const { 
    publicContent, 
    loading, 
    fetchPublicContent, 
    addPublicContent, 
    updatePublicContent, 
    deletePublicContent,
    publishContent,
    unpublishContent
  } = usePublicContentStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<PublicContentRow | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch news on mount (filter by content_type = 'news')
  useEffect(() => {
    fetchPublicContent()
  }, [fetchPublicContent])

  // Filter only news items
  const news = useMemo(() => {
    if (!Array.isArray(publicContent)) return []
    return publicContent.filter(item => item.content_type === 'news')
  }, [publicContent])

  // Filter by search term
  const filteredNews = useMemo(() => {
    return news.filter((item) =>
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    )
  }, [news, searchTerm])

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      await addPublicContent({
        ...data,
        content_type: 'news',
      })
      toast.success('Notícia publicada com sucesso.')
      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Erro ao criar notícia')
    }
  }

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (editingNews) {
      try {
        await updatePublicContent(editingNews.id, data)
        toast.success('Notícia atualizada com sucesso.')
        setEditingNews(null)
        setIsDialogOpen(false)
      } catch (error) {
        toast.error('Erro ao atualizar notícia')
      }
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deletePublicContent(deleteId)
        toast.success('Notícia removida com sucesso.')
        setDeleteId(null)
      } catch (error) {
        toast.error('Erro ao remover notícia')
      }
    }
  }

  const openCreateDialog = () => {
    setEditingNews(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: PublicContentRow) => {
    setEditingNews(item)
    setIsDialogOpen(true)
  }

  const toggleStatus = async (item: PublicContentRow) => {
    try {
      if (item.is_published) {
        await unpublishContent(item.id)
        toast.success('Notícia ocultada com sucesso.')
      } else {
        await publishContent(item.id)
        toast.success('Notícia publicada com sucesso.')
      }
    } catch (error) {
      toast.error('Erro ao alterar status da notícia')
    }
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
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-[300px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredNews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhuma notícia encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNews.map((item) => (
                    <TableRow key={`news-${item.id}`}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        <div className="flex items-center gap-2">
                          <Newspaper className="h-4 w-4 text-muted-foreground" />
                          {item.title || 'Sem título'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.publish_date
                          ? format(parseISO(item.publish_date), 'dd/MM/yyyy')
                          : item.created_at
                          ? format(parseISO(item.created_at), 'dd/MM/yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{item.author || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.is_published ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleStatus(item)}
                        >
                          {item.is_published ? 'Publicado' : 'Rascunho'}
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
