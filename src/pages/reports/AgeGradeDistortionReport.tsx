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
  fetchAgeGradeDistortion,
  getMunicipalityName,
  AgeGradeDistortionData,
} from '@/services/qedu-service'

export default function AgeGradeDistortionReport() {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const [data, setData] = useState<AgeGradeDistortionData[]>([])
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
        const result = await fetchAgeGradeDistortion(municipalityId)
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
            Distorção Idade-Série
          </h2>
          <p className="text-muted-foreground">
            Dados obtidos via QEdu para {getMunicipalityName(municipalityId)}.
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
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Distorção por Série (%)</CardTitle>
              <CardDescription>
                Porcentagem de alunos com atraso escolar de 2 anos ou mais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  distortionRate: {
                    label: 'Taxa de Distorção (%)',
                    color: 'hsl(var(--primary))',
                  },
                }}
                className="h-[400px] w-full"
              >
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  width={400}
                  height={400}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="series" />
                  <YAxis unit="%" />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <Bar
                    dataKey="distortionRate"
                    fill="var(--color-distortionRate)"
                    radius={[4, 4, 0, 0]}
                    name="Distorção"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
