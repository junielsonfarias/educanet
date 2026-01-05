-- ============================================
-- CORRIGIR USUÁRIO ADMINISTRADOR
-- Execute este script APÓS criar o usuário no Dashboard
-- ============================================

-- PASSO 1: Confirmar email do usuário (se necessário)
-- Isso resolve o problema de email não confirmado
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'junielsonfarias@gmail.com';

-- PASSO 2: Criar pessoa primeiro (se não existir)
INSERT INTO people (type, first_name, last_name, email, created_at, updated_at, created_by)
SELECT
  'Funcionario'::person_type,
  'Junielson',
  'Farias',
  'junielsonfarias@gmail.com',
  now(),
  now(),
  COALESCE((SELECT MIN(id) FROM people WHERE deleted_at IS NULL), 1)
WHERE NOT EXISTS (
  SELECT 1 FROM people
  WHERE email = 'junielsonfarias@gmail.com'
);

-- PASSO 3: Garantir que a role Admin existe (usando person_id como created_by)
INSERT INTO roles (name, description, created_at, updated_at, created_by)
SELECT
  'Admin',
  'Administrador do sistema com acesso total',
  now(),
  now(),
  (SELECT id FROM people WHERE email = 'junielsonfarias@gmail.com' AND deleted_at IS NULL LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'Admin'
);

-- Garantir que pessoa não está deletada
UPDATE people
SET deleted_at = NULL, updated_at = now()
WHERE email = 'junielsonfarias@gmail.com';

-- PASSO 4: Vincular auth_users ao auth.users
INSERT INTO auth_users (id, email, person_id, active, created_at, updated_at)
SELECT
  u.id,
  u.email,
  p.id,
  true,
  now(),
  now()
FROM auth.users u
CROSS JOIN (
  SELECT id FROM people
  WHERE email = 'junielsonfarias@gmail.com'
    AND deleted_at IS NULL
  LIMIT 1
) p
WHERE u.email = 'junielsonfarias@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  person_id = EXCLUDED.person_id,
  email = EXCLUDED.email,
  active = true,
  updated_at = now();

-- PASSO 5: Vincular role Admin
INSERT INTO user_roles (person_id, role_id, created_at, updated_at)
SELECT
  p.id,
  r.id,
  now(),
  now()
FROM people p
CROSS JOIN roles r
WHERE p.email = 'junielsonfarias@gmail.com'
  AND r.name = 'Admin'
  AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.person_id = p.id
      AND ur.role_id = r.id
      AND ur.deleted_at IS NULL
  );

-- VERIFICAÇÃO FINAL
SELECT
  '=== RESULTADO ===' as titulo,
  'Usuário corrigido com sucesso!' as status,
  u.email,
  u.email_confirmed_at as email_confirmado,
  au.active as ativo,
  p.first_name || ' ' || p.last_name as nome,
  r.name as role
FROM auth.users u
LEFT JOIN auth_users au ON au.id = u.id
LEFT JOIN people p ON p.id = au.person_id
LEFT JOIN user_roles ur ON ur.person_id = p.id AND ur.deleted_at IS NULL
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'junielsonfarias@gmail.com';
