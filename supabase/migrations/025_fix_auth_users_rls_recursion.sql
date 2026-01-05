-- =====================================================
-- CORREÇÃO: Recursão Infinita nas Políticas RLS de auth_users
-- =====================================================
-- Problema: As políticas RLS para admins causam recursão infinita
-- porque tentam consultar auth_users dentro da própria verificação
-- Solução: Usar função SECURITY DEFINER ou verificação direta sem recursão
-- =====================================================

-- 1. Remover políticas problemáticas
-- =====================================================
DROP POLICY IF EXISTS "Admins can read all auth data" ON public.auth_users;
DROP POLICY IF EXISTS "Admins can update all auth data" ON public.auth_users;

-- 2. Criar função auxiliar que bypassa RLS (SECURITY DEFINER)
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_user_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_person_id INTEGER;
BEGIN
  -- Buscar person_id diretamente (bypass RLS com SECURITY DEFINER)
  SELECT person_id INTO user_person_id
  FROM public.auth_users
  WHERE id = check_user_id;
  
  -- Se não encontrou person_id, não é admin
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
-- =====================================================

-- Política de SELECT: Admins podem ler todos os dados
CREATE POLICY "Admins can read all auth data"
  ON public.auth_users
  FOR SELECT
  USING (
    -- Usuário pode ler seus próprios dados OU
    auth.uid() = id
    OR
    -- É admin (usando função que bypassa RLS)
    public.check_user_is_admin(auth.uid())
  );

-- Política de UPDATE: Admins podem atualizar todos os campos
CREATE POLICY "Admins can update all auth data"
  ON public.auth_users
  FOR UPDATE
  USING (
    -- Usuário pode atualizar seus próprios dados OU
    auth.uid() = id
    OR
    -- É admin (usando função que bypassa RLS)
    public.check_user_is_admin(auth.uid())
  )
  WITH CHECK (
    -- Usuário pode atualizar seus próprios dados OU
    auth.uid() = id
    OR
    -- É admin (usando função que bypassa RLS)
    public.check_user_is_admin(auth.uid())
  );

-- 4. Atualizar função is_admin para usar a nova função auxiliar
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_user_is_admin(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Comentários
-- =====================================================
COMMENT ON FUNCTION public.check_user_is_admin(UUID) IS 'Verifica se um usuário é admin sem causar recursão RLS. Usa SECURITY DEFINER para bypass RLS.';
COMMENT ON POLICY "Admins can read all auth data" ON public.auth_users IS 'Permite que admins leiam todos os dados de auth_users. Usa função auxiliar para evitar recursão.';
COMMENT ON POLICY "Admins can update all auth data" ON public.auth_users IS 'Permite que admins atualizem todos os dados de auth_users. Usa função auxiliar para evitar recursão.';

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================

