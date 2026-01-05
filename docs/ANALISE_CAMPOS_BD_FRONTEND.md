# Análise de Campos: Banco de Dados vs Frontend

**Data:** 29/12/2025  
**Status:** Análise Completa  
**Objetivo:** Identificar e corrigir discrepâncias entre os campos do banco Supabase e os tipos/componentes do frontend

---

## 📊 Sumário Executivo

- **Types Gerados:** ✅ Atualizados com sucesso
- **Tabelas Analisadas:** 40
- **Discrepâncias Encontradas:** Múltiplas
- **Impacto:** Médio-Alto (afeta stores, services e components)

---

## 🔍 Análise Detalhada por Entidade

### 1. **people** (Pessoas)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  first_name: string
  last_name: string
  date_of_birth: string
  cpf: string
  rg: string | null
  email: string | null
  phone: string | null
  address: string | null
  type: "Aluno" | "Professor" | "Funcionario"
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Campos Esperados no Frontend (Antigos):
- Muitos componentes ainda usam `name` ao invés de `first_name` + `last_name`
- Alguns locais esperam `active` ao invés de `deleted_at IS NULL`

#### 🔧 Ações Necessárias:
1. ✅ Atualizar `database.types.ts` (COMPLETO)
2. ⏳ Atualizar componentes que usam `person.name`
3. ⏳ Atualizar lógica de `active` para `deleted_at`

---

### 2. **schools** (Escolas)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  name: string
  address: string
  phone: string | null
  email: string | null
  cnpj: string | null
  inep_code: string | null
  student_capacity: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend (SchoolsList.tsx):
- **Status:** Parcialmente atualizado
- Componente usa `useSchoolStore.supabase`
- Formulário de criação/edição está adequado

#### ⚠️ Campos Faltantes no Frontend:
- `cnpj` - presente no BD, mas não é exibido em detalhes
- `student_capacity` - presente no BD, mas não é editável no form

#### 🔧 Ações Necessárias:
1. ✅ SchoolsList usando Supabase (COMPLETO)
2. ⏳ Adicionar `cnpj` nos detalhes da escola
3. ⏳ Adicionar `student_capacity` no formulário de edição

---

### 3. **student_profiles** (Perfis de Estudantes)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  person_id: number (FK para people)
  student_registration_number: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Discrepâncias:
- Frontend espera muitos campos diretamente no "Student" (merged com `people`)
- Estrutura de relacionamento está correta, mas componentes não sempre acessam via JOIN

#### 🔧 Ações Necessárias:
1. ⏳ Garantir que `student-service.ts` sempre faça JOIN com `people`
2. ⏳ Atualizar componentes para usar `student.person.first_name` ao invés de `student.name`

---

### 4. **teachers** (Professores)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  person_id: number (FK para people)
  functional_registration: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend (TeachersList.tsx):
- **Status:** ✅ ATUALIZADO
- Componente usa `useTeacherStore.supabase`
- Acesso correto a `teacher.person.first_name`

#### 🔧 Ações Necessárias:
1. ✅ TeachersList usando Supabase (COMPLETO)

---

### 5. **staff** (Funcionários)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  person_id: number (FK para people)
  functional_registration: string
  position_id: number (FK para positions)
  department_id: number (FK para departments)
  school_id: number | null (FK para schools)
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Frontend (StaffList.tsx):
- **Status:** ⚠️ USA MOCK DATA
- Componente ainda não foi migrado para Supabase

#### 🔧 Ações Necessárias:
1. ⏳ Criar `staff-service.ts`
2. ⏳ Criar `useStaffStore.supabase.tsx`
3. ⏳ Atualizar `StaffList.tsx` para usar Supabase

---

### 6. **classes** (Turmas)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  name: string
  school_id: number (FK para schools)
  course_id: number (FK para courses)
  academic_period_id: number (FK para academic_periods)
  homeroom_teacher_id: number | null (FK para teachers)
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend (ClassesList.tsx):
- **Status:** ✅ ATUALIZADO
- Componente usa `classService` diretamente
- Acesso correto aos relacionamentos

#### ⚠️ Observações:
- `homeroom_teacher_id` não é exibido/editável no frontend

#### 🔧 Ações Necessárias:
1. ✅ ClassesList usando Supabase (COMPLETO)
2. ⏳ Adicionar campo `homeroom_teacher_id` (Professor Responsável) no formulário

---

### 7. **courses** (Cursos)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  name: string
  description: string | null
  education_level: "Educação Infantil" | "Ensino Fundamental I" | ...
  duration_months: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend (CoursesList.tsx):
- **Status:** ✅ ATUALIZADO (Usa Supabase)
- Store: `useCourseStore.supabase`

#### ⚠️ Campos Faltantes no Frontend:
- `duration_months` - não é exibido/editável

#### 🔧 Ações Necessárias:
1. ✅ CoursesList usando Supabase (COMPLETO)
2. ⏳ Adicionar `duration_months` no formulário de curso

---

### 8. **subjects** (Disciplinas)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  name: string
  code: string
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend:
- **Status:** ✅ Stores atualizadas com Supabase
- `subject-service.ts` criado

#### ⚠️ Observações:
- Não há página dedicada de "SubjectsList" (disciplinas são gerenciadas via cursos)

#### 🔧 Ações Necessárias:
1. ✅ subject-service.ts criado (COMPLETO)
2. ⏳ Considerar criar página `SubjectsList.tsx` para gestão independente

---

### 9. **academic_years** (Anos Letivos)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  year: number
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Frontend:
- **Status:** ⚠️ NÃO IMPLEMENTADO
- Não há service criado
- Não há store criado
- Não há página de gerenciamento

#### 🔧 Ações Necessárias:
1. ⏳ Criar `academic-year-service.ts`
2. ⏳ Criar `useAcademicYearStore.supabase.tsx`
3. ⏳ Criar página `AcademicYearsList.tsx`

---

### 10. **academic_periods** (Períodos Letivos)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  name: string
  academic_year_id: number (FK)
  start_date: string
  end_date: string
  type: "Semestre" | "Trimestre" | "Bimestre"
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Frontend:
- **Status:** ⚠️ NÃO IMPLEMENTADO
- Não há service criado
- Não há store criado
- Não há página de gerenciamento

#### 🔧 Ações Necessárias:
1. ⏳ Criar `academic-period-service.ts`
2. ⏳ Criar `useAcademicPeriodStore.supabase.tsx`
3. ⏳ Integrar com página de Anos Letivos

---

### 11. **evaluation_instances** (Instâncias de Avaliação)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  title: string
  description: string | null
  class_teacher_subject_id: number (FK)
  evaluation_type: "Prova" | "Trabalho" | "Participacao" | "Recuperacao" | "Outro"
  evaluation_date: string
  max_grade: number (padrão: 10)
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Frontend:
- **Status:** ⚠️ PARCIALMENTE IMPLEMENTADO
- `grade-service.ts` existe, mas não gerencia `evaluation_instances` diretamente
- Estrutura antiga (mock) usava lógica de `AssessmentType` e `EvaluationRule`

#### 🔧 Ações Necessárias:
1. ⏳ Criar `evaluation-instance-service.ts`
2. ⏳ Atualizar `useAssessmentStore.supabase.tsx` para gerenciar instâncias
3. ⏳ Refatorar `AssessmentInput.tsx` (PENDENTE - já marcado)

---

### 12. **grades** (Notas)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  evaluation_instance_id: number (FK)
  student_enrollment_id: number (FK)
  grade_value: number
  component_name: string (padrão: 'Principal')
  release_date: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend:
- **Status:** ✅ Service criado (`grade-service.ts`)
- Store: `useAssessmentStore.supabase`

#### ⚠️ Campos Não Utilizados:
- `component_name` - usado para múltiplos componentes de nota (ex: "P1", "P2", "Média")
- `release_date` - data de divulgação da nota

#### 🔧 Ações Necessárias:
1. ✅ grade-service.ts criado (COMPLETO)
2. ⏳ Implementar suporte para `component_name` em `AssessmentInput.tsx`

---

### 13. **attendances** (Frequências)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  lesson_id: number (FK para lessons)
  student_enrollment_id: number (FK)
  status: "Presente" | "Falta Justificada" | "Falta Injustificada"
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend:
- **Status:** ✅ Service criado (`attendance-service.ts`)
- Store: `useAttendanceStore.supabase`

#### 🔧 Ações Necessárias:
1. ✅ attendance-service.ts criado (COMPLETO)

---

### 14. **lessons** (Aulas)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  class_teacher_subject_id: number (FK para class_teacher_subjects)
  lesson_date: string
  start_time: string
  end_time: string
  content: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Frontend:
- **Status:** ⚠️ NÃO IMPLEMENTADO
- Não há service criado
- Não há página de gerenciamento de aulas
- Frequência e notas dependem de aulas

#### 🔧 Ações Necessárias:
1. ⏳ Criar `lesson-service.ts`
2. ⏳ Criar `useLessonStore.supabase.tsx`
3. ⏳ Criar página `LessonsList.tsx` ou integrar em planejamento

---

### 15. **guardians** (Responsáveis)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  person_id: number (FK para people)
  relationship_type: "Pai" | "Mae" | "Tutor Legal" | "Outro"
  is_emergency_contact: boolean (padrão: false)
  preferred_contact_method: "Telefone" | "Email" | "Ambos" (padrão: "Ambos")
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Frontend:
- **Status:** ⚠️ PARCIALMENTE IMPLEMENTADO
- `student-service.ts` tem método `getGuardiansByStudent`
- Não há UI dedicada para gerenciar responsáveis

#### 🔧 Ações Necessárias:
1. ⏳ Criar componente/modal para adicionar/editar responsáveis
2. ⏳ Integrar em `StudentsList.tsx` ou criar seção de "Responsáveis"

---

### 16. **attachments** (Anexos)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  entity_type: "school" | "person" | "student_enrollment" | ...
  entity_id: number
  file_name: string
  file_path_url: string
  file_type: string
  file_size_bytes: number | null
  description: string | null
  uploaded_by_id: number (FK para people)
  uploaded_at: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend:
- **Status:** ✅ Service criado (`attachment-service.ts`)

#### ⚠️ Uso:
- Tabela criada recentemente
- Ainda não integrada em componentes

#### 🔧 Ações Necessárias:
1. ✅ attachment-service.ts criado (COMPLETO)
2. ⏳ Integrar upload/download de anexos em componentes relevantes
3. ⏳ Configurar Supabase Storage para armazenamento de arquivos

---

### 17. **infrastructures** (Infraestrutura)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  school_id: number (FK)
  type: "Sala de Aula" | "Laboratorio" | "Biblioteca" | ...
  quantity: number (padrão: 1)
  capacity: number | null
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Frontend:
- **Status:** ⚠️ NÃO INTEGRADO
- `school-service.ts` tem método `getSchoolInfrastructure`
- Não há UI dedicada

#### 🔧 Ações Necessárias:
1. ⏳ Criar componente de gerenciamento de infraestrutura
2. ⏳ Integrar em página de detalhes da escola

---

### 18. **communications** (Comunicações/Notificações)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  title: string
  message: string
  sender_id: number (FK para people)
  type: "Notificacao" | "Aviso" | "Comunicado"
  send_date: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend:
- **Status:** ✅ Service criado (`communication-service.ts`)
- Store: `useNotificationStore.supabase`

#### 🔧 Ações Necessárias:
1. ✅ communication-service.ts criado (COMPLETO)

---

### 19. **secretariat_protocols** (Protocolos de Secretaria)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  protocol_number: string
  requester_id: number (FK para people)
  request_type: "Matricula" | "Transferencia" | "Documento" | "Informacao" | "Outro"
  status: "Aberto" | "Em Andamento" | "Concluido" | "Cancelado"
  opening_date: string
  observations: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend:
- **Status:** ✅ Service criado (`protocol-service.ts`)

#### ⚠️ Página:
- `ProtocolsManager.tsx` existe, mas ainda usa mock data

#### 🔧 Ações Necessárias:
1. ✅ protocol-service.ts criado (COMPLETO)
2. ⏳ Atualizar `ProtocolsManager.tsx` para usar Supabase

---

### 20. **public_portal_content** (Conteúdo do Portal Público)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  title: string
  type: "Noticia" | "Evento" | "Pagina Institucional" | "Comunicado"
  publication_status: "Rascunho" | "Publicado" | "Arquivado"
  publication_date: string
  author_id: number (FK para people)
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend:
- **Status:** ✅ Service criado (`public-content-service.ts`)
- Store: `usePublicContentStore.supabase`

#### 🔧 Ações Necessárias:
1. ✅ public-content-service.ts criado (COMPLETO)
2. ⏳ Atualizar `NewsManager.tsx` e `DocumentsManager.tsx` para Supabase

---

### 21. **school_documents** (Documentos Escolares)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  student_enrollment_id: number (FK)
  type: "Historico Escolar" | "Certificado" | "Declaracao" | "Atestado"
  issue_date: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend:
- **Status:** ✅ Service criado (`document-service.ts`)

#### ⚠️ Observações:
- Documentos têm versões (`school_documents_versions`)
- Sistema de versionamento precisa ser implementado na UI

#### 🔧 Ações Necessárias:
1. ✅ document-service.ts criado (COMPLETO)
2. ⏳ Implementar UI para versionamento de documentos

---

### 22. **incidents** (Incidentes)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  school_id: number (FK)
  incident_type_id: number (FK para incident_types)
  incident_date: string
  description: string | null
  reported_by_id: number (FK para people)
  resolution_status: "Pendente" | "Resolvido" | "Escalado"
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Frontend:
- **Status:** ⚠️ NÃO IMPLEMENTADO
- Não há service criado
- Não há página de gerenciamento

#### 🔧 Ações Necessárias:
1. ⏳ Criar `incident-service.ts`
2. ⏳ Criar `useIncidentStore.supabase.tsx`
3. ⏳ Criar página `IncidentsList.tsx`

---

### 23. **school_events** (Eventos Escolares)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  title: string
  description: string | null
  school_id: number | null (FK)
  event_type: "Academico" | "Esportivo" | "Cultural" | ...
  start_date_time: string
  end_date_time: string
  location: string | null
  audience: "Alunos" | "Professores" | ...
  organizer_id: number (FK para people)
  status: "Confirmado" | "Cancelado" | "Adiado"
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Frontend:
- **Status:** ⚠️ NÃO IMPLEMENTADO
- Não há service criado
- Não há página de gerenciamento

#### 🔧 Ações Necessárias:
1. ⏳ Criar `event-service.ts`
2. ⏳ Criar `useEventStore.supabase.tsx`
3. ⏳ Criar página `EventsList.tsx`

---

### 24. **professional_development_programs** (Programas de Desenvolvimento Profissional)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  name: string
  description: string | null
  type: "Curso" | "Workshop" | "Conferencia" | ...
  organizer: string | null
  start_date: string
  end_date: string | null
  cost: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ⚠️ Frontend:
- **Status:** ⚠️ NÃO IMPLEMENTADO
- Não há service criado
- Não há página de gerenciamento

#### 🔧 Ações Necessárias:
1. ⏳ Criar `pd-program-service.ts`
2. ⏳ Criar `usePdProgramStore.supabase.tsx`
3. ⏳ Criar página `PdProgramsList.tsx`

---

### 25. **system_settings** (Configurações do Sistema)

#### ✅ Campos no Banco de Dados:
```typescript
{
  id: number
  setting_key: string
  setting_value: string | null
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: number
  updated_by: number | null
}
```

#### ✅ Frontend:
- **Status:** ✅ Service criado (`settings-service.ts`)
- Store: `useSettingsStore.supabase`

#### 🔧 Ações Necessárias:
1. ✅ settings-service.ts criado (COMPLETO)

---

## 📋 Resumo de Ações por Prioridade

### 🔴 Prioridade ALTA (Bloqueadores ou Muito Usados)

1. **AssessmentInput.tsx** - Refatoração completa (PENDENTE)
   - Criar `evaluation-instance-service.ts`
   - Criar `lesson-service.ts`
   - Atualizar lógica de avaliações

2. **academic_years / academic_periods** - Entidades críticas não implementadas
   - Criar services e stores
   - Criar páginas de gerenciamento

3. **Componentes com Mock Data** - Migração para Supabase
   - `StaffList.tsx`
   - `ProtocolsManager.tsx`
   - `AppointmentsManager.tsx`
   - `NewsManager.tsx`
   - `DocumentsManager.tsx`

### 🟡 Prioridade MÉDIA (Funcionalidades Importantes)

1. **Campos Faltantes em Formulários**
   - `schools.cnpj` e `schools.student_capacity`
   - `classes.homeroom_teacher_id`
   - `courses.duration_months`

2. **Responsáveis (Guardians)**
   - Criar UI para gerenciar responsáveis de alunos

3. **Infraestrutura**
   - Criar UI para gerenciar infraestrutura das escolas

4. **Versionamento de Documentos**
   - Implementar UI para versões de documentos escolares

### 🟢 Prioridade BAIXA (Funcionalidades Avançadas)

1. **Incidentes e Ações Disciplinares**
   - Criar services, stores e páginas

2. **Eventos Escolares**
   - Criar services, stores e páginas

3. **Desenvolvimento Profissional**
   - Criar services, stores e páginas

4. **Anexos (Attachments)**
   - Integrar upload/download em componentes
   - Configurar Supabase Storage

---

## 🎯 Plano de Ação Imediato

### Fase 1: Correções Críticas (1-2 dias)
- [ ] Criar `academic-year-service.ts` e store
- [ ] Criar `academic-period-service.ts` e store
- [ ] Criar `evaluation-instance-service.ts`
- [ ] Criar `lesson-service.ts`

### Fase 2: Migração de Componentes (2-3 dias)
- [ ] Atualizar `StaffList.tsx` para Supabase
- [ ] Atualizar `ProtocolsManager.tsx` para Supabase
- [ ] Atualizar `AppointmentsManager.tsx` para Supabase
- [ ] Atualizar `NewsManager.tsx` para Supabase
- [ ] Atualizar `DocumentsManager.tsx` para Supabase

### Fase 3: Campos Faltantes (1 dia)
- [ ] Adicionar campos em formulários de escolas
- [ ] Adicionar campos em formulários de turmas
- [ ] Adicionar campos em formulários de cursos

### Fase 4: Novas Funcionalidades (3-4 dias)
- [ ] Implementar gestão de Anos Letivos
- [ ] Implementar gestão de Períodos Letivos
- [ ] Refatorar `AssessmentInput.tsx`
- [ ] Implementar UI de Responsáveis
- [ ] Implementar UI de Infraestrutura

---

## 📊 Progresso Atual

**Stores Migradas para Supabase:**
- ✅ useStudentStore.supabase
- ✅ useSchoolStore.supabase
- ✅ useTeacherStore.supabase
- ✅ useCourseStore.supabase
- ✅ useAssessmentStore.supabase
- ✅ useAttendanceStore.supabase
- ✅ useDocumentStore.supabase
- ✅ usePublicContentStore.supabase
- ✅ useNotificationStore.supabase
- ✅ useSettingsStore.supabase

**Services Criados:**
- ✅ student-service.ts
- ✅ school-service.ts
- ✅ teacher-service.ts
- ✅ class-service.ts
- ✅ enrollment-service.ts
- ✅ grade-service.ts
- ✅ attendance-service.ts
- ✅ document-service.ts
- ✅ communication-service.ts
- ✅ protocol-service.ts
- ✅ public-content-service.ts
- ✅ course-service.ts
- ✅ subject-service.ts
- ✅ settings-service.ts
- ✅ attachment-service.ts

**Componentes Atualizados:**
- ✅ TeachersList.tsx
- ✅ SchoolsList.tsx
- ✅ ClassesList.tsx
- ✅ Dashboard.tsx
- ✅ Index.tsx
- ✅ StudentsList.tsx

**Faltando Implementar:**
- ⏳ academic-year-service.ts
- ⏳ academic-period-service.ts
- ⏳ evaluation-instance-service.ts
- ⏳ lesson-service.ts
- ⏳ incident-service.ts
- ⏳ event-service.ts
- ⏳ pd-program-service.ts
- ⏳ staff-service.ts

---

## 🔗 Próximos Passos

1. **Atualizar TODO list** com base nesta análise
2. **Priorizar** as ações críticas (Fase 1)
3. **Começar** pela criação dos services faltantes
4. **Testar** cada componente após migração
5. **Documentar** mudanças e novos serviços

---

**Última Atualização:** 29/12/2025  
**Por:** Sistema de Integração Supabase

