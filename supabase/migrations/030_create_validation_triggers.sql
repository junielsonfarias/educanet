-- =====================================================
-- MIGRATION 030: TRIGGERS DE VALIDAÇÃO
-- =====================================================
-- Esta migration cria triggers para validar integridade
-- dos dados e regras de negócio no banco de dados.
-- =====================================================

-- =====================================================
-- 1. TRIGGER: Validar CPF único em `people`
-- =====================================================
CREATE OR REPLACE FUNCTION validate_unique_cpf()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cpf IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM people 
      WHERE cpf = NEW.cpf 
      AND id != NEW.id 
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'CPF já cadastrado: %', NEW.cpf;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_unique_cpf
  BEFORE INSERT OR UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION validate_unique_cpf();

COMMENT ON FUNCTION validate_unique_cpf() IS 'Valida que o CPF seja único entre pessoas ativas (não deletadas)';
COMMENT ON TRIGGER check_unique_cpf ON people IS 'Garante que não haja CPFs duplicados na tabela people';

-- =====================================================
-- 2. TRIGGER: Validar CNPJ único em `schools`
-- =====================================================
CREATE OR REPLACE FUNCTION validate_unique_cnpj()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cnpj IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM schools 
      WHERE cnpj = NEW.cnpj 
      AND id != NEW.id 
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'CNPJ já cadastrado: %', NEW.cnpj;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_unique_cnpj
  BEFORE INSERT OR UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION validate_unique_cnpj();

COMMENT ON FUNCTION validate_unique_cnpj() IS 'Valida que o CNPJ seja único entre escolas ativas (não deletadas)';
COMMENT ON TRIGGER check_unique_cnpj ON schools IS 'Garante que não haja CNPJs duplicados na tabela schools';

-- =====================================================
-- 3. TRIGGER: Validar capacidade de turma antes de matricular
-- =====================================================
CREATE OR REPLACE FUNCTION validate_class_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_capacity INTEGER;
BEGIN
  -- Buscar capacidade máxima da turma
  SELECT max_students INTO max_capacity
  FROM classes
  WHERE id = NEW.class_id
  AND deleted_at IS NULL;

  -- Se não houver limite definido, permitir matrícula
  IF max_capacity IS NULL THEN
    RETURN NEW;
  END IF;

  -- Contar alunos atualmente matriculados na turma
  SELECT COUNT(*) INTO current_count
  FROM class_enrollments
  WHERE class_id = NEW.class_id
  AND status = 'enrolled'
  AND deleted_at IS NULL;

  -- Se já atingiu a capacidade, impedir nova matrícula
  IF current_count >= max_capacity THEN
    RAISE EXCEPTION 'Turma atingiu capacidade máxima de % alunos', max_capacity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_class_capacity
  BEFORE INSERT ON class_enrollments
  FOR EACH ROW
  WHEN (NEW.status = 'enrolled')
  EXECUTE FUNCTION validate_class_capacity();

COMMENT ON FUNCTION validate_class_capacity() IS 'Valida que a turma não exceda sua capacidade máxima de alunos';
COMMENT ON TRIGGER check_class_capacity ON class_enrollments IS 'Impede matrículas quando a turma atingir capacidade máxima';

-- =====================================================
-- 4. TRIGGER: Validar período acadêmico dentro do ano letivo
-- =====================================================
CREATE OR REPLACE FUNCTION validate_period_in_year()
RETURNS TRIGGER AS $$
DECLARE
  year_start_date DATE;
  year_end_date DATE;
BEGIN
  -- Buscar datas do ano letivo
  SELECT start_date, end_date
  INTO year_start_date, year_end_date
  FROM academic_years
  WHERE id = NEW.academic_year_id
  AND deleted_at IS NULL;

  -- Se não encontrar o ano letivo, lançar erro
  IF year_start_date IS NULL OR year_end_date IS NULL THEN
    RAISE EXCEPTION 'Ano letivo não encontrado ou inválido';
  END IF;

  -- Validar que as datas do período estão dentro do ano letivo
  IF NEW.start_date < year_start_date OR NEW.end_date > year_end_date THEN
    RAISE EXCEPTION 'Período acadêmico deve estar dentro do ano letivo (de % a %)', year_start_date, year_end_date;
  END IF;

  -- Validar que start_date <= end_date
  IF NEW.start_date > NEW.end_date THEN
    RAISE EXCEPTION 'Data de início do período não pode ser posterior à data de término';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_period_in_year
  BEFORE INSERT OR UPDATE ON academic_periods
  FOR EACH ROW
  EXECUTE FUNCTION validate_period_in_year();

COMMENT ON FUNCTION validate_period_in_year() IS 'Valida que o período acadêmico esteja dentro das datas do ano letivo';
COMMENT ON TRIGGER check_period_in_year ON academic_periods IS 'Garante que períodos acadêmicos respeitem os limites do ano letivo';

-- =====================================================
-- 5. TRIGGER: Validar que aluno não seja matriculado duas vezes na mesma turma
-- =====================================================
CREATE OR REPLACE FUNCTION validate_unique_class_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM class_enrollments
    WHERE student_enrollment_id = NEW.student_enrollment_id
    AND class_id = NEW.class_id
    AND id != COALESCE(NEW.id, 0)
    AND status = 'enrolled'
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Aluno já está matriculado nesta turma';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_unique_class_enrollment
  BEFORE INSERT OR UPDATE ON class_enrollments
  FOR EACH ROW
  WHEN (NEW.status = 'enrolled')
  EXECUTE FUNCTION validate_unique_class_enrollment();

COMMENT ON FUNCTION validate_unique_class_enrollment() IS 'Valida que um aluno não seja matriculado duas vezes na mesma turma';
COMMENT ON TRIGGER check_unique_class_enrollment ON class_enrollments IS 'Impede matrículas duplicadas do mesmo aluno na mesma turma';

-- =====================================================
-- 6. TRIGGER: Validar que nota esteja dentro do range permitido (0-10)
-- =====================================================
CREATE OR REPLACE FUNCTION validate_grade_range()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.grade_value IS NOT NULL THEN
    IF NEW.grade_value < 0 OR NEW.grade_value > 10 THEN
      RAISE EXCEPTION 'Nota deve estar entre 0 e 10. Valor recebido: %', NEW.grade_value;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_grade_range
  BEFORE INSERT OR UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION validate_grade_range();

COMMENT ON FUNCTION validate_grade_range() IS 'Valida que as notas estejam no range de 0 a 10';
COMMENT ON TRIGGER check_grade_range ON grades IS 'Garante que todas as notas estejam dentro do range válido';

-- =====================================================
-- 7. TRIGGER: Validar que data de nascimento seja no passado
-- =====================================================
CREATE OR REPLACE FUNCTION validate_birth_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    IF NEW.date_of_birth > CURRENT_DATE THEN
      RAISE EXCEPTION 'Data de nascimento não pode ser no futuro';
    END IF;
    -- Validar que a pessoa não tenha mais de 150 anos (validação de sanidade)
    IF NEW.date_of_birth < CURRENT_DATE - INTERVAL '150 years' THEN
      RAISE EXCEPTION 'Data de nascimento inválida (muito antiga)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_birth_date
  BEFORE INSERT OR UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION validate_birth_date();

COMMENT ON FUNCTION validate_birth_date() IS 'Valida que a data de nascimento seja no passado e razoável';
COMMENT ON TRIGGER check_birth_date ON people IS 'Garante que datas de nascimento sejam válidas';

-- =====================================================
-- 8. TRIGGER: Validar que ano letivo tenha datas válidas
-- =====================================================
CREATE OR REPLACE FUNCTION validate_academic_year_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    IF NEW.start_date >= NEW.end_date THEN
      RAISE EXCEPTION 'Data de início do ano letivo deve ser anterior à data de término';
    END IF;
    
    -- Validar que o ano letivo não tenha mais de 2 anos de duração (validação de sanidade)
    IF NEW.end_date > NEW.start_date + INTERVAL '2 years' THEN
      RAISE EXCEPTION 'Ano letivo não pode ter mais de 2 anos de duração';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_academic_year_dates
  BEFORE INSERT OR UPDATE ON academic_years
  FOR EACH ROW
  EXECUTE FUNCTION validate_academic_year_dates();

COMMENT ON FUNCTION validate_academic_year_dates() IS 'Valida que as datas do ano letivo sejam coerentes';
COMMENT ON TRIGGER check_academic_year_dates ON academic_years IS 'Garante que anos letivos tenham datas válidas';

-- =====================================================
-- FIM DA MIGRATION 030
-- Total: 8 triggers de validação criados
-- =====================================================

