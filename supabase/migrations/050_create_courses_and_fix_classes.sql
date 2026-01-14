-- Migration 050: Criar cursos e corrigir turmas da E.M.E.F Magalhães Barata
-- Data: 14/01/2026
-- Descrição: Cria os cursos (Etapas de Ensino) e atualiza as turmas

-- =============================================================================
-- 1. CRIAR CURSOS (ETAPAS DE ENSINO)
-- =============================================================================

-- Inserir Educação Infantil
INSERT INTO courses (name, education_level, created_by)
SELECT 'Educação Infantil', 'Educação Infantil', 1
WHERE NOT EXISTS (
  SELECT 1 FROM courses
  WHERE education_level = 'Educação Infantil'
  AND deleted_at IS NULL
);

-- Inserir Ensino Fundamental - Anos Iniciais
INSERT INTO courses (name, education_level, created_by)
SELECT 'Ensino Fundamental - Anos Iniciais', 'Ensino Fundamental I', 1
WHERE NOT EXISTS (
  SELECT 1 FROM courses
  WHERE education_level = 'Ensino Fundamental I'
  AND deleted_at IS NULL
);

-- Inserir Ensino Fundamental - Anos Finais
INSERT INTO courses (name, education_level, created_by)
SELECT 'Ensino Fundamental - Anos Finais', 'Ensino Fundamental II', 1
WHERE NOT EXISTS (
  SELECT 1 FROM courses
  WHERE education_level = 'Ensino Fundamental II'
  AND deleted_at IS NULL
);

-- Inserir Ensino Médio
INSERT INTO courses (name, education_level, created_by)
SELECT 'Ensino Médio', 'Ensino Médio', 1
WHERE NOT EXISTS (
  SELECT 1 FROM courses
  WHERE education_level = 'Ensino Médio'
  AND deleted_at IS NULL
);

-- Inserir EJA - Educação de Jovens e Adultos
INSERT INTO courses (name, education_level, created_by)
SELECT 'EJA - Educação de Jovens e Adultos', 'EJA', 1
WHERE NOT EXISTS (
  SELECT 1 FROM courses
  WHERE education_level = 'EJA'
  AND deleted_at IS NULL
);

-- =============================================================================
-- 2. ATUALIZAR TURMAS DA ESCOLA MAGALHÃES BARATA
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
  WHERE education_level = 'Ensino Fundamental I'
    AND deleted_at IS NULL
  LIMIT 1;

  -- Buscar ID do curso Anos Finais (Fundamental II)
  SELECT id INTO v_course_anos_finais
  FROM courses
  WHERE education_level = 'Ensino Fundamental II'
    AND deleted_at IS NULL
  LIMIT 1;

  RAISE NOTICE 'Curso Anos Iniciais: ID %', v_course_anos_iniciais;
  RAISE NOTICE 'Curso Anos Finais: ID %', v_course_anos_finais;

  -- Atualizar turmas do 1º ao 5º Ano → Anos Iniciais (Fundamental I)
  IF v_course_anos_iniciais IS NOT NULL THEN
    UPDATE classes
    SET course_id = v_course_anos_iniciais,
        updated_by = 1
    WHERE school_id = v_school_id
      AND (
        name ILIKE '%1%Ano%' OR
        name ILIKE '%2%Ano%' OR
        name ILIKE '%3%Ano%' OR
        name ILIKE '%4%Ano%' OR
        name ILIKE '%5%Ano%'
      )
      AND deleted_at IS NULL;

    RAISE NOTICE 'Turmas do 1º ao 5º Ano atualizadas para Anos Iniciais';
  END IF;

  -- Atualizar turmas do 6º ao 9º Ano → Anos Finais (Fundamental II)
  IF v_course_anos_finais IS NOT NULL THEN
    UPDATE classes
    SET course_id = v_course_anos_finais,
        updated_by = 1
    WHERE school_id = v_school_id
      AND (
        name ILIKE '%6%Ano%' OR
        name ILIKE '%7%Ano%' OR
        name ILIKE '%8%Ano%' OR
        name ILIKE '%9%Ano%'
      )
      AND deleted_at IS NULL;

    RAISE NOTICE 'Turmas do 6º ao 9º Ano atualizadas para Anos Finais';
  END IF;

  RAISE NOTICE 'Atualização concluída!';
END $$;

-- =============================================================================
-- 3. VERIFICAR RESULTADO
-- =============================================================================

-- Listar todos os cursos criados
SELECT id, name, education_level, created_at
FROM courses
WHERE deleted_at IS NULL
ORDER BY id;

-- Listar turmas atualizadas
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
