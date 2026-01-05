-- =====================================================
-- MIGRATION 031: VIEWS ÚTEIS
-- =====================================================
-- Esta migration cria views que facilitam consultas
-- frequentes e complexas no banco de dados.
-- =====================================================

-- =====================================================
-- 1. VIEW: Informações completas do aluno
-- =====================================================
CREATE OR REPLACE VIEW v_student_full_info AS
SELECT 
  p.id as person_id,
  p.first_name,
  p.last_name,
  p.cpf,
  p.email,
  p.phone,
  p.date_of_birth,
  p.address,
  sp.id as student_profile_id,
  sp.registration_number,
  sp.status as student_status,
  se.id as enrollment_id,
  se.school_id,
  s.name as school_name,
  se.course_id,
  co.name as course_name,
  se.academic_year_id,
  ay.name as academic_year_name,
  ay.start_date as academic_year_start,
  ay.end_date as academic_year_end,
  ce.id as class_enrollment_id,
  ce.class_id,
  c.name as class_name,
  ce.status as class_enrollment_status,
  ce.enrollment_date as class_enrollment_date
FROM people p
JOIN student_profiles sp ON p.id = sp.person_id
LEFT JOIN student_enrollments se ON sp.id = se.student_profile_id AND se.deleted_at IS NULL
LEFT JOIN schools s ON se.school_id = s.id AND s.deleted_at IS NULL
LEFT JOIN courses co ON se.course_id = co.id AND co.deleted_at IS NULL
LEFT JOIN academic_years ay ON se.academic_year_id = ay.id AND ay.deleted_at IS NULL
LEFT JOIN class_enrollments ce ON se.id = ce.student_enrollment_id AND ce.deleted_at IS NULL
LEFT JOIN classes c ON ce.class_id = c.id AND c.deleted_at IS NULL
WHERE p.deleted_at IS NULL
AND sp.deleted_at IS NULL;

COMMENT ON VIEW v_student_full_info IS 'View com informações completas dos alunos, incluindo matrículas, turmas e anos letivos';

-- =====================================================
-- 2. VIEW: Informações completas do professor
-- =====================================================
CREATE OR REPLACE VIEW v_teacher_full_info AS
SELECT 
  p.id as person_id,
  p.first_name,
  p.last_name,
  p.cpf,
  p.email,
  p.phone,
  p.date_of_birth,
  tp.id as teacher_profile_id,
  tp.registration_number,
  tp.formation_level,
  tp.hiring_date,
  tp.status as teacher_status,
  COUNT(DISTINCT cts.class_id) as total_classes,
  COUNT(DISTINCT cts.subject_id) as total_subjects,
  STRING_AGG(DISTINCT s.name, ', ' ORDER BY s.name) as subjects_taught
FROM people p
JOIN teacher_profiles tp ON p.id = tp.person_id
LEFT JOIN class_teacher_subjects cts ON tp.id = cts.teacher_profile_id AND cts.deleted_at IS NULL
LEFT JOIN subjects s ON cts.subject_id = s.id AND s.deleted_at IS NULL
WHERE p.deleted_at IS NULL
AND tp.deleted_at IS NULL
GROUP BY p.id, p.first_name, p.last_name, p.cpf, p.email, p.phone, p.date_of_birth,
         tp.id, tp.registration_number, tp.formation_level, tp.hiring_date, tp.status;

COMMENT ON VIEW v_teacher_full_info IS 'View com informações completas dos professores, incluindo turmas e disciplinas lecionadas';

-- =====================================================
-- 3. VIEW: Lista de alunos por turma (roster)
-- =====================================================
CREATE OR REPLACE VIEW v_class_roster AS
SELECT 
  c.id as class_id,
  c.name as class_name,
  c.grade_id,
  g.name as grade_name,
  c.academic_year_id,
  ay.name as academic_year_name,
  ce.id as class_enrollment_id,
  ce.student_enrollment_id,
  sp.id as student_profile_id,
  p.id as person_id,
  p.first_name || ' ' || p.last_name as student_name,
  sp.registration_number,
  ce.status as enrollment_status,
  ce.enrollment_date,
  ce.created_at
FROM classes c
JOIN class_enrollments ce ON c.id = ce.class_id AND ce.deleted_at IS NULL
JOIN student_enrollments se ON ce.student_enrollment_id = se.id AND se.deleted_at IS NULL
JOIN student_profiles sp ON se.student_profile_id = sp.id AND sp.deleted_at IS NULL
JOIN people p ON sp.person_id = p.id AND p.deleted_at IS NULL
LEFT JOIN courses g ON c.grade_id = g.id AND g.deleted_at IS NULL
LEFT JOIN academic_years ay ON c.academic_year_id = ay.id AND ay.deleted_at IS NULL
WHERE c.deleted_at IS NULL
AND ce.status = 'enrolled'
ORDER BY c.name, p.last_name, p.first_name;

COMMENT ON VIEW v_class_roster IS 'View com lista de alunos matriculados por turma, ordenada por nome';

-- =====================================================
-- 4. VIEW: Notas dos alunos com detalhes
-- =====================================================
CREATE OR REPLACE VIEW v_student_grades AS
SELECT 
  g.id as grade_id,
  g.student_profile_id,
  p.id as person_id,
  p.first_name || ' ' || p.last_name as student_name,
  sp.registration_number,
  ei.id as evaluation_instance_id,
  ei.evaluation_date,
  ei.evaluation_type,
  s.id as subject_id,
  s.name as subject_name,
  c.id as class_id,
  c.name as class_name,
  ap.id as academic_period_id,
  ap.name as period_name,
  ap.start_date as period_start,
  ap.end_date as period_end,
  g.grade_value,
  g.notes,
  g.created_at,
  g.updated_at
FROM grades g
JOIN evaluation_instances ei ON g.evaluation_instance_id = ei.id AND ei.deleted_at IS NULL
JOIN subjects s ON ei.subject_id = s.id AND s.deleted_at IS NULL
JOIN classes c ON ei.class_id = c.id AND c.deleted_at IS NULL
LEFT JOIN academic_periods ap ON ei.academic_period_id = ap.id AND ap.deleted_at IS NULL
JOIN student_profiles sp ON g.student_profile_id = sp.id AND sp.deleted_at IS NULL
JOIN people p ON sp.person_id = p.id AND p.deleted_at IS NULL
WHERE g.deleted_at IS NULL
ORDER BY ei.evaluation_date DESC, s.name, p.last_name, p.first_name;

COMMENT ON VIEW v_student_grades IS 'View com todas as notas dos alunos, incluindo detalhes de avaliação, disciplina, turma e período';

-- =====================================================
-- 5. VIEW: Frequência dos alunos com detalhes
-- =====================================================
CREATE OR REPLACE VIEW v_student_attendance AS
SELECT 
  a.id as attendance_id,
  a.student_profile_id,
  p.id as person_id,
  p.first_name || ' ' || p.last_name as student_name,
  sp.registration_number,
  l.id as lesson_id,
  l.date as lesson_date,
  l.class_id,
  c.name as class_name,
  l.subject_id,
  s.name as subject_name,
  cts.teacher_profile_id,
  tp.registration_number as teacher_registration,
  a.status as attendance_status,
  a.justification,
  a.notes,
  a.created_at,
  a.updated_at
FROM attendances a
JOIN lessons l ON a.lesson_id = l.id AND l.deleted_at IS NULL
JOIN classes c ON l.class_id = c.id AND c.deleted_at IS NULL
JOIN subjects s ON l.subject_id = s.id AND s.deleted_at IS NULL
LEFT JOIN class_teacher_subjects cts ON l.class_id = cts.class_id AND l.subject_id = cts.subject_id AND cts.deleted_at IS NULL
LEFT JOIN teacher_profiles tp ON cts.teacher_profile_id = tp.id AND tp.deleted_at IS NULL
JOIN student_profiles sp ON a.student_profile_id = sp.id AND sp.deleted_at IS NULL
JOIN people p ON sp.person_id = p.id AND p.deleted_at IS NULL
WHERE a.deleted_at IS NULL
ORDER BY l.date DESC, c.name, s.name, p.last_name, p.first_name;

COMMENT ON VIEW v_student_attendance IS 'View com todas as frequências dos alunos, incluindo detalhes de aula, disciplina, turma e professor';

-- =====================================================
-- 6. VIEW: Estatísticas de turma
-- =====================================================
CREATE OR REPLACE VIEW v_class_statistics AS
SELECT 
  c.id as class_id,
  c.name as class_name,
  c.grade_id,
  g.name as grade_name,
  c.academic_year_id,
  ay.name as academic_year_name,
  c.school_id,
  s.name as school_name,
  COUNT(DISTINCT ce.student_profile_id) FILTER (WHERE ce.status = 'enrolled') as total_students,
  COUNT(DISTINCT cts.teacher_profile_id) as total_teachers,
  COUNT(DISTINCT cts.subject_id) as total_subjects,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT ei.id) as total_evaluations,
  AVG(g.grade_value) FILTER (WHERE g.deleted_at IS NULL) as average_grade,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'present' AND a.deleted_at IS NULL) as total_present,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'absent' AND a.deleted_at IS NULL) as total_absent
FROM classes c
LEFT JOIN courses g ON c.grade_id = g.id AND g.deleted_at IS NULL
LEFT JOIN academic_years ay ON c.academic_year_id = ay.id AND ay.deleted_at IS NULL
LEFT JOIN schools s ON c.school_id = s.id AND s.deleted_at IS NULL
LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.deleted_at IS NULL AND ce.status = 'enrolled'
LEFT JOIN class_teacher_subjects cts ON c.id = cts.class_id AND cts.deleted_at IS NULL
LEFT JOIN lessons l ON c.id = l.class_id AND l.deleted_at IS NULL
LEFT JOIN evaluation_instances ei ON c.id = ei.class_id AND ei.deleted_at IS NULL
LEFT JOIN grades g ON ei.id = g.evaluation_instance_id AND g.deleted_at IS NULL
LEFT JOIN attendances a ON l.id = a.lesson_id AND a.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name, c.grade_id, g.name, c.academic_year_id, ay.name, c.school_id, s.name;

COMMENT ON VIEW v_class_statistics IS 'View com estatísticas agregadas por turma (número de alunos, professores, disciplinas, aulas, avaliações, médias, frequência)';

-- =====================================================
-- 7. VIEW: Desempenho do aluno por disciplina
-- =====================================================
CREATE OR REPLACE VIEW v_student_performance_by_subject AS
SELECT 
  sp.id as student_profile_id,
  p.id as person_id,
  p.first_name || ' ' || p.last_name as student_name,
  sp.registration_number,
  s.id as subject_id,
  s.name as subject_name,
  c.id as class_id,
  c.name as class_name,
  ap.id as academic_period_id,
  ap.name as period_name,
  COUNT(DISTINCT g.id) as total_grades,
  AVG(g.grade_value) as average_grade,
  MIN(g.grade_value) as min_grade,
  MAX(g.grade_value) as max_grade,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'present') as total_present,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'absent') as total_absent,
  CASE 
    WHEN COUNT(DISTINCT a.id) > 0 THEN 
      (COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'present')::NUMERIC / COUNT(DISTINCT a.id)::NUMERIC * 100)
    ELSE NULL
  END as attendance_percentage
FROM student_profiles sp
JOIN people p ON sp.person_id = p.id AND p.deleted_at IS NULL
LEFT JOIN grades g ON sp.id = g.student_profile_id AND g.deleted_at IS NULL
LEFT JOIN evaluation_instances ei ON g.evaluation_instance_id = ei.id AND ei.deleted_at IS NULL
LEFT JOIN subjects s ON ei.subject_id = s.id AND s.deleted_at IS NULL
LEFT JOIN classes c ON ei.class_id = c.id AND c.deleted_at IS NULL
LEFT JOIN academic_periods ap ON ei.academic_period_id = ap.id AND ap.deleted_at IS NULL
LEFT JOIN class_enrollments ce ON sp.id = ce.student_profile_id AND ce.class_id = c.id AND ce.deleted_at IS NULL
LEFT JOIN lessons l ON c.id = l.class_id AND l.subject_id = s.id AND l.deleted_at IS NULL
LEFT JOIN attendances a ON l.id = a.lesson_id AND a.student_profile_id = sp.id AND a.deleted_at IS NULL
WHERE sp.deleted_at IS NULL
GROUP BY sp.id, p.id, p.first_name, p.last_name, sp.registration_number,
         s.id, s.name, c.id, c.name, ap.id, ap.name
HAVING COUNT(DISTINCT g.id) > 0 OR COUNT(DISTINCT a.id) > 0;

COMMENT ON VIEW v_student_performance_by_subject IS 'View com desempenho agregado do aluno por disciplina (médias, frequência)';

-- =====================================================
-- FIM DA MIGRATION 031
-- Total: 7 views úteis criadas
-- =====================================================

