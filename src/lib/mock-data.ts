import { addDays, format } from 'date-fns'

export interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
}

export interface Classroom {
  id: string
  name: string
  shift: 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral'
  gradeId: string
  gradeName?: string
  studentCount?: number
  acronym?: string
  operatingHours?: string
  minStudents?: number
  operatingDays?: string[]
  isMultiGrade?: boolean
  maxDependencySubjects?: number
}

export interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'pending' | 'active' | 'finished'
  periods: Period[]
  classes: Classroom[]
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
  academicYears: AcademicYear[]
  inepCode?: string
  administrativeDependency?: 'Federal' | 'Estadual' | 'Municipal' | 'Privada'
  locationType?: 'Urbana' | 'Rural'
  polo?: string
  infrastructure?: {
    classrooms: number
    accessible: boolean
    internet: boolean
    library: boolean
    lab: boolean
  }
  educationTypes?: string[]
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

export interface Grade {
  id: string
  name: string
  subjects: Subject[]
  evaluationRuleId?: string
}

export interface Course {
  id: string
  name: string
  grades: Grade[]
}

export interface TeacherAllocation {
  id: string
  schoolId: string
  academicYearId: string
  classroomId?: string
  subjectId?: string
  createdAt: string
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
}

export interface AssessmentType {
  id: string
  name: string
  description?: string
  applicableGradeIds: string[]
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

export const mockCourses: Course[] = [
  {
    id: 'c1',
    name: 'Ensino Fundamental I',
    grades: [
      {
        id: 'g1',
        name: '1º Ano',
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 's1', name: 'Português', workload: 200 },
          { id: 's2', name: 'Matemática', workload: 200 },
        ],
      },
      {
        id: 'g5',
        name: '5º Ano',
        evaluationRuleId: 'rule3',
        subjects: [
          { id: 's9', name: 'Português', workload: 180 },
          { id: 's10', name: 'Matemática', workload: 180 },
          { id: 's11', name: 'História', workload: 80 },
        ],
      },
    ],
  },
]

export const mockAssessmentTypes: AssessmentType[] = [
  {
    id: 'at1',
    name: 'Prova Bimestral',
    description: 'Avaliação principal do bimestre, abrangendo todo o conteúdo.',
    applicableGradeIds: ['g5'],
    excludeFromAverage: false,
  },
  {
    id: 'at2',
    name: 'Trabalho em Grupo',
    description:
      'Atividades realizadas em equipe para avaliação de competências colaborativas.',
    applicableGradeIds: ['g5'],
    excludeFromAverage: false,
  },
  {
    id: 'at3',
    name: 'Simulado Extra',
    description: 'Teste simulado para preparação, sem impacto na nota final.',
    applicableGradeIds: ['g5'],
    excludeFromAverage: true,
  },
]

export const mockSchools: School[] = [
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
        classes: [
          {
            id: 'cl1',
            name: '5º Ano A',
            shift: 'Matutino',
            gradeId: 'g5',
            gradeName: '5º Ano',
            studentCount: 25,
            acronym: '5A-M',
            operatingHours: '07:00 - 12:00',
            minStudents: 15,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 2,
          },
          {
            id: 'cl2',
            name: '1º Ano A',
            shift: 'Vespertino',
            gradeId: 'g1',
            gradeName: '1º Ano',
            studentCount: 20,
            acronym: '1A-V',
            operatingHours: '13:00 - 18:00',
            minStudents: 15,
            operatingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
            isMultiGrade: false,
            maxDependencySubjects: 0,
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

export const mockTeachers: Teacher[] = [
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
  password?: string
  role: UserRole
  schoolIds?: string[]
  schoolId?: string
  createdAt: string
}

export const initialUsers: User[] = [
  {
    id: '1',
    name: 'JUNIELSON FARIAS',
    email: 'junielsonfarias@gmail.com',
    password: 'Tiko6273@',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
]

export interface Enrollment {
  id: string
  schoolId: string
  academicYearId?: string // ID do ano letivo (preferencial)
  classroomId?: string // ID da turma (preferencial)
  grade: string // Nome da turma/série (mantido para compatibilidade)
  year: number // Ano numérico (mantido para compatibilidade)
  status: 'Cursando' | 'Aprovado' | 'Reprovado' | 'Transferido' | 'Abandono'
  type: 'regular' | 'dependency'
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

export const mockStudents: Student[] = [
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

export const mockAssessments: Assessment[] = [
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

export const mockAttendance: AttendanceRecord[] = []

export const mockOccurrences: Occurrence[] = [
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

export const mockNews: NewsPost[] = [
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

export const mockPublicDocuments: PublicDocument[] = [
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

export const mockInstitutionalContent: InstitutionalContent[] = [
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
