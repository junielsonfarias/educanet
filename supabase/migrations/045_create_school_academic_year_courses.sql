-- =====================================================
-- MIGRATION 045: CRIAR TABELA SCHOOL_ACADEMIC_YEAR_COURSES
-- =====================================================
-- Esta tabela define quais cursos/etapas de ensino cada
-- escola oferece em cada ano letivo.
--
-- Permite:
-- 1. Configurar quais cursos uma escola oferece por ano
-- 2. Visualizar evolução histórica da escola
-- 3. Validar criação de turmas (só pode criar turma se
--    o curso estiver configurado para a escola naquele ano)
-- =====================================================

-- 1. Criar a tabela
CREATE TABLE IF NOT EXISTS school_academic_year_courses (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL,
    academic_year_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,

    -- Metadados
    is_active BOOLEAN DEFAULT true,
    notes TEXT,

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by INTEGER,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Foreign Keys
    CONSTRAINT fk_school_academic_year_courses_school
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_school_academic_year_courses_academic_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
    CONSTRAINT fk_school_academic_year_courses_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,

    -- Constraint única para evitar duplicatas
    CONSTRAINT uq_school_year_course UNIQUE (school_id, academic_year_id, course_id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_school_academic_year_courses_school
    ON school_academic_year_courses(school_id);

CREATE INDEX IF NOT EXISTS idx_school_academic_year_courses_year
    ON school_academic_year_courses(academic_year_id);

CREATE INDEX IF NOT EXISTS idx_school_academic_year_courses_course
    ON school_academic_year_courses(course_id);

CREATE INDEX IF NOT EXISTS idx_school_academic_year_courses_school_year
    ON school_academic_year_courses(school_id, academic_year_id);

-- 3. Comentários
COMMENT ON TABLE school_academic_year_courses IS 'Define quais cursos/etapas de ensino cada escola oferece em cada ano letivo';
COMMENT ON COLUMN school_academic_year_courses.school_id IS 'ID da escola';
COMMENT ON COLUMN school_academic_year_courses.academic_year_id IS 'ID do ano letivo';
COMMENT ON COLUMN school_academic_year_courses.course_id IS 'ID do curso/etapa de ensino';
COMMENT ON COLUMN school_academic_year_courses.is_active IS 'Se o curso está ativo para a escola neste ano';
COMMENT ON COLUMN school_academic_year_courses.notes IS 'Observações sobre a oferta do curso';

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_school_academic_year_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_school_academic_year_courses_updated_at
    ON school_academic_year_courses;

CREATE TRIGGER trigger_school_academic_year_courses_updated_at
    BEFORE UPDATE ON school_academic_year_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_school_academic_year_courses_updated_at();

-- 5. RLS Policies
ALTER TABLE school_academic_year_courses ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo
CREATE POLICY "admin_full_access_school_academic_year_courses"
    ON school_academic_year_courses
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Usuários autenticados podem visualizar
CREATE POLICY "authenticated_select_school_academic_year_courses"
    ON school_academic_year_courses
    FOR SELECT
    USING (public.is_authenticated());

-- 6. Função para verificar se um curso está habilitado para uma escola em um ano
CREATE OR REPLACE FUNCTION fn_check_school_course_enabled(
    p_school_id INTEGER,
    p_academic_year_id INTEGER,
    p_course_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM school_academic_year_courses
        WHERE school_id = p_school_id
          AND academic_year_id = p_academic_year_id
          AND course_id = p_course_id
          AND is_active = true
          AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. View para facilitar consultas
CREATE OR REPLACE VIEW vw_school_courses_by_year AS
SELECT
    sayc.id,
    sayc.school_id,
    s.name AS school_name,
    sayc.academic_year_id,
    ay.year AS academic_year,
    sayc.course_id,
    c.name AS course_name,
    c.education_level,
    sayc.is_active,
    sayc.notes,
    sayc.created_at
FROM school_academic_year_courses sayc
JOIN schools s ON s.id = sayc.school_id
JOIN academic_years ay ON ay.id = sayc.academic_year_id
JOIN courses c ON c.id = sayc.course_id
WHERE sayc.deleted_at IS NULL;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
