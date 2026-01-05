-- ============================================
-- CRIAR USUÁRIO ADMINISTRADOR EM PRODUÇÃO
-- Execute este script no SQL Editor do Supabase
-- ============================================
--
-- IMPORTANTE:
-- 1. Primeiro crie o usuário no Supabase Auth (Dashboard > Authentication > Users > Add User)
--    Email: junielsonfarias@gmail.com
--    Password: Tiko6273@
--
-- 2. Depois execute este script para criar os registros nas tabelas do sistema
-- ============================================

-- Passo 1: Garantir que a role 'Admin' existe
INSERT INTO roles (name, description, created_at, updated_at)
VALUES ('Admin', 'Administrador do sistema com acesso total', now(), now())
ON CONFLICT (name) DO NOTHING;

-- Passo 2: Criar a pessoa (se não existir)
INSERT INTO people (type, first_name, last_name, email, created_at, updated_at, created_by)
SELECT
  'staff'::person_type,
  'Junielson',
  'Farias',
  'junielsonfarias@gmail.com',
  now(),
  now(),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM people
  WHERE email = 'junielsonfarias@gmail.com'
    AND deleted_at IS NULL
);

-- Passo 3: Atualizar pessoa se já existe (para garantir que não está deletada)
UPDATE people
SET deleted_at = NULL, updated_at = now()
WHERE email = 'junielsonfarias@gmail.com';

-- Passo 4: Vincular auth_users ao auth.users do Supabase
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

-- Passo 5: Vincular role Admin ao usuário
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

-- Passo 6: Verificação final
SELECT
  '=== RESULTADO ===' as titulo,
  CASE
    WHEN au.id IS NOT NULL AND p.id IS NOT NULL AND r.name = 'Admin'
    THEN 'SUCESSO - Usuário admin criado corretamente!'
    ELSE 'ERRO - Verifique os passos acima'
  END as status
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id AND p.deleted_at IS NULL
LEFT JOIN user_roles ur ON ur.person_id = p.id AND ur.deleted_at IS NULL
LEFT JOIN roles r ON r.id = ur.role_id
WHERE au.email = 'junielsonfarias@gmail.com';

-- Detalhes do usuário
SELECT
  'DETALHES' as info,
  au.id as auth_id,
  au.email,
  p.first_name || ' ' || p.last_name as nome,
  r.name as role,
  au.active
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id AND p.deleted_at IS NULL
LEFT JOIN user_roles ur ON ur.person_id = p.id AND ur.deleted_at IS NULL
LEFT JOIN roles r ON r.id = ur.role_id
WHERE au.email = 'junielsonfarias@gmail.com';
