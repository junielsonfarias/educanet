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
  password?: string // In real app, never store plain password
  role: UserRole
  schoolIds?: string[] // For coordinator (multiple)
  schoolId?: string // For administrative (single)
  createdAt: string
}

export const initialUsers: User[] = [
  {
    id: '1',
    name: 'JUNIELSON FARIAS',
    email: 'junielsonfarias@gmail.com',
    password: 'Tiko6273@', // Stored for mock authentication
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

export interface Student {
  id: string
  name: string
  age: number
  grade: string
  status: 'Cursando' | 'Transferido' | 'Reprovado'
  registration: string
  email?: string
  phone?: string
  guardian?: string
}

export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Alice Souza',
    age: 10,
    grade: '5º Ano A',
    status: 'Cursando',
    registration: 'EDU-2024001',
    email: 'alice.souza@aluno.edu.gov',
    phone: '(11) 98765-4321',
    guardian: 'Roberto Souza',
  },
  {
    id: '2',
    name: 'Bruno Lima',
    age: 11,
    grade: '5º Ano A',
    status: 'Cursando',
    registration: 'EDU-2024002',
    email: 'bruno.lima@aluno.edu.gov',
    phone: '(11) 98765-4322',
    guardian: 'Carla Lima',
  },
  {
    id: '3',
    name: 'Carla Dias',
    age: 9,
    grade: '4º Ano B',
    status: 'Transferido',
    registration: 'EDU-2024003',
    email: 'carla.dias@aluno.edu.gov',
    phone: '(11) 98765-4323',
    guardian: 'Marcos Dias',
  },
  {
    id: '4',
    name: 'Daniel Rocha',
    age: 10,
    grade: '5º Ano A',
    status: 'Cursando',
    registration: 'EDU-2024004',
    email: 'daniel.rocha@aluno.edu.gov',
    phone: '(11) 98765-4324',
    guardian: 'Sandra Rocha',
  },
  {
    id: '5',
    name: 'Eduarda Martins',
    age: 12,
    grade: '6º Ano C',
    status: 'Reprovado',
    registration: 'EDU-2024005',
    email: 'eduarda.martins@aluno.edu.gov',
    phone: '(11) 98765-4325',
    guardian: 'Pedro Martins',
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
  {
    id: '3',
    name: 'Prof. Carlos Mendes',
    email: 'carlos.mendes@prof.edu.gov',
    subject: 'História',
    phone: '(11) 91234-5680',
    status: 'active',
  },
]
