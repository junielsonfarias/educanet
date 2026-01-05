-- ============================================
-- CORREÇÃO RÁPIDA DO LOGIN ADMIN (CORRIGIDO)
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- IMPORTANTE: Substitua 'junielsonfarias@gmail.com' pelo email do seu usuário admin
-- se for diferente

-- 1. Garantir que a pessoa existe (não está deletada)
UPDATE people
SET updated_at = now()
WHERE email = 'junielsonfarias@gmail.com' AND deleted_at IS NULL;

-- 2. Criar/Atualizar registro em auth_users vinculando ao auth.users
INSERT INTO auth_users (id, email, person_id, active, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  p.id,
  true,
  COALESCE(au.created_at, now()),
  now()
FROM auth.users u
CROSS JOIN LATERAL (
  SELECT id FROM people 
  WHERE email = u.email 
    AND deleted_at IS NULL 
  LIMIT 1
) p
LEFT JOIN auth_users au ON au.id = u.id
WHERE u.email = 'junielsonfarias@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  person_id = EXCLUDED.person_id,
  active = true,
  updated_at = now(),
  email = EXCLUDED.email;

-- 3. Vincular role Admin (se não estiver vinculado)
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

-- 4. Verificação final - deve retornar 1 linha com todos os dados
SELECT 
  '✅ Status Final' as status,
  au.id as auth_id,
  au.email,
  au.person_id,
  au.active as auth_active,
  CASE WHEN p.deleted_at IS NULL THEN 'Ativo' ELSE 'Deletado' END as person_status,
  p.first_name || ' ' || p.last_name as nome,
  r.name as role,
  CASE 
    WHEN au.id IS NOT NULL AND au.person_id IS NOT NULL AND au.active = true 
         AND p.deleted_at IS NULL AND r.name = 'Admin' 
    THEN '✅ TUDO OK'
    ELSE '❌ VERIFICAR'
  END as resultado
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id AND p.deleted_at IS NULL
LEFT JOIN user_roles ur ON ur.person_id = p.id AND ur.deleted_at IS NULL
LEFT JOIN roles r ON r.id = ur.role_id
WHERE au.email = 'junielsonfarias@gmail.com';

