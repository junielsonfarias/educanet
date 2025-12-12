import { useState, useEffect, useMemo } from 'react'
import { BarChart3, AlertCircle, Loader2, Info, Building } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  availableMunicipalities,
  fetchSchoolsQEduData,
  fetchMunicipalityAggregatedData,
  SchoolQEduData,
  AggregatedMunicipalityData,
} from '@/services/qedu-service'
import useSettingsStore from '@/stores/useSettingsStore'
import { QEduAlertsDialog, AlertRule } from './components/QEduAlertsDialog'
import { QEduOverview } from './components/QEduOverview'
import { QEduSchoolList } from './components/QEduSchoolList'
import { QEduComparison } from './components/QEduComparison'
import { useToast } from '@/hooks/use-toast'

export default function PublicQEduData() {
  const { settings } = useSettingsStore()
  const { toast } = useToast()

  // State
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState('')
  const [schoolsData, setSchoolsData] = useState<SchoolQEduData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Comparison State
  const [comparisonEntities, setComparisonEntities] = useState<string[]>([])
  const [comparisonData, setComparisonData] = useState<
    AggregatedMunicipalityData[]
  >([])
  const [loadingComparison, setLoadingComparison] = useState(false)

  // Alerts State
  const [alertRules, setAlertRules] = useState<AlertRule[]>(() => {
    const stored = localStorage.getItem('qedu_alert_rules')
    return stored ? JSON.parse(stored) : []
  })

  // Initialize Municipality from Settings or Default
  useEffect(() => {
    if (settings.qeduMunicipalityId) {
      setSelectedMunicipalityId(settings.qeduMunicipalityId)
    } else if (availableMunicipalities.length > 0) {
      setSelectedMunicipalityId(availableMunicipalities[0].id)
    }
  }, [settings.qeduMunicipalityId])

  // Fetch Main Data
  useEffect(() => {
    async function loadData() {
      if (!selectedMunicipalityId) return
      setLoading(true)
      setError('')
      try {
        const data = await fetchSchoolsQEduData(selectedMunicipalityId)
        setSchoolsData(data)
        checkAlerts(data, alertRules)
      } catch (err) {
        console.error(err)
        setError(
          'Não foi possível carregar os dados das escolas. Verifique a conexão ou a disponibilidade dos dados no QEdu.',
        )
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedMunicipalityId])

  // Aggregate Data for current municipality
  const aggregateData = useMemo(() => {
    if (!schoolsData.length)
      return { idebAverage: 0, approvalAverage: 0, latestYear: 0 }

    const allYears = schoolsData.flatMap((s) =>
      s.idebHistory.map((h) => h.year),
    )
    const latestYear = allYears.length
      ? Math.max(...allYears)
      : new Date().getFullYear()

    const idebValues = schoolsData
      .map((s) => s.idebHistory.find((h) => h.year === latestYear)?.score)
      .filter((v): v is number => v !== undefined)

    const approvalValues = schoolsData
      .map((s) => s.approvalHistory.find((h) => h.year === latestYear)?.rate)
      .filter((v): v is number => v !== undefined)

    const idebAverage = idebValues.length
      ? idebValues.reduce((a, b) => a + b, 0) / idebValues.length
      : 0

    const approvalAverage = approvalValues.length
      ? approvalValues.reduce((a, b) => a + b, 0) / approvalValues.length
      : 0

    return {
      idebAverage,
      approvalAverage,
      latestYear,
    }
  }, [schoolsData])

  // Historical Data for Current Municipality (aggregated from schools)
  const historicalTrendData = useMemo(() => {
    if (!schoolsData.length) return []
    const years = Array.from(
      new Set(schoolsData.flatMap((s) => s.idebHistory.map((h) => h.year))),
    ).sort((a, b) => a - b)

    return years
      .map((year) => {
        const scores = schoolsData
          .map((s) => s.idebHistory.find((h) => h.year === year)?.score)
          .filter((s): s is number => s !== undefined)

        const avg =
          scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : null

        return {
          year,
          score: avg ? Number(avg.toFixed(1)) : null,
        }
      })
      .filter((d) => d.score !== null)
  }, [schoolsData])

  // Check Alerts Logic
  const checkAlerts = (data: SchoolQEduData[], rules: AlertRule[]) => {
    if (rules.length === 0 || data.length === 0) return

    const allYears = data.flatMap((s) => s.idebHistory.map((h) => h.year))
    const latestYear = Math.max(...allYears)

    const idebScores = data
      .map((s) => s.idebHistory.find((h) => h.year === latestYear)?.score)
      .filter((v) => v !== undefined) as number[]
    const currentIdeb =
      idebScores.reduce((a, b) => a + b, 0) / (idebScores.length || 1)

    const approvalRates = data
      .map((s) => s.approvalHistory.find((h) => h.year === latestYear)?.rate)
      .filter((v) => v !== undefined) as number[]
    const currentApproval =
      approvalRates.reduce((a, b) => a + b, 0) / (approvalRates.length || 1)

    rules.forEach((rule) => {
      let triggered = false
      if (rule.indicator === 'IDEB') {
        if (rule.operator === 'gt' && currentIdeb > rule.value) triggered = true
        if (rule.operator === 'lt' && currentIdeb < rule.value) triggered = true
      } else if (rule.indicator === 'Approval') {
        if (rule.operator === 'gt' && currentApproval > rule.value)
          triggered = true
        if (rule.operator === 'lt' && currentApproval < rule.value)
          triggered = true
      }

      if (triggered) {
        toast({
          title: 'Alerta QEdu',
          description: `O indicador ${rule.indicator} atingiu a condição (${rule.operator === 'gt' ? '>' : '<'} ${rule.value}).`,
          duration: 10000,
        })
      }
    })
  }

  const handleRulesChange = (newRules: AlertRule[]) => {
    setAlertRules(newRules)
    localStorage.setItem('qedu_alert_rules', JSON.stringify(newRules))
    checkAlerts(schoolsData, newRules)
  }

  // Fetch Comparison Data
  useEffect(() => {
    async function loadComparison() {
      if (comparisonEntities.length === 0) {
        setComparisonData([])
        return
      }
      setLoadingComparison(true)
      try {
        const promises = comparisonEntities.map((id) =>
          fetchMunicipalityAggregatedData(id),
        )
        const results = await Promise.all(promises)
        setComparisonData(results)
      } catch (e) {
        console.error(e)
        toast({
          variant: 'destructive',
          title: 'Erro na comparação',
          description: 'Não foi possível carregar dados de alguns municípios.',
        })
      } finally {
        setLoadingComparison(false)
      }
    }
    loadComparison()
  }, [comparisonEntities])

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-primary flex items-center gap-3">
            <BarChart3 className="h-10 w-10" />
            Dados QEdu
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Transparência total nos indicadores educacionais.
          </p>
        </div>
        <div className="flex gap-2">
          <QEduAlertsDialog
            onRulesChange={handleRulesChange}
            currentRules={alertRules}
          />
        </div>
      </div>

      {/* Municipality Selector */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground w-full md:w-auto min-w-[150px]">
              <Building className="h-5 w-5" />
              <span className="font-medium whitespace-nowrap">Município:</span>
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

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados oficiais...</p>
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
      ) : schoolsData.length === 0 ? (
        <div className="flex justify-center py-10">
          <Card className="bg-muted/50 border-muted max-w-lg">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <Info className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">
                Nenhum dado encontrado para este município no QEdu.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="schools">Detalhes por Escola</TabsTrigger>
            <TabsTrigger value="compare">Comparativo Regional</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <QEduOverview
              aggregateData={aggregateData}
              schoolsData={schoolsData}
              historicalTrendData={historicalTrendData}
            />
          </TabsContent>

          <TabsContent value="schools" className="mt-4">
            <QEduSchoolList schoolsData={schoolsData} />
          </TabsContent>

          <TabsContent value="compare" className="mt-4">
            <QEduComparison
              currentMunicipalityId={selectedMunicipalityId}
              historicalTrendData={historicalTrendData}
              comparisonEntities={comparisonEntities}
              setComparisonEntities={setComparisonEntities}
              comparisonData={comparisonData}
              loadingComparison={loadingComparison}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
