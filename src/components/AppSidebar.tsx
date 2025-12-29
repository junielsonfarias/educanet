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
    icon: Users,
  },
  {
    title: 'Professores',
    url: '/pessoas/professores',
    icon: GraduationCap,
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
    title: 'Conselho de Classe',
    url: '/academico/conselho-classe',
    icon: Users,
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

export function AppSidebar() {
  const { pathname } = useLocation()
  const { currentUser, logout } = useUserStore()
  const { unreadCount } = useAlertStore()

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
                    <Link to={item.url} className="flex justify-between group/item">
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
                    <Link to={item.url} className="flex items-center gap-3 group/item">
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
                    <Link to={item.url} className="flex items-center gap-3 group/item">
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
                    <Link to={item.url} className="flex items-center gap-3 group/item">
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
              {currentUser?.role === 'admin' && (
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
                    <Link to={item.url} className="flex items-center gap-3 group/item">
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
                    <Link to={item.url} className="flex items-center gap-3 group/item">
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
          <LogOut className="mr-2 h-5 w-5" /> Sair
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
