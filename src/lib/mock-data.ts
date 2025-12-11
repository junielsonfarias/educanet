export interface School {
  id: string
  code: string
  name: string
  address: string
  phone: string
  director: string
  status: 'active' | 'inactive'
}

export const mockSchools: School[] = [
  {
    id: '1',
    code: 'ESC-001',
    name: 'Escola Municipal Monteiro Lobato',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 3456-7890',
    director: 'Maria Silva',
    status: 'active',
  },
  {
    id: '2',
    code: 'ESC-002',
    name: 'CMEI Pequeno Príncipe',
    address: 'Av. Brasil, 450 - Jardim América',
    phone: '(11) 3456-7891',
    director: "Joana D'arc",
    status: 'active',
  },
  {
    id: '3',
    code: 'ESC-003',
    name: 'Escola Estadual Tiradentes',
    address: 'Rua da Liberdade, 88 - Vila Nova',
    phone: '(11) 3456-7892',
    director: 'Carlos Souza',
    status: 'inactive',
  },
  {
    id: '4',
    code: 'ESC-004',
    name: 'Escola Técnica Santos Dumont',
    address: 'Rodovia SP-50, Km 12',
    phone: '(11) 3456-7893',
    director: 'Fernanda Lima',
    status: 'active',
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
  // Legacy/Computed helpers for list views
  age?: number // Calculated
  grade?: string // Current grade
  status?: string // Current status
  email?: string // Shortcut to contacts.email
  phone?: string // Shortcut to contacts.phone
}

export const mockStudents: Student[] = [
  {
    id: '1',
    registration: 'EDU-2024001',
    name: 'Alice Souza',
    cpf: '123.456.789-00',
    birthDate: '2014-05-10',
    fatherName: 'Carlos Souza',
    motherName: 'Mariana Souza',
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
  {
    id: '2',
    registration: 'EDU-2024002',
    name: 'Bruno Lima',
    guardian: 'Carla Lima',
    address: {
      street: 'Av. Principal',
      number: '100',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-000',
    },
    contacts: {
      phone: '(11) 98765-4322',
      email: 'bruno.lima@aluno.edu.gov',
    },
    transport: {
      uses: false,
    },
    social: {
      bolsaFamilia: true,
    },
    health: {
      hasSpecialNeeds: true,
      cid: 'F90.0',
    },
    enrollments: [
      {
        id: 'e2',
        schoolId: '1',
        grade: '5º Ano A',
        year: 2024,
        status: 'Cursando',
        type: 'regular',
      },
    ],
    projectIds: ['p1'],
    grade: '5º Ano A',
    status: 'Cursando',
    email: 'bruno.lima@aluno.edu.gov',
    phone: '(11) 98765-4322',
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
  {
    id: 'p2',
    name: 'Dança e Expressão',
    description: 'Aulas de dança contemporânea.',
    instructor: 'Profª. Ana',
    schedule: 'Seg/Qua 15:30',
  },
  {
    id: 'p3',
    name: 'Xadrez',
    description: 'Clube de xadrez e raciocínio lógico.',
    instructor: 'Prof. João',
    schedule: 'Sex 14:00',
  },
]

export interface Teacher {
  id: string
  name: string
  email: string
  subject: string
  phone: string
  status: 'active' | 'inactive'
}

export const mockTeachers: Teacher[] = [
  {
    id: '1',
    name: 'Prof. Alberto Campos',
    email: 'alberto.campos@prof.edu.gov',
    subject: 'Matemática',
    phone: '(11) 91234-5678',
    status: 'active',
  },
  {
    id: '2',
    name: 'Prof. Bianca Torres',
    email: 'bianca.torres@prof.edu.gov',
    subject: 'Português',
    phone: '(11) 91234-5679',
    status: 'active',
  },
]
