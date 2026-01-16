import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  School as SchoolIcon,
  Users,
  Info,
  Edit,
  Trash2,
  Building,
  GraduationCap,
  Plus,
  Clock,
  Calendar,
  Filter,
  Eye,
  MoreHorizontal,
  Accessibility,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import { useAuth } from '@/hooks/useAuth'
import { SchoolFormDialog } from './components/SchoolFormDialog'
import { SchoolYearCoursesConfig } from './components/SchoolYearCoursesConfig'
import { ClassDetailsDialog } from './components/ClassDetailsDialog'
import { ClassFormDialogUnified } from './components/ClassFormDialogUnified'
import { academicYearService, classService, schoolCourseService } from '@/lib/supabase/services'

interface AcademicYear {
  id: number
  year: number
  is_current?: boolean
}

interface ClassWithStats {
  id: number
  name: string
  code?: string
  shift: string
  capacity: number
  course?: { id: number; name: string; education_level: string }
  academic_period?: {
    id: number
    name: string
    academic_year?: { id: number; year: number }
  }
  education_grade?: { id: number; grade_name: string }
  stats?: {
    totalStudents: number
    occupancyRate: number
  }
  // Campos do Censo Escolar
  is_multi_grade?: boolean
  education_modality?: string
  tipo_regime?: string
  operating_hours?: string
  min_students?: number
  max_dependency_subjects?: number
  operating_days?: string[]
  // Professores
  homeroom_teacher_id?: number
  assistant_teacher_id?: number
  regent_teacher_id?: number
}

export default function SchoolDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentSchool,
    loading,
    fetchSchoolWithStats,
    updateSchool,
    deleteSchool,
    fetchClasses,
    fetchTeachers,
    fetchStudents,
    fetchInfrastructure,
  } = useSchoolStore()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [classes, setClasses] = useState<Record<string, unknown>[]>([])
  const [teachers, setTeachers] = useState<Record<string, unknown>[]>([])
  const [students, setStudents] = useState<Record<string, unknown>[]>([])
  const [infrastructure, setInfrastructure] = useState<Record<string, unknown>[]>([])

  // Estados para aba de turmas
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedGradeId, setSelectedGradeId] = useState<string>('')
  const [selectedShift, setSelectedShift] = useState<string>('')
  const [allClasses, setAllClasses] = useState<ClassWithStats[]>([])
  const [filteredClasses, setFilteredClasses] = useState<ClassWithStats[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)

  // Listas para os filtros
  const [availableCourses, setAvailableCourses] = useState<Array<{id: number; name: string}>>([])
  const [availableGrades, setAvailableGrades] = useState<Array<{id: number; grade_name: string}>>([])

  // Estados para dialogs de turma
  const [showClassFormDialog, setShowClassFormDialog] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [editingClass, setEditingClass] = useState<ClassWithStats | null>(null)
  const [classToDelete, setClassToDelete] = useState<ClassWithStats | null>(null)

  // Hook de autenticação para verificar permissões
  const { userData } = useAuth()
  const userRole = userData?.role || ''

  // Permissões baseadas no tipo de usuário
  const canCreate = ['Admin', 'Supervisor', 'Coordenador', 'Diretor'].includes(userRole)
  const canEdit = ['Admin', 'Supervisor', 'Coordenador', 'Diretor'].includes(userRole)
  const canDelete = ['Admin', 'Supervisor'].includes(userRole)
  const canView = true // Todos podem visualizar

  // Carregar dados da escola ao montar
  useEffect(() => {
    if (id) {
      fetchSchoolWithStats(parseInt(id))
      loadAdditionalData()
    }
  }, [id])

  const loadAdditionalData = async () => {
    if (!id) return

    const schoolId = parseInt(id)
    const [classesData, teachersData, studentsData, infraData] = await Promise.all([
      fetchClasses(schoolId),
      fetchTeachers(schoolId),
      fetchStudents(schoolId),
      fetchInfrastructure(schoolId),
    ])

    setClasses(classesData)
    setTeachers(teachersData)
    setStudents(studentsData)
    setInfrastructure(infraData)

    // Carregar anos letivos
    const yearsData = await academicYearService.getAll()
    setAcademicYears(yearsData || [])

    // Selecionar ano atual por padrão
    const currentYear = (yearsData || []).find((y: AcademicYear) => y.is_current) || (yearsData || [])[0]
    if (currentYear) {
      setSelectedYearId(currentYear.id)
    }
  }

  // Carregar turmas quando o ano letivo mudar
  useEffect(() => {
    if (id && selectedYearId) {
      loadClassesForYear(selectedYearId)
    }
  }, [id, selectedYearId])


  const loadClassesForYear = async (yearId: number) => {
    if (!id) return
    setLoadingClasses(true)

    try {
      const schoolId = parseInt(id)

      // Carregar turmas existentes
      const classesData = await classService.getBySchool(schoolId, { academicYearId: yearId })

      // Carregar estatísticas para cada turma
      const classesWithStats = await Promise.all(
        (classesData || []).map(async (classItem: Record<string, unknown>) => {
          try {
            const stats = await classService.getClassStats(classItem.id as number)
            return { ...classItem, stats } as ClassWithStats
          } catch {
            return { ...classItem, stats: { totalStudents: 0, occupancyRate: 0 } } as ClassWithStats
          }
        })
      )

      setAllClasses(classesWithStats)
      setFilteredClasses(classesWithStats)

      // Carregar cursos e séries CONFIGURADOS para a escola/ano (não das turmas)
      const configuredCourses = await schoolCourseService.getCoursesWithGrades(schoolId, yearId)

      // Extrair cursos disponíveis
      const coursesForFilter = (configuredCourses || []).map(c => ({
        id: c.course_id,
        name: c.course?.name || 'Curso sem nome'
      }))
      setAvailableCourses(coursesForFilter)

      // Extrair todas as séries de todos os cursos configurados
      const gradesMap = new Map<number, string>()
      ;(configuredCourses || []).forEach(course => {
        (course.grades || []).forEach(grade => {
          if (grade.education_grade?.id && grade.education_grade?.grade_name) {
            gradesMap.set(grade.education_grade.id, grade.education_grade.grade_name)
          }
        })
      })
      setAvailableGrades(Array.from(gradesMap, ([id, grade_name]) => ({ id, grade_name })))

      // Resetar filtros ao trocar de ano
      setSelectedCourseId('')
      setSelectedGradeId('')
      setSelectedShift('')
    } catch (error) {
      console.error('Erro ao carregar turmas:', error)
      setAllClasses([])
      setFilteredClasses([])
      setAvailableCourses([])
      setAvailableGrades([])
    } finally {
      setLoadingClasses(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allClasses]

    // Filtrar por curso
    if (selectedCourseId) {
      filtered = filtered.filter(c => c.course?.id === parseInt(selectedCourseId))
    }

    // Filtrar por série
    if (selectedGradeId) {
      filtered = filtered.filter(c => c.education_grade?.id === parseInt(selectedGradeId))
    }

    // Filtrar por turno
    if (selectedShift) {
      filtered = filtered.filter(c => c.shift === selectedShift)
    }

    setFilteredClasses(filtered)
  }

  const clearFilters = () => {
    setSelectedCourseId('')
    setSelectedGradeId('')
    setSelectedShift('')
    setFilteredClasses(allClasses)
  }

  // Aplicar filtros automaticamente quando mudar seleções
  useEffect(() => {
    if (selectedYearId) {
      applyFilters()
    }
  }, [selectedCourseId, selectedGradeId, selectedShift, allClasses])

  const hasActiveFilters = selectedCourseId || selectedGradeId || selectedShift

  const handleClassCreated = () => {
    if (selectedYearId) {
      loadClassesForYear(selectedYearId)
    }
    setEditingClass(null)
  }

  const handleEditClass = (classItem: ClassWithStats) => {
    setEditingClass(classItem)
    setShowClassFormDialog(true)
  }

  const handleDeleteClass = async () => {
    if (!classToDelete) return

    try {
      await classService.delete(classToDelete.id)
      setClassToDelete(null)
      if (selectedYearId) {
        loadClassesForYear(selectedYearId)
      }
    } catch (error) {
      console.error('Erro ao excluir turma:', error)
    }
  }

  const handleViewClass = (classItem: ClassWithStats) => {
    setSelectedClassId(classItem.id)
  }

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!currentSchool) return

    try {
      const schoolData: Record<string, unknown> = {
        trade_name: data.name || currentSchool.trade_name,
        address: data.address || currentSchool.address,
        phone: data.phone || currentSchool.phone,
        email: data.email || currentSchool.email,
        cnpj: data.cnpj || currentSchool.cnpj,
        inep_code: data.inepCode || currentSchool.inep_code,
        student_capacity: data.studentCapacity || currentSchool.student_capacity,
        logo_url: data.logo || currentSchool.logo_url,
      }

      await updateSchool(currentSchool.id, schoolData)
      setIsEditDialogOpen(false)
    } catch {
      // Erro já tratado pelo store
    }
  }

  const handleDelete = async () => {
    if (!currentSchool) return

    try {
      await deleteSchool(currentSchool.id)
      navigate('/escolas')
    } catch {
      // Erro já tratado pelo store
    }
  }

  // Loading state
  if (loading && !currentSchool) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Not found state
  if (!currentSchool) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Escola nao encontrada</h2>
        <Button onClick={() => navigate('/escolas')}>Voltar para Lista</Button>
      </div>
    )
  }

  const school = currentSchool
  const isActive = !school.deleted_at

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
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
            {school.trade_name || school.name}
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Ativa' : 'Inativa'}
            </Badge>
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <SchoolIcon className="h-4 w-4" /> Codigo INEP: {school.inep_code || 'Nao informado'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} disabled={loading}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={loading}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="info">
            <Info className="mr-2 h-4 w-4" />
            Informacoes Gerais
          </TabsTrigger>
          <TabsTrigger value="courses">
            <GraduationCap className="mr-2 h-4 w-4" />
            Ano Letivo e Cursos
          </TabsTrigger>
          <TabsTrigger value="classes">
            <Building className="mr-2 h-4 w-4" />
            Turmas
          </TabsTrigger>
        </TabsList>

        {/* Aba: Informacoes Gerais */}
        <TabsContent value="info" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Dados Cadastrais */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Dados Cadastrais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Endereco</p>
                      <p className="text-muted-foreground">{school.address || 'Nao informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Telefone</p>
                      <p className="text-muted-foreground">{school.phone || 'Nao informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">E-mail</p>
                      <p className="text-muted-foreground">{school.email || 'Nao informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">CNPJ</p>
                      <p className="text-muted-foreground">{school.cnpj || 'Nao informado'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logo da Escola */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video rounded-md overflow-hidden bg-muted">
                  <img
                    src={school.logo_url || `https://img.usecurling.com/p/400/300?q=school%20building&dpr=2`}
                    alt="Escola"
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Estatisticas */}
            <Card className="col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Estatisticas da Escola
                </CardTitle>
                <CardDescription>
                  Informacoes sobre alunos, professores e turmas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total de Alunos
                    </span>
                    <p className="font-semibold text-2xl">
                      {school.stats?.totalStudents || students.length || 0}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Accessibility className="h-4 w-4 text-cyan-500" />
                      Alunos PCD
                    </span>
                    <p className="font-semibold text-2xl text-cyan-600">
                      {school.stats?.totalStudentsPCD || 0}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total de Professores
                    </span>
                    <p className="font-semibold text-2xl">
                      {school.stats?.totalTeachers || teachers.length || 0}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total de Turmas
                    </span>
                    <p className="font-semibold text-2xl">
                      {school.stats?.totalClasses || classes.length || 0}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Capacidade
                    </span>
                    <p className="font-semibold text-2xl">
                      {school.student_capacity || 'Ilimitada'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Infraestrutura */}
            {infrastructure.length > 0 && (
              <Card className="col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Infraestrutura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {infrastructure.map((item: Record<string, unknown>) => (
                      <Badge key={item.id as number} variant="outline">
                        {item.type as string}: {item.quantity as number}
                        {item.capacity && ` (cap. ${item.capacity})`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Aba: Ano Letivo e Cursos */}
        <TabsContent value="courses" className="mt-4">
          <SchoolYearCoursesConfig
            schoolId={school.id}
            schoolName={school.trade_name || school.name || ''}
          />
        </TabsContent>

        {/* Aba: Turmas */}
        <TabsContent value="classes" className="mt-4 space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtrar Turmas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Filtro por ano letivo */}
                <div>
                  <Label htmlFor="class-year" className="text-xs text-muted-foreground mb-1.5 block">
                    Ano Letivo
                  </Label>
                  <select
                    id="class-year"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedYearId?.toString() || ''}
                    onChange={(e) => setSelectedYearId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Selecione o ano</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id.toString()}>
                        {year.year} {year.is_current ? '(Atual)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por curso */}
                <div>
                  <Label htmlFor="class-course" className="text-xs text-muted-foreground mb-1.5 block">
                    Curso
                  </Label>
                  <select
                    id="class-course"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    disabled={!selectedYearId}
                  >
                    <option value="">Todos os cursos</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id.toString()}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por série */}
                <div>
                  <Label htmlFor="class-grade" className="text-xs text-muted-foreground mb-1.5 block">
                    Série
                  </Label>
                  <select
                    id="class-grade"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedGradeId}
                    onChange={(e) => setSelectedGradeId(e.target.value)}
                    disabled={!selectedYearId}
                  >
                    <option value="">Todas as séries</option>
                    {availableGrades.map((grade) => (
                      <option key={grade.id} value={grade.id.toString()}>
                        {grade.grade_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por turno */}
                <div>
                  <Label htmlFor="class-shift" className="text-xs text-muted-foreground mb-1.5 block">
                    Turno
                  </Label>
                  <select
                    id="class-shift"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    disabled={!selectedYearId}
                  >
                    <option value="">Todos os turnos</option>
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <Filter className="mr-2 h-4 w-4" />
                    Limpar Filtros
                  </Button>
                )}
                {hasActiveFilters && (
                  <span className="text-xs text-muted-foreground">
                    Filtros aplicados automaticamente
                  </span>
                )}
                <div className="flex-1" />
                {canCreate && (
                  <Button onClick={() => { setEditingClass(null); setShowClassFormDialog(true) }} disabled={!selectedYearId}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Turma
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredClasses.length} turma(s) encontrada(s)
              {selectedYearId && academicYears.find(y => y.id === selectedYearId) &&
                ` em ${academicYears.find(y => y.id === selectedYearId)?.year}`}
              {hasActiveFilters && ' (com filtros aplicados)'}
            </span>
            <span>
              Total no ano: {allClasses.length} turma(s)
            </span>
          </div>

          {/* Lista de turmas em formato de tabela */}
          <Card>
            <CardContent className="p-0">
              {loadingClasses ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  ))}
                </div>
              ) : !selectedYearId ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um ano letivo para visualizar as turmas.</p>
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {hasActiveFilters ? (
                    <>
                      <p>Nenhuma turma encontrada com os filtros aplicados.</p>
                      <p className="text-sm mt-2">
                        Tente ajustar os filtros ou clique em "Limpar Filtros".
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Nenhuma turma cadastrada para este ano letivo.</p>
                      <p className="text-sm mt-2">
                        Configure os cursos oferecidos na aba "Ano Letivo e Cursos" e depois crie as turmas.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[80px]">Sigla</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Curso / Série</TableHead>
                      <TableHead className="w-[100px]">Turno</TableHead>
                      <TableHead className="w-[150px]">Ocupação</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((classItem) => (
                      <TableRow
                        key={classItem.id}
                        className="cursor-pointer hover:bg-primary/5 transition-colors group"
                        onClick={() => handleViewClass(classItem)}
                      >
                        <TableCell className="font-mono text-sm">
                          {classItem.code ? (
                            <Badge variant="secondary" className="font-mono">
                              {classItem.code}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{classItem.name}</div>
                            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                              {classItem.course?.education_level}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{classItem.course?.name}</div>
                            {classItem.education_grade && (
                              <div className="text-xs text-muted-foreground">
                                {classItem.education_grade.grade_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            <Clock className="h-3 w-3 mr-1" />
                            {classItem.shift}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {classItem.stats?.totalStudents || 0} / {classItem.capacity}
                              </span>
                              <span className="font-medium">
                                {classItem.stats?.occupancyRate || 0}%
                              </span>
                            </div>
                            <Progress
                              value={classItem.stats?.occupancyRate || 0}
                              className="h-1.5"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canView && (
                                <DropdownMenuItem onClick={() => handleViewClass(classItem)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                              )}
                              {canEdit && (
                                <DropdownMenuItem onClick={() => handleEditClass(classItem)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  {(classItem.stats?.totalStudents || 0) > 0 ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="relative flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground opacity-50">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Excluir
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Não é possível excluir turmas com alunos matriculados.</p>
                                        <p className="text-xs text-muted-foreground">Transfira os alunos primeiro.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setClassToDelete(classItem)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edicao */}
      <SchoolFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        initialData={currentSchool}
      />

      {/* Dialog de Exclusao */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Escola</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao removera a escola do sistema. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={loading}
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Detalhes da Turma */}
      {selectedClassId && (
        <ClassDetailsDialog
          classId={selectedClassId}
          onClose={() => setSelectedClassId(null)}
          onUpdated={handleClassCreated}
          onEdit={() => {
            // Encontrar a turma para edição
            const classToEdit = allClasses.find(c => c.id === selectedClassId)
            if (classToEdit && canEdit) {
              setEditingClass(classToEdit)
              setSelectedClassId(null)
              setShowClassFormDialog(true)
            }
          }}
        />
      )}

      {/* Dialog de Nova/Editar Turma (Unificado com campos do Censo) */}
      {selectedYearId && (
        <ClassFormDialogUnified
          open={showClassFormDialog}
          onOpenChange={(open) => {
            setShowClassFormDialog(open)
            if (!open) setEditingClass(null)
          }}
          onSuccess={handleClassCreated}
          schoolId={school.id}
          academicYearId={selectedYearId}
          editingClass={editingClass ? {
            id: editingClass.id,
            name: editingClass.name,
            code: editingClass.code,
            shift: editingClass.shift,
            capacity: editingClass.capacity,
            course_id: editingClass.course?.id,
            education_grade_id: editingClass.education_grade?.id,
            academic_period_id: editingClass.academic_period?.id,
            // Campos do Censo Escolar
            is_multi_grade: editingClass.is_multi_grade,
            education_modality: editingClass.education_modality,
            tipo_regime: editingClass.tipo_regime,
            operating_hours: editingClass.operating_hours,
            min_students: editingClass.min_students,
            max_dependency_subjects: editingClass.max_dependency_subjects,
            operating_days: editingClass.operating_days,
            // Professores
            homeroom_teacher_id: editingClass.homeroom_teacher_id,
            assistant_teacher_id: editingClass.assistant_teacher_id,
            regent_teacher_id: editingClass.regent_teacher_id
          } : undefined}
        />
      )}

      {/* Dialog de Confirmação de Exclusão de Turma */}
      <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a turma <strong>{classToDelete?.name}</strong>?
              {classToDelete?.stats?.totalStudents && classToDelete.stats.totalStudents > 0 && (
                <span className="block mt-2 text-amber-600">
                  Atenção: Esta turma possui {classToDelete.stats.totalStudents} aluno(s) matriculado(s).
                </span>
              )}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClass}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Turma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
