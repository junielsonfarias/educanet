# Checklist de Tarefas

Este documento contém a lista de todas as tarefas do projeto com seu status de conclusão.

## 🔴 Tarefas Críticas (Segurança)

### Segurança - Proteção de Rotas
- [x] Criar componente `ProtectedRoute`
- [x] Implementar verificação de autenticação em `Layout.tsx`
- [x] Adicionar redirecionamento para login
- [ ] Testar proteção de rotas administrativas
- [ ] Documentar sistema de autenticação

### Segurança - Senhas (🟡 Em Implementação)
- [x] Instalar bcryptjs
- [x] Criar utilitários de hash (auth-utils.ts)
- [x] Implementar hash de senhas no useUserStore
- [x] Atualizar sistema de login para usar hash
- [x] Implementar migração automática de senhas antigas
- [x] Adicionar validação de força de senha
- [x] Atualizar UserFormDialog para validar senha
- [ ] Remover senhas em texto plano após migração completa
- [ ] Testar autenticação com senhas hasheadas

### Segurança - Credenciais Hardcoded (🟡 Parcial)
- [x] Remover credenciais hardcoded de `useUserStore.tsx`
- [x] Implementar hash de senhas (senha padrão agora usa hash)
- [ ] Implementar sistema de usuário inicial seguro (wizard de primeiro acesso)
- [ ] Documentar processo de criação de primeiro usuário
- [ ] Testar criação de usuários

### Segurança - Verificação de Permissões (✅ CONCLUÍDO)
- [x] Criar hook `usePermissions()` centralizado
- [x] Criar componente `RequirePermission` para proteger ações
- [x] Adicionar verificação em `SchoolsList.tsx` (criar/editar/deletar)
- [x] Adicionar verificação em `TeachersList.tsx` (criar/editar/deletar)
- [x] Adicionar verificação em `StaffList.tsx` (criar/editar/deletar)
- [x] Adicionar verificação em `DocumentsManager.tsx` (todas as ações)
- [x] Adicionar verificação em `NewsManager.tsx` (todas as ações)
- [x] Adicionar verificação em `NotificationsManager.tsx` (todas as ações)
- [x] Adicionar verificação em `ProtocolsManager.tsx` (todas as ações)
- [x] Adicionar verificação em `AppointmentsManager.tsx` (todas as ações)
- [x] Adicionar verificação em `ServiceQueue.tsx` (todas as ações)
- [x] Adicionar verificação em `TransfersManager.tsx` (todas as ações)
- [x] Adicionar verificação em `CoursesList.tsx` (todas as ações)
- [x] Adicionar verificação em `AssessmentInput.tsx` (lançamento de notas)
- [x] Adicionar verificação em `EvaluationRulesList.tsx` (todas as ações)
- [x] Adicionar verificação em `AssessmentTypesList.tsx` (todas as ações)
- [x] Adicionar verificação em `ClassCouncil.tsx` (todas as ações)
- [x] Adicionar verificação em `StudentsList.tsx` (criar/editar/deletar)
- [x] Adicionar verificação em `LessonPlanning.tsx` (todas as ações)
- [ ] Adicionar verificação em `DigitalClassDiary.tsx` (todas as ações) - PENDENTE
- [x] Implementar RBAC (Role-Based Access Control) completo
- [x] Documentar sistema de permissões
- [ ] Testar todas as verificações de permissões
- **📄 Ver:** `docs/implementacao-verificacao-permissoes.md` e `docs/resumo-fase-2-verificacao-permissoes.md` para detalhes
- **Status:** ✅ 17 de 18 páginas críticas protegidas (94% de cobertura)

## 🟡 Tarefas de Média Prioridade

### TypeScript - Melhorias
- [ ] Substituir `any` em `useTeacherStore.tsx`
- [ ] Substituir `any` em `useStudentStore.tsx`
- [ ] Substituir `any` em `qedu-service.ts`
- [ ] Substituir `any` em `NewsFormDialog.tsx`
- [ ] Substituir `any` em `UsersList.tsx`
- [ ] Substituir `any` em `DocumentsManager.tsx`
- [ ] Substituir `any` em `NewsManager.tsx`
- [ ] Substituir `any` em `WebsiteContent.tsx`
- [ ] Substituir `any` em `UserFormDialog.tsx`
- [ ] Habilitar modo estrito do TypeScript
- [ ] Configurar regras mais rígidas

### Deprecação - `substr()`
- [x] Substituir `substr()` em `useUserStore.tsx`
- [x] Substituir `substr()` em `useTeacherStore.tsx`
- [x] Substituir `substr()` em `useStudentStore.tsx` (3 ocorrências)
- [x] Substituir `substr()` em `useReportStore.tsx`
- [x] Substituir `substr()` em `useSchoolStore.tsx` (4 ocorrências)
- [x] Substituir `substr()` em `usePublicContentStore.tsx` (2 ocorrências)
- [x] Substituir `substr()` em `useProjectStore.tsx`
- [x] Substituir `substr()` em `useAlertStore.tsx` (2 ocorrências)
- [x] Substituir `substr()` em `useAssessmentStore.tsx` (2 ocorrências)
- [x] Substituir `substr()` em `useCourseStore.tsx` (4 ocorrências)
- [x] Substituir `substr()` em `useAttendanceStore.tsx`
- [x] Substituir `substr()` em `useOccurrenceStore.tsx`
- [x] Substituir `substr()` em `useLessonPlanStore.tsx`
- [x] Substituir `substr()` em `WebsiteContent.tsx` (2 ocorrências)
- [x] Substituir `substr()` em `QEduAlertsDialog.tsx`
- [x] Testar todas as substituições

### Console.log
- [ ] Remover/condicionar console.log em `useTeacherStore.tsx`
- [ ] Remover/condicionar console.log em `useSettingsStore.tsx`
- [ ] Remover/condicionar console.log em `useStudentStore.tsx`
- [ ] Remover/condicionar console.log em `useReportStore.tsx`
- [ ] Remover/condicionar console.log em `useSchoolStore.tsx`
- [ ] Remover/condicionar console.log em `qedu-service.ts` (2 ocorrências)
- [ ] Remover/condicionar console.log em `useAttendanceStore.tsx`
- [ ] Remover/condicionar console.log em `BackupRestore.tsx` (3 ocorrências)
- [ ] Remover/condicionar console.log em `SchoolFormDialog.tsx`
- [ ] Remover/condicionar console.log em `PublicQEduData.tsx` (2 ocorrências)
- [ ] Remover/condicionar console.log em `NotFound.tsx`
- [ ] Remover/condicionar console.log em `grade-calculator.ts` (2 ocorrências)
- [ ] Criar utilitário de logging para desenvolvimento

## 🟢 Tarefas de Baixa Prioridade

### Nomenclatura de Arquivos
- [ ] Refatorar arquivos para kebab-case (fase 1)
- [ ] Refatorar arquivos para kebab-case (fase 2)
- [ ] Atualizar todos os imports
- [ ] Documentar padrão de nomenclatura

### Arquitetura
- [ ] Avaliar migração para Zustand
- [ ] Reduzir aninhamento de providers
- [ ] Implementar sistema de persistência melhorado

### Qualidade de Código
- [x] Implementar tratamento de erros centralizado ✅
- [ ] Padronizar validação de formulários
- [ ] Melhorar acessibilidade
- [ ] Adicionar testes

## 🔧 Configurações e Dependências

### Variáveis de Ambiente
- [x] Criar arquivo `.env` com chave QEdu API
- [x] Criar arquivo `.env.example` como template
- [x] Verificar `.gitignore` contém `.env*`

### Limpeza de Código
- [x] Remover import `Loader2` não utilizado de `ProtectedRoute.tsx`
- [x] Remover import `loadEnv` não utilizado de `vite.config.ts`

### Instalação de Dependências
- [x] Instalar TailwindCSS e dependências relacionadas
- [x] Verificar instalação do Vite (rolldown-vite)
- [x] Verificar instalação do React e dependências principais
- [x] Documentar problemas e soluções de instalação

## 🔗 Correções de Relacionamentos entre Módulos

### Interface Enrollment
- [x] Adicionar `classroomId` ao interface Enrollment
- [x] Adicionar `academicYearId` ao interface Enrollment
- [x] Manter campos legados (`grade`, `year`) para compatibilidade

### Formulários de Matrícula
- [x] Atualizar EnrollmentFormDialog para salvar classroomId e academicYearId
- [x] Atualizar StudentFormDialog para salvar classroomId e academicYearId

### Funções Utilitárias
- [x] Criar arquivo `enrollment-utils.ts` com funções centralizadas
- [x] Implementar `getClassroomFromEnrollment()` com fallback
- [x] Implementar `getAcademicYearFromEnrollment()` com fallback
- [x] Implementar `getStudentsByClassroom()` com fallback
- [x] Implementar `validateEnrollment()` para validação de relacionamentos

### Componentes Atualizados
- [x] Atualizar DigitalClassDiary para usar funções utilitárias
- [x] Atualizar PerformanceReport para usar funções utilitárias
- [x] Atualizar GradeEntryReport para usar funções utilitárias
- [x] Atualizar StudentDetails para usar funções utilitárias
- [x] Atualizar StudentPerformanceCard para usar funções utilitárias

### Documentação
- [x] Criar documentação completa da análise de relacionamentos
- [x] Documentar correções implementadas
- [x] Documentar problemas restantes e recomendações

### Validações e Limpeza de Dados
- [x] Integrar validateEnrollment() no EnrollmentFormDialog
- [x] Integrar validateEnrollment() no StudentFormDialog
- [x] Criar função cleanupClassroomData() para limpeza de dados relacionados
- [x] Criar função getClassroomDataStats() para estatísticas antes de deletar
- [x] Integrar limpeza de dados ao deletar turmas em ClassesList
- [x] Adicionar aviso de dados relacionados no diálogo de confirmação

## 🆕 Novas Funcionalidades Prioritárias

### Gestão de Documentos Escolares (✅ Concluída)
- [x] Criar interfaces para documentos escolares (SchoolDocument, DocumentType, DocumentContent)
- [x] Criar store useDocumentStore com funcionalidades básicas
- [x] Implementar gerador de Histórico Escolar
- [x] Implementar gerador de Declaração de Matrícula
- [x] Implementar gerador de Ficha Individual (Censo)
- [x] Implementar gerador de Declaração de Transferência
- [x] Implementar gerador de Ata de Resultados Finais
- [x] Implementar gerador de Certificado de Conclusão
- [x] Criar páginas de geração de documentos
- [x] Integrar biblioteca de geração de PDF (jsPDF)

### Censo Escolar - Completar Dados (✅ 95% Concluído)
- [x] Atualizar interface Teacher com campos de formação acadêmica
- [x] Atualizar interface School com infraestrutura detalhada
- [x] Criar interfaces para EducationModality, AdministrativeRooms, SchoolInfrastructure
- [x] Criar formulários completos para dados do professor
- [x] Criar formulários completos para infraestrutura da escola
- [x] Criar formulários para modalidades de ensino
- [x] Implementar validações do INEP (100% concluído)
  - [x] Validação de CPF/CNPJ
  - [x] Validação de códigos INEP (escola, etapa de ensino, modalidade, tipo de regime)
  - [x] Validação de idade vs série/ano
  - [x] Validação de matrículas duplicadas
  - [x] Validação de matrículas simultâneas
  - [x] Validação de relacionamentos (escola, ano letivo, turma)
  - [x] Validação de capacidade da turma
  - [x] Validação de período de matrícula
  - [x] Validação de datas (formato, lógica, período letivo)
  - [x] Validação de campos obrigatórios (Aluno, Professor, Escola, Turma, Etapa)
  - [x] Validação de relacionamentos entre entidades
  - [x] Integração em formulários (Student, Teacher, Enrollment, School, Course, Classroom)
- [x] Exportador Educacenso
  - [x] Geração de arquivo no formato Educacenso (TXT com pipe)
  - [x] Registros: 00 (Escola), 10 (Aluno), 20 (Professor), 30 (Turma), 40 (Infraestrutura)
  - [x] Validação antes de exportar
  - [x] Página de exportação com opções configuráveis
- [x] Relatório de inconsistências
  - [x] Geração de relatório completo
  - [x] Filtros por tipo (erro, aviso, info) e entidade
  - [x] Exportação para CSV
  - [x] Página de visualização com estatísticas

### Comunicação e Notificações
- [x] Criar interfaces para Notification, NotificationTemplate, NotificationSettings
- [x] Criar store useNotificationStore com funcionalidades básicas
- [ ] Implementar serviço de e-mail (SMTP)
- [ ] Criar templates de e-mail
- [ ] Implementar envio automático de boletim
- [ ] Implementar envio automático de alertas
- [ ] Integrar serviço de SMS (opcional)
- [ ] Criar painel de notificações
- [ ] Implementar notificações push (futuro)

### Secretaria Escolar
- [x] Criar interfaces para Protocol, ProtocolDocument, ProtocolHistory
- [x] Criar interfaces para Appointment e ServiceQueue
- [x] Criar store useProtocolStore com funcionalidades básicas
- [x] Criar store useAppointmentStore com funcionalidades básicas
- [x] Criar store useQueueStore com funcionalidades básicas
- [x] Criar páginas de gestão de protocolos
- [x] Criar sistema de fila de atendimento (interface)
- [x] Criar sistema de agendamento (interface)
- [x] Criar solicitações online (portal do responsável)
- [ ] Criar histórico de atendimentos
- [ ] Criar relatórios gerenciais

### Melhorias Baseadas no GEP
- [x] Criar interfaces para Conselho de Classe
- [x] Criar interfaces para Anexos de Documentos
- [x] Criar interfaces para Transferência Automática
- [x] Criar stores (useCouncilStore, useAttachmentStore, useTransferStore)
- [x] Integrar providers no App.tsx
- [x] Implementar página de Conselho de Classe
- [x] Implementar sistema de upload de anexos
- [x] Criar portal de Matrícula Online para responsáveis
- [x] Melhorar interface de Transferência Automática
- [x] Adicionar upload de foto para Professores
- [x] Melhorar formulário de Turmas (capacidade, professor regente, modalidade)
- [x] Criar formulário de Funcionários (não-docentes)

### Fase 7 - Dados Mock Expandidos (✅ Concluída)
- [x] Criar arquivo `src/lib/mock-data-expanded.ts` com dados completos
- [x] Adicionar dados expandidos para `EtapaEnsino` (5 etapas completas)
- [x] Adicionar dados expandidos para `AssessmentType` (8 tipos)
- [x] Adicionar dados expandidos para `School` (3 escolas com turmas)
- [x] Adicionar dados expandidos para `Teacher` (10 professores)
- [x] Adicionar dados expandidos para `Student` (múltiplos alunos)
- [x] Adicionar dados expandidos para `Assessment`, `AttendanceRecord`, `Occurrence`
- [x] Adicionar dados expandidos para `Staff` (funcionários não-docentes)
- [x] Adicionar dados expandidos para `Protocol`, `Appointment`, `QueueItem`
- [x] Adicionar dados expandidos para `SchoolDocument`, `NewsPost`, `PublicDocument`
- [x] Adicionar dados expandidos para `ClassCouncil`, `StudentTransfer`, `DocumentAttachment`
- [x] Integrar dados expandidos em `src/lib/mock-data.ts` com fallback
- [x] Garantir alinhamento com nomenclatura do Censo Escolar
- [x] Integrar `expandedMockNews` em `mock-data.ts` (CORRIGIDO)
- [x] Integrar `expandedMockPublicDocuments` em `mock-data.ts` (CORRIGIDO)
- [x] Criar e integrar `expandedMockInstitutionalContent` (CORRIGIDO)
- [x] Validar vinculação de todos os dados mock com portal público (100% completo)

### Fase 8 - Correção de Loops Infinitos em useEffect (✅ Concluída)
- [x] Analisar todos os arquivos com useEffect e form.reset/form.setValue
- [x] Identificar padrões problemáticos (form, initialData, arrays nas dependências)
- [x] Corrigir TransferFormDialog.tsx (prioridade alta)
- [x] Corrigir AssessmentInput.tsx (prioridade alta - 7 useEffects)
- [x] Corrigir EnrollmentFormDialog.tsx (prioridade alta)
- [x] Corrigir NotificationFormDialog.tsx (prioridade alta)
- [x] Corrigir todos os FormDialogs de prioridade média (16 arquivos)
- [x] Documentar análise completa e correções aplicadas
- [x] Validar que não há erros de lint

### Fase 9 - Correção de Erros do Console do Navegador (✅ Concluída)
- [x] Remover script externo goskip.dev do index.html
- [x] Corrigir button aninhado dentro de AccordionTrigger (CourseDetails.tsx)
- [x] Otimizar ResponsiveContainer duplicado no Dashboard.tsx
- [x] Remover ResponsiveContainer duplicado de AgeGradeDistortionReport.tsx
- [x] Remover ResponsiveContainer duplicado de ApprovalFailureReport.tsx
- [x] Resolver erro removeChild relacionado ao componente Text do recharts
- [x] Documentar análise completa e correções aplicadas

### Fase 10 - Correção de Erros no ClassesList (✅ Concluída)
- [x] Corrigir falta de key prop em SelectItem (ClassesList.tsx)
- [x] Adicionar useMemo para memoizar uniqueYears e uniqueGrades
- [x] Filtrar valores undefined/null de uniqueYears e uniqueGrades
- [x] Adicionar suporte a serieAnoName além de gradeName
- [x] Corrigir filtro para verificar tanto gradeName quanto serieAnoName
- [x] Resolver erro removeChild no SelectItemText do Radix UI

### Fase 11 - Correção de Erro removeChild no ClassroomDialog (✅ Concluída)
- [x] Adicionar useMemo para selectedEtapa no ClassroomDialog
- [x] Adicionar useMemo para availableSeriesAnos no ClassroomDialog
- [x] Adicionar filtros de segurança em todos os SelectItem (schools, academicYears, etapasEnsino, teachers)
- [x] Garantir que valores undefined sejam filtrados antes de renderizar
- [x] Resolver erro removeChild persistente ao editar turma

### Fase 12 - Correção Final de Erro removeChild em Gráficos (✅ Concluída)
- [x] Memoizar chartId no ChartContainer para evitar mudanças entre renders
- [x] Adicionar key estável ao ResponsiveContainer no ChartContainer
- [x] Adicionar proteções para dados vazios em StrategicDashboard
- [x] Adicionar proteções para dados vazios em ComparativeReports
- [x] Adicionar proteções para dados vazios em AcademicPerformanceAnalysis
- [x] Adicionar proteções para dados vazios em QEduSchoolList
- [x] Adicionar proteções para dados vazios em QEduComparison
- [x] Adicionar proteções para dados vazios em QEduOverview
- [x] Melhorar keys dos Cell em PieCharts (usar entry.name em vez de index)

## 🗄️ Integração com Supabase 🆕

### Status: 📋 Planejamento Completo

- [ ] **Fase 1:** Configuração Inicial (1-2 dias)
  - [ ] Instalar @supabase/supabase-js
  - [ ] Criar projeto no Supabase
  - [ ] Configurar variáveis de ambiente
  - [ ] Criar estrutura de arquivos
  - [ ] Configurar cliente Supabase
  - [ ] Criar helpers e utilitários
  - [ ] Testar conexão

- [ ] **Fase 2:** Schema do Banco (3-5 dias)
  - [ ] Criar tabelas principais (15+)
  - [ ] Criar tabelas secundárias (10+)
  - [ ] Configurar foreign keys
  - [ ] Configurar RLS policies
  - [ ] Criar funções auxiliares
  - [ ] Criar triggers
  - [ ] Criar índices
  - [ ] Validar relacionamentos
  - [ ] Documentar schema

- [ ] **Fase 3:** Infraestrutura de Serviços (2-3 dias)
  - [ ] Criar serviço base genérico
  - [ ] Implementar serviços específicos (10+)
  - [ ] Criar hook useSupabase
  - [ ] Criar hook useRealtime
  - [ ] Implementar cache (opcional)
  - [ ] Adicionar retry logic
  - [ ] Testar serviços
  - [ ] Documentar APIs

- [ ] **Fase 4:** Refatoração de Stores (5-7 dias)
  - [ ] Refatorar useUserStore
  - [ ] Refatorar useSchoolStore
  - [ ] Refatorar useStudentStore
  - [ ] Refatorar stores acadêmicos (5+)
  - [ ] Refatorar stores secundários (10+)
  - [ ] Adicionar loading states
  - [ ] Adicionar error handling
  - [ ] Testar cada store
  - [ ] Atualizar componentes
  - [ ] Remover código localStorage

- [ ] **Fase 5:** Autenticação (2-3 dias)
  - [ ] Configurar Supabase Auth
  - [ ] Criar AuthService
  - [ ] Refatorar useUserStore
  - [ ] Atualizar componente Login
  - [ ] Atualizar ProtectedRoute
  - [ ] Implementar recuperação de senha
  - [ ] Testar fluxo completo
  - [ ] Configurar redirects
  - [ ] Validar sessões

- [ ] **Fase 6:** Migração de Dados (1-2 dias)
  - [ ] Criar script de migração
  - [ ] Implementar validação
  - [ ] Fazer backup completo
  - [ ] Testar em desenvolvimento
  - [ ] Validar integridade
  - [ ] Executar em produção
  - [ ] Verificar dados migrados
  - [ ] Documentar processo

- [ ] **Fase 7:** Testes e Validação (2-3 dias)
  - [ ] Testar todos os stores
  - [ ] Testar autenticação
  - [ ] Testar relacionamentos
  - [ ] Testar permissões
  - [ ] Testar performance
  - [ ] Corrigir bugs
  - [ ] Documentar problemas

**📄 Ver:** `docs/plano-integracao-supabase.md` para plano completo detalhado  
**📄 Ver:** `docs/roadmap-integracao-supabase.md` para cronograma  
**📄 Ver:** `docs/resumo-plano-supabase.md` para resumo executivo

---

## 📊 Estatísticas

- **Total de Tarefas:** 278+
- **Concluídas:** 175+
- **Em Andamento:** 0
- **Pendentes:** 103+ (incluindo 73 tarefas de integração Supabase)

## Legenda

- ✅ Tarefa concluída
- ⏳ Tarefa em andamento
- ❌ Tarefa não iniciada
- 🔴 Prioridade crítica
- 🟡 Prioridade média
- 🟢 Prioridade baixa
- 🆕 Nova funcionalidade/plano

