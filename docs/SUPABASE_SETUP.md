# Guia Completo de Setup do Supabase

Este guia fornece instruções detalhadas para configurar o Supabase no projeto EduGestão Municipal.

## 📋 Índice

1. [Criar Projeto no Supabase](#1-criar-projeto-no-supabase)
2. [Configurar Variáveis de Ambiente](#2-configurar-variáveis-de-ambiente)
3. [Configurar Storage (Opcional)](#3-configurar-storage-opcional)
4. [Testar Conexão](#4-testar-conexão)
5. [Próximos Passos](#5-próximos-passos)

## 1. Criar Projeto no Supabase

### 1.1 Criar Conta

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em **Sign Up** ou **Start your project**
3. Faça login com GitHub, Google ou e-mail

### 1.2 Criar Novo Projeto

1. No Dashboard, clique em **New Project**
2. Preencha os dados:
   - **Name**: `educanet-municipal` (ou outro nome de sua escolha)
   - **Database Password**: Escolha uma senha forte e segura
     - ⚠️ **IMPORTANTE**: Anote esta senha! Você precisará dela para acessar o banco diretamente
   - **Region**: Selecione **South America (São Paulo)** para melhor performance
3. Clique em **Create new project**
4. Aguarde o provisionamento (2-3 minutos)

### 1.3 Obter Credenciais

Após o provisionamento:

1. Vá em **Settings** > **API**
2. Anote as seguintes informações:
   - **Project URL**: `https://seu-projeto-id.supabase.co`
   - **anon public** key: Chave pública para uso no frontend
   - **service_role** key: Chave privada (⚠️ NUNCA use no frontend!)

## 2. Configurar Variáveis de Ambiente

### 2.1 Criar Arquivo `.env.local`

Na raiz do projeto, crie o arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public-aqui
```

### 2.2 Verificar Configuração

Consulte o [Guia de Configuração de Variáveis de Ambiente](CONFIGURAR_VARIAVEIS_AMBIENTE.md) para detalhes completos.

## 3. Configurar Storage (Opcional)

O Storage do Supabase é usado para armazenar arquivos como avatares, documentos e fotos.

### 3.1 Criar Buckets

1. No Dashboard do Supabase, vá em **Storage**
2. Clique em **Create a new bucket**

#### Bucket: `avatars`
- **Name**: `avatars`
- **Public bucket**: ✅ Sim (marcado)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

#### Bucket: `documents`
- **Name**: `documents`
- **Public bucket**: ❌ Não (desmarcado)
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

#### Bucket: `photos`
- **Name**: `photos`
- **Public bucket**: ✅ Sim (marcado)
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`

### 3.2 Configurar Políticas de Acesso

Para cada bucket, configure as políticas de acesso (RLS):

#### Política para `avatars` (Leitura Pública)

```sql
-- Permitir leitura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');
```

#### Política para `avatars` (Upload Autenticado)

```sql
-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

#### Política para `documents` (Acesso Autenticado)

```sql
-- Permitir acesso apenas para usuários autenticados
CREATE POLICY "Authenticated Access" ON storage.objects
FOR ALL
USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);
```

#### Política para `photos` (Leitura Pública, Upload Autenticado)

```sql
-- Leitura pública
CREATE POLICY "Public Read" ON storage.objects
FOR SELECT
USING (bucket_id = 'photos');

-- Upload autenticado
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'photos' 
  AND auth.role() = 'authenticated'
);
```

**📖 Para mais detalhes sobre políticas RLS, consulte:**
- [Documentação RLS do Supabase](https://supabase.com/docs/guides/storage/security/access-control)

## 4. Testar Conexão

### 4.1 Usar Página de Teste

1. Inicie o servidor de desenvolvimento: `pnpm dev`
2. Faça login como administrador
3. Acesse `/configuracoes/supabase-test`
4. Clique em **Testar Conexão**
5. Verifique se todos os testes passam

### 4.2 Verificar no Console

Abra o console do navegador (F12) e verifique se há erros relacionados ao Supabase.

## 5. Próximos Passos

Após configurar o Supabase:

1. **Criar Schema do Banco de Dados**
   - Consulte `docs/contexto-criacao-banco-dados.md`
   - Execute as migrações necessárias

2. **Configurar Autenticação**
   - Consulte `docs/plano-integracao-supabase.md` (Fase 5)
   - Implemente fluxos de login/logout

3. **Migrar Dados**
   - Consulte `docs/plano-integracao-supabase.md` (Fase 6)
   - Migre dados mock para Supabase

## 📚 Recursos Adicionais

- [Documentação Oficial do Supabase](https://supabase.com/docs)
- [Guia de Storage](https://supabase.com/docs/guides/storage)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Troubleshooting](TROUBLESHOOTING.md)

## ✅ Checklist de Validação

- [ ] Projeto Supabase criado e provisionado
- [ ] Variáveis de ambiente configuradas
- [ ] Conexão testada e funcionando
- [ ] Storage configurado (se necessário)
- [ ] Políticas RLS configuradas (se necessário)
- [ ] Página de teste acessível e funcionando

## 🆘 Problemas?

Consulte o [Guia de Troubleshooting](TROUBLESHOOTING.md) para soluções de problemas comuns.

