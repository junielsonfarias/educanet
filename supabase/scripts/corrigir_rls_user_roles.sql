-- =====================================================
-- CORREÇÃO: Recursão Infinita nas Políticas RLS de user_roles
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Verificar se RLS está habilitado em user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes de user_roles (se houver)
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- 3. Criar políticas RLS simples para user_roles (sem recursão)
-- =====================================================

-- Política de SELECT: Usuário pode ler seus próprios roles
-- Usa auth_users para obter person_id, mas com função SECURITY DEFINER
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

-- Política de DELETE: Apenas admins podem deletar (soft delete)
CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (
    public.check_user_is_admin(auth.uid())
  );

-- 4. Comentários
COMMENT ON FUNCTION public.get_user_person_id(UUID) IS 'Obtém person_id de um usuário sem causar recursão RLS. Usa SECURITY DEFINER para bypass RLS.';
COMMENT ON POLICY "Users can read own roles" ON public.user_roles IS 'Permite que usuários leiam seus próprios roles. Admins podem ler todos.';
COMMENT ON POLICY "Admins can insert user roles" ON public.user_roles IS 'Permite que apenas admins insiram novos roles.';
COMMENT ON POLICY "Admins can update user roles" ON public.user_roles IS 'Permite que apenas admins atualizem roles.';
COMMENT ON POLICY "Admins can delete user roles" ON public.user_roles IS 'Permite que apenas admins deletem roles.';

-- 5. Verificação (deve retornar 4 políticas)
SELECT 
  policyname,
  cmd as operacao
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

