-- Migration: Adicionar carga horária às vinculações professor-turma-disciplina
-- Data: 2026-01-15
-- Descrição: Adiciona coluna workload_hours para controle de carga horária individual

-- Adicionar coluna de carga horária
ALTER TABLE class_teacher_subjects
  ADD COLUMN IF NOT EXISTS workload_hours INTEGER;

-- Comentário explicativo
COMMENT ON COLUMN class_teacher_subjects.workload_hours IS 'Carga horária semanal do professor nesta turma/disciplina em horas';

-- Criar índice para consultas de conflito de horário
CREATE INDEX IF NOT EXISTS idx_class_teacher_subjects_teacher_class
  ON class_teacher_subjects(teacher_id, class_id)
  WHERE deleted_at IS NULL;

-- Função para verificar conflito de horário de professor
-- Verifica se o professor já está alocado em outra turma com o mesmo turno
CREATE OR REPLACE FUNCTION check_teacher_schedule_conflict(
  p_teacher_id INTEGER,
  p_class_id INTEGER,
  p_exclude_id INTEGER DEFAULT NULL
) RETURNS TABLE(
  has_conflict BOOLEAN,
  conflicting_class_id INTEGER,
  conflicting_class_name VARCHAR,
  conflicting_shift VARCHAR
) AS $$
DECLARE
  v_shift VARCHAR;
  v_academic_period_id INTEGER;
BEGIN
  -- Obter turno e período acadêmico da turma que está sendo alocada
  SELECT c.shift, c.academic_period_id
  INTO v_shift, v_academic_period_id
  FROM classes c
  WHERE c.id = p_class_id AND c.deleted_at IS NULL;

  -- Se a turma não tem turno definido, não há conflito
  IF v_shift IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::VARCHAR, NULL::VARCHAR;
    RETURN;
  END IF;

  -- Verificar se existe conflito
  RETURN QUERY
  SELECT
    TRUE AS has_conflict,
    c.id AS conflicting_class_id,
    c.name AS conflicting_class_name,
    c.shift AS conflicting_shift
  FROM class_teacher_subjects cts
  JOIN classes c ON c.id = cts.class_id AND c.deleted_at IS NULL
  WHERE cts.teacher_id = p_teacher_id
    AND cts.deleted_at IS NULL
    AND cts.class_id != p_class_id
    AND c.shift = v_shift
    AND c.academic_period_id = v_academic_period_id
    AND (p_exclude_id IS NULL OR cts.id != p_exclude_id)
  LIMIT 1;

  -- Se não encontrou conflitos, retornar sem conflito
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::VARCHAR, NULL::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_teacher_schedule_conflict IS 'Verifica se há conflito de horário para um professor em uma turma específica';
