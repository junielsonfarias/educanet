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

const App = () => (
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
          <Route path="/escolas/:id" element={<SchoolsList />} />{' '}
          {/* Reuse for simplicity in demo */}
          <Route path="/pessoas/alunos" element={<StudentsList />} />
          <Route path="/pessoas/professores" element={<NotFound />} />{' '}
          {/* Placeholder route */}
          <Route path="/academico/turmas" element={<ClassesList />} />
          <Route path="/avaliacao" element={<NotFound />} />
          <Route path="/relatorios" element={<NotFound />} />
          <Route path="/configuracoes" element={<NotFound />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
