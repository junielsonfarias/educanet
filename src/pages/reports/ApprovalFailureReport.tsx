import { useEffect, useState } from 'react'
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
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import useSettingsStore from '@/stores/useSettingsStore'
import {
  fetchApprovalFailureRates,
  getMunicipalityName,
  ApprovalFailureData,
} from '@/services/qedu-service'

export default function ApprovalFailureReport() {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const [data, setData] = useState<ApprovalFailureData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const municipalityId = settings.qeduMunicipalityId || ''

  useEffect(() => {
    async function loadData() {
      if (!municipalityId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const result = await fetchApprovalFailureRates(municipalityId)
        setData(result)
      } catch (err) {
        setError('Falha ao carregar dados do QEdu.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [municipalityId])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/relatorios')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Taxas de Rendimento
          </h2>
          <p className="text-muted-foreground">
            Aprovação, Reprovação e Abandono (QEdu) para{' '}
            {getMunicipalityName(municipalityId)}.
          </p>
        </div>
      </div>

      {!municipalityId && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">
                Município não configurado
              </h3>
              <p className="text-yellow-700">
                Por favor, acesse as configurações gerais e selecione um
                município para visualizar os dados do QEdu.
              </p>
            </div>
            <Button
              variant="outline"
              className="ml-auto bg-white"
              onClick={() => navigate('/configuracoes/geral')}
            >
              Configurar
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive">{error}</div>
      ) : (
        data.length > 0 && (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo de Rendimento por Etapa</CardTitle>
                <CardDescription>
                  Percentual de alunos aprovados, reprovados e que abandonaram.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    approvalRate: {
                      label: 'Aprovação',
                      color: 'hsl(142, 76%, 36%)', // Green
                    },
                    failureRate: {
                      label: 'Reprovação',
                      color: 'hsl(0, 84%, 60%)', // Red
                    },
                    dropoutRate: {
                      label: 'Abandono',
                      color: 'hsl(30, 80%, 55%)', // Orange
                    },
                  }}
                  className="h-[400px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="stage" />
                      <YAxis unit="%" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="approvalRate"
                        fill="var(--color-approvalRate)"
                        radius={[4, 4, 0, 0]}
                        name="Aprovação"
                      />
                      <Bar
                        dataKey="failureRate"
                        fill="var(--color-failureRate)"
                        radius={[4, 4, 0, 0]}
                        name="Reprovação"
                      />
                      <Bar
                        dataKey="dropoutRate"
                        fill="var(--color-dropoutRate)"
                        radius={[4, 4, 0, 0]}
                        name="Abandono"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {data.map((item) => (
                <Card key={item.stage} className="bg-secondary/10">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.stage}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Aprovação</span>
                      <span className="text-green-600 font-bold">
                        {item.approvalRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${item.approvalRate}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-medium">Reprovação</span>
                      <span className="text-red-500 font-bold">
                        {item.failureRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-red-500 h-2.5 rounded-full"
                        style={{ width: `${item.failureRate}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-medium">Abandono</span>
                      <span className="text-orange-500 font-bold">
                        {item.dropoutRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-orange-500 h-2.5 rounded-full"
                        style={{ width: `${item.dropoutRate}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  )
}
