import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ClassPerformanceOverviewProps {
  stats: {
    totalStudents: number
    passRate: number
    averageScore: number
    subjectsBelowThreshold: { name: string; avg: number }[]
  }
}

export function ClassPerformanceOverview({
  stats,
}: ClassPerformanceOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média da Turma</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageScore.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">
            Média geral de todas as disciplinas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taxa de Aprovação
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.passRate.toFixed(0)}%</div>
          <Progress value={stats.passRate} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alunos na Turma</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalStudents}</div>
          <p className="text-xs text-muted-foreground">
            Total de alunos matriculados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pontos de Atenção
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.subjectsBelowThreshold.length}
          </div>
          <p className="text-xs text-muted-foreground">
            Disciplinas com média abaixo de 6.0
          </p>
          {stats.subjectsBelowThreshold.length > 0 && (
            <div className="mt-2 text-xs text-orange-700 space-y-1">
              {stats.subjectsBelowThreshold.slice(0, 2).map((s) => (
                <div key={s.name} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="font-bold">{s.avg.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
