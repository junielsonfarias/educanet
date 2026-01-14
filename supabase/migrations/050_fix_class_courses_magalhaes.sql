-- Migration 050: Corrigir cursos das turmas da E.M.E.F Magalhães Barata
-- Data: 14/01/2026
-- Descrição: Atualiza course_id das turmas para os cursos corretos

-- =============================================================================
-- 1. IDENTIFICAR IDS NECESSÁRIOS
-- =============================================================================

DO $$
DECLARE
  v_school_id INTEGER;
  v_course_anos_iniciais INTEGER;
  v_course_anos_finais INTEGER;
BEGIN
  -- Buscar ID da escola Magalhães Barata
  SELECT id INTO v_school_id
  FROM schools
  WHERE name ILIKE '%Magalh%Barata%'
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_school_id IS NULL THEN
    RAISE NOTICE 'Escola Magalhães Barata não encontrada';
    RETURN;
  END IF;

  RAISE NOTICE 'Escola encontrada: ID %', v_school_id;

  -- Buscar ID do curso Anos Iniciais (Fundamental I)
  SELECT id INTO v_course_anos_iniciais
  FROM courses
  WHERE (name ILIKE '%Anos Iniciais%' OR name ILIKE '%Fundamental I%' OR education_level = 'Ensino Fundamental I')
    AND deleted_at IS NULL
  LIMIT 1;

  -- Buscar ID do curso Anos Finais (Fundamental II)
  SELECT id INTO v_course_anos_finais
  FROM courses
  WHERE (name ILIKE '%Anos Finais%' OR name ILIKE '%Fundamental II%' OR education_level = 'Ensino Fundamental II')
    AND deleted_at IS NULL
  LIMIT 1;

  RAISE NOTICE 'Curso Anos Iniciais: ID %', v_course_anos_iniciais;
  RAISE NOTICE 'Curso Anos Finais: ID %', v_course_anos_finais;

  -- =============================================================================
  -- 2. ATUALIZAR TURMAS
  -- =============================================================================

  -- 5º Ano A → Anos Iniciais (Fundamental I)
  IF v_course_anos_iniciais IS NOT NULL THEN
    UPDATE classes
    SET course_id = v_course_anos_iniciais,
        updated_by = 1
    WHERE school_id = v_school_id
      AND name ILIKE '%5%Ano%'
      AND deleted_at IS NULL;

    RAISE NOTICE 'Turmas do 5º Ano atualizadas para Anos Iniciais';
  END IF;

  -- 6º Ano A → Anos Finais (Fundamental II)
  IF v_course_anos_finais IS NOT NULL THEN
    UPDATE classes
    SET course_id = v_course_anos_finais,
        updated_by = 1
    WHERE school_id = v_school_id
      AND name ILIKE '%6%Ano%'
      AND deleted_at IS NULL;

    RAISE NOTICE 'Turmas do 6º Ano atualizadas para Anos Finais';
  END IF;

  -- 9º Ano A → Anos Finais (Fundamental II)
  IF v_course_anos_finais IS NOT NULL THEN
    UPDATE classes
    SET course_id = v_course_anos_finais,
        updated_by = 1
    WHERE school_id = v_school_id
      AND name ILIKE '%9%Ano%'
      AND deleted_at IS NULL;

    RAISE NOTICE 'Turmas do 9º Ano atualizadas para Anos Finais';
  END IF;

  RAISE NOTICE 'Atualização concluída!';
END $$;

-- =============================================================================
-- 3. VERIFICAR RESULTADO
-- =============================================================================

SELECT
  c.id,
  c.name AS turma,
  s.name AS escola,
  co.name AS curso,
  co.education_level
FROM classes c
JOIN schools s ON s.id = c.school_id
LEFT JOIN courses co ON co.id = c.course_id
WHERE s.name ILIKE '%Magalh%Barata%'
  AND c.deleted_at IS NULL
ORDER BY c.name;
