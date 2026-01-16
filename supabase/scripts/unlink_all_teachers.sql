-- =====================================================
-- SCRIPT: DESVINCULAR TODOS OS PROFESSORES DAS ESCOLAS E TURMAS
-- =====================================================
-- Este script remove todas as vinculações de professores:
-- 1. Remove alocações de professores em turmas/disciplinas (class_teacher_subjects)
-- 2. Remove professor titular das turmas (homeroom_teacher_id)
-- 3. Remove professor regente das turmas (regent_teacher_id)
--
-- IMPORTANTE: Os professores permanecem ATIVOS no sistema.
-- Apenas suas vinculações são removidas.
--
-- ATENÇÃO: Este script usa soft delete (deleted_at) para manter
-- histórico e permitir recuperação se necessário.
-- =====================================================

-- Iniciar transação para garantir atomicidade
BEGIN;

-- =====================================================
-- 1. CONTAGEM ANTES DA EXECUÇÃO (para verificação)
-- =====================================================
DO $$
DECLARE
  v_cts_count INTEGER;
  v_homeroom_count INTEGER;
  v_regent_count INTEGER;
BEGIN
  -- Contar alocações ativas em class_teacher_subjects
  SELECT COUNT(*) INTO v_cts_count
  FROM class_teacher_subjects
  WHERE deleted_at IS NULL;

  -- Contar turmas com professor titular
  SELECT COUNT(*) INTO v_homeroom_count
  FROM classes
  WHERE homeroom_teacher_id IS NOT NULL
    AND deleted_at IS NULL;

  -- Contar turmas com professor regente
  SELECT COUNT(*) INTO v_regent_count
  FROM classes
  WHERE regent_teacher_id IS NOT NULL
    AND deleted_at IS NULL;

  RAISE NOTICE '=== CONTAGEM ANTES DA EXECUÇÃO ===';
  RAISE NOTICE 'Alocações em class_teacher_subjects: %', v_cts_count;
  RAISE NOTICE 'Turmas com professor titular: %', v_homeroom_count;
  RAISE NOTICE 'Turmas com professor regente: %', v_regent_count;
END $$;

-- =====================================================
-- 2. SOFT DELETE EM class_teacher_subjects
-- =====================================================
-- Marca todas as alocações professor-turma-disciplina como excluídas
UPDATE class_teacher_subjects
SET deleted_at = NOW(),
    updated_by = 1
WHERE deleted_at IS NULL;

-- =====================================================
-- 3. LIMPAR homeroom_teacher_id DAS TURMAS
-- =====================================================
-- Remove o professor titular de todas as turmas
UPDATE classes
SET homeroom_teacher_id = NULL,
    updated_by = 1
WHERE homeroom_teacher_id IS NOT NULL
  AND deleted_at IS NULL;

-- =====================================================
-- 4. LIMPAR regent_teacher_id DAS TURMAS
-- =====================================================
-- Remove o professor regente de todas as turmas
UPDATE classes
SET regent_teacher_id = NULL,
    updated_by = 1
WHERE regent_teacher_id IS NOT NULL
  AND deleted_at IS NULL;

-- =====================================================
-- 5. CONTAGEM APÓS A EXECUÇÃO (para verificação)
-- =====================================================
DO $$
DECLARE
  v_cts_active INTEGER;
  v_cts_deleted INTEGER;
  v_homeroom_count INTEGER;
  v_regent_count INTEGER;
BEGIN
  -- Contar alocações ativas (deve ser 0)
  SELECT COUNT(*) INTO v_cts_active
  FROM class_teacher_subjects
  WHERE deleted_at IS NULL;

  -- Contar alocações marcadas como excluídas
  SELECT COUNT(*) INTO v_cts_deleted
  FROM class_teacher_subjects
  WHERE deleted_at IS NOT NULL;

  -- Contar turmas com professor titular (deve ser 0)
  SELECT COUNT(*) INTO v_homeroom_count
  FROM classes
  WHERE homeroom_teacher_id IS NOT NULL
    AND deleted_at IS NULL;

  -- Contar turmas com professor regente (deve ser 0)
  SELECT COUNT(*) INTO v_regent_count
  FROM classes
  WHERE regent_teacher_id IS NOT NULL
    AND deleted_at IS NULL;

  RAISE NOTICE '=== CONTAGEM APÓS A EXECUÇÃO ===';
  RAISE NOTICE 'Alocações ativas em class_teacher_subjects: % (esperado: 0)', v_cts_active;
  RAISE NOTICE 'Alocações marcadas como excluídas: %', v_cts_deleted;
  RAISE NOTICE 'Turmas com professor titular: % (esperado: 0)', v_homeroom_count;
  RAISE NOTICE 'Turmas com professor regente: % (esperado: 0)', v_regent_count;
END $$;

-- =====================================================
-- 6. VERIFICAR QUE PROFESSORES PERMANECEM ATIVOS
-- =====================================================
DO $$
DECLARE
  v_teachers_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_teachers_count
  FROM teachers
  WHERE deleted_at IS NULL;

  RAISE NOTICE '=== VERIFICAÇÃO DE PROFESSORES ===';
  RAISE NOTICE 'Professores ativos no sistema: %', v_teachers_count;
  RAISE NOTICE 'Os professores permanecem cadastrados e ativos!';
END $$;

-- Confirmar transação
COMMIT;

-- =====================================================
-- SCRIPT DE RECUPERAÇÃO (CASO NECESSÁRIO)
-- =====================================================
-- Se precisar reverter a operação, execute:
--
-- BEGIN;
--
-- -- Restaurar alocações excluídas (as mais recentes)
-- UPDATE class_teacher_subjects
-- SET deleted_at = NULL
-- WHERE deleted_at >= NOW() - INTERVAL '1 hour';
--
-- -- NOTA: homeroom_teacher_id e regent_teacher_id precisariam
-- -- ser restaurados manualmente com base em backup/logs
--
-- COMMIT;
-- =====================================================
