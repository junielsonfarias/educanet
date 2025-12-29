import { useState } from 'react'
import { Plus, BookOpen, Layers, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useCourseStore from '@/stores/useCourseStore'
import { useNavigate } from 'react-router-dom'
import { CourseFormDialog } from './components/CourseFormDialog'
import { useToast } from '@/hooks/use-toast'
import { RequirePermission } from '@/components/RequirePermission'

export default function CoursesList() {
  const { etapasEnsino, addEtapaEnsino } = useCourseStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleCreate = (data: any) => {
    addEtapaEnsino(data)
    toast({
      title: 'Etapa de Ensino criada',
      description: `${data.name} foi adicionada com sucesso.`,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Etapas de Ensino
          </h2>
          <p className="text-muted-foreground">
            Gerencie as etapas de ensino, séries/anos e grades curriculares conforme Censo Escolar (INEP).
          </p>
        </div>
        <RequirePermission permission="create:course">
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Nova Etapa de Ensino
          </Button>
        </RequirePermission>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {etapasEnsino.map((course) => {
          const codigoCenso = (course as any).codigoCenso
          const grades = course.seriesAnos || []
          
          return (
            <Card
              key={course.id}
              className="cursor-pointer relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-white border-purple-200/50 hover:border-purple-400 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]"
              onClick={() => navigate(`/academico/cursos/${course.id}`)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  {course.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 flex-wrap">
                  <span>{grades.length} Séries/Anos cadastrados</span>
                  {codigoCenso && (
                    <Badge variant="outline" className="text-xs">
                      <Hash className="h-3 w-3 mr-1" />
                      INEP: {codigoCenso}
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    <span>Clique para gerenciar séries/anos e disciplinas</span>
                  </div>
                  {codigoCenso && (
                    <div className="text-xs text-muted-foreground pt-1 border-t">
                      Código oficial do Censo Escolar (INEP)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {etapasEnsino.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            Nenhuma etapa de ensino cadastrada. Comece adicionando uma nova etapa de ensino.
          </div>
        )}
      </div>

      <CourseFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  )
}
