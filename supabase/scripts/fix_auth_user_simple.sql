-- =====================================================
-- SCRIPT SIMPLES: Corrigir auth_users
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Criar ou atualizar registro em auth_users
INSERT INTO auth_users (id, email, person_id, active, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  p.id as person_id,
  true,
  now(),
  now()
FROM auth.users u
JOIN people p ON p.email = u.email AND p.deleted_at IS NULL
WHERE u.email = 'junielsonfarias@gmail.com'  -- ⚠️ ALTERE O EMAIL SE NECESSÁRIO
ON CONFLICT (id) 
DO UPDATE SET
  person_id = EXCLUDED.person_id,
  email = EXCLUDED.email,
  active = true,
  updated_at = now();

-- Verificar resultado
SELECT 
  au.id as auth_id,
  au.email,
  au.person_id,
  au.active,
  p.first_name || ' ' || p.last_name as nome,
  r.name as role
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id
LEFT JOIN user_roles ur ON ur.person_id = p.id AND ur.deleted_at IS NULL
LEFT JOIN roles r ON r.id = ur.role_id
WHERE au.email = 'junielsonfarias@gmail.com';  -- ⚠️ ALTERE O EMAIL SE NECESSÁRIO

