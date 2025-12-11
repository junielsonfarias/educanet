import { useState } from 'react'
import { Plus, BookOpen, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import useCourseStore from '@/stores/useCourseStore'
import { useNavigate } from 'react-router-dom'
import { CourseFormDialog } from './components/CourseFormDialog'
import { useToast } from '@/hooks/use-toast'

export default function CoursesList() {
  const { courses, addCourse } = useCourseStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleCreate = (data: any) => {
    addCourse(data)
    toast({
      title: 'Curso criado',
      description: `${data.name} foi adicionado com sucesso.`,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Cursos
          </h2>
          <p className="text-muted-foreground">
            Gerencie os níveis de ensino e grades curriculares.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Curso
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(`/academico/cursos/${course.id}`)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {course.name}
              </CardTitle>
              <CardDescription>
                {course.grades.length} Séries/Anos cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>Clique para gerenciar a estrutura curricular</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            Nenhum curso cadastrado. Comece adicionando um novo curso.
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
