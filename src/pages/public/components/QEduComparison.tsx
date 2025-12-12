import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts'
import { TrendingDown } from 'lucide-react'
import {
  availableMunicipalities,
  mockReferenceData,
  AggregatedMunicipalityData,
} from '@/services/qedu-service'

interface QEduComparisonProps {
  currentMunicipalityId: string
  historicalTrendData: any[]
  comparisonEntities: string[]
  setComparisonEntities: React.Dispatch<React.SetStateAction<string[]>>
  comparisonData: AggregatedMunicipalityData[]
  loadingComparison: boolean
}

export function QEduComparison({
  currentMunicipalityId,
  historicalTrendData,
  comparisonEntities,
  setComparisonEntities,
  comparisonData,
  loadingComparison,
}: QEduComparisonProps) {
  // Prepare Comparison Chart Data
  const chartData = useMemo(() => {
    const allYears = new Set<number>()
    // Current
    historicalTrendData.forEach((d) => allYears.add(d.year))
    // Reference
    mockReferenceData.national.forEach((d) => allYears.add(d.year))
    mockReferenceData.state.forEach((d) => allYears.add(d.year))
    // Comparisons
    comparisonData.forEach((cd) =>
      cd.idebHistory.forEach((h: any) => allYears.add(h.year)),
    )

    const sortedYears = Array.from(allYears).sort((a, b) => a - b)

    return sortedYears.map((year) => {
      const entry: any = { year }

      // Current
      const current = historicalTrendData.find((d) => d.year === year)
      if (current) entry['Atual'] = current.score

      // Reference
      const nat = mockReferenceData.national.find((d) => d.year === year)
      if (nat) entry['Nacional'] = nat.score

      const st = mockReferenceData.state.find((d) => d.year === year)
      if (st) entry['Estadual'] = st.score

      // Comparisons
      comparisonData.forEach((cd) => {
        const hist = cd.idebHistory.find((h: any) => h.year === year)
        if (hist) entry[cd.name] = hist.score
      })

      return entry
    })
  }, [historicalTrendData, comparisonData])

  const chartConfig = {
    Atual: { label: 'Atual', color: 'hsl(var(--primary))' },
    Nacional: { label: 'Média Nacional', color: '#10b981' },
    Estadual: { label: 'Média Estadual', color: '#f59e0b' },
    ...Object.fromEntries(
      comparisonEntities.map((id, idx) => {
        const m = availableMunicipalities.find((mun) => mun.id === id)
        return [
          m?.name || id,
          { label: m?.name, color: `hsl(${idx * 40 + 200}, 70%, 50%)` },
        ]
      }),
    ),
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo Avançado</CardTitle>
        <CardDescription>
          Adicione outros municípios para comparar o desempenho.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Adicionar ao gráfico:</span>
          <Select
            onValueChange={(val) =>
              setComparisonEntities((prev) =>
                prev.includes(val) ? prev : [...prev, val],
              )
            }
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione um município..." />
            </SelectTrigger>
            <SelectContent>
              {availableMunicipalities
                .filter(
                  (m) =>
                    m.id !== currentMunicipalityId &&
                    !comparisonEntities.includes(m.id),
                )
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} - {m.state}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {comparisonEntities.length > 0 && (
            <div className="flex gap-2 ml-4 flex-wrap">
              {comparisonEntities.map((id) => {
                const m = availableMunicipalities.find((mun) => mun.id === id)
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 gap-1"
                  >
                    {m?.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() =>
                        setComparisonEntities((prev) =>
                          prev.filter((e) => e !== id),
                        )
                      }
                    >
                      <TrendingDown className="h-3 w-3 rotate-45" />
                    </Button>
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        {loadingComparison && (
          <div className="text-sm text-muted-foreground animate-pulse">
            Atualizando dados comparativos...
          </div>
        )}

        <div className="h-[500px] w-full border rounded-lg p-4 bg-white/50">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 10]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="Atual"
                stroke="var(--color-Atual)"
                strokeWidth={3}
                dot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Nacional"
                stroke="var(--color-Nacional)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Estadual"
                stroke="var(--color-Estadual)"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
              />
              {comparisonEntities.map((id, idx) => {
                const m = availableMunicipalities.find((mun) => mun.id === id)
                const name = m?.name || id
                return (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={name}
                    stroke={`hsl(${idx * 40 + 200}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )
              })}
            </LineChart>
          </ChartContainer>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          * Médias Nacional e Estadual são valores de referência aproximados
          para demonstração.
        </div>
      </CardContent>
    </Card>
  )
}
