-- Script de Diagnóstico e Correção do Login do Administrador
-- Execute este script no SQL Editor do Supabase para diagnosticar e corrigir problemas de login

-- ============================================
-- PARTE 1: DIAGNÓSTICO
-- ============================================

-- 1. Verificar se o usuário existe no Supabase Auth
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'junielsonfarias@gmail.com';

-- 2. Verificar se existe registro em auth_users
SELECT 
  au.id as auth_id,
  au.email,
  au.person_id,
  au.active,
  au.created_at,
  au.updated_at,
  au.last_login,
  p.id as person_id_check,
  p.first_name || ' ' || p.last_name as nome_pessoa,
  p.type as tipo_pessoa
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id
WHERE au.email = 'junielsonfarias@gmail.com';

-- 3. Verificar se existe pessoa vinculada
SELECT 
  id,
  email,
  first_name,
  last_name,
  type,
  deleted_at,
  CASE WHEN deleted_at IS NULL THEN 'Ativo' ELSE 'Deletado' END as status
FROM people
WHERE email = 'junielsonfarias@gmail.com' OR id = 2;

-- 4. Verificar roles do usuário
SELECT 
  ur.id,
  ur.person_id,
  ur.role_id,
  r.name as role_name,
  ur.created_at,
  ur.deleted_at
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.person_id = 2 AND ur.deleted_at IS NULL;

-- 5. Verificar se o role "Admin" existe
SELECT id, name, description, default_for_person_type
FROM roles
WHERE name = 'Admin';

-- ============================================
-- PARTE 2: CORREÇÃO AUTOMÁTICA
-- ============================================

-- IMPORTANTE: Execute apenas se o diagnóstico mostrar problemas
-- Descomente as seções abaixo conforme necessário

-- A. Criar/Atualizar registro em auth_users
-- Primeiro, obtenha o ID do usuário do Supabase Auth (da consulta acima)
-- Substitua 'SEU_AUTH_USER_ID' pelo ID real do auth.users

/*
INSERT INTO auth_users (id, email, person_id, active, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  p.id,
  true,
  now(),
  now()
FROM auth.users u
CROSS JOIN LATERAL (
  SELECT id FROM people 
  WHERE email = u.email 
    AND deleted_at IS NULL 
  LIMIT 1
) p
WHERE u.email = 'junielsonfarias@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  person_id = EXCLUDED.person_id,
  active = true,
  updated_at = now(),
  email = EXCLUDED.email;
*/

-- B. Vincular role Admin ao usuário (se não estiver vinculado)
/*
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
*/

-- C. Garantir que a pessoa está ativa
/*
UPDATE people
SET active = true, updated_at = now()
WHERE email = 'junielsonfarias@gmail.com' AND deleted_at IS NULL;
*/

-- ============================================
-- PARTE 3: VERIFICAÇÃO FINAL
-- ============================================

-- Execute esta consulta após as correções para verificar se tudo está OK
SELECT 
  'auth.users' as tabela,
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  NULL as person_id,
  NULL as active,
  NULL as role
FROM auth.users u
WHERE u.email = 'junielsonfarias@gmail.com'

UNION ALL

SELECT 
  'auth_users' as tabela,
  au.id,
  au.email,
  NULL as email_confirmado,
  au.person_id::text,
  au.active::text,
  NULL as role
FROM auth_users au
WHERE au.email = 'junielsonfarias@gmail.com'

UNION ALL

SELECT 
  'people' as tabela,
  p.id::text,
  p.email,
  NULL as email_confirmado,
  p.id::text,
  CASE WHEN p.deleted_at IS NULL THEN 'Ativo' ELSE 'Deletado' END as status,
  NULL as role
FROM people p
WHERE p.email = 'junielsonfarias@gmail.com' AND p.deleted_at IS NULL

UNION ALL

SELECT 
  'user_roles' as tabela,
  ur.id::text,
  p.email,
  NULL as email_confirmado,
  ur.person_id::text,
  NULL as active,
  r.name as role
FROM user_roles ur
JOIN people p ON p.id = ur.person_id
JOIN roles r ON r.id = ur.role_id
WHERE p.email = 'junielsonfarias@gmail.com' 
  AND ur.deleted_at IS NULL
ORDER BY tabela, id;

