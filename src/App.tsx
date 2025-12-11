import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Dashboard from './pages/Dashboard'
import SchoolsList from './pages/schools/SchoolsList'
import SchoolDetails from './pages/schools/SchoolDetails'
import StudentsList from './pages/people/StudentsList'
import StudentDetails from './pages/people/StudentDetails'
import TeachersList from './pages/people/TeachersList'
import TeacherDetails from './pages/people/TeacherDetails'
import CoursesList from './pages/academic/CoursesList'
import CourseDetails from './pages/academic/CourseDetails'
import ClassesList from './pages/academic/ClassesList'
import ReportCard from './pages/public/ReportCard'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import UsersList from './pages/settings/UsersList'
import { UserProvider } from './stores/useUserStore'
import { SchoolProvider } from './stores/useSchoolStore'
import { StudentProvider } from './stores/useStudentStore'
import { TeacherProvider } from './stores/useTeacherStore'
import { ProjectProvider } from './stores/useProjectStore'
import { CourseProvider } from './stores/useCourseStore'

const App = () => (
  <UserProvider>
    <SchoolProvider>
      <CourseProvider>
        <ProjectProvider>
          <StudentProvider>
            <TeacherProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: false,
                  v7_relativeSplatPath: false,
                }}
              >
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/publico/boletim" element={<ReportCard />} />

                    <Route element={<Layout />}>
                      <Route path="/dashboard" element={<Dashboard />} />

                      {/* Schools Routes */}
                      <Route path="/escolas" element={<SchoolsList />} />
                      <Route path="/escolas/:id" element={<SchoolDetails />} />

                      {/* People Routes */}
                      <Route
                        path="/pessoas/alunos"
                        element={<StudentsList />}
                      />
                      <Route
                        path="/pessoas/alunos/:id"
                        element={<StudentDetails />}
                      />
                      <Route
                        path="/pessoas/professores"
                        element={<TeachersList />}
                      />
                      <Route
                        path="/pessoas/professores/:id"
                        element={<TeacherDetails />}
                      />

                      <Route
                        path="/academico/cursos"
                        element={<CoursesList />}
                      />
                      <Route
                        path="/academico/cursos/:id"
                        element={<CourseDetails />}
                      />
                      <Route
                        path="/academico/turmas"
                        element={<ClassesList />}
                      />
                      <Route path="/avaliacao" element={<NotFound />} />
                      <Route path="/relatorios" element={<NotFound />} />
                      <Route path="/configuracoes" element={<NotFound />} />
                      <Route
                        path="/configuracoes/usuarios"
                        element={<UsersList />}
                      />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TooltipProvider>
              </BrowserRouter>
            </TeacherProvider>
          </StudentProvider>
        </ProjectProvider>
      </CourseProvider>
    </SchoolProvider>
  </UserProvider>
)

export default App
