import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  School as SchoolIcon,
  Calendar,
  Users,
  Plus,
  Info,
  Loader2,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { SchoolFormDialog } from './components/SchoolFormDialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  const [classes, setClasses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [infrastructure, setInfrastructure] = useState<any[]>([])

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
  }

  const handleUpdate = async (data: any) => {
    if (!currentSchool) return
    
    try {
      const schoolData: Partial<any> = {
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
    } catch (error) {
      // Erro já tratado pelo store
    }
  }

  const handleDelete = async () => {
    if (!currentSchool) return
    
    try {
      await deleteSchool(currentSchool.id)
      navigate('/escolas')
    } catch (error) {
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
        <h2 className="text-2xl font-bold">Escola não encontrada</h2>
        <Button onClick={() => navigate('/escolas')}>Voltar para Lista</Button>
      </div>
    )
  }

  const school = currentSchool
  const isActive = !school.deleted_at

  const handleAddYear = (data: any) => {
    addAcademicYear(school.id, data)
    toast({
      title: 'Ano Letivo Criado',
      description: `O ano ${data.name} foi adicionado. As turmas foram replicadas.`,
    })
  }

  const handleOpenClassDialog = (yearId: string) => {
    setSelectedYearId(yearId)
    setIsClassDialogOpen(true)
  }

  const handleAddClass = (data: any) => {
    if (selectedYearId) {
      addClassroom(school.id, selectedYearId, data)
      toast({
        title: 'Turma Criada',
        description: `Turma ${data.name} adicionada com sucesso.`,
      })
    }
  }

  const handleStatusChange = (
    yearId: string,
    status: 'pending' | 'active' | 'finished',
  ) => {
    updateAcademicYearStatus(school.id, yearId, status)
    toast({
      title: 'Status Atualizado',
      description: `O status do ano letivo foi alterado para ${status === 'active' ? 'Ativo' : status === 'finished' ? 'Finalizado' : 'Pendente'}.`,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
            <Badge
              variant={isActive ? 'default' : 'secondary'}
            >
              {isActive ? 'Ativa' : 'Inativa'}
            </Badge>
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <SchoolIcon className="h-4 w-4" /> Código INEP: {school.inep_code || 'Não informado'}
          </p>
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

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Informações Gerais</TabsTrigger>
          <TabsTrigger value="academic">Ano Letivo e Turmas</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Dados Cadastrais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Endereço</p>
                      <p className="text-muted-foreground">{school.address || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Telefone</p>
                      <p className="text-muted-foreground">{school.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">E-mail</p>
                      <p className="text-muted-foreground">{school.email || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">CNPJ</p>
                      <p className="text-muted-foreground">{school.cnpj || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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

            <Card className="col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Estatísticas da Escola
                </CardTitle>
                <CardDescription>
                  Informações sobre alunos, professores e turmas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total de Alunos
                    </span>
                    <p className="font-semibold text-2xl">
                      {school.stats?.total_students || students.length || 0}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total de Professores
                    </span>
                    <p className="font-semibold text-2xl">
                      {school.stats?.total_teachers || teachers.length || 0}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total de Turmas
                    </span>
                    <p className="font-semibold text-2xl">
                      {school.stats?.total_classes || classes.length || 0}
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
          </div>
        </TabsContent>

        <TabsContent value="academic" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Turmas da Escola</h3>
          </div>

          {classes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhuma turma cadastrada.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((classItem: any) => (
                <Card key={classItem.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{classItem.name}</CardTitle>
                    <CardDescription>
                      {classItem.academic_year?.name || 'Ano letivo não informado'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{classItem.enrolled_students || 0} alunos</span>
                      </div>
                      {classItem.max_students && (
                        <div className="text-xs text-muted-foreground">
                          Capacidade: {classItem.max_students} alunos
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <SchoolFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        initialData={currentSchool}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Escola</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a escola do sistema. Esta ação não pode ser desfeita.
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
    </div>
  )
}
