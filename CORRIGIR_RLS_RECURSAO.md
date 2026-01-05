# 🔧 CORRIGIR: Recursão Infinita nas Políticas RLS

## 🎯 Problema

Erro: `infinite recursion detected in policy for relation "auth_users"`, `"user_roles"` ou `"roles"`

**Causa:** As políticas RLS para admins tentam verificar se o usuário é admin consultando `auth_users`, `user_roles` ou `roles`, mas essas consultas precisam passar pela própria política RLS, criando um loop infinito.

## ✅ SOLUÇÃO

Execute o script SQL de correção no Supabase SQL Editor.

### Script de Correção Completo

O arquivo `supabase/scripts/corrigir_todas_rls_recursao.sql` contém a correção completa para **auth_users, user_roles E roles**.

### Passo a Passo

1. **Acesse o Supabase SQL Editor:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto
   - Vá em SQL Editor

2. **Execute o script de correção COMPLETO:**

**⚠️ IMPORTANTE:** Use o script completo que corrige **auth_users, user_roles E roles**:

Copie e cole este SQL completo:

**📄 OU abra o arquivo:** `supabase/scripts/corrigir_todas_rls_recursao.sql` e copie todo o conteúdo.

```sql
-- =====================================================
-- CORREÇÃO COMPLETA: Recursão Infinita nas Políticas RLS
-- Corrige auth_users, user_roles E roles
-- =====================================================

-- PARTE 1: CORRIGIR auth_users
DROP POLICY IF EXISTS "Admins can read all auth data" ON public.auth_users;
DROP POLICY IF EXISTS "Admins can update all auth data" ON public.auth_users;

CREATE OR REPLACE FUNCTION public.check_user_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_person_id INTEGER;
BEGIN
  SELECT person_id INTO user_person_id
  FROM public.auth_users
  WHERE id = check_user_id;
  
  IF user_person_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.person_id = user_person_id
      AND r.name = 'Admin'
      AND ur.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can read all auth data"
  ON public.auth_users FOR SELECT
  USING (auth.uid() = id OR public.check_user_is_admin(auth.uid()));

CREATE POLICY "Admins can update all auth data"
  ON public.auth_users FOR UPDATE
  USING (auth.uid() = id OR public.check_user_is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.check_user_is_admin(auth.uid()));

-- PARTE 2: CORRIGIR user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage user roles" ON public.user_roles;

CREATE OR REPLACE FUNCTION public.get_user_person_id(check_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  result_person_id INTEGER;
BEGIN
  SELECT person_id INTO result_person_id
  FROM public.auth_users
  WHERE id = check_user_id;
  RETURN result_person_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (person_id = public.get_user_person_id(auth.uid()) OR public.check_user_is_admin(auth.uid()));

CREATE POLICY "Admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.check_user_is_admin(auth.uid()));

CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (public.check_user_is_admin(auth.uid()))
  WITH CHECK (public.check_user_is_admin(auth.uid()));

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles FOR DELETE
  USING (public.check_user_is_admin(auth.uid()));

-- PARTE 3: CORRIGIR roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated can read roles" ON public.roles;

CREATE POLICY "Authenticated can read roles"
  ON public.roles FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Admins can insert roles"
  ON public.roles FOR INSERT
  WITH CHECK (public.check_user_is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON public.roles FOR UPDATE
  USING (public.check_user_is_admin(auth.uid()))
  WITH CHECK (public.check_user_is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON public.roles FOR DELETE
  USING (public.check_user_is_admin(auth.uid()));
```

3. **Clique em "Run" (▶️)**

4. **Verifique se funcionou:**
   - Deve mostrar "Success. No rows returned"
   - Não deve haver erros

## 🔍 O Que Foi Corrigido

### Antes (Causava Recursão):
```sql
CREATE POLICY "Admins can read all auth data"
  ON public.auth_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.person_id = (SELECT person_id FROM public.auth_users WHERE id = auth.uid())
        AND r.name = 'Admin'
    )
  );
```

**Problema:** A subquery `(SELECT person_id FROM public.auth_users WHERE id = auth.uid())` precisa passar pela política RLS, que por sua vez tenta verificar se é admin, criando recursão.

### Depois (Sem Recursão):
```sql
CREATE POLICY "Admins can read all auth data"
  ON public.auth_users
  FOR SELECT
  USING (
    auth.uid() = id
    OR
    public.check_user_is_admin(auth.uid())
  );
```

**Solução:** Usa a função `check_user_is_admin()` que tem `SECURITY DEFINER`, permitindo bypass RLS e evitando recursão.

## 🧪 Teste

Após executar o script:

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Acesse:** `http://localhost:8080/login`
3. **Tente fazer login:**
   - Email: `junielsonfarias@gmail.com`
   - Senha: (sua senha)
4. **O erro de recursão não deve mais aparecer**

## 📋 Verificação

Execute esta query no Supabase SQL Editor para verificar se as políticas foram corrigidas:

```sql
-- Verificar políticas RLS de auth_users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'auth_users'
ORDER BY policyname;
```

Deve mostrar 4 políticas para `auth_users`:
1. "Users can read own auth data"
2. "Admins can read all auth data" (corrigida)
3. "Users can update own last_login"
4. "Admins can update all auth data" (corrigida)

E 4 políticas para `user_roles`:
1. "Users can read own roles" (corrigida)
2. "Admins can insert user roles" (corrigida)
3. "Admins can update user roles" (corrigida)
4. "Admins can delete user roles" (corrigida)

E 4 políticas para `roles`:
1. "Authenticated can read roles" (corrigida)
2. "Admins can insert roles" (corrigida)
3. "Admins can update roles" (corrigida)
4. "Admins can delete roles" (corrigida)

---

**Última atualização:** 29/12/2025

