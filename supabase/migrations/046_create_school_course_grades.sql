-- =====================================================
-- MIGRATION 046: CRIAR TABELA SCHOOL_ACADEMIC_YEAR_COURSE_GRADES
-- =====================================================
-- Esta tabela define quais séries/anos de cada curso
-- uma escola oferece em cada ano letivo.
--
-- Por exemplo: Uma escola pode oferecer Anos Iniciais
-- mas apenas do 1º ao 3º ano (não oferece 4º e 5º)
-- =====================================================

-- 1. Criar a tabela
CREATE TABLE IF NOT EXISTS school_academic_year_course_grades (
    id SERIAL PRIMARY KEY,
    school_course_id INTEGER NOT NULL,  -- FK para school_academic_year_courses
    education_grade_id INTEGER NOT NULL, -- FK para education_grades (série)

    -- Metadados
    is_active BOOLEAN DEFAULT true,
    max_students INTEGER,  -- Capacidade máxima para esta série nesta escola
    notes TEXT,

    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by INTEGER,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Foreign Keys
    CONSTRAINT fk_school_course_grades_school_course
        FOREIGN KEY (school_course_id) REFERENCES school_academic_year_courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_school_course_grades_education_grade
        FOREIGN KEY (education_grade_id) REFERENCES education_grades(id) ON DELETE CASCADE,

    -- Constraint única para evitar duplicatas
    CONSTRAINT uq_school_course_grade UNIQUE (school_course_id, education_grade_id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_school_course_grades_school_course
    ON school_academic_year_course_grades(school_course_id);

CREATE INDEX IF NOT EXISTS idx_school_course_grades_education_grade
    ON school_academic_year_course_grades(education_grade_id);

-- 3. Comentários
COMMENT ON TABLE school_academic_year_course_grades IS 'Define quais séries de cada curso uma escola oferece em cada ano letivo';
COMMENT ON COLUMN school_academic_year_course_grades.school_course_id IS 'ID do vínculo escola-ano-curso';
COMMENT ON COLUMN school_academic_year_course_grades.education_grade_id IS 'ID da série/ano escolar';
COMMENT ON COLUMN school_academic_year_course_grades.max_students IS 'Capacidade máxima de alunos para esta série nesta escola';

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_school_course_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_school_course_grades_updated_at
    ON school_academic_year_course_grades;

CREATE TRIGGER trigger_school_course_grades_updated_at
    BEFORE UPDATE ON school_academic_year_course_grades
    FOR EACH ROW
    EXECUTE FUNCTION update_school_course_grades_updated_at();

-- 5. RLS Policies
ALTER TABLE school_academic_year_course_grades ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo
CREATE POLICY "admin_full_access_school_course_grades"
    ON school_academic_year_course_grades
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Usuários autenticados podem visualizar
CREATE POLICY "authenticated_select_school_course_grades"
    ON school_academic_year_course_grades
    FOR SELECT
    USING (public.is_authenticated());

-- 6. View para facilitar consultas
CREATE OR REPLACE VIEW vw_school_course_grades AS
SELECT
    scg.id,
    scg.school_course_id,
    sayc.school_id,
    s.name AS school_name,
    sayc.academic_year_id,
    ay.year AS academic_year,
    sayc.course_id,
    c.name AS course_name,
    c.education_level,
    scg.education_grade_id,
    eg.grade_name,
    eg.grade_order,
    scg.is_active,
    scg.max_students,
    scg.notes
FROM school_academic_year_course_grades scg
JOIN school_academic_year_courses sayc ON sayc.id = scg.school_course_id
JOIN schools s ON s.id = sayc.school_id
JOIN academic_years ay ON ay.id = sayc.academic_year_id
JOIN courses c ON c.id = sayc.course_id
JOIN education_grades eg ON eg.id = scg.education_grade_id
WHERE scg.deleted_at IS NULL
  AND sayc.deleted_at IS NULL;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
