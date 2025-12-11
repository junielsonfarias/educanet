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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Line,
  LineChart,
  ResponsiveContainer,
} from 'recharts'
import {
  School,
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

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
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Dashboard
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Última atualização: Hoje, 10:45
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Alunos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,500</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Escolas Ativas
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Todas em funcionamento
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turmas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">
              5 turmas com vagas abertas
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Aprovação
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% desde o último ano
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentData}>
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
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
                  layout="vertical"
                  margin={{ left: 20 }}
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
              </ResponsiveContainer>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
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
      </div>
    </div>
  )
}
