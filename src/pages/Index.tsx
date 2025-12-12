import {
  FileText,
  Newspaper,
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
          <School className="h-6 w-6 text-primary" />
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
        {/* Main Content Area (News + Documents) - Takes 3 columns (60%) */}
        <div className="lg:col-span-3 space-y-12">
          {/* News Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Últimas Notícias</h2>
              </div>
              <Link to="/publico/noticias">
                <Button
                  variant="ghost"
                  className="text-primary hover:underline"
                >
                  Ver todas
                </Button>
              </Link>
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

          {/* Documents Section (Moved here) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Documentos Recentes</h2>
              </div>
              <Link to="/publico/documentos">
                <Button
                  variant="ghost"
                  className="text-primary hover:underline"
                >
                  Ver todos
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="p-0">
                {activeDocuments.length > 0 ? (
                  <ul className="divide-y">
                    {activeDocuments.map((doc) => (
                      <li
                        key={doc.id}
                        className="group p-4 hover:bg-muted/30 transition-colors"
                      >
                        <a
                          href={doc.driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <div className="flex items-start gap-4">
                            <div className="mt-1 min-w-[4px] h-full self-stretch rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-bold group-hover:text-primary transition-colors">
                                  {doc.documentNumber}
                                </p>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  {format(
                                    parseISO(doc.publishDate),
                                    'dd/MM/yyyy',
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {doc.summary}
                              </p>
                              <Badge
                                variant="outline"
                                className="mt-2 text-[10px] font-normal"
                              >
                                {doc.organ}
                              </Badge>
                            </div>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-muted-foreground italic">
                    Nenhum documento recente.
                  </div>
                )}
              </CardContent>
            </Card>
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

          {/* Enhanced Facebook Feed */}
          <Card className="overflow-hidden border-2 border-blue-100 shadow-md">
            <CardHeader className="bg-[#1877F2] text-white">
              <CardTitle className="flex items-center gap-2">
                <Facebook className="h-6 w-6" />
                Fique Conectado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-gradient-to-b from-[#1877F2]/10 to-background p-6">
                <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
                  <div className="h-16 w-16 rounded-full border-4 border-[#1877F2]/20 overflow-hidden shrink-0">
                    <img
                      src={`https://img.usecurling.com/i?q=school&shape=outline&color=blue`}
                      className="w-full h-full object-cover"
                      alt="Logo"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">
                      {settings.educationSecretaryName}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                      <Facebook className="h-3 w-3" />
                      {settings.facebookHandle || '@semed_oficial'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#1877F2] hover:bg-[#166fe5] text-white shrink-0"
                  >
                    Seguir
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer"
                    >
                      <img
                        src={`https://img.usecurling.com/p/400/400?q=school%20activity%20${i}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={`Post ${i}`}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Facebook className="text-white h-8 w-8 drop-shadow-lg" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-[#1877F2] text-[#1877F2] hover:bg-[#1877F2] hover:text-white"
                  >
                    <Facebook className="h-4 w-4" /> Ver Página no Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-pink-500 text-pink-600 hover:bg-pink-500 hover:text-white"
                  >
                    <Instagram className="h-4 w-4" /> Instagram
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
