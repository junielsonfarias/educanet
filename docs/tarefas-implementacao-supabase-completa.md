# Tarefas para Implementação Completa do Supabase

## Objetivo
Implementar autenticação, banco de dados e integração completa do EduGestão Municipal com o Supabase.

---

## 📋 Índice de Fases
1. [Fase 1: Autenticação com Supabase](#fase-1-autenticação-com-supabase)
2. [Fase 2: Criação do Banco de Dados](#fase-2-criação-do-banco-de-dados)
3. [Fase 3: Integração do Banco com o Código](#fase-3-integração-do-banco-com-o-código)

---

## Fase 1: Autenticação com Supabase

### ✅ Tarefa 1.1: Configurar Tabela de Autenticação
- [ ] Criar tabela `auth_users` no Supabase
  - [ ] Campos:
    - `id` (UUID, PK, referência para auth.users)
    - `person_id` (INTEGER, FK -> people, UNIQUE)
    - `email` (TEXT, UNIQUE, NOT NULL)
    - `active` (BOOLEAN, DEFAULT true)
    - `last_login` (TIMESTAMPTZ)
    - `created_at` (TIMESTAMPTZ)
    - `updated_at` (TIMESTAMPTZ)
- [ ] Criar índices na tabela `auth_users`:
  - [ ] `idx_auth_users_email` em `email`
  - [ ] `idx_auth_users_person_id` em `person_id`

### ✅ Tarefa 1.2: Configurar Políticas RLS para Autenticação
- [ ] Habilitar RLS na tabela `auth_users`
- [ ] Criar política de leitura:
  - [ ] Usuário autenticado pode ler seus próprios dados
  - [ ] Administradores podem ler todos os dados
- [ ] Criar política de atualização:
  - [ ] Usuário pode atualizar apenas `last_login`
  - [ ] Administradores podem atualizar todos os campos

### ✅ Tarefa 1.3: Criar Serviço de Autenticação
- [ ] Criar arquivo `src/lib/supabase/auth.ts`
- [ ] Implementar função `signIn(email, password)`:
  - [ ] Validar credenciais com Supabase Auth
  - [ ] Buscar dados do usuário (person_id, role)
  - [ ] Atualizar `last_login`
  - [ ] Retornar dados completos do usuário
- [ ] Implementar função `signOut()`:
  - [ ] Fazer logout no Supabase
  - [ ] Limpar sessão local
- [ ] Implementar função `getCurrentUser()`:
  - [ ] Verificar sessão ativa
  - [ ] Retornar dados do usuário autenticado
- [ ] Implementar função `resetPassword(email)`:
  - [ ] Solicitar redefinição de senha via Supabase

### ✅ Tarefa 1.4: Atualizar Componente de Login
- [ ] Modificar `src/pages/Login.tsx`:
  - [ ] Remover autenticação mock
  - [ ] Integrar com `signIn()` do Supabase
  - [ ] Adicionar loading states
  - [ ] Implementar tratamento de erros:
    - [ ] Credenciais inválidas
    - [ ] Usuário inativo
    - [ ] Erro de conexão
  - [ ] Adicionar link "Esqueci minha senha"
- [ ] Criar página de recuperação de senha (se necessário)

### ✅ Tarefa 1.5: Criar Hook de Autenticação
- [ ] Criar `src/hooks/useAuth.ts`:
  - [ ] Hook `useAuth()` com estado do usuário
  - [ ] Funções: `login()`, `logout()`, `isAuthenticated()`
  - [ ] Sincronização com Supabase session
  - [ ] Listener de mudanças de sessão

### ✅ Tarefa 1.6: Atualizar Proteção de Rotas
- [ ] Modificar `src/components/ProtectedRoute.tsx`:
  - [ ] Usar autenticação do Supabase
  - [ ] Verificar sessão ativa
  - [ ] Redirecionar para login se não autenticado
- [ ] Atualizar verificações de permissão:
  - [ ] Integrar com roles do banco de dados

### ✅ Tarefa 1.7: Criar Trigger para Novo Usuário
- [ ] Criar function no Supabase:
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.auth_users (id, email, created_at)
    VALUES (new.id, new.email, now());
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
- [ ] Criar trigger:
  ```sql
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

### ✅ Tarefa 1.8: Testar Autenticação
- [ ] Criar usuário de teste no Supabase
- [ ] Testar login com credenciais válidas
- [ ] Testar login com credenciais inválidas
- [ ] Testar logout
- [ ] Testar persistência de sessão
- [ ] Testar recuperação de senha
- [ ] Testar redirecionamentos

---

## Fase 2: Criação do Banco de Dados

### ✅ Tarefa 2.1: Criar Todos os ENUMs
- [ ] Executar comandos CREATE TYPE do arquivo `banco.md`:
  - [ ] `incident_severity_level`
  - [ ] `incident_resolution_status`
  - [ ] `student_incident_role`
  - [ ] `disciplinary_action_type`
  - [ ] `infrastructure_type`
  - [ ] `person_type`
  - [ ] `student_enrollment_status`
  - [ ] `education_level`
  - [ ] `class_enrollment_status`
  - [ ] `evaluation_type`
  - [ ] `attendance_status`
  - [ ] `school_document_type`
  - [ ] `communication_type`
  - [ ] `protocol_status`
  - [ ] `secretariat_request_type`
  - [ ] `portal_content_type`
  - [ ] `portal_publication_status`
  - [ ] `academic_period_type`
  - [ ] `relationship_type`
  - [ ] `preferred_contact_method`
  - [ ] `event_type`
  - [ ] `event_audience`
  - [ ] `event_status`
  - [ ] `professional_development_type`
  - [ ] `professional_development_status`
  - [ ] `entity_type`

### ✅ Tarefa 2.2: Criar Tabelas Fundamentais (Grupo 1)
- [ ] Criar tabela `people`:
  - [ ] Executar CREATE TABLE do `banco.md`
  - [ ] Adicionar índices
  - [ ] Adicionar comentários
- [ ] Criar tabela `schools`:
  - [ ] Executar CREATE TABLE do `banco.md`
  - [ ] Adicionar índices
  - [ ] Adicionar comentários
- [ ] Criar tabela `positions`:
  - [ ] Executar CREATE TABLE do `banco.md`
  - [ ] Adicionar índices
- [ ] Criar tabela `departments`:
  - [ ] Executar CREATE TABLE do `banco.md`
  - [ ] Adicionar índices

### ✅ Tarefa 2.3: Criar Tabelas de Perfis (Grupo 2)
- [ ] Criar tabela `student_profiles`
- [ ] Criar tabela `guardians`
- [ ] Criar tabela `student_guardians`
- [ ] Criar tabela `teachers`
- [ ] Criar tabela `staff`

### ✅ Tarefa 2.4: Criar Tabelas de Infraestrutura (Grupo 3)
- [ ] Criar tabela `infrastructures`

### ✅ Tarefa 2.5: Criar Tabelas Acadêmicas (Grupo 4)
- [ ] Criar tabela `academic_years`
- [ ] Criar tabela `academic_periods`
- [ ] Criar tabela `courses`
- [ ] Criar tabela `subjects`
- [ ] Criar tabela `course_subjects`
- [ ] Criar tabela `classes`

### ✅ Tarefa 2.6: Criar Tabelas de Matrículas (Grupo 5)
- [ ] Criar tabela `student_enrollments`
- [ ] Criar tabela `student_status_history`
- [ ] Criar tabela `class_enrollments`
- [ ] Criar tabela `class_teacher_subjects`

### ✅ Tarefa 2.7: Criar Tabelas de Aulas e Avaliações (Grupo 6)
- [ ] Criar tabela `lessons`
- [ ] Criar tabela `evaluation_instances`
- [ ] Criar tabela `grades`
- [ ] Criar tabela `attendances`

### ✅ Tarefa 2.8: Criar Tabelas de Documentos (Grupo 7)
- [ ] Criar tabela `school_documents`
- [ ] Criar tabela `school_documents_versions`

### ✅ Tarefa 2.9: Criar Tabelas de Comunicação (Grupo 8)
- [ ] Criar tabela `communications`
- [ ] Criar tabela `communication_recipients`

### ✅ Tarefa 2.10: Criar Tabelas de Secretaria (Grupo 9)
- [ ] Criar tabela `secretariat_protocols`
- [ ] Criar tabela `protocol_status_history`
- [ ] Criar tabela `secretariat_services`

### ✅ Tarefa 2.11: Criar Tabelas de Portal Público (Grupo 10)
- [ ] Criar tabela `public_portal_content`
- [ ] Criar tabela `public_portal_content_versions`

### ✅ Tarefa 2.12: Criar Tabelas de Sistema (Grupo 11)
- [ ] Criar tabela `system_settings`
- [ ] Criar tabela `roles`
- [ ] Criar tabela `permissions`
- [ ] Criar tabela `role_permissions`
- [ ] Criar tabela `user_roles`

### ✅ Tarefa 2.13: Criar Tabelas de Incidentes (Grupo 12)
- [ ] Criar tabela `incident_types`
- [ ] Criar tabela `incidents`
- [ ] Criar tabela `student_incidents`
- [ ] Criar tabela `disciplinary_actions`

### ✅ Tarefa 2.14: Criar Tabelas de Eventos (Grupo 13)
- [ ] Criar tabela `school_events`
- [ ] Criar tabela `event_attendees`

### ✅ Tarefa 2.15: Criar Tabelas de Desenvolvimento Profissional (Grupo 14)
- [ ] Criar tabela `professional_development_programs`
- [ ] Criar tabela `teacher_certifications`
- [ ] Criar tabela `teacher_pd_enrollments`

### ✅ Tarefa 2.16: Criar Tabela de Anexos (Grupo 15)
- [ ] Criar tabela `attachments`

### ✅ Tarefa 2.17: Adicionar Todas as Foreign Keys
- [ ] Executar todos os comandos ALTER TABLE ADD FOREIGN KEY do `banco.md`
- [ ] Verificar integridade referencial
- [ ] Testar constraints

### ✅ Tarefa 2.18: Configurar RLS - Tabelas de Pessoas
- [ ] Habilitar RLS em `people`:
  - [ ] Política: Todos podem ler pessoas ativas
  - [ ] Política: Apenas admin pode criar/editar/deletar
- [ ] Habilitar RLS em `student_profiles`:
  - [ ] Política: Professores podem ler alunos de suas turmas
  - [ ] Política: Pais podem ler dados de seus filhos
  - [ ] Política: Admin/Secretário pode tudo
- [ ] Habilitar RLS em `teachers`:
  - [ ] Política: Todos podem ler professores ativos
  - [ ] Política: Professor pode editar seus próprios dados
  - [ ] Política: Admin pode tudo
- [ ] Habilitar RLS em `staff`:
  - [ ] Política: Todos autenticados podem ler
  - [ ] Política: Apenas admin pode criar/editar/deletar

### ✅ Tarefa 2.19: Configurar RLS - Tabelas de Escolas
- [ ] Habilitar RLS em `schools`:
  - [ ] Política: Todos podem ler escolas ativas
  - [ ] Política: Diretor pode editar sua escola
  - [ ] Política: Admin/Coordenador pode tudo
- [ ] Habilitar RLS em `infrastructures`:
  - [ ] Política: Todos podem ler
  - [ ] Política: Admin/Diretor da escola pode editar

### ✅ Tarefa 2.20: Configurar RLS - Tabelas Acadêmicas
- [ ] Habilitar RLS em `classes`:
  - [ ] Política: Professores podem ler turmas que lecionam
  - [ ] Política: Diretor pode gerenciar turmas da escola
  - [ ] Política: Admin/Coordenador pode tudo
- [ ] Habilitar RLS em `student_enrollments`:
  - [ ] Política: Professores podem ler matrículas de suas turmas
  - [ ] Política: Pais podem ler matrículas de seus filhos
  - [ ] Política: Secretário/Admin pode tudo
- [ ] Habilitar RLS em `class_enrollments`:
  - [ ] Mesmas políticas de `student_enrollments`

### ✅ Tarefa 2.21: Configurar RLS - Tabelas de Avaliação
- [ ] Habilitar RLS em `evaluation_instances`:
  - [ ] Política: Professor criador pode editar
  - [ ] Política: Professores da turma podem ler
  - [ ] Política: Admin/Coordenador pode tudo
- [ ] Habilitar RLS em `grades`:
  - [ ] Política: Professor da disciplina pode editar
  - [ ] Política: Aluno pode ler suas próprias notas
  - [ ] Política: Pais podem ler notas dos filhos
  - [ ] Política: Admin/Coordenador pode tudo
- [ ] Habilitar RLS em `attendances`:
  - [ ] Política: Professor da aula pode editar
  - [ ] Política: Aluno pode ler sua frequência
  - [ ] Política: Pais podem ler frequência dos filhos

### ✅ Tarefa 2.22: Configurar RLS - Tabelas de Documentos
- [ ] Habilitar RLS em `school_documents`:
  - [ ] Política: Aluno pode ler seus documentos
  - [ ] Política: Pais podem ler documentos dos filhos
  - [ ] Política: Secretário/Admin pode tudo
- [ ] Habilitar RLS em `school_documents_versions`:
  - [ ] Mesmas políticas de `school_documents`

### ✅ Tarefa 2.23: Configurar RLS - Tabelas de Comunicação
- [ ] Habilitar RLS em `communications`:
  - [ ] Política: Remetente pode ler/editar suas comunicações
  - [ ] Política: Admin pode tudo
- [ ] Habilitar RLS em `communication_recipients`:
  - [ ] Política: Destinatário pode ler suas mensagens
  - [ ] Política: Remetente pode ver status de leitura

### ✅ Tarefa 2.24: Configurar RLS - Tabelas de Secretaria
- [ ] Habilitar RLS em `secretariat_protocols`:
  - [ ] Política: Solicitante pode ler seus protocolos
  - [ ] Política: Secretário/Admin pode tudo
- [ ] Habilitar RLS em `secretariat_services`:
  - [ ] Política: Atendente pode ler seus atendimentos
  - [ ] Política: Secretário/Admin pode tudo

### ✅ Tarefa 2.25: Configurar RLS - Tabelas Públicas
- [ ] Habilitar RLS em `public_portal_content`:
  - [ ] Política: Todos podem ler conteúdo publicado
  - [ ] Política: Autor pode editar seus conteúdos
  - [ ] Política: Admin pode tudo
- [ ] Criar view pública para conteúdo publicado (sem RLS)

### ✅ Tarefa 2.26: Configurar RLS - Tabelas de Sistema
- [ ] Habilitar RLS em `roles`:
  - [ ] Política: Todos autenticados podem ler
  - [ ] Política: Apenas admin pode criar/editar/deletar
- [ ] Habilitar RLS em `permissions`:
  - [ ] Política: Todos autenticados podem ler
  - [ ] Política: Apenas admin pode criar/editar/deletar
- [ ] Habilitar RLS em `user_roles`:
  - [ ] Política: Usuário pode ler seus próprios roles
  - [ ] Política: Admin pode gerenciar todos os roles

### ✅ Tarefa 2.27: Criar Triggers de Auditoria
- [ ] Criar function `update_updated_at()`:
  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```
- [ ] Aplicar trigger em todas as tabelas:
  - [ ] `schools`
  - [ ] `people`
  - [ ] `student_profiles`
  - [ ] `teachers`
  - [ ] `staff`
  - [ ] (todas as demais tabelas com `updated_at`)

### ✅ Tarefa 2.28: Criar Triggers de Validação
- [ ] Criar trigger para validar CPF único em `people`
- [ ] Criar trigger para validar CNPJ único em `schools`
- [ ] Criar trigger para validar capacidade de turma antes de matricular
- [ ] Criar trigger para calcular idade do aluno
- [ ] Criar trigger para validar período acadêmico dentro do ano letivo

### ✅ Tarefa 2.29: Criar Views Úteis
- [ ] View `v_student_full_info`:
  - [ ] Juntar `people`, `student_profiles`, `student_enrollments`
  - [ ] Incluir dados da escola e turma atual
- [ ] View `v_teacher_full_info`:
  - [ ] Juntar `people`, `teachers`
  - [ ] Incluir turmas que leciona
- [ ] View `v_class_roster`:
  - [ ] Listar alunos por turma com dados completos
- [ ] View `v_student_grades`:
  - [ ] Notas por aluno, disciplina e período
- [ ] View `v_student_attendance`:
  - [ ] Frequência por aluno, disciplina e período

### ✅ Tarefa 2.30: Criar Funções Úteis
- [ ] Função `calculate_student_average(student_id, period_id)`:
  - [ ] Calcular média do aluno por período
- [ ] Função `calculate_attendance_percentage(student_id, period_id)`:
  - [ ] Calcular percentual de frequência
- [ ] Função `get_student_status(student_id)`:
  - [ ] Retornar status atual do aluno
- [ ] Função `check_enrollment_capacity(class_id)`:
  - [ ] Verificar se turma tem vaga

### ✅ Tarefa 2.31: Inserir Dados de Referência
- [ ] Inserir roles padrão:
  - [ ] Admin
  - [ ] Coordenador
  - [ ] Diretor
  - [ ] Secretário
  - [ ] Professor
  - [ ] Aluno
  - [ ] Pai/Responsável
- [ ] Inserir permissions básicas:
  - [ ] CRUD para cada entidade principal
- [ ] Associar permissions aos roles (`role_permissions`)
- [ ] Inserir positions (cargos) padrão
- [ ] Inserir departments padrão

### ✅ Tarefa 2.32: Validar Estrutura do Banco
- [ ] Verificar todas as tabelas foram criadas
- [ ] Verificar todos os índices foram criados
- [ ] Verificar todas as FKs estão funcionando
- [ ] Verificar todos os ENUMs estão corretos
- [ ] Testar inserção de dados em cada tabela
- [ ] Testar políticas RLS com diferentes roles
- [ ] Documentar no Supabase Dashboard

---

## Fase 3: Integração do Banco com o Código

### ✅ Tarefa 3.1: Gerar Types do Supabase
- [ ] Executar comando de geração:
  ```bash
  npx supabase gen types typescript --project-id "your-project-id" > src/lib/supabase/database.types.ts
  ```
- [ ] Verificar tipos gerados
- [ ] Criar types auxiliares se necessário
- [ ] Atualizar `src/lib/supabase/types.ts` com novos tipos

### ✅ Tarefa 3.2: Criar Services Base
- [ ] Criar `src/lib/supabase/services/base-service.ts`:
  - [ ] Classe genérica com CRUD básico
  - [ ] Métodos: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
  - [ ] Tratamento de erros padrão
  - [ ] Suporte a filtros e ordenação
  - [ ] Suporte a paginação

### ✅ Tarefa 3.3: Criar Services de Pessoas
- [ ] Criar `src/lib/supabase/services/people-service.ts`:
  - [ ] Herdar de `BaseService`
  - [ ] Método `getByType(type)` - filtrar por tipo
  - [ ] Método `getByCpf(cpf)` - buscar por CPF
  - [ ] Método `searchByName(name)` - buscar por nome
- [ ] Criar `src/lib/supabase/services/student-service.ts`:
  - [ ] Método `getStudentFullInfo(id)` - dados completos
  - [ ] Método `getBySchool(schoolId)` - alunos por escola
  - [ ] Método `getByClass(classId)` - alunos por turma
  - [ ] Método `getGuardians(studentId)` - responsáveis do aluno
- [ ] Criar `src/lib/supabase/services/teacher-service.ts`:
  - [ ] Método `getTeacherClasses(teacherId)` - turmas do professor
  - [ ] Método `getBySchool(schoolId)` - professores por escola
  - [ ] Método `getCertifications(teacherId)` - certificações

### ✅ Tarefa 3.4: Criar Services de Escolas
- [ ] Criar `src/lib/supabase/services/school-service.ts`:
  - [ ] Método `getSchoolStats(schoolId)` - estatísticas
  - [ ] Método `getInfrastructure(schoolId)` - infraestrutura
  - [ ] Método `getStaff(schoolId)` - funcionários
  - [ ] Método `getActiveSchools()` - escolas ativas

### ✅ Tarefa 3.5: Criar Services Acadêmicos
- [ ] Criar `src/lib/supabase/services/class-service.ts`:
  - [ ] Método `getClassStudents(classId)` - alunos da turma
  - [ ] Método `getClassTeachers(classId)` - professores da turma
  - [ ] Método `getClassSubjects(classId)` - disciplinas da turma
  - [ ] Método `checkCapacity(classId)` - verificar vagas
- [ ] Criar `src/lib/supabase/services/enrollment-service.ts`:
  - [ ] Método `enrollStudent(data)` - matricular aluno
  - [ ] Método `transferStudent(data)` - transferir aluno
  - [ ] Método `updateStatus(id, status)` - atualizar status
  - [ ] Método `getStudentHistory(studentId)` - histórico de matrículas

### ✅ Tarefa 3.6: Criar Services de Avaliação
- [ ] Criar `src/lib/supabase/services/evaluation-service.ts`:
  - [ ] Método `createEvaluation(data)` - criar avaliação
  - [ ] Método `getClassEvaluations(classId)` - avaliações da turma
  - [ ] Método `getStudentEvaluations(studentId)` - avaliações do aluno
- [ ] Criar `src/lib/supabase/services/grade-service.ts`:
  - [ ] Método `saveGrade(data)` - salvar nota
  - [ ] Método `getStudentGrades(studentId, periodId)` - notas do aluno
  - [ ] Método `getClassGrades(classId, evaluationId)` - notas da turma
  - [ ] Método `calculateAverage(studentId, periodId)` - calcular média

### ✅ Tarefa 3.7: Criar Services de Frequência
- [ ] Criar `src/lib/supabase/services/attendance-service.ts`:
  - [ ] Método `recordAttendance(lessonId, records)` - registrar frequência
  - [ ] Método `getStudentAttendance(studentId, periodId)` - frequência do aluno
  - [ ] Método `getClassAttendance(classId, date)` - frequência da turma
  - [ ] Método `calculatePercentage(studentId, periodId)` - calcular percentual

### ✅ Tarefa 3.8: Criar Services de Documentos
- [ ] Criar `src/lib/supabase/services/document-service.ts`:
  - [ ] Método `generateDocument(type, studentId)` - gerar documento
  - [ ] Método `getStudentDocuments(studentId)` - documentos do aluno
  - [ ] Método `uploadVersion(documentId, file)` - nova versão
  - [ ] Método `downloadDocument(versionId)` - baixar documento

### ✅ Tarefa 3.9: Criar Services de Comunicação
- [ ] Criar `src/lib/supabase/services/communication-service.ts`:
  - [ ] Método `sendCommunication(data)` - enviar comunicação
  - [ ] Método `getUserCommunications(personId)` - comunicações do usuário
  - [ ] Método `markAsRead(communicationId)` - marcar como lida
  - [ ] Método `getUnreadCount(personId)` - contador não lidas

### ✅ Tarefa 3.10: Criar Services de Secretaria
- [ ] Criar `src/lib/supabase/services/protocol-service.ts`:
  - [ ] Método `createProtocol(data)` - criar protocolo
  - [ ] Método `updateStatus(id, status, note)` - atualizar status
  - [ ] Método `getProtocols(filters)` - listar protocolos
  - [ ] Método `getProtocolHistory(id)` - histórico do protocolo

### ✅ Tarefa 3.11: Criar Services de Portal Público
- [ ] Criar `src/lib/supabase/services/public-content-service.ts`:
  - [ ] Método `getPublishedNews()` - notícias publicadas
  - [ ] Método `getNewsById(id)` - notícia específica
  - [ ] Método `createNews(data)` - criar notícia
  - [ ] Método `publishContent(id)` - publicar conteúdo

### ✅ Tarefa 3.12: Refatorar Store - User
- [ ] Atualizar `src/stores/useUserStore.tsx`:
  - [ ] Remover dados mock
  - [ ] Integrar com `auth-service.ts`
  - [ ] Usar tipos do Supabase
  - [ ] Persistir sessão via Supabase
  - [ ] Sincronizar com `auth.onAuthStateChange()`

### ✅ Tarefa 3.13: Refatorar Store - School
- [ ] Atualizar `src/stores/useSchoolStore.tsx`:
  - [ ] Remover dados mock
  - [ ] Integrar com `school-service.ts`
  - [ ] Implementar CRUD real
  - [ ] Adicionar loading states
  - [ ] Adicionar error handling

### ✅ Tarefa 3.14: Refatorar Store - Student
- [ ] Atualizar `src/stores/useStudentStore.tsx`:
  - [ ] Remover dados mock
  - [ ] Integrar com `student-service.ts`
  - [ ] Implementar CRUD real
  - [ ] Adicionar filtros por escola/turma
  - [ ] Adicionar busca por nome/matrícula

### ✅ Tarefa 3.15: Refatorar Store - Teacher
- [ ] Atualizar `src/stores/useTeacherStore.tsx`:
  - [ ] Remover dados mock
  - [ ] Integrar com `teacher-service.ts`
  - [ ] Implementar CRUD real
  - [ ] Adicionar gestão de alocações

### ✅ Tarefa 3.16: Refatorar Store - Course
- [ ] Atualizar `src/stores/useCourseStore.tsx`:
  - [ ] Remover dados mock
  - [ ] Integrar com `class-service.ts`
  - [ ] Implementar gestão de turmas
  - [ ] Implementar gestão de disciplinas

### ✅ Tarefa 3.17: Refatorar Store - Assessment
- [ ] Atualizar `src/stores/useAssessmentStore.tsx`:
  - [ ] Remover dados mock
  - [ ] Integrar com `evaluation-service.ts` e `grade-service.ts`
  - [ ] Implementar lançamento de notas real
  - [ ] Implementar cálculo de médias

### ✅ Tarefa 3.18: Refatorar Store - Attendance
- [ ] Atualizar `src/stores/useAttendanceStore.tsx`:
  - [ ] Remover dados mock
  - [ ] Integrar com `attendance-service.ts`
  - [ ] Implementar registro de frequência real
  - [ ] Implementar cálculo de percentuais

### ✅ Tarefa 3.19: Refatorar Store - Public Content
- [ ] Atualizar `src/stores/usePublicContentStore.tsx`:
  - [ ] Remover dados mock
  - [ ] Integrar com `public-content-service.ts`
  - [ ] Implementar gestão de notícias
  - [ ] Implementar gestão de documentos públicos

### ✅ Tarefa 3.20: Refatorar Store - Settings
- [ ] Atualizar `src/stores/useSettingsStore.tsx`:
  - [ ] Remover dados mock
  - [ ] Integrar com tabela `system_settings`
  - [ ] Implementar persistência real
  - [ ] Adicionar cache local

### ✅ Tarefa 3.21: Atualizar Tipos no Mock Data
- [ ] Criar `src/lib/database-types.ts`:
  - [ ] Exportar tipos do Supabase
  - [ ] Criar types auxiliares
  - [ ] Manter compatibilidade com código existente
- [ ] Substituir tipos em `src/lib/mock-data.ts`:
  - [ ] Mapear interfaces antigas para novas
  - [ ] Adicionar adaptadores se necessário

### ✅ Tarefa 3.22: Atualizar Componentes - Students
- [ ] Atualizar `src/pages/people/StudentsList.tsx`:
  - [ ] Usar store refatorado
  - [ ] Implementar loading states
  - [ ] Implementar error states
  - [ ] Adicionar skeleton loaders
- [ ] Atualizar `src/pages/people/StudentDetails.tsx`:
  - [ ] Carregar dados do Supabase
  - [ ] Implementar edição real
- [ ] Atualizar `src/pages/people/components/StudentFormDialog.tsx`:
  - [ ] Validar dados antes de enviar
  - [ ] Integrar com service
  - [ ] Adicionar feedback de sucesso/erro

### ✅ Tarefa 3.23: Atualizar Componentes - Teachers
- [ ] Atualizar `src/pages/people/TeachersList.tsx`
- [ ] Atualizar `src/pages/people/TeacherDetails.tsx`
- [ ] Atualizar `src/pages/people/components/TeacherFormDialog.tsx`

### ✅ Tarefa 3.24: Atualizar Componentes - Schools
- [ ] Atualizar `src/pages/schools/SchoolsList.tsx`
- [ ] Atualizar `src/pages/schools/SchoolDetails.tsx`
- [ ] Atualizar `src/pages/schools/components/SchoolFormDialog.tsx`

### ✅ Tarefa 3.25: Atualizar Componentes - Classes
- [ ] Atualizar `src/pages/academic/ClassesList.tsx`
- [ ] Atualizar `src/pages/academic/CourseDetails.tsx`
- [ ] Atualizar componentes de gestão de turmas

### ✅ Tarefa 3.26: Atualizar Componentes - Assessments
- [ ] Atualizar `src/pages/academic/AssessmentInput.tsx`:
  - [ ] Carregar turmas/alunos do Supabase
  - [ ] Salvar notas no Supabase
  - [ ] Validar notas antes de salvar
- [ ] Atualizar `src/pages/academic/EvaluationRulesList.tsx`
- [ ] Atualizar `src/pages/academic/AssessmentTypesList.tsx`

### ✅ Tarefa 3.27: Atualizar Componentes - Attendance
- [ ] Atualizar `src/pages/academic/DigitalClassDiary.tsx`:
  - [ ] Carregar turmas do professor
  - [ ] Registrar frequência no Supabase
  - [ ] Exibir histórico de frequência

### ✅ Tarefa 3.28: Atualizar Componentes - Documents
- [ ] Atualizar `src/pages/documents/SchoolDocuments.tsx`:
  - [ ] Listar documentos do Supabase
  - [ ] Gerar documentos usando service
  - [ ] Upload de arquivos para Storage

### ✅ Tarefa 3.29: Atualizar Componentes - Communication
- [ ] Atualizar `src/pages/communication/NotificationsManager.tsx`:
  - [ ] Enviar notificações via Supabase
  - [ ] Listar destinatários do banco
  - [ ] Acompanhar status de leitura

### ✅ Tarefa 3.30: Atualizar Componentes - Secretariat
- [ ] Atualizar `src/pages/secretariat/ProtocolsManager.tsx`:
  - [ ] CRUD de protocolos no Supabase
  - [ ] Histórico de status
- [ ] Atualizar `src/pages/secretariat/ServiceQueue.tsx`
- [ ] Atualizar `src/pages/secretariat/AppointmentsManager.tsx`

### ✅ Tarefa 3.31: Atualizar Componentes - Public Portal
- [ ] Atualizar `src/pages/Index.tsx`:
  - [ ] Carregar notícias do Supabase
  - [ ] Exibir conteúdo institucional
- [ ] Atualizar `src/pages/public/PublicNews.tsx`:
  - [ ] Listar notícias publicadas
  - [ ] Filtrar por categoria
- [ ] Atualizar `src/pages/public/PublicNewsDetail.tsx`

### ✅ Tarefa 3.32: Atualizar Componentes - Reports
- [ ] Atualizar `src/pages/reports/PerformanceReport.tsx`:
  - [ ] Buscar dados de notas do Supabase
  - [ ] Calcular estatísticas
- [ ] Atualizar `src/pages/reports/EnrollmentReport.tsx`:
  - [ ] Buscar dados de matrículas
- [ ] Atualizar demais relatórios

### ✅ Tarefa 3.33: Implementar Upload de Arquivos
- [ ] Configurar Storage buckets no Supabase:
  - [ ] Bucket `avatars` (público)
  - [ ] Bucket `documents` (privado)
  - [ ] Bucket `attachments` (privado)
- [ ] Criar `src/lib/supabase/storage-service.ts`:
  - [ ] Método `uploadAvatar(file, userId)`
  - [ ] Método `uploadDocument(file, type, entityId)`
  - [ ] Método `deleteFile(path)`
  - [ ] Método `getPublicUrl(path)`
- [ ] Integrar upload em componentes

### ✅ Tarefa 3.34: Implementar Real-time (Opcional)
- [ ] Configurar subscriptions no Supabase
- [ ] Adicionar listeners em stores principais:
  - [ ] Notificações em tempo real
  - [ ] Atualizações de status de protocolo
  - [ ] Novas mensagens
- [ ] Implementar toasts para notificações real-time

### ✅ Tarefa 3.35: Testes de Integração
- [ ] Testar fluxo completo de matrícula
- [ ] Testar fluxo completo de lançamento de notas
- [ ] Testar fluxo completo de frequência
- [ ] Testar fluxo completo de transferência
- [ ] Testar geração de documentos
- [ ] Testar envio de comunicações
- [ ] Testar gestão de protocolos
- [ ] Testar diferentes perfis de usuário (roles)

### ✅ Tarefa 3.36: Otimizações
- [ ] Implementar cache em queries frequentes
- [ ] Implementar paginação em listas grandes
- [ ] Otimizar queries com muitos JOINs
- [ ] Adicionar índices adicionais se necessário
- [ ] Implementar lazy loading de dados

### ✅ Tarefa 3.37: Tratamento de Erros Global
- [ ] Criar interceptor de erros do Supabase
- [ ] Mapear erros do Supabase para mensagens amigáveis
- [ ] Implementar retry automático para erros de rede
- [ ] Adicionar logging de erros

### ✅ Tarefa 3.38: Documentação
- [ ] Documentar estrutura de services
- [ ] Documentar padrões de uso dos stores
- [ ] Criar guia de desenvolvimento
- [ ] Documentar políticas RLS
- [ ] Criar diagrama de arquitetura atualizado

---

## 📊 Resumo de Progresso

### Fase 1: Autenticação (0/8 tarefas)
- [ ] Configurar tabela de autenticação
- [ ] Configurar RLS para autenticação
- [ ] Criar serviço de autenticação
- [ ] Atualizar componente de login
- [ ] Criar hook de autenticação
- [ ] Atualizar proteção de rotas
- [ ] Criar triggers
- [ ] Testar autenticação

### Fase 2: Banco de Dados (0/32 tarefas)
- [ ] Criar ENUMs
- [ ] Criar todas as tabelas (16 grupos)
- [ ] Adicionar Foreign Keys
- [ ] Configurar RLS (9 grupos)
- [ ] Criar triggers
- [ ] Criar views
- [ ] Criar funções
- [ ] Inserir dados de referência
- [ ] Validar estrutura

### Fase 3: Integração (0/38 tarefas)
- [ ] Gerar types
- [ ] Criar services (11 services)
- [ ] Refatorar stores (10 stores)
- [ ] Atualizar tipos
- [ ] Atualizar componentes (9 grupos)
- [ ] Implementar upload
- [ ] Implementar real-time
- [ ] Testes
- [ ] Otimizações
- [ ] Documentação

**Progresso Total:** 0% (0/78 tarefas principais)

---

## 📝 Notas Importantes

### ⚠️ Ordem de Execução
1. **SEMPRE executar Fase 1 primeiro** - Sem autenticação nada funciona
2. **Fase 2 deve ser executada na ordem** - Respeitar dependências das FKs
3. **Fase 3 pode ser incremental** - Começar por módulos prioritários

### 🔐 Segurança
- Nunca expor service_role key no frontend
- Sempre validar dados no backend (RLS + triggers)
- Testar políticas RLS com diferentes usuários
- Implementar rate limiting para APIs públicas

### 💡 Boas Práticas
- Commitar após cada grupo de tarefas concluído
- Testar cada módulo antes de prosseguir
- Manter documentação atualizada
- Fazer backup do banco antes de mudanças grandes

### 🚀 Performance
- Usar select específico em vez de `select('*')`
- Implementar paginação desde o início
- Usar índices apropriados
- Monitorar queries lentas no Supabase Dashboard

---

**Última atualização:** 29/12/2025  
**Versão:** 1.0  
**Sistema:** EduGestão Municipal

