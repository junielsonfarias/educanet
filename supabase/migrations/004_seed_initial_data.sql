-- =====================================================
-- FASE 2: CRIAÇÃO DO BANCO DE DADOS
-- MIGRATION 004: DADOS INICIAIS (SEED DATA)
-- =====================================================
-- IMPORTANTE: Esta migration insere dados de referência básicos
-- necessários para o funcionamento do sistema
-- =====================================================

-- =====================================================
-- 1. INSERIR PESSOA ADMIN (Sistema)
-- =====================================================
-- Esta pessoa representa o "Sistema" para registros automáticos
INSERT INTO people (id, first_name, last_name, date_of_birth, cpf, type, created_by, created_at)
VALUES (
  1,
  'Sistema',
  'EduGestão',
  '2024-01-01',
  '00000000000',
  'Funcionario',
  1,
  now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. INSERIR ROLES PADRÃO
-- =====================================================

INSERT INTO roles (name, description, default_for_person_type, created_by, created_at) VALUES
('Admin', 'Administrador do sistema com acesso total', 'Funcionario', 1, now()),
('Coordenador', 'Coordenador pedagógico com acesso a múltiplas escolas', 'Funcionario', 1, now()),
('Diretor', 'Diretor de escola com acesso total à sua escola', 'Funcionario', 1, now()),
('Secretário', 'Secretário escolar com acesso a funções administrativas', 'Funcionario', 1, now()),
('Professor', 'Professor com acesso a turmas e disciplinas', 'Professor', 1, now()),
('Aluno', 'Aluno com acesso a seus próprios dados', 'Aluno', 1, now()),
('Responsável', 'Pai/Mãe/Responsável com acesso aos dados dos filhos', NULL, 1, now())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. INSERIR PERMISSIONS BÁSICAS
-- =====================================================

-- Permissions de Pessoas
INSERT INTO permissions (name, description, created_by, created_at) VALUES
('view_people', 'Visualizar pessoas', 1, now()),
('create_people', 'Criar pessoas', 1, now()),
('edit_people', 'Editar pessoas', 1, now()),
('delete_people', 'Excluir pessoas', 1, now()),

-- Permissions de Alunos
('view_students', 'Visualizar alunos', 1, now()),
('create_students', 'Criar alunos', 1, now()),
('edit_students', 'Editar alunos', 1, now()),
('delete_students', 'Excluir alunos', 1, now()),

-- Permissions de Professores
('view_teachers', 'Visualizar professores', 1, now()),
('create_teachers', 'Criar professores', 1, now()),
('edit_teachers', 'Editar professores', 1, now()),
('delete_teachers', 'Excluir professores', 1, now()),

-- Permissions de Escolas
('view_schools', 'Visualizar escolas', 1, now()),
('create_schools', 'Criar escolas', 1, now()),
('edit_schools', 'Editar escolas', 1, now()),
('delete_schools', 'Excluir escolas', 1, now()),

-- Permissions de Turmas
('view_classes', 'Visualizar turmas', 1, now()),
('create_classes', 'Criar turmas', 1, now()),
('edit_classes', 'Editar turmas', 1, now()),
('delete_classes', 'Excluir turmas', 1, now()),

-- Permissions de Matrículas
('view_enrollments', 'Visualizar matrículas', 1, now()),
('create_enrollments', 'Criar matrículas', 1, now()),
('edit_enrollments', 'Editar matrículas', 1, now()),
('delete_enrollments', 'Excluir matrículas', 1, now()),

-- Permissions de Notas
('view_grades', 'Visualizar notas', 1, now()),
('create_grades', 'Criar notas', 1, now()),
('edit_grades', 'Editar notas', 1, now()),
('delete_grades', 'Excluir notas', 1, now()),

-- Permissions de Frequência
('view_attendance', 'Visualizar frequência', 1, now()),
('create_attendance', 'Registrar frequência', 1, now()),
('edit_attendance', 'Editar frequência', 1, now()),
('delete_attendance', 'Excluir frequência', 1, now()),

-- Permissions de Documentos
('view_documents', 'Visualizar documentos', 1, now()),
('create_documents', 'Criar documentos', 1, now()),
('edit_documents', 'Editar documentos', 1, now()),
('delete_documents', 'Excluir documentos', 1, now()),

-- Permissions de Comunicação
('view_communications', 'Visualizar comunicações', 1, now()),
('create_communications', 'Criar comunicações', 1, now()),
('edit_communications', 'Editar comunicações', 1, now()),
('delete_communications', 'Excluir comunicações', 1, now()),

-- Permissions de Protocolos
('view_protocols', 'Visualizar protocolos', 1, now()),
('create_protocols', 'Criar protocolos', 1, now()),
('edit_protocols', 'Editar protocolos', 1, now()),
('delete_protocols', 'Excluir protocolos', 1, now()),

-- Permissions de Portal Público
('view_portal_content', 'Visualizar conteúdo do portal', 1, now()),
('create_portal_content', 'Criar conteúdo do portal', 1, now()),
('edit_portal_content', 'Editar conteúdo do portal', 1, now()),
('delete_portal_content', 'Excluir conteúdo do portal', 1, now()),
('publish_portal_content', 'Publicar conteúdo do portal', 1, now()),

-- Permissions de Configurações
('view_settings', 'Visualizar configurações', 1, now()),
('edit_settings', 'Editar configurações', 1, now()),

-- Permissions de Relatórios
('view_reports', 'Visualizar relatórios', 1, now()),
('export_reports', 'Exportar relatórios', 1, now()),

-- Permissions de Usuários
('view_users', 'Visualizar usuários', 1, now()),
('create_users', 'Criar usuários', 1, now()),
('edit_users', 'Editar usuários', 1, now()),
('delete_users', 'Excluir usuários', 1, now()),
('manage_roles', 'Gerenciar papéis', 1, now()),
('manage_permissions', 'Gerenciar permissões', 1, now())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 4. CRIAR TABELA role_permissions
-- =====================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by INTEGER NOT NULL,
  updated_by INTEGER,
  deleted_at TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_role_permissions_deleted_at ON role_permissions(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE role_permissions IS 'Associa permissões a papéis de usuário.';
COMMENT ON COLUMN role_permissions.role_id IS 'ID do papel.';
COMMENT ON COLUMN role_permissions.permission_id IS 'ID da permissão.';

-- Trigger para role_permissions
CREATE TRIGGER set_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 5. CRIAR TABELA user_roles
-- =====================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  person_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by INTEGER NOT NULL,
  updated_by INTEGER,
  deleted_at TIMESTAMP,
  UNIQUE(person_id, role_id)
);

CREATE INDEX idx_user_roles_person_id ON user_roles(person_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_deleted_at ON user_roles(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE user_roles IS 'Associa pessoas a papéis de usuário, definindo suas permissões de acesso. Permite a atribuição de múltiplos papéis, incluindo o papel padrão definido pelo tipo de pessoa.';
COMMENT ON COLUMN user_roles.person_id IS 'ID da pessoa.';
COMMENT ON COLUMN user_roles.role_id IS 'ID do papel atribuído.';

-- Trigger para user_roles
CREATE TRIGGER set_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 6. ASSOCIAR PERMISSIONS AOS ROLES
-- =====================================================

-- Função auxiliar para associar permissão a role
CREATE OR REPLACE FUNCTION assign_permission_to_role(
  p_role_name VARCHAR,
  p_permission_name VARCHAR
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO role_permissions (role_id, permission_id, created_by, created_at)
  SELECT r.id, p.id, 1, now()
  FROM roles r, permissions p
  WHERE r.name = p_role_name
    AND p.name = p_permission_name
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ADMIN: Todas as permissões
INSERT INTO role_permissions (role_id, permission_id, created_by, created_at)
SELECT r.id, p.id, 1, now()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- COORDENADOR: Acesso amplo exceto gestão de usuários e configurações
SELECT assign_permission_to_role('Coordenador', 'view_people');
SELECT assign_permission_to_role('Coordenador', 'create_people');
SELECT assign_permission_to_role('Coordenador', 'edit_people');
SELECT assign_permission_to_role('Coordenador', 'view_students');
SELECT assign_permission_to_role('Coordenador', 'create_students');
SELECT assign_permission_to_role('Coordenador', 'edit_students');
SELECT assign_permission_to_role('Coordenador', 'view_teachers');
SELECT assign_permission_to_role('Coordenador', 'create_teachers');
SELECT assign_permission_to_role('Coordenador', 'edit_teachers');
SELECT assign_permission_to_role('Coordenador', 'view_schools');
SELECT assign_permission_to_role('Coordenador', 'edit_schools');
SELECT assign_permission_to_role('Coordenador', 'view_classes');
SELECT assign_permission_to_role('Coordenador', 'create_classes');
SELECT assign_permission_to_role('Coordenador', 'edit_classes');
SELECT assign_permission_to_role('Coordenador', 'view_enrollments');
SELECT assign_permission_to_role('Coordenador', 'create_enrollments');
SELECT assign_permission_to_role('Coordenador', 'edit_enrollments');
SELECT assign_permission_to_role('Coordenador', 'view_grades');
SELECT assign_permission_to_role('Coordenador', 'edit_grades');
SELECT assign_permission_to_role('Coordenador', 'view_attendance');
SELECT assign_permission_to_role('Coordenador', 'edit_attendance');
SELECT assign_permission_to_role('Coordenador', 'view_documents');
SELECT assign_permission_to_role('Coordenador', 'create_documents');
SELECT assign_permission_to_role('Coordenador', 'view_communications');
SELECT assign_permission_to_role('Coordenador', 'create_communications');
SELECT assign_permission_to_role('Coordenador', 'view_protocols');
SELECT assign_permission_to_role('Coordenador', 'view_reports');
SELECT assign_permission_to_role('Coordenador', 'export_reports');

-- DIRETOR: Acesso total à sua escola
SELECT assign_permission_to_role('Diretor', 'view_people');
SELECT assign_permission_to_role('Diretor', 'create_people');
SELECT assign_permission_to_role('Diretor', 'edit_people');
SELECT assign_permission_to_role('Diretor', 'view_students');
SELECT assign_permission_to_role('Diretor', 'create_students');
SELECT assign_permission_to_role('Diretor', 'edit_students');
SELECT assign_permission_to_role('Diretor', 'view_teachers');
SELECT assign_permission_to_role('Diretor', 'create_teachers');
SELECT assign_permission_to_role('Diretor', 'edit_teachers');
SELECT assign_permission_to_role('Diretor', 'view_schools');
SELECT assign_permission_to_role('Diretor', 'edit_schools');
SELECT assign_permission_to_role('Diretor', 'view_classes');
SELECT assign_permission_to_role('Diretor', 'create_classes');
SELECT assign_permission_to_role('Diretor', 'edit_classes');
SELECT assign_permission_to_role('Diretor', 'view_enrollments');
SELECT assign_permission_to_role('Diretor', 'create_enrollments');
SELECT assign_permission_to_role('Diretor', 'edit_enrollments');
SELECT assign_permission_to_role('Diretor', 'view_grades');
SELECT assign_permission_to_role('Diretor', 'view_attendance');
SELECT assign_permission_to_role('Diretor', 'view_documents');
SELECT assign_permission_to_role('Diretor', 'create_documents');
SELECT assign_permission_to_role('Diretor', 'view_communications');
SELECT assign_permission_to_role('Diretor', 'create_communications');
SELECT assign_permission_to_role('Diretor', 'view_protocols');
SELECT assign_permission_to_role('Diretor', 'create_protocols');
SELECT assign_permission_to_role('Diretor', 'view_reports');
SELECT assign_permission_to_role('Diretor', 'export_reports');

-- SECRETÁRIO: Acesso a funções administrativas
SELECT assign_permission_to_role('Secretário', 'view_people');
SELECT assign_permission_to_role('Secretário', 'view_students');
SELECT assign_permission_to_role('Secretário', 'create_students');
SELECT assign_permission_to_role('Secretário', 'edit_students');
SELECT assign_permission_to_role('Secretário', 'view_teachers');
SELECT assign_permission_to_role('Secretário', 'view_schools');
SELECT assign_permission_to_role('Secretário', 'view_classes');
SELECT assign_permission_to_role('Secretário', 'view_enrollments');
SELECT assign_permission_to_role('Secretário', 'create_enrollments');
SELECT assign_permission_to_role('Secretário', 'edit_enrollments');
SELECT assign_permission_to_role('Secretário', 'view_documents');
SELECT assign_permission_to_role('Secretário', 'create_documents');
SELECT assign_permission_to_role('Secretário', 'view_protocols');
SELECT assign_permission_to_role('Secretário', 'create_protocols');
SELECT assign_permission_to_role('Secretário', 'edit_protocols');

-- PROFESSOR: Acesso a suas turmas
SELECT assign_permission_to_role('Professor', 'view_students');
SELECT assign_permission_to_role('Professor', 'view_classes');
SELECT assign_permission_to_role('Professor', 'view_enrollments');
SELECT assign_permission_to_role('Professor', 'view_grades');
SELECT assign_permission_to_role('Professor', 'create_grades');
SELECT assign_permission_to_role('Professor', 'edit_grades');
SELECT assign_permission_to_role('Professor', 'view_attendance');
SELECT assign_permission_to_role('Professor', 'create_attendance');
SELECT assign_permission_to_role('Professor', 'edit_attendance');
SELECT assign_permission_to_role('Professor', 'view_communications');

-- ALUNO: Acesso apenas aos próprios dados
SELECT assign_permission_to_role('Aluno', 'view_grades');
SELECT assign_permission_to_role('Aluno', 'view_attendance');
SELECT assign_permission_to_role('Aluno', 'view_documents');
SELECT assign_permission_to_role('Aluno', 'view_communications');

-- RESPONSÁVEL: Acesso aos dados dos filhos
SELECT assign_permission_to_role('Responsável', 'view_students');
SELECT assign_permission_to_role('Responsável', 'view_grades');
SELECT assign_permission_to_role('Responsável', 'view_attendance');
SELECT assign_permission_to_role('Responsável', 'view_documents');
SELECT assign_permission_to_role('Responsável', 'view_communications');

-- Remover função auxiliar
DROP FUNCTION IF EXISTS assign_permission_to_role(VARCHAR, VARCHAR);

-- =====================================================
-- 7. INSERIR POSITIONS (CARGOS) PADRÃO
-- =====================================================

INSERT INTO positions (name, description, created_by, created_at) VALUES
('Diretor', 'Diretor da escola', 1, now()),
('Vice-Diretor', 'Vice-diretor da escola', 1, now()),
('Coordenador Pedagógico', 'Coordenador pedagógico', 1, now()),
('Secretário Escolar', 'Secretário escolar', 1, now()),
('Assistente Administrativo', 'Assistente administrativo', 1, now()),
('Auxiliar de Serviços Gerais', 'Auxiliar de serviços gerais', 1, now()),
('Merendeira', 'Merendeira', 1, now()),
('Porteiro', 'Porteiro', 1, now()),
('Bibliotecário', 'Bibliotecário', 1, now()),
('Inspetor', 'Inspetor de alunos', 1, now())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 8. INSERIR DEPARTMENTS (DEPARTAMENTOS) PADRÃO
-- =====================================================

INSERT INTO departments (name, description, created_by, created_at) VALUES
('Administração', 'Departamento administrativo', 1, now()),
('Pedagógico', 'Departamento pedagógico', 1, now()),
('Secretaria', 'Secretaria escolar', 1, now()),
('Serviços Gerais', 'Departamento de serviços gerais', 1, now()),
('Biblioteca', 'Biblioteca escolar', 1, now()),
('Alimentação', 'Departamento de alimentação escolar', 1, now()),
('Segurança', 'Departamento de segurança', 1, now())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 9. ATUALIZAR auth_users PARA FK person_id
-- =====================================================

-- Adicionar Foreign Key de person_id para people
ALTER TABLE auth_users
  ADD CONSTRAINT fk_auth_users_person_id
  FOREIGN KEY (person_id) REFERENCES people(id)
  ON DELETE SET NULL;

-- =====================================================
-- FIM DA MIGRATION 004
-- Total: 7 roles, 60 permissions, 10 positions, 7 departments
-- Associações: Admin (todas), Coordenador (25), Diretor (23),
--             Secretário (14), Professor (10), Aluno (4), Responsável (5)
-- =====================================================

