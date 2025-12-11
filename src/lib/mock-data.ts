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
