import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'

export default function Layout() {
  const location = useLocation()

  // Routes that don't use the main layout (e.g., Login, Public Portal)
  const isPublicRoute =
    location.pathname === '/' || location.pathname.startsWith('/publico')

  if (isPublicRoute) {
    return (
      <main className="min-h-screen w-full bg-background">
        <Outlet />
      </main>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-8 md:pt-6 bg-secondary/30 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
