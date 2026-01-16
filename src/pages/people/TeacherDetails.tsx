import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
  Edit,
  Trash2,
  Calendar,
  Plus,
  Briefcase,
  GraduationCap,
  FileText,
  Loader2,
  Award,
  Users,
  School,
  Filter,
  Pencil,
  Clock,
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTeacherStore } from '@/stores/useTeacherStore.supabase'
import { useState, useEffect, useMemo } from 'react'
import { TeacherFormDialog } from './components/TeacherFormDialog'
import { TeacherAssignmentEditDialog } from './components/TeacherAssignmentEditDialog'
import { supabase } from '@/lib/supabase/client'
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
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function TeacherDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { 
    currentTeacher,
    loading,
    fetchTeacherById, 
    updateTeacher, 
    deleteTeacher,
    fetchTeacherClasses,
    fetchTeacherSubjects,
    fetchCertifications,
    assignToClass,
  } = useTeacherStore()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Record<string, unknown> | null>(null)
  const [assignments, setAssignments] = useState<Record<string, unknown>[]>([])
  const [certifications, setCertifications] = useState<Record<string, unknown>[]>([])
  const [academicYears, setAcademicYears] = useState<{ id: number; year: number }[]>([])
  const [selectedYearId, setSelectedYearId] = useState<string>('all')

  // Carregar anos letivos
  useEffect(() => {
    const loadAcademicYears = async () => {
      const { data } = await supabase
        .from('academic_years')
        .select('id, year')
        .is('deleted_at', null)
        .order('year', { ascending: false })

      if (data) {
        setAcademicYears(data)
      }
    }
    loadAcademicYears()
  }, [])

  // Carregar dados do professor ao montar
  useEffect(() => {
    if (id) {
      fetchTeacherById(parseInt(id))
      loadAdditionalData()
    }
  }, [id])

  const loadAdditionalData = async () => {
    if (!id) return

    const teacherId = parseInt(id)
    const [assignmentsData, certificationsData] = await Promise.all([
      fetchTeacherClasses(teacherId),
      fetchCertifications(teacherId),
    ])

    setAssignments(assignmentsData)
    setCertifications(certificationsData)
  }

  // Agrupar vinculações por ano letivo, escola, disciplina e turma
  const groupedAssignments = useMemo(() => {
    const filtered = selectedYearId === 'all'
      ? assignments
      : assignments.filter((item: any) => {
          const yearId = item.class?.academic_period?.academic_year?.id
          return yearId === parseInt(selectedYearId)
        })

    // Agrupar por ano letivo
    const byYear = new Map<number, {
      year: number;
      yearId: number;
      schools: Map<number, {
        schoolId: number;
        schoolName: string;
        subjects: Map<number, {
          subjectId: number;
          subjectName: string;
          classes: {
            id: number;
            name: string;
            code?: string;
            shift?: string;
            assignmentId: number;
            workloadHours?: number;
          }[];
        }>;
      }>;
    }>()

    filtered.forEach((item: any) => {
      const yearData = item.class?.academic_period?.academic_year
      const schoolData = item.class?.school
      const subjectData = item.subject
      const classData = item.class

      if (!yearData || !schoolData || !subjectData || !classData) return

      const yearId = yearData.id
      const year = yearData.year

      if (!byYear.has(yearId)) {
        byYear.set(yearId, {
          year,
          yearId,
          schools: new Map()
        })
      }

      const yearEntry = byYear.get(yearId)!
      const schoolId = schoolData.id

      if (!yearEntry.schools.has(schoolId)) {
        yearEntry.schools.set(schoolId, {
          schoolId,
          schoolName: schoolData.name,
          subjects: new Map()
        })
      }

      const schoolEntry = yearEntry.schools.get(schoolId)!
      const subjectId = subjectData.id

      if (!schoolEntry.subjects.has(subjectId)) {
        schoolEntry.subjects.set(subjectId, {
          subjectId,
          subjectName: subjectData.name,
          classes: []
        })
      }

      const subjectEntry = schoolEntry.subjects.get(subjectId)!

      // Evitar turmas duplicadas
      if (!subjectEntry.classes.some(c => c.id === classData.id)) {
        subjectEntry.classes.push({
          id: classData.id,
          name: classData.name,
          code: classData.code,
          shift: classData.shift,
          assignmentId: item.id,
          workloadHours: item.workload_hours
        })
      }
    })

    // Converter para array e ordenar
    return Array.from(byYear.values())
      .sort((a, b) => b.year - a.year)
      .map(yearEntry => ({
        ...yearEntry,
        schools: Array.from(yearEntry.schools.values()).map(schoolEntry => ({
          ...schoolEntry,
          subjects: Array.from(schoolEntry.subjects.values())
        }))
      }))
  }, [assignments, selectedYearId])

  // Função auxiliar para encontrar a vinculação original pelo ID
  const findAssignmentById = (assignmentId: number) => {
    return assignments.find((a: any) => a.id === assignmentId)
  }

  // Handler para abrir o modal de edição de vinculação
  const handleEditAssignment = (assignmentId: number) => {
    const assignment = findAssignmentById(assignmentId)
    if (assignment) {
      setSelectedAssignment(assignment)
      setAssignmentDialogOpen(true)
    }
  }

  // Calcular disciplinas únicas
  const uniqueSubjects = useMemo(() => {
    const subjectsMap = new Map<number, { id: number; name: string }>()
    assignments.forEach((item: any) => {
      if (item.subject && !subjectsMap.has(item.subject.id)) {
        subjectsMap.set(item.subject.id, item.subject)
      }
    })
    return Array.from(subjectsMap.values())
  }, [assignments])

  // Calcular escolas únicas
  const uniqueSchools = useMemo(() => {
    const schoolsMap = new Map<number, { id: number; name: string }>()
    assignments.forEach((item: any) => {
      if (item.class?.school && !schoolsMap.has(item.class.school.id)) {
        schoolsMap.set(item.class.school.id, item.class.school)
      }
    })
    return Array.from(schoolsMap.values())
  }, [assignments])

  // Verificar se professor tem vínculos ativos
  const hasActiveAssignments = assignments.length > 0

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!currentTeacher) return
    
    try {
      // Separar dados de person e teacher
      const personData = {
        first_name: data.firstName || currentTeacher.person.first_name,
        last_name: data.lastName || currentTeacher.person.last_name,
        email: data.email || currentTeacher.person.email,
        phone: data.phone || currentTeacher.person.phone,
        cpf: data.cpf || currentTeacher.person.cpf,
      }

      const teacherData = {
        school_id: data.schoolId || currentTeacher.school_id,
        employment_status: data.employmentStatus || currentTeacher.employment_status,
        hire_date: data.hireDate || currentTeacher.hire_date,
      }

      await updateTeacher(currentTeacher.id, personData, teacherData)
      setIsEditDialogOpen(false)
    } catch (error) {
      // Erro já tratado pelo store
    }
  }

  const handleDelete = async () => {
    if (!currentTeacher) return
    
    try {
      await deleteTeacher(currentTeacher.id)
      navigate('/pessoas/professores')
    } catch (error) {
      // Erro já tratado pelo store
    }
  }

  // Loading state
  if (loading && !currentTeacher) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="col-span-1">
            <CardContent className="pt-6 flex flex-col items-center">
              <Skeleton className="h-32 w-32 rounded-full mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Not found state
  if (!currentTeacher) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Professor não encontrado</h2>
        <Button onClick={() => navigate('/pessoas/professores')}>
          Voltar para Lista
        </Button>
      </div>
    )
  }

  // Extract data safely
  const teacher = currentTeacher
  const person = teacher.person
  const fullName = `${person.first_name} ${person.last_name}`.trim()
  const initials = `${person.first_name?.[0] || ''}${person.last_name?.[0] || ''}`.toUpperCase()
  const isActive = hasActiveAssignments
  const hireDate = teacher.hire_date
    ? format(new Date(teacher.hire_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Não informada'

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
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={loading}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 h-fit">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 mb-4 border-4 border-primary/10">
              <AvatarImage
                src={person.avatar_url || `https://img.usecurling.com/ppl/medium?gender=male&seed=${teacher.id}`}
              />
              <AvatarFallback className="text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{fullName}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {uniqueSchools.length > 0
                ? uniqueSchools.map(s => s.name).join(', ')
                : 'Sem escola vinculada'}
            </p>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className="mt-2"
            >
              {isActive ? 'Ativo' : 'Sem vínculo'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
            <CardDescription>
              Dados completos e vínculo empregatício.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" /> E-mail
                </span>
                <p className="font-medium">{person.email || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Telefone
                </span>
                <p className="font-medium">{person.phone || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> CPF
                </span>
                <p className="font-medium">{person.cpf || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Data de Admissão
                </span>
                <p className="font-medium">{hireDate}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <School className="h-4 w-4" /> Escolas Vinculadas
                </span>
                <p className="font-medium">
                  {uniqueSchools.length > 0
                    ? uniqueSchools.map(s => s.name).join(', ')
                    : 'Nenhuma'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Status
                </span>
                <p className="font-medium">{isActive ? 'Ativo' : 'Sem vínculo'}</p>
              </div>
            </div>

            <Separator />

            {/* Disciplinas (resumo) */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Disciplinas ({uniqueSubjects.length})
              </h4>
              {uniqueSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma disciplina atribuída
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {uniqueSubjects.map((subject) => (
                    <Badge key={subject.id} variant="outline">
                      {subject.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Vinculações por Ano Letivo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Vinculações por Ano Letivo
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAssignment(null)
                      setAssignmentDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Vinculação
                  </Button>
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por ano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os anos</SelectItem>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={String(year.id)}>
                          {year.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {groupedAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">
                  {selectedYearId === 'all'
                    ? 'Nenhuma vinculação encontrada'
                    : 'Nenhuma vinculação encontrada para o ano selecionado'}
                </p>
              ) : (
                <div className="space-y-6">
                  {groupedAssignments.map((yearEntry) => (
                    <div key={yearEntry.yearId} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-sm px-3 py-1">
                          {yearEntry.year}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({yearEntry.schools.length} escola{yearEntry.schools.length !== 1 ? 's' : ''})
                        </span>
                      </div>

                      <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                        {yearEntry.schools.map((schoolEntry) => (
                          <div key={schoolEntry.schoolId} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <School className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{schoolEntry.schoolName}</span>
                            </div>

                            <div className="pl-6 space-y-2">
                              {schoolEntry.subjects.map((subjectEntry) => (
                                <div key={subjectEntry.subjectId} className="p-3 rounded-md bg-muted/50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-primary">{subjectEntry.subjectName}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {subjectEntry.classes.map((cls) => (
                                      <div
                                        key={cls.id}
                                        className="group flex items-center gap-1 bg-background border rounded-md px-2 py-1 hover:border-primary transition-colors"
                                      >
                                        <span className="text-xs font-medium">
                                          {cls.name}
                                          {cls.code && <span className="ml-1 opacity-70">({cls.code})</span>}
                                        </span>
                                        {cls.shift && (
                                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                            {cls.shift}
                                          </Badge>
                                        )}
                                        {cls.workloadHours && (
                                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {cls.workloadHours}h
                                          </span>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => handleEditAssignment(cls.assignmentId)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Certificações */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Award className="h-4 w-4" /> Certificações ({certifications.length})
              </h4>
              {certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma certificação registrada
                </p>
              ) : (
                <div className="grid gap-2">
                  {certifications.map((cert: any) => (
                    <div
                      key={cert.id}
                      className="p-3 border rounded-md bg-secondary/20"
                    >
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cert.institution} - {cert.year || 'Ano não informado'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TeacherFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        initialData={currentTeacher}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Professor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o professor do quadro de funcionários. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {currentTeacher && (
        <TeacherAssignmentEditDialog
          open={assignmentDialogOpen}
          onOpenChange={setAssignmentDialogOpen}
          assignment={selectedAssignment as any}
          teacherId={currentTeacher.id}
          teacherName={fullName}
          onSuccess={loadAdditionalData}
        />
      )}
    </div>
  )
}
