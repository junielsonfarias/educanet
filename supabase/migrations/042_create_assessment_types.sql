-- Migration: Criar tabela de Tipos de Avaliação
-- Descrição: Armazena os tipos de avaliações (Prova Bimestral, Recuperação, SISAM, etc.)

-- =====================================================
-- TABELA: assessment_types (Tipos de Avaliação)
-- =====================================================

CREATE TABLE IF NOT EXISTS assessment_types (
    id SERIAL PRIMARY KEY,

    -- Informações básicas
    name VARCHAR(100) NOT NULL,
    description TEXT,
    code VARCHAR(20), -- Código interno (ex: PB1, REC, SISAM)

    -- Configurações
    weight DECIMAL(5,2) DEFAULT 1.0, -- Peso na média
    max_score DECIMAL(5,2) DEFAULT 10.0, -- Nota máxima
    passing_score DECIMAL(5,2) DEFAULT 6.0, -- Nota mínima para aprovação

    -- Regras
    exclude_from_average BOOLEAN DEFAULT FALSE, -- Não contabiliza na média
    is_recovery BOOLEAN DEFAULT FALSE, -- É avaliação de recuperação
    replaces_lowest BOOLEAN DEFAULT FALSE, -- Substitui a menor nota
    is_mandatory BOOLEAN DEFAULT TRUE, -- Obrigatório para todos os alunos

    -- Período de aplicação
    applicable_period_type VARCHAR(50) DEFAULT 'bimester', -- bimester, semester, annual

    -- Séries aplicáveis (array de IDs de education_grades)
    applicable_grade_ids INTEGER[] DEFAULT '{}',

    -- Escola (NULL = todas as escolas)
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,

    -- Curso (NULL = todos os cursos)
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,

    -- Ordenação e status
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_assessment_types_school ON assessment_types(school_id);
CREATE INDEX IF NOT EXISTS idx_assessment_types_course ON assessment_types(course_id);
CREATE INDEX IF NOT EXISTS idx_assessment_types_active ON assessment_types(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_types_grades ON assessment_types USING GIN(applicable_grade_ids);

-- Comentários
COMMENT ON TABLE assessment_types IS 'Tipos de avaliações disponíveis no sistema';
COMMENT ON COLUMN assessment_types.code IS 'Código único para identificação rápida (ex: PB1, REC)';
COMMENT ON COLUMN assessment_types.weight IS 'Peso da avaliação no cálculo da média';
COMMENT ON COLUMN assessment_types.exclude_from_average IS 'Se TRUE, não entra no cálculo da média';
COMMENT ON COLUMN assessment_types.is_recovery IS 'Indica se é uma avaliação de recuperação';
COMMENT ON COLUMN assessment_types.replaces_lowest IS 'Se TRUE, substitui a menor nota do período';
COMMENT ON COLUMN assessment_types.applicable_grade_ids IS 'IDs das séries/anos onde esta avaliação se aplica';

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_assessment_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assessment_types_updated_at ON assessment_types;
CREATE TRIGGER trigger_assessment_types_updated_at
    BEFORE UPDATE ON assessment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_types_updated_at();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE assessment_types ENABLE ROW LEVEL SECURITY;

-- Política: Todos autenticados podem visualizar
CREATE POLICY "assessment_types_select_authenticated" ON assessment_types
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);

-- Política: Admin/Supervisor podem gerenciar (usa função is_admin existente)
CREATE POLICY "assessment_types_all_admin" ON assessment_types
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- =====================================================
-- DADOS INICIAIS (Tipos comuns de avaliação)
-- =====================================================

INSERT INTO assessment_types (name, code, description, weight, is_recovery, applicable_period_type, display_order) VALUES
    ('Avaliação Bimestral 1', 'AB1', 'Primeira avaliação bimestral', 2.0, FALSE, 'bimester', 1),
    ('Avaliação Bimestral 2', 'AB2', 'Segunda avaliação bimestral', 2.0, FALSE, 'bimester', 2),
    ('Trabalho/Atividade', 'TRAB', 'Trabalhos e atividades avaliativas', 1.0, FALSE, 'bimester', 3),
    ('Participação', 'PART', 'Avaliação de participação e engajamento', 1.0, FALSE, 'bimester', 4),
    ('Recuperação Paralela', 'REC', 'Avaliação de recuperação paralela', 1.0, TRUE, 'bimester', 5),
    ('Recuperação Final', 'RECF', 'Avaliação de recuperação final', 1.0, TRUE, 'annual', 6),
    ('SISAM', 'SISAM', 'Sistema de Avaliação Municipal', 2.0, FALSE, 'bimester', 7),
    ('Simulado', 'SIM', 'Simulado preparatório', 1.0, FALSE, 'bimester', 8),
    ('Prova Externa', 'PEXT', 'Avaliações externas (SAEB, Prova Brasil, etc.)', 1.0, FALSE, 'annual', 9)
ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON assessment_types TO authenticated;
GRANT ALL ON assessment_types TO service_role;
GRANT USAGE, SELECT ON SEQUENCE assessment_types_id_seq TO authenticated;
