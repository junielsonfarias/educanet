import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { SchoolQEduData } from '@/services/qedu-service'

interface QEduOverviewProps {
  aggregateData: {
    idebAverage: number
    approvalAverage: number
    latestYear: number
  }
  schoolsData: SchoolQEduData[]
  historicalTrendData: any[]
}

export function QEduOverview({
  aggregateData,
  schoolsData,
  historicalTrendData,
}: QEduOverviewProps) {
  const idebConfig = {
    score: { label: 'Nota', color: 'hsl(var(--primary))' },
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média IDEB ({aggregateData.latestYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-4xl font-bold text-primary">
                {aggregateData.idebAverage.toFixed(1)}
              </div>
              {aggregateData.idebAverage >= 6.0 ? (
                <Badge className="bg-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" /> Bom
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <TrendingDown className="h-3 w-3 mr-1" /> Atenção
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Índice de Desenvolvimento da Educação Básica
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovação Média ({aggregateData.latestYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-700">
              {aggregateData.approvalAverage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de sucesso escolar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Escolas Monitoradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{schoolsData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unidades com dados reportados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução do IDEB Municipal</CardTitle>
            <CardDescription>
              Histórico de desempenho consolidado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={idebConfig} className="h-[300px] w-full">
              <AreaChart data={historicalTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 10]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-score)"
                  fill="var(--color-score)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição das Escolas</CardTitle>
            <CardDescription>
              Escolas por faixa de IDEB (Último ano).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            <div className="space-y-4 w-full">
              {['Alto (>= 6.0)', 'Médio (4.5 - 5.9)', 'Baixo (< 4.5)'].map(
                (label, idx) => {
                  const count = schoolsData.filter((s) => {
                    const score =
                      s.idebHistory[s.idebHistory.length - 1]?.score || 0
                    if (idx === 0) return score >= 6
                    if (idx === 1) return score >= 4.5 && score < 6
                    return score < 4.5
                  }).length
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="font-bold">{count} escolas</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{
                            width: `${(count / (schoolsData.length || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
