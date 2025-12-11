import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, School } from 'lucide-react'
import useSchoolStore from '@/stores/useSchoolStore'
import { Link } from 'react-router-dom'

export default function ClassesList() {
  const { schools } = useSchoolStore()

  // Flatten all classes for display with robust error handling to prevent "flatMap of undefined" errors
  const allClasses = (schools || []).flatMap((school) => {
    // Ensure school exists and has academicYears array
    if (!school || !Array.isArray(school.academicYears)) {
      return []
    }

    return school.academicYears.flatMap((year) => {
      // Ensure year exists and has classes array
      if (!year || !Array.isArray(year.classes)) {
        return []
      }

      return year.classes.map((cls) => ({
        ...cls,
        schoolName: school.name,
        schoolId: school.id,
        yearName: year.name,
      }))
    })
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Turmas
          </h2>
          <p className="text-muted-foreground">
            Visão geral de todas as turmas cadastradas na rede.
          </p>
        </div>
        <Link to="/escolas">
          <Button variant="outline">Gerenciar por Escola</Button>
        </Link>
      </div>

      {allClasses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma turma cadastrada. Acesse o menu "Escolas" para configurar as
            turmas de cada unidade.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allClasses.map((cls) => (
            <Card
              key={`${cls.schoolId}-${cls.id}`}
              className="hover:border-primary/50 transition-colors group"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {cls.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <School className="h-3 w-3" />
                      <span className="truncate max-w-[180px]">
                        {cls.schoolName}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">{cls.shift}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Série/Ano:</span>
                    <span className="font-medium">{cls.gradeName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{cls.studentCount || 0} Alunos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{cls.yearName}</span>
                    </div>
                  </div>
                  {/* Simplified progress bar simulation */}
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${Math.min(
                          ((cls.studentCount || 0) / 30) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
