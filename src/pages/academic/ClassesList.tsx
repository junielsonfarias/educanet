import { useState } from 'react'
import {
  Calendar,
  Users,
  School,
  Filter,
  Search,
  Plus,
  MoreHorizontal,
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'
import useUserStore from '@/stores/useUserStore'
import { ClassroomDialog } from '@/pages/schools/components/ClassroomDialog'
import { useToast } from '@/hooks/use-toast'

export default function ClassesList() {
  const { schools, addClassroom, updateClassroom, deleteClassroom } =
    useSchoolStore()
  const { courses } = useCourseStore()
  const { currentUser } = useUserStore()
  const { toast } = useToast()

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [shiftFilter, setShiftFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all') // Not perfectly usable across all schools, but can filter by name (e.g. "2024")

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<any>(null)
  const [deleteData, setDeleteData] = useState<{
    schoolId: string
    yearId: string
    classId: string
  } | null>(null)

  // Flatten all classes
  const allClasses = (schools || []).flatMap((school) => {
    if (!school || !Array.isArray(school.academicYears)) return []
    return school.academicYears.flatMap((year) => {
      if (!year || !Array.isArray(year.classes)) return []
      return year.classes.map((cls) => ({
        ...cls,
        schoolName: school.name,
        schoolId: school.id,
        yearName: year.name,
        yearId: year.id,
      }))
    })
  })

  // Unique lists for filters
  const uniqueYears = Array.from(new Set(allClasses.map((c) => c.yearName)))
  const uniqueGrades = Array.from(new Set(allClasses.map((c) => c.gradeName)))

  // Filtering
  const filteredClasses = allClasses.filter((cls) => {
    const matchesSearch = cls.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesSchool =
      schoolFilter === 'all' || cls.schoolId === schoolFilter
    const matchesGrade = gradeFilter === 'all' || cls.gradeName === gradeFilter
    const matchesShift = shiftFilter === 'all' || cls.shift === shiftFilter
    const matchesYear = yearFilter === 'all' || cls.yearName === yearFilter

    return (
      matchesSearch &&
      matchesSchool &&
      matchesGrade &&
      matchesShift &&
      matchesYear
    )
  })

  // Permissions
  const canManage = (schoolId?: string) => {
    if (!currentUser) return false
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor')
      return true
    if (currentUser.role === 'coordinator' && currentUser.schoolIds) {
      return schoolId ? currentUser.schoolIds.includes(schoolId) : false
    }
    if (currentUser.role === 'administrative') {
      return schoolId ? currentUser.schoolId === schoolId : false
    }
    return false
  }

  // Determine schools available for creation
  const availableSchools = schools.filter((s) => canManage(s.id))
  const canCreate = availableSchools.length > 0

  const handleCreate = (data: any) => {
    if (data.schoolId && data.yearId) {
      addClassroom(data.schoolId, data.yearId, data)
      toast({
        title: 'Turma Criada',
        description: `${data.name} adicionada com sucesso.`,
      })
    }
  }

  const handleUpdate = (data: any) => {
    if (editingClass) {
      updateClassroom(
        editingClass.schoolId,
        editingClass.yearId,
        editingClass.id,
        data,
      )
      toast({
        title: 'Turma Atualizada',
        description: 'Informações salvas com sucesso.',
      })
      setEditingClass(null)
    }
  }

  const handleDelete = () => {
    if (deleteData) {
      deleteClassroom(
        deleteData.schoolId,
        deleteData.yearId,
        deleteData.classId,
      )
      toast({
        title: 'Turma Removida',
        description: 'A turma foi excluída.',
      })
      setDeleteData(null)
    }
  }

  const openCreateDialog = () => {
    setEditingClass(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (cls: any) => {
    setEditingClass(cls)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Turmas
          </h2>
          <p className="text-muted-foreground">
            Visão geral e gestão das turmas da rede.
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Nova Turma
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtragem Avançada</CardTitle>
          <CardDescription>
            Utilize os filtros abaixo para localizar turmas específicas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2 overflow-hidden">
                  <School className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Escola" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Escolas</SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Ano Letivo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={year as string}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Série" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Séries</SelectItem>
                {uniqueGrades.map((g) => (
                  <SelectItem key={g} value={g as string}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Turnos</SelectItem>
                <SelectItem value="Matutino">Matutino</SelectItem>
                <SelectItem value="Vespertino">Vespertino</SelectItem>
                <SelectItem value="Noturno">Noturno</SelectItem>
                <SelectItem value="Integral">Integral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma turma encontrada com os filtros selecionados.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
            <Card
              key={`${cls.schoolId}-${cls.id}`}
              className="hover:border-primary/50 transition-colors group relative"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-2">
                      {cls.name}
                      {cls.isMultiGrade && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          Multi
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <School className="h-3 w-3" />
                      <span className="truncate max-w-[180px]">
                        {cls.schoolName}
                      </span>
                    </div>
                  </div>
                  {canManage(cls.schoolId) && (
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
                        <DropdownMenuItem onClick={() => openEditDialog(cls)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            setDeleteData({
                              schoolId: cls.schoolId,
                              yearId: cls.yearId,
                              classId: cls.id,
                            })
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">
                        Série
                      </span>
                      <span className="font-medium">{cls.gradeName}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">
                        Turno
                      </span>
                      <span className="font-medium">{cls.shift}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">
                        Ano Letivo
                      </span>
                      <span className="font-medium">{cls.yearName}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">
                        Sigla
                      </span>
                      <span className="font-medium">{cls.acronym || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm pt-2 border-t">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{cls.studentCount || 0} Alunos</span>
                    {cls.minStudents && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        Min: {cls.minStudents}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClassroomDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={editingClass ? handleUpdate : handleCreate}
        courses={courses}
        schools={availableSchools}
        initialData={editingClass}
      />

      <AlertDialog
        open={!!deleteData}
        onOpenChange={(open) => !open && setDeleteData(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta turma? Todos os alunos
              matriculados serão afetados.
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
