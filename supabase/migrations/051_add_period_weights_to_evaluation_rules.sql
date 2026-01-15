-- =====================================================
-- MIGRATION 051: ADICIONAR PESOS POR PERÍODO NAS REGRAS DE AVALIAÇÃO
-- =====================================================
-- Permite configurar fórmulas de cálculo de média ponderada
-- com pesos diferentes para cada período acadêmico
-- =====================================================

-- =====================================================
-- 1. ADICIONAR CAMPO JSONB PARA PESOS DOS PERÍODOS
-- =====================================================

ALTER TABLE evaluation_rules
  ADD COLUMN IF NOT EXISTS period_weights JSONB;

COMMENT ON COLUMN evaluation_rules.period_weights IS
'Configuração de pesos para média ponderada. Formato JSON:
{
  "weights": [2, 3, 2, 3],  -- Pesos para cada período na ordem
  "divisor": 10,            -- Divisor total (soma dos pesos ou valor fixo)
  "formula": "((1ª × 2) + (2ª × 3) + (3ª × 2) + (4ª × 3)) / 10"
}';

-- =====================================================
-- 2. ADICIONAR CAMPO PARA DESCRIÇÃO DA FÓRMULA
-- =====================================================

ALTER TABLE evaluation_rules
  ADD COLUMN IF NOT EXISTS formula_description TEXT;

COMMENT ON COLUMN evaluation_rules.formula_description IS
'Descrição textual da fórmula de cálculo para exibição no boletim';

-- =====================================================
-- 3. ATUALIZAR REGRAS EXISTENTES COM PESOS PADRÃO
-- =====================================================

-- Regra de Média Ponderada para Ensino Médio (peso igual para simplificar)
UPDATE evaluation_rules
SET
  period_weights = '{"weights": [2, 3, 2, 3], "divisor": 10}',
  formula_description = 'Média Ponderada: ((1ª Av. × 2) + (2ª Av. × 3) + (3ª Av. × 2) + (4ª Av. × 3)) / 10'
WHERE calculation_type = 'Media_Ponderada'
  AND period_weights IS NULL;

-- Regra de Média Simples (pesos iguais)
UPDATE evaluation_rules
SET
  period_weights = '{"weights": [1, 1, 1, 1], "divisor": 4}',
  formula_description = 'Média Simples: (1ª Av. + 2ª Av. + 3ª Av. + 4ª Av.) / 4'
WHERE calculation_type = 'Media_Simples'
  AND periods_per_year = 4
  AND period_weights IS NULL;

-- Regra de Média Simples Semestral
UPDATE evaluation_rules
SET
  period_weights = '{"weights": [1, 1], "divisor": 2}',
  formula_description = 'Média Simples: (1º Sem. + 2º Sem.) / 2'
WHERE calculation_type = 'Media_Simples'
  AND periods_per_year = 2
  AND period_weights IS NULL;

-- Regra de Média Simples Trimestral
UPDATE evaluation_rules
SET
  period_weights = '{"weights": [1, 1, 1], "divisor": 3}',
  formula_description = 'Média Simples: (1º Tri. + 2º Tri. + 3º Tri.) / 3'
WHERE calculation_type = 'Media_Simples'
  AND periods_per_year = 3
  AND period_weights IS NULL;

-- =====================================================
-- 4. FUNÇÃO PARA CALCULAR MÉDIA COM PESOS
-- =====================================================

CREATE OR REPLACE FUNCTION fn_calculate_weighted_average(
  p_grades DECIMAL[],
  p_weights INTEGER[],
  p_divisor INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  v_sum DECIMAL := 0;
  v_i INTEGER;
BEGIN
  -- Verificar se arrays têm mesmo tamanho
  IF array_length(p_grades, 1) != array_length(p_weights, 1) THEN
    RETURN NULL;
  END IF;

  -- Calcular soma ponderada
  FOR v_i IN 1..array_length(p_grades, 1) LOOP
    IF p_grades[v_i] IS NOT NULL THEN
      v_sum := v_sum + (p_grades[v_i] * p_weights[v_i]);
    END IF;
  END LOOP;

  -- Retornar média
  IF p_divisor > 0 THEN
    RETURN ROUND(v_sum / p_divisor, 2);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_calculate_weighted_average IS
'Calcula a média ponderada dado um array de notas, pesos e divisor';

-- =====================================================
-- 5. VIEW PARA REGRAS COM FÓRMULAS FORMATADAS
-- =====================================================

DROP VIEW IF EXISTS vw_evaluation_rules_with_formula;
CREATE OR REPLACE VIEW vw_evaluation_rules_with_formula AS
SELECT
  er.id,
  er.name,
  er.description,
  er.course_id,
  er.education_grade_id,
  er.min_approval_grade,
  er.min_attendance_percent,
  er.min_evaluations_per_period,
  er.academic_period_type,
  er.periods_per_year,
  er.calculation_type,
  er.allow_recovery,
  er.recovery_replaces_lowest,
  er.period_weights,
  er.formula_description,
  c.name as course_name,
  eg.grade_name,
  CASE
    WHEN er.calculation_type = 'Media_Simples' THEN 'Média Simples'
    WHEN er.calculation_type = 'Media_Ponderada' THEN 'Média Ponderada'
    WHEN er.calculation_type = 'Descritiva' THEN 'Avaliação Descritiva'
    WHEN er.calculation_type = 'Soma_Notas' THEN 'Soma de Notas'
    ELSE er.calculation_type
  END as calculation_type_label
FROM evaluation_rules er
LEFT JOIN courses c ON c.id = er.course_id
LEFT JOIN education_grades eg ON eg.id = er.education_grade_id
WHERE er.deleted_at IS NULL;

COMMENT ON VIEW vw_evaluation_rules_with_formula IS
'Regras de avaliação com informações de fórmula e labels formatados';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
