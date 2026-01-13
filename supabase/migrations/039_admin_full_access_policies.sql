-- =====================================================
-- POLÍTICAS DE ACESSO TOTAL PARA ADMINISTRADORES
-- =====================================================
-- Data: 13/01/2026
-- Descrição: Permite que administradores façam CRUD completo
-- em todas as tabelas do sistema, independente da escola
-- =====================================================

-- 1. Função auxiliar para verificar se usuário é Admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.auth_users au
    JOIN public.user_roles ur ON ur.person_id = au.person_id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE au.id = auth.uid()
      AND r.name IN ('Admin', 'Supervisor', 'SuperAdmin')
      AND ur.deleted_at IS NULL
      AND r.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Função para verificar se é usuário autenticado
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Função para criar políticas de forma segura (verifica se tabela existe)
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_admin_policies(table_name TEXT)
RETURNS VOID AS $$
DECLARE
  policy_admin TEXT;
  policy_select TEXT;
BEGIN
  -- Verificar se a tabela existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = create_admin_policies.table_name
  ) THEN
    RAISE NOTICE 'Tabela % não existe, pulando...', table_name;
    RETURN;
  END IF;

  -- Habilitar RLS
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

  -- Nomes das políticas
  policy_admin := 'admin_' || table_name || '_all';
  policy_select := 'authenticated_' || table_name || '_select';

  -- Remover políticas existentes
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_admin, table_name);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_select, table_name);

  -- Criar política admin (CRUD completo)
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
    policy_admin, table_name
  );

  -- Criar política select para usuários autenticados
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
    policy_select, table_name
  );

  RAISE NOTICE 'Políticas criadas para tabela: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. APLICAR POLÍTICAS EM TODAS AS TABELAS PRINCIPAIS
-- =====================================================
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'schools',
    'people',
    'student_profiles',
    'student_enrollments',
    'teachers',
    'classes',
    'courses',
    'subjects',
    'class_enrollments',
    'class_teacher_subjects',
    'academic_years',
    'academic_periods',
    'grades',
    'documents',
    'protocols',
    'communications',
    'student_transfers',
    'pre_enrollments',
    'reenrollment_batches',
    'reenrollment_items',
    'lessons',
    'evaluation_instances',
    'attachments',
    'public_contents',
    'system_settings',
    'roles',
    'user_roles',
    'permissions',
    'role_permissions',
    'school_polos',
    'education_levels',
    'education_grades',
    'school_education_levels',
    'teacher_certifications',
    'class_schedules',
    'calendar_events',
    'notifications',
    'alerts'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    PERFORM public.create_admin_policies(t);
  END LOOP;
END $$;

-- =====================================================
-- 5. POLÍTICA ESPECIAL PARA auth_users
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auth_users') THEN
    ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "admin_auth_users_all" ON auth_users;
    DROP POLICY IF EXISTS "users_can_view_own" ON auth_users;

    CREATE POLICY "admin_auth_users_all" ON auth_users
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    CREATE POLICY "users_can_view_own" ON auth_users
      FOR SELECT TO authenticated
      USING (id = auth.uid());

    RAISE NOTICE 'Políticas criadas para auth_users';
  END IF;
END $$;

-- =====================================================
-- 6. POLÍTICA ESPECIAL PARA public_contents (acesso anônimo)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_contents') THEN
    DROP POLICY IF EXISTS "anon_public_contents_select" ON public_contents;

    CREATE POLICY "anon_public_contents_select" ON public_contents
      FOR SELECT TO anon
      USING (published = true);

    RAISE NOTICE 'Política anônima criada para public_contents';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erro ao criar política anônima: %', SQLERRM;
END $$;

-- =====================================================
-- 7. LIMPAR FUNÇÃO TEMPORÁRIA
-- =====================================================
DROP FUNCTION IF EXISTS public.create_admin_policies(TEXT);

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário atual é Admin, Supervisor ou SuperAdmin. Usa SECURITY DEFINER para evitar recursão RLS.';
COMMENT ON FUNCTION public.is_authenticated() IS 'Verifica se existe um usuário autenticado na sessão.';

-- =====================================================
-- FIM DAS POLÍTICAS DE ADMINISTRADOR
-- =====================================================
-- Resumo:
-- - Administradores (Admin, Supervisor, SuperAdmin) têm CRUD completo
-- - Usuários autenticados podem visualizar (SELECT) todos os dados
-- - Conteúdo público pode ser visto por usuários anônimos
-- - Cada usuário pode ver seu próprio registro em auth_users
-- - Tabelas inexistentes são ignoradas automaticamente
-- =====================================================
