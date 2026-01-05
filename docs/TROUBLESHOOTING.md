# Guia de Troubleshooting - Supabase

Este guia ajuda a resolver problemas comuns relacionados ao Supabase no projeto EduGestão Municipal.

## 📋 Índice

1. [Problemas de Configuração](#1-problemas-de-configuração)
2. [Problemas de Conexão](#2-problemas-de-conexão)
3. [Problemas de Autenticação](#3-problemas-de-autenticação)
4. [Problemas de Storage](#4-problemas-de-storage)
5. [Problemas de Performance](#5-problemas-de-performance)
6. [Erros Comuns](#6-erros-comuns)

## 1. Problemas de Configuração

### ❌ Erro: "Missing Supabase environment variables"

**Sintomas:**
- Mensagem de erro no console
- Aplicação não inicia ou mostra tela em branco

**Causas Possíveis:**
- Arquivo `.env.local` não existe
- Variáveis não estão configuradas corretamente
- Servidor não foi reiniciado após criar/editar `.env.local`

**Solução:**
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Verifique se as variáveis estão escritas corretamente:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```
3. Certifique-se de que não há espaços extras ou aspas desnecessárias
4. Reinicie o servidor de desenvolvimento:
   ```bash
   # Pare o servidor (Ctrl+C)
   pnpm dev
   ```

### ❌ Erro: "Invalid API key"

**Sintomas:**
- Erro ao tentar conectar com Supabase
- Mensagem de "Invalid API key" no console

**Causas Possíveis:**
- Chave anon está incorreta
- Chave foi revogada ou expirada
- Chave foi copiada incompleta

**Solução:**
1. Acesse o Dashboard do Supabase
2. Vá em **Settings** > **API**
3. Copie novamente a chave **anon public**
4. Atualize o `.env.local` com a chave completa
5. Reinicie o servidor

### ❌ Variáveis não são carregadas

**Sintomas:**
- Variáveis aparecem como `undefined` no código
- Erros de "undefined" relacionados ao Supabase

**Causas Possíveis:**
- Variáveis não começam com `VITE_`
- Servidor não foi reiniciado
- Arquivo está no lugar errado

**Solução:**
1. Certifique-se de que as variáveis começam com `VITE_`:
   ```env
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
2. Verifique se o arquivo está na raiz do projeto (mesmo nível do `package.json`)
3. Reinicie o servidor completamente

## 2. Problemas de Conexão

### ❌ Erro: "Failed to fetch" ou "Network error"

**Sintomas:**
- Erro ao tentar fazer requisições ao Supabase
- Timeout nas requisições

**Causas Possíveis:**
- Problema de rede
- URL do Supabase incorreta
- CORS não configurado (raro)

**Solução:**
1. Verifique sua conexão com a internet
2. Verifique se a URL do Supabase está correta no `.env.local`
3. Teste acessar a URL diretamente no navegador
4. Verifique se há bloqueadores de anúncio ou firewall interferindo

### ❌ Erro: "PGRST116" (Tabela não encontrada)

**Sintomas:**
- Erro ao tentar acessar tabelas
- Mensagem "relation does not exist"

**Causas Possíveis:**
- Schema do banco de dados não foi criado
- Tabela não existe no banco
- Nome da tabela está incorreto

**Solução:**
1. Verifique se o schema do banco foi criado
2. Consulte `docs/contexto-criacao-banco-dados.md`
3. Execute as migrações necessárias
4. Verifique o nome da tabela no código

## 3. Problemas de Autenticação

### ❌ Erro: "Invalid login credentials"

**Sintomas:**
- Não consegue fazer login
- Mensagem de credenciais inválidas

**Causas Possíveis:**
- E-mail ou senha incorretos
- Usuário não existe no banco
- Tabela de usuários não foi criada

**Solução:**
1. Verifique se o usuário existe no Supabase
2. Verifique se a tabela `users` ou `profiles` foi criada
3. Tente criar um novo usuário pelo Dashboard do Supabase
4. Verifique se as políticas RLS estão configuradas corretamente

### ❌ Sessão expira muito rápido

**Sintomas:**
- Usuário é deslogado frequentemente
- Token expira rapidamente

**Causas Possíveis:**
- Configuração de refresh token incorreta
- Problema com persistência de sessão

**Solução:**
1. Verifique a configuração do cliente Supabase em `src/lib/supabase/client.ts`
2. Certifique-se de que `autoRefreshToken: true` está configurado
3. Verifique se `persistSession: true` está ativado

## 4. Problemas de Storage

### ❌ Erro: "Bucket not found"

**Sintomas:**
- Erro ao tentar fazer upload
- Mensagem de bucket não encontrado

**Causas Possíveis:**
- Bucket não foi criado no Supabase
- Nome do bucket está incorreto

**Solução:**
1. Acesse o Dashboard do Supabase > **Storage**
2. Verifique se os buckets existem:
   - `avatars`
   - `documents`
   - `photos`
3. Crie os buckets se não existirem (consulte `SUPABASE_SETUP.md`)

### ❌ Erro: "new row violates row-level security policy"

**Sintomas:**
- Erro ao tentar fazer upload
- Acesso negado mesmo estando autenticado

**Causas Possíveis:**
- Políticas RLS não configuradas
- Políticas muito restritivas

**Solução:**
1. Verifique as políticas RLS no Dashboard do Supabase
2. Configure políticas adequadas (consulte `SUPABASE_SETUP.md`)
3. Teste com um usuário autenticado

### ❌ Upload falha silenciosamente

**Sintomas:**
- Upload parece funcionar mas arquivo não aparece
- Sem mensagem de erro

**Causas Possíveis:**
- Arquivo muito grande
- Tipo de arquivo não permitido
- Política RLS bloqueando

**Solução:**
1. Verifique o tamanho do arquivo (limites padrão: 5-10MB)
2. Verifique o tipo MIME do arquivo
3. Verifique as políticas RLS
4. Verifique o console do navegador para erros

## 5. Problemas de Performance

### ❌ Requisições muito lentas

**Sintomas:**
- Aplicação lenta ao carregar dados
- Timeouts frequentes

**Causas Possíveis:**
- Região do Supabase muito distante
- Muitas requisições simultâneas
- Falta de índices no banco

**Solução:**
1. Verifique se a região do Supabase está próxima (preferencialmente São Paulo)
2. Otimize as requisições (use `select()` para buscar apenas campos necessários)
3. Adicione índices nas tabelas para queries frequentes
4. Considere usar cache quando apropriado

## 6. Erros Comuns

### Erro: "Cannot read property 'from' of undefined"

**Causa:** Cliente Supabase não foi inicializado corretamente.

**Solução:**
1. Verifique se as variáveis de ambiente estão configuradas
2. Verifique se o cliente está sendo importado corretamente:
   ```typescript
   import { supabase } from '@/lib/supabase/client'
   ```

### Erro: "ReferenceError: currentUser is not defined"

**Causa:** Código ainda usando `useUserStore` antigo em vez de `useAuth`.

**Solução:**
1. Substitua `useUserStore` por `useAuth`:
   ```typescript
   // Antes
   const { currentUser } = useUserStore()
   
   // Depois
   const { userData } = useAuth()
   ```

### Erro: "Maximum update depth exceeded"

**Causa:** Loop infinito em `useEffect` relacionado ao Supabase.

**Solução:**
1. Verifique as dependências do `useEffect`
2. Certifique-se de que callbacks não estão sendo recriados a cada render
3. Use `useCallback` para funções estáveis

## 🔍 Como Diagnosticar Problemas

### 1. Verificar Console do Navegador

Abra o console (F12) e verifique:
- Erros em vermelho
- Avisos em amarelo
- Logs do Supabase

### 2. Usar Página de Teste

Acesse `/configuracoes/supabase-test` e execute os testes:
- Teste de conexão
- Teste de autenticação
- Teste de banco de dados

### 3. Verificar Network Tab

No DevTools, vá em **Network** e verifique:
- Requisições ao Supabase estão sendo feitas?
- Status das requisições (200, 400, 500, etc.)
- Respostas das requisições

### 4. Verificar Dashboard do Supabase

No Dashboard do Supabase:
- Verifique logs em **Logs** > **API Logs**
- Verifique se há erros em **Database** > **Logs**
- Verifique políticas RLS em **Authentication** > **Policies**

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Status](https://status.supabase.com)
- [Fórum da Comunidade](https://github.com/supabase/supabase/discussions)
- [Guia de Configuração](CONFIGURAR_VARIAVEIS_AMBIENTE.md)
- [Setup Completo](SUPABASE_SETUP.md)

## 🆘 Ainda com Problemas?

Se o problema persistir:

1. Verifique a [documentação oficial do Supabase](https://supabase.com/docs)
2. Consulte os [logs do projeto no Dashboard](https://app.supabase.com)
3. Verifique o [status do Supabase](https://status.supabase.com)
4. Abra uma issue no repositório do projeto

