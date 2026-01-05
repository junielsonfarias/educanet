import { useState } from 'react'
import { Calendar as CalendarIcon, Search, AlertCircle } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export default function PublicCalendar() {
  const { schools } = useSchoolStore()
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [selectedYearId, setSelectedYearId] = useState('')
  const [calendarData, setCalendarData] = useState<any>(null)
  const [viewDate, setViewDate] = useState<Date | undefined>(new Date())

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId)
  const academicYears = selectedSchool?.academicYears || []

  const handleSearch = () => {
    if (!selectedSchool || !selectedYearId) return

    const year = activeYears.find((y) => y.id === selectedYearId)
    if (year) {
      setCalendarData({
        schoolName: selectedSchool.name,
        yearName: year.name,
        periods: year.periods,
        start: year.startDate,
        end: year.endDate,
      })
    }
  }

  const activeYears = academicYears.filter((y) => y.status !== 'pending')

  // Generate modifiers for calendar
  const events =
    calendarData?.periods?.map((p: any) => ({
      name: p.name,
      start: parseISO(p.startDate),
      end: parseISO(p.endDate),
    })) || []

  const modifiers = {
    hasEvent: (d: Date) => events.some((e: any) => d >= e.start && d <= e.end),
  }

  const modifiersStyles = {
    hasEvent: {
      fontWeight: 'bold',
      color: 'var(--primary)',
      backgroundColor: 'var(--secondary)',
      borderRadius: '4px',
    },
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Calendário Escolar
        </h1>
        <p className="text-muted-foreground">
          Consulte o calendário letivo da sua escola.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Escola</Label>
              <Select
                value={selectedSchoolId}
                onValueChange={(val) => {
                  setSelectedSchoolId(val)
                  setSelectedYearId('')
                  setCalendarData(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escola" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano Letivo</Label>
              <Select
                value={selectedYearId}
                onValueChange={setSelectedYearId}
                disabled={!selectedSchoolId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {activeYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSearch}
              disabled={!selectedSchoolId || !selectedYearId}
            >
              <Search className="mr-2 h-4 w-4" /> Buscar Calendário
            </Button>
          </div>
        </CardContent>
      </Card>

      {calendarData && (
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto animate-slide-up">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Visualização</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={viewDate}
                onSelect={setViewDate}
                locale={ptBR}
                className="rounded-md border"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{calendarData.schoolName}</CardTitle>
              <CardDescription>
                Ano Letivo {calendarData.yearName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Períodos Letivos
              </h3>
              <div className="space-y-4">
                {calendarData.periods.map((period: any) => (
                  <div
                    key={period.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                  >
                    <span className="font-medium">{period.name}</span>
                    <div className="text-sm">
                      <Badge variant="outline" className="mr-2">
                        Início:{' '}
                        {new Date(period.startDate).toLocaleDateString('pt-BR')}
                      </Badge>
                      <Badge variant="outline">
                        Fim:{' '}
                        {new Date(period.endDate).toLocaleDateString('pt-BR')}
                      </Badge>
                    </div>
                  </div>
                ))}
                {calendarData.periods.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>Nenhum período cadastrado para este ano.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
