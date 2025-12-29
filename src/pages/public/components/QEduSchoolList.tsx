import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { School as SchoolIcon } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'
import { SchoolQEduData } from '@/services/qedu-service'

interface QEduSchoolListProps {
  schoolsData: SchoolQEduData[]
}

export function QEduSchoolList({ schoolsData }: QEduSchoolListProps) {
  const idebConfig = {
    score: { label: 'Nota', color: 'hsl(var(--primary))' },
  } satisfies ChartConfig

  const approvalConfig = {
    rate: { label: 'Aprovação', color: 'hsl(142, 76%, 36%)' },
  } satisfies ChartConfig

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {schoolsData.map((school) => (
        <Card
          key={school.id}
          className="overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="p-6 border-b bg-muted/30">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <SchoolIcon className="h-5 w-5 text-primary" />
                  {school.name}
                </h3>
                <Badge variant="outline" className="mt-2">
                  ID: {school.id}
                </Badge>
              </div>
              <div className="text-right">
                <span className="block text-xs text-muted-foreground">
                  IDEB Atual
                </span>
                <span className="text-2xl font-bold text-primary">
                  {school.idebHistory[
                    school.idebHistory.length - 1
                  ]?.score.toFixed(1) || '-'}
                </span>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Evolução IDEB
                </h4>
                <div className="h-[100px]">
                  {Array.isArray(school.idebHistory) && school.idebHistory.length > 0 ? (
                    <ChartContainer config={idebConfig} key={`ideb-${school.id}`}>
                      <LineChart data={school.idebHistory}>
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="var(--color-score)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <YAxis domain={[0, 10]} hide />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Sem dados
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Aprovação
                </h4>
                <div className="h-[100px]">
                  {Array.isArray(school.approvalHistory) && school.approvalHistory.length > 0 ? (
                    <ChartContainer config={approvalConfig} key={`approval-${school.id}`}>
                      <BarChart data={school.approvalHistory}>
                        <Bar
                          dataKey="rate"
                          fill="var(--color-rate)"
                          radius={[2, 2, 0, 0]}
                        />
                        <YAxis domain={[0, 100]} hide />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Sem dados
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
