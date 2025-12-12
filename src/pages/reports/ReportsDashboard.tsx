import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FileText,
  Users,
  School,
  GraduationCap,
  BarChart,
  LineChart,
  PieChart,
  Scale,
  ArrowRightLeft,
  AlertTriangle,
  FileCheck,
  LayoutTemplate,
  TrendingUp,
} from 'lucide-react'

export default function ReportsDashboard() {
  const navigate = useNavigate()

  const internalReports = [
    {
      title: 'Relatório Personalizado',
      description: 'Crie relatórios sob medida escolhendo campos e filtros.',
      icon: LayoutTemplate,
      path: '/relatorios/custom',
      highlight: true,
    },
    {
      title: 'Análise de Desempenho Acadêmico',
      description:
        'Visão avançada de indicadores, tendências e alunos em risco.',
      icon: TrendingUp,
      path: '/relatorios/analise-academica',
      highlight: true,
    },
    {
      title: 'Relatório de Transferências',
      description: 'Listagem de alunos transferidos da rede ou entre unidades.',
      icon: ArrowRightLeft,
      path: '/relatorios/transferencias',
    },
    {
      title: 'Relatório de Evasão (Abandono)',
      description: 'Monitoramento de alunos em situação de abandono escolar.',
      icon: AlertTriangle,
      path: '/relatorios/evasao',
    },
    {
      title: 'Status de Lançamento de Notas',
      description: 'Acompanhamento do preenchimento de diários e notas.',
      icon: FileCheck,
      path: '/relatorios/status-lancamento',
    },
    {
      title: 'Relatório Individual de Performance',
      description:
        'Análise detalhada de notas, recuperações e progresso por aluno.',
      icon: BarChart,
      path: '/relatorios/individual',
    },
    {
      title: 'Relatório de Matrículas',
      description:
        'Listagem de alunos matriculados por período, escola e turma.',
      icon: Users,
      path: '/relatorios/matriculas',
    },
    {
      title: 'Desempenho Escolar (Turma)',
      description: 'Análise de notas e desempenho consolidado por turma.',
      icon: GraduationCap,
      path: '/relatorios/desempenho',
    },
    {
      title: 'Alocação de Professores',
      description: 'Quadro de distribuição de carga horária docente.',
      icon: School,
      path: '/relatorios/professores',
    },
    {
      title: 'Comparativo entre Escolas',
      description: 'Compare indicadores de desempenho de múltiplas unidades.',
      icon: Scale,
      path: '/relatorios/comparativo',
    },
  ]

  const qeduReports = [
    {
      title: 'Distorção Idade-Série',
      description: 'Indicadores de atraso escolar baseados em dados do QEdu.',
      icon: LineChart,
      path: '/relatorios/distorcao-idade-serie',
    },
    {
      title: 'Taxas de Rendimento',
      description: 'Aprovação, Reprovação e Abandono (QEdu).',
      icon: PieChart,
      path: '/relatorios/taxas-rendimento',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Relatórios Educacionais
        </h2>
        <p className="text-muted-foreground">
          Central de inteligência e dados educacionais.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-primary/80 flex items-center gap-2">
          <FileText className="h-5 w-5" /> Relatórios Internos
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {internalReports.map((report) => (
            <Card
              key={report.path}
              className={`cursor-pointer hover:border-primary/50 transition-colors hover:shadow-md ${report.highlight ? 'border-primary/40 bg-primary/5' : ''}`}
              onClick={() => navigate(report.path)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <report.icon className="h-5 w-5 text-primary" />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {report.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-primary/80 flex items-center gap-2">
          <BarChart className="h-5 w-5" /> Dados QEdu (Externos)
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {qeduReports.map((report) => (
            <Card
              key={report.path}
              className="cursor-pointer hover:border-primary/50 transition-colors hover:shadow-md bg-secondary/10"
              onClick={() => navigate(report.path)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <report.icon className="h-5 w-5 text-primary" />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {report.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
