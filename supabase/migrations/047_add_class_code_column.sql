-- =====================================================
-- Migration 047: Adicionar campos code, shift e capacity na tabela classes
-- =====================================================

-- Campo code (sigla da turma) - ex: 5A, 6B, 9C
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS code VARCHAR(20);

-- Campo shift (turno) - Manhã, Tarde, Noite, Integral
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS shift VARCHAR(20);

-- Campo capacity (capacidade de alunos)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 35;

-- Comentários
COMMENT ON COLUMN classes.code IS 'Sigla/código da turma (ex: 5A, 6B, T101)';
COMMENT ON COLUMN classes.shift IS 'Turno da turma (Manhã, Tarde, Noite, Integral)';
COMMENT ON COLUMN classes.capacity IS 'Capacidade máxima de alunos na turma';

-- Índice para busca por código
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code) WHERE code IS NOT NULL;

-- Índice para filtro por turno
CREATE INDEX IF NOT EXISTS idx_classes_shift ON classes(shift) WHERE shift IS NOT NULL;
