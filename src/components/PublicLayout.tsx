import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, X, School, LogIn } from 'lucide-react'
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
    { label: 'Documentos', path: '/publico/documentos' },
    { label: 'Boletim Escolar', path: '/publico/boletim' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                {settings.municipalityLogo ? (
                  <img
                    src={settings.municipalityLogo}
                    alt="Logo"
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <School className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-sm font-bold leading-tight text-primary">
                  {settings.educationSecretaryName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {settings.municipalityName}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
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
          <div className="md:hidden border-b bg-background p-4">
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
                <li>
                  <Link to="/" className="hover:underline">
                    Início
                  </Link>
                </li>
                <li>
                  <Link to="/publico/documentos" className="hover:underline">
                    Documentos
                  </Link>
                </li>
                <li>
                  <Link to="/publico/boletim" className="hover:underline">
                    Boletim
                  </Link>
                </li>
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
            © {new Date().getFullYear()} {settings.municipalityName}. Todos os
            direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
