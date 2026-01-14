-- =====================================================
-- MIGRATION 043: SEED DE ESCOLA DE TESTE COMPLETA
-- Ano Letivo 2025 - E.M.E.F. Magalhães Barata
-- =====================================================
-- Este script cria dados completos para teste incluindo:
-- - Escola com infraestrutura
-- - Ano letivo 2025 com 4 bimestres
-- - Cursos (1º ao 9º ano do Ensino Fundamental)
-- - Disciplinas
-- - Professores
-- - Turmas
-- - Alunos matriculados
-- - Notas e frequência
-- =====================================================

-- ===========================================
-- 1. ESCOLA
-- ===========================================
INSERT INTO schools (name, address, phone, email, cnpj, inep_code, student_capacity, created_by)
VALUES (
  'E.M.E.F. Magalhães Barata',
  'Rua 18 de Novembro, 129, Centro, São Sebastião da Boa Vista - PA, CEP 68820-000',
  '(91) 3456-7890',
  'emef.magalhaesbarata@educacao.ssbv.pa.gov.br',
  '12.345.678/0001-90',
  '15027732',
  500,
  1
)
ON CONFLICT (name) DO UPDATE SET
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  inep_code = EXCLUDED.inep_code,
  student_capacity = EXCLUDED.student_capacity;

-- ===========================================
-- 2. ANO LETIVO 2025
-- ===========================================
INSERT INTO academic_years (year, start_date, end_date, created_by)
VALUES (2025, '2025-02-03', '2025-12-19', 1)
ON CONFLICT (year) DO UPDATE SET
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date;

-- ===========================================
-- 3. PERÍODOS ACADÊMICOS (4 BIMESTRES)
-- ===========================================
DO $$
DECLARE
  v_academic_year_id INTEGER;
BEGIN
  SELECT id INTO v_academic_year_id FROM academic_years WHERE year = 2025;

  -- 1º Bimestre
  INSERT INTO academic_periods (name, academic_year_id, type, start_date, end_date, created_by)
  VALUES ('1º Bimestre', v_academic_year_id, 'Bimestre', '2025-02-03', '2025-04-11', 1)
  ON CONFLICT DO NOTHING;

  -- 2º Bimestre
  INSERT INTO academic_periods (name, academic_year_id, type, start_date, end_date, created_by)
  VALUES ('2º Bimestre', v_academic_year_id, 'Bimestre', '2025-04-14', '2025-06-27', 1)
  ON CONFLICT DO NOTHING;

  -- 3º Bimestre
  INSERT INTO academic_periods (name, academic_year_id, type, start_date, end_date, created_by)
  VALUES ('3º Bimestre', v_academic_year_id, 'Bimestre', '2025-07-28', '2025-10-03', 1)
  ON CONFLICT DO NOTHING;

  -- 4º Bimestre
  INSERT INTO academic_periods (name, academic_year_id, type, start_date, end_date, created_by)
  VALUES ('4º Bimestre', v_academic_year_id, 'Bimestre', '2025-10-06', '2025-12-19', 1)
  ON CONFLICT DO NOTHING;
END $$;

-- ===========================================
-- 4. CURSOS (SÉRIES DO ENSINO FUNDAMENTAL)
-- ===========================================
INSERT INTO courses (name, education_level, description, duration_months, created_by) VALUES
  ('1º Ano - Ensino Fundamental', 'Ensino Fundamental I', 'Primeiro ano do Ensino Fundamental - Anos Iniciais', 10, 1),
  ('2º Ano - Ensino Fundamental', 'Ensino Fundamental I', 'Segundo ano do Ensino Fundamental - Anos Iniciais', 10, 1),
  ('3º Ano - Ensino Fundamental', 'Ensino Fundamental I', 'Terceiro ano do Ensino Fundamental - Anos Iniciais', 10, 1),
  ('4º Ano - Ensino Fundamental', 'Ensino Fundamental I', 'Quarto ano do Ensino Fundamental - Anos Iniciais', 10, 1),
  ('5º Ano - Ensino Fundamental', 'Ensino Fundamental I', 'Quinto ano do Ensino Fundamental - Anos Iniciais', 10, 1),
  ('6º Ano - Ensino Fundamental', 'Ensino Fundamental II', 'Sexto ano do Ensino Fundamental - Anos Finais', 10, 1),
  ('7º Ano - Ensino Fundamental', 'Ensino Fundamental II', 'Sétimo ano do Ensino Fundamental - Anos Finais', 10, 1),
  ('8º Ano - Ensino Fundamental', 'Ensino Fundamental II', 'Oitavo ano do Ensino Fundamental - Anos Finais', 10, 1),
  ('9º Ano - Ensino Fundamental', 'Ensino Fundamental II', 'Nono ano do Ensino Fundamental - Anos Finais', 10, 1)
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 5. DISCIPLINAS
-- ===========================================
INSERT INTO subjects (code, name, description, created_by) VALUES
  ('PORT', 'Língua Portuguesa', 'Língua Portuguesa e Literatura', 1),
  ('MAT', 'Matemática', 'Matemática', 1),
  ('CIEN', 'Ciências', 'Ciências Naturais', 1),
  ('HIST', 'História', 'História', 1),
  ('GEO', 'Geografia', 'Geografia', 1),
  ('ARTE', 'Arte', 'Artes Visuais, Música, Dança e Teatro', 1),
  ('EDFIS', 'Educação Física', 'Educação Física', 1),
  ('ING', 'Língua Inglesa', 'Língua Estrangeira - Inglês', 1),
  ('ENS_REL', 'Ensino Religioso', 'Ensino Religioso', 1)
ON CONFLICT (code) DO NOTHING;

-- ===========================================
-- 6. VINCULAR DISCIPLINAS AOS CURSOS
-- ===========================================
DO $$
DECLARE
  v_course RECORD;
  v_subject RECORD;
BEGIN
  -- Para cada curso
  FOR v_course IN SELECT id, name FROM courses WHERE name LIKE '%Ensino Fundamental%' LOOP
    -- Adicionar todas as disciplinas básicas
    FOR v_subject IN SELECT id FROM subjects WHERE code IN ('PORT', 'MAT', 'CIEN', 'HIST', 'GEO', 'ARTE', 'EDFIS', 'ENS_REL') LOOP
      INSERT INTO course_subjects (course_id, subject_id, created_by)
      VALUES (v_course.id, v_subject.id, 1)
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Adicionar Inglês apenas para 6º ao 9º ano
    IF v_course.name LIKE '%6º%' OR v_course.name LIKE '%7º%' OR v_course.name LIKE '%8º%' OR v_course.name LIKE '%9º%' THEN
      FOR v_subject IN SELECT id FROM subjects WHERE code = 'ING' LOOP
        INSERT INTO course_subjects (course_id, subject_id, created_by)
        VALUES (v_course.id, v_subject.id, 1)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- ===========================================
-- 7. PROFESSORES (PESSOAS + PERFIL DE PROFESSOR)
-- ===========================================
-- Criar pessoas do tipo professor
INSERT INTO people (first_name, last_name, date_of_birth, cpf, rg, email, phone, address, type, created_by) VALUES
  ('Maria', 'Silva Santos', '1985-03-15', '111.222.333-44', 'MG-12.345.678', 'maria.santos@educacao.ssbv.pa.gov.br', '(91) 98765-4321', 'Rua das Flores, 100, Centro', 'Professor', 1),
  ('José', 'Oliveira Costa', '1978-07-22', '222.333.444-55', 'PA-23.456.789', 'jose.costa@educacao.ssbv.pa.gov.br', '(91) 98765-4322', 'Av. Principal, 200, Centro', 'Professor', 1),
  ('Ana', 'Rodrigues Lima', '1990-01-10', '333.444.555-66', 'PA-34.567.890', 'ana.lima@educacao.ssbv.pa.gov.br', '(91) 98765-4323', 'Rua da Paz, 50, Bairro Novo', 'Professor', 1),
  ('Carlos', 'Ferreira Souza', '1982-11-28', '444.555.666-77', 'PA-45.678.901', 'carlos.souza@educacao.ssbv.pa.gov.br', '(91) 98765-4324', 'Rua do Comércio, 75', 'Professor', 1),
  ('Lucia', 'Pereira Gomes', '1988-05-20', '555.666.777-88', 'PA-56.789.012', 'lucia.gomes@educacao.ssbv.pa.gov.br', '(91) 98765-4325', 'Av. Beira Rio, 300', 'Professor', 1),
  ('Roberto', 'Almeida Nunes', '1975-09-05', '666.777.888-99', 'PA-67.890.123', 'roberto.nunes@educacao.ssbv.pa.gov.br', '(91) 98765-4326', 'Rua São José, 150', 'Professor', 1),
  ('Fernanda', 'Martins Dias', '1992-12-18', '777.888.999-00', 'PA-78.901.234', 'fernanda.dias@educacao.ssbv.pa.gov.br', '(91) 98765-4327', 'Rua Nova, 80', 'Professor', 1),
  ('Paulo', 'Santos Ribeiro', '1980-04-30', '888.999.000-11', 'PA-89.012.345', 'paulo.ribeiro@educacao.ssbv.pa.gov.br', '(91) 98765-4328', 'Av. Central, 400', 'Professor', 1)
ON CONFLICT (cpf) DO NOTHING;

-- Criar perfis de professor
DO $$
DECLARE
  v_person RECORD;
  v_counter INTEGER := 1;
BEGIN
  FOR v_person IN SELECT id FROM people WHERE type = 'Professor' AND cpf IN (
    '111.222.333-44', '222.333.444-55', '333.444.555-66', '444.555.666-77',
    '555.666.777-88', '666.777.888-99', '777.888.999-00', '888.999.000-11'
  ) LOOP
    INSERT INTO teachers (person_id, functional_registration, created_by)
    VALUES (v_person.id, 'MAG2025' || LPAD(v_counter::TEXT, 4, '0'), 1)
    ON CONFLICT DO NOTHING;
    v_counter := v_counter + 1;
  END LOOP;
END $$;

-- ===========================================
-- 8. ALUNOS (30 ALUNOS DE EXEMPLO)
-- ===========================================
INSERT INTO people (first_name, last_name, date_of_birth, cpf, email, phone, address, type, created_by) VALUES
  -- Alunos 5º Ano
  ('Pedro', 'Alves Moreira', '2014-02-15', '001.001.001-01', NULL, '(91) 99111-0001', 'Rua A, 1', 'Aluno', 1),
  ('Mariana', 'Costa Ferreira', '2014-05-22', '001.001.001-02', NULL, '(91) 99111-0002', 'Rua B, 2', 'Aluno', 1),
  ('Lucas', 'Santos Lima', '2014-08-10', '001.001.001-03', NULL, '(91) 99111-0003', 'Rua C, 3', 'Aluno', 1),
  ('Isabela', 'Oliveira Cruz', '2014-03-28', '001.001.001-04', NULL, '(91) 99111-0004', 'Rua D, 4', 'Aluno', 1),
  ('Gabriel', 'Rodrigues Neto', '2014-11-05', '001.001.001-05', NULL, '(91) 99111-0005', 'Rua E, 5', 'Aluno', 1),
  ('Sofia', 'Pereira Dias', '2014-07-18', '001.001.001-06', NULL, '(91) 99111-0006', 'Rua F, 6', 'Aluno', 1),
  ('Matheus', 'Almeida Souza', '2014-01-30', '001.001.001-07', NULL, '(91) 99111-0007', 'Rua G, 7', 'Aluno', 1),
  ('Julia', 'Martins Gomes', '2014-09-12', '001.001.001-08', NULL, '(91) 99111-0008', 'Rua H, 8', 'Aluno', 1),
  ('Enzo', 'Ferreira Costa', '2014-04-25', '001.001.001-09', NULL, '(91) 99111-0009', 'Rua I, 9', 'Aluno', 1),
  ('Valentina', 'Lima Santos', '2014-06-08', '001.001.001-10', NULL, '(91) 99111-0010', 'Rua J, 10', 'Aluno', 1),
  -- Alunos 6º Ano
  ('Arthur', 'Nunes Ribeiro', '2013-03-20', '001.001.001-11', NULL, '(91) 99111-0011', 'Rua K, 11', 'Aluno', 1),
  ('Helena', 'Dias Oliveira', '2013-07-15', '001.001.001-12', NULL, '(91) 99111-0012', 'Rua L, 12', 'Aluno', 1),
  ('Davi', 'Gomes Alves', '2013-10-02', '001.001.001-13', NULL, '(91) 99111-0013', 'Rua M, 13', 'Aluno', 1),
  ('Laura', 'Souza Pereira', '2013-01-28', '001.001.001-14', NULL, '(91) 99111-0014', 'Rua N, 14', 'Aluno', 1),
  ('Miguel', 'Cruz Santos', '2013-05-10', '001.001.001-15', NULL, '(91) 99111-0015', 'Rua O, 15', 'Aluno', 1),
  ('Alice', 'Moreira Lima', '2013-08-22', '001.001.001-16', NULL, '(91) 99111-0016', 'Rua P, 16', 'Aluno', 1),
  ('Bernardo', 'Ferreira Nunes', '2013-12-05', '001.001.001-17', NULL, '(91) 99111-0017', 'Rua Q, 17', 'Aluno', 1),
  ('Cecilia', 'Ribeiro Costa', '2013-04-18', '001.001.001-18', NULL, '(91) 99111-0018', 'Rua R, 18', 'Aluno', 1),
  ('Heitor', 'Oliveira Dias', '2013-09-30', '001.001.001-19', NULL, '(91) 99111-0019', 'Rua S, 19', 'Aluno', 1),
  ('Manuela', 'Santos Gomes', '2013-02-14', '001.001.001-20', NULL, '(91) 99111-0020', 'Rua T, 20', 'Aluno', 1),
  -- Alunos 9º Ano
  ('Rafael', 'Lima Almeida', '2010-06-25', '001.001.001-21', NULL, '(91) 99111-0021', 'Rua U, 21', 'Aluno', 1),
  ('Beatriz', 'Alves Martins', '2010-11-08', '001.001.001-22', NULL, '(91) 99111-0022', 'Rua V, 22', 'Aluno', 1),
  ('Nicolas', 'Pereira Cruz', '2010-03-15', '001.001.001-23', NULL, '(91) 99111-0023', 'Rua W, 23', 'Aluno', 1),
  ('Larissa', 'Costa Nunes', '2010-07-20', '001.001.001-24', NULL, '(91) 99111-0024', 'Rua X, 24', 'Aluno', 1),
  ('Samuel', 'Dias Ferreira', '2010-10-12', '001.001.001-25', NULL, '(91) 99111-0025', 'Rua Y, 25', 'Aluno', 1),
  ('Giovanna', 'Gomes Souza', '2010-01-05', '001.001.001-26', NULL, '(91) 99111-0026', 'Rua Z, 26', 'Aluno', 1),
  ('Theo', 'Ribeiro Santos', '2010-04-28', '001.001.001-27', NULL, '(91) 99111-0027', 'Av. 1, 27', 'Aluno', 1),
  ('Isadora', 'Oliveira Lima', '2010-08-18', '001.001.001-28', NULL, '(91) 99111-0028', 'Av. 2, 28', 'Aluno', 1),
  ('Lorenzo', 'Martins Alves', '2010-12-30', '001.001.001-29', NULL, '(91) 99111-0029', 'Av. 3, 29', 'Aluno', 1),
  ('Maria Clara', 'Nunes Costa', '2010-05-22', '001.001.001-30', NULL, '(91) 99111-0030', 'Av. 4, 30', 'Aluno', 1)
ON CONFLICT (cpf) DO NOTHING;

-- Criar perfis de estudante
DO $$
DECLARE
  v_person RECORD;
  v_counter INTEGER := 1;
BEGIN
  FOR v_person IN SELECT id FROM people WHERE type = 'Aluno' AND cpf LIKE '001.001.001-%' ORDER BY id LOOP
    INSERT INTO student_profiles (person_id, student_registration_number, created_by)
    VALUES (v_person.id, '2025' || LPAD(v_counter::TEXT, 6, '0'), 1)
    ON CONFLICT DO NOTHING;
    v_counter := v_counter + 1;
  END LOOP;
END $$;

-- ===========================================
-- 9. TURMAS (3 TURMAS: 5º, 6º E 9º ANO)
-- ===========================================
DO $$
DECLARE
  v_school_id INTEGER;
  v_academic_period_id INTEGER;
  v_course_5_id INTEGER;
  v_course_6_id INTEGER;
  v_course_9_id INTEGER;
  v_teacher_id INTEGER;
BEGIN
  -- Obter IDs necessários
  SELECT id INTO v_school_id FROM schools WHERE inep_code = '15027732';
  SELECT id INTO v_academic_period_id FROM academic_periods WHERE name = '1º Bimestre' AND academic_year_id = (SELECT id FROM academic_years WHERE year = 2025);
  SELECT id INTO v_course_5_id FROM courses WHERE name = '5º Ano - Ensino Fundamental';
  SELECT id INTO v_course_6_id FROM courses WHERE name = '6º Ano - Ensino Fundamental';
  SELECT id INTO v_course_9_id FROM courses WHERE name = '9º Ano - Ensino Fundamental';
  SELECT id INTO v_teacher_id FROM teachers LIMIT 1;

  -- Turma 5º Ano A
  INSERT INTO classes (name, school_id, course_id, academic_period_id, homeroom_teacher_id, created_by)
  VALUES ('5º Ano A', v_school_id, v_course_5_id, v_academic_period_id, v_teacher_id, 1)
  ON CONFLICT DO NOTHING;

  -- Turma 6º Ano A
  INSERT INTO classes (name, school_id, course_id, academic_period_id, homeroom_teacher_id, created_by)
  VALUES ('6º Ano A', v_school_id, v_course_6_id, v_academic_period_id, v_teacher_id, 1)
  ON CONFLICT DO NOTHING;

  -- Turma 9º Ano A
  INSERT INTO classes (name, school_id, course_id, academic_period_id, homeroom_teacher_id, created_by)
  VALUES ('9º Ano A', v_school_id, v_course_9_id, v_academic_period_id, v_teacher_id, 1)
  ON CONFLICT DO NOTHING;
END $$;

-- ===========================================
-- 10. VINCULAR PROFESSORES ÀS TURMAS/DISCIPLINAS
-- ===========================================
DO $$
DECLARE
  v_class RECORD;
  v_subject RECORD;
  v_teacher_id INTEGER;
  v_teacher_counter INTEGER := 1;
  v_teachers INTEGER[];
BEGIN
  -- Coletar IDs dos professores
  SELECT ARRAY_AGG(id ORDER BY id) INTO v_teachers FROM teachers;

  -- Para cada turma criada
  FOR v_class IN SELECT c.id, c.course_id FROM classes c
    JOIN schools s ON c.school_id = s.id
    WHERE s.inep_code = '15027732' AND c.name IN ('5º Ano A', '6º Ano A', '9º Ano A')
  LOOP
    -- Para cada disciplina do curso
    FOR v_subject IN
      SELECT s.id FROM subjects s
      JOIN course_subjects cs ON s.id = cs.subject_id
      WHERE cs.course_id = v_class.course_id
    LOOP
      -- Atribuir professor (rotacionando)
      v_teacher_id := v_teachers[((v_teacher_counter - 1) % array_length(v_teachers, 1)) + 1];

      INSERT INTO class_teacher_subjects (class_id, teacher_id, subject_id, created_by)
      VALUES (v_class.id, v_teacher_id, v_subject.id, 1)
      ON CONFLICT DO NOTHING;

      v_teacher_counter := v_teacher_counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- ===========================================
-- 11. MATRÍCULAS DOS ALUNOS
-- ===========================================
DO $$
DECLARE
  v_school_id INTEGER;
  v_academic_year_id INTEGER;
  v_student RECORD;
  v_counter INTEGER := 1;
BEGIN
  SELECT id INTO v_school_id FROM schools WHERE inep_code = '15027732';
  SELECT id INTO v_academic_year_id FROM academic_years WHERE year = 2025;

  FOR v_student IN SELECT id FROM student_profiles ORDER BY id LIMIT 30 LOOP
    INSERT INTO student_enrollments (
      student_profile_id, school_id, academic_year_id,
      enrollment_number, enrollment_status, enrollment_date, created_by
    )
    VALUES (
      v_student.id, v_school_id, v_academic_year_id,
      'MAT2025' || LPAD(v_counter::TEXT, 6, '0'), 'Ativo', '2025-01-15', 1
    )
    ON CONFLICT DO NOTHING;
    v_counter := v_counter + 1;
  END LOOP;
END $$;

-- ===========================================
-- 12. VINCULAR ALUNOS ÀS TURMAS
-- ===========================================
DO $$
DECLARE
  v_class_5_id INTEGER;
  v_class_6_id INTEGER;
  v_class_9_id INTEGER;
  v_enrollment RECORD;
  v_counter INTEGER := 1;
BEGIN
  -- Obter IDs das turmas
  SELECT c.id INTO v_class_5_id FROM classes c JOIN schools s ON c.school_id = s.id WHERE s.inep_code = '15027732' AND c.name = '5º Ano A';
  SELECT c.id INTO v_class_6_id FROM classes c JOIN schools s ON c.school_id = s.id WHERE s.inep_code = '15027732' AND c.name = '6º Ano A';
  SELECT c.id INTO v_class_9_id FROM classes c JOIN schools s ON c.school_id = s.id WHERE s.inep_code = '15027732' AND c.name = '9º Ano A';

  -- Vincular alunos às turmas (10 em cada)
  FOR v_enrollment IN
    SELECT se.id
    FROM student_enrollments se
    JOIN student_profiles sp ON se.student_profile_id = sp.id
    JOIN people p ON sp.person_id = p.id
    WHERE p.cpf LIKE '001.001.001-%'
    ORDER BY se.id
    LIMIT 30
  LOOP
    IF v_counter <= 10 THEN
      -- Primeiros 10 para 5º Ano
      INSERT INTO class_enrollments (student_enrollment_id, class_id, status, enrollment_date, created_by)
      VALUES (v_enrollment.id, v_class_5_id, 'Ativo', '2025-02-03', 1)
      ON CONFLICT DO NOTHING;
    ELSIF v_counter <= 20 THEN
      -- Próximos 10 para 6º Ano
      INSERT INTO class_enrollments (student_enrollment_id, class_id, status, enrollment_date, created_by)
      VALUES (v_enrollment.id, v_class_6_id, 'Ativo', '2025-02-03', 1)
      ON CONFLICT DO NOTHING;
    ELSE
      -- Últimos 10 para 9º Ano
      INSERT INTO class_enrollments (student_enrollment_id, class_id, status, enrollment_date, created_by)
      VALUES (v_enrollment.id, v_class_9_id, 'Ativo', '2025-02-03', 1)
      ON CONFLICT DO NOTHING;
    END IF;
    v_counter := v_counter + 1;
  END LOOP;
END $$;

-- ===========================================
-- 13. CRIAR AULAS (LESSONS)
-- ===========================================
DO $$
DECLARE
  v_cts RECORD;
  v_lesson_date DATE := '2025-02-03';
  v_day_counter INTEGER := 0;
BEGIN
  -- Para cada combinação turma/professor/disciplina
  FOR v_cts IN
    SELECT cts.id
    FROM class_teacher_subjects cts
    JOIN classes c ON cts.class_id = c.id
    JOIN schools s ON c.school_id = s.id
    WHERE s.inep_code = '15027732'
  LOOP
    -- Criar 5 aulas por disciplina (uma por semana no 1º bimestre)
    FOR v_day_counter IN 0..4 LOOP
      v_lesson_date := '2025-02-03'::DATE + (v_day_counter * 7);

      INSERT INTO lessons (
        class_teacher_subject_id, lesson_date, start_time, end_time, content, created_by
      )
      VALUES (
        v_cts.id,
        v_lesson_date,
        '08:00:00',
        '09:40:00',
        'Aula ' || (v_day_counter + 1) || ' - Conteúdo programático do bimestre',
        1
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ===========================================
-- 14. CRIAR AVALIAÇÕES
-- ===========================================
DO $$
DECLARE
  v_cts RECORD;
BEGIN
  -- Criar uma avaliação por disciplina/turma
  FOR v_cts IN
    SELECT cts.id, s.name as subject_name
    FROM class_teacher_subjects cts
    JOIN classes c ON cts.class_id = c.id
    JOIN schools sch ON c.school_id = sch.id
    JOIN subjects s ON cts.subject_id = s.id
    WHERE sch.inep_code = '15027732'
  LOOP
    -- Prova 1º Bimestre
    INSERT INTO evaluation_instances (
      class_teacher_subject_id, title, description, evaluation_type,
      evaluation_date, max_grade, created_by
    )
    VALUES (
      v_cts.id,
      'Prova 1º Bim - ' || v_cts.subject_name,
      'Avaliação do 1º Bimestre',
      'Prova',
      '2025-04-07',
      10.0,
      1
    )
    ON CONFLICT DO NOTHING;

    -- Trabalho
    INSERT INTO evaluation_instances (
      class_teacher_subject_id, title, description, evaluation_type,
      evaluation_date, max_grade, created_by
    )
    VALUES (
      v_cts.id,
      'Trabalho - ' || v_cts.subject_name,
      'Trabalho em grupo do 1º Bimestre',
      'Trabalho',
      '2025-03-28',
      10.0,
      1
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ===========================================
-- 15. REGISTRAR NOTAS
-- ===========================================
DO $$
DECLARE
  v_enrollment RECORD;
  v_evaluation RECORD;
  v_grade_value NUMERIC;
BEGIN
  -- Para cada aluno matriculado em turma
  FOR v_enrollment IN
    SELECT ce.id as class_enrollment_id, ce.student_enrollment_id, ce.class_id
    FROM class_enrollments ce
    JOIN student_enrollments se ON ce.student_enrollment_id = se.id
    JOIN schools s ON se.school_id = s.id
    WHERE s.inep_code = '15027732'
  LOOP
    -- Para cada avaliação da turma do aluno
    FOR v_evaluation IN
      SELECT ei.id, ei.max_grade
      FROM evaluation_instances ei
      JOIN class_teacher_subjects cts ON ei.class_teacher_subject_id = cts.id
      WHERE cts.class_id = v_enrollment.class_id
    LOOP
      -- Gerar nota aleatória entre 5.0 e 10.0 (simulando bom desempenho)
      v_grade_value := 5.0 + (random() * 5.0);
      v_grade_value := ROUND(v_grade_value::NUMERIC, 1);

      INSERT INTO grades (
        student_enrollment_id, evaluation_instance_id, grade_value,
        component_name, release_date, created_by
      )
      VALUES (
        v_enrollment.student_enrollment_id,
        v_evaluation.id,
        v_grade_value,
        'Nota Principal',
        '2025-04-10',
        1
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ===========================================
-- 16. REGISTRAR FREQUÊNCIA
-- ===========================================
DO $$
DECLARE
  v_enrollment RECORD;
  v_lesson RECORD;
  v_status attendance_status;
  v_random_val NUMERIC;
BEGIN
  -- Para cada aluno
  FOR v_enrollment IN
    SELECT ce.id, ce.student_enrollment_id, ce.class_id
    FROM class_enrollments ce
    JOIN student_enrollments se ON ce.student_enrollment_id = se.id
    JOIN schools s ON se.school_id = s.id
    WHERE s.inep_code = '15027732'
  LOOP
    -- Para cada aula da turma
    FOR v_lesson IN
      SELECT l.id
      FROM lessons l
      JOIN class_teacher_subjects cts ON l.class_teacher_subject_id = cts.id
      WHERE cts.class_id = v_enrollment.class_id
    LOOP
      -- 90% presente, 5% justificado, 5% ausente
      v_random_val := random();
      IF v_random_val < 0.90 THEN
        v_status := 'Presente';
      ELSIF v_random_val < 0.95 THEN
        v_status := 'Falta Justificada';
      ELSE
        v_status := 'Falta Injustificada';
      END IF;

      INSERT INTO attendances (
        student_enrollment_id, lesson_id, status, created_by
      )
      VALUES (
        v_enrollment.student_enrollment_id,
        v_lesson.id,
        v_status,
        1
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ===========================================
-- RESUMO DOS DADOS CRIADOS
-- ===========================================
-- 1 Escola: E.M.E.F. Magalhães Barata
-- 1 Ano Letivo: 2025
-- 4 Períodos: Bimestres
-- 9 Cursos: 1º ao 9º ano
-- 9 Disciplinas
-- 8 Professores
-- 3 Turmas: 5º, 6º e 9º ano
-- 30 Alunos (10 por turma)
-- Aulas, Avaliações, Notas e Frequência
-- =====================================================
