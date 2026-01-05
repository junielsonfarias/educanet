-- =====================================================
-- MIGRATION 027: CONFIGURAR RLS PARA ATTACHMENTS
-- =====================================================
-- Esta migration habilita Row Level Security (RLS) e
-- cria políticas de acesso para a tabela attachments.
-- =====================================================

-- Habilitar RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- ==================== POLÍTICAS DE LEITURA ====================

-- Usuários podem ver anexos de entidades que têm acesso
-- (implementação genérica - pode ser refinada por tipo de entidade)
CREATE POLICY "Users can view attachments for accessible entities"
  ON attachments
  FOR SELECT
  USING (
    -- Admin pode ver tudo
    EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
    OR
    -- Usuário pode ver anexos que ele mesmo fez upload
    uploaded_by_id IN (
      SELECT person_id FROM auth_users
      WHERE id = auth.uid()
    )
    OR
    -- Para anexos de pessoas: usuário pode ver se for a própria pessoa ou admin
    (entity_type = 'person' AND entity_id IN (
      SELECT person_id FROM auth_users
      WHERE id = auth.uid()
    ))
    OR
    -- Para anexos de student_profile: usuário pode ver se for o próprio perfil ou responsável
    (entity_type = 'student_profile' AND entity_id IN (
      SELECT sp.id FROM student_profiles sp
      JOIN people p ON sp.person_id = p.id
      JOIN auth_users au ON p.id = au.person_id
      WHERE au.id = auth.uid()
      UNION
      SELECT sp.id FROM student_profiles sp
      JOIN student_guardians sg ON sp.id = sg.student_profile_id
      JOIN guardians g ON sg.guardian_id = g.id
      JOIN people p ON g.person_id = p.id
      JOIN auth_users au ON p.id = au.person_id
      WHERE au.id = auth.uid()
    ))
    OR
    -- Para anexos de escolas: usuários da escola podem ver (via staff ou classes)
    (entity_type = 'school' AND EXISTS (
      SELECT 1 FROM auth_users au
      JOIN people p ON au.person_id = p.id
      LEFT JOIN staff s ON p.id = s.person_id
      LEFT JOIN class_teacher_subjects cts ON p.id = (
        SELECT t.person_id FROM teachers t WHERE t.id = cts.teacher_id
      )
      LEFT JOIN classes c ON cts.class_id = c.id
      WHERE au.id = auth.uid()
        AND (
          (s.school_id = entity_id AND s.deleted_at IS NULL)
          OR (c.school_id = entity_id AND c.deleted_at IS NULL)
        )
    ))
  );

-- ==================== POLÍTICAS DE INSERÇÃO ====================

-- Usuários autenticados podem criar anexos
CREATE POLICY "Authenticated users can create attachments"
  ON attachments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND uploaded_by_id IN (
      SELECT person_id FROM auth_users
      WHERE id = auth.uid()
    )
  );

-- ==================== POLÍTICAS DE ATUALIZAÇÃO ====================

-- Usuários podem atualizar anexos que fizeram upload ou admin pode atualizar qualquer um
CREATE POLICY "Users can update their own attachments or admin can update any"
  ON attachments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
    OR
    uploaded_by_id IN (
      SELECT person_id FROM auth_users
      WHERE id = auth.uid()
    )
  );

-- ==================== POLÍTICAS DE EXCLUSÃO ====================

-- Usuários podem excluir anexos que fizeram upload ou admin pode excluir qualquer um
CREATE POLICY "Users can delete their own attachments or admin can delete any"
  ON attachments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
    OR
    uploaded_by_id IN (
      SELECT person_id FROM auth_users
      WHERE id = auth.uid()
    )
  );

