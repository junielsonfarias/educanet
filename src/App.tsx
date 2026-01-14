import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
// Sonner desabilitado temporariamente devido a incompatibilidade com React 19
// import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import ErrorBoundary from '@/components/ErrorBoundary'
import InstitutionalHome from './pages/Index'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import PublicDocuments from './pages/public/PublicDocuments'
import PublicDocumentDetail from './pages/public/PublicDocumentDetail'
import StudentPortal from './pages/public/StudentPortal'
import EmployeePortal from './pages/public/EmployeePortal'
import PublicCalendar from './pages/public/PublicCalendar'
import PublicSchools from './pages/public/PublicSchools'
import PublicNews from './pages/public/PublicNews'
import PublicNewsDetail from './pages/public/PublicNewsDetail'
import Structure from './pages/public/Structure'
import PublicQEduData from './pages/public/PublicQEduData'
import OnlineEnrollment from './pages/public/OnlineEnrollment'
import Dashboard from './pages/Dashboard'
import StrategicDashboard from './pages/dashboard/StrategicDashboard'
import AlertsDashboard from './pages/alerts/AlertsDashboard'
import AlertRules from './pages/alerts/AlertRules'
import SchoolsList from './pages/schools/SchoolsList'
import SchoolDetails from './pages/schools/SchoolDetails'
import StudentsList from './pages/people/StudentsList'
import StudentDetails from './pages/people/StudentDetails'
import TeachersList from './pages/people/TeachersList'
import TeacherDetails from './pages/people/TeacherDetails'
import StaffList from './pages/people/StaffList'
import CoursesList from './pages/academic/CoursesList'
import CourseDetails from './pages/academic/CourseDetails'
import ClassesList from './pages/academic/ClassesList'
import ClassDetails from './pages/academic/ClassDetails'
import AssessmentInput from './pages/academic/AssessmentInput'
import EvaluationAnalysis from './pages/academic/EvaluationAnalysis'
import SchoolCalendar from './pages/calendar/SchoolCalendar'
import ReportsDashboard from './pages/reports/ReportsDashboard'
import EnrollmentReport from './pages/reports/EnrollmentReport'
import PerformanceReport from './pages/reports/PerformanceReport'
import IndividualPerformanceReport from './pages/reports/IndividualPerformanceReport'
import TeacherAllocationReport from './pages/reports/TeacherAllocationReport'
import AgeGradeDistortionReport from './pages/reports/AgeGradeDistortionReport'
import ApprovalFailureReport from './pages/reports/ApprovalFailureReport'
import ComparativeReports from './pages/reports/ComparativeReports'
import TransferReport from './pages/reports/TransferReport'
import DropoutReport from './pages/reports/DropoutReport'
import GradeEntryReport from './pages/reports/GradeEntryReport'
import CustomReport from './pages/reports/CustomReport'
import AcademicPerformanceAnalysis from './pages/reports/AcademicPerformanceAnalysis'
import ReportCard from './pages/public/ReportCard'
import EvaluationRulesList from './pages/academic/EvaluationRulesList'
import AssessmentTypesList from './pages/academic/AssessmentTypesList'
import DigitalClassDiary from './pages/academic/DigitalClassDiary'
import LessonPlanning from './pages/academic/LessonPlanning'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import UsersList from './pages/settings/UsersList'
import GeneralSettings from './pages/settings/GeneralSettings'
import WebsiteContent from './pages/settings/website/WebsiteContent'
import NewsManager from './pages/settings/website/NewsManager'
import DocumentsManager from './pages/settings/website/DocumentsManager'
import BackupRestore from './pages/settings/BackupRestore'
import EducacensoExport from './pages/settings/EducacensoExport'
import InconsistenciesReport from './pages/settings/InconsistenciesReport'
import SupabaseTest from './pages/settings/SupabaseTest'
import SchoolDocuments from './pages/documents/SchoolDocuments'
import NotificationsManager from './pages/communication/NotificationsManager'
import ProtocolsManager from './pages/secretariat/ProtocolsManager'
import ServiceQueue from './pages/secretariat/ServiceQueue'
import AppointmentsManager from './pages/secretariat/AppointmentsManager'
import TransfersManagerSupabase from './pages/people/TransfersManager.supabase'
import PreEnrollmentManagerSupabase from './pages/enrollment/PreEnrollmentManager.supabase'
import PreEnrollmentPublicForm from './pages/enrollment/PreEnrollmentPublicForm'
import ReenrollmentManagerSupabase from './pages/enrollment/ReenrollmentManager.supabase'
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
import { OccurrenceProvider } from './stores/useOccurrenceStore'
import { LessonPlanProvider } from './stores/useLessonPlanStore'
import { AlertProvider } from './stores/useAlertStore'
import { ReportProvider } from './stores/useReportStore'
import { DocumentProvider } from './stores/useDocumentStore'
import { ProtocolProvider } from './stores/useProtocolStore'
import { NotificationProvider } from './stores/useNotificationStore'
import { AppointmentProvider } from './stores/useAppointmentStore'
import { QueueProvider } from './stores/useQueueStore'
import { AttachmentProvider } from './stores/useAttachmentStore'
import { StaffProvider } from './stores/useStaffStore'

const App = () => (
  <ErrorBoundary>
    <UserProvider>
      <SettingsProvider>
        <SchoolProvider>
          <CourseProvider>
            <ProjectProvider>
              <StudentProvider>
                <TeacherProvider>
                  <AssessmentProvider>
                    <AttendanceProvider>
                      <OccurrenceProvider>
                        <LessonPlanProvider>
                          <PublicContentProvider>
                            <AlertProvider>
                              <ReportProvider>
                                <DocumentProvider>
                                  <ProtocolProvider>
                                    <NotificationProvider>
                                      <AppointmentProvider>
                                        <QueueProvider>
                                            <AttachmentProvider>
                                                <StaffProvider>
                                                  <BrowserRouter
                                                    future={{
                                                      v7_startTransition: false,
                                                      v7_relativeSplatPath: false,
                                                    }}
                                                  >
                                                    <TooltipProvider>
                                                      <Toaster />
                                                      {/* <Sonner /> - Desabilitado por incompatibilidade com React 19 */}
                                                      <Routes>
                                    {/* Public Institutional Website Routes */}
                                    <Route element={<PublicLayout />}>
                                      <Route
                                        path="/"
                                        element={<InstitutionalHome />}
                                      />
                                      <Route
                                        path="/publico/noticias"
                                        element={<PublicNews />}
                                      />
                                      <Route
                                        path="/publico/noticias/:id"
                                        element={<PublicNewsDetail />}
                                      />
                                      <Route
                                        path="/publico/documentos"
                                        element={<PublicDocuments />}
                                      />
                                      <Route
                                        path="/publico/documentos/:id"
                                        element={<PublicDocumentDetail />}
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
                                      <Route
                                        path="/publico/dados-qedu"
                                        element={<PublicQEduData />}
                                      />
                                      <Route
                                        path="/publico/matricula-online"
                                        element={<OnlineEnrollment />}
                                      />
                                      <Route
                                        path="/publico/pre-matricula"
                                        element={<PreEnrollmentPublicForm />}
                                      />
                                    </Route>

                                    {/* Auth Route */}
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/forgot-password" element={<ForgotPassword />} />
                                    <Route path="/reset-password" element={<ResetPassword />} />

                                    {/* Admin Panel Routes */}
                                    <Route element={<Layout />}>
                                      <Route
                                        path="/dashboard"
                                        element={<Dashboard />}
                                      />
                                      <Route
                                        path="/dashboard/estrategico"
                                        element={<StrategicDashboard />}
                                      />
                                      <Route
                                        path="/alertas"
                                        element={<AlertsDashboard />}
                                      />
                                      <Route
                                        path="/alertas/regras"
                                        element={<AlertRules />}
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
                                      <Route
                                        path="/pessoas/transferencias"
                                        element={<TransfersManagerSupabase />}
                                      />
                                      <Route
                                        path="/pessoas/funcionarios"
                                        element={<StaffList />}
                                      />

                                      {/* Enrollment Routes */}
                                      <Route
                                        path="/matriculas/pre-matricula"
                                        element={<PreEnrollmentManagerSupabase />}
                                      />
                                      <Route
                                        path="/matriculas/rematricula"
                                        element={<ReenrollmentManagerSupabase />}
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
                                        path="/academico/turmas/:id"
                                        element={<ClassDetails />}
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
                                      <Route
                                        path="/academico/analise-avaliacoes"
                                        element={<EvaluationAnalysis />}
                                      />
                                      <Route
                                        path="/academico/diario"
                                        element={<DigitalClassDiary />}
                                      />
                                      <Route
                                        path="/academico/planejamento"
                                        element={<LessonPlanning />}
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
                                        path="/relatorios/custom"
                                        element={<CustomReport />}
                                      />
                                      <Route
                                        path="/relatorios/analise-academica"
                                        element={
                                          <AcademicPerformanceAnalysis />
                                        }
                                      />
                                      <Route
                                        path="/relatorios/comparativo"
                                        element={<ComparativeReports />}
                                      />
                                      <Route
                                        path="/relatorios/individual"
                                        element={
                                          <IndividualPerformanceReport />
                                        }
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
                                      <Route
                                        path="/relatorios/transferencias"
                                        element={<TransferReport />}
                                      />
                                      <Route
                                        path="/relatorios/evasao"
                                        element={<DropoutReport />}
                                      />
                                      <Route
                                        path="/relatorios/status-lancamento"
                                        element={<GradeEntryReport />}
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
                                        path="/configuracoes/backup"
                                        element={<BackupRestore />}
                                      />
                                      <Route
                                        path="/configuracoes/educacenso"
                                        element={<EducacensoExport />}
                                      />
                                      <Route
                                        path="/configuracoes/inconsistencias"
                                        element={<InconsistenciesReport />}
                                      />
                                      <Route
                                        path="/configuracoes/supabase-test"
                                        element={<SupabaseTest />}
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

                                      {/* Documents */}
                                      <Route
                                        path="/documentos"
                                        element={<SchoolDocuments />}
                                      />

                                      {/* Communication */}
                                      <Route
                                        path="/comunicacao"
                                        element={<NotificationsManager />}
                                      />

                                      {/* Secretariat */}
                                      <Route
                                        path="/secretaria/protocolos"
                                        element={<ProtocolsManager />}
                                      />
                                      <Route
                                        path="/secretaria/fila"
                                        element={<ServiceQueue />}
                                      />
                                      <Route
                                        path="/secretaria/agendamentos"
                                        element={<AppointmentsManager />}
                                      />
                                    </Route>

                                    <Route path="*" element={<NotFound />} />
                                                    </Routes>
                                                  </TooltipProvider>
                                                </BrowserRouter>
                                              </StaffProvider>
                                          </AttachmentProvider>
                                      </QueueProvider>
                                    </AppointmentProvider>
                                  </NotificationProvider>
                                </ProtocolProvider>
                              </DocumentProvider>
                            </ReportProvider>
                          </AlertProvider>
                        </PublicContentProvider>
                      </LessonPlanProvider>
                    </OccurrenceProvider>
                  </AttendanceProvider>
                </AssessmentProvider>
              </TeacherProvider>
            </StudentProvider>
          </ProjectProvider>
        </CourseProvider>
      </SchoolProvider>
    </SettingsProvider>
  </UserProvider>
  </ErrorBoundary>
)

export default App
