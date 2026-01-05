# 🔧 GUIA COMPLETO: Corrigir Login do Administrador

## 🎯 Problema

O login do administrador está falhando mesmo com credenciais corretas no Supabase Auth.

## 🔍 Diagnóstico

### Passo 1: Verificar no Supabase SQL Editor

Execute a consulta de diagnóstico no SQL Editor do Supabase:

```sql
-- Verificar status completo do usuário
SELECT 
  au.id as auth_id,
  au.email,
  au.person_id,
  au.active,
  p.first_name || ' ' || p.last_name as nome,
  r.name as role
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id AND p.deleted_at IS NULL
LEFT JOIN user_roles ur ON ur.person_id = p.id AND ur.deleted_at IS NULL
LEFT JOIN roles r ON r.id = ur.role_id
WHERE au.email = 'junielsonfarias@gmail.com';
```

### Possíveis Problemas:

1. ❌ **Usuário não existe em `auth_users`**
   - Solução: Execute o script de correção abaixo

2. ❌ **`person_id` é NULL**
   - Solução: Vincular a pessoa correta

3. ❌ **`active = false`**
   - Solução: Atualizar para `active = true`

4. ❌ **Role não vinculado**
   - Solução: Vincular role "Admin"

5. ❌ **Erro de RLS (Row Level Security)**
   - Solução: Verificar políticas RLS

## ✅ Correção Automática

### Script SQL Completo

Execute este script no SQL Editor do Supabase:

```sql
-- ============================================
-- CORREÇÃO COMPLETA DO LOGIN ADMIN
-- ============================================

-- 1. Garantir que a pessoa existe e está ativa
UPDATE people
SET active = true, updated_at = now()
WHERE email = 'junielsonfarias@gmail.com' AND deleted_at IS NULL;

-- 2. Criar/Atualizar registro em auth_users
INSERT INTO auth_users (id, email, person_id, active, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  p.id,
  true,
  COALESCE(au.created_at, now()),
  now()
FROM auth.users u
CROSS JOIN LATERAL (
  SELECT id FROM people 
  WHERE email = u.email 
    AND deleted_at IS NULL 
  LIMIT 1
) p
LEFT JOIN auth_users au ON au.id = u.id
WHERE u.email = 'junielsonfarias@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  person_id = EXCLUDED.person_id,
  active = true,
  updated_at = now(),
  email = EXCLUDED.email;

-- 3. Vincular role Admin (se não estiver vinculado)
INSERT INTO user_roles (person_id, role_id, created_at, updated_at)
SELECT 
  p.id,
  r.id,
  now(),
  now()
FROM people p
CROSS JOIN roles r
WHERE p.email = 'junielsonfarias@gmail.com'
  AND r.name = 'Admin'
  AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.person_id = p.id 
      AND ur.role_id = r.id 
      AND ur.deleted_at IS NULL
  );

-- 4. Verificação final
SELECT 
  '✅ Status Final' as status,
  au.id as auth_id,
  au.email,
  au.person_id,
  au.active,
  p.first_name || ' ' || p.last_name as nome,
  r.name as role
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id AND p.deleted_at IS NULL
LEFT JOIN user_roles ur ON ur.person_id = p.id AND ur.deleted_at IS NULL
LEFT JOIN roles r ON r.id = ur.role_id
WHERE au.email = 'junielsonfarias@gmail.com';
```

## 🔍 Verificação Passo a Passo

### 1. Verificar Supabase Auth

No Supabase Dashboard:
- Vá em **Authentication** > **Users**
- Procure por `junielsonfarias@gmail.com`
- Verifique se o email está confirmado
- Anote o **User ID** (UUID)

### 2. Verificar Tabela `auth_users`

```sql
SELECT * FROM auth_users WHERE email = 'junielsonfarias@gmail.com';
```

**Deve retornar:**
- ✅ `id` = UUID do auth.users
- ✅ `email` = 'junielsonfarias@gmail.com'
- ✅ `person_id` = 2 (ou outro ID válido)
- ✅ `active` = true

### 3. Verificar Tabela `people`

```sql
SELECT * FROM people WHERE email = 'junielsonfarias@gmail.com' AND deleted_at IS NULL;
```

**Deve retornar:**
- ✅ `id` = 2 (ou outro ID)
- ✅ `email` = 'junielsonfarias@gmail.com'
- ✅ `active` = true
- ✅ `deleted_at` = NULL

### 4. Verificar Tabela `user_roles`

```sql
SELECT 
  ur.*,
  r.name as role_name
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.person_id = 2 AND ur.deleted_at IS NULL;
```

**Deve retornar:**
- ✅ `person_id` = 2
- ✅ `role_id` = ID do role "Admin"
- ✅ `role_name` = 'Admin'
- ✅ `deleted_at` = NULL

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Usuário não encontrado no sistema"

**Causa:** Registro não existe em `auth_users`

**Solução:**
```sql
INSERT INTO auth_users (id, email, person_id, active, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  p.id,
  true,
  now(),
  now()
FROM auth.users u
JOIN people p ON p.email = u.email AND p.deleted_at IS NULL
WHERE u.email = 'junielsonfarias@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  person_id = EXCLUDED.person_id,
  active = true,
  updated_at = now();
```

### Problema 2: "Usuário não vinculado a uma pessoa"

**Causa:** `person_id` é NULL em `auth_users`

**Solução:**
```sql
UPDATE auth_users
SET person_id = (
  SELECT id FROM people 
  WHERE email = 'junielsonfarias@gmail.com' 
    AND deleted_at IS NULL 
  LIMIT 1
),
updated_at = now()
WHERE email = 'junielsonfarias@gmail.com';
```

### Problema 3: "Usuário inativo"

**Causa:** `active = false` em `auth_users` ou `people`

**Solução:**
```sql
UPDATE auth_users SET active = true, updated_at = now()
WHERE email = 'junielsonfarias@gmail.com';

UPDATE people SET active = true, updated_at = now()
WHERE email = 'junielsonfarias@gmail.com' AND deleted_at IS NULL;
```

### Problema 4: "Erro de permissão RLS"

**Causa:** Políticas RLS bloqueando acesso

**Solução:** Verificar políticas RLS em `auth_users`:
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'auth_users';
```

## 📋 Checklist Final

Após executar as correções, verifique:

- [ ] Usuário existe em `auth.users`
- [ ] Email está confirmado no Supabase Auth
- [ ] Registro existe em `auth_users`
- [ ] `person_id` está vinculado corretamente
- [ ] `active = true` em `auth_users`
- [ ] Pessoa existe em `people` e está ativa
- [ ] Role "Admin" está vinculado em `user_roles`
- [ ] Políticas RLS permitem acesso

## 🧪 Teste

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Acesse:** `http://localhost:8080/login`
3. **Email:** `junielsonfarias@gmail.com`
4. **Senha:** (a senha definida no Supabase Auth)
5. **Verifique o console** (F12) para logs detalhados

## 📝 Logs de Debug

O código agora mostra logs detalhados no console:
- `[signIn] Auth user ID:` - ID do usuário no Supabase Auth
- `[signIn] User data error:` - Erro ao buscar em auth_users
- `[signIn] Error code:` - Código do erro (PGRST116, PGRST301, etc.)

## 🔗 Arquivos Relacionados

- `src/lib/supabase/auth.ts` - Código de autenticação
- `supabase/scripts/diagnosticar_login_admin.sql` - Script de diagnóstico
- `CORRIGIR_LOGIN_ADMIN.md` - Guia anterior (simplificado)

---

**Última atualização:** 29/12/2025

