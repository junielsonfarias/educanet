import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, X, School, LogIn, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useSettingsStore from '@/stores/useSettingsStore'

export default function PublicLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { settings } = useSettingsStore()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { label: 'Início', path: '/' },
    { label: 'Notícias', path: '/publico/noticias' },
    { label: 'Escolas', path: '/publico/escolas' },
    { label: 'Dados QEdu', path: '/publico/dados-qedu' },
    { label: 'Estrutura', path: '/publico/estrutura' },
    { label: 'Documentos', path: '/publico/documentos' },
  ]

  // Filter active quick links
  const activeQuickLinks = (settings.quickLinks || [])
    .filter((l) => l.active)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header - Estrutura em duas linhas */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container">
          {/* Primeira linha: Logo1 | Nome da Secretaria _ SEMED | Logo2 (oculta em mobile) */}
          <div className="hidden sm:block border-b bg-muted/30">
            <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 gap-2 sm:gap-4">
              {/* Logo 1 - Logo do Município */}
              <div className="flex items-center w-[80px] sm:w-[120px] md:w-[150px] lg:w-[180px] justify-start flex-shrink-0">
                {settings.municipalityLogo ? (
                  <img
                    src={settings.municipalityLogo}
                    alt="Logo do Município"
                    className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto object-contain max-w-full"
                  />
                ) : (
                  <div className="flex h-12 sm:h-16 md:h-20 lg:h-24 w-12 sm:w-16 md:w-20 lg:w-24 items-center justify-center rounded-xl bg-primary/5 p-1">
                    <School className="h-6 sm:h-8 md:h-10 lg:h-14 w-6 sm:w-8 md:w-10 lg:w-14 text-primary" />
                  </div>
                )}
              </div>

              {/* Nome da Secretaria - Centralizado em duas linhas */}
              <div className="flex-1 flex items-center justify-center px-1 sm:px-2 md:px-4 min-w-0">
                <div className="text-center w-full space-y-0.5 sm:space-y-1">
                  {/* Primeira linha: Secretaria Municipal de Educação - SEMED (fonte maior) */}
                  <div className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-primary uppercase tracking-tight sm:tracking-wide leading-tight break-words">
                    {settings.educationSecretaryName || 'Secretaria Municipal de Educação'} - SEMED
                  </div>
                  {/* Segunda linha: Prefeitura Municipal de... (fonte menor) */}
                  <div className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg text-muted-foreground font-semibold break-words">
                    {settings.municipalityName || 'Prefeitura Municipal'}
                  </div>
                </div>
              </div>

              {/* Logo 2 - Logo da Secretaria */}
              <div className="flex items-center w-[80px] sm:w-[120px] md:w-[150px] lg:w-[180px] justify-end flex-shrink-0">
                {settings.secretaryLogo ? (
                  <img
                    src={settings.secretaryLogo}
                    alt="Logo da Secretaria"
                    className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto object-contain max-w-full"
                  />
                ) : (
                  <div className="flex h-12 sm:h-16 md:h-20 lg:h-24 w-12 sm:w-16 md:w-20 lg:w-24 items-center justify-center rounded-xl bg-primary/5 p-1">
                    <School className="h-6 sm:h-8 md:h-10 lg:h-14 w-6 sm:w-8 md:w-10 lg:w-14 text-primary" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logo 1 para Mobile - Apenas em telas pequenas */}
          <div className="sm:hidden border-b bg-muted/30 py-4 px-4">
            <div className="flex items-center justify-center">
              {settings.municipalityLogo ? (
                <img
                  src={settings.municipalityLogo}
                  alt="Logo do Município"
                  className="h-24 w-auto object-contain max-w-[200px]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-primary/5 p-1">
                  <School className="h-14 w-14 text-primary" />
                </div>
              )}
            </div>
          </div>

          {/* Segunda linha: Menu de Navegação */}
          <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-3 lg:gap-4 xl:gap-6 flex-1 flex-wrap">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative group text-xs lg:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    isActive(item.path)
                      ? 'text-primary font-bold'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 ${
                    isActive(item.path) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </Link>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="gap-1 text-xs lg:text-sm font-medium text-muted-foreground hover:text-primary h-auto py-1"
                  >
                    Serviços <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/publico/portal-aluno">Portal do Aluno</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/publico/portal-servidor">Portal do Servidor</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/publico/boletim">Boletim Escolar</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/publico/calendario">Calendário Acadêmico</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="ml-auto">
                <Link to="/login">
                  <Button 
                    size="sm" 
                    className="gap-1 lg:gap-2 text-xs lg:text-sm h-8 lg:h-9 px-2 lg:px-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <LogIn className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="hidden lg:inline">Acesso Restrito</span>
                    <span className="lg:hidden">Acesso</span>
                  </Button>
                </Link>
              </div>
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden flex items-center justify-center p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-b bg-background p-3 sm:p-4 animate-slide-down">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground hover:text-primary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
              ))}
              <div className="h-px bg-border my-2" />
              <Link
                to="/publico/portal-aluno"
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground"
              >
                Portal do Aluno
              </Link>
              <Link
                to="/publico/portal-servidor"
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground"
              >
                Portal do Servidor
              </Link>
              <Link
                to="/publico/calendario"
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground"
              >
                Calendário
              </Link>
              <div className="h-px bg-border my-2" />
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <LogIn className="h-4 w-4" />
                  Acesso Restrito
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-b from-muted/50 via-muted/30 to-background">
        <div className="container py-8 px-4 md:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
                  <School className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">{settings.municipalityName}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {settings.educationSecretaryName}
                <br />
                Compromisso com a educação de qualidade.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {activeQuickLinks.length > 0 ? (
                  activeQuickLinks.map((link) => (
                    <li key={link.id}>
                      <Link to={link.url} className="hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <Link to="/" className="hover:underline">
                        Início
                      </Link>
                    </li>
                    <li>
                      <Link to="/publico/noticias" className="hover:underline">
                        Notícias
                      </Link>
                    </li>
                    <li>
                      <Link to="/publico/escolas" className="hover:underline">
                        Nossas Escolas
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/publico/dados-qedu"
                        className="hover:underline"
                      >
                        Dados QEdu
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/publico/documentos"
                        className="hover:underline"
                      >
                        Documentos
                      </Link>
                    </li>
                    <li>
                      <Link to="/publico/boletim" className="hover:underline">
                        Boletim
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <p className="text-sm text-muted-foreground">
                Email: contato@educacao.gov.br
                <br />
                Telefone: (00) 1234-5678
              </p>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-xs text-muted-foreground">
            {settings.footerText ||
              `© ${new Date().getFullYear()} ${settings.municipalityName}. Todos os direitos reservados.`}
          </div>
        </div>
      </footer>
    </div>
  )
}
