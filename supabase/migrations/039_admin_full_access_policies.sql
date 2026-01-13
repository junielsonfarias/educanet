-- =====================================================
-- POLÍTICAS DE ACESSO TOTAL PARA ADMINISTRADORES
-- =====================================================
-- Data: 13/01/2026
-- Descrição: Permite que administradores façam CRUD completo
-- em todas as tabelas do sistema, independente da escola
-- =====================================================

-- 1. Função auxiliar para verificar se usuário é Admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.auth_users au
    JOIN public.user_roles ur ON ur.person_id = au.person_id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE au.id = auth.uid()
      AND r.name IN ('Admin', 'Supervisor', 'SuperAdmin')
      AND ur.deleted_at IS NULL
      AND r.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Função para verificar se é usuário autenticado
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 3. POLÍTICAS PARA TABELA: schools
-- =====================================================
ALTER TABLE IF EXISTS schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_schools_select" ON schools;
DROP POLICY IF EXISTS "admin_schools_insert" ON schools;
DROP POLICY IF EXISTS "admin_schools_update" ON schools;
DROP POLICY IF EXISTS "admin_schools_delete" ON schools;
DROP POLICY IF EXISTS "authenticated_schools_select" ON schools;

-- Admin pode fazer tudo
CREATE POLICY "admin_schools_all" ON schools
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Usuários autenticados podem ver escolas
CREATE POLICY "authenticated_schools_select" ON schools
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 4. POLÍTICAS PARA TABELA: people
-- =====================================================
ALTER TABLE IF EXISTS people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_people_all" ON people;
DROP POLICY IF EXISTS "authenticated_people_select" ON people;

CREATE POLICY "admin_people_all" ON people
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_people_select" ON people
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 5. POLÍTICAS PARA TABELA: student_profiles
-- =====================================================
ALTER TABLE IF EXISTS student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_student_profiles_all" ON student_profiles;
DROP POLICY IF EXISTS "authenticated_student_profiles_select" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_select_authenticated" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_insert_authenticated" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_update_authenticated" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_delete_authenticated" ON student_profiles;

CREATE POLICY "admin_student_profiles_all" ON student_profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_student_profiles_select" ON student_profiles
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 6. POLÍTICAS PARA TABELA: student_enrollments
-- =====================================================
ALTER TABLE IF EXISTS student_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_student_enrollments_all" ON student_enrollments;
DROP POLICY IF EXISTS "authenticated_student_enrollments_select" ON student_enrollments;

CREATE POLICY "admin_student_enrollments_all" ON student_enrollments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_student_enrollments_select" ON student_enrollments
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 7. POLÍTICAS PARA TABELA: teachers
-- =====================================================
ALTER TABLE IF EXISTS teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_teachers_all" ON teachers;
DROP POLICY IF EXISTS "authenticated_teachers_select" ON teachers;

CREATE POLICY "admin_teachers_all" ON teachers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_teachers_select" ON teachers
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 8. POLÍTICAS PARA TABELA: classes
-- =====================================================
ALTER TABLE IF EXISTS classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_classes_all" ON classes;
DROP POLICY IF EXISTS "authenticated_classes_select" ON classes;

CREATE POLICY "admin_classes_all" ON classes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_classes_select" ON classes
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 9. POLÍTICAS PARA TABELA: courses (Etapas/Séries)
-- =====================================================
ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_courses_all" ON courses;
DROP POLICY IF EXISTS "authenticated_courses_select" ON courses;

CREATE POLICY "admin_courses_all" ON courses
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_courses_select" ON courses
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 10. POLÍTICAS PARA TABELA: subjects (Disciplinas)
-- =====================================================
ALTER TABLE IF EXISTS subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_subjects_all" ON subjects;
DROP POLICY IF EXISTS "authenticated_subjects_select" ON subjects;

CREATE POLICY "admin_subjects_all" ON subjects
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_subjects_select" ON subjects
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 11. POLÍTICAS PARA TABELA: class_enrollments
-- =====================================================
ALTER TABLE IF EXISTS class_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_class_enrollments_all" ON class_enrollments;
DROP POLICY IF EXISTS "authenticated_class_enrollments_select" ON class_enrollments;

CREATE POLICY "admin_class_enrollments_all" ON class_enrollments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_class_enrollments_select" ON class_enrollments
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 12. POLÍTICAS PARA TABELA: class_teacher_subjects
-- =====================================================
ALTER TABLE IF EXISTS class_teacher_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_class_teacher_subjects_all" ON class_teacher_subjects;
DROP POLICY IF EXISTS "authenticated_class_teacher_subjects_select" ON class_teacher_subjects;

CREATE POLICY "admin_class_teacher_subjects_all" ON class_teacher_subjects
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_class_teacher_subjects_select" ON class_teacher_subjects
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 13. POLÍTICAS PARA TABELA: academic_years
-- =====================================================
ALTER TABLE IF EXISTS academic_years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_academic_years_all" ON academic_years;
DROP POLICY IF EXISTS "authenticated_academic_years_select" ON academic_years;

CREATE POLICY "admin_academic_years_all" ON academic_years
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_academic_years_select" ON academic_years
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 14. POLÍTICAS PARA TABELA: academic_periods
-- =====================================================
ALTER TABLE IF EXISTS academic_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_academic_periods_all" ON academic_periods;
DROP POLICY IF EXISTS "authenticated_academic_periods_select" ON academic_periods;

CREATE POLICY "admin_academic_periods_all" ON academic_periods
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_academic_periods_select" ON academic_periods
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 15. POLÍTICAS PARA TABELA: grades (Notas)
-- =====================================================
ALTER TABLE IF EXISTS grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_grades_all" ON grades;
DROP POLICY IF EXISTS "authenticated_grades_select" ON grades;

CREATE POLICY "admin_grades_all" ON grades
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_grades_select" ON grades
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 16. POLÍTICAS PARA TABELA: attendance_records
-- =====================================================
ALTER TABLE IF EXISTS attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_attendance_records_all" ON attendance_records;
DROP POLICY IF EXISTS "authenticated_attendance_records_select" ON attendance_records;

CREATE POLICY "admin_attendance_records_all" ON attendance_records
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_attendance_records_select" ON attendance_records
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 17. POLÍTICAS PARA TABELA: documents
-- =====================================================
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_documents_all" ON documents;
DROP POLICY IF EXISTS "authenticated_documents_select" ON documents;

CREATE POLICY "admin_documents_all" ON documents
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_documents_select" ON documents
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 18. POLÍTICAS PARA TABELA: protocols
-- =====================================================
ALTER TABLE IF EXISTS protocols ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_protocols_all" ON protocols;
DROP POLICY IF EXISTS "authenticated_protocols_select" ON protocols;

CREATE POLICY "admin_protocols_all" ON protocols
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_protocols_select" ON protocols
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 19. POLÍTICAS PARA TABELA: communications
-- =====================================================
ALTER TABLE IF EXISTS communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_communications_all" ON communications;
DROP POLICY IF EXISTS "authenticated_communications_select" ON communications;

CREATE POLICY "admin_communications_all" ON communications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_communications_select" ON communications
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 20. POLÍTICAS PARA TABELA: student_transfers
-- =====================================================
ALTER TABLE IF EXISTS student_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_student_transfers_all" ON student_transfers;
DROP POLICY IF EXISTS "authenticated_student_transfers_select" ON student_transfers;

CREATE POLICY "admin_student_transfers_all" ON student_transfers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_student_transfers_select" ON student_transfers
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 21. POLÍTICAS PARA TABELA: pre_enrollments
-- =====================================================
ALTER TABLE IF EXISTS pre_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_pre_enrollments_all" ON pre_enrollments;
DROP POLICY IF EXISTS "authenticated_pre_enrollments_select" ON pre_enrollments;

CREATE POLICY "admin_pre_enrollments_all" ON pre_enrollments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_pre_enrollments_select" ON pre_enrollments
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 22. POLÍTICAS PARA TABELA: reenrollment_batches
-- =====================================================
ALTER TABLE IF EXISTS reenrollment_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_reenrollment_batches_all" ON reenrollment_batches;
DROP POLICY IF EXISTS "authenticated_reenrollment_batches_select" ON reenrollment_batches;

CREATE POLICY "admin_reenrollment_batches_all" ON reenrollment_batches
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_reenrollment_batches_select" ON reenrollment_batches
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 23. POLÍTICAS PARA TABELA: lessons
-- =====================================================
ALTER TABLE IF EXISTS lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_lessons_all" ON lessons;
DROP POLICY IF EXISTS "authenticated_lessons_select" ON lessons;

CREATE POLICY "admin_lessons_all" ON lessons
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_lessons_select" ON lessons
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 24. POLÍTICAS PARA TABELA: evaluation_instances
-- =====================================================
ALTER TABLE IF EXISTS evaluation_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_evaluation_instances_all" ON evaluation_instances;
DROP POLICY IF EXISTS "authenticated_evaluation_instances_select" ON evaluation_instances;

CREATE POLICY "admin_evaluation_instances_all" ON evaluation_instances
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_evaluation_instances_select" ON evaluation_instances
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 25. POLÍTICAS PARA TABELA: attachments
-- =====================================================
ALTER TABLE IF EXISTS attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_attachments_all" ON attachments;
DROP POLICY IF EXISTS "authenticated_attachments_select" ON attachments;

CREATE POLICY "admin_attachments_all" ON attachments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_attachments_select" ON attachments
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 26. POLÍTICAS PARA TABELA: public_contents
-- =====================================================
ALTER TABLE IF EXISTS public_contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_public_contents_all" ON public_contents;
DROP POLICY IF EXISTS "authenticated_public_contents_select" ON public_contents;
DROP POLICY IF EXISTS "anon_public_contents_select" ON public_contents;

CREATE POLICY "admin_public_contents_all" ON public_contents
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_public_contents_select" ON public_contents
  FOR SELECT TO authenticated
  USING (true);

-- Conteúdo público pode ser visto por todos (anônimos)
CREATE POLICY "anon_public_contents_select" ON public_contents
  FOR SELECT TO anon
  USING (published = true);

-- =====================================================
-- 27. POLÍTICAS PARA TABELA: system_settings
-- =====================================================
ALTER TABLE IF EXISTS system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_system_settings_all" ON system_settings;
DROP POLICY IF EXISTS "authenticated_system_settings_select" ON system_settings;

CREATE POLICY "admin_system_settings_all" ON system_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_system_settings_select" ON system_settings
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 28. POLÍTICAS PARA TABELA: roles
-- =====================================================
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_roles_all" ON roles;
DROP POLICY IF EXISTS "authenticated_roles_select" ON roles;

CREATE POLICY "admin_roles_all" ON roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_roles_select" ON roles
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 29. POLÍTICAS PARA TABELA: user_roles
-- =====================================================
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_user_roles_all" ON user_roles;
DROP POLICY IF EXISTS "authenticated_user_roles_select" ON user_roles;

CREATE POLICY "admin_user_roles_all" ON user_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_user_roles_select" ON user_roles
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 30. POLÍTICAS PARA TABELA: permissions
-- =====================================================
ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_permissions_all" ON permissions;
DROP POLICY IF EXISTS "authenticated_permissions_select" ON permissions;

CREATE POLICY "admin_permissions_all" ON permissions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_permissions_select" ON permissions
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 31. POLÍTICAS PARA TABELA: role_permissions
-- =====================================================
ALTER TABLE IF EXISTS role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_role_permissions_all" ON role_permissions;
DROP POLICY IF EXISTS "authenticated_role_permissions_select" ON role_permissions;

CREATE POLICY "admin_role_permissions_all" ON role_permissions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_role_permissions_select" ON role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 32. POLÍTICAS PARA TABELA: auth_users
-- =====================================================
ALTER TABLE IF EXISTS auth_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_auth_users_all" ON auth_users;
DROP POLICY IF EXISTS "users_can_view_own" ON auth_users;

CREATE POLICY "admin_auth_users_all" ON auth_users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Usuários podem ver seu próprio registro
CREATE POLICY "users_can_view_own" ON auth_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário atual é Admin, Supervisor ou SuperAdmin. Usa SECURITY DEFINER para evitar recursão RLS.';
COMMENT ON FUNCTION public.is_authenticated() IS 'Verifica se existe um usuário autenticado na sessão.';

-- =====================================================
-- FIM DAS POLÍTICAS DE ADMINISTRADOR
-- =====================================================
-- Resumo:
-- - Administradores (Admin, Supervisor, SuperAdmin) têm CRUD completo
-- - Usuários autenticados podem visualizar (SELECT) todos os dados
-- - Conteúdo público pode ser visto por usuários anônimos
-- - Cada usuário pode ver seu próprio registro em auth_users
-- =====================================================
