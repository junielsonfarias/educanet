import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, Clock } from 'lucide-react'

export default function ClassesList() {
  const classes = [
    {
      id: 1,
      name: '5º Ano A',
      shift: 'Matutino',
      students: 25,
      max: 30,
      teacher: 'Prof. Alberto',
    },
    {
      id: 2,
      name: '5º Ano B',
      shift: 'Vespertino',
      students: 28,
      max: 30,
      teacher: 'Prof. Bianca',
    },
    {
      id: 3,
      name: '4º Ano A',
      shift: 'Matutino',
      students: 22,
      max: 30,
      teacher: 'Prof. Carlos',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Turmas
          </h2>
          <p className="text-muted-foreground">
            Gerenciamento de turmas e enturmação.
          </p>
        </div>
        <Button>Nova Turma</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card
            key={cls.id}
            className="hover:border-primary/50 transition-colors cursor-pointer group"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {cls.name}
                </CardTitle>
                <Badge variant="secondary">{cls.shift}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Responsável:{' '}
                  <span className="text-foreground font-medium">
                    {cls.teacher}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {cls.students}/{cls.max} Alunos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>7:00 - 11:30</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(cls.students / cls.max) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
