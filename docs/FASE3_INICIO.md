# 🚀 FASE 3: INTEGRAÇÃO DO BANCO COM O CÓDIGO

**Data:** 29/12/2025  
**Sistema:** EduGestão Municipal  
**Pré-requisito:** ✅ Fase 2 Completa (Banco de Dados)

---

## 📋 VISÃO GERAL

A Fase 3 consiste em integrar o banco de dados Supabase (já criado e funcional) com o código frontend React, substituindo os dados mock por dados reais.

---

## 🎯 OBJETIVOS DA FASE 3

1. **Gerar Types TypeScript** do Supabase
2. **Criar Services** para cada entidade (11 services)
3. **Refatorar Stores** para usar Supabase (10 stores)
4. **Atualizar Componentes** para dados reais (50+ componentes)
5. **Implementar Upload de Arquivos** (Supabase Storage)
6. **Implementar Real-time** (opcional)
7. **Testes e Validação**

---

## 📦 ESTRUTURA DE ARQUIVOS A CRIAR

```
src/
├── lib/
│   ├── supabase/
│   │   ├── database.types.ts         ← Gerar do Supabase
│   │   ├── services/
│   │   │   ├── base-service.ts       ← Service genérico
│   │   │   ├── people-service.ts
│   │   │   ├── student-service.ts
│   │   │   ├── teacher-service.ts
│   │   │   ├── school-service.ts
│   │   │   ├── class-service.ts
│   │   │   ├── enrollment-service.ts
│   │   │   ├── evaluation-service.ts
│   │   │   ├── grade-service.ts
│   │   │   ├── attendance-service.ts
│   │   │   ├── document-service.ts
│   │   │   ├── communication-service.ts
│   │   │   ├── protocol-service.ts
│   │   │   └── public-content-service.ts
│   │   └── storage-service.ts        ← Upload de arquivos
│   └── database-types.ts             ← Re-export types
├── stores/
│   ├── useUserStore.tsx              ← Refatorar
│   ├── useSchoolStore.tsx            ← Refatorar
│   ├── useStudentStore.tsx           ← Refatorar
│   ├── useTeacherStore.tsx           ← Refatorar
│   ├── useCourseStore.tsx            ← Refatorar
│   ├── useAssessmentStore.tsx        ← Refatorar
│   ├── useAttendanceStore.tsx        ← Refatorar
│   ├── usePublicContentStore.tsx     ← Refatorar
│   ├── useSettingsStore.tsx          ← Refatorar
│   └── useNotificationStore.tsx      ← Refatorar
└── pages/
    └── (50+ componentes a atualizar)
```

---

## 🔢 ETAPAS DETALHADAS

### **ETAPA 1: Gerar Types do Supabase** (30 min)

#### 1.1. Gerar Types Automaticamente
```bash
npx supabase gen types typescript --project-id "seu-project-id" > src/lib/supabase/database.types.ts
```

#### 1.2. Criar Arquivo de Re-export
```typescript
// src/lib/database-types.ts
export type { Database } from './supabase/database.types';
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];
```

#### 1.3. Atualizar mock-data.ts
```typescript
// Substituir interfaces por types do Supabase
import type { Tables } from './database-types';

export type Student = Tables<'student_profiles'> & {
  person: Tables<'people'>;
};
```

---

### **ETAPA 2: Criar Base Service** (1 hora)

#### 2.1. Implementar Service Genérico
```typescript
// src/lib/supabase/services/base-service.ts
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

export class BaseService<T> {
  constructor(protected tableName: string) {}

  async getAll() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .is('deleted_at', null);
    
    if (error) throw handleSupabaseError(error);
    return data as T[];
  }

  async getById(id: number) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) throw handleSupabaseError(error);
    return data as T;
  }

  async create(data: Partial<T>) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();
    
    if (error) throw handleSupabaseError(error);
    return result as T;
  }

  async update(id: number, data: Partial<T>) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw handleSupabaseError(error);
    return result as T;
  }

  async delete(id: number) {
    // Soft delete
    const { error } = await supabase
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw handleSupabaseError(error);
  }
}
```

---

### **ETAPA 3: Criar Services Específicos** (4-6 horas)

#### 3.1. Student Service
```typescript
// src/lib/supabase/services/student-service.ts
import { BaseService } from './base-service';
import { supabase } from '../client';
import { Tables } from '@/lib/database-types';

type StudentProfile = Tables<'student_profiles'>;

class StudentService extends BaseService<StudentProfile> {
  constructor() {
    super('student_profiles');
  }

  async getStudentFullInfo(id: number) {
    const { data, error } = await supabase
      .from('student_profiles')
      .select(`
        *,
        person:people(*),
        enrollments:student_enrollments(
          *,
          school:schools(*),
          class:classes(*)
        ),
        guardians:student_guardians(
          *,
          guardian:guardians(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getBySchool(schoolId: number) {
    const { data, error } = await supabase
      .from('student_profiles')
      .select(`
        *,
        person:people(*),
        enrollments:student_enrollments!inner(*)
      `)
      .eq('enrollments.school_id', schoolId)
      .eq('enrollments.status', 'Matriculado')
      .is('deleted_at', null);
    
    if (error) throw error;
    return data;
  }

  async getByClass(classId: number) {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select(`
        *,
        student_enrollment:student_enrollments(
          *,
          student_profile:student_profiles(
            *,
            person:people(*)
          )
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'Ativo')
      .is('deleted_at', null);
    
    if (error) throw error;
    return data;
  }
}

export const studentService = new StudentService();
```

#### 3.2. School Service
```typescript
// src/lib/supabase/services/school-service.ts
import { BaseService } from './base-service';
import { supabase } from '../client';
import { Tables } from '@/lib/database-types';

type School = Tables<'schools'>;

class SchoolService extends BaseService<School> {
  constructor() {
    super('schools');
  }

  async getSchoolStats(schoolId: number) {
    // Buscar estatísticas da escola
    const [students, teachers, classes] = await Promise.all([
      supabase
        .from('student_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'Matriculado'),
      supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'Ativo'),
      supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .is('deleted_at', null)
    ]);

    return {
      totalStudents: students.count || 0,
      totalTeachers: teachers.count || 0,
      totalClasses: classes.count || 0
    };
  }

  async getInfrastructure(schoolId: number) {
    const { data, error } = await supabase
      .from('infrastructures')
      .select('*')
      .eq('school_id', schoolId)
      .is('deleted_at', null);
    
    if (error) throw error;
    return data;
  }
}

export const schoolService = new SchoolService();
```

#### 3.3. Implementar demais services...
- `teacher-service.ts`
- `class-service.ts`
- `enrollment-service.ts`
- `evaluation-service.ts`
- `grade-service.ts`
- `attendance-service.ts`
- `document-service.ts`
- `communication-service.ts`
- `protocol-service.ts`
- `public-content-service.ts`

---

### **ETAPA 4: Refatorar Stores** (6-8 horas)

#### 4.1. Exemplo: useStudentStore
```typescript
// src/stores/useStudentStore.tsx
import { create } from 'zustand';
import { studentService } from '@/lib/supabase/services/student-service';
import { Tables } from '@/lib/database-types';

type StudentProfile = Tables<'student_profiles'>;

interface StudentState {
  students: StudentProfile[];
  loading: boolean;
  error: string | null;
  
  fetchStudents: () => Promise<void>;
  fetchStudentsBySchool: (schoolId: number) => Promise<void>;
  fetchStudentsByClass: (classId: number) => Promise<void>;
  createStudent: (data: Partial<StudentProfile>) => Promise<void>;
  updateStudent: (id: number, data: Partial<StudentProfile>) => Promise<void>;
  deleteStudent: (id: number) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  loading: false,
  error: null,

  fetchStudents: async () => {
    set({ loading: true, error: null });
    try {
      const students = await studentService.getAll();
      set({ students, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchStudentsBySchool: async (schoolId: number) => {
    set({ loading: true, error: null });
    try {
      const students = await studentService.getBySchool(schoolId);
      set({ students, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createStudent: async (data: Partial<StudentProfile>) => {
    set({ loading: true, error: null });
    try {
      await studentService.create(data);
      // Recarregar lista
      const students = await studentService.getAll();
      set({ students, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  // ... demais métodos
}));
```

#### 4.2. Refatorar demais stores...
- `useSchoolStore.tsx`
- `useTeacherStore.tsx`
- `useCourseStore.tsx`
- `useAssessmentStore.tsx`
- `useAttendanceStore.tsx`
- `usePublicContentStore.tsx`
- `useSettingsStore.tsx`

---

### **ETAPA 5: Atualizar Componentes** (10-15 horas)

#### 5.1. Exemplo: StudentsList.tsx
```typescript
// src/pages/people/StudentsList.tsx
import { useEffect } from 'react';
import { useStudentStore } from '@/stores/useStudentStore';
import { Skeleton } from '@/components/ui/skeleton';

export function StudentsList() {
  const { students, loading, error, fetchStudents } = useStudentStore();

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      {students.map(student => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}
```

#### 5.2. Atualizar componentes por módulo:
- **Pessoas:** StudentsList, TeachersList, StaffList
- **Escolas:** SchoolsList, SchoolDetails
- **Acadêmico:** ClassesList, AssessmentInput, DigitalClassDiary
- **Secretaria:** ProtocolsManager, ServiceQueue
- **Comunicação:** NotificationsManager
- **Portal:** PublicNews, Index
- **Relatórios:** Todos os relatórios

---

### **ETAPA 6: Implementar Storage** (2-3 horas)

#### 6.1. Configurar Buckets no Supabase Dashboard
- `avatars` (público)
- `documents` (privado)
- `attachments` (privado)

#### 6.2. Criar Storage Service
```typescript
// src/lib/supabase/storage-service.ts
import { supabase } from './client';

class StorageService {
  async uploadAvatar(file: File, userId: string) {
    const filename = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filename, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);
    
    return publicUrl;
  }

  async uploadDocument(file: File, type: string, entityId: number) {
    const filename = `${type}/${entityId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filename, file);
    
    if (error) throw error;
    return filename;
  }

  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  }
}

export const storageService = new StorageService();
```

---

### **ETAPA 7: Testes e Validação** (4-6 horas)

#### 7.1. Testar Fluxos Completos
- [ ] Matrícula de aluno
- [ ] Lançamento de notas
- [ ] Registro de frequência
- [ ] Transferência de aluno
- [ ] Geração de documentos
- [ ] Envio de comunicações
- [ ] Gestão de protocolos

#### 7.2. Testar com Diferentes Roles
- [ ] Admin
- [ ] Diretor
- [ ] Professor
- [ ] Aluno
- [ ] Pai/Responsável

---

## 📊 ESTIMATIVA DE TEMPO

| Etapa | Duração Estimada |
|-------|------------------|
| 1. Gerar Types | 30 min |
| 2. Base Service | 1 hora |
| 3. Services Específicos | 6 horas |
| 4. Refatorar Stores | 8 horas |
| 5. Atualizar Componentes | 15 horas |
| 6. Implementar Storage | 3 horas |
| 7. Testes | 6 horas |
| **TOTAL** | **39-40 horas** (~1 semana) |

---

## 🎯 PRIORIDADES

### **Alta Prioridade (Implementar Primeiro):**
1. ✅ Gerar types
2. ✅ Base Service
3. 🔥 Student Service + Store
4. 🔥 School Service + Store
5. 🔥 Teacher Service + Store
6. 🔥 Class Service + Store
7. 🔥 Enrollment Service + Store

### **Média Prioridade:**
8. Evaluation Service + Store
9. Grade Service + Store
10. Attendance Service + Store
11. Document Service + Store

### **Baixa Prioridade (Pode ser depois):**
12. Communication Service
13. Protocol Service
14. Public Content Service
15. Storage Service
16. Real-time (opcional)

---

## 🚨 PONTOS DE ATENÇÃO

### Performance:
- ⚠️ Sempre usar `.select()` específico
- ⚠️ Implementar paginação em listas grandes
- ⚠️ Usar índices apropriados
- ⚠️ Fazer cache de dados frequentes

### Segurança:
- ⚠️ Nunca expor service_role_key
- ⚠️ Sempre validar dados antes de enviar
- ⚠️ Testar políticas RLS com diferentes usuários
- ⚠️ Sanitizar inputs do usuário

### Experiência do Usuário:
- ⚠️ Sempre mostrar loading states
- ⚠️ Sempre tratar erros gracefully
- ⚠️ Dar feedback visual de sucesso/erro
- ⚠️ Usar skeleton loaders

---

## 📝 CHECKLIST RÁPIDO

- [ ] Gerar types do Supabase
- [ ] Criar BaseService
- [ ] Criar StudentService
- [ ] Criar SchoolService
- [ ] Criar TeacherService
- [ ] Refatorar useStudentStore
- [ ] Refatorar useSchoolStore
- [ ] Refatorar useTeacherStore
- [ ] Atualizar StudentsList
- [ ] Atualizar SchoolsList
- [ ] Atualizar TeachersList
- [ ] Testar fluxo de matrícula
- [ ] Testar lançamento de notas
- [ ] Implementar Storage
- [ ] Testes finais

---

## 🎉 RESULTADO ESPERADO

Ao final da Fase 3, o sistema estará:
- ✅ 100% integrado com Supabase
- ✅ Sem dados mock
- ✅ Com autenticação real
- ✅ Com permissões funcionando
- ✅ Com upload de arquivos
- ✅ Pronto para produção

---

**Próximo Passo:** Gerar types do Supabase e criar BaseService!

**Dúvidas?** Consulte:
- `docs/FASE2_BANCO_COMPLETO.md` - Estrutura do banco
- `docs/tarefas-implementacao-supabase-completa.md` - Tarefas detalhadas
- `supabase/INSTRUCTIONS.md` - Instruções do Supabase

---

**Última atualização:** 29/12/2025  
**Sistema:** EduGestão Municipal  
**Versão:** 1.0.0

