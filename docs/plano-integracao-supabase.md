# Plano Detalhado de Implementação - Integração com Supabase

**Data de Criação:** 2025-01-27  
**Status:** 📋 Planejamento  
**Versão:** 1.0

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Fase 1: Configuração Inicial](#fase-1-configuração-inicial)
4. [Fase 2: Schema do Banco de Dados](#fase-2-schema-do-banco-de-dados)
5. [Fase 3: Infraestrutura de Serviços](#fase-3-infraestrutura-de-serviços)
6. [Fase 4: Refatoração de Stores](#fase-4-refatoração-de-stores)
7. [Fase 5: Autenticação](#fase-5-autenticação)
8. [Fase 6: Migração de Dados](#fase-6-migração-de-dados)
9. [Fase 7: Testes e Validação](#fase-7-testes-e-validação)
10. [Checklist Completo](#checklist-completo)
11. [Riscos e Mitigações](#riscos-e-mitigações)

---

## 🎯 VISÃO GERAL

### Objetivo
Migrar o sistema de armazenamento local (localStorage) para Supabase, mantendo todas as funcionalidades existentes e adicionando capacidades de banco de dados relacional, autenticação robusta e sincronização em tempo real.

### Escopo
- ✅ 23 stores diferentes
- ✅ Sistema de autenticação
- ✅ ~50+ entidades/tabelas
- ✅ Relacionamentos complexos
- ✅ Sistema de permissões (RBAC)
- ✅ Multi-tenancy (escolas)

### Duração Estimada
**14-22 dias úteis** (3-4 semanas)

---

## 📦 PRÉ-REQUISITOS

### 1. Conta e Projeto Supabase
- [ ] Criar conta no [Supabase](https://supabase.com)
- [ ] Criar novo projeto
- [ ] Anotar URL do projeto e API keys
- [ ] Configurar região (recomendado: South America - São Paulo)

### 2. Ferramentas Necessárias
- [ ] Node.js 18+ instalado
- [ ] Git configurado
- [ ] Editor de código (VS Code recomendado)
- [ ] Extensão Supabase para VS Code (opcional)

### 3. Variáveis de Ambiente
Criar arquivo `.env.local`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key (apenas para migrações)
```

---

## 🔧 FASE 1: CONFIGURAÇÃO INICIAL

**Duração:** 1-2 dias  
**Prioridade:** 🔴 Crítica

### 1.1 Instalação de Dependências

```bash
npm install @supabase/supabase-js
npm install --save-dev @supabase/cli
```

### 1.2 Estrutura de Arquivos Base

Criar estrutura inicial:

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Cliente Supabase principal
│   │   ├── types.ts           # Tipos TypeScript gerados
│   │   └── config.ts          # Configurações
│   └── supabase-helpers.ts    # Funções auxiliares
├── services/
│   ├── base.service.ts        # Serviço base genérico
│   ├── students.service.ts
│   ├── schools.service.ts
│   └── ... (outros serviços)
└── hooks/
    ├── useSupabase.ts         # Hook customizado
    └── useRealtime.ts         # Hook para realtime
```

### 1.3 Cliente Supabase

**Arquivo:** `src/lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Helper para verificar conexão
export const checkConnection = async () => {
  const { data, error } = await supabase.from('_health').select('*').limit(1)
  return { connected: !error, error }
}
```

### 1.4 Configuração de Tipos

**Arquivo:** `src/lib/supabase/types.ts`

```typescript
// Este arquivo será gerado automaticamente pelo Supabase CLI
// Comando: npx supabase gen types typescript --project-id seu-projeto-id > src/lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          // ... outros campos
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: string
          // ...
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          // ...
        }
      }
      // ... outras tabelas
    }
  }
}
```

### 1.5 Helpers e Utilitários

**Arquivo:** `src/lib/supabase-helpers.ts`

```typescript
import { PostgrestError } from '@supabase/supabase-js'
import { handleError } from '@/lib/error-handling'

export interface SupabaseResponse<T> {
  data: T | null
  error: PostgrestError | null
}

/**
 * Wrapper para operações Supabase com tratamento de erro padronizado
 */
export async function handleSupabaseResponse<T>(
  promise: Promise<SupabaseResponse<T>>,
  context?: { action: string; entity?: string }
): Promise<T | null> {
  const { data, error } = await promise
  
  if (error) {
    handleError(error, {
      context: {
        action: context?.action || 'supabase_operation',
        entity: context?.entity,
        source: 'supabase',
      },
    })
    return null
  }
  
  return data
}

/**
 * Converte erro do Supabase para mensagem amigável
 */
export function getSupabaseErrorMessage(error: PostgrestError): string {
  if (error.code === 'PGRST116') {
    return 'Nenhum registro encontrado.'
  }
  if (error.code === '23505') {
    return 'Este registro já existe.'
  }
  if (error.code === '23503') {
    return 'Não é possível excluir: registro está em uso.'
  }
  return error.message || 'Erro ao processar operação.'
}
```

### ✅ Checklist Fase 1
- [ ] Instalar dependências
- [ ] Criar estrutura de pastas
- [ ] Configurar cliente Supabase
- [ ] Criar arquivo de tipos (inicial)
- [ ] Configurar variáveis de ambiente
- [ ] Testar conexão com Supabase
- [ ] Criar helpers e utilitários

---

## 🗄️ FASE 2: SCHEMA DO BANCO DE DADOS

**Duração:** 3-5 dias  
**Prioridade:** 🔴 Crítica

### 2.1 Estrutura de Tabelas Principais

#### 2.1.1 Tabela: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'coordinator', 'teacher', 'secretary', 'director')),
  school_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);
```

#### 2.1.2 Tabela: `schools`

```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  inep_code TEXT UNIQUE,
  address JSONB,
  contact JSONB,
  infrastructure JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schools_status ON schools(status);
CREATE INDEX idx_schools_inep_code ON schools(inep_code);
```

#### 2.1.3 Tabela: `academic_years`

```sql
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

CREATE INDEX idx_academic_years_school ON academic_years(school_id);
CREATE INDEX idx_academic_years_active ON academic_years(active);
```

#### 2.1.4 Tabela: `students`

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration TEXT UNIQUE,
  cpf TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'Other')),
  address JSONB,
  contacts JSONB,
  social JSONB,
  transport JSONB,
  health JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_registration ON students(registration);
CREATE INDEX idx_students_cpf ON students(cpf);
CREATE INDEX idx_students_name ON students(name);
```

#### 2.1.5 Tabela: `enrollments`

```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
  grade TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Cursando', 'Transferido', 'Abandono', 'Aguardando')),
  enrollment_date DATE NOT NULL,
  exit_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_school ON enrollments(school_id);
CREATE INDEX idx_enrollments_classroom ON enrollments(classroom_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
```

#### 2.1.6 Tabela: `classrooms`

```sql
CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_id UUID REFERENCES grades(id),
  shift TEXT NOT NULL CHECK (shift IN ('Matutino', 'Vespertino', 'Noturno', 'Integral')),
  acronym TEXT,
  min_students INTEGER,
  max_students INTEGER,
  is_multi_grade BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, academic_year_id, name)
);

CREATE INDEX idx_classrooms_school ON classrooms(school_id);
CREATE INDEX idx_classrooms_year ON classrooms(academic_year_id);
CREATE INDEX idx_classrooms_grade ON classrooms(grade_id);
```

### 2.2 Tabelas Secundárias

#### 2.2.1 Tabela: `teachers`

```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  email TEXT,
  registration TEXT UNIQUE,
  education JSONB,
  enabled_subjects TEXT[],
  functional_situation TEXT,
  contract_type TEXT,
  workload JSONB,
  experience_years INTEGER,
  certifications JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2.2 Tabela: `assessments`

```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  assessment_type_id UUID REFERENCES assessment_types(id),
  grade NUMERIC(5,2),
  description TEXT,
  category TEXT CHECK (category IN ('regular', 'recuperation', 'external_exam')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assessments_student ON assessments(student_id);
CREATE INDEX idx_assessments_classroom ON assessments(classroom_id);
CREATE INDEX idx_assessments_period ON assessments(period_id);
```

### 2.3 Row Level Security (RLS)

#### 2.3.1 Política para `users`

```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

-- Política: Admins podem ver todos
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'admin'
    )
  );

-- Política: Admins podem inserir/atualizar
CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role IN ('admin', 'supervisor')
    )
  );
```

#### 2.3.2 Política para `schools`

```sql
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver escolas ativas
CREATE POLICY "Anyone can view active schools"
  ON schools FOR SELECT
  USING (status = 'active');

-- Política: Usuários associados à escola podem ver
CREATE POLICY "Users can view associated schools"
  ON schools FOR SELECT
  USING (
    id = ANY(
      SELECT unnest(school_ids)::uuid
      FROM users
      WHERE id::text = auth.uid()::text
    )
  );
```

### 2.4 Funções e Triggers

#### 2.4.1 Trigger para `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas as tabelas
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Repetir para outras tabelas...
```

#### 2.4.2 Função para contar alunos por turma

```sql
CREATE OR REPLACE FUNCTION get_classroom_student_count(classroom_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM enrollments
    WHERE classroom_id = classroom_uuid
    AND status = 'Cursando'
  );
END;
$$ LANGUAGE plpgsql;
```

### 2.5 Índices e Otimizações

```sql
-- Índices compostos para queries frequentes
CREATE INDEX idx_enrollments_student_status 
  ON enrollments(student_id, status);

CREATE INDEX idx_assessments_classroom_period 
  ON assessments(classroom_id, period_id);

-- Índices GIN para campos JSONB
CREATE INDEX idx_students_address_gin 
  ON students USING GIN (address);

CREATE INDEX idx_schools_infrastructure_gin 
  ON schools USING GIN (infrastructure);
```

### ✅ Checklist Fase 2
- [ ] Criar todas as tabelas principais (15+)
- [ ] Criar tabelas secundárias (10+)
- [ ] Definir foreign keys e constraints
- [ ] Configurar RLS policies
- [ ] Criar funções auxiliares
- [ ] Criar triggers (updated_at, etc)
- [ ] Criar índices de performance
- [ ] Testar relacionamentos
- [ ] Validar constraints
- [ ] Documentar schema

---

## 🏗️ FASE 3: INFRAESTRUTURA DE SERVIÇOS

**Duração:** 2-3 dias  
**Prioridade:** 🟡 Alta

### 3.1 Serviço Base Genérico

**Arquivo:** `src/services/base.service.ts`

```typescript
import { supabase } from '@/lib/supabase/client'
import { handleSupabaseResponse, getSupabaseErrorMessage } from '@/lib/supabase-helpers'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import type { Database } from '@/lib/supabase/types'

type TableName = keyof Database['public']['Tables']
type Table<T extends TableName> = Database['public']['Tables'][T]

export class BaseService<T extends TableName> {
  constructor(private tableName: T) {}

  /**
   * Buscar todos os registros
   */
  async findAll(
    filters?: Record<string, any>,
    options?: {
      limit?: number
      offset?: number
      orderBy?: string
      ascending?: boolean
    }
  ): Promise<Table<T>['Row'][]> {
    let query = supabase.from(this.tableName).select('*')

    // Aplicar filtros
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    // Aplicar ordenação
    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.ascending ?? true,
      })
    }

    // Aplicar paginação
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const data = await handleSupabaseResponse(
      query,
      { action: 'findAll', entity: this.tableName }
    )

    return data || []
  }

  /**
   * Buscar por ID
   */
  async findById(id: string): Promise<Table<T>['Row'] | null> {
    const data = await handleSupabaseResponse(
      supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single(),
      { action: 'findById', entity: this.tableName }
    )

    return data
  }

  /**
   * Criar novo registro
   */
  async create(data: Table<T>['Insert']): Promise<Table<T>['Row'] | null> {
    const result = await handleSupabaseResponse(
      supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single(),
      { action: 'create', entity: this.tableName }
    )

    return result
  }

  /**
   * Atualizar registro
   */
  async update(
    id: string,
    data: Partial<Table<T>['Update']>
  ): Promise<Table<T>['Row'] | null> {
    const result = await handleSupabaseResponse(
      supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single(),
      { action: 'update', entity: this.tableName }
    )

    return result
  }

  /**
   * Deletar registro
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      return false
    }

    return true
  }

  /**
   * Buscar com relacionamentos
   */
  async findWithRelations(
    id: string,
    relations: string[]
  ): Promise<Table<T>['Row'] | null> {
    const data = await handleSupabaseResponse(
      supabase
        .from(this.tableName)
        .select(relations.join(', '))
        .eq('id', id)
        .single(),
      { action: 'findWithRelations', entity: this.tableName }
    )

    return data
  }
}
```

### 3.2 Serviços Específicos

**Arquivo:** `src/services/students.service.ts`

```typescript
import { BaseService } from './base.service'
import { supabase } from '@/lib/supabase/client'
import { handleSupabaseResponse } from '@/lib/supabase-helpers'
import type { Database } from '@/lib/supabase/types'

type Student = Database['public']['Tables']['students']['Row']
type StudentInsert = Database['public']['Tables']['students']['Insert']
type StudentUpdate = Database['public']['Tables']['students']['Update']

export class StudentsService extends BaseService<'students'> {
  constructor() {
    super('students')
  }

  /**
   * Buscar alunos por escola
   */
  async findBySchool(schoolId: string): Promise<Student[]> {
    const data = await handleSupabaseResponse(
      supabase
        .from('students')
        .select(`
          *,
          enrollments!inner(
            school_id
          )
        `)
        .eq('enrollments.school_id', schoolId),
      { action: 'findBySchool', entity: 'students' }
    )

    return data || []
  }

  /**
   * Buscar alunos por turma
   */
  async findByClassroom(classroomId: string): Promise<Student[]> {
    const data = await handleSupabaseResponse(
      supabase
        .from('students')
        .select(`
          *,
          enrollments!inner(
            classroom_id,
            status
          )
        `)
        .eq('enrollments.classroom_id', classroomId)
        .eq('enrollments.status', 'Cursando'),
      { action: 'findByClassroom', entity: 'students' }
    )

    return data || []
  }

  /**
   * Buscar aluno com matrículas
   */
  async findWithEnrollments(studentId: string): Promise<Student | null> {
    const data = await handleSupabaseResponse(
      supabase
        .from('students')
        .select(`
          *,
          enrollments(
            *,
            school:schools(*),
            classroom:classrooms(*),
            academic_year:academic_years(*)
          )
        `)
        .eq('id', studentId)
        .single(),
      { action: 'findWithEnrollments', entity: 'students' }
    )

    return data
  }

  /**
   * Buscar por CPF
   */
  async findByCpf(cpf: string): Promise<Student | null> {
    const data = await handleSupabaseResponse(
      supabase
        .from('students')
        .select('*')
        .eq('cpf', cpf)
        .single(),
      { action: 'findByCpf', entity: 'students' }
    )

    return data
  }

  /**
   * Buscar por matrícula
   */
  async findByRegistration(registration: string): Promise<Student | null> {
    const data = await handleSupabaseResponse(
      supabase
        .from('students')
        .select('*')
        .eq('registration', registration)
        .single(),
      { action: 'findByRegistration', entity: 'students' }
    )

    return data
  }
}

export const studentsService = new StudentsService()
```

### 3.3 Hook Customizado

**Arquivo:** `src/hooks/useSupabase.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useSupabase() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}
```

### ✅ Checklist Fase 3
- [ ] Criar serviço base genérico
- [ ] Implementar serviços específicos (10+)
- [ ] Criar hook useSupabase
- [ ] Criar hook useRealtime (opcional)
- [ ] Implementar cache local (opcional)
- [ ] Adicionar retry logic
- [ ] Testar todos os serviços
- [ ] Documentar APIs dos serviços

---

## 🔄 FASE 4: REFATORAÇÃO DE STORES

**Duração:** 5-7 dias  
**Prioridade:** 🔴 Crítica

### 4.1 Estratégia de Migração

#### Abordagem: Híbrida (Transição Gradual)

1. **Fase 4.1:** Stores críticos (users, schools, students)
2. **Fase 4.2:** Stores acadêmicos (courses, assessments, attendance)
3. **Fase 4.3:** Stores secundários (documents, protocols, etc)

### 4.2 Exemplo: Refatoração de `useStudentStore`

**ANTES (localStorage):**

```typescript
export const StudentProvider = ({ children }: { children: React.ReactNode }) => {
  const [students, setStudents] = useState<Student[]>(mockStudents)

  useEffect(() => {
    const stored = localStorage.getItem('edu_students')
    if (stored) {
      setStudents(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_students', JSON.stringify(students))
  }, [students])

  const addStudent = (data: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
    }
    setStudents((prev) => [...prev, newStudent])
  }

  // ... outros métodos
}
```

**DEPOIS (Supabase):**

```typescript
import { studentsService } from '@/services/students.service'
import { useSupabase } from '@/hooks/useSupabase'

export const StudentProvider = ({ children }: { children: React.ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { isAuthenticated } = useSupabase()

  // Carregar alunos
  useEffect(() => {
    if (isAuthenticated) {
      loadStudents()
    }
  }, [isAuthenticated])

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await studentsService.findAll()
      setStudents(data)
    } catch (err) {
      setError(err as Error)
      handleError(err as Error, {
        context: { action: 'loadStudents', source: 'supabase' },
      })
    } finally {
      setLoading(false)
    }
  }

  const addStudent = async (data: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null)
      const newStudent = await studentsService.create(data)
      if (newStudent) {
        setStudents((prev) => [...prev, newStudent])
        return newStudent
      }
      throw new Error('Falha ao criar aluno')
    } catch (err) {
      setError(err as Error)
      handleError(err as Error, {
        context: { action: 'addStudent', source: 'supabase' },
      })
      throw err
    }
  }

  const updateStudent = async (id: string, data: Partial<Student>) => {
    try {
      setError(null)
      const updated = await studentsService.update(id, data)
      if (updated) {
        setStudents((prev) =>
          prev.map((s) => (s.id === id ? updated : s))
        )
        return updated
      }
      throw new Error('Falha ao atualizar aluno')
    } catch (err) {
      setError(err as Error)
      handleError(err as Error, {
        context: { action: 'updateStudent', source: 'supabase' },
      })
      throw err
    }
  }

  const deleteStudent = async (id: string) => {
    try {
      setError(null)
      const success = await studentsService.delete(id)
      if (success) {
        setStudents((prev) => prev.filter((s) => s.id !== id))
        return true
      }
      throw new Error('Falha ao excluir aluno')
    } catch (err) {
      setError(err as Error)
      handleError(err as Error, {
        context: { action: 'deleteStudent', source: 'supabase' },
      })
      return false
    }
  }

  return (
    <StudentContext.Provider
      value={{
        students,
        loading,
        error,
        addStudent,
        updateStudent,
        deleteStudent,
        loadStudents,
        // ... outros métodos
      }}
    >
      {children}
    </StudentContext.Provider>
  )
}
```

### 4.3 Ordem de Refatoração

#### Prioridade 1 (Críticos - 2 dias)
1. ✅ `useUserStore` - Autenticação
2. ✅ `useSchoolStore` - Base do sistema
3. ✅ `useStudentStore` - Entidade principal

#### Prioridade 2 (Acadêmicos - 2 dias)
4. ✅ `useCourseStore` - Cursos e séries
5. ✅ `useAssessmentStore` - Avaliações
6. ✅ `useAttendanceStore` - Frequência
7. ✅ `useTeacherStore` - Professores

#### Prioridade 3 (Secundários - 2-3 dias)
8. ✅ `useSettingsStore` - Configurações
9. ✅ `useDocumentStore` - Documentos
10. ✅ `useProtocolStore` - Protocolos
11. ✅ `useAppointmentStore` - Agendamentos
12. ✅ `useNotificationStore` - Notificações
13. ✅ `usePublicContentStore` - Conteúdo público
14. ✅ Outros stores restantes

### 4.4 Padrão de Loading States

```typescript
interface StoreState<T> {
  data: T[]
  loading: boolean
  error: Error | null
  lastFetch: Date | null
}

// Hook para gerenciar estado
function useStoreState<T>() {
  const [state, setState] = useState<StoreState<T>>({
    data: [],
    loading: false,
    error: null,
    lastFetch: null,
  })

  return { state, setState }
}
```

### ✅ Checklist Fase 4
- [ ] Refatorar useUserStore
- [ ] Refatorar useSchoolStore
- [ ] Refatorar useStudentStore
- [ ] Refatorar stores acadêmicos (5+)
- [ ] Refatorar stores secundários (10+)
- [ ] Adicionar loading states
- [ ] Adicionar error handling
- [ ] Testar cada store refatorado
- [ ] Atualizar componentes que usam stores
- [ ] Remover código de localStorage

---

## 🔐 FASE 5: AUTENTICAÇÃO

**Duração:** 2-3 dias  
**Prioridade:** 🔴 Crítica

### 5.1 Configuração de Autenticação

#### 5.1.1 Habilitar Providers no Supabase

No dashboard do Supabase:
- [ ] Habilitar Email/Password
- [ ] Configurar templates de email
- [ ] Configurar redirect URLs
- [ ] Configurar JWT expiry

### 5.2 Serviço de Autenticação

**Arquivo:** `src/services/auth.service.ts`

```typescript
import { supabase } from '@/lib/supabase/client'
import { hashPassword, comparePassword } from '@/lib/auth-utils'
import type { AuthResponse, User as SupabaseUser } from '@supabase/supabase-js'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  role: string
}

export class AuthService {
  /**
   * Login com email e senha
   */
  async login(credentials: LoginCredentials): Promise<SupabaseUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.user) {
      throw new Error('Falha ao fazer login')
    }

    return data.user
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * Registrar novo usuário (apenas admin)
   */
  async register(data: RegisterData): Promise<SupabaseUser> {
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('Falha ao criar usuário')
    }

    // Criar registro na tabela users
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
        password_hash: '', // Não armazenar hash separado, usar Supabase Auth
      })

    if (userError) {
      // Rollback: deletar usuário do auth
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new Error(userError.message)
    }

    return authData.user
  }

  /**
   * Recuperar senha
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * Atualizar senha
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  /**
   * Obter usuário atual
   */
  async getCurrentUser(): Promise<SupabaseUser | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }

  /**
   * Obter sessão atual
   */
  async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  }
}

export const authService = new AuthService()
```

### 5.3 Refatoração do useUserStore

```typescript
import { authService } from '@/services/auth.service'
import { usersService } from '@/services/users.service'
import { useSupabase } from '@/hooks/useSupabase'

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { user: supabaseUser, isAuthenticated } = useSupabase()

  // Carregar usuário atual quando autenticado
  useEffect(() => {
    if (supabaseUser && isAuthenticated) {
      loadCurrentUser(supabaseUser.id)
    } else {
      setCurrentUser(null)
      setLoading(false)
    }
  }, [supabaseUser, isAuthenticated])

  const loadCurrentUser = async (userId: string) => {
    try {
      const user = await usersService.findById(userId)
      if (user) {
        setCurrentUser(user)
      }
    } catch (error) {
      handleError(error as Error, {
        context: { action: 'loadCurrentUser', source: 'supabase' },
      })
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      await authService.login({ email, password })
      // O useSupabase hook vai atualizar automaticamente
    } catch (error) {
      handleError(error as Error, {
        context: { action: 'login', source: 'supabase' },
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setCurrentUser(null)
    } catch (error) {
      handleError(error as Error, {
        context: { action: 'logout', source: 'supabase' },
      })
    }
  }

  // ... outros métodos
}
```

### 5.4 Atualizar ProtectedRoute

```typescript
import { useSupabase } from '@/hooks/useSupabase'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useSupabase()

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

### ✅ Checklist Fase 5
- [ ] Configurar Supabase Auth
- [ ] Criar AuthService
- [ ] Refatorar useUserStore
- [ ] Atualizar componente Login
- [ ] Atualizar ProtectedRoute
- [ ] Implementar recuperação de senha
- [ ] Testar fluxo completo de autenticação
- [ ] Configurar redirects
- [ ] Testar logout
- [ ] Validar sessões

---

## 📦 FASE 6: MIGRAÇÃO DE DADOS

**Duração:** 1-2 dias  
**Prioridade:** 🟡 Alta

### 6.1 Script de Migração

**Arquivo:** `scripts/migrate-to-supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface MigrationStats {
  students: number
  schools: number
  teachers: number
  // ... outros
  errors: string[]
}

async function migrateLocalStorageToSupabase(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    students: 0,
    schools: 0,
    teachers: 0,
    errors: [],
  }

  try {
    // 1. Migrar Escolas
    console.log('Migrando escolas...')
    const schoolsData = localStorage.getItem('edu_schools')
    if (schoolsData) {
      const schools = JSON.parse(schoolsData)
      for (const school of schools) {
        try {
          const { error } = await supabase.from('schools').insert({
            id: school.id,
            name: school.name,
            inep_code: school.inepCode,
            address: school.address,
            contact: school.contact,
            infrastructure: school.infrastructure,
            status: school.status,
            created_at: school.createdAt || new Date().toISOString(),
            updated_at: school.updatedAt || new Date().toISOString(),
          })
          if (error) throw error
          stats.schools++
        } catch (error: any) {
          stats.errors.push(`Erro ao migrar escola ${school.id}: ${error.message}`)
        }
      }
    }

    // 2. Migrar Alunos
    console.log('Migrando alunos...')
    const studentsData = localStorage.getItem('edu_students')
    if (studentsData) {
      const students = JSON.parse(studentsData)
      for (const student of students) {
        try {
          const { error } = await supabase.from('students').insert({
            id: student.id,
            name: student.name,
            registration: student.registration,
            cpf: student.cpf,
            birth_date: student.birthDate,
            gender: student.gender,
            address: student.address,
            contacts: student.contacts,
            social: student.social,
            transport: student.transport,
            health: student.health,
            created_at: student.createdAt || new Date().toISOString(),
            updated_at: student.updatedAt || new Date().toISOString(),
          })
          if (error) throw error
          stats.students++

          // Migrar matrículas
          if (student.enrollments) {
            for (const enrollment of student.enrollments) {
              await supabase.from('enrollments').insert({
                id: enrollment.id || crypto.randomUUID(),
                student_id: student.id,
                school_id: enrollment.schoolId,
                academic_year_id: enrollment.academicYearId,
                classroom_id: enrollment.classroomId,
                grade: enrollment.grade,
                status: enrollment.status,
                enrollment_date: enrollment.enrollmentDate,
                exit_date: enrollment.exitDate,
              })
            }
          }
        } catch (error: any) {
          stats.errors.push(`Erro ao migrar aluno ${student.id}: ${error.message}`)
        }
      }
    }

    // 3. Repetir para outras entidades...

    console.log('Migração concluída!', stats)
    return stats
  } catch (error: any) {
    console.error('Erro na migração:', error)
    throw error
  }
}

// Executar migração
migrateLocalStorageToSupabase()
  .then((stats) => {
    console.log('Estatísticas:', stats)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })
```

### 6.2 Validação de Dados

```typescript
function validateStudentData(student: any): boolean {
  const required = ['id', 'name', 'registration']
  return required.every((field) => student[field] !== undefined)
}

function sanitizeStudentData(student: any) {
  return {
    id: student.id,
    name: student.name?.trim() || '',
    registration: student.registration?.trim() || '',
    // ... outros campos com validação
  }
}
```

### 6.3 Backup Antes da Migração

```typescript
function backupLocalStorage() {
  const backup: Record<string, any> = {}
  
  const keys = [
    'edu_students',
    'edu_schools',
    'edu_teachers',
    // ... todas as keys
  ]

  keys.forEach((key) => {
    const data = localStorage.getItem(key)
    if (data) {
      backup[key] = JSON.parse(data)
    }
  })

  // Salvar backup em arquivo
  fs.writeFileSync(
    `backup-${Date.now()}.json`,
    JSON.stringify(backup, null, 2)
  )
}
```

### ✅ Checklist Fase 6
- [ ] Criar script de migração
- [ ] Implementar validação de dados
- [ ] Criar backup completo
- [ ] Testar migração em ambiente de desenvolvimento
- [ ] Validar integridade dos dados
- [ ] Executar migração em produção
- [ ] Verificar dados migrados
- [ ] Documentar processo

---

## ✅ FASE 7: TESTES E VALIDAÇÃO

**Duração:** 2-3 dias  
**Prioridade:** 🟡 Alta

### 7.1 Testes por Store

Para cada store refatorado:
- [ ] Testar CREATE
- [ ] Testar READ (findAll, findById)
- [ ] Testar UPDATE
- [ ] Testar DELETE
- [ ] Testar relacionamentos
- [ ] Testar filtros
- [ ] Testar paginação
- [ ] Testar error handling

### 7.2 Testes de Integração

- [ ] Fluxo completo de autenticação
- [ ] CRUD completo de alunos
- [ ] CRUD completo de escolas
- [ ] Relacionamentos (aluno -> matrícula -> turma)
- [ ] Permissões e RLS
- [ ] Performance com muitos dados

### 7.3 Testes de Performance

- [ ] Tempo de carregamento inicial
- [ ] Tempo de queries complexas
- [ ] Uso de memória
- [ ] Número de requisições

### ✅ Checklist Fase 7
- [ ] Testar todos os stores
- [ ] Testar autenticação completa
- [ ] Testar relacionamentos
- [ ] Testar permissões
- [ ] Testar performance
- [ ] Corrigir bugs encontrados
- [ ] Documentar problemas conhecidos

---

## 📋 CHECKLIST COMPLETO

### Preparação
- [ ] Criar conta Supabase
- [ ] Criar projeto
- [ ] Configurar variáveis de ambiente
- [ ] Instalar dependências

### Infraestrutura
- [ ] Criar schema completo
- [ ] Configurar RLS
- [ ] Criar índices
- [ ] Criar funções e triggers
- [ ] Criar serviços base
- [ ] Criar hooks customizados

### Refatoração
- [ ] Refatorar 23 stores
- [ ] Atualizar componentes
- [ ] Remover código localStorage
- [ ] Adicionar loading states
- [ ] Adicionar error handling

### Autenticação
- [ ] Configurar Supabase Auth
- [ ] Refatorar login/logout
- [ ] Atualizar ProtectedRoute
- [ ] Implementar recuperação de senha

### Migração
- [ ] Criar script de migração
- [ ] Fazer backup
- [ ] Executar migração
- [ ] Validar dados

### Testes
- [ ] Testar todos os stores
- [ ] Testar autenticação
- [ ] Testar performance
- [ ] Corrigir bugs

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Perda de Dados Durante Migração
**Mitigação:**
- Backup completo antes da migração
- Migração em ambiente de desenvolvimento primeiro
- Validação de dados antes e depois
- Rollback plan preparado

### Risco 2: Performance Degradada
**Mitigação:**
- Criar índices adequados
- Implementar paginação
- Usar cache quando apropriado
- Monitorar queries lentas

### Risco 3: Problemas com RLS
**Mitigação:**
- Testar políticas extensivamente
- Documentar todas as políticas
- Ter fallback para admin
- Logs detalhados

### Risco 4: Incompatibilidade de Tipos
**Mitigação:**
- Gerar tipos do Supabase
- Validar tipos em desenvolvimento
- Usar TypeScript strict mode
- Testes de tipo

---

## 📊 MÉTRICAS DE SUCESSO

- ✅ Todos os stores funcionando com Supabase
- ✅ Autenticação funcionando
- ✅ Dados migrados com sucesso
- ✅ Performance aceitável (< 2s para queries principais)
- ✅ Zero perda de dados
- ✅ RLS funcionando corretamente
- ✅ Sem regressões funcionais

---

## 📚 RECURSOS E DOCUMENTAÇÃO

### Documentação Supabase
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Ferramentas
- Supabase Dashboard
- Supabase CLI
- PostgREST (já incluído no Supabase)

---

**Status:** 📋 Plano Completo  
**Próximo Passo:** Iniciar Fase 1 - Configuração Inicial

