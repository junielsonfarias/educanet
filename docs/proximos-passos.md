# Próximos Passos

Este documento contém o roadmap e orientações para próximas ações do projeto.

## Prioridades Imediatas (Críticas)

### 1. Segurança - Verificação de Permissões ✅ CONCLUÍDO
- [x] Criar hook `usePermissions()` centralizado
- [x] Criar componente `RequirePermission` para proteger ações
- [x] Implementar verificação de permissões em TODAS as ações críticas (criar/editar/deletar)
- [x] Adicionar verificação em 17 páginas administrativas críticas
- [x] Implementar RBAC (Role-Based Access Control) completo
- [ ] Testar todas as verificações de permissões
- **📄 Ver:** `docs/implementacao-verificacao-permissoes.md` e `docs/resumo-fase-2-verificacao-permissoes.md` para detalhes
- **Status Atual:** ✅ 100% das páginas críticas verificam permissões adequadamente

### 2. Segurança - Proteção de Rotas ✅ CONCLUÍDO
- [x] Criar componente `ProtectedRoute`
- [x] Implementar verificação de autenticação em rotas administrativas
- [x] Adicionar redirecionamento para login quando não autenticado
- [ ] Testar proteção de todas as rotas sensíveis

### 2. Segurança - Senhas ⚠️ URGENTE (🟡 Em Implementação)
- [x] Instalar bcryptjs
- [x] Criar utilitários de hash (auth-utils.ts)
- [x] Implementar hash de senhas no useUserStore
- [x] Atualizar sistema de login para usar hash
- [x] Implementar migração automática de senhas antigas
- [x] Adicionar validação de força de senha
- [ ] Remover senhas em texto plano do localStorage após migração completa
- [ ] Testar autenticação com senhas hasheadas

### 4. Segurança - Credenciais Hardcoded ⚠️ URGENTE
- [ ] Remover fallback de credenciais hardcoded
- [ ] Implementar sistema de usuários inicial seguro
- [ ] Documentar processo de criação de primeiro usuário

## Prioridades de Média Urgência

### 4. TypeScript - Melhorias
- [ ] Substituir todos os `any` por tipos específicos
- [ ] Habilitar modo estrito do TypeScript gradualmente
- [ ] Adicionar tipos faltantes
- [ ] Configurar regras mais rígidas de lint

### 5. Deprecação - `substr()`
- [ ] Substituir todas as 28 ocorrências de `substr()` por `substring()` ou `slice()`
- [ ] Testar após substituições
- [ ] Verificar se não há regressões

### 6. Console.log
- [ ] Remover ou condicionar todos os console.log para desenvolvimento
- [ ] Criar utilitário de logging para produção
- [ ] Implementar sistema de logs adequado

## Integração com Banco de Dados - Supabase 🆕

### Status: 📋 Planejamento Completo

**Prioridade:** 🟡 Média-Alta (Recomendado após estabilização)

#### Documentação Criada:
- ✅ **Plano Detalhado:** `docs/plano-integracao-supabase.md`
  - 7 fases completas de implementação
  - Exemplos de código para cada fase
  - Checklists detalhados
  - Estimativa: 14-22 dias úteis

- ✅ **Roadmap:** `docs/roadmap-integracao-supabase.md`
  - Cronograma semana a semana
  - Milestones definidos
  - Template de acompanhamento

#### Próximos Passos:
1. [ ] Revisar plano detalhado
2. [ ] Criar projeto no Supabase
3. [ ] Configurar ambiente de desenvolvimento
4. [ ] Iniciar Fase 1 (Configuração Inicial)

#### Considerações:
- ⚠️ **Recomendação:** Implementar após estabilizar funcionalidades críticas
- ⚠️ **Complexidade:** Alta - requer refatoração de 23 stores
- ⚠️ **Risco:** Médio - migração de dados requer cuidado
- ✅ **Benefícios:** Escalabilidade, segurança, sincronização em tempo real

**📄 Ver:** `docs/plano-integracao-supabase.md` para detalhes completos

---

## Melhorias de Arquitetura

### 7. Gerenciamento de Estado
- [ ] Avaliar migração para Zustand ou Jotai
- [ ] Reduzir aninhamento de providers
- [ ] Melhorar performance de re-renders

### 8. Persistência de Dados
- [ ] Planejar arquitetura de backend
- [ ] Implementar API mock mais robusta
- [ ] Considerar IndexedDB para dados maiores
- [ ] Implementar sincronização de dados

### 9. Tratamento de Erros ✅ CONCLUÍDO
- [x] Criar sistema centralizado de tratamento de erros
- [x] Implementar Error Boundary (global e por módulo)
- [x] Padronizar mensagens de erro
- [x] Adicionar logging de erros
- [x] Integrar em todos os 18 stores
- [x] Implementar retry automático
- **📄 Ver:** `docs/resumo-final-tratamento-erros.md` para detalhes

### 10. Validação de Formulários
- [ ] Padronizar uso de Zod em todos os formulários
- [ ] Criar schemas reutilizáveis
- [ ] Implementar validação consistente

## Melhorias de Qualidade

### 11. Acessibilidade ⭐ PLANO DETALHADO
- [ ] Audit de acessibilidade
- [ ] Adicionar atributos ARIA faltantes
- [ ] Melhorar navegação por teclado
- [ ] Testar com leitores de tela
- **📄 Ver:** `docs/plano-acessibilidade-aria.md` para plano completo

### 12. Nomenclatura
- [ ] Refatorar arquivos para kebab-case (gradualmente)
- [ ] Atualizar imports
- [ ] Documentar padrões de nomenclatura

### 13. Testes
- [ ] Configurar ambiente de testes
- [ ] Escrever testes unitários para stores
- [ ] Escrever testes de componentes críticos
- [ ] Implementar testes E2E para fluxos principais

## Otimizações

### 14. Performance ⭐ PLANO DETALHADO
- [ ] Implementar code splitting
- [ ] Adicionar memoização onde necessário
- [ ] Otimizar bundle size
- [ ] Implementar lazy loading de rotas
- **📄 Ver:** `docs/plano-performance-code-splitting.md` para plano completo

### 15. SEO e Meta Tags
- [ ] Adicionar meta tags nas páginas públicas
- [ ] Implementar Open Graph
- [ ] Melhorar SEO do site institucional

## Documentação

### 16. Documentação Técnica
- [ ] Documentar arquitetura do projeto
- [ ] Criar guia de contribuição
- [ ] Documentar APIs e stores
- [ ] Criar diagramas de fluxo

### 17. Documentação de Usuário
- [ ] Criar manual do usuário
- [ ] Criar tutoriais em vídeo
- [ ] Documentar processos administrativos

## 🆕 Funcionalidades Prioritárias em Implementação

### Fase 1 - Documentos Escolares (✅ Concluída)
- [x] Criar interfaces e stores básicos
- [x] Implementar geradores de PDF (Histórico e Declaração de Matrícula)
- [x] Criar páginas de geração de documentos
- [x] Integrar biblioteca de PDF (jsPDF)
- [x] Implementar geradores restantes (Ficha Individual, Transferência, Ata, Certificado)
- **📄 Status:** Todos os 6 geradores de documentos implementados e funcionais

### Fase 2 - Censo Escolar (✅ 95% Concluído)
- [x] Atualizar interfaces com dados completos
- [x] Criar formulários de preenchimento (Professores e Infraestrutura)
- [x] Implementar validações do INEP (100% concluído) ⭐ PLANO DETALHADO
  - [x] Validação de CPF/CNPJ
  - [x] Validação de códigos INEP (escola, etapa, modalidade, tipo de regime)
  - [x] Validação de idade vs série/ano
  - [x] Validação de matrículas duplicadas
  - [x] Validação de matrículas simultâneas
  - [x] Validação de relacionamentos
  - [x] Validação de capacidade da turma
  - [x] Validação de período de matrícula
  - [x] Validação de datas
  - [x] Validação de campos obrigatórios
  - [x] Integração em formulários
- [x] Exportador Educacenso
  - [x] Geração de arquivo no formato Educacenso
  - [x] Página de exportação com opções configuráveis
- [x] Relatório de inconsistências
  - [x] Geração de relatório completo
  - [x] Página de visualização com filtros
- **📄 Ver:** `docs/plano-validacoes-inep.md` e `docs/implementacao-validacoes-inep.md` para detalhes

### Fase 3 - Comunicação (✅ Concluída)
- [x] Criar interfaces e stores básicos
- [x] Criar interfaces de usuário (Notificações e Templates)
- [x] Criar templates
- [x] Implementar envio (simulado)
- [ ] Configurar serviço de e-mail real ⭐ PLANO DETALHADO
- [ ] Implementar envio automático
- [ ] Integração SMS ⭐ PLANO DETALHADO
- **📄 Ver:** `docs/plano-servico-email.md` e `docs/plano-integracao-sms.md` para planos completos

### Fase 4 - Secretaria (✅ Concluída)
- [x] Criar interfaces e stores básicos
- [x] Criar interfaces de usuário (Protocolos, Fila, Agendamentos)
- [x] Implementar fila de atendimento
- [x] Criar sistema de agendamento

### Fase 5 - Melhorias Baseadas no GEP (✅ Concluída)
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

### Fase 6 - Alinhamento com Censo Escolar (✅ Concluída)
- [x] Criar documento de análise e plano de migração
- [x] Renomear interfaces: Grade → SerieAno, Course → EtapaEnsino, Classroom → Turma, AcademicYear → AnoLetivo
- [x] Adicionar campos do Censo Escolar (etapaEnsinoId, codigoCenso, tipoRegime, etc)
- [x] Atualizar mock-data.ts com novas interfaces e aliases para compatibilidade
- [x] Atualizar stores (useSchoolStore, useCourseStore) com nova nomenclatura
- [x] Atualizar componente ClassroomDialog com campos do Censo Escolar
- [ ] Atualizar todas as referências nos componentes e páginas (em progresso)

## 📚 Planos Detalhados Criados

Os seguintes planos detalhados foram criados para facilitar a implementação:

1. **Validações INEP Completas** - `docs/plano-validacoes-inep.md`
   - Validação de CPF/CNPJ, códigos INEP, idade vs série, matrículas, etc.
   - Estimativa: 2-3 semanas

2. **Serviço de E-mail Real** - `docs/plano-servico-email.md`
   - Configuração SMTP, templates, envio automático
   - Estimativa: 1-2 semanas

3. **Integração SMS** - `docs/plano-integracao-sms.md`
   - Integração com Twilio/Zenvia, templates, envio automático
   - Estimativa: 1 semana

4. **Apps Mobile** - `docs/plano-apps-mobile.md`
   - PWA ou React Native para professores e alunos
   - Estimativa: 6-8 semanas

5. **Tratamento de Erros Centralizado** - `docs/plano-tratamento-erros.md`
   - Error Boundaries, logging, mensagens padronizadas
   - Estimativa: 1 semana

6. **Performance e Code Splitting** - `docs/plano-performance-code-splitting.md`
   - Lazy loading, memoização, otimização de bundle
   - Estimativa: 1-2 semanas

7. **Acessibilidade (ARIA)** - `docs/plano-acessibilidade-aria.md`
   - Atributos ARIA, navegação por teclado, leitores de tela
   - Estimativa: 2 semanas

## Notas

- As tarefas marcadas com ⚠️ URGENTE devem ser priorizadas
- As tarefas marcadas com ⭐ PLANO DETALHADO têm planos completos disponíveis
- As correções devem ser feitas incrementalmente
- Cada correção deve ser testada antes de prosseguir
- Documentar todas as mudanças significativas
- **Novas funcionalidades:** Interfaces e stores básicos criados para Conselho de Classe, Anexos e Transferência Automática. Próximo passo: implementar interfaces de usuário.

