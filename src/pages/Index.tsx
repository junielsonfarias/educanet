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
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import usePublicContentStore from '@/stores/usePublicContentStore'
import { usePublicContentStore as useSupabasePublicContentStore } from '@/stores/usePublicContentStore.supabase'
import { useSettingsStore } from '@/stores/useSettingsStore.supabase'
import { format, parseISO } from 'date-fns'
import { ServiceCard } from '@/lib/mock-data'
import { HeroCarousel } from '@/components/public/HeroCarousel'
import { FacebookFeedModal } from '@/components/public/FacebookFeedModal'
import { InstagramFeedModal } from '@/components/public/InstagramFeedModal'
import { useEffect, useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function InstitutionalHome() {
  // Context store (mantém hero section e configurações)
  const { news: contextNews, documents: contextDocuments, getContent } = usePublicContentStore()
  const { settings, fetchSettings } = useSettingsStore()

  // Supabase store (dados do banco)
  const {
    publishedContents,
    fetchPublishedContents,
    loading
  } = useSupabasePublicContentStore()

  const semedInfo = getContent('semed_info')

  // Buscar configurações e conteúdos publicados do Supabase
  useEffect(() => {
    fetchSettings()
    fetchPublishedContents({
      contentType: 'Noticia',
      limit: 3,
      featuredOnly: false
    })
  }, [])

  // Usar dados do Supabase se disponíveis, senão fallback para context
  const activeNews = useMemo(() => {
    if (publishedContents.length > 0) {
      return publishedContents.slice(0, 3)
    }
    if (!Array.isArray(contextNews)) return []
    return contextNews
      .filter((n) => n && n.active)
      .sort(
        (a, b) =>
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
      )
      .slice(0, 3)
  }, [publishedContents, contextNews])

  const activeDocuments = useMemo(() => {
    if (!Array.isArray(contextDocuments)) return []
    return contextDocuments
      .filter((d) => d && d.active)
      .sort(
        (a, b) =>
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
      )
      .slice(0, 5)
  }, [contextDocuments])

  // Memoizar serviceCards para evitar recálculos
  const serviceCards = useMemo(() => {
    return Array.isArray(settings?.serviceCards) ? settings.serviceCards : []
  }, [settings?.serviceCards])

  // Estado para os modais das redes sociais
  const [facebookModalOpen, setFacebookModalOpen] = useState(false)
  const [instagramModalOpen, setInstagramModalOpen] = useState(false)

  // URLs das redes sociais
  const facebookPageUrl = `https://facebook.com/${((settings.facebookHandle as string) || 'semed_oficial').replace('@', '')}`
  const instagramProfileUrl = `https://instagram.com/${((settings.instagramHandle as string) || (settings.facebookHandle as string) || 'semed_oficial').replace('@', '')}`
  const instagramHandle = (settings.instagramHandle as string) || (settings.facebookHandle as string) || '@semed_oficial'

  // Helper to get icon component
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'UserCircle':
        return UserCircle
      case 'School':
        return School
      case 'Calendar':
        return Calendar
      case 'Map':
        return Map
      default:
        return Star
    }
  }

  // Helper to get color classes
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return { bg: 'bg-blue-100', text: 'text-blue-600' }
      case 'green':
        return { bg: 'bg-green-100', text: 'text-green-600' }
      case 'orange':
        return { bg: 'bg-orange-100', text: 'text-orange-600' }
      case 'purple':
        return { bg: 'bg-purple-100', text: 'text-purple-600' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' }
    }
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-primary/90 px-6 py-16 md:px-12 md:py-24 text-white shadow-2xl min-h-[500px] md:min-h-[600px]">
        {/* Carrossel de Imagens (se habilitado e houver slides) */}
        {settings.heroSection?.enableCarousel &&
        Array.isArray(settings.heroSection?.slides) &&
        settings.heroSection.slides.filter((s) => s && s.active).length > 0 ? (
          <div className="absolute inset-0">
            <HeroCarousel
              slides={settings.heroSection.slides}
              autoPlay={settings.heroSection.autoPlay}
              autoPlayInterval={settings.heroSection.autoPlayInterval}
            />
          </div>
        ) : (
          <>
            {/* Padrão decorativo com círculos */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>
            
            {/* Grid pattern sutil */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            
            {/* Imagem de fundo com overlay (fallback) */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://img.usecurling.com/p/1200/400?q=education&color=blue')] bg-cover bg-center" />
          </>
        )}
        
        <div className="relative z-10 max-w-3xl">
          <Badge
            variant="secondary"
            className="mb-4 bg-white/20 text-white hover:bg-white/30 border-white/30 backdrop-blur-sm transition-all duration-300"
          >
            {settings.heroSection?.badgeText || 'Educação Municipal'}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            {settings.heroSection?.title || settings.educationSecretaryName}
          </h1>
          <p className="text-lg md:text-xl opacity-95 mb-8 max-w-2xl leading-relaxed">
            {settings.heroSection?.description || (
              <>
                Bem-vindo ao portal oficial da educação de{' '}
                <span className="font-semibold">{settings.municipalityName}</span>. Aqui você encontra notícias, serviços e
                transparência sobre a gestão educacional.
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-4">
            {settings.heroSection?.primaryButtonText && settings.heroSection?.primaryButtonLink && (
              <Link to={settings.heroSection.primaryButtonLink}>
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-r from-white to-blue-50 text-primary hover:from-blue-50 hover:to-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  <GraduationCap className="h-5 w-5" />
                  {settings.heroSection.primaryButtonText}
                </Button>
              </Link>
            )}
            {settings.heroSection?.secondaryButtonText && settings.heroSection?.secondaryButtonLink && (
              <Link to={settings.heroSection.secondaryButtonLink}>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 bg-transparent text-white border-2 border-white/50 hover:bg-white hover:text-primary hover:border-white transition-all duration-300 transform hover:scale-105 font-semibold backdrop-blur-sm"
                >
                  <FileText className="h-5 w-5" />
                  {settings.heroSection.secondaryButtonText}
                </Button>
              </Link>
            )}
            {/* Fallback para botões padrão se não configurados */}
            {!settings.heroSection?.primaryButtonText && (
              <>
                <Link to="/publico/boletim">
                  <Button 
                    size="lg" 
                    className="gap-2 bg-gradient-to-r from-white to-blue-50 text-primary hover:from-blue-50 hover:to-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    <GraduationCap className="h-5 w-5" />
                    Consulta de Boletim
                  </Button>
                </Link>
                <Link to="/publico/documentos">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 bg-transparent text-white border-2 border-white/50 hover:bg-white hover:text-primary hover:border-white transition-all duration-300 transform hover:scale-105 font-semibold backdrop-blur-sm"
                  >
                    <FileText className="h-5 w-5" />
                    Documentos Oficiais
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Services Grid (Dynamic) */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
            <School className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Serviços
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(settings.serviceCards || [])
            .filter((c) => c.active)
            .sort((a, b) => a.order - b.order)
            .map((card) => {
              const IconComp = getIcon(card.icon)
              const colors = getColorClasses(card.color)

              return (
                <Link to={card.link} key={card.id}>
                  <Card className="group relative overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-br from-white via-primary/5 to-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4 relative z-10">
                      <div
                        className={`h-16 w-16 rounded-full ${colors.bg} flex items-center justify-center ${colors.text} group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl`}
                      >
                        <IconComp className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{card.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-12 lg:grid-cols-5 container mx-auto px-4">
        {/* Main Content Area (News + Documents) - Takes 3 columns (60%) */}
        <div className="lg:col-span-3 space-y-12">
          {/* News Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
                  <Newspaper className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Últimas Notícias
                </h2>
              </div>
              <Link to="/publico/noticias">
                <Button
                  variant="ghost"
                  className="text-primary hover:bg-primary/10 font-semibold transition-all duration-300"
                >
                  Ver todas <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6">
              {Array.isArray(activeNews) && activeNews.length > 0 ? (
                activeNews
                  .filter((post) => post && post.id)
                  .map((post) => (
                    <Link to={`/publico/noticias/${post.id}`} key={`news-${post.id}`}>
                    <Card className="group overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full bg-gradient-to-br from-white to-primary/5">
                      <div className="flex flex-col md:flex-row h-full">
                        <div className="md:w-1/3 h-48 md:h-auto bg-muted relative overflow-hidden">
                          <img
                            src={
                              post.imageUrl ||
                              'https://img.usecurling.com/p/400/300?q=education'
                            }
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <Badge className="mb-2 bg-gradient-to-r from-primary/10 to-blue-600/10 text-primary border border-primary/20">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(parseISO(post.publishDate), 'dd/MM/yyyy')}
                            </Badge>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                              {post.summary}
                            </p>
                          </div>
                          <span className="text-primary text-sm font-semibold flex items-center group-hover:gap-2 transition-all">
                            Ler mais <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
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
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Documentos Recentes
                </h2>
              </div>
              <Link to="/publico/documentos">
                <Button
                  variant="ghost"
                  className="text-primary hover:bg-primary/10 font-semibold transition-all duration-300"
                >
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="p-0">
                {Array.isArray(activeDocuments) && activeDocuments.length > 0 ? (
                  <ul className="divide-y">
                    {activeDocuments
                      .filter((doc) => doc && doc.id)
                      .map((doc) => (
                        <li
                          key={`doc-${doc.id}`}
                        className="group p-4 hover:bg-muted/30 transition-colors"
                      >
                        <Link
                          to={`/publico/documentos/${doc.id}`}
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
                                className="mt-2 text-[10px] font-normal bg-gradient-to-r from-primary/10 to-blue-600/10 text-primary border border-primary/20"
                              >
                                {doc.organ}
                              </Badge>
                            </div>
                          </div>
                        </Link>
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
          <Card className="bg-gradient-to-br from-white via-primary/5 to-white border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-bold">
                  Informações
                </span>
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
                    {settings.secretaryLogo ? (
                      <img
                        src={settings.secretaryLogo as string}
                        className="w-full h-full object-cover"
                        alt="Logo"
                      />
                    ) : (
                      <img
                        src={`https://img.usecurling.com/i?q=school&shape=outline&color=blue`}
                        className="w-full h-full object-cover"
                        alt="Logo"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">
                      {(settings.educationSecretaryName as string) || 'Secretaria de Educação'}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                      <Facebook className="h-3 w-3" />
                      {(settings.facebookHandle as string) || '@semed_oficial'}
                    </p>
                  </div>
                  <a
                    href={facebookPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="sm"
                      className="bg-[#1877F2] hover:bg-[#166fe5] text-white shrink-0"
                    >
                      Seguir
                    </Button>
                  </a>
                </div>

                {/* Grid de imagens - clicáveis para abrir modal */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <button
                      key={`fb-post-${i}`}
                      onClick={() => setFacebookModalOpen(true)}
                      className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer"
                    >
                      <img
                        src={`https://img.usecurling.com/p/400/400?q=education%20school%20${i}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={`Post ${i}`}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Facebook className="text-white h-8 w-8 drop-shadow-lg" />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-[#1877F2] text-[#1877F2] hover:bg-[#1877F2] hover:text-white"
                    onClick={() => setFacebookModalOpen(true)}
                  >
                    <Facebook className="h-4 w-4" /> Ver Publicações
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-pink-500 text-pink-600 hover:bg-pink-500 hover:text-white"
                    onClick={() => setInstagramModalOpen(true)}
                  >
                    <Instagram className="h-4 w-4" /> Instagram
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal do Facebook Feed */}
      <FacebookFeedModal
        open={facebookModalOpen}
        onOpenChange={setFacebookModalOpen}
        pageUrl={facebookPageUrl}
        pageName={(settings.educationSecretaryName as string) || 'Secretaria de Educação'}
      />

      {/* Modal do Instagram Feed */}
      <InstagramFeedModal
        open={instagramModalOpen}
        onOpenChange={setInstagramModalOpen}
        profileUrl={instagramProfileUrl}
        profileName={(settings.educationSecretaryName as string) || 'Secretaria de Educação'}
        profileHandle={instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`}
      />
    </div>
  )
}

// Componente para exibir conteúdo do slide
function HeroSlideContent({
  slide,
  defaultBadge,
  defaultTitle,
  defaultDescription,
  defaultPrimaryButton,
  defaultPrimaryLink,
  defaultSecondaryButton,
  defaultSecondaryLink,
}: {
  slide?: HeroSlide
  defaultBadge: string
  defaultTitle: string
  defaultDescription: string
  defaultPrimaryButton: string
  defaultPrimaryLink: string
  defaultSecondaryButton: string
  defaultSecondaryLink: string
}) {
  return (
    <>
      {defaultBadge && (
        <Badge
          variant="secondary"
          className="mb-4 bg-white/20 text-white hover:bg-white/30 border-white/30 backdrop-blur-sm transition-all duration-300"
        >
          {defaultBadge}
        </Badge>
      )}
      {slide?.title && (
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
          {slide.title}
        </h1>
      )}
      {slide?.subtitle && (
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white/90">
          {slide.subtitle}
        </h2>
      )}
      {(slide?.description || defaultDescription) && (
        <p className="text-lg md:text-xl opacity-95 mb-8 max-w-2xl leading-relaxed">
          {slide?.description || defaultDescription}
        </p>
      )}
      {(slide?.buttonText || defaultPrimaryButton) && (
        <div className="flex flex-wrap gap-4">
          {slide?.buttonText && slide?.buttonLink ? (
            <Link to={slide.buttonLink}>
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-white to-blue-50 text-primary hover:from-blue-50 hover:to-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                {slide.buttonText}
              </Button>
            </Link>
          ) : (
            <Link to={defaultPrimaryLink}>
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-white to-blue-50 text-primary hover:from-blue-50 hover:to-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <GraduationCap className="h-5 w-5" />
                {defaultPrimaryButton}
              </Button>
            </Link>
          )}
          {defaultSecondaryButton && (
            <Link to={defaultSecondaryLink}>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 bg-transparent text-white border-2 border-white/50 hover:bg-white hover:text-primary hover:border-white transition-all duration-300 transform hover:scale-105 font-semibold backdrop-blur-sm"
              >
                <FileText className="h-5 w-5" />
                {defaultSecondaryButton}
              </Button>
            </Link>
          )}
        </div>
      )}
    </>
  )
}
