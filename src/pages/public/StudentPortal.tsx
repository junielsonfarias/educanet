import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, BookOpen, Calendar, FileText, User } from 'lucide-react'

export default function StudentPortal() {
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Portal do Aluno
        </h1>
        <p className="text-xl text-muted-foreground">
          Acesso rápido a serviços e informações para estudantes da rede
          municipal.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-green-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Matrícula Online</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Realize a matrícula do seu filho de forma rápida e prática pela internet.
            </p>
            <Link to="/publico/matricula-online">
              <Button className="w-full">Acessar Matrícula Online</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-blue-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Boletim Online</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Consulte suas notas, frequência e desempenho acadêmico.
            </p>
            <Link to="/publico/boletim">
              <Button className="w-full">Acessar Boletim</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-green-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Calendário Escolar</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Fique por dentro das datas de provas, feriados e eventos.
            </p>
            <Link to="/publico/calendario">
              <Button className="w-full" variant="outline">
                Ver Calendário
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-purple-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle>Material de Apoio</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Acesse documentos e materiais complementares.
            </p>
            <Link to="/publico/documentos">
              <Button className="w-full" variant="outline">
                Biblioteca
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-orange-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <User className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle>Dados Cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Verifique sua situação cadastral junto à secretaria.
            </p>
            <Button className="w-full" variant="secondary" disabled>
              Em Breve
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-red-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Histórico Escolar</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Solicite a emissão do seu histórico escolar.
            </p>
            <Button className="w-full" variant="secondary" disabled>
              Em Breve
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
