-- =====================================================
-- MIGRATION 055: MODELO DE PROFESSOR POR NÍVEL DE ENSINO
-- =====================================================
-- Implementa dois modelos distintos:
--
-- ANOS INICIAIS (Infantil + Fundamental I):
--   - 1 Professor Titular (vinculado a TODAS disciplinas automaticamente)
--   - 1 Professor Assistente (opcional)
--   - Frequência UNIFICADA (1 falta = falta em todas disciplinas)
--
-- ANOS FINAIS (Fundamental II + Médio + EJA):
--   - 1 Professor por disciplina
--   - Frequência SEPARADA por disciplina
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COLUNA assistant_teacher_id EM CLASSES
-- =====================================================

-- Coluna para professor assistente (anos iniciais)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS assistant_teacher_id INTEGER;

-- Foreign key para professor assistente
DO $$ BEGIN
  ALTER TABLE classes
    ADD CONSTRAINT classes_assistant_teacher_id_fkey
    FOREIGN KEY (assistant_teacher_id) REFERENCES teachers(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Índice para professor assistente
CREATE INDEX IF NOT EXISTS idx_classes_assistant_teacher ON classes(assistant_teacher_id)
  WHERE assistant_teacher_id IS NOT NULL;

-- Comentário
COMMENT ON COLUMN classes.assistant_teacher_id IS 'Professor assistente (usado apenas em Anos Iniciais)';

-- =====================================================
-- 2. ADICIONAR FLAG unified_attendance EM CLASSES
-- =====================================================

-- Flag para indicar se a frequência é unificada
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS unified_attendance BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN classes.unified_attendance IS 'Se TRUE, frequência é unificada para todas as disciplinas (Anos Iniciais)';

-- =====================================================
-- 3. FUNÇÃO PARA VERIFICAR SE É ANOS INICIAIS
-- =====================================================

CREATE OR REPLACE FUNCTION is_early_years_class(p_class_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_education_level VARCHAR;
BEGIN
  -- Buscar nível de ensino da turma via curso
  SELECT c.education_level INTO v_education_level
  FROM classes cl
  JOIN courses c ON c.id = cl.course_id
  WHERE cl.id = p_class_id
    AND cl.deleted_at IS NULL;

  -- Anos Iniciais = Infantil ou Fundamental I
  RETURN v_education_level IN ('Educação Infantil', 'Ensino Fundamental I');
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_early_years_class IS 'Verifica se a turma é de Anos Iniciais (Infantil ou Fundamental I)';

-- =====================================================
-- 4. FUNÇÃO PARA VINCULAR PROFESSOR TITULAR A TODAS DISCIPLINAS
-- =====================================================

CREATE OR REPLACE FUNCTION link_titular_teacher_to_all_subjects(
  p_class_id INTEGER,
  p_teacher_id INTEGER,
  p_user_id INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  v_is_early_years BOOLEAN;
  v_subject RECORD;
  v_linked_count INTEGER := 0;
  v_existing_id INTEGER;
BEGIN
  -- Verificar se é anos iniciais
  v_is_early_years := is_early_years_class(p_class_id);

  IF NOT v_is_early_years THEN
    RAISE EXCEPTION 'Esta função só pode ser usada para turmas de Anos Iniciais';
  END IF;

  -- Buscar todas as disciplinas do curso da turma
  FOR v_subject IN
    SELECT DISTINCT s.id as subject_id
    FROM classes cl
    JOIN course_subjects cs ON cs.course_id = cl.course_id
    JOIN subjects s ON s.id = cs.subject_id
    WHERE cl.id = p_class_id
      AND cl.deleted_at IS NULL
      AND cs.deleted_at IS NULL
      AND s.deleted_at IS NULL
  LOOP
    -- Verificar se já existe vínculo
    SELECT id INTO v_existing_id
    FROM class_teacher_subjects
    WHERE class_id = p_class_id
      AND subject_id = v_subject.subject_id
      AND deleted_at IS NULL;

    IF v_existing_id IS NULL THEN
      -- Criar novo vínculo
      INSERT INTO class_teacher_subjects (
        class_id,
        teacher_id,
        subject_id,
        created_by
      ) VALUES (
        p_class_id,
        p_teacher_id,
        v_subject.subject_id,
        p_user_id
      );
      v_linked_count := v_linked_count + 1;
    ELSE
      -- Atualizar vínculo existente
      UPDATE class_teacher_subjects
      SET teacher_id = p_teacher_id,
          updated_by = p_user_id
      WHERE id = v_existing_id;
      v_linked_count := v_linked_count + 1;
    END IF;
  END LOOP;

  RETURN v_linked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION link_titular_teacher_to_all_subjects IS 'Vincula o professor titular a todas as disciplinas da turma (Anos Iniciais)';

-- =====================================================
-- 5. TRIGGER PARA AUTO-VINCULAR PROFESSOR TITULAR
-- =====================================================

CREATE OR REPLACE FUNCTION auto_link_titular_teacher()
RETURNS TRIGGER AS $$
BEGIN
  -- Só executar se homeroom_teacher_id foi definido/alterado
  IF (TG_OP = 'INSERT' AND NEW.homeroom_teacher_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.homeroom_teacher_id IS DISTINCT FROM OLD.homeroom_teacher_id AND NEW.homeroom_teacher_id IS NOT NULL) THEN

    -- Verificar se é anos iniciais
    IF is_early_years_class(NEW.id) THEN
      -- Vincular professor titular a todas as disciplinas
      PERFORM link_titular_teacher_to_all_subjects(NEW.id, NEW.homeroom_teacher_id, COALESCE(NEW.updated_by, NEW.created_by, 1));

      -- Ativar frequência unificada automaticamente
      NEW.unified_attendance := TRUE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_link_titular_teacher ON classes;
CREATE TRIGGER trg_auto_link_titular_teacher
  BEFORE INSERT OR UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_titular_teacher();

COMMENT ON FUNCTION auto_link_titular_teacher IS 'Trigger que vincula automaticamente o professor titular a todas as disciplinas em Anos Iniciais';

-- =====================================================
-- 6. FUNÇÃO PARA REMOVER VÍNCULOS DO PROFESSOR TITULAR
-- =====================================================

CREATE OR REPLACE FUNCTION unlink_titular_teacher_from_subjects(
  p_class_id INTEGER,
  p_user_id INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Soft delete de todos os vínculos da turma
  UPDATE class_teacher_subjects
  SET deleted_at = NOW(),
      updated_by = p_user_id
  WHERE class_id = p_class_id
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION unlink_titular_teacher_from_subjects IS 'Remove todos os vínculos professor-disciplina de uma turma';

-- =====================================================
-- 7. VIEW PARA LISTAR TURMAS COM MODELO DE PROFESSOR
-- =====================================================

CREATE OR REPLACE VIEW vw_classes_teacher_model AS
SELECT
  c.id AS class_id,
  c.name AS class_name,
  c.code AS class_code,
  c.shift,
  c.unified_attendance,
  co.education_level,
  CASE
    WHEN co.education_level IN ('Educação Infantil', 'Ensino Fundamental I') THEN 'Anos Iniciais'
    ELSE 'Anos Finais'
  END AS teacher_model,
  CASE
    WHEN co.education_level IN ('Educação Infantil', 'Ensino Fundamental I') THEN TRUE
    ELSE FALSE
  END AS is_early_years,
  -- Professor Titular
  c.homeroom_teacher_id,
  ht.id AS titular_teacher_id,
  CONCAT(pht.first_name, ' ', pht.last_name) AS titular_teacher_name,
  -- Professor Assistente
  c.assistant_teacher_id,
  at.id AS assistant_id,
  CONCAT(pat.first_name, ' ', pat.last_name) AS assistant_teacher_name,
  -- Professor Regente
  c.regent_teacher_id,
  rt.id AS regent_id,
  CONCAT(prt.first_name, ' ', prt.last_name) AS regent_teacher_name,
  -- Contagem de professores por disciplina (anos finais)
  (
    SELECT COUNT(DISTINCT cts.teacher_id)
    FROM class_teacher_subjects cts
    WHERE cts.class_id = c.id AND cts.deleted_at IS NULL
  ) AS subject_teachers_count,
  -- Escola
  s.id AS school_id,
  s.name AS school_name
FROM classes c
LEFT JOIN courses co ON co.id = c.course_id
LEFT JOIN schools s ON s.id = c.school_id
-- Professor Titular
LEFT JOIN teachers ht ON ht.id = c.homeroom_teacher_id
LEFT JOIN people pht ON pht.id = ht.person_id
-- Professor Assistente
LEFT JOIN teachers at ON at.id = c.assistant_teacher_id
LEFT JOIN people pat ON pat.id = at.person_id
-- Professor Regente
LEFT JOIN teachers rt ON rt.id = c.regent_teacher_id
LEFT JOIN people prt ON prt.id = rt.person_id
WHERE c.deleted_at IS NULL;

COMMENT ON VIEW vw_classes_teacher_model IS 'View que mostra turmas com seu modelo de professor (Anos Iniciais vs Anos Finais)';

-- =====================================================
-- 8. FUNÇÃO PARA REGISTRAR FREQUÊNCIA UNIFICADA
-- =====================================================

CREATE OR REPLACE FUNCTION register_unified_attendance(
  p_class_id INTEGER,
  p_student_enrollment_id INTEGER,
  p_date DATE,
  p_status VARCHAR,  -- 'Presente', 'Ausente', 'Justificada'
  p_user_id INTEGER DEFAULT 1,
  p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_unified BOOLEAN;
  v_lesson RECORD;
  v_attendance_count INTEGER := 0;
BEGIN
  -- Verificar se a turma tem frequência unificada
  SELECT unified_attendance INTO v_unified
  FROM classes
  WHERE id = p_class_id AND deleted_at IS NULL;

  IF NOT COALESCE(v_unified, FALSE) THEN
    RAISE EXCEPTION 'Esta turma não usa frequência unificada';
  END IF;

  -- Buscar ou criar aulas do dia para todas as disciplinas
  FOR v_lesson IN
    SELECT DISTINCT cts.subject_id
    FROM class_teacher_subjects cts
    WHERE cts.class_id = p_class_id
      AND cts.deleted_at IS NULL
  LOOP
    -- Verificar se existe aula para esta data/disciplina
    DECLARE
      v_lesson_id INTEGER;
    BEGIN
      SELECT l.id INTO v_lesson_id
      FROM lessons l
      WHERE l.class_id = p_class_id
        AND l.subject_id = v_lesson.subject_id
        AND l.lesson_date = p_date
        AND l.deleted_at IS NULL
      LIMIT 1;

      -- Se não existe, criar aula
      IF v_lesson_id IS NULL THEN
        INSERT INTO lessons (
          class_id,
          subject_id,
          lesson_date,
          created_by
        ) VALUES (
          p_class_id,
          v_lesson.subject_id,
          p_date,
          p_user_id
        )
        RETURNING id INTO v_lesson_id;
      END IF;

      -- Inserir ou atualizar frequência
      INSERT INTO attendances (
        lesson_id,
        student_enrollment_id,
        status,
        notes,
        created_by
      ) VALUES (
        v_lesson_id,
        p_student_enrollment_id,
        p_status::attendance_status,
        p_notes,
        p_user_id
      )
      ON CONFLICT (lesson_id, student_enrollment_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_by = EXCLUDED.created_by;

      v_attendance_count := v_attendance_count + 1;
    END;
  END LOOP;

  RETURN v_attendance_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION register_unified_attendance IS 'Registra frequência unificada para todas as disciplinas de uma turma (Anos Iniciais)';

-- =====================================================
-- 9. ATUALIZAR TURMAS EXISTENTES DE ANOS INICIAIS
-- =====================================================

-- Definir unified_attendance = TRUE para turmas de Anos Iniciais
UPDATE classes c
SET unified_attendance = TRUE
FROM courses co
WHERE c.course_id = co.id
  AND co.education_level IN ('Educação Infantil', 'Ensino Fundamental I')
  AND c.deleted_at IS NULL
  AND (c.unified_attendance IS NULL OR c.unified_attendance = FALSE);

-- =====================================================
-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON COLUMN classes.homeroom_teacher_id IS 'Professor Titular - Em Anos Iniciais é vinculado a todas as disciplinas automaticamente';
COMMENT ON COLUMN classes.assistant_teacher_id IS 'Professor Assistente - Auxiliar do professor titular (apenas Anos Iniciais)';
COMMENT ON COLUMN classes.regent_teacher_id IS 'Professor Regente - Responsável pedagógico pela turma';

-- =====================================================
-- FIM DA MIGRATION 055
-- =====================================================
