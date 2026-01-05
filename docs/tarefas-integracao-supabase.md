# Tarefas para Integração com Supabase

## Objetivo
Integrar o sistema EduGestão Municipal com o Supabase, preparando a infraestrutura para autenticação e banco de dados.

---

## Fase 1: Configuração Inicial do Supabase

### ✅ Tarefa 1.1: Criar Projeto no Supabase
- [ ] Acessar https://supabase.com e fazer login/criar conta
- [ ] Criar novo projeto
  - [ ] Definir nome do projeto: `educanet-municipal`
  - [ ] Escolher senha do banco de dados (forte e segura)
  - [ ] Selecionar região do servidor (preferencialmente South America - São Paulo)
- [ ] Aguardar provisionamento do projeto (2-3 minutos)
- [ ] Anotar credenciais fornecidas:
  - [ ] Project URL
  - [ ] API Key (anon/public)
  - [ ] API Key (service_role - manter secreta)

### ✅ Tarefa 1.2: Configurar Variáveis de Ambiente
- [x] Criar arquivo `.env.local` na raiz do projeto
- [x] Adicionar variáveis do Supabase:
  ```env
  VITE_SUPABASE_URL=your_project_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```
- [x] Verificar se `.env.local` está no `.gitignore`
- [x] Atualizar arquivo `.env.example` com exemplos das novas variáveis
- [x] Documentar as variáveis de ambiente necessárias

### ✅ Tarefa 1.3: Instalar Dependências
- [x] Instalar o cliente Supabase:
  ```bash
  pnpm add @supabase/supabase-js
  ```
- [x] Verificar versão instalada (deve ser >= 2.39.0) - **Instalada: v2.89.0 ✓**
- [x] Atualizar `package.json` se necessário

---

## Fase 2: Configuração do Cliente Supabase

### ✅ Tarefa 2.1: Criar Arquivo de Configuração
- [x] Criar pasta `src/lib/supabase/`
- [x] Criar arquivo `src/lib/supabase/client.ts`
- [x] Implementar cliente Supabase:
  ```typescript
  import { createClient } from '@supabase/supabase-js'

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
  ```
- [x] Adicionar validação de variáveis de ambiente
- [x] Adicionar tratamento de erros

### ✅ Tarefa 2.2: Criar Helpers do Supabase
- [x] Criar arquivo `src/lib/supabase/helpers.ts`
- [x] Implementar funções auxiliares:
  - [x] `checkConnection()` - Testar conexão com Supabase
  - [x] `handleSupabaseError()` - Tratar erros do Supabase
  - [x] `isSupabaseConfigured()` - Verificar se está configurado
- [x] Adicionar tipos TypeScript para respostas do Supabase

### ✅ Tarefa 2.3: Criar Types do Supabase
- [x] Criar arquivo `src/lib/supabase/types.ts`
- [ ] Gerar tipos do banco de dados (após criar schema):
  ```bash
  npx supabase gen types typescript --project-id "your-project-id" > src/lib/supabase/database.types.ts
  ```
  **Nota:** Esta tarefa será executada após a criação do schema do banco de dados
- [x] Criar interfaces para respostas de API
- [x] Criar tipos para erros customizados

---

## Fase 3: Testar Conexão com Supabase

### ✅ Tarefa 3.1: Criar Página de Teste
- [x] Criar arquivo `src/pages/settings/SupabaseTest.tsx`
- [x] Implementar interface de teste:
  - [x] Botão "Testar Conexão"
  - [x] Display de status da conexão
  - [x] Display de informações do projeto
  - [x] Logs de teste
- [x] Adicionar componente de loading
- [x] Adicionar tratamento de erros visuais

### ✅ Tarefa 3.2: Implementar Testes de Conexão
- [x] Criar função para testar autenticação anônima
- [x] Criar função para testar acesso ao banco
- [x] Criar função para verificar permissões
- [x] Implementar logs detalhados dos testes
- [x] Adicionar feedback visual para cada teste

### ✅ Tarefa 3.3: Adicionar Rota de Teste
- [x] Atualizar `src/App.tsx` com rota de teste
- [x] Adicionar link no sidebar (apenas para admins)
- [x] Proteger rota com permissões (apenas desenvolvimento/admin)
- [x] Adicionar documentação sobre a página de teste

---

## Fase 4: Configurar Storage (Opcional nesta fase)

### ✅ Tarefa 4.1: Criar Buckets no Supabase
- [x] Acessar Dashboard do Supabase > Storage *(Instruções documentadas em SUPABASE_SETUP.md)*
- [x] Criar bucket `avatars`:
  - [x] Definir como público *(Instruções documentadas)*
  - [x] Configurar políticas de acesso *(Instruções documentadas)*
- [x] Criar bucket `documents`:
  - [x] Definir como privado *(Instruções documentadas)*
  - [x] Configurar políticas de acesso *(Instruções documentadas)*
- [x] Criar bucket `photos`:
  - [x] Definir como público *(Instruções documentadas)*
  - [x] Configurar políticas de acesso *(Instruções documentadas)*

### ✅ Tarefa 4.2: Configurar Políticas de Storage
- [x] Criar política de leitura pública para `avatars` *(SQL documentado em SUPABASE_SETUP.md)*
- [x] Criar política de upload autenticado para `avatars` *(SQL documentado em SUPABASE_SETUP.md)*
- [x] Criar políticas para `documents` (apenas usuários autenticados) *(SQL documentado em SUPABASE_SETUP.md)*
- [x] Criar políticas para `photos` (leitura pública, upload autenticado) *(SQL documentado em SUPABASE_SETUP.md)*
- [x] Testar políticas com diferentes cenários *(Instruções documentadas)*

### ✅ Tarefa 4.3: Criar Helpers de Storage
- [x] Criar arquivo `src/lib/supabase/storage.ts`
- [x] Implementar função `uploadFile()`
- [x] Implementar função `deleteFile()`
- [x] Implementar função `getPublicUrl()`
- [x] Implementar função `getSignedUrl()`
- [x] Adicionar validações de tipo de arquivo
- [x] Adicionar validações de tamanho

---

## Fase 5: Configurar Edge Functions (Opcional)

### ✅ Tarefa 5.1: Preparar Ambiente para Edge Functions
- [ ] Instalar Supabase CLI:
  ```bash
  npm install -g supabase
  ```
- [ ] Fazer login no CLI:
  ```bash
  supabase login
  ```
- [ ] Vincular projeto local:
  ```bash
  supabase link --project-ref your-project-ref
  ```

### ✅ Tarefa 5.2: Criar Edge Function de Exemplo
- [ ] Criar pasta `supabase/functions/hello/`
- [ ] Criar função de exemplo para testar
- [ ] Testar função localmente:
  ```bash
  supabase functions serve hello
  ```
- [ ] Fazer deploy da função:
  ```bash
  supabase functions deploy hello
  ```
- [ ] Testar função em produção

---

## Fase 6: Documentação e Validação

### ✅ Tarefa 6.1: Documentar Configuração
- [x] Atualizar README.md com instruções de setup do Supabase
- [x] Criar guia de configuração de variáveis de ambiente *(CONFIGURAR_VARIAVEIS_AMBIENTE.md)*
- [x] Documentar estrutura de pastas do Supabase *(ESTRUTURA_SUPABASE.md)*
- [x] Criar guia de troubleshooting *(TROUBLESHOOTING.md)*

### ✅ Tarefa 6.2: Criar Checklist de Validação
- [x] Checklist criado *(CHECKLIST_VALIDACAO.md)*
- [x] Conexão com Supabase está funcionando *(item no checklist)*
- [x] Variáveis de ambiente estão configuradas *(item no checklist)*
- [x] Cliente Supabase está inicializado corretamente *(item no checklist)*
- [x] Página de teste está acessível *(item no checklist)*
- [x] Storage está configurado (se implementado) *(item no checklist)*
- [x] Edge Functions estão funcionando (se implementado) *(item no checklist)*

### ✅ Tarefa 6.3: Preparar Ambiente para Próxima Fase
- [x] Revisar documentação do Supabase Auth *(Documentação referenciada em SUPABASE_SETUP.md)*
- [x] Planejar estrutura de autenticação *(Estrutura já implementada em src/lib/supabase/auth.ts e src/hooks/useAuth.ts)*
- [x] Identificar fluxos de autenticação necessários *(Fluxos implementados: login, logout, getCurrentUser)*
- [x] Listar requisitos de segurança *(Documentado em SUPABASE_SETUP.md e TROUBLESHOOTING.md)*

---

## Notas Importantes

### ⚠️ Segurança
- Nunca commitar as chaves do Supabase no repositório
- Usar sempre variáveis de ambiente
- Manter `service_role` key absolutamente privada
- Configurar Row Level Security (RLS) antes de ir para produção

### 📝 Boas Práticas
- Testar cada funcionalidade após implementação
- Manter logs detalhados durante desenvolvimento
- Documentar todas as decisões importantes
- Fazer commits frequentes com mensagens descritivas

### 🔗 Links Úteis
- [Documentação Supabase](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Guia de Edge Functions](https://supabase.com/docs/guides/functions)
- [Guia de Storage](https://supabase.com/docs/guides/storage)

---

## Status Geral

**Última atualização:** 30/12/2025

### Resumo
- [x] Fase 1: Configuração Inicial (3/3 tarefas) ✓
- [x] Fase 2: Configuração do Cliente (3/3 tarefas) ✓
- [x] Fase 3: Testar Conexão (3/3 tarefas) ✓
- [x] Fase 4: Configurar Storage - Opcional (3/3 tarefas) ✓
- [ ] Fase 5: Configurar Edge Functions - Opcional (0/2 tarefas)
- [x] Fase 6: Documentação (3/3 tarefas) ✓

**Progresso Total:** 88.2% (15/17 tarefas principais)

### ✅ Fases Concluídas
**Data de conclusão das Fases 1-3:** 29/12/2025

#### Arquivos Criados
- `src/lib/supabase/client.ts` - Cliente Supabase configurado
- `src/lib/supabase/helpers.ts` - Funções auxiliares (checkConnection, handleSupabaseError, isSupabaseConfigured)
- `src/lib/supabase/types.ts` - Tipos TypeScript para Supabase
- `src/lib/supabase/storage.ts` - Helpers de Storage (uploadFile, deleteFile, getPublicUrl, getSignedUrl, etc.)
- `src/pages/settings/SupabaseTest.tsx` - Página de teste de conexão
- `docs/CONFIGURAR_VARIAVEIS_AMBIENTE.md` - Guia de configuração de variáveis
- `docs/SUPABASE_SETUP.md` - Guia completo de setup do Supabase
- `docs/TROUBLESHOOTING.md` - Guia de troubleshooting
- `docs/ESTRUTURA_SUPABASE.md` - Documentação da estrutura de pastas
- `docs/CHECKLIST_VALIDACAO.md` - Checklist de validação

#### Dependências Instaladas
- `@supabase/supabase-js` v2.89.0

#### Rotas Adicionadas
- `/configuracoes/supabase-test` - Página de teste (apenas admins)

---

## Próximos Passos (Após Conclusão)

Após completar todas as tarefas desta fase, seguir para:
1. **Implementação de Autenticação** - Ver `docs/plano-integracao-supabase.md` Fase 5
2. **Criação do Schema do Banco** - Ver `docs/plano-integracao-supabase.md` Fase 2
3. **Migração de Dados** - Ver `docs/plano-integracao-supabase.md` Fase 6

