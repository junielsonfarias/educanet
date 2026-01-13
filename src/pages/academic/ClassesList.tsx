import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { useAuth } from '@/hooks/useAuth'
import { classService } from '@/lib/supabase/services'
import type { ClassWithDetails } from '@/lib/supabase/services/class-service'
import { ClassroomDialog } from '@/pages/schools/components/ClassroomDialog'
import { toast } from 'sonner'

interface ClassFormData {
  schoolId?: string;
  yearId?: string;
  courseId?: string;
  name?: string;
  shift?: string;
  maxCapacity?: number;
  capacity?: number;
  room?: string;
}

interface ClassListItem {
  id: string;
  name: string;
  schoolName: string;
  schoolId: string;
  yearName: string;
  yearId: string;
  gradeName: string;
  serieAnoName: string;
  shift: string;
  capacity: number;
  max_students?: number;
  isMultiGrade: boolean;
  stats?: { totalStudents: number };
  acronym?: string;
}

export default function ClassesList() {
  const navigate = useNavigate()
  const { schools, loading: schoolsLoading, fetchSchools } = useSchoolStore()
  const { userData } = useAuth()
  
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [shiftFilter, setShiftFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassWithDetails | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Carregar escolas e classes ao montar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await fetchSchools()
        
        // Carregar todas as classes
        const allClassesData = await classService.getAll({
          sort: { column: 'name', ascending: true }
        })
        
        // Buscar informações completas para cada classe
        const classesWithDetails = await Promise.all(
          allClassesData.map(async (cls) => {
            try {
              return await classService.getClassFullInfo(cls.id)
            } catch {
              return null
            }
          })
        )
        
        setClasses(classesWithDetails.filter(Boolean) as ClassWithDetails[])
      } catch (error: unknown) {
        toast.error((error as Error)?.message || 'Erro ao carregar turmas')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [fetchSchools])

  // Adaptar classes para estrutura esperada pelo componente
  const allClasses = useMemo(() => {
    return classes.map((cls) => ({
      ...cls,
      id: cls.id.toString(),
      name: cls.name || '',
      schoolName: cls.school?.name || '',
      schoolId: cls.school_id?.toString() || '',
      yearName: cls.academic_year?.name || '',
      yearId: cls.academic_year_id?.toString() || '',
      gradeName: cls.course?.name || '',
      serieAnoName: cls.course?.name || '',
      shift: cls.shift || '',
      capacity: cls.capacity || 0,
      isMultiGrade: false, // Pode ser calculado se necessário
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
    // Coordenador e Administrativo podem gerenciar turmas de suas escolas
    // TODO: Implementar verificação de escolas vinculadas ao usuário
    return false
  }

  // Determine schools available for creation
  const safeSchools = Array.isArray(schools) ? schools : []
  const availableSchools = safeSchools.filter((s) => canManage(s.id.toString()))
  const canCreate = availableSchools.length > 0

  const handleCreate = async (data: ClassFormData) => {
    try {
      if (!data.schoolId || !data.yearId) {
        toast.error('Escola e ano letivo são obrigatórios')
        return
      }

      const classData = {
        school_id: parseInt(data.schoolId),
        academic_year_id: parseInt(data.yearId),
        course_id: data.courseId ? parseInt(data.courseId) : null,
        name: data.name || '',
        shift: data.shift || '',
        max_students: data.maxCapacity || data.capacity || 30,
        room: data.room || null,
      }

      const newClass = await classService.create(classData)
      
      if (newClass) {
        // Recarregar classes
        const allClassesData = await classService.getAll()
        const classesWithDetails = await Promise.all(
          allClassesData.map(async (cls) => {
            try {
              return await classService.getClassFullInfo(cls.id)
            } catch {
              return null
            }
          })
        )
        setClasses(classesWithDetails.filter(Boolean) as ClassWithDetails[])
        
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
          max_students: data.maxCapacity || data.capacity || editingClass.max_students || editingClass.capacity,
          room: data.room || editingClass.room,
          course_id: data.courseId ? parseInt(data.courseId) : editingClass.course_id,
        }

        const updatedClass = await classService.update(editingClass.id, classData)
        
        if (updatedClass) {
          // Recarregar classes
          const allClassesData = await classService.getAll()
          const classesWithDetails = await Promise.all(
            allClassesData.map(async (cls) => {
              try {
                return await classService.getClassFullInfo(cls.id)
              } catch {
                return null
              }
            })
          )
          setClasses(classesWithDetails.filter(Boolean) as ClassWithDetails[])
          
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
        // Verificar se há alunos matriculados
        const stats = await classService.getClassStats(deleteId)
        
        if (stats.totalStudents > 0) {
          toast.warning(
            `Esta turma possui ${stats.totalStudents} aluno(s) matriculado(s). A exclusão atualizará o status das matrículas.`
          )
        }

        await classService.delete(deleteId)
        
        // Recarregar classes
        const allClassesData = await classService.getAll()
        const classesWithDetails = await Promise.all(
          allClassesData.map(async (cls) => {
            try {
              return await classService.getClassFullInfo(cls.id)
            } catch {
              return null
            }
          })
        )
        setClasses(classesWithDetails.filter(Boolean) as ClassWithDetails[])
        
        setDeleteId(null)
        toast.success('Turma removida com sucesso!')
      } catch (error: unknown) {
        toast.error((error as Error)?.message || 'Erro ao remover turma')
      }
    }
  }

  const openCreateDialog = () => {
    setEditingClass(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (cls: ClassListItem) => {
    // Encontrar a classe completa
    const fullClass = classes.find(c => c.id.toString() === cls.id)
    if (fullClass) {
      setEditingClass(fullClass)
      setIsDialogOpen(true)
    }
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
            {searchTerm || schoolFilter !== 'all' || gradeFilter !== 'all' || shiftFilter !== 'all' || yearFilter !== 'all'
              ? 'Nenhuma turma encontrada com os filtros selecionados.'
              : 'Nenhuma turma cadastrada.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
            <Card
              key={`${cls.schoolId}-${cls.id}`}
              className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-white border-purple-200/50 hover:border-purple-400 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02] cursor-pointer"
              onClick={() => {
                const classId = typeof cls.id === 'string' ? cls.id : cls.id.toString()
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
                        <DropdownMenuItem onClick={() => openEditDialog(cls)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            const classId = typeof cls.id === 'string' ? parseInt(cls.id) : cls.id
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
                      <span className="font-medium text-purple-700">{cls.gradeName}</span>
                    </div>
                    <div className="flex flex-col p-2 rounded-md bg-purple-50/50">
                      <span className="text-muted-foreground text-xs">
                        Turno
                      </span>
                      <span className="font-medium text-purple-700">{cls.shift}</span>
                    </div>
                    <div className="flex flex-col p-2 rounded-md bg-purple-50/50">
                      <span className="text-muted-foreground text-xs">
                        Ano Letivo
                      </span>
                      <span className="font-medium text-purple-700">{cls.yearName}</span>
                    </div>
                    <div className="flex flex-col p-2 rounded-md bg-purple-50/50">
                      <span className="text-muted-foreground text-xs">
                        Sigla
                      </span>
                      <span className="font-medium text-purple-700">{cls.acronym || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm pt-2 border-t border-purple-200/50">
                    <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-100 to-purple-200">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">{cls.stats?.totalStudents || 0} Alunos</span>
                    {(cls.max_students || cls.capacity) && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        Capacidade: {cls.max_students || cls.capacity}
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
        etapasEnsino={[]} // TODO: Carregar etapas de ensino do Supabase quando necessário
        schools={availableSchools}
        initialData={editingClass ? {
          ...editingClass,
          schoolId: editingClass.school_id?.toString(),
          yearId: editingClass.academic_year_id?.toString(),
          courseId: editingClass.course_id?.toString(),
          maxCapacity: editingClass.max_students || editingClass.capacity,
        } : undefined}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta turma? Esta ação não pode
              ser desfeita.
              {deleteId && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Os dados relacionados (matrículas, avaliações, frequência) serão atualizados automaticamente.
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
