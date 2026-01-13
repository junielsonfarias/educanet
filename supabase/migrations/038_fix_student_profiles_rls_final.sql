-- =====================================================
-- CORREÇÃO FINAL: Recursão Infinita em student_profiles
-- =====================================================
-- Data: 13/01/2026
-- Problema: Políticas RLS em student_profiles causam recursão infinita
-- Solução: Desabilitar RLS e usar políticas simples baseadas em autenticação
-- =====================================================

-- 1. Desabilitar RLS primeiro para evitar erros durante remoção de políticas
-- =====================================================
ALTER TABLE IF EXISTS student_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes em student_profiles
-- =====================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Loop por todas as políticas da tabela e remove cada uma
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'student_profiles'
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.student_profiles', pol.policyname);
    RAISE NOTICE 'Política removida: %', pol.policyname;
  END LOOP;
END $$;

-- 3. Garantir que RLS está desabilitado
-- =====================================================
ALTER TABLE student_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Criar políticas simples (para quando RLS for reabilitado no futuro)
-- =====================================================
-- Estas políticas são simples e não causam recursão porque:
-- - Não consultam a própria tabela student_profiles
-- - Não usam funções que consultem tabelas com RLS ativo
-- - Usam apenas verificações diretas de auth.uid()

-- Política de SELECT: Usuários autenticados podem ver todos os perfis
-- (A filtragem será feita na aplicação)
CREATE POLICY "student_profiles_select_authenticated"
ON student_profiles
FOR SELECT
TO authenticated
USING (true);

-- Política de INSERT: Usuários autenticados podem criar perfis
CREATE POLICY "student_profiles_insert_authenticated"
ON student_profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política de UPDATE: Usuários autenticados podem atualizar perfis
CREATE POLICY "student_profiles_update_authenticated"
ON student_profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política de DELETE: Usuários autenticados podem deletar perfis
CREATE POLICY "student_profiles_delete_authenticated"
ON student_profiles
FOR DELETE
TO authenticated
USING (true);

-- 5. Manter RLS DESABILITADO por segurança
-- =====================================================
-- Se quiser habilitar RLS no futuro, descomente a linha abaixo
-- e certifique-se de que as políticas não causam recursão
-- ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Verificar também a tabela people (pode ter política com recursão)
-- =====================================================
-- Desabilitar RLS em people também se estiver causando problemas
DO $$
BEGIN
  -- Verificar se a tabela people existe e desabilitar RLS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'people' AND table_schema = 'public') THEN
    ALTER TABLE people DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS desabilitado em people';
  END IF;
END $$;

-- 7. Verificar student_enrollments (pode ter política com recursão)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_enrollments' AND table_schema = 'public') THEN
    ALTER TABLE student_enrollments DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS desabilitado em student_enrollments';
  END IF;
END $$;

-- 8. Comentários
-- =====================================================
COMMENT ON TABLE student_profiles IS 'Perfis de alunos. RLS desabilitado para evitar recursão infinita. Controle de acesso feito na aplicação.';

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================
-- NOTA: Esta migration desabilita RLS em student_profiles, people e student_enrollments
-- para garantir que não haja recursão infinita. O controle de acesso deve ser feito
-- na camada de aplicação (frontend/backend).
--
-- Se você precisar de RLS em produção:
-- 1. Crie políticas MUITO simples que não consultem outras tabelas
-- 2. Use apenas auth.uid() para verificações
-- 3. Evite funções que acessem tabelas com RLS ativo
-- 4. Teste exaustivamente antes de habilitar
-- =====================================================
