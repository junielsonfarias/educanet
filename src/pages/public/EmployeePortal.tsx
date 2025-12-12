import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Briefcase,
  FileText,
  CalendarDays,
  DollarSign,
  UserCheck,
} from 'lucide-react'

export default function EmployeePortal() {
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Portal do Servidor
        </h1>
        <p className="text-xl text-muted-foreground">
          Canal exclusivo para professores e funcionários da educação municipal.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Acesso ao Sistema</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Acesse o painel administrativo para diários e gestão.
            </p>
            <Link to="/login">
              <Button className="w-full">Entrar no Sistema</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-green-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Contracheque Online</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Consulte seus holerites e informes de rendimentos.
            </p>
            <Button className="w-full" variant="outline" disabled>
              Acesso Externo
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-blue-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <CalendarDays className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Calendário Acadêmico</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Visualize o calendário letivo da sua unidade.
            </p>
            <Link to="/publico/calendario">
              <Button className="w-full" variant="outline">
                Consultar Calendário
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-orange-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle>Documentos Oficiais</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Portarias, decretos e comunicados internos.
            </p>
            <Link to="/publico/documentos">
              <Button className="w-full" variant="outline">
                Ver Documentos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-purple-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle>Formação Continuada</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Inscrições em cursos e certificações.
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
