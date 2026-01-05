# Estrutura de Pastas do Supabase

Este documento descreve a estrutura de arquivos e pastas relacionadas ao Supabase no projeto EduGestão Municipal.

## 📁 Estrutura de Diretórios

```
src/
└── lib/
    └── supabase/
        ├── client.ts          # Cliente Supabase configurado
        ├── helpers.ts         # Funções auxiliares
        ├── storage.ts         # Helpers de Storage
        ├── types.ts           # Tipos TypeScript
        ├── auth.ts            # Funções de autenticação
        ├── check-env.ts       # Verificação de variáveis de ambiente
        └── services/         # Serviços específicos
            ├── index.ts       # Exportações centralizadas
            ├── student-service.ts
            ├── school-service.ts
            ├── staff-service.ts
            └── ... (outros serviços)
```

## 📄 Descrição dos Arquivos

### `client.ts`

**Propósito:** Configuração e inicialização do cliente Supabase.

**Conteúdo:**
- Criação do cliente Supabase
- Configuração de autenticação (persistSession, autoRefreshToken, etc.)
- Validação de variáveis de ambiente

**Uso:**
```typescript
import { supabase } from '@/lib/supabase/client'
```

### `helpers.ts`

**Propósito:** Funções auxiliares para trabalhar com Supabase.

**Funções Principais:**
- `isSupabaseConfigured()` - Verifica se Supabase está configurado
- `checkConnection()` - Testa conexão com Supabase
- `handleSupabaseError()` - Trata erros do Supabase de forma padronizada
- `formatSuccessMessage()` - Formata mensagens de sucesso

**Uso:**
```typescript
import { handleSupabaseError, checkConnection } from '@/lib/supabase/helpers'
```

### `storage.ts`

**Propósito:** Helpers para trabalhar com Supabase Storage.

**Funções Principais:**
- `uploadFile()` - Faz upload de arquivos
- `deleteFile()` - Deleta arquivos
- `getPublicUrl()` - Obtém URL pública de arquivos
- `getSignedUrl()` - Obtém URL assinada (temporária) de arquivos privados
- `listFiles()` - Lista arquivos em um bucket
- `fileExists()` - Verifica se arquivo existe
- `downloadFile()` - Faz download de arquivos
- `validateFileType()` - Valida tipo de arquivo
- `validateFileSize()` - Valida tamanho de arquivo

**Buckets Suportados:**
- `avatars` - Avatares de usuários (público)
- `documents` - Documentos (privado)
- `photos` - Fotos (público)

**Uso:**
```typescript
import { uploadFile, getPublicUrl, BucketName } from '@/lib/supabase/storage'

const result = await uploadFile({
  bucket: 'avatars',
  file: myFile,
  path: 'user-123/avatar.jpg'
})
```

### `types.ts`

**Propósito:** Definições de tipos TypeScript para Supabase.

**Conteúdo:**
- Interfaces para respostas de API
- Tipos para erros customizados
- Tipos para dados do banco (quando disponível)

**Uso:**
```typescript
import type { Database } from '@/lib/supabase/types'
```

### `auth.ts`

**Propósito:** Funções de autenticação do Supabase.

**Funções Principais:**
- `signIn()` - Faz login
- `signOut()` - Faz logout
- `getCurrentUser()` - Obtém usuário atual
- `signUp()` - Cria nova conta
- `resetPassword()` - Redefine senha

**Uso:**
```typescript
import { signIn, signOut, getCurrentUser } from '@/lib/supabase/auth'
```

### `check-env.ts`

**Propósito:** Verificação e validação de variáveis de ambiente.

**Funções:**
- `checkSupabaseEnv()` - Verifica se variáveis estão configuradas
- `logSupabaseEnv()` - Loga informações sobre variáveis (apenas em dev)

**Uso:**
```typescript
import { checkSupabaseEnv } from '@/lib/supabase/check-env'
```

### `services/`

**Propósito:** Serviços específicos para cada entidade do sistema.

**Estrutura:**
Cada serviço segue um padrão similar:
- `fetch*()` - Busca dados
- `create*()` - Cria novo registro
- `update*()` - Atualiza registro
- `delete*()` - Deleta registro

**Serviços Disponíveis:**
- `student-service.ts` - Serviços para estudantes
- `school-service.ts` - Serviços para escolas
- `staff-service.ts` - Serviços para funcionários
- `course-service.ts` - Serviços para cursos
- `class-service.ts` - Serviços para turmas
- E outros...

**Uso:**
```typescript
import { studentService } from '@/lib/supabase/services'

const students = await studentService.fetchAll()
```

## 🔗 Integração com Stores

Os stores Zustand usam os serviços do Supabase:

```typescript
// Exemplo: useStudentStore.supabase
import { studentService } from '@/lib/supabase/services'

const fetchStudents = async () => {
  const data = await studentService.fetchAll()
  setStudents(data)
}
```

## 📦 Dependências

### Principais

- `@supabase/supabase-js` - Cliente oficial do Supabase

### Tipos

- `@supabase/supabase-js` - Tipos TypeScript do Supabase

## 🎯 Padrões de Uso

### 1. Importar Cliente

```typescript
import { supabase } from '@/lib/supabase/client'
```

### 2. Usar Helpers

```typescript
import { handleSupabaseError } from '@/lib/supabase/helpers'

try {
  // operação
} catch (error) {
  const message = handleSupabaseError(error)
  toast.error(message)
}
```

### 3. Usar Storage

```typescript
import { uploadFile, BucketName } from '@/lib/supabase/storage'

const result = await uploadFile({
  bucket: 'avatars' as BucketName,
  file: file,
})
```

### 4. Usar Serviços

```typescript
import { studentService } from '@/lib/supabase/services'

const students = await studentService.fetchAll()
```

## 🔒 Segurança

### Variáveis de Ambiente

- Nunca commitar `.env.local`
- Usar apenas `anon` key no frontend
- Manter `service_role` key apenas no backend

### Row Level Security (RLS)

- Todas as tabelas devem ter RLS habilitado
- Políticas devem ser configuradas no Supabase Dashboard
- Testar políticas com diferentes usuários

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Configuração](CONFIGURAR_VARIAVEIS_AMBIENTE.md)
- [Setup Completo](SUPABASE_SETUP.md)
- [Troubleshooting](TROUBLESHOOTING.md)

