-- =====================================================
-- MIGRATION 053: MELHORIAS NO SISTEMA DE TRANSFERÊNCIAS EM TURMAS
-- =====================================================
-- Adiciona:
-- 1. Coluna exit_date em class_enrollments para data de saída
-- 2. Status Transferido no enum class_enrollment_status
-- 3. Coluna transfer_id para rastrear a transferência
-- 4. Coluna original_order para manter numeração original
-- 5. Funções para validação de transferência
-- =====================================================

-- =====================================================
-- 1. ADICIONAR NOVO STATUS AO ENUM
-- =====================================================

DO $$ BEGIN
  ALTER TYPE class_enrollment_status ADD VALUE IF NOT EXISTS 'Transferido';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. ADICIONAR COLUNAS EM class_enrollments
-- =====================================================

-- Data de saída da turma (quando transferido ou encerrado)
ALTER TABLE class_enrollments
  ADD COLUMN IF NOT EXISTS exit_date DATE;

-- ID da transferência que causou a saída (se aplicável)
ALTER TABLE class_enrollments
  ADD COLUMN IF NOT EXISTS transfer_id INTEGER;

-- Número de ordem original (para manter posição na lista mesmo após saída)
ALTER TABLE class_enrollments
  ADD COLUMN IF NOT EXISTS original_order INTEGER;

-- Flag para indicar se é entrada por transferência (veio de outra turma/escola)
ALTER TABLE class_enrollments
  ADD COLUMN IF NOT EXISTS is_transfer_entry BOOLEAN DEFAULT FALSE;

-- Comentários
COMMENT ON COLUMN class_enrollments.exit_date IS 'Data de saída do aluno da turma (transferência, conclusão, etc)';
COMMENT ON COLUMN class_enrollments.transfer_id IS 'ID da transferência que causou a saída desta turma';
COMMENT ON COLUMN class_enrollments.original_order IS 'Número de ordem original do aluno na lista (mantido após transferência)';
COMMENT ON COLUMN class_enrollments.is_transfer_entry IS 'Indica se esta matrícula na turma é resultado de transferência';

-- Índices
CREATE INDEX IF NOT EXISTS idx_class_enrollments_exit_date ON class_enrollments(exit_date) WHERE exit_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_class_enrollments_transfer_id ON class_enrollments(transfer_id) WHERE transfer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_class_enrollments_is_transfer_entry ON class_enrollments(is_transfer_entry) WHERE is_transfer_entry = TRUE;

-- Foreign Key para student_transfers (se a tabela existir)
DO $$ BEGIN
  ALTER TABLE class_enrollments
    ADD CONSTRAINT fk_class_enrollments_transfer
    FOREIGN KEY (transfer_id) REFERENCES student_transfers(id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 3. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar se aluno pode ser matriculado em nova turma
-- Retorna TRUE se pode matricular, FALSE se não pode
CREATE OR REPLACE FUNCTION can_enroll_student_in_class(
  p_student_enrollment_id INTEGER,
  p_target_class_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_class_id INTEGER;
  v_current_status TEXT;
BEGIN
  -- Verificar matrícula atual na mesma turma
  SELECT class_id, status INTO v_current_class_id, v_current_status
  FROM class_enrollments
  WHERE student_enrollment_id = p_student_enrollment_id
    AND deleted_at IS NULL
    AND class_id = p_target_class_id
  LIMIT 1;

  -- Se já existe matrícula ativa na mesma turma, não pode
  IF v_current_status = 'Ativo' THEN
    RETURN FALSE;
  END IF;

  -- Verificar se tem alguma matrícula ativa em outra turma
  SELECT class_id, status INTO v_current_class_id, v_current_status
  FROM class_enrollments
  WHERE student_enrollment_id = p_student_enrollment_id
    AND deleted_at IS NULL
    AND status = 'Ativo'
  LIMIT 1;

  -- Se tem matrícula ativa em outra turma, precisa ser transferido primeiro
  IF v_current_class_id IS NOT NULL AND v_current_class_id != p_target_class_id THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_enroll_student_in_class IS 'Verifica se aluno pode ser matriculado em uma turma (não tem matrícula ativa em outra)';

-- Função para transferir aluno entre turmas (interna)
CREATE OR REPLACE FUNCTION transfer_student_between_classes(
  p_student_enrollment_id INTEGER,
  p_source_class_id INTEGER,
  p_target_class_id INTEGER,
  p_transfer_date DATE DEFAULT CURRENT_DATE,
  p_user_id INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  v_source_enrollment_id INTEGER;
  v_new_enrollment_id INTEGER;
  v_source_status TEXT;
BEGIN
  -- Verificar matrícula origem
  SELECT id, status INTO v_source_enrollment_id, v_source_status
  FROM class_enrollments
  WHERE student_enrollment_id = p_student_enrollment_id
    AND class_id = p_source_class_id
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_source_enrollment_id IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado na turma de origem';
  END IF;

  IF v_source_status != 'Ativo' THEN
    RAISE EXCEPTION 'Aluno não está com status Ativo na turma de origem';
  END IF;

  -- Verificar se pode matricular na turma destino
  IF NOT can_enroll_student_in_class(p_student_enrollment_id, p_target_class_id) THEN
    RAISE EXCEPTION 'Aluno já está matriculado na turma de destino ou em outra turma ativa';
  END IF;

  -- Atualizar matrícula origem com status Transferido e data de saída
  UPDATE class_enrollments
  SET
    status = 'Transferido',
    exit_date = p_transfer_date,
    updated_by = p_user_id
  WHERE id = v_source_enrollment_id;

  -- Criar nova matrícula na turma destino
  INSERT INTO class_enrollments (
    student_enrollment_id,
    class_id,
    enrollment_date,
    status,
    is_transfer_entry,
    created_by
  ) VALUES (
    p_student_enrollment_id,
    p_target_class_id,
    p_transfer_date,
    'Ativo',
    TRUE,
    p_user_id
  )
  RETURNING id INTO v_new_enrollment_id;

  RETURN v_new_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION transfer_student_between_classes IS 'Transfere aluno de uma turma para outra, atualizando status e datas';

-- =====================================================
-- 4. VIEW PARA LISTAR ALUNOS COM INFORMAÇÕES DE TRANSFERÊNCIA
-- =====================================================

CREATE OR REPLACE VIEW vw_class_students_with_transfer_info AS
SELECT
  ce.id AS class_enrollment_id,
  ce.class_id,
  ce.student_enrollment_id,
  ce.enrollment_date,
  ce.exit_date,
  ce.status,
  ce.original_order,
  ce.is_transfer_entry,
  ce.transfer_id,
  ce.created_at,
  se.enrollment_status AS student_enrollment_status,
  sp.id AS student_profile_id,
  sp.student_registration_number,
  p.id AS person_id,
  p.first_name,
  p.last_name,
  CONCAT(p.first_name, ' ', p.last_name) AS full_name,
  p.date_of_birth,
  sp.is_pcd,
  sp.cid_code,
  sp.cid_description,
  -- Calcular número de ordem considerando transferidos
  CASE
    WHEN ce.original_order IS NOT NULL THEN ce.original_order
    ELSE ROW_NUMBER() OVER (
      PARTITION BY ce.class_id
      ORDER BY
        -- Alunos originais (não transferidos) primeiro, em ordem alfabética
        ce.is_transfer_entry ASC,
        -- Dentro de cada grupo, ordenar por data de matrícula (mais antigos primeiro)
        ce.enrollment_date ASC,
        -- Desempate por nome
        p.first_name ASC,
        p.last_name ASC
    )
  END AS calculated_order
FROM class_enrollments ce
JOIN student_enrollments se ON se.id = ce.student_enrollment_id
JOIN student_profiles sp ON sp.id = se.student_profile_id
JOIN people p ON p.id = sp.person_id
WHERE ce.deleted_at IS NULL
  AND se.deleted_at IS NULL
  AND sp.deleted_at IS NULL
  AND p.deleted_at IS NULL;

COMMENT ON VIEW vw_class_students_with_transfer_info IS 'View que lista alunos de uma turma com informações de transferência e ordenação correta';

-- =====================================================
-- 5. TRIGGER PARA DEFINIR ORDEM ORIGINAL NA PRIMEIRA MATRÍCULA
-- =====================================================

CREATE OR REPLACE FUNCTION set_class_enrollment_original_order()
RETURNS TRIGGER AS $$
DECLARE
  v_max_order INTEGER;
BEGIN
  -- Só definir ordem original se não é entrada por transferência
  IF NEW.is_transfer_entry IS NULL OR NEW.is_transfer_entry = FALSE THEN
    -- Buscar maior ordem na turma
    SELECT COALESCE(MAX(original_order), 0) INTO v_max_order
    FROM class_enrollments
    WHERE class_id = NEW.class_id
      AND deleted_at IS NULL;

    NEW.original_order := v_max_order + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_class_enrollment_order ON class_enrollments;
CREATE TRIGGER trg_set_class_enrollment_order
  BEFORE INSERT ON class_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION set_class_enrollment_original_order();

COMMENT ON FUNCTION set_class_enrollment_original_order IS 'Define automaticamente o número de ordem original para novos alunos (não transferidos)';

-- =====================================================
-- 6. FUNÇÃO PARA BUSCAR FREQUÊNCIA E NOTAS CONSOLIDADAS
-- =====================================================

-- Função que retorna dados consolidados de frequência do aluno considerando múltiplas turmas
CREATE OR REPLACE FUNCTION get_student_consolidated_attendance(
  p_student_profile_id INTEGER,
  p_academic_year_id INTEGER
) RETURNS TABLE(
  total_lessons INTEGER,
  total_present INTEGER,
  total_absent INTEGER,
  total_justified INTEGER,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(a.id)::INTEGER AS total_lessons,
    COUNT(CASE WHEN a.status = 'Presente' THEN 1 END)::INTEGER AS total_present,
    COUNT(CASE WHEN a.status = 'Ausente' THEN 1 END)::INTEGER AS total_absent,
    COUNT(CASE WHEN a.status = 'Justificada' THEN 1 END)::INTEGER AS total_justified,
    CASE
      WHEN COUNT(a.id) > 0
      THEN ROUND((COUNT(CASE WHEN a.status IN ('Presente', 'Justificada') THEN 1 END)::NUMERIC / COUNT(a.id)::NUMERIC) * 100, 2)
      ELSE 0
    END AS attendance_rate
  FROM attendances a
  JOIN lessons l ON l.id = a.lesson_id
  JOIN classes c ON c.id = l.class_id
  JOIN academic_periods ap ON ap.id = c.academic_period_id
  JOIN student_enrollments se ON se.id = a.student_enrollment_id
  WHERE se.student_profile_id = p_student_profile_id
    AND ap.academic_year_id = p_academic_year_id
    AND a.deleted_at IS NULL
    AND l.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_consolidated_attendance IS 'Retorna frequência consolidada do aluno em todas as turmas do ano letivo';

-- Função que retorna notas consolidadas do aluno considerando múltiplas turmas
CREATE OR REPLACE FUNCTION get_student_consolidated_grades(
  p_student_profile_id INTEGER,
  p_academic_year_id INTEGER,
  p_subject_id INTEGER DEFAULT NULL
) RETURNS TABLE(
  subject_id INTEGER,
  subject_name VARCHAR,
  grades_count INTEGER,
  total_score NUMERIC,
  average_score NUMERIC,
  class_ids INTEGER[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS subject_id,
    s.name AS subject_name,
    COUNT(g.id)::INTEGER AS grades_count,
    COALESCE(SUM(g.score), 0) AS total_score,
    CASE
      WHEN COUNT(g.id) > 0
      THEN ROUND(AVG(g.score), 2)
      ELSE 0
    END AS average_score,
    ARRAY_AGG(DISTINCT c.id) AS class_ids
  FROM grades g
  JOIN evaluation_instances ei ON ei.id = g.evaluation_instance_id
  JOIN subjects s ON s.id = ei.subject_id
  JOIN classes c ON c.id = ei.class_id
  JOIN academic_periods ap ON ap.id = c.academic_period_id
  JOIN student_enrollments se ON se.id = g.student_enrollment_id
  WHERE se.student_profile_id = p_student_profile_id
    AND ap.academic_year_id = p_academic_year_id
    AND (p_subject_id IS NULL OR s.id = p_subject_id)
    AND g.deleted_at IS NULL
    AND ei.deleted_at IS NULL
  GROUP BY s.id, s.name
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_consolidated_grades IS 'Retorna notas consolidadas do aluno em todas as turmas do ano letivo, opcionalmente filtrado por disciplina';
