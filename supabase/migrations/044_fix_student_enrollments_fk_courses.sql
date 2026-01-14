-- =====================================================
-- MIGRATION 044: CORRIGIR FK STUDENT_ENROLLMENTS -> COURSES
-- =====================================================
-- Problema: O PostgREST não consegue fazer o join entre
-- student_enrollments e courses porque a FK não estava definida.
-- Erro: "Could not find a relationship between 'student_enrollments' and 'courses'"
-- =====================================================

-- 1. Verificar se a coluna course_id existe e adicionar se não existir
ALTER TABLE student_enrollments
  ADD COLUMN IF NOT EXISTS course_id INTEGER;

-- 2. Criar a Foreign Key (drop primeiro caso exista parcialmente)
ALTER TABLE student_enrollments
  DROP CONSTRAINT IF EXISTS student_enrollments_course_id_fkey;

ALTER TABLE student_enrollments
  ADD CONSTRAINT student_enrollments_course_id_fkey
  FOREIGN KEY (course_id)
  REFERENCES courses(id)
  ON DELETE SET NULL;

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_student_enrollments_course
  ON student_enrollments(course_id);

-- 4. Comentário da coluna
COMMENT ON COLUMN student_enrollments.course_id IS 'ID do curso/etapa de ensino em que o aluno está matriculado';

-- =====================================================
-- FIM DA MIGRATION
-- Esta migration corrige o relacionamento FK entre
-- student_enrollments e courses para permitir joins
-- via Supabase PostgREST API.
-- =====================================================
