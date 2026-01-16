-- =====================================================
-- MIGRATION 056: CORREÇÃO DA FUNÇÃO link_titular_teacher_to_all_subjects
-- =====================================================
-- Problema: A função verificava apenas registros com deleted_at IS NULL
-- mas se houver uma constraint UNIQUE em (class_id, subject_id) que
-- inclui registros soft-deleted, o INSERT falhava.
--
-- Solução: Usar INSERT ... ON CONFLICT para lidar com duplicatas
-- =====================================================

-- Recriar a função com ON CONFLICT para evitar erros de duplicate key
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
    -- Tentar inserir ou atualizar usando upsert
    -- Primeiro, verificar se existe qualquer registro (inclusive soft-deleted)
    DECLARE
      v_existing_id INTEGER;
      v_is_deleted BOOLEAN;
    BEGIN
      SELECT id, (deleted_at IS NOT NULL) INTO v_existing_id, v_is_deleted
      FROM class_teacher_subjects
      WHERE class_id = p_class_id
        AND subject_id = v_subject.subject_id
      LIMIT 1;

      IF v_existing_id IS NULL THEN
        -- Não existe, criar novo
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
      ELSIF v_is_deleted THEN
        -- Existe mas está soft-deleted, reativar e atualizar
        UPDATE class_teacher_subjects
        SET teacher_id = p_teacher_id,
            deleted_at = NULL,
            updated_by = p_user_id
        WHERE id = v_existing_id;
        v_linked_count := v_linked_count + 1;
      ELSE
        -- Existe e está ativo, apenas atualizar o professor
        UPDATE class_teacher_subjects
        SET teacher_id = p_teacher_id,
            updated_by = p_user_id
        WHERE id = v_existing_id;
        v_linked_count := v_linked_count + 1;
      END IF;
    END;
  END LOOP;

  RETURN v_linked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION link_titular_teacher_to_all_subjects IS 'Vincula o professor titular a todas as disciplinas da turma (Anos Iniciais). Corrigido para lidar com registros soft-deleted.';

-- =====================================================
-- FIM DA MIGRATION 056
-- =====================================================
