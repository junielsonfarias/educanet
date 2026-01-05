# 🔧 CONFIGURAR VARIÁVEIS DE AMBIENTE DO SUPABASE

## 🎯 Problema

Erro: `AuthApiError: Invalid API key`

Isso significa que as variáveis de ambiente do Supabase não estão configuradas corretamente.

## ✅ SOLUÇÃO

### Passo 1: Obter as Chaves do Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione seu projeto:**
   - Clique no projeto `Edugestao_ssbv`

3. **Vá em Settings > API:**
   - No menu lateral, clique em **Settings** (⚙️)
   - Clique em **API**

4. **Copie as seguintes informações:**
   - **Project URL** (exemplo: `https://xxxxx.supabase.co`)
   - **anon public** key (chave pública anônima)

### Passo 2: Criar Arquivo .env.local

Na raiz do projeto, crie um arquivo chamado `.env.local` com o seguinte conteúdo:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public-aqui
```

**⚠️ IMPORTANTE:**
- Substitua `https://seu-projeto-id.supabase.co` pela **Project URL** do seu projeto
- Substitua `sua-chave-anon-public-aqui` pela **anon public** key
- **NÃO** use a `service_role` key (ela é privada e não deve ser exposta no frontend)

### Passo 3: Verificar o Arquivo

O arquivo `.env.local` deve estar na raiz do projeto, ao lado de `package.json`:

```
educanet/
├── .env.local          ← Este arquivo
├── package.json
├── src/
└── ...
```

### Passo 4: Reiniciar o Servidor

**IMPORTANTE:** Após criar/modificar o arquivo `.env.local`, você **DEVE** reiniciar o servidor de desenvolvimento:

1. **Pare o servidor** (Ctrl+C no terminal)
2. **Inicie novamente:**
   ```bash
   pnpm dev
   # ou
   npm run dev
   ```

### Passo 5: Verificar se Funcionou

1. Abra o console do navegador (F12 > Console)
2. Tente fazer login novamente
3. O erro "Invalid API key" não deve mais aparecer

## 📋 Exemplo Completo

Seu arquivo `.env.local` deve ficar assim (com seus valores reais):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://uosydcxfrbnhhasbyhqr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvc3lkY3hmcmJuaGhhc2J5aHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ4MjM0NTAsImV4cCI6MjAzMDM5OTQ1MH0.sua-chave-aqui
```

## 🔍 Como Encontrar as Chaves no Supabase

### Método 1: Dashboard Web

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

### Método 2: Via MCP (se configurado)

Se você tem o MCP do Supabase configurado no Cursor, pode usar:

```typescript
// As chaves podem ser obtidas via MCP
```

## ⚠️ Segurança

- ✅ **USE** a chave `anon public` no frontend
- ❌ **NUNCA** use a chave `service_role` no frontend
- ✅ **ADICIONE** `.env.local` ao `.gitignore` (já está configurado)
- ✅ **NÃO COMMITE** arquivos `.env.local` no Git

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"

**Causa:** Arquivo `.env.local` não existe ou variáveis não estão definidas

**Solução:**
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Verifique se as variáveis começam com `VITE_`
3. Reinicie o servidor após criar/modificar o arquivo

### Erro: "Invalid API key" mesmo após configurar

**Causa:** Chave incorreta ou servidor não foi reiniciado

**Solução:**
1. Verifique se copiou a chave correta (anon public, não service_role)
2. Verifique se não há espaços extras na chave
3. **Reinicie o servidor** (Ctrl+C e depois `pnpm dev`)
4. Limpe o cache do navegador (Ctrl+Shift+Delete)

### Variáveis não são carregadas

**Causa:** Vite só carrega variáveis que começam com `VITE_`

**Solução:**
- Certifique-se de que as variáveis começam com `VITE_`
- Reinicie o servidor após modificar `.env.local`

## 📝 Arquivo .env.example (Opcional)

Você pode criar um arquivo `.env.example` como template (sem valores reais):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public-aqui
```

Este arquivo pode ser commitado no Git como referência.

---

**Última atualização:** 29/12/2025

