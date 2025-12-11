import { useState } from 'react'
import { Search, Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function ReportCard() {
  const [searchId, setSearchId] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock search
    if (searchId) {
      setResult({
        name: 'João da Silva',
        school: 'Escola Municipal Monteiro Lobato',
        grade: '5º Ano A',
        year: 2024,
        grades: [
          {
            subject: 'Matemática',
            b1: 7.5,
            b2: 8.0,
            b3: 7.0,
            b4: 8.5,
            final: 7.8,
          },
          {
            subject: 'Português',
            b1: 8.0,
            b2: 8.5,
            b3: 8.0,
            b4: 9.0,
            final: 8.4,
          },
          {
            subject: 'História',
            b1: 9.0,
            b2: 9.0,
            b3: 8.5,
            b4: 9.5,
            final: 9.0,
          },
          {
            subject: 'Ciências',
            b1: 7.0,
            b2: 7.5,
            b3: 7.0,
            b4: 8.0,
            final: 7.4,
          },
        ],
      })
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">
            Boletim Escolar Online
          </h1>
          <p className="text-muted-foreground">
            Consulte o desempenho escolar do aluno
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Consultar Boletim</CardTitle>
            <CardDescription>
              Informe o número da matrícula para visualizar o boletim.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <Input
                placeholder="Digite a matrícula (ex: EDU-2024001)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" /> Consultar
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">{result.name}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {result.school} • {result.grade} • {result.year}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold">Disciplina</TableHead>
                      <TableHead className="text-center">1º Bim</TableHead>
                      <TableHead className="text-center">2º Bim</TableHead>
                      <TableHead className="text-center">3º Bim</TableHead>
                      <TableHead className="text-center">4º Bim</TableHead>
                      <TableHead className="text-center font-bold">
                        Média Final
                      </TableHead>
                      <TableHead className="text-center">Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.grades.map((grade: any) => (
                      <TableRow key={grade.subject}>
                        <TableCell className="font-medium">
                          {grade.subject}
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.b1.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.b2.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.b3.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.b4.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center font-bold bg-muted/20">
                          {grade.final.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              grade.final >= 6 ? 'default' : 'destructive'
                            }
                            className={
                              grade.final >= 6
                                ? 'bg-green-600 hover:bg-green-700'
                                : ''
                            }
                          >
                            {grade.final >= 6 ? 'Aprovado' : 'Recuperação'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
