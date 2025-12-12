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
      {/* Header - Increased height */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-24 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/5 p-1">
                {settings.municipalityLogo ? (
                  <img
                    src={settings.municipalityLogo}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <School className="h-10 w-10 text-primary" />
                )}
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-base font-bold leading-tight text-primary uppercase tracking-wide">
                  {settings.educationSecretaryName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {settings.municipalityName}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.path)
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Serviços <ChevronDown className="h-4 w-4" />
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

            <Link to="/login">
              <Button size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Acesso Restrito
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-b bg-background p-4 animate-slide-down">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium ${
                    isActive(item.path)
                      ? 'text-primary'
                      : 'text-muted-foreground'
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
                <Button className="w-full gap-2">
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
      <footer className="border-t bg-muted/30">
        <div className="container py-8 px-4 md:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <School className="h-5 w-5 text-primary" />
                <span className="font-bold">{settings.municipalityName}</span>
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
