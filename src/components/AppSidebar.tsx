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
import {
  BookOpen,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School,
  Settings,
  Users,
  FileText,
  UserCircle,
  Shield,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useUserStore from '@/stores/useUserStore'

export function AppSidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const { currentUser, logout } = useUserStore()

  const menuItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Escolas',
      url: '/escolas',
      icon: School,
    },
    {
      title: 'Pessoas',
      icon: Users,
      items: [
        { title: 'Alunos', url: '/pessoas/alunos' },
        { title: 'Professores', url: '/pessoas/professores' },
      ],
    },
    {
      title: 'Acadêmico',
      icon: BookOpen,
      items: [{ title: 'Turmas', url: '/academico/turmas' }],
    },
    {
      title: 'Avaliação',
      icon: GraduationCap,
      url: '/avaliacao',
    },
    {
      title: 'Relatórios',
      icon: FileText,
      url: '/relatorios',
    },
    {
      title: 'Configurações',
      icon: Settings,
      items: [
        { title: 'Geral', url: '/configuracoes' },
        { title: 'Usuários', url: '/configuracoes/usuarios' },
      ],
    },
  ]

  // Filter menu items based on role (simple mock implementation)
  // In a real app, this would be more robust
  const filteredMenuItems = menuItems
    .map((item) => {
      if (
        item.title === 'Configurações' &&
        currentUser?.role !== 'admin' &&
        currentUser?.role !== 'supervisor'
      ) {
        // Hide users menu for non-admins/supervisors if needed,
        // but here we show it and let the page handle access denied for better UX or hide specific subitems
        return {
          ...item,
          items: item.items?.filter((sub) => sub.title !== 'Usuários'),
        }
      }
      return item
    })
    .filter((item) => {
      // Allow settings to show up but empty if filtered out completely?
      // For simplicity in this demo, we just keep it.
      return true
    })

  // Actually, let's just show 'Usuários' link for everyone for demo visibility,
  // and the page itself shows "Access Denied" if not authorized.
  // But purely for UI clean-up:
  const displayItems = menuItems.map((item) => {
    if (item.title === 'Configurações') {
      return {
        ...item,
        items:
          currentUser?.role === 'admin' || currentUser?.role === 'supervisor'
            ? item.items
            : item.items?.filter((i) => i.title !== 'Usuários'),
      }
    }
    return item
  })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <School className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">EduGestão</span>
            <span className="text-xs text-muted-foreground">
              Municipal v1.0
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {displayItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items && item.items.length > 0 ? (
                    <div className="space-y-1">
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </div>
                      <div className="pl-4 space-y-1 group-data-[collapsible=icon]:hidden">
                        {item.items.map((subItem) => (
                          <SidebarMenuButton
                            key={subItem.url}
                            asChild
                            isActive={pathname === subItem.url}
                            tooltip={subItem.title}
                          >
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        ))}
                      </div>
                    </div>
                  ) : !item.items ? (
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url!}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={`https://img.usecurling.com/ppl/thumbnail?seed=${currentUser?.id}`}
                    alt="User"
                  />
                  <AvatarFallback className="rounded-lg">
                    {currentUser?.name.substring(0, 2).toUpperCase() || 'US'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {currentUser?.name || 'Usuário'}
                  </span>
                  <span className="truncate text-xs">
                    {currentUser?.email || 'email@edu.gov'}
                  </span>
                </div>
                <LogOut className="ml-auto size-4" onClick={logout} />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
