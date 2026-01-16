-- =====================================================
-- SCRIPT DE TESTE: PREENCHER NOTAS DO 5º ANO
-- VERSÃO 2.0 - NOTAS EM TODOS OS 4 BIMESTRES
-- =====================================================
-- Este script cria dados de teste para verificar o comportamento
-- do sistema de notas, incluindo recuperação
--
-- Estrutura por período:
-- - Cada bimestre (1º, 2º, 3º, 4º) terá:
--   * 1 Avaliação Regular
--   * 1 Avaliação de Recuperação
-- =====================================================

DO $$ BEGIN RAISE NOTICE 'Iniciando preenchimento de notas do 5º ano (4 bimestres)...'; END $$;

-- =====================================================
-- 1. VERIFICAR ALUNOS DO 5º ANO
-- =====================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM class_enrollments ce
  JOIN classes c ON c.id = ce.class_id
  JOIN education_grades eg ON eg.id = c.education_grade_id
  WHERE eg.grade_name = '5º Ano'
    AND ce.deleted_at IS NULL
    AND ce.status = 'Ativo';

  RAISE NOTICE 'Alunos encontrados no 5º ano: %', v_count;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Nenhum aluno encontrado no 5º ano!';
  END IF;
END $$;

-- =====================================================
-- 2. LIMPAR DADOS DE TESTE ANTERIORES
-- =====================================================

DELETE FROM grades WHERE evaluation_instance_id IN (
  SELECT id FROM evaluation_instances WHERE title LIKE '%TESTE%'
);
DELETE FROM evaluation_instances WHERE title LIKE '%TESTE%';

DO $$ BEGIN RAISE NOTICE 'Dados de teste anteriores removidos.'; END $$;

-- =====================================================
-- 3. CRIAR AVALIAÇÕES PARA CADA BIMESTRE
-- =====================================================

DO $$
DECLARE
  v_cts RECORD;
  v_period RECORD;
  v_grade_id INTEGER;
  v_admin_user_id INTEGER := 1;
  v_period_count INTEGER := 0;
  v_instance_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Usando usuário ID: %', v_admin_user_id;

  -- Obter o ID do 5º ano
  SELECT id INTO v_grade_id
  FROM education_grades
  WHERE grade_name = '5º Ano'
  LIMIT 1;

  RAISE NOTICE 'Education grade do 5º ano: %', v_grade_id;

  -- Loop por cada class_teacher_subject do 5º ano
  FOR v_cts IN
    SELECT DISTINCT
      cts.id as cts_id,
      c.id as class_id,
      c.name as class_name,
      c.academic_year_id,
      s.name as subject_name
    FROM class_teacher_subjects cts
    JOIN classes c ON c.id = cts.class_id
    JOIN education_grades eg ON eg.id = c.education_grade_id
    JOIN subjects s ON s.id = cts.subject_id
    WHERE eg.grade_name = '5º Ano'
      AND cts.deleted_at IS NULL
      AND c.deleted_at IS NULL
  LOOP
    -- Para cada disciplina, criar avaliações em cada período acadêmico
    FOR v_period IN
      SELECT ap.id, ap.name
      FROM academic_periods ap
      WHERE ap.academic_year_id = v_cts.academic_year_id
        AND ap.deleted_at IS NULL
      ORDER BY ap.name
    LOOP
      v_period_count := v_period_count + 1;

      -- Criar Avaliação Regular do período
      INSERT INTO evaluation_instances (
        class_teacher_subject_id, title, description, evaluation_type,
        evaluation_date, max_grade, education_grade_id, academic_period_id,
        assessment_type_id, created_at, created_by
      ) VALUES (
        v_cts.cts_id,
        'Avaliação ' || v_period.name || ' - ' || v_cts.subject_name || ' (TESTE)',
        'Avaliação regular do ' || v_period.name || ' - dados de teste',
        'Prova',
        CURRENT_DATE - INTERVAL '30 days',
        10.0, v_grade_id, v_period.id, 1, NOW(), v_admin_user_id
      ) ON CONFLICT DO NOTHING;

      v_instance_count := v_instance_count + 1;

      -- Criar Avaliação de Recuperação do período
      INSERT INTO evaluation_instances (
        class_teacher_subject_id, title, description, evaluation_type,
        evaluation_date, max_grade, education_grade_id, academic_period_id,
        assessment_type_id, created_at, created_by
      ) VALUES (
        v_cts.cts_id,
        'Recuperação ' || v_period.name || ' - ' || v_cts.subject_name || ' (TESTE)',
        'Recuperação do ' || v_period.name || ' - dados de teste',
        'Recuperacao',
        CURRENT_DATE - INTERVAL '20 days',
        10.0, v_grade_id, v_period.id, 5, NOW(), v_admin_user_id
      ) ON CONFLICT DO NOTHING;

      v_instance_count := v_instance_count + 1;

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Evaluation instances criadas: % (para % combinações disciplina/período)', v_instance_count, v_period_count;
END $$;

-- =====================================================
-- 4. INSERIR NOTAS PARA TODOS OS ALUNOS
-- =====================================================

DO $$
DECLARE
  v_student RECORD;
  v_instance RECORD;
  v_grade_value DECIMAL(5,2);
  v_is_recovery BOOLEAN;
  v_count INTEGER := 0;
  v_created_by INTEGER := 1;
BEGIN
  -- Loop por cada aluno do 5º ano
  FOR v_student IN
    SELECT DISTINCT
      ce.student_enrollment_id,
      p.first_name || ' ' || p.last_name as student_name,
      c.id as class_id
    FROM class_enrollments ce
    JOIN student_enrollments se ON se.id = ce.student_enrollment_id
    JOIN student_profiles sp ON sp.id = se.student_profile_id
    JOIN people p ON p.id = sp.person_id
    JOIN classes c ON c.id = ce.class_id
    JOIN education_grades eg ON eg.id = c.education_grade_id
    WHERE eg.grade_name = '5º Ano'
      AND ce.deleted_at IS NULL
      AND ce.status = 'Ativo'
      AND se.deleted_at IS NULL
  LOOP
    -- Loop por cada instância de avaliação da turma do aluno
    FOR v_instance IN
      SELECT
        ei.id as instance_id,
        ei.title,
        ei.evaluation_type,
        cts.class_id
      FROM evaluation_instances ei
      JOIN class_teacher_subjects cts ON cts.id = ei.class_teacher_subject_id
      WHERE ei.title LIKE '%TESTE%'
        AND ei.deleted_at IS NULL
        AND cts.class_id = v_student.class_id
    LOOP
      -- Verificar se é recuperação
      v_is_recovery := v_instance.evaluation_type = 'Recuperacao';

      -- Gerar nota aleatória baseada no tipo
      IF v_is_recovery THEN
        -- Para recuperação: notas entre 5.0 e 10.0
        v_grade_value := ROUND((RANDOM() * 5.0 + 5.0)::numeric, 1);
      ELSE
        -- Para avaliações normais: distribuição variada
        IF RANDOM() < 0.15 THEN
          -- 15% com notas baixas (3.0 a 5.4)
          v_grade_value := ROUND((RANDOM() * 2.4 + 3.0)::numeric, 1);
        ELSIF RANDOM() < 0.30 THEN
          -- 30% com notas medianas (5.5 a 6.9)
          v_grade_value := ROUND((RANDOM() * 1.4 + 5.5)::numeric, 1);
        ELSE
          -- 55% com notas boas (7.0 a 10.0)
          v_grade_value := ROUND((RANDOM() * 3.0 + 7.0)::numeric, 1);
        END IF;
      END IF;

      -- Limitar a 10.0
      IF v_grade_value > 10.0 THEN
        v_grade_value := 10.0;
      END IF;

      -- Inserir a nota
      INSERT INTO grades (
        evaluation_instance_id,
        student_enrollment_id,
        grade_value,
        created_at,
        created_by
      ) VALUES (
        v_instance.instance_id,
        v_student.student_enrollment_id,
        v_grade_value,
        NOW(),
        v_created_by
      )
      ON CONFLICT DO NOTHING;

      v_count := v_count + 1;

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Total de notas inseridas: %', v_count;
END $$;

-- =====================================================
-- 5. VERIFICAR RESULTADOS
-- =====================================================

-- Contar notas inseridas
SELECT
  'Total de notas inseridas para o 5º ano' as info,
  COUNT(*) as total
FROM grades g
JOIN evaluation_instances ei ON ei.id = g.evaluation_instance_id
WHERE ei.title LIKE '%TESTE%';

-- Contar instâncias de avaliação por período
SELECT
  ap.name as periodo,
  COUNT(DISTINCT ei.id) as avaliacoes_criadas,
  COUNT(DISTINCT g.id) as notas_lancadas
FROM academic_periods ap
LEFT JOIN evaluation_instances ei ON ei.academic_period_id = ap.id AND ei.title LIKE '%TESTE%'
LEFT JOIN grades g ON g.evaluation_instance_id = ei.id
WHERE ap.deleted_at IS NULL
GROUP BY ap.name
ORDER BY ap.name;

-- Ver resumo por aluno (amostra)
SELECT
  p.first_name || ' ' || p.last_name as aluno,
  ap.name as periodo,
  s.name as disciplina,
  CASE WHEN ei.evaluation_type = 'Recuperacao' THEN 'Rec' ELSE 'Regular' END as tipo,
  g.grade_value as nota
FROM grades g
JOIN evaluation_instances ei ON ei.id = g.evaluation_instance_id
JOIN class_teacher_subjects cts ON cts.id = ei.class_teacher_subject_id
JOIN subjects s ON s.id = cts.subject_id
JOIN academic_periods ap ON ap.id = ei.academic_period_id
JOIN student_enrollments se ON se.id = g.student_enrollment_id
JOIN student_profiles sp ON sp.id = se.student_profile_id
JOIN people p ON p.id = sp.person_id
WHERE ei.title LIKE '%TESTE%'
ORDER BY p.first_name, ap.name, s.name, ei.evaluation_type
LIMIT 50;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
DO $$ BEGIN RAISE NOTICE 'Script de preenchimento de notas concluído!'; END $$;
