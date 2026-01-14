-- Migration 049: Adicionar campos PCD e enrollment
-- Data: 14/01/2026
-- Descricao: Adiciona suporte a PCD (Pessoa com Deficiencia) e campos de consolidacao de matricula

-- =============================================================================
-- 1. CAMPOS PCD EM STUDENT_PROFILES
-- =============================================================================

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS is_pcd BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cid_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cid_description TEXT,
  ADD COLUMN IF NOT EXISTS has_medical_report BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS medical_report_date DATE,
  ADD COLUMN IF NOT EXISTS medical_report_notes TEXT;

-- Comentarios
COMMENT ON COLUMN student_profiles.is_pcd IS 'Indica se o aluno e Pessoa com Deficiencia';
COMMENT ON COLUMN student_profiles.cid_code IS 'Codigo CID (Classificacao Internacional de Doencas)';
COMMENT ON COLUMN student_profiles.cid_description IS 'Descricao da deficiencia/condicao';
COMMENT ON COLUMN student_profiles.has_medical_report IS 'Indica se possui laudo medico';
COMMENT ON COLUMN student_profiles.medical_report_date IS 'Data do laudo medico';
COMMENT ON COLUMN student_profiles.medical_report_notes IS 'Observacoes sobre o laudo medico';

-- =============================================================================
-- 2. CAMPOS DE ENROLLMENT EM CLASS_ENROLLMENTS
-- =============================================================================

ALTER TABLE class_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_order INTEGER,
  ADD COLUMN IF NOT EXISTS is_consolidated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS final_result VARCHAR(20);

-- Comentarios
COMMENT ON COLUMN class_enrollments.enrollment_order IS 'Numero de ordem do aluno na turma';
COMMENT ON COLUMN class_enrollments.is_consolidated IS 'Indica se a matricula foi consolidada (ordenacao alfabetica fixa)';
COMMENT ON COLUMN class_enrollments.final_result IS 'Resultado final: Aprovado, Reprovado ou null';

-- =============================================================================
-- 3. NOVOS STATUS NO ENUM class_enrollment_status
-- =============================================================================

-- Verificar e adicionar novos valores ao ENUM (se nao existirem)
DO $$
BEGIN
  -- Adicionar 'Abandono' se nao existir
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Abandono' AND enumtypid = 'class_enrollment_status'::regtype) THEN
    ALTER TYPE class_enrollment_status ADD VALUE 'Abandono';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- Adicionar 'Aprovado' se nao existir
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Aprovado' AND enumtypid = 'class_enrollment_status'::regtype) THEN
    ALTER TYPE class_enrollment_status ADD VALUE 'Aprovado';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  -- Adicionar 'Reprovado' se nao existir
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Reprovado' AND enumtypid = 'class_enrollment_status'::regtype) THEN
    ALTER TYPE class_enrollment_status ADD VALUE 'Reprovado';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 4. DATA DE CONSOLIDACAO EM ACADEMIC_YEARS
-- =============================================================================

ALTER TABLE academic_years
  ADD COLUMN IF NOT EXISTS enrollment_consolidation_date DATE;

COMMENT ON COLUMN academic_years.enrollment_consolidation_date IS 'Data limite para consolidacao de matriculas (ordenacao alfabetica)';

-- =============================================================================
-- 5. INDICE PARA PERFORMANCE
-- =============================================================================

-- Indice para busca de alunos PCD
CREATE INDEX IF NOT EXISTS idx_student_profiles_is_pcd
  ON student_profiles(is_pcd)
  WHERE is_pcd = TRUE;

-- Indice para ordem de matricula
CREATE INDEX IF NOT EXISTS idx_class_enrollments_order
  ON class_enrollments(class_id, enrollment_order);
