# Próximos Passos

Este documento contém o roadmap e orientações para próximas ações do projeto.

## Prioridades Imediatas (Críticas)

### 1. Segurança - Proteção de Rotas ⚠️ URGENTE
- [ ] Criar componente `ProtectedRoute`
- [ ] Implementar verificação de autenticação em rotas administrativas
- [ ] Adicionar redirecionamento para login quando não autenticado
- [ ] Testar proteção de todas as rotas sensíveis

### 2. Segurança - Senhas ⚠️ URGENTE
- [ ] Implementar hash de senhas (bcrypt ou similar)
- [ ] Remover senhas em texto plano do localStorage
- [ ] Criar sistema de autenticação mais seguro
- [ ] Remover credenciais hardcoded

### 3. Segurança - Credenciais Hardcoded ⚠️ URGENTE
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

### 9. Tratamento de Erros
- [ ] Criar sistema centralizado de tratamento de erros
- [ ] Implementar Error Boundary
- [ ] Padronizar mensagens de erro
- [ ] Adicionar logging de erros

### 10. Validação de Formulários
- [ ] Padronizar uso de Zod em todos os formulários
- [ ] Criar schemas reutilizáveis
- [ ] Implementar validação consistente

## Melhorias de Qualidade

### 11. Acessibilidade
- [ ] Audit de acessibilidade
- [ ] Adicionar atributos ARIA faltantes
- [ ] Melhorar navegação por teclado
- [ ] Testar com leitores de tela

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

### 14. Performance
- [ ] Implementar code splitting
- [ ] Adicionar memoização onde necessário
- [ ] Otimizar bundle size
- [ ] Implementar lazy loading de rotas

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

## Notas

- As tarefas marcadas com ⚠️ URGENTE devem ser priorizadas
- As correções devem ser feitas incrementalmente
- Cada correção deve ser testada antes de prosseguir
- Documentar todas as mudanças significativas

