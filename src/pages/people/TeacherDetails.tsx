import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
  Edit,
  Trash2,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useTeacherStore from '@/stores/useTeacherStore'
import { useState } from 'react'
import { TeacherFormDialog } from './components/TeacherFormDialog'
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

export default function TeacherDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getTeacher, updateTeacher, deleteTeacher } = useTeacherStore()
  const { toast } = useToast()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const teacher = getTeacher(id || '')

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Professor não encontrado</h2>
        <Button onClick={() => navigate('/pessoas/professores')}>
          Voltar para Lista
        </Button>
      </div>
    )
  }

  const handleUpdate = (data: any) => {
    updateTeacher(teacher.id, data)
    toast({
      title: 'Professor atualizado',
      description: 'Dados atualizados com sucesso.',
    })
  }

  const handleDelete = () => {
    deleteTeacher(teacher.id)
    toast({
      title: 'Professor excluído',
      description: 'Registro removido com sucesso.',
    })
    navigate('/pessoas/professores')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/pessoas/professores')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            Detalhes do Professor
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteId(teacher.id)}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 mb-4 border-4 border-primary/10">
              <AvatarImage
                src={`https://img.usecurling.com/ppl/medium?gender=male&seed=${teacher.id}`}
              />
              <AvatarFallback className="text-2xl">
                {teacher.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{teacher.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">Docente</p>
            <Badge
              variant={teacher.status === 'active' ? 'default' : 'secondary'}
              className="mt-2"
            >
              {teacher.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
            <CardDescription>Detalhes do cadastro docente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Disciplina
                </span>
                <p className="font-medium">{teacher.subject}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Telefone
                </span>
                <p className="font-medium">{teacher.phone}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" /> E-mail Institucional
                </span>
                <p className="font-medium">{teacher.email}</p>
              </div>
            </div>

            <Separator />

            <div className="pt-2">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Turmas Alocadas (Exemplo)
              </h4>
              <div className="grid gap-2">
                <div className="p-3 border rounded-md bg-secondary/20 flex justify-between items-center">
                  <span className="font-medium">5º Ano A - Matutino</span>
                  <Badge variant="outline">{teacher.subject}</Badge>
                </div>
                <div className="p-3 border rounded-md bg-secondary/20 flex justify-between items-center">
                  <span className="font-medium">4º Ano B - Vespertino</span>
                  <Badge variant="outline">{teacher.subject}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TeacherFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        initialData={teacher}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Professor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o professor do quadro de funcionários.
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
