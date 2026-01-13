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
  Bell,
  Database,
  Mail,
  FileCheck,
  Clock,
  CalendarCheck,
  ArrowRight,
  UserCog,
  Download,
  AlertTriangle,
  RefreshCcw,
  UserPlus,
  UsersRound,
  BookMarked,
  Presentation,
  ClipboardCheck,
  Award,
  Target,
  ChevronRight,
  Sparkles,
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
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import useAlertStore from '@/stores/useAlertStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
    title: 'Alertas',
    url: '/alertas',
    icon: Bell,
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
    icon: GraduationCap,
  },
  {
    title: 'Professores',
    url: '/pessoas/professores',
    icon: Presentation,
  },
  {
    title: 'Documentos Escolares',
    url: '/documentos',
    icon: FileText,
  },
  {
    title: 'Transferências',
    url: '/pessoas/transferencias',
    icon: ArrowRight,
  },
  {
    title: 'Funcionários',
    url: '/pessoas/funcionarios',
    icon: UserCog,
  },
]

const academicItems = [
  {
    title: 'Etapas de Ensino e Séries',
    url: '/academico/cursos',
    icon: BookOpen,
  },
  {
    title: 'Turmas',
    url: '/academico/turmas',
    icon: UsersRound,
  },
  {
    title: 'Diário de Classe',
    url: '/academico/diario',
    icon: BookMarked,
  },
  {
    title: 'Planejamento de Aulas',
    url: '/academico/planejamento',
    icon: PenTool,
  },
  {
    title: 'Conselho de Classe',
    url: '/academico/conselho-classe',
    icon: Users,
  },
  {
    title: 'Lançamento de Notas',
    url: '/avaliacao/lancamento',
    icon: ClipboardCheck,
  },
  {
    title: 'Análise e Comparação',
    url: '/academico/analise-avaliacoes',
    icon: Target,
  },
  {
    title: 'Regras de Avaliação',
    url: '/academico/regras-avaliacao',
    icon: Award,
  },
  {
    title: 'Tipos de Avaliação',
    url: '/academico/tipos-avaliacao',
    icon: ClipboardList,
  },
]

const reportsItems = [
  {
    title: 'Relatórios Educacionais',
    url: '/relatorios',
    icon: PieChart,
  },
]

const communicationItems = [
  {
    title: 'Notificações',
    url: '/comunicacao',
    icon: Mail,
  },
]

const secretariatItems = [
  {
    title: 'Protocolos',
    url: '/secretaria/protocolos',
    icon: FileCheck,
  },
  {
    title: 'Fila de Atendimento',
    url: '/secretaria/fila',
    icon: Clock,
  },
  {
    title: 'Agendamentos',
    url: '/secretaria/agendamentos',
    icon: CalendarCheck,
  },
]

const enrollmentItems = [
  {
    title: 'Pré-Matrícula',
    url: '/matriculas/pre-matricula',
    icon: UserPlus,
  },
  {
    title: 'Rematrícula',
    url: '/matriculas/rematricula',
    icon: RefreshCcw,
  },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { userData, logout } = useAuth()
  const { unreadCount } = useAlertStore()

  const isActive = (url: string) => pathname.startsWith(url)

  const canManageWebsite =
    userData?.role === 'Admin' || userData?.role === 'Supervisor'

  return (
    <Sidebar aria-label="Menu de navegacao principal">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3" role="banner">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-sidebar-background flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              EduCanet
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
              Gestão Escolar
            </span>
          </div>
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
                    <Link to={item.url} className="flex justify-between group/item" aria-current={isActive(item.url) ? 'page' : undefined}>
                      <div className="flex items-center gap-3">
                        {isActive(item.url) ? (
                          <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-blue-600/20">
                            <item.icon className="h-5 w-5 text-primary" />
                          </div>
                        ) : (
                          <item.icon className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                        )}
                        <span>{item.title}</span>
                      </div>
                      {item.title === 'Alertas' && unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="h-5 px-1.5 text-[10px] animate-pulse"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-600 font-semibold">Pessoas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {peopleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-3 group/item" aria-current={isActive(item.url) ? 'page' : undefined}>
                      {isActive(item.url) ? (
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                          <item.icon className="h-5 w-5 text-blue-600" />
                        </div>
                      ) : (
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover/item:text-blue-600 transition-colors" />
                      )}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-600 font-semibold">Acadêmico</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {academicItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-3 group/item" aria-current={isActive(item.url) ? 'page' : undefined}>
                      {isActive(item.url) ? (
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                          <item.icon className="h-5 w-5 text-purple-600" />
                        </div>
                      ) : (
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover/item:text-purple-600 transition-colors" />
                      )}
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
                    <Link to="/configuracoes/site/conteudo" className="flex items-center gap-3 group/item">
                      {isActive('/configuracoes/site/conteudo') ? (
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-blue-600/20">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                      ) : (
                        <Globe className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                      )}
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
                    <Link to="/configuracoes/site/noticias" className="flex items-center gap-3 group/item">
                      {isActive('/configuracoes/site/noticias') ? (
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-blue-600/20">
                          <Newspaper className="h-5 w-5 text-primary" />
                        </div>
                      ) : (
                        <Newspaper className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                      )}
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
                    <Link to="/configuracoes/site/documentos" className="flex items-center gap-3 group/item">
                      {isActive('/configuracoes/site/documentos') ? (
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-blue-600/20">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                      )}
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
                    <Link to={item.url} className="flex items-center gap-3 group/item" aria-current={isActive(item.url) ? 'page' : undefined}>
                      {isActive(item.url) ? (
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                          <item.icon className="h-5 w-5 text-blue-600" />
                        </div>
                      ) : (
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover/item:text-blue-600 transition-colors" />
                      )}
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
                    !isActive('/configuracoes/site') &&
                    !isActive('/configuracoes/backup') &&
                    !isActive('/configuracoes/educacenso') &&
                    !isActive('/configuracoes/inconsistencias')
                  }
                  tooltip="Configurações"
                >
                  <Link to="/configuracoes" className="flex items-center gap-3 group/item">
                    {isActive('/configuracoes') &&
                    !isActive('/configuracoes/site') &&
                    !isActive('/configuracoes/backup') &&
                    !isActive('/configuracoes/educacenso') &&
                    !isActive('/configuracoes/inconsistencias') ? (
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-blue-600/20">
                        <Settings className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <Settings className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                    )}
                    <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {userData?.role === 'Admin' && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/configuracoes/educacenso')}
                      tooltip="Exportação Educacenso"
                    >
                      <Link to="/configuracoes/educacenso" className="flex items-center gap-3 group/item">
                        {isActive('/configuracoes/educacenso') ? (
                          <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-blue-600/20">
                            <Download className="h-5 w-5 text-primary" />
                          </div>
                        ) : (
                          <Download className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                        )}
                        <span>Exportar Educacenso</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/configuracoes/inconsistencias')}
                      tooltip="Relatório de Inconsistências"
                    >
                      <Link to="/configuracoes/inconsistencias" className="flex items-center gap-3 group/item">
                        {isActive('/configuracoes/inconsistencias') ? (
                          <div className="p-1.5 rounded-md bg-gradient-to-br from-orange-500/20 to-red-600/20">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                          </div>
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-muted-foreground group-hover/item:text-orange-600 transition-colors" />
                        )}
                        <span>Inconsistências</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/configuracoes/backup')}
                      tooltip="Backup e Restauração"
                    >
                      <Link to="/configuracoes/backup" className="flex items-center gap-3 group/item">
                        {isActive('/configuracoes/backup') ? (
                          <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-blue-600/20">
                            <Database className="h-5 w-5 text-primary" />
                          </div>
                        ) : (
                          <Database className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                        )}
                        <span>Backup de Dados</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/configuracoes/supabase-test')}
                      tooltip="Teste Supabase"
                    >
                      <Link to="/configuracoes/supabase-test" className="flex items-center gap-3 group/item">
                        {isActive('/configuracoes/supabase-test') ? (
                          <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-blue-600/20">
                            <Database className="h-5 w-5 text-primary" />
                          </div>
                        ) : (
                          <Database className="h-5 w-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                        )}
                        <span>Teste Supabase</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-indigo-600 font-semibold">Comunicação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communicationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-3 group/item" aria-current={isActive(item.url) ? 'page' : undefined}>
                      {isActive(item.url) ? (
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
                          <item.icon className="h-5 w-5 text-indigo-600" />
                        </div>
                      ) : (
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover/item:text-indigo-600 transition-colors" />
                      )}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-indigo-600 font-semibold">Secretaria</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secretariatItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-3 group/item" aria-current={isActive(item.url) ? 'page' : undefined}>
                      {isActive(item.url) ? (
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-500/20 to-indigo-600/20">
                          <item.icon className="h-5 w-5 text-indigo-600" />
                        </div>
                      ) : (
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover/item:text-indigo-600 transition-colors" />
                      )}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-green-600 font-semibold">Matrículas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {enrollmentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-3 group/item" aria-current={isActive(item.url) ? 'page' : undefined}>
                      {isActive(item.url) ? (
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-green-500/20 to-green-600/20">
                          <item.icon className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover/item:text-green-600 transition-colors" />
                      )}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-primary/30 ring-offset-2 ring-offset-sidebar-background">
              <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-semibold">
                {userData?.email?.substring(0, 2).toUpperCase() || 'AD'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col overflow-hidden flex-1">
            <span className="text-sm font-semibold truncate">
              {userData?.email?.split('@')[0] || 'Usuário'}
            </span>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary hover:bg-primary/30"
              >
                {userData?.role || 'Admin'}
              </Badge>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={async () => {
            const result = await logout()
            if (result.success) {
              navigate('/login')
            }
          }}
        >
          <LogOut className="mr-2 h-5 w-5" />
          <span>Sair do Sistema</span>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
