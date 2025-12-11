import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useSchoolStore from '@/stores/useSchoolStore'
import { addDays, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SchoolCalendar() {
  const { schools } = useSchoolStore()
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Consolidate all periods from all schools for visualization
  const events = schools.flatMap((school) =>
    school.academicYears.flatMap((year) =>
      year.periods.map((period) => ({
        schoolName: school.name,
        yearName: year.name,
        periodName: period.name,
        start: parseISO(period.startDate),
        end: parseISO(period.endDate),
        type: 'period',
      })),
    ),
  )

  const selectedDayEvents = date
    ? events.filter((event) => date >= event.start && date <= event.end)
    : []

  // Create modifiers for the calendar
  const modifiers = {
    hasEvent: (d: Date) => events.some((e) => d >= e.start && d <= e.end),
  }

  const modifiersStyles = {
    hasEvent: {
      fontWeight: 'bold',
      textDecoration: 'underline',
      color: 'var(--primary)',
    },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Calendário Escolar
        </h2>
        <p className="text-muted-foreground">
          Visualização dos períodos letivos e eventos.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendário Geral</CardTitle>
            <CardDescription>
              Selecione uma data para ver detalhes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Eventos em {date?.toLocaleDateString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">
                Nenhum evento ou período letivo ativo nesta data.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedDayEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex flex-col p-3 border rounded-lg bg-secondary/10"
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">{event.periodName}</span>
                      <Badge variant="outline">{event.yearName}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground mt-1">
                      {event.schoolName}
                    </span>
                    <span className="text-xs text-muted-foreground mt-2">
                      De {event.start.toLocaleDateString('pt-BR')} até{' '}
                      {event.end.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
