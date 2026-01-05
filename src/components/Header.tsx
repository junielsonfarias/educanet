import { Bell, Moon, Sun, Search } from 'lucide-react'
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

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { userData, logout } = useAuth()
  const { unreadCount } = useAlertStore()
  const [searchOpen, setSearchOpen] = useState(false)

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

  const getPageTitle = (path: string) => {
    if (path.includes('dashboard')) return 'Visão Geral'
    if (path.includes('escolas')) return 'Gestão de Escolas'
    if (path.includes('alunos')) return 'Gestão de Alunos'
    if (path.includes('turmas')) return 'Gestão de Turmas'
    if (path.includes('configuracoes')) return 'Configurações'
    if (path.includes('alertas')) return 'Central de Alertas'
    return 'Sistema de Gestão Escolar'
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm transition-all duration-300">
      <SidebarTrigger className="-ml-1" />
      <div className="hidden md:flex items-center gap-2">
        <div className="h-4 w-px bg-border mx-2" />
        <h1 className="text-lg font-semibold text-foreground">
          {getPageTitle(location.pathname)}
        </h1>
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
          className="relative"
          onClick={() => navigate('/alertas')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
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
            <DropdownMenuItem>Claro</DropdownMenuItem>
            <DropdownMenuItem>Escuro</DropdownMenuItem>
            <DropdownMenuItem>Sistema</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <img
                src="https://img.usecurling.com/ppl/thumbnail?gender=female"
                alt="Avatar"
                className="rounded-full object-cover"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userData?.email?.split('@')[0] || 'Usuário'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userData?.email || 'admin@escola.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/configuracoes">Meu Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const result = await logout()
                if (result.success) {
                  navigate('/login')
                }
              }}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
