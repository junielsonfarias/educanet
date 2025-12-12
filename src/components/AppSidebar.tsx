import {
  Calendar,
  LayoutDashboard,
  School,
  Users,
  BookOpen,
  Settings,
  FileText,
  LogOut,
  GraduationCap,
  Globe,
  Newspaper,
  PieChart,
  BarChart,
  ClipboardList,
  PenTool,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Link, useLocation } from 'react-router-dom'
import useUserStore from '@/stores/useUserStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Painel Estratégico',
    url: '/dashboard/estrategico',
    icon: BarChart,
  },
  {
    title: 'Escolas',
    url: '/escolas',
    icon: School,
  },
  {
    title: 'Calendário',
    url: '/calendario',
    icon: Calendar,
  },
]

const peopleItems = [
  {
    title: 'Alunos',
    url: '/pessoas/alunos',
    icon: Users,
  },
  {
    title: 'Professores',
    url: '/pessoas/professores',
    icon: GraduationCap,
  },
]

const academicItems = [
  {
    title: 'Cursos e Séries',
    url: '/academico/cursos',
    icon: BookOpen,
  },
  {
    title: 'Turmas',
    url: '/academico/turmas',
    icon: Users,
  },
  {
    title: 'Diário de Classe',
    url: '/academico/diario',
    icon: ClipboardList,
  },
  {
    title: 'Planejamento de Aulas',
    url: '/academico/planejamento',
    icon: PenTool,
  },
  {
    title: 'Lançamento de Notas',
    url: '/avaliacao/lancamento',
    icon: GraduationCap,
  },
  {
    title: 'Análise e Comparação',
    url: '/academico/analise-avaliacoes',
    icon: BarChart,
  },
  {
    title: 'Regras de Avaliação',
    url: '/academico/regras-avaliacao',
    icon: FileText,
  },
  {
    title: 'Tipos de Avaliação',
    url: '/academico/tipos-avaliacao',
    icon: FileText,
  },
]

const reportsItems = [
  {
    title: 'Relatórios Educacionais',
    url: '/relatorios',
    icon: PieChart,
  },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const { currentUser, logout } = useUserStore()

  const isActive = (url: string) => pathname.startsWith(url)

  const canManageWebsite =
    currentUser?.role === 'admin' || currentUser?.role === 'supervisor'

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <GraduationCap className="h-6 w-6" />
          <span>EduGestão</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Pessoas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {peopleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Acadêmico</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {academicItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canManageWebsite && (
          <SidebarGroup>
            <SidebarGroupLabel>Site Institucional</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/configuracoes/site/conteudo')}
                    tooltip="Conteúdo"
                  >
                    <Link to="/configuracoes/site/conteudo">
                      <Globe className="h-4 w-4" />
                      <span>Conteúdo & Info</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/configuracoes/site/noticias')}
                    tooltip="Notícias"
                  >
                    <Link to="/configuracoes/site/noticias">
                      <Newspaper className="h-4 w-4" />
                      <span>Notícias</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/configuracoes/site/documentos')}
                    tooltip="Documentos"
                  >
                    <Link to="/configuracoes/site/documentos">
                      <FileText className="h-4 w-4" />
                      <span>Documentos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={
                    isActive('/configuracoes') &&
                    !isActive('/configuracoes/site')
                  }
                  tooltip="Configurações"
                >
                  <Link to="/configuracoes">
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {currentUser?.name.substring(0, 2).toUpperCase() || 'AD'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">
              {currentUser?.name || 'Admin'}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {currentUser?.email || 'admin@escola.com'}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
