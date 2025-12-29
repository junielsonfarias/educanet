import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  School as SchoolIcon,
  Calendar,
  Users,
  Plus,
  Info,
  Building,
  Wifi,
  Accessibility,
  PlayCircle,
  StopCircle,
  CheckCircle2,
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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'
import { AcademicYearDialog } from './components/AcademicYearDialog'
import { ClassroomDialog } from './components/ClassroomDialog'
import { useToast } from '@/hooks/use-toast'

export default function SchoolDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getSchool, addAcademicYear, addClassroom, updateAcademicYearStatus } =
    useSchoolStore()
  const { etapasEnsino } = useCourseStore()
  const { toast } = useToast()

  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false)
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null)

  const school = getSchool(id || '')

  if (!school) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Escola não encontrada</h2>
        <Button onClick={() => navigate('/escolas')}>Voltar para Lista</Button>
      </div>
    )
  }

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
            {school.name}
            <Badge
              variant={school.status === 'active' ? 'default' : 'secondary'}
            >
              {school.status === 'active' ? 'Ativa' : 'Inativa'}
            </Badge>
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <SchoolIcon className="h-4 w-4" /> Código: {school.code}
          </p>
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
                      <p className="text-muted-foreground">{school.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Telefone</p>
                      <p className="text-muted-foreground">{school.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Direção</p>
                      <p className="text-muted-foreground">{school.director}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="aspect-video rounded-md overflow-hidden bg-muted">
                  <img
                    src={`https://img.usecurling.com/p/400/300?q=school%20building&dpr=2`}
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
                  Dados do Censo Escolar / INEP
                </CardTitle>
                <CardDescription>
                  Informações para relatórios oficiais e censo escolar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Código INEP
                      </span>
                      <p className="font-semibold text-lg">
                        {school.inepCode || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Dependência Adm.
                      </span>
                      <p className="font-medium">
                        {school.administrativeDependency || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Localização
                      </span>
                      <p className="font-medium">
                        {school.locationType || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">
                      Infraestrutura
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-primary" />
                        <span>
                          {school.infrastructure?.classrooms || 0} Salas de Aula
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Accessibility
                          className={`h-4 w-4 ${school.infrastructure?.accessible ? 'text-primary' : 'text-muted-foreground/40'}`}
                        />
                        <span
                          className={
                            school.infrastructure?.accessible
                              ? ''
                              : 'text-muted-foreground'
                          }
                        >
                          Acessibilidade
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wifi
                          className={`h-4 w-4 ${school.infrastructure?.internet ? 'text-primary' : 'text-muted-foreground/40'}`}
                        />
                        <span
                          className={
                            school.infrastructure?.internet
                              ? ''
                              : 'text-muted-foreground'
                          }
                        >
                          Internet
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground block">
                      Níveis de Ensino
                    </span>
                    {school.educationTypes &&
                    school.educationTypes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {school.educationTypes.map((type) => (
                          <Badge key={type} variant="secondary">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhum nível informado
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Configuração Acadêmica</h3>
            <Button onClick={() => setIsYearDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo Ano Letivo
            </Button>
          </div>

          {!school.academicYears || school.academicYears.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhum ano letivo configurado.
              </CardContent>
            </Card>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="w-full space-y-4"
              defaultValue={
                school.academicYears[school.academicYears.length - 1]?.id
              }
            >
              {[...school.academicYears].reverse().map((year) => (
                <AccordionItem
                  key={year.id}
                  value={year.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-bold text-lg">{year.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground font-normal">
                        {year.startDate.split('-').reverse().join('/')} a{' '}
                        {year.endDate.split('-').reverse().join('/')}
                      </span>
                      <div className="ml-auto flex items-center gap-2 mr-4">
                        <Badge
                          variant={
                            year.status === 'active'
                              ? 'default'
                              : year.status === 'finished'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={
                            year.status === 'active' ? 'bg-green-600' : ''
                          }
                        >
                          {year.status === 'active'
                            ? 'Ativo'
                            : year.status === 'finished'
                              ? 'Finalizado'
                              : 'Pendente'}
                        </Badge>
                        <span className="text-sm text-muted-foreground ml-2">
                          {(year.turmas || year.classes || []).length} Turmas
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="space-y-4">
                      <div className="flex justify-end mb-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Gerenciar Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(year.id, 'active')
                              }
                            >
                              <PlayCircle className="mr-2 h-4 w-4 text-green-600" />{' '}
                              Iniciar Ano Letivo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(year.id, 'finished')
                              }
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-muted-foreground" />{' '}
                              Finalizar Ano Letivo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(year.id, 'pending')
                              }
                            >
                              <StopCircle className="mr-2 h-4 w-4" /> Marcar
                              como Pendente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                          Turmas Ativas
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenClassDialog(year.id)}
                          disabled={year.status === 'finished'}
                        >
                          <Plus className="mr-2 h-3 w-3" /> Adicionar Turma
                        </Button>
                      </div>

                      {(year.turmas || year.classes || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          Nenhuma turma cadastrada.
                        </p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {(year.turmas || year.classes || []).map((classroom) => (
                            <div
                              key={classroom.id}
                              className="bg-secondary/20 p-4 rounded-md border flex flex-col gap-2"
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-lg">
                                  {classroom.name}
                                </span>
                                <Badge variant="outline">
                                  {classroom.shift}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {classroom.gradeName}
                                {classroom.isMultiGrade && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-[10px]"
                                  >
                                    Multi
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                <Users className="h-3 w-3" />
                                {classroom.studentCount || 0} Alunos
                              </div>
                              {classroom.operatingHours && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {classroom.operatingHours}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>

      <AcademicYearDialog
        open={isYearDialogOpen}
        onOpenChange={setIsYearDialogOpen}
        onSubmit={handleAddYear}
      />

      <ClassroomDialog
        open={isClassDialogOpen}
        onOpenChange={setIsClassDialogOpen}
        onSubmit={handleAddClass}
        etapasEnsino={etapasEnsino}
      />
    </div>
  )
}
