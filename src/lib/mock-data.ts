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
}

export interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
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
}

export interface Subject {
  id: string
  name: string
  workload: number
}

export interface EvaluationRule {
  id: string
  name: string
  description: string
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

// Mock Data Initialization

export const mockEvaluationRules: EvaluationRule[] = [
  {
    id: 'rule1',
    name: 'Nota Numérica (0-10)',
    description: 'Avaliação baseada em notas de 0 a 10 com média 6.0.',
  },
  {
    id: 'rule2',
    name: 'Parecer Descritivo',
    description: 'Avaliação qualitativa através de relatórios semestrais.',
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
        id: 'g2',
        name: '2º Ano',
        evaluationRuleId: 'rule2',
        subjects: [
          { id: 's3', name: 'Português', workload: 200 },
          { id: 's4', name: 'Matemática', workload: 200 },
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
    academicYears: [
      {
        id: 'y2024',
        name: '2024',
        startDate: '2024-02-01',
        endDate: '2024-12-15',
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
        ],
        classes: [
          {
            id: 'cl1',
            name: '5º Ano A',
            shift: 'Matutino',
            gradeId: 'g5',
            gradeName: '5º Ano',
            studentCount: 25,
          },
        ],
      },
    ],
  },
  {
    id: '2',
    code: 'ESC-002',
    name: 'CMEI Pequeno Príncipe',
    address: 'Av. Brasil, 450 - Jardim América',
    phone: '(11) 3456-7891',
    director: "Joana D'arc",
    status: 'active',
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
  {
    id: '2',
    name: 'Prof. Bianca Torres',
    email: 'bianca.torres@prof.edu.gov',
    subject: 'Português',
    phone: '(11) 91234-5679',
    status: 'active',
    allocations: [],
  },
]

// ... (Rest of existing mock data types for User, Student, Project need to be preserved or re-exported if needed)

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
  {
    id: '2',
    name: 'Ana Supervisora',
    email: 'ana.supervisora@edu.gov',
    password: 'password123',
    role: 'supervisor',
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
  }
  enrollments: Enrollment[]
  projectIds: string[]
  age?: number
  grade?: string
  status?: string
  email?: string
  phone?: string
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
