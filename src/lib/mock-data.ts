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
  gradeName?: string // Helper for display
  studentCount?: number // Helper
  // Enhanced fields
  acronym?: string
  operatingHours?: string
  minStudents?: number
  operatingDays?: string[]
  isMultiGrade?: boolean
  maxDependencySubjects?: number // New field: Max subjects allowed for dependency
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
  academicYears: AcademicYear[]
  // New INEP/Censo fields
  inepCode?: string
  administrativeDependency?: 'Federal' | 'Estadual' | 'Municipal' | 'Privada'
  locationType?: 'Urbana' | 'Rural'
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
  minGrade?: number // Scale Min (e.g., 0)
  maxGrade?: number // Scale Max (e.g., 10)
  passingGrade?: number // Min grade to pass (e.g., 6.0)
  minDependencyGrade?: number // Min grade to be eligible for dependency (e.g., 4.0)
  minAttendance?: number // Min attendance percentage (e.g., 75)
  formula?: string // Custom formula (e.g., "(eval1 + eval2)/2")
  isStandard?: boolean // Is this a standard rule template?
  periodCount?: number // Number of evaluations/periods expected
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
}

// Assessment Data Types
export interface Assessment {
  id: string
  studentId: string
  schoolId: string
  yearId: string
  classroomId: string
  subjectId: string
  periodId: string
  type: 'numeric' | 'descriptive'
  category?: 'regular' | 'recuperation' // New field to distinguish regular vs recovery exams
  value: number | string // Grade or text
  date: string
}

// Mock Data Initialization

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
        evaluationRuleId: 'rule1',
        subjects: [
          { id: 's9', name: 'Português', workload: 180 },
          { id: 's10', name: 'Matemática', workload: 180 },
          { id: 's11', name: 'História', workload: 80 },
        ],
      },
    ],
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
    inepCode: '12345678',
    administrativeDependency: 'Municipal',
    locationType: 'Urbana',
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
    value: 5.5, // Low grade
    date: '2024-04-10',
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
    value: 8.0, // Recovery grade
    date: '2024-04-15',
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
  },
]
