-- =====================================================
-- CORREÇÃO RÁPIDA: Recursão Infinita nas Políticas RLS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins can read all auth data" ON public.auth_users;
DROP POLICY IF EXISTS "Admins can update all auth data" ON public.auth_users;

-- 2. Criar função auxiliar que bypassa RLS
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
  
  -- Verificar se tem role Admin
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

-- 3. Criar políticas RLS corrigidas (sem recursão)
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

-- 5. CORRIGIR user_roles (também tem recursão)
-- =====================================================

-- Habilitar RLS em user_roles (se ainda não estiver)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes de user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

-- Criar função auxiliar para obter person_id sem recursão
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

-- Política de SELECT: Usuário pode ler seus próprios roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  USING (
    person_id = public.get_user_person_id(auth.uid())
    OR
    public.check_user_is_admin(auth.uid())
  );

-- Política de INSERT: Apenas admins podem inserir
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    public.check_user_is_admin(auth.uid())
  );

-- Política de UPDATE: Apenas admins podem atualizar
CREATE POLICY "Admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  USING (
    public.check_user_is_admin(auth.uid())
  )
  WITH CHECK (
    public.check_user_is_admin(auth.uid())
  );

-- Política de DELETE: Apenas admins podem deletar
CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (
    public.check_user_is_admin(auth.uid())
  );

-- 6. Verificação (deve retornar políticas)
SELECT 
  'auth_users' as tabela,
  policyname,
  cmd as operacao
FROM pg_policies
WHERE tablename = 'auth_users'
UNION ALL
SELECT 
  'user_roles' as tabela,
  policyname,
  cmd as operacao
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY tabela, policyname;

