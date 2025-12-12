import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FileText, Users, School, GraduationCap, BarChart } from 'lucide-react'

export default function ReportsDashboard() {
  const navigate = useNavigate()

  const reports = [
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
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Relatórios
        </h2>
        <p className="text-muted-foreground">
          Central de inteligência e dados educacionais.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card
            key={report.path}
            className="cursor-pointer hover:border-primary/50 transition-colors hover:shadow-md"
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
  )
}
