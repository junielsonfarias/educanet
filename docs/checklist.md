# Checklist de Tarefas

Este documento contém a lista de todas as tarefas do projeto com seu status de conclusão.

## 🔴 Tarefas Críticas (Segurança)

### Segurança - Proteção de Rotas
- [x] Criar componente `ProtectedRoute`
- [x] Implementar verificação de autenticação em `Layout.tsx`
- [x] Adicionar redirecionamento para login
- [ ] Testar proteção de rotas administrativas
- [ ] Documentar sistema de autenticação

### Segurança - Senhas
- [ ] Remover senhas em texto plano
- [ ] Implementar hash de senhas
- [ ] Atualizar sistema de login
- [ ] Migrar dados existentes (se houver)
- [ ] Testar autenticação com senhas hasheadas

### Segurança - Credenciais Hardcoded
- [x] Remover credenciais hardcoded de `useUserStore.tsx`
- [ ] Implementar sistema de usuário inicial seguro
- [ ] Documentar processo de criação de primeiro usuário
- [ ] Testar criação de usuários

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
- [ ] Implementar tratamento de erros centralizado
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

## 📊 Estatísticas

- **Total de Tarefas:** 93+
- **Concluídas:** 42
- **Em Andamento:** 0
- **Pendentes:** 51+

## Legenda

- ✅ Tarefa concluída
- ⏳ Tarefa em andamento
- ❌ Tarefa não iniciada
- 🔴 Prioridade crítica
- 🟡 Prioridade média
- 🟢 Prioridade baixa

