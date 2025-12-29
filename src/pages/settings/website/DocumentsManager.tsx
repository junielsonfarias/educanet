import { useState } from 'react'
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
import { DocumentFormDialog } from './components/DocumentFormDialog'
import { PublicDocument } from '@/lib/mock-data'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { RequirePermission } from '@/components/RequirePermission'

export default function DocumentsManager() {
  const { documents, addDocument, updateDocument, deleteDocument } =
    usePublicContentStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<PublicDocument | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filteredDocs = documents.filter(
    (doc) =>
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreate = (data: any) => {
    addDocument(data)
    toast({
      title: 'Documento publicado',
      description: 'O documento está disponível no portal da transparência.',
    })
  }

  const handleUpdate = (data: any) => {
    if (editingDoc) {
      updateDocument(editingDoc.id, data)
      toast({
        title: 'Documento atualizado',
        description: 'Informações salvas com sucesso.',
      })
      setEditingDoc(null)
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteDocument(deleteId)
      toast({
        title: 'Documento removido',
        description: 'O arquivo foi removido da listagem pública.',
      })
      setDeleteId(null)
    }
  }

  const openCreateDialog = () => {
    setEditingDoc(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (doc: PublicDocument) => {
    setEditingDoc(doc)
    setIsDialogOpen(true)
  }

  const toggleStatus = (doc: PublicDocument) => {
    updateDocument(doc.id, { active: !doc.active })
    toast({
      title: 'Visibilidade alterada',
      description: `O documento agora está ${!doc.active ? 'Visível' : 'Oculto'}.`,
    })
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
                {filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhum documento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.documentNumber}
                        </div>
                      </TableCell>
                      <TableCell>{doc.organ}</TableCell>
                      <TableCell>
                        {format(parseISO(doc.publishDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell
                        className="max-w-[300px] truncate"
                        title={doc.summary}
                      >
                        {doc.summary}
                      </TableCell>
                      <TableCell>
                        <a
                          href={doc.driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Drive <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={doc.active ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleStatus(doc)}
                        >
                          {doc.active ? 'Visível' : 'Oculto'}
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
                  ))
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
