# 🔧 CORRIGIR ERRO DE LOGIN - ADMIN

## 🎯 Problema
Erro "Credenciais inválidas" ao tentar fazer login, mesmo com usuário criado no Supabase Auth.

## 🔍 Causa Provável
O registro na tabela `auth_users` não existe ou não está vinculado corretamente ao `person_id`.

## ✅ SOLUÇÃO RÁPIDA

### Opção 1: Script Completo (Recomendado)

Execute o arquivo `supabase/scripts/corrigir_login_admin.sql` no Supabase SQL Editor.

### Opção 2: Script Manual

Execute este SQL no Supabase SQL Editor:

```sql
-- =====================================================
-- CORRIGIR LOGIN ADMIN - EXECUTE ESTE SCRIPT
-- =====================================================

-- 1. Garantir que a pessoa existe (não está deletada)
UPDATE people
SET updated_at = now()
WHERE email = 'junielsonfarias@gmail.com' AND deleted_at IS NULL;

-- 2. Criar ou atualizar registro em auth_users
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
ON CONFLICT (id) 
DO UPDATE SET
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

-- 4. Verificar resultado final
SELECT 
  '✅ Status Final' as status,
  au.id as auth_id,
  au.email,
  au.person_id,
  au.active as auth_active,
  CASE WHEN p.deleted_at IS NULL THEN 'Ativo' ELSE 'Deletado' END as person_status,
  p.first_name || ' ' || p.last_name as nome,
  r.name as role,
  CASE 
    WHEN au.id IS NOT NULL AND au.person_id IS NOT NULL AND au.active = true 
         AND p.deleted_at IS NULL AND r.name = 'Admin' 
    THEN '✅ TUDO OK'
    ELSE '❌ VERIFICAR'
  END as resultado
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id AND p.deleted_at IS NULL
LEFT JOIN user_roles ur ON ur.person_id = p.id AND ur.deleted_at IS NULL
LEFT JOIN roles r ON r.id = ur.role_id
WHERE au.email = 'junielsonfarias@gmail.com';
```

## 📋 Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá em: SQL Editor
   - Clique em: + New Query

2. **Cole o script SQL acima**
   - Altere o email se necessário
   - Clique em: Run (▶️)

3. **Verifique o resultado**
   - Deve mostrar 1 linha com seus dados
   - `active` deve ser `true`
   - `person_id` deve estar preenchido
   - `role` deve ser `Admin`

4. **Teste o login novamente**
   - Acesse: `http://localhost:8080/login`
   - Email: `junielsonfarias@gmail.com`
   - Senha: (a senha que você definiu no Supabase Auth)

## 🔍 Verificações Adicionais

### Se ainda não funcionar, execute:

```sql
-- 1. Verificar se usuário existe no auth.users
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'junielsonfarias@gmail.com';

-- 2. Verificar se pessoa existe
SELECT id, first_name, last_name, email 
FROM people 
WHERE email = 'junielsonfarias@gmail.com' 
  AND deleted_at IS NULL;

-- 3. Verificar role
SELECT 
  p.id,
  p.email,
  r.name as role
FROM people p
JOIN user_roles ur ON ur.person_id = p.id AND ur.deleted_at IS NULL
JOIN roles r ON r.id = ur.role_id
WHERE p.email = 'junielsonfarias@gmail.com';

-- 4. Verificar auth_users
SELECT * FROM auth_users 
WHERE email = 'junielsonfarias@gmail.com';
```

## 🐛 Troubleshooting

### Erro: "relation auth_users does not exist"
**Solução:** Execute a migration `001_auth_setup.sql` primeiro.

### Erro: "permission denied"
**Solução:** Certifique-se de estar usando as credenciais corretas do Supabase.

### Erro: "duplicate key value"
**Solução:** Isso é normal, significa que o registro já existe. O script vai atualizar.

### Login ainda não funciona após executar o script
**Solução:** 
1. Verifique o console do navegador (F12 > Console)
2. Verifique se o email está correto
3. Verifique se a senha está correta no Supabase Auth
4. Tente limpar o cache do navegador

## ✅ Após Corrigir

O login deve funcionar normalmente e você será redirecionado para `/dashboard` com acesso de Admin.

---

**Última atualização:** 29/12/2025

