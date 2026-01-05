-- =====================================================
-- CORREÇÃO COMPLETA: Recursão Infinita nas Políticas RLS
-- Execute este script no Supabase SQL Editor
-- Corrige auth_users, user_roles E roles
-- =====================================================

-- =====================================================
-- PARTE 1: CORRIGIR auth_users
-- =====================================================

-- 1. Remover políticas problemáticas de auth_users
DROP POLICY IF EXISTS "Admins can read all auth data" ON public.auth_users;
DROP POLICY IF EXISTS "Admins can update all auth data" ON public.auth_users;

-- 2. Criar função auxiliar que bypassa RLS para verificar admin
CREATE OR REPLACE FUNCTION public.check_user_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_person_id INTEGER;
BEGIN
  -- Buscar person_id diretamente (bypass RLS com SECURITY DEFINER)
  SELECT person_id INTO user_person_id
  FROM public.auth_users
  WHERE id = check_user_id;
  
  IF user_person_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se tem role Admin (sem recursão porque a função bypassa RLS)
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

-- 3. Criar políticas RLS corrigidas para auth_users
CREATE POLICY "Admins can read all auth data"
  ON public.auth_users
  FOR SELECT
  USING (
    auth.uid() = id
    OR
    public.check_user_is_admin(auth.uid())
  );

CREATE POLICY "Admins can update all auth data"
  ON public.auth_users
  FOR UPDATE
  USING (
    auth.uid() = id
    OR
    public.check_user_is_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = id
    OR
    public.check_user_is_admin(auth.uid())
  );

-- 4. Atualizar função is_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_user_is_admin(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 2: CORRIGIR user_roles
-- =====================================================

-- 5. Habilitar RLS em user_roles (se ainda não estiver)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Remover todas as políticas existentes de user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

-- 7. Criar função auxiliar para obter person_id sem recursão
CREATE OR REPLACE FUNCTION public.get_user_person_id(check_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  result_person_id INTEGER;
BEGIN
  -- Buscar person_id diretamente (bypass RLS com SECURITY DEFINER)
  SELECT person_id INTO result_person_id
  FROM public.auth_users
  WHERE id = check_user_id;
  
  RETURN result_person_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar políticas RLS corrigidas para user_roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  USING (
    person_id = public.get_user_person_id(auth.uid())
    OR
    public.check_user_is_admin(auth.uid())
  );

CREATE POLICY "Admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    public.check_user_is_admin(auth.uid())
  );

CREATE POLICY "Admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  USING (
    public.check_user_is_admin(auth.uid())
  )
  WITH CHECK (
    public.check_user_is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (
    public.check_user_is_admin(auth.uid())
  );

-- =====================================================
-- PARTE 3: VERIFICAÇÃO
-- =====================================================

-- Verificar políticas de auth_users (deve retornar 4)
SELECT 
  'auth_users' as tabela,
  policyname,
  cmd as operacao
FROM pg_policies
WHERE tablename = 'auth_users'
ORDER BY policyname;

-- Verificar políticas de user_roles (deve retornar 4)
SELECT 
  'user_roles' as tabela,
  policyname,
  cmd as operacao
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- =====================================================
-- PARTE 3: CORRIGIR roles
-- =====================================================

-- 9. Habilitar RLS em roles (se ainda não estiver)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 10. Remover todas as políticas existentes de roles
DROP POLICY IF EXISTS "Admin can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated can read roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.roles;

-- 11. Criar políticas RLS corrigidas para roles (sem recursão)
CREATE POLICY "Authenticated can read roles"
  ON public.roles
  FOR SELECT
  USING (
    deleted_at IS NULL
  );

CREATE POLICY "Admins can insert roles"
  ON public.roles
  FOR INSERT
  WITH CHECK (
    public.check_user_is_admin(auth.uid())
  );

CREATE POLICY "Admins can update roles"
  ON public.roles
  FOR UPDATE
  USING (
    public.check_user_is_admin(auth.uid())
  )
  WITH CHECK (
    public.check_user_is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete roles"
  ON public.roles
  FOR DELETE
  USING (
    public.check_user_is_admin(auth.uid())
  );

-- =====================================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar políticas de roles (deve retornar 4)
SELECT 
  'roles' as tabela,
  policyname,
  cmd as operacao
FROM pg_policies
WHERE tablename = 'roles'
ORDER BY policyname;

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================

