import { useState, useEffect, useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import {
  Building,
  School as SchoolIcon,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  ChartConfig,
} from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  availableMunicipalities,
  fetchSchoolsQEduData,
  SchoolQEduData,
} from '@/services/qedu-service'

export default function PublicQEduData() {
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState(
    availableMunicipalities[0]?.id || '',
  )
  const [schoolsData, setSchoolsData] = useState<SchoolQEduData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      if (!selectedMunicipalityId) return
      setLoading(true)
      setError('')
      try {
        const data = await fetchSchoolsQEduData(selectedMunicipalityId)
        setSchoolsData(data)
      } catch (err) {
        setError('Não foi possível carregar os dados das escolas.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedMunicipalityId])

  const aggregateData = useMemo(() => {
    if (!schoolsData.length) return { idebAverage: 0, approvalAverage: 0 }

    // Calculate latest year averages
    const latestYear = Math.max(
      ...schoolsData.flatMap((s) => s.idebHistory.map((h) => h.year)),
    )

    const idebSum = schoolsData.reduce((acc, school) => {
      const entry = school.idebHistory.find((h) => h.year === latestYear)
      return acc + (entry ? entry.score : 0)
    }, 0)

    const approvalSum = schoolsData.reduce((acc, school) => {
      const entry = school.approvalHistory.find((h) => h.year === latestYear)
      return acc + (entry ? entry.rate : 0)
    }, 0)

    return {
      idebAverage: idebSum / schoolsData.length,
      approvalAverage: approvalSum / schoolsData.length,
      latestYear,
    }
  }, [schoolsData])

  // Prepare chart data for IDEB Comparison
  const idebComparisonData = useMemo(() => {
    if (!schoolsData.length) return []
    const years = Array.from(
      new Set(schoolsData.flatMap((s) => s.idebHistory.map((h) => h.year))),
    ).sort()

    return years.map((year) => {
      const entry: any = { year }
      schoolsData.forEach((school) => {
        const h = school.idebHistory.find((hist) => hist.year === year)
        if (h) {
          entry[school.name] = h.score
        }
      })
      // Calculate Municipality Average for this year
      const totalScore = schoolsData.reduce((acc, school) => {
        const h = school.idebHistory.find((hist) => hist.year === year)
        return acc + (h ? h.score : 0)
      }, 0)
      entry['Média Município'] = Number(
        (totalScore / schoolsData.length).toFixed(1),
      )
      return entry
    })
  }, [schoolsData])

  // Chart Configs
  const idebConfig = {
    score: {
      label: 'Nota',
      color: 'hsl(var(--primary))',
    },
    target: {
      label: 'Meta',
      color: 'hsl(var(--muted-foreground))',
    },
  } satisfies ChartConfig

  const approvalConfig = {
    rate: {
      label: 'Aprovação',
      color: 'hsl(142, 76%, 36%)',
    },
  } satisfies ChartConfig

  const comparisonConfig = useMemo(() => {
    const config: ChartConfig = {
      'Média Município': {
        label: 'Média Município',
        color: 'hsl(var(--destructive))',
      },
    }
    schoolsData.forEach((school, index) => {
      config[school.name] = {
        label: school.name,
        color: `hsl(${index * 60 + 200}, 70%, 50%)`,
      }
    })
    return config
  }, [schoolsData])

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-4xl font-bold text-primary flex items-center justify-center gap-3">
          <BarChart3 className="h-10 w-10" />
          Dados e Indicadores QEdu
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Transparência total nos indicadores educacionais. Compare o desempenho
          das escolas e acompanhe a evolução do IDEB.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground w-full md:w-auto">
              <Building className="h-5 w-5" />
              <span className="font-medium whitespace-nowrap">
                Selecione o Município:
              </span>
            </div>
            <div className="flex-1 w-full">
              <Select
                value={selectedMunicipalityId}
                onValueChange={setSelectedMunicipalityId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMunicipalities.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} - {m.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex justify-center py-10">
          <Card className="bg-destructive/10 border-destructive max-w-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive font-medium">{error}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Escolas Monitoradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{schoolsData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Unidades escolares no município
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Média IDEB ({aggregateData.latestYear})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">
                    {aggregateData.idebAverage.toFixed(1)}
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" /> Meta Nacional
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Índice de Desenvolvimento da Educação Básica
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Aprovação Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {aggregateData.approvalAverage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Média de aprovação das escolas ({aggregateData.latestYear})
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="list">Lista de Escolas</TabsTrigger>
                <TabsTrigger value="compare">Comparativo Anual</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="space-y-6">
              {schoolsData.map((school) => (
                <Card key={school.id} className="overflow-hidden">
                  <div className="md:flex">
                    <div className="bg-muted p-6 flex flex-col items-center justify-center md:w-48 text-center border-r border-border/50">
                      <SchoolIcon className="h-12 w-12 text-primary mb-2" />
                      <h3 className="font-bold text-sm">{school.name}</h3>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Histórico IDEB
                          </h4>
                          <ChartContainer
                            config={idebConfig}
                            className="h-[200px] w-full aspect-auto"
                          >
                            <LineChart data={school.idebHistory}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                              />
                              <XAxis dataKey="year" />
                              <YAxis domain={[0, 10]} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="var(--color-score)"
                                strokeWidth={2}
                                activeDot={{ r: 6 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="target"
                                stroke="var(--color-target)"
                                strokeDasharray="5 5"
                              />
                            </LineChart>
                          </ChartContainer>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Taxa de Aprovação (%)
                          </h4>
                          <ChartContainer
                            config={approvalConfig}
                            className="h-[200px] w-full aspect-auto"
                          >
                            <BarChart data={school.approvalHistory}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                              />
                              <XAxis dataKey="year" />
                              <YAxis domain={[0, 100]} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar
                                dataKey="rate"
                                fill="var(--color-rate)"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ChartContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="compare">
              <Card>
                <CardHeader>
                  <CardTitle>Comparativo de Evolução do IDEB</CardTitle>
                  <CardDescription>
                    Compare o desempenho das escolas em relação à média do
                    município.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={comparisonConfig}
                    className="h-[500px] w-full aspect-auto"
                  >
                    <LineChart data={idebComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="year" />
                      <YAxis domain={[0, 10]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Média Município"
                        stroke="var(--color-Média Município)"
                        strokeWidth={3}
                        dot={{ r: 6 }}
                      />
                      {schoolsData.map((school) => (
                        <Line
                          key={school.id}
                          type="monotone"
                          dataKey={school.name}
                          stroke={
                            comparisonConfig[school.name]?.color || '#888888'
                          }
                          strokeWidth={1}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
