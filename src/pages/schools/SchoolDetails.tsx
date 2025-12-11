import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  School as SchoolIcon,
  Users,
  BookOpen,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useSchoolStore from '@/stores/useSchoolStore'
import { useState } from 'react'
import { SchoolFormDialog } from './components/SchoolFormDialog'
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
import { useToast } from '@/hooks/use-toast'

export default function SchoolDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getSchool, updateSchool, deleteSchool } = useSchoolStore()
  const { toast } = useToast()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const school = getSchool(id || '')

  if (!school) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Escola não encontrada</h2>
        <Button onClick={() => navigate('/escolas')}>Voltar para Lista</Button>
      </div>
    )
  }

  const handleUpdate = (data: any) => {
    updateSchool(school.id, data)
    toast({
      title: 'Escola atualizada',
      description: 'Dados atualizados com sucesso.',
    })
  }

  const handleDelete = () => {
    deleteSchool(school.id)
    toast({
      title: 'Escola excluída',
      description: 'A escola foi removida com sucesso.',
    })
    navigate('/escolas')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/escolas')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            {school.name}
            <Badge
              variant={school.status === 'active' ? 'default' : 'secondary'}
            >
              {school.status === 'active' ? 'Ativa' : 'Inativa'}
            </Badge>
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <SchoolIcon className="h-4 w-4" /> Código: {school.code}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteId(school.id)}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
            <CardDescription>Detalhes cadastrais da unidade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Endereço</p>
                  <p className="text-muted-foreground">{school.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Telefone</p>
                  <p className="text-muted-foreground">{school.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Direção</p>
                  <p className="text-muted-foreground">{school.director}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">
                Estatísticas Rápidas (Simulado)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Alunos</span>
                  </div>
                  <span className="text-2xl font-bold">450</span>
                </div>
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Professores</span>
                  </div>
                  <span className="text-2xl font-bold">28</span>
                </div>
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Turmas</span>
                  </div>
                  <span className="text-2xl font-bold">16</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagem da Escola</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-md overflow-hidden bg-muted">
              <img
                src={`https://img.usecurling.com/p/400/300?q=school%20building&dpr=2`}
                alt="Escola"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Foto da fachada principal
            </p>
          </CardContent>
        </Card>
      </div>

      <SchoolFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        initialData={school}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente a escola e todos os dados
              associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
