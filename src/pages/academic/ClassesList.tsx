import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Users,
  School,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  GraduationCap,
  ChevronRight,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { ClassFormDialogUnified } from '@/pages/schools/components/ClassFormDialogUnified'
import { toast } from 'sonner'
import type { ClassWithFullInfo } from '@/lib/supabase/services'
import type { School as SchoolType } from '@/lib/database-types'

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
    deleteClass,
  } = useClassStore()
  const { academicYears, fetchAcademicYears } = useAcademicYearStore()
  const { fetchCourses } = useCourseStore()

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

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

  // Adaptar classes para estrutura do componente
  const allClasses = useMemo(() => {
    return classes.map((cls) => {
      // academic_year agora é garantido pelo service (getAllWithFullInfo)
      const yearName = cls.academic_year?.name || ''
      const yearId = cls.academic_year?.id?.toString() || ''

      // Montar nome do curso com série
      const courseName = cls.course?.name || ''
      const gradeName = cls.education_grade?.grade_name || ''
      const courseGradeName = gradeName ? `${courseName} - ${gradeName}` : courseName

      return {
        ...cls,
        id: cls.id.toString(),
        name: cls.name || '',
        schoolName: cls.school?.trade_name || cls.school?.name || '',
        schoolId: cls.school_id?.toString() || '',
        yearName,
        yearId,
        gradeName: courseGradeName,
        serieAnoName: gradeName,
        shift: cls.shift || '',
        capacity: cls.capacity || 0,
        isMultiGrade: cls.is_multi_grade || false,
        stats: cls.stats,
      }
    })
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

  // Permissions based on user role
  const canManage = (schoolId?: string) => {
    if (!userData) return false
    const role = userData.role
    if (role === 'Admin' || role === 'Supervisor') return true
    if (role === 'Coordenador' || role === 'Diretor') {
      // Coordenador/Diretor só pode gerenciar turmas de suas escolas
      return schoolId === userData.schoolId?.toString()
    }
    return false
  }

  // Filter schools based on user role (Admin: Todas, Polo: Escolas do polo, Escola: Suas)
  const safeSchools = Array.isArray(schools) ? schools : []
  const filteredSchoolsByRole = useMemo(() => {
    if (!userData) return []
    const role = userData.role

    // Admin e Supervisor veem todas as escolas
    if (role === 'Admin' || role === 'Supervisor') {
      return safeSchools
    }

    // Coordenador de Polo vê apenas escolas do polo
    if (role === 'Coordenador de Polo' && userData.poloId) {
      return safeSchools.filter((s: SchoolType) => s.polo_id === userData.poloId)
    }

    // Coordenador, Diretor, Professor veem apenas sua escola
    if (['Coordenador', 'Diretor', 'Professor'].includes(role) && userData.schoolId) {
      return safeSchools.filter((s: SchoolType) => s.id === userData.schoolId)
    }

    return []
  }, [safeSchools, userData])

  // Filter classes based on user role hierarchy
  const classesFilteredByRole = useMemo(() => {
    if (!userData) return allClasses
    const role = userData.role

    // Admin e Supervisor veem todas as turmas
    if (role === 'Admin' || role === 'Supervisor') {
      return allClasses
    }

    // Coordenador de Polo vê turmas das escolas do polo
    if (role === 'Coordenador de Polo' && userData.poloId) {
      const poloSchoolIds = filteredSchoolsByRole.map((s: SchoolType) => s.id.toString())
      return allClasses.filter((cls) => poloSchoolIds.includes(cls.schoolId))
    }

    // Coordenador, Diretor, Professor veem apenas turmas da sua escola
    if (['Coordenador', 'Diretor', 'Professor'].includes(role) && userData.schoolId) {
      return allClasses.filter((cls) => cls.schoolId === userData.schoolId?.toString())
    }

    return []
  }, [allClasses, userData, filteredSchoolsByRole])

  // Filtering - uses classesFilteredByRole which is already filtered by user role
  const filteredClasses = useMemo(() => {
    return classesFilteredByRole.filter((cls) => {
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
  }, [classesFilteredByRole, searchTerm, schoolFilter, gradeFilter, shiftFilter, yearFilter])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, schoolFilter, gradeFilter, shiftFilter, yearFilter])

  // Paginated classes
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)
  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredClasses.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredClasses, currentPage, itemsPerPage])

  // Determine schools available for creation
  const availableSchools = filteredSchoolsByRole.filter((s: SchoolType) => canManage(s.id.toString()))
  const canCreate = availableSchools.length > 0 || userData?.role === 'Admin'

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
                {filteredSchoolsByRole.map((s: SchoolType) => (
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Curso/Série</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead className="text-center">Alunos</TableHead>
                  <TableHead className="text-center">Capacidade</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-center">Turma</TableHead>
                  <TableHead className="font-semibold text-center">Escola</TableHead>
                  <TableHead className="font-semibold text-center">Curso/Série</TableHead>
                  <TableHead className="font-semibold text-center">Turno</TableHead>
                  <TableHead className="font-semibold text-center">Ano Letivo</TableHead>
                  <TableHead className="font-semibold text-center">Alunos</TableHead>
                  <TableHead className="font-semibold text-center">Capacidade</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClasses.map((cls) => {
                  const occupancyRate = cls.capacity
                    ? Math.round(((cls.stats?.totalStudents || 0) / cls.capacity) * 100)
                    : 0
                  const occupancyColor = occupancyRate >= 90
                    ? 'text-red-600 bg-red-50'
                    : occupancyRate >= 70
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-green-600 bg-green-50'

                  return (
                    <TableRow
                      key={`${cls.schoolId}-${cls.id}`}
                      className="cursor-pointer hover:bg-purple-50/50 transition-colors group"
                      onClick={() => {
                        const classId = typeof cls.id === 'string' ? cls.id : cls.id.toString()
                        navigate(`/academico/turmas/${classId}`)
                      }}
                    >
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-100 to-purple-200">
                            <Users className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-medium group-hover:text-purple-600 transition-colors">
                              {cls.name}
                            </span>
                            {cls.code && (
                              <span className="text-xs text-muted-foreground">
                                {cls.code}
                              </span>
                            )}
                          </div>
                          {cls.isMultiGrade && (
                            <Badge variant="outline" className="text-[10px] h-5 border-purple-300 text-purple-600">
                              Multi
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <School className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[200px]">{cls.schoolName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">{cls.gradeName || '-'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-normal">
                          {cls.shift || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">{cls.yearName || '-'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${occupancyColor} border-0`}>
                          {cls.stats?.totalStudents || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-muted-foreground">{cls.capacity}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
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
                                  <Pencil className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const classId = typeof cls.id === 'string' ? parseInt(cls.id) : cls.id
                                    setDeleteId(classId)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredClasses.length)} de {filteredClasses.length} turmas
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  Primeira
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Última
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <ClassFormDialogUnified
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingClass(null)
        }}
        onSuccess={() => {
          setIsDialogOpen(false)
          setEditingClass(null)
          fetchClasses()
          toast.success(editingClass ? 'Turma atualizada com sucesso!' : 'Turma criada com sucesso!')
        }}
        schools={filteredSchoolsByRole}
        editingClass={
          editingClass
            ? {
                id: editingClass.id,
                name: editingClass.name,
                code: editingClass.code,
                shift: editingClass.shift || 'Manhã',
                capacity: editingClass.capacity || 35,
                school_id: editingClass.school_id,
                course_id: editingClass.course_id,
                education_grade_id: editingClass.education_grade_id,
                academic_period_id: editingClass.academic_period_id,
                is_multi_grade: editingClass.is_multi_grade,
                education_modality: editingClass.education_modality,
                tipo_regime: editingClass.tipo_regime,
                operating_hours: editingClass.operating_hours,
                min_students: editingClass.min_students,
                max_dependency_subjects: editingClass.max_dependency_subjects,
                operating_days: editingClass.operating_days,
                regent_teacher_id: editingClass.regent_teacher_id,
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
