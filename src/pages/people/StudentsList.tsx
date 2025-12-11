import { useState } from 'react'
import { Plus, Search, MoreHorizontal, User, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const mockStudents = [
  {
    id: '1',
    name: 'Alice Souza',
    age: 10,
    grade: '5º Ano A',
    status: 'Cursando',
    registration: 'EDU-2024001',
  },
  {
    id: '2',
    name: 'Bruno Lima',
    age: 11,
    grade: '5º Ano A',
    status: 'Cursando',
    registration: 'EDU-2024002',
  },
  {
    id: '3',
    name: 'Carla Dias',
    age: 9,
    grade: '4º Ano B',
    status: 'Transferido',
    registration: 'EDU-2024003',
  },
  {
    id: '4',
    name: 'Daniel Rocha',
    age: 10,
    grade: '5º Ano A',
    status: 'Cursando',
    registration: 'EDU-2024004',
  },
  {
    id: '5',
    name: 'Eduarda Martins',
    age: 12,
    grade: '6º Ano C',
    status: 'Reprovado',
    registration: 'EDU-2024005',
  },
]

export default function StudentsList() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Alunos
          </h2>
          <p className="text-muted-foreground">
            Gestão completa de discentes da rede.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            Exportar Lista
          </Button>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Aluno
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diretório de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Série/Turma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={`https://img.usecurling.com/ppl/thumbnail?seed=${student.id}`}
                      />
                      <AvatarFallback>
                        {student.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {student.registration}
                  </TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.status === 'Cursando' ? 'outline' : 'secondary'
                      }
                      className={
                        student.status === 'Cursando'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : ''
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aluno</DropdownMenuLabel>
                        <DropdownMenuItem className="gap-2">
                          <User className="h-4 w-4" /> Perfil Completo
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <FileText className="h-4 w-4" /> Histórico Escolar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Editar Cadastro</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
