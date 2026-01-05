# Guia de Configuração de Variáveis de Ambiente

Este guia explica como configurar as variáveis de ambiente necessárias para o funcionamento do EduGestão Municipal com Supabase.

## 📋 Pré-requisitos

- Conta no Supabase criada
- Projeto Supabase criado e provisionado
- Acesso às credenciais do projeto (URL e API Keys)

## 🔑 Variáveis Necessárias

O projeto requer as seguintes variáveis de ambiente:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public-aqui
```

## 📝 Passo a Passo

### 1. Obter Credenciais do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie os seguintes valores:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 2. Criar Arquivo `.env.local`

Na raiz do projeto (mesmo nível do `package.json`), crie um arquivo chamado `.env.local`:

```bash
# Windows (PowerShell)
New-Item -Path .env.local -ItemType File

# Linux/Mac
touch .env.local
```

### 3. Adicionar Variáveis

Abra o arquivo `.env.local` e adicione:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public-aqui
```

**⚠️ IMPORTANTE:** Substitua pelos valores reais do seu projeto!

### 4. Verificar `.gitignore`

Certifique-se de que `.env.local` está no `.gitignore`:

```gitignore
# Arquivos de ambiente
.env
.env.local
.env.*.local
```

### 5. Reiniciar o Servidor

Após configurar as variáveis, **reinicie o servidor de desenvolvimento**:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
pnpm dev
```

## ✅ Verificar Configuração

### Método 1: Página de Teste

1. Acesse `/configuracoes/supabase-test` (apenas para admins)
2. Clique em "Testar Conexão"
3. Verifique se todos os testes passam

### Método 2: Console do Navegador

Abra o console do navegador (F12) e verifique se há mensagens de erro relacionadas ao Supabase.

### Método 3: Verificação Automática

O projeto verifica automaticamente as variáveis na inicialização. Se estiverem faltando, você verá uma mensagem de erro detalhada no console.

## 🔒 Segurança

### ⚠️ NUNCA faça:

- ❌ Commitar `.env.local` no repositório
- ❌ Compartilhar suas chaves publicamente
- ❌ Usar a `service_role` key no frontend
- ❌ Expor chaves em screenshots ou documentação pública

### ✅ SEMPRE faça:

- ✅ Mantenha `.env.local` no `.gitignore`
- ✅ Use apenas a `anon` key no frontend
- ✅ Mantenha a `service_role` key apenas no backend
- ✅ Revise as políticas de Row Level Security (RLS)

## 📋 Exemplo Completo

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.exemplo-chave-aqui
```

## 🆘 Problemas Comuns

### Erro: "Missing Supabase environment variables"

**Causa:** Arquivo `.env.local` não existe ou variáveis não estão configuradas.

**Solução:**
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Verifique se as variáveis estão escritas corretamente (sem espaços extras)
3. Reinicie o servidor de desenvolvimento

### Erro: "Invalid API key"

**Causa:** A chave anon está incorreta ou foi revogada.

**Solução:**
1. Verifique se copiou a chave completa (sem cortes)
2. Obtenha uma nova chave no Dashboard do Supabase
3. Atualize o `.env.local` e reinicie o servidor

### Variáveis não são carregadas

**Causa:** Servidor não foi reiniciado após criar/editar `.env.local`.

**Solução:**
1. Pare o servidor (Ctrl+C)
2. Inicie novamente: `pnpm dev`

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Segurança do Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Troubleshooting](TROUBLESHOOTING.md)

## 🔄 Atualização de Variáveis

Se precisar atualizar as variáveis:

1. Edite o arquivo `.env.local`
2. Salve o arquivo
3. **Reinicie o servidor de desenvolvimento**

As variáveis são carregadas apenas na inicialização do servidor.

