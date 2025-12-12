import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import InstitutionalHome from './pages/Index'
import Login from './pages/Login'
import PublicDocuments from './pages/public/PublicDocuments'
import StudentPortal from './pages/public/StudentPortal'
import EmployeePortal from './pages/public/EmployeePortal'
import PublicCalendar from './pages/public/PublicCalendar'
import PublicSchools from './pages/public/PublicSchools'
import PublicNews from './pages/public/PublicNews'
import Structure from './pages/public/Structure'
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
import AssessmentInput from './pages/academic/AssessmentInput'
import SchoolCalendar from './pages/calendar/SchoolCalendar'
import ReportsDashboard from './pages/reports/ReportsDashboard'
import EnrollmentReport from './pages/reports/EnrollmentReport'
import PerformanceReport from './pages/reports/PerformanceReport'
import IndividualPerformanceReport from './pages/reports/IndividualPerformanceReport'
import TeacherAllocationReport from './pages/reports/TeacherAllocationReport'
import AgeGradeDistortionReport from './pages/reports/AgeGradeDistortionReport'
import ApprovalFailureReport from './pages/reports/ApprovalFailureReport'
import ReportCard from './pages/public/ReportCard'
import EvaluationRulesList from './pages/academic/EvaluationRulesList'
import AssessmentTypesList from './pages/academic/AssessmentTypesList'
import DataSimulator from './pages/settings/DataSimulator'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import UsersList from './pages/settings/UsersList'
import GeneralSettings from './pages/settings/GeneralSettings'
import WebsiteContent from './pages/settings/website/WebsiteContent'
import NewsManager from './pages/settings/website/NewsManager'
import DocumentsManager from './pages/settings/website/DocumentsManager'
import { UserProvider } from './stores/useUserStore'
import { SchoolProvider } from './stores/useSchoolStore'
import { StudentProvider } from './stores/useStudentStore'
import { TeacherProvider } from './stores/useTeacherStore'
import { ProjectProvider } from './stores/useProjectStore'
import { CourseProvider } from './stores/useCourseStore'
import { AssessmentProvider } from './stores/useAssessmentStore'
import { SettingsProvider } from './stores/useSettingsStore'
import { AttendanceProvider } from './stores/useAttendanceStore'
import { PublicContentProvider } from './stores/usePublicContentStore'

const App = () => (
  <UserProvider>
    <SettingsProvider>
      <SchoolProvider>
        <CourseProvider>
          <ProjectProvider>
            <StudentProvider>
              <TeacherProvider>
                <AssessmentProvider>
                  <AttendanceProvider>
                    <PublicContentProvider>
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
                            {/* Public Institutional Website Routes */}
                            <Route element={<PublicLayout />}>
                              <Route path="/" element={<InstitutionalHome />} />
                              <Route
                                path="/publico/noticias"
                                element={<PublicNews />}
                              />
                              <Route
                                path="/publico/documentos"
                                element={<PublicDocuments />}
                              />
                              <Route
                                path="/publico/boletim"
                                element={<ReportCard />}
                              />
                              <Route
                                path="/publico/portal-aluno"
                                element={<StudentPortal />}
                              />
                              <Route
                                path="/publico/portal-servidor"
                                element={<EmployeePortal />}
                              />
                              <Route
                                path="/publico/calendario"
                                element={<PublicCalendar />}
                              />
                              <Route
                                path="/publico/escolas"
                                element={<PublicSchools />}
                              />
                              <Route
                                path="/publico/estrutura"
                                element={<Structure />}
                              />
                            </Route>

                            {/* Auth Route */}
                            <Route path="/login" element={<Login />} />

                            {/* Admin Panel Routes */}
                            <Route element={<Layout />}>
                              <Route
                                path="/dashboard"
                                element={<Dashboard />}
                              />

                              {/* Schools Routes */}
                              <Route
                                path="/escolas"
                                element={<SchoolsList />}
                              />
                              <Route
                                path="/escolas/:id"
                                element={<SchoolDetails />}
                              />

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

                              {/* Academic Routes */}
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
                              <Route
                                path="/academico/regras-avaliacao"
                                element={<EvaluationRulesList />}
                              />
                              <Route
                                path="/academico/tipos-avaliacao"
                                element={<AssessmentTypesList />}
                              />
                              <Route
                                path="/avaliacao/lancamento"
                                element={<AssessmentInput />}
                              />

                              {/* Calendar */}
                              <Route
                                path="/calendario"
                                element={<SchoolCalendar />}
                              />

                              {/* Reports */}
                              <Route
                                path="/relatorios"
                                element={<ReportsDashboard />}
                              />
                              <Route
                                path="/relatorios/individual"
                                element={<IndividualPerformanceReport />}
                              />
                              <Route
                                path="/relatorios/matriculas"
                                element={<EnrollmentReport />}
                              />
                              <Route
                                path="/relatorios/desempenho"
                                element={<PerformanceReport />}
                              />
                              <Route
                                path="/relatorios/professores"
                                element={<TeacherAllocationReport />}
                              />
                              <Route
                                path="/relatorios/distorcao-idade-serie"
                                element={<AgeGradeDistortionReport />}
                              />
                              <Route
                                path="/relatorios/taxas-rendimento"
                                element={<ApprovalFailureReport />}
                              />

                              {/* Settings */}
                              <Route
                                path="/configuracoes"
                                element={<GeneralSettings />}
                              />
                              <Route
                                path="/configuracoes/geral"
                                element={<GeneralSettings />}
                              />
                              <Route
                                path="/configuracoes/usuarios"
                                element={<UsersList />}
                              />
                              <Route
                                path="/configuracoes/simulador"
                                element={<DataSimulator />}
                              />
                              {/* Website Management */}
                              <Route
                                path="/configuracoes/site/conteudo"
                                element={<WebsiteContent />}
                              />
                              <Route
                                path="/configuracoes/site/noticias"
                                element={<NewsManager />}
                              />
                              <Route
                                path="/configuracoes/site/documentos"
                                element={<DocumentsManager />}
                              />
                            </Route>

                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </TooltipProvider>
                      </BrowserRouter>
                    </PublicContentProvider>
                  </AttendanceProvider>
                </AssessmentProvider>
              </TeacherProvider>
            </StudentProvider>
          </ProjectProvider>
        </CourseProvider>
      </SchoolProvider>
    </SettingsProvider>
  </UserProvider>
)

export default App
