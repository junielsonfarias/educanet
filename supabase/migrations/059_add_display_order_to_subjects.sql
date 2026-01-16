-- =====================================================
-- MIGRATION 059: ADICIONAR CAMPO DE ORDEM NAS DISCIPLINAS
-- =====================================================
-- Adiciona campo display_order para controlar a ordem de exibição
-- das disciplinas no sistema (lançamento de notas, boletins, etc.)

-- 1. Adicionar coluna display_order na tabela subjects
ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. Criar índice para ordenação
CREATE INDEX IF NOT EXISTS idx_subjects_display_order ON subjects(display_order);

-- 3. Comentário explicativo
COMMENT ON COLUMN subjects.display_order IS 'Ordem de exibição da disciplina no sistema (menor valor = aparece primeiro)';

-- 4. Atualizar disciplinas existentes com ordem padrão baseada no nome
-- (ordem alfabética inicial, pode ser ajustada posteriormente)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) * 10 AS new_order
  FROM subjects
  WHERE deleted_at IS NULL
)
UPDATE subjects
SET display_order = ordered.new_order
FROM ordered
WHERE subjects.id = ordered.id;

-- 5. Log da migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 059: Campo display_order adicionado à tabela subjects';
END $$;
