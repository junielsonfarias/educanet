-- =====================================================
-- MIGRATION 032: FUNÇÕES ÚTEIS
-- =====================================================
-- Esta migration cria funções SQL úteis para cálculos
-- e operações frequentes no banco de dados.
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO: Calcular média do aluno por período
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_student_average(
  p_student_profile_id INTEGER,
  p_academic_period_id INTEGER DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_average NUMERIC;
BEGIN
  SELECT AVG(g.grade_value)
  INTO v_average
  FROM grades g
  JOIN evaluation_instances ei ON g.evaluation_instance_id = ei.id AND ei.deleted_at IS NULL
  WHERE g.student_profile_id = p_student_profile_id
  AND g.deleted_at IS NULL
  AND (p_academic_period_id IS NULL OR ei.academic_period_id = p_academic_period_id);
  
  RETURN COALESCE(ROUND(v_average, 2), 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_student_average IS 'Calcula a média de notas de um aluno. Se p_academic_period_id for NULL, calcula a média geral.';

-- =====================================================
-- 2. FUNÇÃO: Calcular média do aluno por disciplina
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_student_average_by_subject(
  p_student_profile_id INTEGER,
  p_subject_id INTEGER,
  p_academic_period_id INTEGER DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_average NUMERIC;
BEGIN
  SELECT AVG(g.grade_value)
  INTO v_average
  FROM grades g
  JOIN evaluation_instances ei ON g.evaluation_instance_id = ei.id AND ei.deleted_at IS NULL
  WHERE g.student_profile_id = p_student_profile_id
  AND ei.subject_id = p_subject_id
  AND g.deleted_at IS NULL
  AND (p_academic_period_id IS NULL OR ei.academic_period_id = p_academic_period_id);
  
  RETURN COALESCE(ROUND(v_average, 2), 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_student_average_by_subject IS 'Calcula a média de notas de um aluno em uma disciplina específica.';

-- =====================================================
-- 3. FUNÇÃO: Calcular percentual de frequência
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_attendance_percentage(
  p_student_profile_id INTEGER,
  p_academic_period_id INTEGER DEFAULT NULL,
  p_class_id INTEGER DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_total INTEGER;
  v_present INTEGER;
  v_percentage NUMERIC;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE a.status = 'present')
  INTO v_total, v_present
  FROM attendances a
  JOIN lessons l ON a.lesson_id = l.id AND l.deleted_at IS NULL
  WHERE a.student_profile_id = p_student_profile_id
  AND a.deleted_at IS NULL
  AND (p_academic_period_id IS NULL OR l.academic_period_id = p_academic_period_id)
  AND (p_class_id IS NULL OR l.class_id = p_class_id);
  
  IF v_total = 0 THEN
    RETURN 0;
  END IF;
  
  v_percentage := (v_present::NUMERIC / v_total::NUMERIC) * 100;
  RETURN ROUND(v_percentage, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_attendance_percentage IS 'Calcula o percentual de frequência de um aluno. Retorna 0 se não houver registros.';

-- =====================================================
-- 4. FUNÇÃO: Obter status do aluno
-- =====================================================
CREATE OR REPLACE FUNCTION get_student_status(p_student_profile_id INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status
  INTO v_status
  FROM student_profiles
  WHERE id = p_student_profile_id
  AND deleted_at IS NULL;
  
  RETURN COALESCE(v_status, 'unknown');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_status IS 'Retorna o status atual de um aluno (ativo, inativo, transferido, etc.).';

-- =====================================================
-- 5. FUNÇÃO: Verificar capacidade de matrícula na turma
-- =====================================================
CREATE OR REPLACE FUNCTION check_enrollment_capacity(p_class_id INTEGER)
RETURNS TABLE(
  has_capacity BOOLEAN,
  current_count INTEGER,
  max_capacity INTEGER
) AS $$
DECLARE
  v_current INTEGER;
  v_max INTEGER;
BEGIN
  -- Contar alunos matriculados
  SELECT COUNT(*)
  INTO v_current
  FROM class_enrollments
  WHERE class_id = p_class_id
  AND status = 'enrolled'
  AND deleted_at IS NULL;
  
  -- Buscar capacidade máxima
  SELECT max_students
  INTO v_max
  FROM classes
  WHERE id = p_class_id
  AND deleted_at IS NULL;
  
  RETURN QUERY
  SELECT 
    CASE 
      WHEN v_max IS NULL THEN TRUE -- Sem limite
      WHEN v_current < v_max THEN TRUE
      ELSE FALSE
    END as has_capacity,
    v_current as current_count,
    COALESCE(v_max, 0) as max_capacity;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_enrollment_capacity IS 'Verifica se uma turma ainda tem capacidade para novos alunos. Retorna has_capacity, current_count e max_capacity.';

-- =====================================================
-- 6. FUNÇÃO: Calcular idade do aluno
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_student_age(p_student_profile_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_birth_date DATE;
  v_age INTEGER;
BEGIN
  SELECT p.date_of_birth
  INTO v_birth_date
  FROM student_profiles sp
  JOIN people p ON sp.person_id = p.id
  WHERE sp.id = p_student_profile_id
  AND sp.deleted_at IS NULL
  AND p.deleted_at IS NULL;
  
  IF v_birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  v_age := EXTRACT(YEAR FROM age(v_birth_date));
  RETURN v_age;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_student_age IS 'Calcula a idade atual de um aluno baseado na data de nascimento.';

-- =====================================================
-- 7. FUNÇÃO: Contar alunos por turma
-- =====================================================
CREATE OR REPLACE FUNCTION count_class_students(p_class_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM class_enrollments
  WHERE class_id = p_class_id
  AND status = 'enrolled'
  AND deleted_at IS NULL;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION count_class_students IS 'Conta o número de alunos matriculados em uma turma.';

-- =====================================================
-- 8. FUNÇÃO: Obter alunos em risco (baixa média ou frequência)
-- =====================================================
CREATE OR REPLACE FUNCTION get_students_at_risk(
  p_class_id INTEGER DEFAULT NULL,
  p_min_average NUMERIC DEFAULT 6.0,
  p_min_attendance NUMERIC DEFAULT 75.0
)
RETURNS TABLE(
  student_profile_id INTEGER,
  person_id INTEGER,
  student_name TEXT,
  registration_number VARCHAR,
  average_grade NUMERIC,
  attendance_percentage NUMERIC,
  risk_reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    sp.id as student_profile_id,
    p.id as person_id,
    (p.first_name || ' ' || p.last_name)::TEXT as student_name,
    sp.registration_number,
    calculate_student_average(sp.id) as average_grade,
    calculate_attendance_percentage(sp.id, NULL, p_class_id) as attendance_percentage,
    ARRAY_AGG(
      DISTINCT CASE
        WHEN calculate_student_average(sp.id) < p_min_average THEN 'Baixa média'
        WHEN calculate_attendance_percentage(sp.id, NULL, p_class_id) < p_min_attendance THEN 'Baixa frequência'
      END
    ) FILTER (WHERE 
      calculate_student_average(sp.id) < p_min_average OR 
      calculate_attendance_percentage(sp.id, NULL, p_class_id) < p_min_attendance
    ) as risk_reasons
  FROM student_profiles sp
  JOIN people p ON sp.person_id = p.id
  LEFT JOIN class_enrollments ce ON sp.id = ce.student_profile_id AND ce.deleted_at IS NULL
  WHERE sp.deleted_at IS NULL
  AND p.deleted_at IS NULL
  AND (p_class_id IS NULL OR ce.class_id = p_class_id)
  AND (
    calculate_student_average(sp.id) < p_min_average OR 
    calculate_attendance_percentage(sp.id, NULL, p_class_id) < p_min_attendance
  )
  GROUP BY sp.id, p.id, p.first_name, p.last_name, sp.registration_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_students_at_risk IS 'Retorna alunos em risco baseado em média baixa ou frequência baixa. Parâmetros opcionais para filtrar por turma e definir limites.';

-- =====================================================
-- 9. FUNÇÃO: Calcular média da turma
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_class_average(
  p_class_id INTEGER,
  p_subject_id INTEGER DEFAULT NULL,
  p_academic_period_id INTEGER DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_average NUMERIC;
BEGIN
  SELECT AVG(g.grade_value)
  INTO v_average
  FROM grades g
  JOIN evaluation_instances ei ON g.evaluation_instance_id = ei.id AND ei.deleted_at IS NULL
  JOIN class_enrollments ce ON g.student_profile_id = ce.student_profile_id AND ce.class_id = ei.class_id
  WHERE ei.class_id = p_class_id
  AND g.deleted_at IS NULL
  AND ce.deleted_at IS NULL
  AND ce.status = 'enrolled'
  AND (p_subject_id IS NULL OR ei.subject_id = p_subject_id)
  AND (p_academic_period_id IS NULL OR ei.academic_period_id = p_academic_period_id);
  
  RETURN COALESCE(ROUND(v_average, 2), 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_class_average IS 'Calcula a média de notas de uma turma. Pode ser filtrada por disciplina e período.';

-- =====================================================
-- 10. FUNÇÃO: Validar CPF
-- =====================================================
CREATE OR REPLACE FUNCTION validate_cpf_format(p_cpf VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remove caracteres não numéricos
  p_cpf := REGEXP_REPLACE(p_cpf, '[^0-9]', '', 'g');
  
  -- Verifica se tem 11 dígitos
  IF LENGTH(p_cpf) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica se todos os dígitos são iguais (CPF inválido)
  IF p_cpf ~ '^(\d)\1{10}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Validação básica (pode ser expandida com algoritmo completo)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_cpf_format IS 'Valida o formato básico de um CPF (11 dígitos, não todos iguais).';

-- =====================================================
-- FIM DA MIGRATION 032
-- Total: 10 funções úteis criadas
-- =====================================================

