import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Dashboard from './pages/Dashboard'
import SchoolsList from './pages/schools/SchoolsList'
import StudentsList from './pages/people/StudentsList'
import ClassesList from './pages/academic/ClassesList'
import ReportCard from './pages/public/ReportCard'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import UsersList from './pages/settings/UsersList'
import { UserProvider } from './stores/useUserStore'

const App = () => (
  <UserProvider>
    <BrowserRouter
      future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/publico/boletim" element={<ReportCard />} />

          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/escolas" element={<SchoolsList />} />
            <Route path="/escolas/:id" element={<SchoolsList />} />
            <Route path="/pessoas/alunos" element={<StudentsList />} />
            <Route path="/pessoas/professores" element={<NotFound />} />
            <Route path="/academico/turmas" element={<ClassesList />} />
            <Route path="/avaliacao" element={<NotFound />} />
            <Route path="/relatorios" element={<NotFound />} />
            <Route path="/configuracoes" element={<NotFound />} />
            <Route path="/configuracoes/usuarios" element={<UsersList />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </UserProvider>
)

export default App
