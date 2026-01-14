import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Users,
  School,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  GraduationCap,
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
import { Skeleton } from '@/components/ui/skeleton'
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
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useClassStore } from '@/stores/useClassStore.supabase'
import { useAcademicYearStore } from '@/stores/useAcademicYearStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { useAuth } from '@/hooks/useAuth'
import { ClassroomDialog } from '@/pages/schools/components/ClassroomDialog'
import { toast } from 'sonner'
import type { ClassWithFullInfo } from '@/lib/supabase/services'

interface ClassFormData {
  schoolId?: string
  yearId?: string
  courseId?: string
  name?: string
  shift?: string
  maxCapacity?: number
  capacity?: number
  room?: string
  etapaEnsinoId?: string
  serieAnoId?: string
  regentTeacherId?: string
  education_grade_id?: number
}

export default function ClassesList() {
  const navigate = useNavigate()
  const { userData } = useAuth()

  // Stores
  const { schools, loading: schoolsLoading, fetchSchools } = useSchoolStore()
  const {
    classes,
    educationGrades,
    loading: classesLoading,
    fetchClasses,
    fetchEducationGrades,
    createClass,
    updateClass,
    deleteClass,
  } = useClassStore()
  const { academicYears, fetchAcademicYears } = useAcademicYearStore()
  const { courses, fetchCourses } = useCourseStore()

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [shiftFilter, setShiftFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassWithFullInfo | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Carregar dados ao montar
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchSchools(),
        fetchClasses(),
        fetchEducationGrades(),
        fetchAcademicYears(),
        fetchCourses(),
      ])
    }
    loadData()
  }, [fetchSchools, fetchClasses, fetchEducationGrades, fetchAcademicYears, fetchCourses])

  // Transformar education_grades para o formato esperado pelo ClassroomDialog
  const etapasEnsino = useMemo(() => {
    // Agrupar por education_level
    const grouped: Record<string, { id: string; name: string; seriesAnos: any[] }> = {}

    educationGrades.forEach((grade) => {
      const level = grade.education_level || 'Outros'

      if (!grouped[level]) {
        grouped[level] = {
          id: level,
          name: level,
          seriesAnos: [],
        }
      }

      grouped[level].seriesAnos.push({
        id: grade.id.toString(),
        name: grade.grade_name,
        order: grade.grade_order,
      })
    })

    // Ordenar séries dentro de cada etapa
    Object.values(grouped).forEach((etapa) => {
      etapa.seriesAnos.sort((a, b) => a.order - b.order)
    })

    return Object.values(grouped)
  }, [educationGrades])

  // Adaptar classes para estrutura do componente
  const allClasses = useMemo(() => {
    return classes.map((cls) => ({
      ...cls,
      id: cls.id.toString(),
      name: cls.name || '',
      schoolName: cls.school?.trade_name || cls.school?.name || '',
      schoolId: cls.school_id?.toString() || '',
      yearName: cls.academic_year?.name || '',
      yearId: cls.academic_year_id?.toString() || '',
      gradeName: cls.course?.name || '',
      serieAnoName: cls.course?.name || '',
      shift: cls.shift || '',
      capacity: cls.capacity || 0,
      isMultiGrade: false,
      stats: cls.stats,
    }))
  }, [classes])

  // Unique lists for filters
  const uniqueYears = useMemo(
    () =>
      Array.from(
        new Set(
          allClasses
            .map((c) => c.yearName)
            .filter((y): y is string => Boolean(y) && typeof y === 'string'),
        ),
      ).sort(),
    [allClasses],
  )

  const uniqueGrades = useMemo(
    () =>
      Array.from(
        new Set(
          allClasses
            .map((c) => c.gradeName || c.serieAnoName)
            .filter((g): g is string => Boolean(g) && typeof g === 'string'),
        ),
      ).sort(),
    [allClasses],
  )

  // Filtering
  const filteredClasses = allClasses.filter((cls) => {
    if (!cls) return false
    const matchesSearch = (cls.name || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesSchool =
      schoolFilter === 'all' || cls.schoolId === schoolFilter
    const matchesGrade =
      gradeFilter === 'all' ||
      cls.gradeName === gradeFilter ||
      cls.serieAnoName === gradeFilter
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
    if (!userData) return false
    const role = userData.role
    if (role === 'Admin' || role === 'Supervisor') return true
    return false
  }

  // Determine schools available for creation
  const safeSchools = Array.isArray(schools) ? schools : []
  const availableSchools = safeSchools.filter((s) => canManage(s.id.toString()))
  const canCreate = availableSchools.length > 0 || userData?.role === 'Admin'

  const handleCreate = async (data: ClassFormData) => {
    try {
      if (!data.schoolId || !data.yearId) {
        toast.error('Escola e ano letivo são obrigatórios')
        return
      }

      // Encontrar o academic_period_id baseado no yearId
      const academicYear = academicYears.find(
        (y) => y.id.toString() === data.yearId
      )

      const classData = {
        name: data.name || '',
        school_id: parseInt(data.schoolId),
        course_id: data.courseId ? parseInt(data.courseId) : 1,
        academic_period_id: academicYear?.id || parseInt(data.yearId),
        education_grade_id: data.serieAnoId ? parseInt(data.serieAnoId) : undefined,
        homeroom_teacher_id: data.regentTeacherId ? parseInt(data.regentTeacherId) : undefined,
        capacity: data.maxCapacity || data.capacity || 30,
        shift: data.shift || 'Matutino',
      }

      const result = await createClass(classData)

      if (result) {
        setIsDialogOpen(false)
        toast.success('Turma criada com sucesso!')
      }
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Erro ao criar turma')
    }
  }

  const handleUpdate = async (data: ClassFormData) => {
    if (editingClass) {
      try {
        const classData = {
          name: data.name || editingClass.name,
          shift: data.shift || editingClass.shift,
          capacity: data.maxCapacity || data.capacity || editingClass.capacity,
          course_id: data.courseId ? parseInt(data.courseId) : editingClass.course_id,
          education_grade_id: data.serieAnoId ? parseInt(data.serieAnoId) : undefined,
          homeroom_teacher_id: data.regentTeacherId ? parseInt(data.regentTeacherId) : undefined,
        }

        const result = await updateClass(editingClass.id, classData)

        if (result) {
          setIsDialogOpen(false)
          setEditingClass(null)
          toast.success('Turma atualizada com sucesso!')
        }
      } catch (error: unknown) {
        toast.error((error as Error)?.message || 'Erro ao atualizar turma')
      }
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const result = await deleteClass(deleteId)

        if (result) {
          setDeleteId(null)
          toast.success('Turma removida com sucesso!')
        }
      } catch (error: unknown) {
        toast.error((error as Error)?.message || 'Erro ao remover turma')
      }
    }
  }

  const openCreateDialog = () => {
    setEditingClass(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (cls: any) => {
    const fullClass = classes.find((c) => c.id.toString() === cls.id)
    if (fullClass) {
      setEditingClass(fullClass)
      setIsDialogOpen(true)
    }
  }

  const loading = schoolsLoading || classesLoading

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
          <Button
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
          >
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Nova Turma
          </Button>
        )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Total de Turmas</p>
                <p className="text-2xl font-bold text-purple-700">{classes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <School className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Escolas</p>
                <p className="text-2xl font-bold text-blue-700">{safeSchools.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600">Séries</p>
                <p className="text-2xl font-bold text-green-700">{educationGrades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Anos Letivos</p>
                <p className="text-2xl font-bold text-amber-700">{academicYears.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                {safeSchools.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.trade_name || s.name}
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
                {uniqueYears.map((year, index) => (
                  <SelectItem key={`year-${year}-${index}`} value={year}>
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
                {uniqueGrades.map((g, index) => (
                  <SelectItem key={`grade-${g}-${index}`} value={g}>
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

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {searchTerm ||
            schoolFilter !== 'all' ||
            gradeFilter !== 'all' ||
            shiftFilter !== 'all' ||
            yearFilter !== 'all'
              ? 'Nenhuma turma encontrada com os filtros selecionados.'
              : 'Nenhuma turma cadastrada. Clique em "Nova Turma" para criar.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
            <Card
              key={`${cls.schoolId}-${cls.id}`}
              className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-white border-purple-200/50 hover:border-purple-400 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02] cursor-pointer"
              onClick={() => {
                const classId =
                  typeof cls.id === 'string' ? cls.id : cls.id.toString()
                navigate(`/academico/turmas/${classId}`)
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl group-hover:text-purple-600 transition-colors flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-100 to-purple-200">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      {cls.name}
                      {cls.isMultiGrade && (
                        <Badge className="text-[10px] h-5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-700 border-purple-300">
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
                  {canManage(cls.schoolId?.toString()) && (
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(cls)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            const classId =
                              typeof cls.id === 'string'
                                ? parseInt(cls.id)
                                : cls.id
                            setDeleteId(classId)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col p-2 rounded-md bg-purple-50/50">
                      <span className="text-muted-foreground text-xs">
                        Série
                      </span>
                      <span className="font-medium text-purple-700">
                        {cls.gradeName}
                      </span>
                    </div>
                    <div className="flex flex-col p-2 rounded-md bg-purple-50/50">
                      <span className="text-muted-foreground text-xs">
                        Turno
                      </span>
                      <span className="font-medium text-purple-700">
                        {cls.shift}
                      </span>
                    </div>
                    <div className="flex flex-col p-2 rounded-md bg-purple-50/50">
                      <span className="text-muted-foreground text-xs">
                        Ano Letivo
                      </span>
                      <span className="font-medium text-purple-700">
                        {cls.yearName}
                      </span>
                    </div>
                    <div className="flex flex-col p-2 rounded-md bg-purple-50/50">
                      <span className="text-muted-foreground text-xs">
                        Capacidade
                      </span>
                      <span className="font-medium text-purple-700">
                        {cls.capacity} alunos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm pt-2 border-t border-purple-200/50">
                    <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-100 to-purple-200">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">
                      {cls.stats?.totalStudents || 0} Alunos
                    </span>
                    {cls.capacity && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {Math.round(
                          ((cls.stats?.totalStudents || 0) / cls.capacity) * 100,
                        )}
                        % ocupado
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
        etapasEnsino={etapasEnsino}
        schools={userData?.role === 'Admin' ? safeSchools : availableSchools}
        initialData={
          editingClass
            ? {
                ...editingClass,
                schoolId: editingClass.school_id?.toString(),
                yearId: editingClass.academic_year_id?.toString(),
                courseId: editingClass.course_id?.toString(),
                maxCapacity: editingClass.capacity,
              }
            : undefined
        }
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta turma? Esta ação não pode ser
              desfeita.
              {deleteId && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Os dados relacionados (matrículas, avaliações, frequência)
                  serão atualizados automaticamente.
                </span>
              )}
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
