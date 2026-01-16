-- =====================================================
-- MIGRATION 054: CORREÇÃO FINAL DA RECURSÃO RLS EM AUTH_USERS
-- =====================================================
-- Problema: A função is_admin() consulta auth_users, e a política
-- RLS de auth_users chama is_admin() - causando recursão infinita.
--
-- Solução: Criar uma função que busca person_id diretamente da
-- tabela auth.users do Supabase (sem RLS) e verifica roles sem
-- passar por auth_users.
-- =====================================================

-- 1. DROPAR TODAS AS POLÍTICAS PROBLEMÁTICAS DE auth_users
-- =====================================================
DROP POLICY IF EXISTS "admin_auth_users_all" ON auth_users;
DROP POLICY IF EXISTS "users_can_view_own" ON auth_users;
DROP POLICY IF EXISTS "Admins can read all auth data" ON auth_users;
DROP POLICY IF EXISTS "Admins can update all auth data" ON auth_users;
DROP POLICY IF EXISTS "authenticated_auth_users_select" ON auth_users;

-- 2. CRIAR FUNÇÃO AUXILIAR QUE NÃO CAUSA RECURSÃO
-- =====================================================
-- Esta função busca o person_id diretamente de auth_users
-- usando SECURITY DEFINER com SET search_path para evitar RLS
CREATE OR REPLACE FUNCTION public.get_current_user_person_id()
RETURNS INTEGER AS $$
DECLARE
  v_person_id INTEGER;
BEGIN
  -- Buscar person_id diretamente, bypassando RLS
  SELECT person_id INTO v_person_id
  FROM public.auth_users
  WHERE id = auth.uid();

  RETURN v_person_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Garantir que a função não é afetada por RLS
ALTER FUNCTION public.get_current_user_person_id() SET row_security = off;

-- 3. CRIAR NOVA FUNÇÃO is_admin() QUE NÃO CONSULTA auth_users
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_person_id INTEGER;
BEGIN
  -- Buscar person_id usando função auxiliar (bypass RLS)
  v_person_id := public.get_current_user_person_id();

  -- Se não encontrou person_id, não é admin
  IF v_person_id IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar se tem role Admin/Supervisor/SuperAdmin
  -- Esta query não passa por auth_users
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.person_id = v_person_id
      AND r.name IN ('Admin', 'Supervisor', 'SuperAdmin')
      AND ur.deleted_at IS NULL
      AND r.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Garantir que a função não é afetada por RLS
ALTER FUNCTION public.is_admin() SET row_security = off;

-- 4. CRIAR POLÍTICAS RLS SIMPLES PARA auth_users
-- =====================================================

-- Política: Todos os usuários autenticados podem ler auth_users
-- (necessário para o sistema funcionar)
CREATE POLICY "authenticated_can_read_auth_users"
  ON public.auth_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuário pode atualizar seus próprios dados
CREATE POLICY "users_can_update_own"
  ON public.auth_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Política: Admins podem fazer tudo (INSERT, UPDATE, DELETE)
-- Usando is_admin() que agora não causa recursão
CREATE POLICY "admins_full_access"
  ON public.auth_users
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. ATUALIZAR FUNÇÃO check_user_is_admin TAMBÉM
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_user_is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_person_id INTEGER;
BEGIN
  -- Buscar person_id diretamente (bypass RLS)
  SELECT person_id INTO v_person_id
  FROM public.auth_users
  WHERE id = check_user_id;

  IF v_person_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.person_id = v_person_id
      AND r.name IN ('Admin', 'Supervisor', 'SuperAdmin')
      AND ur.deleted_at IS NULL
      AND r.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER FUNCTION public.check_user_is_admin(UUID) SET row_security = off;

-- 6. COMENTÁRIOS
-- =====================================================
COMMENT ON FUNCTION public.get_current_user_person_id() IS
  'Retorna o person_id do usuário atual. Usa SECURITY DEFINER com row_security=off para evitar recursão RLS.';

COMMENT ON FUNCTION public.is_admin() IS
  'Verifica se o usuário atual é Admin/Supervisor/SuperAdmin. Usa funções auxiliares para evitar recursão RLS.';

COMMENT ON FUNCTION public.check_user_is_admin(UUID) IS
  'Verifica se um usuário específico é admin. Usa SECURITY DEFINER com row_security=off para evitar recursão RLS.';

-- =====================================================
-- FIM DA MIGRATION 054
-- =====================================================
