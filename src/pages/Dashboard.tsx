import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Line,
  LineChart,
} from 'recharts'
import {
  School,
  Users,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Layout,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useMemo } from 'react'
import { DashboardCustomizer } from './dashboard/components/DashboardCustomizer'
import { useSettingsStore } from '@/stores/useSettingsStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { Skeleton } from '@/components/ui/skeleton'

// Mock Data - será substituído por dados reais
const enrollmentData = [
  { month: 'Jan', alunos: 120 },
  { month: 'Fev', alunos: 1350 },
  { month: 'Mar', alunos: 1420 },
  { month: 'Abr', alunos: 1450 },
  { month: 'Mai', alunos: 1480 },
  { month: 'Jun', alunos: 1500 },
]

const performanceData = [
  { subject: 'Matemática', media: 7.5 },
  { subject: 'Português', media: 8.2 },
  { subject: 'História', media: 7.8 },
  { subject: 'Geografia', media: 8.0 },
  { subject: 'Ciências', media: 7.2 },
]

export default function Dashboard() {
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const { activeLayout } = useSettingsStore()
  
  // Garantir que activeLayout sempre tenha widgets
  const safeLayout = activeLayout || { widgets: [] }
  
  // Supabase stores - com valores padrão para evitar undefined
  const { students = [], fetchStudents, loading: studentsLoading = false } = useStudentStore()
  const { schools = [], fetchSchools, loading: schoolsLoading = false } = useSchoolStore()
  const { fetchStats: fetchCourseStats } = useCourseStore()
  
  // Stats state
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSchools: 0,
    totalClasses: 0,
    approvalRate: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  // Buscar dados na inicialização
  useEffect(() => {
    let isMounted = true
    
    const loadDashboardData = async () => {
      try {
        setLoadingStats(true)
        
        // Buscar dados em paralelo
        await Promise.all([
          fetchStudents(),
          fetchSchools(),
        ])
        
        // Buscar estatísticas de cursos
        const courseStats = await fetchCourseStats()
        
        if (isMounted) {
          setLoadingStats(false)
        }
      } catch {
        if (isMounted) {
          setLoadingStats(false)
        }
      }
    }
    
    loadDashboardData()
    
    return () => {
      isMounted = false
    }
  }, [fetchStudents, fetchSchools, fetchCourseStats])
  
  // Atualizar stats quando os dados mudarem
  useEffect(() => {
    // Só atualizar quando não estiver carregando
    if (studentsLoading || schoolsLoading || loadingStats) {
      return
    }
    
    // Garantir que são arrays válidos
    const safeStudents = Array.isArray(students) ? students : []
    const safeSchools = Array.isArray(schools) ? schools : []
    
    setStats({
      totalStudents: safeStudents.length,
      totalSchools: safeSchools.filter((s) => s?.deleted_at === null).length,
      totalClasses: 0, // será atualizado com courseStats
      approvalRate: 94.2, // cálculo real será implementado
    })
  }, [students, schools, studentsLoading, schoolsLoading, loadingStats])

  // Memoizar widgets para evitar recálculos desnecessários
  const widgets = useMemo(() => {
    return Array.isArray(safeLayout?.widgets) ? safeLayout.widgets : []
  }, [safeLayout])

  // Função de saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Formatar data atual
  const formatDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Helper to get widget by key
  const getWidget = useMemo(() => {
    return (key: string) => {
      if (!key || !Array.isArray(widgets)) return null
      return widgets.find((w) => w?.dataKey === key)
    }
  }, [widgets])

  const renderWidget = (key: string) => {
    const w = getWidget(key)
    if (!w || !w.visible) return null

    switch (key) {
      case 'totalStudents':
        return (
          <Card className="relative overflow-hidden bg-gradient-to-br from-card via-blue-500/5 to-card dark:from-card dark:via-blue-500/10 dark:to-card border-blue-200/50 dark:border-blue-500/20 hover:border-blue-400 dark:hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/30 dark:from-blue-500/30 dark:to-blue-600/40 shadow-lg shadow-blue-500/20">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {loadingStats ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalStudents.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alunos matriculados ativos
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )
      case 'activeSchools':
        return (
          <Card className="relative overflow-hidden bg-gradient-to-br from-card via-primary/5 to-card dark:from-card dark:via-primary/10 dark:to-card border-primary/20 dark:border-primary/30 hover:border-primary/40 dark:hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Escolas Ativas</CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 dark:from-primary/30 dark:to-primary/40 shadow-lg shadow-primary/20">
                <School className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {loadingStats ? (
                <>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">{stats.totalSchools}</div>
                  <p className="text-xs text-muted-foreground">
                    {schools.length} escolas cadastradas
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )
      case 'totalClasses':
        return (
          <Card className="relative overflow-hidden bg-gradient-to-br from-card via-purple-500/5 to-card dark:from-card dark:via-purple-500/10 dark:to-card border-purple-200/50 dark:border-purple-500/20 hover:border-purple-400 dark:hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Turmas</CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/30 dark:from-purple-500/30 dark:to-purple-600/40 shadow-lg shadow-purple-500/20">
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">48</div>
              <p className="text-xs text-muted-foreground">
                5 turmas com vagas abertas
              </p>
            </CardContent>
          </Card>
        )
      case 'approvalRate':
        return (
          <Card className="relative overflow-hidden bg-gradient-to-br from-card via-green-500/5 to-card dark:from-card dark:via-green-500/10 dark:to-card border-green-200/50 dark:border-green-500/20 hover:border-green-400 dark:hover:border-green-500/40 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 group h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/30 dark:from-green-500/30 dark:to-green-600/40 shadow-lg shadow-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">94.2%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% desde o último ano
              </p>
            </CardContent>
          </Card>
        )
      case 'enrollmentGrowth':
        return (
          <Card className="col-span-1 md:col-span-2 h-full">
            <CardHeader>
              <CardTitle>Evolução das Matrículas</CardTitle>
              <CardDescription>
                Crescimento do número de alunos no primeiro semestre
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer
                config={{
                  alunos: { label: 'Alunos', color: 'hsl(var(--primary))' },
                }}
                className="h-[300px] w-full"
              >
                <LineChart data={enrollmentData} width={391} height={300}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="alunos"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    stroke="var(--color-alunos)"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )
      case 'subjectAverage':
        return (
          <Card className="col-span-1 md:col-span-2 h-full">
            <CardHeader>
              <CardTitle>Média por Disciplina</CardTitle>
              <CardDescription>Desempenho geral da rede</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  media: { label: 'Média', color: 'hsl(var(--chart-2))' },
                }}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={performanceData}
                  layout="vertical"
                  margin={{ left: 20 }}
                  width={375}
                  height={300}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="media"
                    fill="var(--color-media)"
                    radius={[0, 4, 4, 0]}
                    barSize={32}
                  />
                  <XAxis
                    type="category"
                    dataKey="subject"
                    tickLine={false}
                    axisLine={false}
                    hide
                  />
                </BarChart>
              </ChartContainer>
              <div className="mt-4 space-y-2">
                {performanceData.map((item) => (
                  <div
                    key={item.subject}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{item.subject}</span>
                    <span className="text-muted-foreground">
                      {item.media.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      case 'attentionList':
        return (
          <Card className="col-span-full md:col-span-2 lg:col-span-3 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertCircle className="h-5 w-5" />
                Atenção Necessária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-orange-800 dark:text-orange-300">
                <li>3 Escolas com infraestrutura pendente</li>
                <li>15 Alunos com baixa frequência</li>
                <li>2 Turmas sem professor de Inglês</li>
              </ul>
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header com saudação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {getGreeting()}!
            </h2>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <p className="text-sm capitalize">{formatDate()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-card border text-sm">
            <span className="text-muted-foreground">Layout:</span>
            <span className="font-medium">{activeLayout?.name || 'Padrão'}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setCustomizerOpen(true)}
            className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
          >
            <Layout className="mr-2 h-4 w-4" />
            <span>Personalizar</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.isArray(widgets) && widgets
          .filter((widget) => widget && widget.visible)
          .map((widget, index) => {
            let colSpanClass = ''
            if (widget.w === 2) colSpanClass = 'md:col-span-2'
            if (widget.w === 3) colSpanClass = 'md:col-span-2 lg:col-span-3'
            if (widget.w === 4) colSpanClass = 'col-span-full'

            const widgetContent = renderWidget(widget.dataKey)
            if (!widgetContent) return null

            return (
              <div
                key={`widget-${widget.id || widget.dataKey || Math.random()}`}
                className={`${colSpanClass} animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
              >
                {widgetContent}
              </div>
            )
          })}
      </div>

      <DashboardCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
      />
    </div>
  )
}
