import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { School, CheckSquare, X } from 'lucide-react'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { SafeChart } from '@/components/charts/SafeChart'

export default function ComparativeReports() {
  const { schools } = useSchoolStore()
  const { students } = useStudentStore()
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([])
  const [selectedMetric, setSelectedMetric] = useState<'approval' | 'students'>(
    'approval',
  )

  const toggleSchool = (id: string) => {
    if (selectedSchoolIds.includes(id)) {
      setSelectedSchoolIds((prev) => prev.filter((sid) => sid !== id))
    } else {
      if (selectedSchoolIds.length >= 5) return // Limit to 5
      setSelectedSchoolIds((prev) => [...prev, id])
    }
  }

  const comparisonData = useMemo(() => {
    if (selectedSchoolIds.length === 0) return []

    return selectedSchoolIds
      .map((id) => {
        const school = schools.find((s) => s.id === id)
        if (!school) return null

        // Calculate Metrics for this school
        let totalStudents = 0
        let approved = 0

        students.forEach((s) => {
          const enrollment = s.enrollments.find(
            (e) => e.schoolId === id && e.status !== 'Transferido',
          )
          if (enrollment) {
            totalStudents++
            if (enrollment.status === 'Aprovado') approved++
          }
        })

        const approvalRate =
          totalStudents > 0 ? (approved / totalStudents) * 100 : 0

        return {
          name: school.name,
          shortName: school.name.split(' ').slice(0, 2).join(' '),
          students: totalStudents,
          approvalRate: parseFloat(approvalRate.toFixed(1)),
          classrooms: school.infrastructure?.classrooms || 0,
        }
      })
      .filter(Boolean) as any[]
  }, [selectedSchoolIds, schools, students])

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Relatórios Comparativos
        </h1>
        <p className="text-muted-foreground">
          Compare indicadores entre diferentes unidades escolares.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleção de Escolas</CardTitle>
          <CardDescription>
            Selecione até 5 escolas para comparação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {schools.map((school) => (
              <Badge
                key={school.id}
                variant={
                  selectedSchoolIds.includes(school.id) ? 'default' : 'outline'
                }
                className="cursor-pointer px-3 py-1 text-sm flex items-center gap-2 hover:bg-primary/90"
                onClick={() => toggleSchool(school.id)}
              >
                {school.name}
                {selectedSchoolIds.includes(school.id) && (
                  <CheckSquare className="h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-medium">Métrica Principal:</span>
            <Select
              value={selectedMetric}
              onValueChange={(v: any) => setSelectedMetric(v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approval">Taxa de Aprovação (%)</SelectItem>
                <SelectItem value="students">Total de Alunos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={() => setSelectedSchoolIds([])}
              disabled={selectedSchoolIds.length === 0}
            >
              <X className="mr-2 h-4 w-4" /> Limpar Seleção
            </Button>
          </div>
        </CardContent>
      </Card>

      {comparisonData.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Gráfico Comparativo</CardTitle>
            </CardHeader>
            <CardContent>
              <SafeChart
                data={comparisonData}
                minHeight={400}
                validateData={(data) =>
                  Array.isArray(data) &&
                  data.length > 0 &&
                  data[0]?.shortName !== undefined
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="shortName" />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend />
                    <Bar
                      dataKey={
                        selectedMetric === 'approval'
                          ? 'approvalRate'
                          : 'students'
                      }
                      name={
                        selectedMetric === 'approval'
                          ? 'Aprovação (%)'
                          : 'Total Alunos'
                      }
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </SafeChart>
            </CardContent>
          </Card>

          {comparisonData.map((data, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <School className="h-5 w-5 text-muted-foreground" />
                  {data.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Alunos</span>
                    <span className="font-bold text-lg">{data.students}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">
                      Aprovação
                    </span>
                    <span
                      className={`font-bold text-lg ${data.approvalRate >= 80 ? 'text-green-600' : 'text-orange-600'}`}
                    >
                      {data.approvalRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Salas</span>
                    <span className="font-medium">{data.classrooms}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Selecione escolas acima para gerar o relatório.
        </div>
      )}
    </div>
  )
}
