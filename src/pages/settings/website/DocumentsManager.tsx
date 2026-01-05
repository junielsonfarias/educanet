import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  FileText,
  ExternalLink,
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
import { DocumentFormDialog } from './components/DocumentFormDialog'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { RequirePermission } from '@/components/RequirePermission'
import type { Database } from '@/lib/supabase/database.types'

type PublicContentRow = Database['public']['Tables']['public_portal_content']['Row']

export default function DocumentsManager() {
  const {
    publicContent,
    loading,
    fetchPublicContent,
    addPublicContent,
    updatePublicContent,
    deletePublicContent,
    publishContent,
    unpublishContent,
  } = usePublicContentStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<PublicContentRow | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Fetch documents on mount (filter by content_type = 'document')
  useEffect(() => {
    fetchPublicContent()
  }, [fetchPublicContent])

  // Filter only document items
  const documents = useMemo(() => {
    if (!Array.isArray(publicContent)) return []
    return publicContent.filter(item => item.content_type === 'document')
  }, [publicContent])

  // Filter by search term
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const documentNumber = doc.metadata?.document_number || ''
      const summary = doc.summary || doc.content || ''
      const term = searchTerm.toLowerCase()
      return (
        documentNumber.toLowerCase().includes(term) ||
        summary.toLowerCase().includes(term)
      )
    })
  }, [documents, searchTerm])

  const handleCreate = async (data: any) => {
    try {
      await addPublicContent({
        ...data,
        content_type: 'document',
      })
      toast.success('Documento publicado com sucesso.')
      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Erro ao criar documento')
    }
  }

  const handleUpdate = async (data: any) => {
    if (editingDoc) {
      try {
        await updatePublicContent(editingDoc.id, data)
        toast.success('Documento atualizado com sucesso.')
        setEditingDoc(null)
        setIsDialogOpen(false)
      } catch (error) {
        toast.error('Erro ao atualizar documento')
      }
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deletePublicContent(deleteId)
        toast.success('Documento removido com sucesso.')
        setDeleteId(null)
      } catch (error) {
        toast.error('Erro ao remover documento')
      }
    }
  }

  const openCreateDialog = () => {
    setEditingDoc(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (doc: PublicContentRow) => {
    setEditingDoc(doc)
    setIsDialogOpen(true)
  }

  const toggleStatus = async (doc: PublicContentRow) => {
    try {
      if (doc.is_published) {
        await unpublishContent(doc.id)
        toast.success('Documento ocultado com sucesso.')
      } else {
        await publishContent(doc.id)
        toast.success('Documento publicado com sucesso.')
      }
    } catch (error) {
      toast.error('Erro ao alterar status do documento')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Publicação de Documentos
          </h2>
          <p className="text-muted-foreground">
            Gerencie o portal de transparência e documentos oficiais.
          </p>
        </div>
        <RequirePermission permission="create:document">
          <Button 
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Publicar Documento
          </Button>
        </RequirePermission>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Acervo de Documentos</CardTitle>
          <CardDescription>
            Decretos, portarias e comunicados públicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou ementa..."
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
                  <TableHead>Nº Documento</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ementa</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[300px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhum documento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.map((doc) => {
                    const documentNumber = (doc.metadata as any)?.document_number || doc.title || 'N/A'
                    const organ = (doc.metadata as any)?.organ || 'N/A'
                    const summary = doc.summary || doc.content || 'Sem descrição'
                    const driveLink = (doc.metadata as any)?.drive_link || doc.external_url || '#'

                    return (
                      <TableRow key={`doc-${doc.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {documentNumber}
                          </div>
                        </TableCell>
                        <TableCell>{organ}</TableCell>
                        <TableCell>
                          {doc.publish_date
                            ? format(parseISO(doc.publish_date), 'dd/MM/yyyy')
                            : doc.created_at
                            ? format(parseISO(doc.created_at), 'dd/MM/yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell
                          className="max-w-[300px] truncate"
                          title={summary}
                        >
                          {summary}
                        </TableCell>
                        <TableCell>
                          {driveLink && driveLink !== '#' ? (
                            <a
                              href={driveLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              Drive <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={doc.is_published ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => toggleStatus(doc)}
                          >
                            {doc.is_published ? 'Visível' : 'Oculto'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <RequirePermission permission="edit:document">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(doc)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </RequirePermission>
                            <RequirePermission permission="delete:document">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteId(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </RequirePermission>
                          </div>
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

      <DocumentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingDoc ? handleUpdate : handleCreate}
        initialData={editingDoc}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o documento do portal público.
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
