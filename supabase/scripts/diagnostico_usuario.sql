-- ============================================
-- DIAGNÓSTICO DE USUÁRIO ADMINISTRADOR
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se o usuário existe em auth.users (Supabase Auth)
SELECT
  '=== 1. SUPABASE AUTH (auth.users) ===' as secao,
  CASE
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'junielsonfarias@gmail.com')
    THEN '✅ Usuário EXISTE no Supabase Auth'
    ELSE '❌ Usuário NÃO EXISTE no Supabase Auth - CRIAR NO DASHBOARD!'
  END as status;

-- Detalhes do auth.users (se existir)
SELECT
  'Detalhes auth.users' as info,
  id,
  email,
  email_confirmed_at,
  CASE
    WHEN email_confirmed_at IS NULL
    THEN '❌ Email NÃO confirmado - Confirme ou desative confirmação'
    ELSE '✅ Email confirmado'
  END as confirmacao_email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'junielsonfarias@gmail.com';

-- 2. Verificar se existe na tabela people
SELECT
  '=== 2. TABELA PEOPLE ===' as secao,
  CASE
    WHEN EXISTS (SELECT 1 FROM people WHERE email = 'junielsonfarias@gmail.com' AND deleted_at IS NULL)
    THEN '✅ Pessoa EXISTE na tabela people'
    ELSE '❌ Pessoa NÃO EXISTE na tabela people'
  END as status;

-- Detalhes da pessoa
SELECT
  'Detalhes people' as info,
  id,
  type,
  first_name,
  last_name,
  email,
  deleted_at
FROM people
WHERE email = 'junielsonfarias@gmail.com';

-- 3. Verificar se existe na tabela auth_users
SELECT
  '=== 3. TABELA AUTH_USERS ===' as secao,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM auth_users au
      JOIN auth.users u ON u.id = au.id
      WHERE u.email = 'junielsonfarias@gmail.com'
    )
    THEN '✅ Vínculo EXISTE na tabela auth_users'
    ELSE '❌ Vínculo NÃO EXISTE na tabela auth_users'
  END as status;

-- Detalhes do auth_users
SELECT
  'Detalhes auth_users' as info,
  au.id,
  au.email,
  au.person_id,
  au.active,
  CASE
    WHEN au.active = false
    THEN '❌ Usuário INATIVO'
    ELSE '✅ Usuário ATIVO'
  END as status_ativo,
  au.created_at
FROM auth_users au
WHERE au.email = 'junielsonfarias@gmail.com';

-- 4. Verificar roles do usuário
SELECT
  '=== 4. ROLES DO USUÁRIO ===' as secao,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN people p ON p.id = ur.person_id
      JOIN roles r ON r.id = ur.role_id
      WHERE p.email = 'junielsonfarias@gmail.com'
        AND ur.deleted_at IS NULL
        AND r.name = 'Admin'
    )
    THEN '✅ Usuário TEM role Admin'
    ELSE '❌ Usuário NÃO TEM role Admin'
  END as status;

-- Detalhes das roles
SELECT
  'Detalhes roles' as info,
  p.first_name || ' ' || p.last_name as nome,
  r.name as role_name,
  ur.created_at
FROM user_roles ur
JOIN people p ON p.id = ur.person_id
JOIN roles r ON r.id = ur.role_id
WHERE p.email = 'junielsonfarias@gmail.com'
  AND ur.deleted_at IS NULL;

-- ============================================
-- RESUMO FINAL E INSTRUÇÕES
-- ============================================
SELECT
  '=== RESUMO FINAL ===' as titulo,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'junielsonfarias@gmail.com')
    THEN '❌ AÇÃO NECESSÁRIA: Crie o usuário no Dashboard > Authentication > Users > Add User'
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'junielsonfarias@gmail.com' AND email_confirmed_at IS NULL)
    THEN '❌ AÇÃO NECESSÁRIA: Confirme o email ou desative confirmação em Authentication > Settings'
    WHEN NOT EXISTS (SELECT 1 FROM auth_users WHERE email = 'junielsonfarias@gmail.com' AND active = true)
    THEN '❌ AÇÃO NECESSÁRIA: Execute o script criar_admin_producao.sql novamente'
    ELSE '✅ Tudo configurado corretamente - Tente fazer login novamente'
  END as instrucao;
