import { Bell, Moon, Sun, Search, Monitor, Check, ChevronRight, Home, Settings, LogOut, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Link, useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import useAlertStore from '@/stores/useAlertStore'
import { GlobalSearch } from './GlobalSearch'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { userData, logout } = useAuth()
  const { unreadCount } = useAlertStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const getBreadcrumbs = (path: string): { label: string; href?: string }[] => {
    const crumbs: { label: string; href?: string }[] = [{ label: 'Início', href: '/dashboard' }]

    if (path.includes('/dashboard/estrategico')) {
      crumbs.push({ label: 'Painel Estratégico' })
    } else if (path.includes('/dashboard')) {
      crumbs.push({ label: 'Dashboard' })
    } else if (path.includes('/escolas')) {
      crumbs.push({ label: 'Escolas' })
    } else if (path.includes('/pessoas/alunos')) {
      crumbs.push({ label: 'Pessoas', href: '/pessoas/alunos' })
      crumbs.push({ label: 'Alunos' })
    } else if (path.includes('/pessoas/professores')) {
      crumbs.push({ label: 'Pessoas', href: '/pessoas/alunos' })
      crumbs.push({ label: 'Professores' })
    } else if (path.includes('/pessoas/transferencias')) {
      crumbs.push({ label: 'Pessoas', href: '/pessoas/alunos' })
      crumbs.push({ label: 'Transferências' })
    } else if (path.includes('/academico/turmas')) {
      crumbs.push({ label: 'Acadêmico', href: '/academico/cursos' })
      crumbs.push({ label: 'Turmas' })
    } else if (path.includes('/academico/diario')) {
      crumbs.push({ label: 'Acadêmico', href: '/academico/cursos' })
      crumbs.push({ label: 'Diário de Classe' })
    } else if (path.includes('/academico/cursos')) {
      crumbs.push({ label: 'Acadêmico' })
      crumbs.push({ label: 'Etapas de Ensino' })
    } else if (path.includes('/academico')) {
      crumbs.push({ label: 'Acadêmico' })
    } else if (path.includes('/avaliacao')) {
      crumbs.push({ label: 'Avaliação' })
    } else if (path.includes('/matriculas')) {
      crumbs.push({ label: 'Matrículas' })
    } else if (path.includes('/secretaria')) {
      crumbs.push({ label: 'Secretaria' })
    } else if (path.includes('/relatorios')) {
      crumbs.push({ label: 'Relatórios' })
    } else if (path.includes('/configuracoes')) {
      crumbs.push({ label: 'Configurações' })
    } else if (path.includes('/alertas')) {
      crumbs.push({ label: 'Alertas' })
    } else if (path.includes('/comunicacao')) {
      crumbs.push({ label: 'Comunicação' })
    } else if (path.includes('/documentos')) {
      crumbs.push({ label: 'Documentos' })
    } else if (path.includes('/calendario')) {
      crumbs.push({ label: 'Calendário' })
    }

    return crumbs
  }

  const breadcrumbs = getBreadcrumbs(location.pathname)

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm transition-all duration-300">
      <SidebarTrigger className="-ml-1" />
      <div className="hidden md:flex items-center gap-1">
        <div className="h-4 w-px bg-border mx-2" />
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.label} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              {index === 0 ? (
                <Link
                  to={crumb.href || '/dashboard'}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                </Link>
              ) : crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative hidden md:block w-64">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground bg-background"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="inline-flex">Buscar...</span>
            <span className="ml-auto text-xs border bg-muted px-1 rounded">
              ⌘K
            </span>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary/10 transition-colors"
          onClick={() => navigate('/alertas')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <>
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px] font-bold"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </>
          )}
          <span className="sr-only">Notificações</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Claro</span>
              {mounted && theme === 'light' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Escuro</span>
              {mounted && theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>Sistema</span>
              {mounted && theme === 'system' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/30 transition-all">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-semibold text-sm">
                  {userData?.email?.substring(0, 2).toUpperCase() || 'AD'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-semibold">
                    {userData?.email?.substring(0, 2).toUpperCase() || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">
                    {userData?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userData?.email || 'admin@escola.com'}
                  </p>
                  <Badge
                    variant="secondary"
                    className="w-fit text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary mt-1"
                  >
                    {userData?.role || 'Admin'}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/configuracoes" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Meu Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/configuracoes" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              onClick={async () => {
                const result = await logout()
                if (result.success) {
                  navigate('/login')
                }
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sair do Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
