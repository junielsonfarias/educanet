-- =====================================================
-- MIGRATION: Adicionar campos do Censo Escolar à tabela classes
-- Data: 2026-01-14
-- Descrição: Campos adicionais para conformidade com o Censo Escolar
-- =====================================================

-- Campo is_multi_grade (Turma Multissérie)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS is_multi_grade BOOLEAN DEFAULT FALSE;

-- Campo education_modality (Modalidade de Ensino)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS education_modality VARCHAR(50);

-- Campo tipo_regime (Tipo de Regime - Seriado/Não Seriado)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS tipo_regime VARCHAR(20);

-- Campo operating_hours (Horário de Funcionamento)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS operating_hours VARCHAR(30);

-- Campo min_students (Mínimo de Alunos)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS min_students INTEGER DEFAULT 0;

-- Campo max_dependency_subjects (Máximo de Disciplinas em Dependência)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS max_dependency_subjects INTEGER DEFAULT 0;

-- Campo operating_days (Dias de Funcionamento - array de strings)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS operating_days TEXT[];

-- Campo regent_teacher_id (Professor Regente)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS regent_teacher_id INTEGER;

-- Criar FK para professor regente
ALTER TABLE classes
  DROP CONSTRAINT IF EXISTS classes_regent_teacher_id_fkey;

ALTER TABLE classes
  ADD CONSTRAINT classes_regent_teacher_id_fkey
  FOREIGN KEY (regent_teacher_id)
  REFERENCES teachers(id)
  ON DELETE SET NULL;

-- Comentários
COMMENT ON COLUMN classes.is_multi_grade IS 'Indica se a turma é multissérie (aceita alunos de diferentes séries)';
COMMENT ON COLUMN classes.education_modality IS 'Modalidade de ensino conforme Censo Escolar (Regular, EJA, Especial, Integral, Tecnico)';
COMMENT ON COLUMN classes.tipo_regime IS 'Tipo de regime conforme Censo Escolar (Seriado, Nao Seriado)';
COMMENT ON COLUMN classes.operating_hours IS 'Horário de funcionamento da turma (ex: 07:00 - 12:00)';
COMMENT ON COLUMN classes.min_students IS 'Número mínimo de alunos para abrir a turma';
COMMENT ON COLUMN classes.max_dependency_subjects IS 'Número máximo de disciplinas em dependência permitidas';
COMMENT ON COLUMN classes.operating_days IS 'Dias da semana em que a turma funciona (seg, ter, qua, qui, sex, sab)';
COMMENT ON COLUMN classes.regent_teacher_id IS 'Professor regente/responsável pela turma';

-- Índices
CREATE INDEX IF NOT EXISTS idx_classes_regent_teacher ON classes(regent_teacher_id) WHERE regent_teacher_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_education_modality ON classes(education_modality) WHERE education_modality IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_is_multi_grade ON classes(is_multi_grade) WHERE is_multi_grade = TRUE;
