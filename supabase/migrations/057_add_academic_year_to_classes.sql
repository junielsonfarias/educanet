-- Migration: Adicionar academic_year_id diretamente na tabela classes
-- Data: 15/01/2026
-- Motivo: Vincular turma ao ano letivo diretamente, em vez de ao período acadêmico
-- O período acadêmico será usado apenas para avaliações e frequência, não para a turma em si

-- ============================================
-- 1. Adicionar coluna academic_year_id
-- ============================================
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS academic_year_id INTEGER;

-- Adicionar FK
ALTER TABLE classes
DROP CONSTRAINT IF EXISTS classes_academic_year_id_fkey;

ALTER TABLE classes
ADD CONSTRAINT classes_academic_year_id_fkey
FOREIGN KEY (academic_year_id)
REFERENCES academic_years(id)
ON DELETE SET NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_classes_academic_year_id ON classes(academic_year_id);

-- Comentário
COMMENT ON COLUMN classes.academic_year_id IS 'Ano letivo ao qual a turma pertence';

-- ============================================
-- 2. Preencher academic_year_id baseado no academic_period_id existente
-- ============================================
UPDATE classes c
SET academic_year_id = ap.academic_year_id
FROM academic_periods ap
WHERE c.academic_period_id = ap.id
  AND c.academic_year_id IS NULL;

-- ============================================
-- 3. Para turmas sem período, tentar vincular ao ano letivo atual (baseado em datas)
-- ============================================
UPDATE classes c
SET academic_year_id = (
  SELECT id FROM academic_years
  WHERE start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE
  AND deleted_at IS NULL
  LIMIT 1
)
WHERE c.academic_year_id IS NULL;

-- ============================================
-- 4. Criar função auxiliar para obter ano letivo da turma
-- ============================================
CREATE OR REPLACE FUNCTION get_class_academic_year(p_class_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_year_id INTEGER;
BEGIN
  -- Primeiro tenta pegar do campo direto
  SELECT academic_year_id INTO v_year_id
  FROM classes
  WHERE id = p_class_id AND deleted_at IS NULL;

  -- Se não tiver, pega do período acadêmico
  IF v_year_id IS NULL THEN
    SELECT ap.academic_year_id INTO v_year_id
    FROM classes c
    JOIN academic_periods ap ON ap.id = c.academic_period_id
    WHERE c.id = p_class_id AND c.deleted_at IS NULL;
  END IF;

  RETURN v_year_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_class_academic_year IS 'Retorna o ID do ano letivo de uma turma';

-- ============================================
-- 5. Log da migração
-- ============================================
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_updated FROM classes WHERE academic_year_id IS NOT NULL;
  RAISE NOTICE 'Migração 057: % turmas atualizadas com academic_year_id', v_updated;
END $$;
