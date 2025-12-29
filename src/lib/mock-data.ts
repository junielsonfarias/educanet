import { addDays, format } from 'date-fns'

// Importar dados expandidos se disponíveis
let expandedMockEtapasEnsino: EtapaEnsino[] = []
let expandedMockAssessmentTypes: AssessmentType[] = []
let expandedMockSchools: School[] = []
let expandedMockTeachers: Teacher[] = []
let expandedMockStudents: Student[] = []
let expandedMockAssessments: Assessment[] = []
let expandedMockAttendance: AttendanceRecord[] = []
let expandedMockOccurrences: Occurrence[] = []
let expandedMockStaff: Staff[] = []
let expandedMockNews: NewsPost[] = []
let expandedMockPublicDocuments: PublicDocument[] = []
let expandedMockInstitutionalContent: InstitutionalContent[] = []

try {
  const expanded = require('./mock-data-expanded')
  expandedMockEtapasEnsino = expanded.expandedMockEtapasEnsino || []
  expandedMockAssessmentTypes = expanded.expandedMockAssessmentTypes || []
  expandedMockSchools = expanded.expandedMockSchools || []
  expandedMockTeachers = expanded.expandedMockTeachers || []
  expandedMockStudents = expanded.expandedMockStudents || []
  expandedMockAssessments = expanded.expandedMockAssessments || []
  expandedMockAttendance = expanded.expandedMockAttendance || []
  expandedMockOccurrences = expanded.expandedMockOccurrences || []
  expandedMockStaff = expanded.expandedMockStaff || []
  expandedMockNews = expanded.expandedMockNews || []
  expandedMockPublicDocuments = expanded.expandedMockPublicDocuments || []
  expandedMockInstitutionalContent = expanded.expandedMockInstitutionalContent || []
} catch (e) {
  // Dados expandidos não disponíveis, usar dados básicos
}

export interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
}

/**
 * Turma - Grupo de alunos que compartilham o mesmo espaço físico e temporal
 * Alinhado ao Censo Escolar (Educacenso)
 */
export interface Turma {
  id: string
  name: string
  shift: 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral'
  serieAnoId: string // Referência a SerieAno (antes gradeId)
  serieAnoName?: string // Nome da série/ano (antes gradeName)
  etapaEnsinoId: string // NOVO: Referência direta à Etapa de Ensino (obrigatório para Censo)
  etapaEnsinoName?: string // Nome da etapa de ensino
  studentCount?: number
  acronym?: string
  operatingHours?: string
  minStudents?: number
  operatingDays?: string[]
  isMultiGrade?: boolean
  maxDependencySubjects?: number
  maxCapacity?: number // Capacidade máxima de alunos
  regentTeacherId?: string // ID do professor regente
  educationModality?: string // Modalidade de ensino (Regular, EJA, Especial, etc.)
  // Campos adicionais do Censo Escolar
  tipoAtendimento?: string // Ex: "Regular", "AEE", "Hospitalar"
  tipoMediacaoDidaticoPedagogico?: string // Ex: "Presencial", "EAD"
  tipoRegime?: string // Ex: "Seriado", "Nao Seriado"
  codigoTurmaCenso?: string // Código único do Censo
  // Campos legados para compatibilidade
  gradeId?: string // @deprecated Use serieAnoId
  gradeName?: string // @deprecated Use serieAnoName
}

// ============================================
// ALIASES PARA COMPATIBILIDADE (DEPRECATED)
// ============================================
/**
 * @deprecated Use Turma ao invés de Classroom
 * Mantido para compatibilidade durante migração
 */
export type Classroom = Turma

/**
 * Ano Letivo - Período em que as atividades escolares são planejadas e executadas
 * Alinhado ao Censo Escolar (Educacenso)
 */
export interface AnoLetivo {
  id: string
  name: string // Ex: "2024", "2024/2025"
  ano: number // 2024, 2025 (para ordenação)
  startDate: string
  endDate: string
  status: 'pending' | 'active' | 'finished'
  periods: Period[]
  turmas: Turma[] // Array de turmas (antes classes)
  // Campo legado para compatibilidade
  classes?: Turma[] // @deprecated Use turmas
}

// ============================================
// ALIASES PARA COMPATIBILIDADE (DEPRECATED)
// ============================================
/**
 * @deprecated Use AnoLetivo ao invés de AcademicYear
 * Mantido para compatibilidade durante migração
 */
export type AcademicYear = AnoLetivo

export interface SchoolInfrastructure {
  classrooms: {
    total: number
    regular: number
    accessible: number
    capacity: number
  }
  specialRooms: {
    lab: number
    library: number
    computer: number
    science: number
    art: number
  }
  bathrooms: {
    total: number
    accessible: number
  }
  dependencies: {
    kitchen: boolean
    cafeteria: boolean
    court: boolean
    playground: boolean
  }
  utilities: {
    water: 'public' | 'well' | 'cistern' | 'none'
    energy: 'public' | 'generator' | 'none'
    sewage: 'public' | 'septic' | 'none'
    internet: {
      type: 'fiber' | 'radio' | 'satellite' | 'none'
      speed?: number
    }
  }
  equipment: {
    computers: number
    projectors: number
    tvs: number
    printers: number
  }
}

export interface AdministrativeRooms {
  secretariat: number
  direction: number
  coordination: number
  storage: number
  teachersRoom: number
  meetingRoom: number
}

export interface EducationModality {
  id: string
  type: 'infantil' | 'fundamental' | 'medio' | 'eja' | 'especial' | 'profissional'
  level?: string
  fullTime: boolean
  active: boolean
}

export interface School {
  id: string
  code: string
  name: string
  address: string
  phone: string
  director: string
  status: 'active' | 'inactive'
  logo?: string
  academicYears: AnoLetivo[] // Usando AnoLetivo (alias mantém compatibilidade)
  inepCode?: string
  administrativeDependency?: 'Federal' | 'Estadual' | 'Municipal' | 'Privada'
  locationType?: 'Urbana' | 'Rural'
  polo?: string
  infrastructure?: SchoolInfrastructure | {
    classrooms: number
    accessible: boolean
    internet: boolean
    library: boolean
    lab: boolean
  }
  administrativeRooms?: AdministrativeRooms
  educationTypes?: string[]
  educationModalities?: EducationModality[]
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface Subject {
  id: string
  name: string
  workload: number
}

export interface EvaluationRule {
  id: string
  name: string
  type: 'numeric' | 'descriptive'
  description: string
  minGrade?: number
  maxGrade?: number
  passingGrade?: number
  minDependencyGrade?: number
  minAttendance?: number
  formula?: string
  isStandard?: boolean
  periodCount?: number
  typeWeights?: Record<string, number>
  allowedExclusions?: boolean
  recoveryStrategy?: 'replace_if_higher' | 'always_replace' | 'average'
}

// ============================================
// NOVAS INTERFACES - Alinhadas ao Censo Escolar
// ============================================

/**
 * Série/Ano Escolar - Representa a progressão anual (1º ao 9º ano no Fundamental, 1º ao 3º no Médio)
 * Alinhado ao Censo Escolar (Educacenso)
 */
export interface SerieAno {
  id: string
  name: string // Ex: "1º Ano", "2º Ano", "3º Ano"
  numero: number // 1, 2, 3, 4, 5, 6, 7, 8, 9 (para ordenação)
  subjects: Subject[]
  evaluationRuleId?: string
}

/**
 * Etapa de Ensino - Representa os níveis educacionais (Educação Infantil, Ensino Fundamental, Ensino Médio)
 * Alinhado ao Censo Escolar (Educacenso) - Códigos INEP
 */
export interface EtapaEnsino {
  id: string
  name: string // Ex: "Educação Infantil", "Ensino Fundamental", "Ensino Médio"
  codigoCenso: string // Ex: "01", "02", "03" (código do INEP)
  seriesAnos: SerieAno[]
}

// ============================================
// ALIASES PARA COMPATIBILIDADE (DEPRECATED)
// ============================================
/**
 * @deprecated Use SerieAno ao invés de Grade
 * Mantido para compatibilidade durante migração - SERÁ REMOVIDO
 */
export type Grade = SerieAno

/**
 * @deprecated Use EtapaEnsino ao invés de Course
 * Mantido para compatibilidade durante migração - SERÁ REMOVIDO
 */
export type Course = EtapaEnsino

export interface TeacherAllocation {
  id: string
  schoolId: string
  academicYearId: string
  classroomId?: string
  subjectId?: string
  createdAt: string
}

export interface Certification {
  id: string
  name: string
  institution: string
  year: number
  type: 'course' | 'workshop' | 'specialization' | 'other'
}

export interface TeacherEducation {
  graduation?: {
    course: string
    institution: string
    year: number
    area: string
  }
  specialization?: {
    course: string
    institution: string
    year: number
  }
  master?: {
    course: string
    institution: string
    year: number
  }
  doctorate?: {
    course: string
    institution: string
    year: number
  }
}

export interface TeacherWorkload {
  total: number
  bySubject: Record<string, number>
}

export interface Teacher {
  id: string
  name: string
  email: string
  subject: string
  phone: string
  status: 'active' | 'inactive'
  allocations: TeacherAllocation[]
  cpf?: string
  employmentBond?: 'Contratado' | 'Efetivo'
  admissionDate?: string
  role?: string
  academicBackground?: string
  // Novos campos para Censo Escolar
  education?: TeacherEducation
  enabledSubjects?: string[] // subjectIds
  functionalSituation?: 'efetivo' | 'temporario' | 'terceirizado' | 'estagiario'
  contractType?: 'CLT' | 'estatutario' | 'terceirizado'
  workload?: TeacherWorkload
  experienceYears?: number
  certifications?: Certification[]
}

export interface AssessmentType {
  id: string
  name: string
  description?: string
  applicableSerieAnoIds: string[] // IDs de SerieAno (preferencial)
  applicableGradeIds?: string[] // DEPRECATED: IDs de SerieAno (mantido para compatibilidade)
  excludeFromAverage: boolean
}

export interface Assessment {
  id: string
  studentId: string
  schoolId: string
  yearId: string
  classroomId: string
  subjectId: string
  periodId: string
  type: 'numeric' | 'descriptive'
  category?: 'regular' | 'recuperation' | 'external_exam'
  value: number | string
  date: string
  assessmentTypeId?: string
  relatedAssessmentId?: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  schoolId: string
  yearId: string
  classroomId: string
  subjectId: string
  date: string
  present: boolean
  justification?: string
}

export interface Occurrence {
  id: string
  studentId: string
  schoolId: string
  yearId: string
  classroomId: string
  date: string
  type: 'behavior' | 'pedagogical' | 'health' | 'other'
  description: string
  recordedBy: string
  createdAt: string
}

export interface Material {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'image' | 'video' | 'link'
  url: string
  size?: string
}

export interface LessonPlan {
  id: string
  teacherId: string
  schoolId: string
  yearId: string
  classroomId: string
  subjectId: string
  date: string
  topic: string
  objectives: string
  methodology: string
  resources: string
  evaluation: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  feedback?: string
  attachments?: Material[]
  createdAt: string
  updatedAt: string
}

export interface ReportCardViewSettings {
  visibleColumns: string[]
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'metric' | 'list'
  title: string
  dataKey: string
  visible: boolean
  w: number
}

export interface DashboardLayout {
  id: string
  name: string
  widgets: DashboardWidget[]
}

export interface ServiceCard {
  id: string
  title: string
  description: string
  icon: string // Lucide icon name
  link: string
  color: string // 'blue', 'green', 'orange', 'purple'
  active: boolean
  order: number
}

export interface QuickLink {
  id: string
  label: string
  url: string
  active: boolean
  order: number
}

export interface HeroSlide {
  id: string
  imageUrl: string
  title?: string
  subtitle?: string
  description?: string
  buttonText?: string
  buttonLink?: string
  order: number
  active: boolean
}

export interface HeroSectionConfig {
  badgeText?: string
  title?: string
  description?: string
  primaryButtonText?: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  slides: HeroSlide[]
  enableCarousel: boolean
  autoPlay: boolean
  autoPlayInterval?: number // em segundos
}

export interface GeneralSettings {
  municipalityName: string
  educationSecretaryName: string
  municipalityLogo?: string
  secretaryLogo?: string
  defaultRecoveryStrategy?: 'replace_if_higher' | 'always_replace' | 'average'
  facebookHandle?: string
  footerText?: string
  qeduMunicipalityId?: string
  reportCardView?: ReportCardViewSettings
  dashboardLayout?: DashboardLayout
  savedLayouts?: DashboardLayout[]
  serviceCards?: ServiceCard[]
  quickLinks?: QuickLink[]
  heroSection?: HeroSectionConfig
}

export type AlertType = 'dropout_risk' | 'low_performance' | 'system'

export interface Alert {
  id: string
  title: string
  message: string
  type: AlertType
  severity: 'high' | 'medium' | 'low'
  date: string
  studentId?: string
  read: boolean
}

export interface AlertRule {
  id: string
  name: string
  type: AlertType
  condition: 'lt' | 'gt'
  threshold: number
  target: 'attendance' | 'grade'
  roles: string[]
  active: boolean
}

export interface NewsPost {
  id: string
  title: string
  summary: string
  content: string
  publishDate: string
  imageUrl?: string
  author: string
  active: boolean
}

export interface PublicDocument {
  id: string
  organ: string
  documentNumber: string
  year: string
  publishDate: string
  summary: string
  theme: string
  driveLink: string
  active: boolean
}

export interface InstitutionalContent {
  section: 'semed_info' | 'semed_structure'
  title: string
  content: string
  updatedAt: string
}

// --- Interfaces para Documentos Escolares ---

export type DocumentType =
  | 'historico'
  | 'declaracao_matricula'
  | 'ficha_individual'
  | 'declaracao_transferencia'
  | 'ata_resultados'
  | 'certificado'

export interface DocumentContent {
  [key: string]: unknown
}

export interface SchoolDocument {
  id: string
  type: DocumentType
  studentId?: string
  schoolId: string
  academicYearId?: string
  classroomId?: string
  protocolNumber: string
  content: DocumentContent
  generatedAt: string
  generatedBy: string
  status: 'draft' | 'issued' | 'cancelled'
  signedBy?: string
  signedAt?: string
  pdfUrl?: string
  sequentialNumber?: number
}

// --- Interfaces para Protocolos e Secretaria ---

export type ProtocolType =
  | 'matricula'
  | 'transferencia'
  | 'declaracao'
  | 'recurso'
  | 'outros'

export type ProtocolStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type ProtocolPriority = 'normal' | 'preferential' | 'urgent'

export interface ProtocolDocument {
  id: string
  type: string
  status: 'requested' | 'preparing' | 'ready' | 'delivered'
  requestedAt: string
  readyAt?: string
  deliveredAt?: string
  preparedBy?: string
  fileUrl?: string
  notes?: string
}

export interface ProtocolHistory {
  id: string
  action: string
  description: string
  userId: string
  timestamp: string
}

export interface Protocol {
  id: string
  number: string
  type: ProtocolType
  requester: {
    name: string
    cpf: string
    phone: string
    email?: string
    relationship: 'pai' | 'mae' | 'responsavel' | 'aluno' | 'outro'
  }
  studentId?: string
  schoolId: string
  description: string
  status: ProtocolStatus
  priority: ProtocolPriority
  createdAt: string
  updatedAt: string
  completedAt?: string
  assignedTo?: string
  documents: ProtocolDocument[]
  history: ProtocolHistory[]
  deadline?: string
  notes?: string
}

export interface Appointment {
  id: string
  protocolId?: string
  schoolId: string
  requester: {
    name: string
    cpf: string
    phone: string
    email?: string
  }
  type: 'matricula' | 'documentos' | 'informacoes' | 'outros'
  date: string
  time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  confirmedAt?: string
  reminderSent: boolean
}

export interface ServiceQueue {
  id: string
  schoolId: string
  ticketNumber: string
  type: 'matricula' | 'documentos' | 'informacoes'
  priority: ProtocolPriority
  requester: {
    name: string
    cpf: string
    phone?: string
  }
  status: 'waiting' | 'calling' | 'attending' | 'completed'
  createdAt: string
  calledAt?: string
  startedAt?: string
  completedAt?: string
  attendedBy?: string
  estimatedWaitTime?: number
}

// --- Interfaces para Comunicação e Notificações ---

export type NotificationType = 'email' | 'sms' | 'push' | 'system'

export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'read'

export interface Notification {
  id: string
  type: NotificationType
  recipient: {
    type: 'student' | 'guardian' | 'teacher' | 'user'
    id: string
    contact: string
  }
  template: string
  subject?: string
  content: string
  status: NotificationStatus
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  error?: string
  metadata?: Record<string, unknown>
}

export interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms'
  subject?: string
  body: string
  variables: string[]
  active: boolean
}

export interface NotificationSettings {
  userId: string
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  preferences: {
    boletim: boolean
    frequencia: boolean
    avisos: boolean
    eventos: boolean
  }
}

export const initialDashboardLayout: DashboardLayout = {
  id: 'default',
  name: 'Padrão',
  widgets: [
    {
      id: 'w1',
      type: 'metric',
      title: 'Total de Alunos',
      dataKey: 'totalStudents',
      visible: true,
      w: 1,
    },
    {
      id: 'w2',
      type: 'metric',
      title: 'Escolas Ativas',
      dataKey: 'activeSchools',
      visible: true,
      w: 1,
    },
    {
      id: 'w3',
      type: 'metric',
      title: 'Turmas',
      dataKey: 'totalClasses',
      visible: true,
      w: 1,
    },
    {
      id: 'w4',
      type: 'metric',
      title: 'Taxa de Aprovação',
      dataKey: 'approvalRate',
      visible: true,
      w: 1,
    },
    {
      id: 'w5',
      type: 'chart',
      title: 'Evolução das Matrículas',
      dataKey: 'enrollmentGrowth',
      visible: true,
      w: 2,
    },
    {
      id: 'w6',
      type: 'chart',
      title: 'Média por Disciplina',
      dataKey: 'subjectAverage',
      visible: true,
      w: 2,
    },
    {
      id: 'w7',
      type: 'list',
      title: 'Atenção Necessária',
      dataKey: 'attentionList',
      visible: true,
      w: 4,
    },
  ],
}

export const initialServiceCards: ServiceCard[] = [
  {
    id: 'sc1',
    title: 'Portal do Aluno',
    description: 'Acesso a notas, frequência e materiais.',
    icon: 'UserCircle',
    link: '/publico/portal-aluno',
    color: 'blue',
    active: true,
    order: 1,
  },
  {
    id: 'sc2',
    title: 'Portal do Servidor',
    description: 'Contracheque, diário eletrônico e mais.',
    icon: 'School',
    link: '/publico/portal-servidor',
    color: 'green',
    active: true,
    order: 2,
  },
  {
    id: 'sc3',
    title: 'Calendário',
    description: 'Datas importantes e feriados escolares.',
    icon: 'Calendar',
    link: '/publico/calendario',
    color: 'orange',
    active: true,
    order: 3,
  },
  {
    id: 'sc4',
    title: 'Nossas Escolas',
    description: 'Localize as unidades da rede municipal.',
    icon: 'Map',
    link: '/publico/escolas',
    color: 'purple',
    active: true,
    order: 4,
  },
]

export const initialQuickLinks: QuickLink[] = [
  {
    id: 'ql1',
    label: 'Início',
    url: '/',
    active: true,
    order: 1,
  },
  {
    id: 'ql2',
    label: 'Notícias',
    url: '/publico/noticias',
    active: true,
    order: 2,
  },
  {
    id: 'ql3',
    label: 'Escolas',
    url: '/publico/escolas',
    active: true,
    order: 3,
  },
  {
    id: 'ql4',
    label: 'Dados QEdu',
    url: '/publico/dados-qedu',
    active: true,
    order: 4,
  },
  {
    id: 'ql5',
    label: 'Documentos',
    url: '/publico/documentos',
    active: true,
    order: 5,
  },
]

export const initialHeroSection: HeroSectionConfig = {
  badgeText: 'Educação Municipal',
  title: '',
  description: '',
  primaryButtonText: 'Consulta de Boletim',
  primaryButtonLink: '/publico/boletim',
  secondaryButtonText: 'Documentos Oficiais',
  secondaryButtonLink: '/publico/documentos',
  slides: [],
  enableCarousel: false,
  autoPlay: true,
  autoPlayInterval: 5,
}

export const initialSettings: GeneralSettings = {
  municipalityName: 'Prefeitura Municipal',
  educationSecretaryName: 'Secretaria Municipal de Educação',
  defaultRecoveryStrategy: 'replace_if_higher',
  facebookHandle: '@semed_oficial',
  footerText:
    '© 2025 Prefeitura Municipal de São Sebastião da Boa Vista. Todos os direitos reservados.',
  qeduMunicipalityId: '1507300',
  dashboardLayout: initialDashboardLayout,
  savedLayouts: [initialDashboardLayout],
  serviceCards: initialServiceCards,
  quickLinks: initialQuickLinks,
  heroSection: initialHeroSection,
}

export const mockEvaluationRules: EvaluationRule[] = [
  {
    id: 'rule1',
    name: 'Nota Numérica (0-10) Padrão',
    type: 'numeric',
    description:
      'Média aritmética simples das 4 avaliações bimestrais. Média 6.0.',
    minGrade: 0,
    maxGrade: 10,
    passingGrade: 6.0,
    minDependencyGrade: 4.0,
    minAttendance: 75,
    formula: '(eval1 + eval2 + eval3 + eval4) / 4',
    isStandard: true,
    periodCount: 4,
    allowedExclusions: false,
    recoveryStrategy: 'replace_if_higher',
  },
  {
    id: 'rule2',
    name: 'Parecer Descritivo',
    type: 'descriptive',
    description: 'Avaliação qualitativa através de relatórios semestrais.',
    minAttendance: 75,
    isStandard: true,
  },
  {
    id: 'rule3',
    name: 'Média Ponderada Fundamental II',
    type: 'numeric',
    description: '1º e 3º Bimestres peso 2, 2º e 4º Bimestres peso 3.',
    minGrade: 0,
    maxGrade: 10,
    passingGrade: 6.0,
    minDependencyGrade: 4.0,
    minAttendance: 75,
    formula: '((eval1 * 2) + (eval2 * 3) + (eval3 * 2) + (eval4 * 3)) / 10',
    isStandard: false,
    periodCount: 4,
    allowedExclusions: true,
    recoveryStrategy: 'replace_if_higher',
  },
]

// Mock de Etapas de Ensino (alinhado ao Censo Escolar) - DADOS COMPLETOS
// Usar dados expandidos se disponíveis, senão usar dados básicos
export const mockEtapasEnsino: EtapaEnsino[] = expandedMockEtapasEnsino.length > 0 ? expandedMockEtapasEnsino : [
  {
    id: 'e1',
    name: 'Educação Infantil',
    codigoCenso: '01', // Código INEP para Educação Infantil
    seriesAnos: [
      {
        id: 'ei1',
        name: 'Creche - 0 a 2 anos',
        numero: 0,
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 'ei_s1', name: 'Linguagem Oral e Escrita', workload: 200 },
          { id: 'ei_s2', name: 'Matemática', workload: 200 },
          { id: 'ei_s3', name: 'Natureza e Sociedade', workload: 150 },
          { id: 'ei_s4', name: 'Artes', workload: 100 },
          { id: 'ei_s5', name: 'Movimento', workload: 100 },
        ],
      },
      {
        id: 'ei2',
        name: 'Pré-Escola - 3 a 5 anos',
        numero: 0,
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 'ei_s6', name: 'Linguagem Oral e Escrita', workload: 200 },
          { id: 'ei_s7', name: 'Matemática', workload: 200 },
          { id: 'ei_s8', name: 'Natureza e Sociedade', workload: 150 },
          { id: 'ei_s9', name: 'Artes', workload: 100 },
          { id: 'ei_s10', name: 'Movimento', workload: 100 },
        ],
      },
    ],
  },
  {
    id: 'e2',
    name: 'Ensino Fundamental - Anos Iniciais',
    codigoCenso: '03', // Código INEP para Ensino Fundamental - Anos Iniciais
    seriesAnos: [
      {
        id: 'sa1',
        name: '1º Ano',
        numero: 1,
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 's1', name: 'Português', workload: 200 },
          { id: 's2', name: 'Matemática', workload: 200 },
          { id: 's3', name: 'Ciências', workload: 80 },
          { id: 's4', name: 'História', workload: 80 },
          { id: 's5', name: 'Geografia', workload: 80 },
          { id: 's6', name: 'Artes', workload: 80 },
          { id: 's7', name: 'Educação Física', workload: 80 },
        ],
      },
      {
        id: 'sa2',
        name: '2º Ano',
        numero: 2,
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 's8', name: 'Português', workload: 200 },
          { id: 's9', name: 'Matemática', workload: 200 },
          { id: 's10', name: 'Ciências', workload: 80 },
          { id: 's11', name: 'História', workload: 80 },
          { id: 's12', name: 'Geografia', workload: 80 },
          { id: 's13', name: 'Artes', workload: 80 },
          { id: 's14', name: 'Educação Física', workload: 80 },
        ],
      },
      {
        id: 'sa3',
        name: '3º Ano',
        numero: 3,
        evaluationRuleId: 'rule3',
        subjects: [
          { id: 's15', name: 'Português', workload: 180 },
          { id: 's16', name: 'Matemática', workload: 180 },
          { id: 's17', name: 'Ciências', workload: 80 },
          { id: 's18', name: 'História', workload: 80 },
          { id: 's19', name: 'Geografia', workload: 80 },
          { id: 's20', name: 'Artes', workload: 80 },
          { id: 's21', name: 'Educação Física', workload: 80 },
        ],
      },
      {
        id: 'sa4',
        name: '4º Ano',
        numero: 4,
        evaluationRuleId: 'rule3',
        subjects: [
          { id: 's22', name: 'Português', workload: 180 },
          { id: 's23', name: 'Matemática', workload: 180 },
          { id: 's24', name: 'Ciências', workload: 80 },
          { id: 's25', name: 'História', workload: 80 },
          { id: 's26', name: 'Geografia', workload: 80 },
          { id: 's27', name: 'Artes', workload: 80 },
          { id: 's28', name: 'Educação Física', workload: 80 },
        ],
      },
      {
        id: 'sa5',
        name: '5º Ano',
        numero: 5,
        evaluationRuleId: 'rule3',
        subjects: [
          { id: 's29', name: 'Português', workload: 180 },
          { id: 's30', name: 'Matemática', workload: 180 },
          { id: 's31', name: 'Ciências', workload: 80 },
          { id: 's32', name: 'História', workload: 80 },
          { id: 's33', name: 'Geografia', workload: 80 },
          { id: 's34', name: 'Artes', workload: 80 },
          { id: 's35', name: 'Educação Física', workload: 80 },
        ],
      },
    ],
  },
  {
    id: 'e3',
    name: 'Ensino Fundamental - Anos Finais',
    codigoCenso: '04', // Código INEP para Ensino Fundamental - Anos Finais
    seriesAnos: [
      {
        id: 'sa6',
        name: '6º Ano',
        numero: 6,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's36', name: 'Português', workload: 180 },
          { id: 's37', name: 'Matemática', workload: 180 },
          { id: 's38', name: 'Ciências', workload: 80 },
          { id: 's39', name: 'História', workload: 80 },
          { id: 's40', name: 'Geografia', workload: 80 },
          { id: 's41', name: 'Artes', workload: 80 },
          { id: 's42', name: 'Educação Física', workload: 80 },
          { id: 's43', name: 'Inglês', workload: 80 },
        ],
      },
      {
        id: 'sa7',
        name: '7º Ano',
        numero: 7,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's44', name: 'Português', workload: 180 },
          { id: 's45', name: 'Matemática', workload: 180 },
          { id: 's46', name: 'Ciências', workload: 80 },
          { id: 's47', name: 'História', workload: 80 },
          { id: 's48', name: 'Geografia', workload: 80 },
          { id: 's49', name: 'Artes', workload: 80 },
          { id: 's50', name: 'Educação Física', workload: 80 },
          { id: 's51', name: 'Inglês', workload: 80 },
        ],
      },
      {
        id: 'sa8',
        name: '8º Ano',
        numero: 8,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's52', name: 'Português', workload: 180 },
          { id: 's53', name: 'Matemática', workload: 180 },
          { id: 's54', name: 'Ciências', workload: 80 },
          { id: 's55', name: 'História', workload: 80 },
          { id: 's56', name: 'Geografia', workload: 80 },
          { id: 's57', name: 'Artes', workload: 80 },
          { id: 's58', name: 'Educação Física', workload: 80 },
          { id: 's59', name: 'Inglês', workload: 80 },
        ],
      },
      {
        id: 'sa9',
        name: '9º Ano',
        numero: 9,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's60', name: 'Português', workload: 180 },
          { id: 's61', name: 'Matemática', workload: 180 },
          { id: 's62', name: 'Ciências', workload: 80 },
          { id: 's63', name: 'História', workload: 80 },
          { id: 's64', name: 'Geografia', workload: 80 },
          { id: 's65', name: 'Artes', workload: 80 },
          { id: 's66', name: 'Educação Física', workload: 80 },
          { id: 's67', name: 'Inglês', workload: 80 },
        ],
      },
    ],
  },
  {
    id: 'e4',
    name: 'Ensino Médio',
    codigoCenso: '08', // Código INEP para Ensino Médio
    seriesAnos: [
      {
        id: 'em1',
        name: '1º Ano',
        numero: 1,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's68', name: 'Português', workload: 200 },
          { id: 's69', name: 'Matemática', workload: 200 },
          { id: 's70', name: 'Física', workload: 80 },
          { id: 's71', name: 'Química', workload: 80 },
          { id: 's72', name: 'Biologia', workload: 80 },
          { id: 's73', name: 'História', workload: 80 },
          { id: 's74', name: 'Geografia', workload: 80 },
          { id: 's75', name: 'Filosofia', workload: 80 },
          { id: 's76', name: 'Sociologia', workload: 80 },
          { id: 's77', name: 'Artes', workload: 80 },
          { id: 's78', name: 'Educação Física', workload: 80 },
          { id: 's79', name: 'Inglês', workload: 80 },
        ],
      },
      {
        id: 'em2',
        name: '2º Ano',
        numero: 2,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's80', name: 'Português', workload: 200 },
          { id: 's81', name: 'Matemática', workload: 200 },
          { id: 's82', name: 'Física', workload: 80 },
          { id: 's83', name: 'Química', workload: 80 },
          { id: 's84', name: 'Biologia', workload: 80 },
          { id: 's85', name: 'História', workload: 80 },
          { id: 's86', name: 'Geografia', workload: 80 },
          { id: 's87', name: 'Filosofia', workload: 80 },
          { id: 's88', name: 'Sociologia', workload: 80 },
          { id: 's89', name: 'Artes', workload: 80 },
          { id: 's90', name: 'Educação Física', workload: 80 },
          { id: 's91', name: 'Inglês', workload: 80 },
        ],
      },
      {
        id: 'em3',
        name: '3º Ano',
        numero: 3,
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's92', name: 'Português', workload: 200 },
          { id: 's93', name: 'Matemática', workload: 200 },
          { id: 's94', name: 'Física', workload: 80 },
          { id: 's95', name: 'Química', workload: 80 },
          { id: 's96', name: 'Biologia', workload: 80 },
          { id: 's97', name: 'História', workload: 80 },
          { id: 's98', name: 'Geografia', workload: 80 },
          { id: 's99', name: 'Filosofia', workload: 80 },
          { id: 's100', name: 'Sociologia', workload: 80 },
          { id: 's101', name: 'Artes', workload: 80 },
          { id: 's102', name: 'Educação Física', workload: 80 },
          { id: 's103', name: 'Inglês', workload: 80 },
        ],
      },
    ],
  },
  {
    id: 'e5',
    name: 'EJA - Educação de Jovens e Adultos',
    codigoCenso: '69', // Código INEP para EJA
    seriesAnos: [
      {
        id: 'eja1',
        name: 'EJA - Fase I (1º ao 3º Ano)',
        numero: 1,
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 'eja_s1', name: 'Língua Portuguesa', workload: 200 },
          { id: 'eja_s2', name: 'Matemática', workload: 200 },
          { id: 'eja_s3', name: 'Ciências da Natureza', workload: 100 },
          { id: 'eja_s4', name: 'Ciências Humanas', workload: 100 },
        ],
      },
      {
        id: 'eja2',
        name: 'EJA - Fase II (4º e 5º Ano)',
        numero: 2,
        evaluationRuleId: 'rule3',
        subjects: [
          { id: 'eja_s5', name: 'Língua Portuguesa', workload: 180 },
          { id: 'eja_s6', name: 'Matemática', workload: 180 },
          { id: 'eja_s7', name: 'Ciências da Natureza', workload: 100 },
          { id: 'eja_s8', name: 'Ciências Humanas', workload: 100 },
        ],
      },
    ],
  },
]

// Alias para compatibilidade (DEPRECATED - será removido)
export const mockCourses: Course[] = mockEtapasEnsino

// Usar dados expandidos se disponíveis, senão usar dados básicos
export const mockAssessmentTypes: AssessmentType[] = expandedMockAssessmentTypes.length > 0 ? expandedMockAssessmentTypes : [
  {
    id: 'at1',
    name: 'Prova Bimestral',
    description: 'Avaliação principal do bimestre, abrangendo todo o conteúdo.',
    applicableSerieAnoIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'sa9', 'em1', 'em2', 'em3'],
    excludeFromAverage: false,
  },
  {
    id: 'at2',
    name: 'Trabalho em Grupo',
    description:
      'Atividades realizadas em equipe para avaliação de competências colaborativas.',
    applicableSerieAnoIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'sa9', 'em1', 'em2', 'em3'],
    excludeFromAverage: false,
  },
  {
    id: 'at3',
    name: 'Simulado Extra',
    description: 'Teste simulado para preparação, sem impacto na nota final.',
    applicableSerieAnoIds: ['sa6', 'sa7', 'sa8', 'sa9', 'em1', 'em2', 'em3'],
    excludeFromAverage: true,
  },
  {
    id: 'at4',
    name: 'Avaliação Diagnóstica',
    description: 'Avaliação inicial para identificar conhecimentos prévios.',
    applicableSerieAnoIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'sa9'],
    excludeFromAverage: false,
  },
  {
    id: 'at5',
    name: 'Avaliação Formativa',
    description: 'Avaliação contínua durante o processo de aprendizagem.',
    applicableSerieAnoIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'sa9', 'em1', 'em2', 'em3'],
    excludeFromAverage: false,
  },
  {
    id: 'at6',
    name: 'Prova de Recuperação',
    description: 'Avaliação para recuperação de notas abaixo da média.',
    applicableSerieAnoIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6', 'sa7', 'sa8', 'sa9', 'em1', 'em2', 'em3'],
    excludeFromAverage: false,
  },
  {
    id: 'at7',
    name: 'ENEM',
    description: 'Exame Nacional do Ensino Médio.',
    applicableSerieAnoIds: ['em1', 'em2', 'em3'],
    excludeFromAverage: true,
  },
  {
    id: 'at8',
    name: 'SAEB',
    description: 'Sistema de Avaliação da Educação Básica.',
    applicableSerieAnoIds: ['sa5', 'sa9'],
    excludeFromAverage: true,
  },
]

// Usar dados expandidos se disponíveis, senão usar dados básicos
export const mockSchools: School[] = expandedMockSchools.length > 0 ? expandedMockSchools : [
  {
    id: '1',
    code: 'ESC-001',
    name: 'Escola Municipal Monteiro Lobato',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 3456-7890',
    director: 'Maria Silva',
    status: 'active',
    logo: 'https://img.usecurling.com/i?q=school&shape=outline&color=blue',
    inepCode: '12345678',
    administrativeDependency: 'Municipal',
    locationType: 'Urbana',
    polo: 'Polo Centro',
    coordinates: {
      lat: 40, // Simulated relative percentage for the mock map
      lng: 30, // Simulated relative percentage for the mock map
    },
    infrastructure: {
      classrooms: 12,
      accessible: true,
      internet: true,
      library: true,
      lab: false,
    },
    educationTypes: ['Ensino Fundamental'],
    academicYears: [
      {
        id: 'y2024',
        name: '2024',
        ano: 2024,
        startDate: '2024-02-01',
        endDate: '2024-12-15',
        status: 'active',
        periods: [
          {
            id: 'p1',
            name: '1º Bimestre',
            startDate: '2024-02-01',
            endDate: '2024-04-15',
          },
          {
            id: 'p2',
            name: '2º Bimestre',
            startDate: '2024-04-16',
            endDate: '2024-06-30',
          },
          {
            id: 'p3',
            name: '3º Bimestre',
            startDate: '2024-08-01',
            endDate: '2024-09-30',
          },
          {
            id: 'p4',
            name: '4º Bimestre',
            startDate: '2024-10-01',
            endDate: '2024-12-15',
          },
        ],
        turmas: [
          {
            id: 'cl1',
            name: '5º Ano A',
            shift: 'Matutino',
            serieAnoId: 'sa5',
            serieAnoName: '5º Ano',
            etapaEnsinoId: 'e1',
            etapaEnsinoName: 'Ensino Fundamental - Anos Iniciais',
            studentCount: 25,
            acronym: '5A-M',
            operatingHours: '07:00 - 12:00',
            minStudents: 15,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 2,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
          },
          {
            id: 'cl2',
            name: '1º Ano A',
            shift: 'Vespertino',
            serieAnoId: 'sa1',
            serieAnoName: '1º Ano',
            etapaEnsinoId: 'e1',
            etapaEnsinoName: 'Ensino Fundamental - Anos Iniciais',
            studentCount: 20,
            acronym: '1A-V',
            operatingHours: '13:00 - 18:00',
            minStudents: 15,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 0,
            educationModality: 'Regular',
            tipoRegime: 'Seriado',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    code: 'ESC-002',
    name: 'Escola Municipal Cecília Meireles',
    address: 'Av. Paulista, 456 - Bela Vista',
    phone: '(11) 3456-1234',
    director: 'João Santos',
    status: 'active',
    logo: 'https://img.usecurling.com/i?q=school&shape=outline&color=green',
    inepCode: '87654321',
    administrativeDependency: 'Municipal',
    locationType: 'Urbana',
    polo: 'Polo Sul',
    coordinates: {
      lat: 60,
      lng: 70,
    },
    infrastructure: {
      classrooms: 8,
      accessible: true,
      internet: true,
      library: false,
      lab: true,
    },
    educationTypes: ['Ensino Fundamental', 'Educação Infantil'],
    academicYears: [],
  },
]

export const mockTeachers: Teacher[] = expandedMockTeachers.length > 0 ? expandedMockTeachers : [
  {
    id: '1',
    name: 'Prof. Alberto Campos',
    email: 'alberto.campos@prof.edu.gov',
    subject: 'Matemática',
    phone: '(11) 91234-5678',
    status: 'active',
    cpf: '123.456.789-00',
    employmentBond: 'Efetivo',
    admissionDate: '2020-02-01',
    role: 'Professor II',
    academicBackground:
      'Licenciatura em Matemática pela USP. Pós-graduação em Educação Matemática.',
    allocations: [
      {
        id: 'a1',
        schoolId: '1',
        academicYearId: 'y2024',
        classroomId: 'cl1',
        subjectId: 's10',
        createdAt: new Date().toISOString(),
      },
    ],
  },
]

export type UserRole = 'admin' | 'supervisor' | 'coordinator' | 'administrative'

export interface User {
  id: string
  name: string
  email: string
  password?: string // DEPRECATED: Usar passwordHash. Mantido para compatibilidade durante migração
  passwordHash?: string // Hash da senha (bcrypt)
  role: UserRole
  schoolIds?: string[]
  schoolId?: string
  createdAt: string
}

// Senha padrão: 'Tiko6273@' (hash gerado com bcrypt, salt rounds: 10)
// Hash: $2b$10$8j36teGplmOkuPjI.7XjseTqbtgQxrYtjnymxja//VqOQ4M7qNR1a
export const initialUsers: User[] = [
  {
    id: '1',
    name: 'JUNIELSON FARIAS',
    email: 'junielsonfarias@gmail.com',
    passwordHash: '$2b$10$8j36teGplmOkuPjI.7XjseTqbtgQxrYtjnymxja//VqOQ4M7qNR1a', // Tiko6273@
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
]

export interface Enrollment {
  id: string
  studentId?: string // ID do aluno (para validações)
  schoolId: string
  academicYearId?: string // ID do ano letivo (preferencial)
  classroomId?: string // ID da turma (preferencial)
  grade: string // Nome da turma/série (mantido para compatibilidade)
  year: number // Ano numérico (mantido para compatibilidade)
  status: 'Cursando' | 'Aprovado' | 'Reprovado' | 'Transferido' | 'Abandono'
  type: 'regular' | 'dependency'
  enrollmentDate?: string // Data de matrícula (ISO string)
}

export interface Student {
  id: string
  registration: string
  name: string
  cpf?: string
  birthDate?: string
  fatherName?: string
  motherName?: string
  guardian: string
  address: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  contacts: {
    phone: string
    email?: string
  }
  transport: {
    uses: boolean
    routeNumber?: string
  }
  social: {
    nis?: string
    bolsaFamilia: boolean
  }
  health: {
    hasSpecialNeeds: boolean
    cid?: string
    observation?: string
    specialNeedsDetails?: string[]
  }
  enrollments: Enrollment[]
  projectIds: string[]
  age?: number
  grade?: string
  status?: string
  email?: string
  phone?: string
  susCard?: string
  birthCertificate?: string
  nationality?: string
  birthCountry?: string
  raceColor?:
    | 'Branca'
    | 'Preta'
    | 'Parda'
    | 'Amarela'
    | 'Indígena'
    | 'Não declarada'
  motherEducation?: string
  fatherEducation?: string
}

export const mockStudents: Student[] = expandedMockStudents.length > 0 ? expandedMockStudents : [
  {
    id: '1',
    registration: 'EDU-2024001',
    name: 'Alice Souza',
    guardian: 'Roberto Souza',
    address: {
      street: 'Rua das Acácias',
      number: '45',
      neighborhood: 'Jardim Primavera',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
    },
    contacts: {
      phone: '(11) 98765-4321',
      email: 'alice.souza@aluno.edu.gov',
    },
    transport: {
      uses: true,
      routeNumber: 'Rota 05',
    },
    social: {
      nis: '12345678901',
      bolsaFamilia: false,
    },
    health: {
      hasSpecialNeeds: false,
    },
    enrollments: [
      {
        id: 'e1',
        schoolId: '1',
        grade: '5º Ano A',
        year: 2024,
        status: 'Cursando',
        type: 'regular',
      },
      {
        id: 'e2', // Dependency enrollment
        schoolId: '1',
        grade: '1º Ano A',
        year: 2024,
        status: 'Cursando',
        type: 'dependency',
      },
    ],
    projectIds: [],
    grade: '5º Ano A',
    status: 'Cursando',
    email: 'alice.souza@aluno.edu.gov',
    phone: '(11) 98765-4321',
    susCard: '789456123000',
    nationality: 'Brasileira',
    raceColor: 'Parda',
  },
]

export interface Project {
  id: string
  name: string
  description: string
  instructor: string
  schedule: string
}

export const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Futsal',
    description: 'Treino de futsal para iniciantes e intermediários.',
    instructor: 'Prof. Pedro',
    schedule: 'Ter/Qui 14:00',
  },
]

export const mockAssessments: Assessment[] = expandedMockAssessments.length > 0 ? expandedMockAssessments : [
  {
    id: 'as1',
    studentId: '1',
    schoolId: '1',
    yearId: 'y2024',
    classroomId: 'cl1',
    subjectId: 's10',
    periodId: 'p1',
    type: 'numeric',
    category: 'regular',
    value: 5.5,
    date: '2024-04-10',
    assessmentTypeId: 'at1',
  },
  {
    id: 'as1_rec',
    studentId: '1',
    schoolId: '1',
    yearId: 'y2024',
    classroomId: 'cl1',
    subjectId: 's10',
    periodId: 'p1',
    type: 'numeric',
    category: 'recuperation',
    value: 8.0,
    date: '2024-04-15',
    assessmentTypeId: 'at1',
    relatedAssessmentId: 'as1',
  },
  {
    id: 'as2',
    studentId: '1',
    schoolId: '1',
    yearId: 'y2024',
    classroomId: 'cl1',
    subjectId: 's10',
    periodId: 'p2',
    type: 'numeric',
    category: 'regular',
    value: 7.0,
    date: '2024-06-20',
    assessmentTypeId: 'at1',
  },
  {
    id: 'as3',
    studentId: '1',
    schoolId: '1',
    yearId: 'y2024',
    classroomId: 'cl1',
    subjectId: 's11',
    periodId: 'p1',
    type: 'numeric',
    category: 'regular',
    value: 9.5,
    date: '2024-04-12',
    assessmentTypeId: 'at1',
  },
  // Dependency Assessment (Math 1st Year)
  {
    id: 'as_dep1',
    studentId: '1',
    schoolId: '1',
    yearId: 'y2024',
    classroomId: 'cl2',
    subjectId: 's2',
    periodId: 'p1',
    type: 'numeric',
    category: 'regular',
    value: 4.5, // Red grade
    date: '2024-04-10',
    assessmentTypeId: 'at1', // Assuming compatible type
  },
]

export const mockAttendance: AttendanceRecord[] = expandedMockAttendance.length > 0 ? expandedMockAttendance : []

export const mockOccurrences: Occurrence[] = expandedMockOccurrences.length > 0 ? expandedMockOccurrences : [
  {
    id: 'occ1',
    studentId: '1',
    schoolId: '1',
    yearId: 'y2024',
    classroomId: 'cl1',
    date: new Date().toISOString(),
    type: 'behavior',
    description:
      'Aluno apresentou comportamento exemplar na atividade em grupo.',
    recordedBy: 'Prof. Alberto Campos',
    createdAt: new Date().toISOString(),
  },
]

export const mockLessonPlans: LessonPlan[] = [
  {
    id: 'lp1',
    teacherId: '1',
    schoolId: '1',
    yearId: 'y2024',
    classroomId: 'cl1',
    subjectId: 's10',
    date: new Date().toISOString(),
    topic: 'Frações e Números Decimais',
    objectives: 'Compreender a relação entre frações e decimais.',
    methodology: 'Aula expositiva e exercícios práticos.',
    resources: 'Lousa, livro didático, projetor.',
    evaluation: 'Participação e resolução de lista de exercícios.',
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [
      {
        id: 'att1',
        name: 'Lista de Exercícios.pdf',
        type: 'pdf',
        url: '#',
      },
    ],
  },
]

// --- Mock Data for Website ---

// Usar dados expandidos se disponíveis, senão usar dados básicos
export const mockNews: NewsPost[] = expandedMockNews.length > 0 ? expandedMockNews : [
  {
    id: '1',
    title: 'Volta às Aulas 2025',
    summary:
      'Prefeitura anuncia calendário para o retorno das atividades escolares.',
    content:
      '<p>A Secretaria de Educação informa que o retorno às aulas está previsto para o dia 05 de fevereiro. Todas as escolas já estão preparadas para receber os alunos com segurança e novidades na infraestrutura.</p><p>Os pais devem ficar atentos aos comunicados específicos de cada unidade escolar sobre horários e materiais.</p>',
    publishDate: new Date().toISOString(),
    author: 'Ascom SEMED',
    imageUrl: 'https://img.usecurling.com/p/800/600?q=classroom',
    active: true,
  },
  {
    id: '2',
    title: 'Reformas nas Escolas Municipais',
    summary: 'Três unidades escolares passam por ampliação e melhorias.',
    content:
      '<p>As escolas Monteiro Lobato, Cecília Meireles e Vinícius de Moraes estão recebendo obras de manutenção, pintura e climatização das salas de aula.</p><p>O investimento visa proporcionar um ambiente mais adequado para o aprendizado e bem-estar de todos os estudantes e servidores.</p>',
    publishDate: addDays(new Date(), -5).toISOString(),
    author: 'Ascom Prefeitura',
    imageUrl: 'https://img.usecurling.com/p/800/600?q=school%20renovation',
    active: true,
  },
]

// Usar dados expandidos se disponíveis, senão usar dados básicos
export const mockPublicDocuments: PublicDocument[] = expandedMockPublicDocuments.length > 0 ? expandedMockPublicDocuments : [
  {
    id: '1',
    organ: 'SEMED',
    documentNumber: '001/2024',
    year: '2024',
    publishDate: '2024-01-15',
    summary: 'Estabelece o Calendário Escolar para o ano letivo de 2024.',
    theme: 'Calendário Escolar',
    driveLink: '#',
    active: true,
  },
  {
    id: '2',
    organ: 'Prefeitura Municipal',
    documentNumber: 'Decreto 123/2024',
    year: '2024',
    publishDate: '2024-01-10',
    summary: 'Nomeia a nova Secretária de Educação.',
    theme: 'Nomeação',
    driveLink: '#',
    active: true,
  },
]

// Usar dados expandidos se disponíveis, senão usar dados básicos
export const mockInstitutionalContent: InstitutionalContent[] = expandedMockInstitutionalContent.length > 0 ? expandedMockInstitutionalContent : [
  {
    section: 'semed_info',
    title: 'Sobre a SEMED',
    content:
      'A Secretaria Municipal de Educação tem como missão garantir o acesso a um ensino de qualidade para todas as crianças, jovens e adultos do município. Nossos valores são pautados na ética, transparência, inovação e valorização dos profissionais da educação.',
    updatedAt: new Date().toISOString(),
  },
  {
    section: 'semed_structure',
    title: 'Estrutura Organizacional',
    content:
      'A SEMED está estruturada em departamentos pedagógico, administrativo e financeiro. Contamos com uma equipe multidisciplinar focada no suporte às escolas e no desenvolvimento de políticas públicas educacionais efetivas.',
    updatedAt: new Date().toISOString(),
  },
]

export const mockAlerts: Alert[] = [
  {
    id: 'al1',
    title: 'Risco de Evasão',
    message: 'Alice Souza faltou 5 dias consecutivos sem justificativa.',
    type: 'dropout_risk',
    severity: 'high',
    date: new Date().toISOString(),
    studentId: '1',
    read: false,
  },
]

export const mockAlertRules: AlertRule[] = [
  {
    id: 'ar1',
    name: 'Alerta de Baixa Frequência',
    type: 'dropout_risk',
    condition: 'lt',
    threshold: 75,
    target: 'attendance',
    roles: ['admin', 'supervisor', 'coordinator'],
    active: true,
  },
]

// --- Interfaces para Conselho de Classe ---

export interface CouncilMember {
  id: string
  name: string
  role: 'director' | 'coordinator' | 'teacher' | 'pedagogue' | 'other'
  signature?: string
}

export interface StudentCouncilAnalysis {
  studentId: string
  studentName: string
  overallPerformance: 'excellent' | 'good' | 'regular' | 'poor'
  attendanceRate: number
  averageGrade: number
  subjectsWithIssues: Array<{
    subjectId: string
    subjectName: string
    periodId: string
    periodName: string
    grade: number
    issue: string
  }>
  recoveryActivities: Array<{
    subjectId: string
    subjectName: string
    activity: string
    deadline?: string
  }>
  observations: string
  finalDecision: 'approved' | 'approved_with_recovery' | 'dependency' | 'retained' | 'pending'
  dependencySubjects?: string[]
}

export interface ClassCouncil {
  id: string
  schoolId: string
  academicYearId: string
  classroomId: string
  classroomName: string
  date: string
  periodId: string
  periodName: string
  type: 'bimestral' | 'final' | 'extraordinary'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  members: CouncilMember[]
  studentsAnalysis: StudentCouncilAnalysis[]
  generalObservations: string
  decisions: Array<{
    id: string
    description: string
    responsible: string
    deadline?: string
  }>
  minutes: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export const mockClassCouncils: ClassCouncil[] = []

// --- Interfaces para Anexos de Documentos ---

export type AttachmentEntityType = 'student' | 'teacher' | 'school' | 'enrollment' | 'assessment' | 'occurrence' | 'protocol' | 'council'

export type AttachmentCategory =
  | 'identity'
  | 'academic'
  | 'medical'
  | 'legal'
  | 'financial'
  | 'administrative'
  | 'other'

export interface DocumentAttachment {
  id: string
  entityType: AttachmentEntityType
  entityId: string
  category: AttachmentCategory
  name: string
  description?: string
  fileName: string
  fileType: string
  fileSize: number // em bytes
  fileUrl: string
  uploadedBy: string
  uploadedAt: string
  isPublic: boolean
  tags?: string[]
}

export const mockDocumentAttachments: DocumentAttachment[] = []

// --- Interfaces para Transferência Automática ---

export interface StudentTransfer {
  id: string
  studentId: string
  studentName: string
  fromSchoolId: string
  fromSchoolName: string
  toSchoolId?: string
  toSchoolName?: string
  toSchoolExternal?: string
  type: 'internal' | 'external'
  reason: string
  transferDate: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  academicYearId: string
  fromClassroomId?: string
  toClassroomId?: string
  transferHistory: boolean
  transferAssessments: boolean
  transferDocuments: boolean
  notificationSent: boolean
  notificationSentAt?: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export const mockStudentTransfers: StudentTransfer[] = []

// --- Interfaces para Funcionários (Não-Docentes) ---

export type StaffRole =
  | 'secretary'
  | 'coordinator'
  | 'director'
  | 'pedagogue'
  | 'librarian'
  | 'janitor'
  | 'cook'
  | 'security'
  | 'nurse'
  | 'psychologist'
  | 'social_worker'
  | 'administrative'
  | 'other'

export interface Staff {
  id: string
  name: string
  cpf?: string
  email: string
  phone: string
  photo?: string
  role: StaffRole
  roleLabel: string // Nome legível do cargo
  schoolId?: string // ID da escola onde trabalha (opcional, pode ser da secretaria)
  admissionDate: string
  employmentBond: 'Contratado' | 'Efetivo' | 'Terceirizado' | 'Estagiário'
  contractType: 'CLT' | 'Estatutário' | 'Terceirizado' | 'Estágio'
  functionalSituation: 'efetivo' | 'temporario' | 'terceirizado' | 'estagiario'
  workload: number // Carga horária semanal
  salary?: number
  status: 'active' | 'inactive' | 'on_leave'
  address?: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  qualifications?: string[]
  certifications?: string[]
  observations?: string
  createdAt: string
  updatedAt: string
}

export const mockStaff: Staff[] = expandedMockStaff.length > 0 ? expandedMockStaff : []
