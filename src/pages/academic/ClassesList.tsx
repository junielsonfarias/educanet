import { useState, useMemo } from 'react'
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
import useStudentStore from '@/stores/useStudentStore'
import useAssessmentStore from '@/stores/useAssessmentStore'
import useAttendanceStore from '@/stores/useAttendanceStore'
import useOccurrenceStore from '@/stores/useOccurrenceStore'
import useTeacherStore from '@/stores/useTeacherStore'
import { ClassroomDialog } from '@/pages/schools/components/ClassroomDialog'
import { useToast } from '@/hooks/use-toast'
import {
  getClassroomDataStats,
  cleanupClassroomData,
} from '@/lib/cleanup-utils'

export default function ClassesList() {
  const { schools, addClassroom, updateClassroom, deleteClassroom } =
    useSchoolStore()
  const { etapasEnsino } = useCourseStore()
  const { currentUser } = useUserStore()
  const { students, updateStudent } = useStudentStore()
  const { assessments, removeAssessment } = useAssessmentStore()
  const { attendanceRecords, removeAttendanceRecord } = useAttendanceStore()
  const { occurrences, removeOccurrence } = useOccurrenceStore()
  const { teachers, updateTeacher } = useTeacherStore()
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

  // Flatten all classes (suporta tanto 'turmas' quanto 'classes' para compatibilidade)
  const allClasses = (schools || []).flatMap((school) => {
    if (!school || !Array.isArray(school.academicYears)) return []
    return school.academicYears.flatMap((year) => {
      const turmas = year.turmas || year.classes || []
      if (!year || !Array.isArray(turmas)) return []
      return turmas.map((cls) => ({
        ...cls,
        schoolName: school.name,
        schoolId: school.id,
        yearName: year.name,
        yearId: year.id,
      }))
    })
  })

  // Unique lists for filters (filtrar valores undefined/null e garantir strings)
  // Memoizado para evitar recriações desnecessárias que podem causar problemas no Select
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
    const matchesSearch = cls.name
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
      // Obter estatísticas antes de deletar
      const stats = getClassroomDataStats(
        deleteData.classId,
        deleteData.schoolId,
        deleteData.yearId,
        {
          students,
          assessments,
          attendanceRecords,
          occurrences,
          teachers,
        },
      )

      // Mostrar aviso se houver dados relacionados
      if (
        stats.studentCount > 0 ||
        stats.assessmentCount > 0 ||
        stats.attendanceRecordCount > 0 ||
        stats.occurrenceCount > 0 ||
        stats.teacherAllocationCount > 0
      ) {
        const message = [
          stats.studentCount > 0 && `${stats.studentCount} aluno(s)`,
          stats.assessmentCount > 0 && `${stats.assessmentCount} avaliação(ões)`,
          stats.attendanceRecordCount > 0 &&
            `${stats.attendanceRecordCount} registro(s) de frequência`,
          stats.occurrenceCount > 0 && `${stats.occurrenceCount} ocorrência(s)`,
          stats.teacherAllocationCount > 0 &&
            `${stats.teacherAllocationCount} alocação(ões) de professor`,
        ]
          .filter(Boolean)
          .join(', ')

        toast({
          title: 'Atenção',
          description: `Esta turma possui dados relacionados: ${message}. Eles serão atualizados ou removidos.`,
          variant: 'default',
        })
      }

      // Executar limpeza de dados relacionados
      const cleanupResult = cleanupClassroomData(
        deleteData.classId,
        deleteData.schoolId,
        deleteData.yearId,
        {
          students,
          assessments,
          attendanceRecords,
          occurrences,
          teachers,
          removeEnrollments: false, // Atualizar status em vez de remover
        },
      )

      // Remover dados relacionados dos stores

      // 1. Atualizar status de matrículas
      students.forEach((student) => {
        const enrollmentsToUpdate = student.enrollments.filter(
          (e) =>
            e.classroomId === deleteData.classId ||
            (e.schoolId === deleteData.schoolId &&
              e.academicYearId === deleteData.yearId &&
              !e.classroomId),
        )
        if (enrollmentsToUpdate.length > 0) {
          enrollmentsToUpdate.forEach((enrollment) => {
            enrollment.status = 'Transferido'
          })
          updateStudent(student.id, { enrollments: student.enrollments })
        }
      })

      // 2. Remover assessments
      assessments
        .filter((a) => a.classroomId === deleteData.classId)
        .forEach((a) => {
          removeAssessment(a.id)
        })

      // 3. Remover attendance records
      attendanceRecords
        .filter((r) => r.classroomId === deleteData.classId)
        .forEach((r) => {
          removeAttRecord(r.id)
        })

      // 4. Remover occurrences
      occurrences
        .filter((o) => o.classroomId === deleteData.classId)
        .forEach((o) => {
          removeOcc(o.id)
        })

      // 5. Remover teacher allocations
      teachers.forEach((teacher) => {
        const allocationsToRemove = teacher.allocations.filter(
          (a) =>
            a.classroomId === deleteData.classId &&
            a.schoolId === deleteData.schoolId &&
            a.academicYearId === deleteData.yearId,
        )
        if (allocationsToRemove.length > 0) {
          updateTeacher(teacher.id, {
            allocations: teacher.allocations.filter(
              (a) => !allocationsToRemove.some((ar) => ar.id === a.id),
            ),
          })
        }
      })

      // Deletar a turma
      deleteClassroom(
        deleteData.schoolId,
        deleteData.yearId,
        deleteData.classId,
      )

      toast({
        title: 'Turma Removida',
        description: `A turma foi excluída. ${cleanupResult.enrollmentsUpdated} matrícula(s) atualizada(s), ${cleanupResult.assessmentsRemoved} avaliação(ões) removida(s), ${cleanupResult.attendanceRecordsRemoved} registro(s) de frequência removido(s), ${cleanupResult.occurrencesRemoved} ocorrência(s) removida(s).`,
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
              className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-white border-purple-200/50 hover:border-purple-400 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]"
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
                    <span className="font-medium">{cls.studentCount || 0} Alunos</span>
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
        etapasEnsino={etapasEnsino}
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
              {deleteData && (
                <>
                  Tem certeza que deseja excluir esta turma? Esta ação não pode
                  ser desfeita.
                  {(() => {
                    const stats = getClassroomDataStats(
                      deleteData.classId,
                      deleteData.schoolId,
                      deleteData.yearId,
                      {
                        students,
                        assessments,
                        attendanceRecords,
                        occurrences,
                        teachers,
                      },
                    )
                    const hasData =
                      stats.studentCount > 0 ||
                      stats.assessmentCount > 0 ||
                      stats.attendanceRecordCount > 0 ||
                      stats.occurrenceCount > 0 ||
                      stats.teacherAllocationCount > 0

                    if (hasData) {
                      return (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm font-semibold text-yellow-800 mb-1">
                            Dados relacionados que serão afetados:
                          </p>
                          <ul className="text-xs text-yellow-700 space-y-1">
                            {stats.studentCount > 0 && (
                              <li>• {stats.studentCount} aluno(s)</li>
                            )}
                            {stats.assessmentCount > 0 && (
                              <li>• {stats.assessmentCount} avaliação(ões)</li>
                            )}
                            {stats.attendanceRecordCount > 0 && (
                              <li>
                                • {stats.attendanceRecordCount} registro(s) de
                                frequência
                              </li>
                            )}
                            {stats.occurrenceCount > 0 && (
                              <li>• {stats.occurrenceCount} ocorrência(s)</li>
                            )}
                            {stats.teacherAllocationCount > 0 && (
                              <li>
                                • {stats.teacherAllocationCount} alocação(ões) de
                                professor
                              </li>
                            )}
                          </ul>
                        </div>
                      )
                    }
                    return null
                  })()}
                </>
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
