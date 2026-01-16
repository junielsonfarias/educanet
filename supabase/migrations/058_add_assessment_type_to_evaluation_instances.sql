-- Migration: Adicionar assessment_type_id na tabela evaluation_instances
-- Data: 15/01/2026
-- Motivo: Vincular instâncias de avaliação aos tipos de avaliação cadastrados

-- ============================================
-- 1. Adicionar coluna assessment_type_id
-- ============================================
ALTER TABLE evaluation_instances
ADD COLUMN IF NOT EXISTS assessment_type_id INTEGER;

-- Adicionar FK
ALTER TABLE evaluation_instances
DROP CONSTRAINT IF EXISTS evaluation_instances_assessment_type_id_fkey;

ALTER TABLE evaluation_instances
ADD CONSTRAINT evaluation_instances_assessment_type_id_fkey
FOREIGN KEY (assessment_type_id)
REFERENCES assessment_types(id)
ON DELETE SET NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_evaluation_instances_assessment_type
ON evaluation_instances(assessment_type_id);

-- Comentário
COMMENT ON COLUMN evaluation_instances.assessment_type_id IS 'Tipo de avaliação (Prova Bimestral, Recuperação, etc.)';

-- ============================================
-- 2. Log da migração
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migração 058: Coluna assessment_type_id adicionada em evaluation_instances';
END $$;
