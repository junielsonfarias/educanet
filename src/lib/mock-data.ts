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
  polo?: string // Added Polo field
  infrastructure?: {
    classrooms: number
    accessible: boolean
    internet: boolean
    library: boolean
    lab: boolean
  }
  educationTypes?: string[]
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

export interface GeneralSettings {
  municipalityName: string
  educationSecretaryName: string
  municipalityLogo?: string
  secretaryLogo?: string
  defaultRecoveryStrategy?: 'replace_if_higher' | 'always_replace' | 'average'
  facebookHandle?: string
  footerText?: string
  qeduMunicipalityId?: string
}

// --- New Interfaces for Institutional Website ---

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

// ------------------------------------------------

export const initialSettings: GeneralSettings = {
  municipalityName: 'Prefeitura Municipal',
  educationSecretaryName: 'Secretaria Municipal de Educação',
  defaultRecoveryStrategy: 'replace_if_higher',
  facebookHandle: '@semed_oficial',
  footerText:
    '© 2025 Prefeitura Municipal de São Sebastião da Boa Vista. Todos os direitos reservados.',
  qeduMunicipalityId: '1507300', // Default to São Sebastião da Boa Vista - PA (IBGE Code)
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
        evaluationRuleId: 'rule3', // Updated to use rule3 for weighted average requirement
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
            id: 'cl2', // Added class for dependency testing
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
  grade: string
  year: number
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

// --- Mock Data for Website ---

export const mockNews: NewsPost[] = [
  {
    id: '1',
    title: 'Volta às Aulas 2025',
    summary:
      'Prefeitura anuncia calendário para o retorno das atividades escolares.',
    content:
      'A Secretaria de Educação informa que o retorno às aulas está previsto para o dia 05 de fevereiro. Todas as escolas já estão preparadas para receber os alunos com segurança e novidades na infraestrutura.',
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
      'As escolas Monteiro Lobato, Cecília Meireles e Vinícius de Moraes estão recebendo obras de manutenção, pintura e climatização das salas de aula. O investimento visa proporcionar um ambiente mais adequado para o aprendizado.',
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
