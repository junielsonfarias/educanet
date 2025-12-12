import {
  FileText,
  Newspaper,
  Users,
  Building,
  ArrowRight,
  GraduationCap,
  Calendar,
  UserCircle,
  School,
  Facebook,
  Instagram,
  Map,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import usePublicContentStore from '@/stores/usePublicContentStore'
import useSettingsStore from '@/stores/useSettingsStore'
import { format, parseISO } from 'date-fns'

export default function InstitutionalHome() {
  const { news, documents, getContent } = usePublicContentStore()
  const { settings } = useSettingsStore()

  const semedInfo = getContent('semed_info')
  const semedStructure = getContent('semed_structure')

  const activeNews = news
    .filter((n) => n.active)
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
    )
    .slice(0, 3)

  const activeDocuments = documents
    .filter((d) => d.active)
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
    )
    .slice(0, 5)

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 md:px-12 md:py-24 text-primary-foreground shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[url('https://img.usecurling.com/p/1200/400?q=education&color=blue')] bg-cover bg-center" />
        <div className="relative z-10 max-w-3xl">
          <Badge
            variant="secondary"
            className="mb-4 bg-white/20 text-white hover:bg-white/30"
          >
            Educação Municipal
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl mb-4">
            {settings.educationSecretaryName}
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl">
            Bem-vindo ao portal oficial da educação de{' '}
            {settings.municipalityName}. Aqui você encontra notícias, serviços e
            transparência sobre a gestão educacional.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/publico/boletim">
              <Button size="lg" variant="secondary" className="gap-2">
                <GraduationCap className="h-5 w-5" />
                Consulta de Boletim
              </Button>
            </Link>
            <Link to="/publico/documentos">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 bg-transparent text-white border-white hover:bg-white hover:text-primary"
              >
                <FileText className="h-5 w-5" />
                Documentos Oficiais
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Serviços</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/publico/portal-aluno">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group hover:border-primary/50">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <UserCircle className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Portal do Aluno</h3>
                  <p className="text-sm text-muted-foreground">
                    Acesso a notas, frequência e materiais.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/publico/portal-servidor">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group hover:border-primary/50">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                  <School className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Portal do Servidor</h3>
                  <p className="text-sm text-muted-foreground">
                    Contracheque, diário eletrônico e mais.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/publico/calendario">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group hover:border-primary/50">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                  <Calendar className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Calendário</h3>
                  <p className="text-sm text-muted-foreground">
                    Datas importantes e feriados escolares.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/publico/escolas">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group hover:border-primary/50">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                  <Map className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Nossas Escolas</h3>
                  <p className="text-sm text-muted-foreground">
                    Localize as unidades da rede municipal.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-12 lg:grid-cols-5 container mx-auto px-4">
        {/* News Section - Takes 3 columns (60%) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Últimas Notícias</h2>
            </div>
          </div>

          <div className="grid gap-6">
            {activeNews.length > 0 ? (
              activeNews.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 h-48 md:h-auto bg-muted">
                      <img
                        src={
                          post.imageUrl ||
                          'https://img.usecurling.com/p/400/300?q=education'
                        }
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(post.publishDate), 'dd/MM/yyyy')}
                        </div>
                        <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground line-clamp-2 mb-4">
                          {post.summary}
                        </p>
                      </div>
                      <Button
                        variant="link"
                        className="p-0 h-auto w-fit text-primary"
                      >
                        Ler mais <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground italic">
                Nenhuma notícia publicada.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar Info Section - Takes 2 columns (40%) */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm text-muted-foreground">
              {semedInfo ? (
                <div dangerouslySetInnerHTML={{ __html: semedInfo.content }} />
              ) : (
                <p>Informações institucionais não cadastradas.</p>
              )}
              <div className="mt-4 pt-4 border-t">
                <Link
                  to="/publico/estrutura"
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Conheça nossa estrutura organizacional →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Facebook className="h-5 w-5" />
                Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 bg-muted/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 overflow-hidden">
                    <img
                      src="https://img.usecurling.com/i?q=school&shape=outline"
                      className="w-full h-full object-cover"
                      alt="Logo"
                    />
                  </div>
                  <div>
                    <p className="font-bold">
                      {settings.educationSecretaryName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @semed_oficial
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    className="ml-auto bg-blue-600 hover:bg-blue-700"
                  >
                    Seguir
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <img
                    src="https://img.usecurling.com/p/300/300?q=school%20event"
                    className="rounded-md w-full h-24 object-cover hover:opacity-90 cursor-pointer"
                    alt="Post 1"
                  />
                  <img
                    src="https://img.usecurling.com/p/300/300?q=students%20learning"
                    className="rounded-md w-full h-24 object-cover hover:opacity-90 cursor-pointer"
                    alt="Post 2"
                  />
                  <img
                    src="https://img.usecurling.com/p/300/300?q=teacher"
                    className="rounded-md w-full h-24 object-cover hover:opacity-90 cursor-pointer"
                    alt="Post 3"
                  />
                  <img
                    src="https://img.usecurling.com/p/300/300?q=classroom"
                    className="rounded-md w-full h-24 object-cover hover:opacity-90 cursor-pointer"
                    alt="Post 4"
                  />
                </div>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" /> Facebook
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" /> Instagram
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documentos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeDocuments.length > 0 ? (
                <ul className="space-y-4">
                  {activeDocuments.map((doc) => (
                    <li key={doc.id} className="group">
                      <a
                        href={doc.driveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 min-w-[4px] h-4 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                          <div>
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                              {doc.documentNumber}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {doc.summary}
                            </p>
                            <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                              {format(parseISO(doc.publishDate), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                  <li>
                    <Link
                      to="/publico/documentos"
                      className="text-xs text-primary hover:underline flex items-center justify-center mt-4"
                    >
                      Ver todos os documentos
                    </Link>
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum documento recente.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
