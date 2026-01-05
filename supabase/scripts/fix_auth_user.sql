-- =====================================================
-- SCRIPT: Corrigir/Criar registro auth_users para login
-- =====================================================
-- Este script cria ou atualiza o registro em auth_users
-- vinculando o usuário do Supabase Auth à pessoa no banco
-- =====================================================

-- =====================================================
-- PASSO 1: Verificar situação atual
-- =====================================================

-- Verificar usuário no auth.users
SELECT 
  'auth.users' as tabela,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'junielsonfarias@gmail.com';

-- Verificar registro em auth_users
SELECT 
  'auth_users' as tabela,
  au.id as auth_id,
  au.email,
  au.person_id,
  au.active,
  p.first_name || ' ' || p.last_name as nome_pessoa
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id
WHERE au.email = 'junielsonfarias@gmail.com';

-- =====================================================
-- PASSO 2: Criar/Atualizar registro em auth_users
-- =====================================================

DO $$
DECLARE
  v_auth_user_id UUID;
  v_person_id INTEGER;
  v_email TEXT := 'junielsonfarias@gmail.com';
BEGIN
  -- 1. Buscar ID do usuário no auth.users
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'ERRO: Usuário não encontrado no auth.users com email: %. Crie o usuário primeiro no Supabase Dashboard (Authentication > Users).', v_email;
  END IF;
  
  -- 2. Buscar person_id da pessoa com este email
  SELECT id INTO v_person_id
  FROM people
  WHERE email = v_email
    AND deleted_at IS NULL
  LIMIT 1;
  
  IF v_person_id IS NULL THEN
    RAISE EXCEPTION 'ERRO: Pessoa não encontrada na tabela people com email: %. Crie a pessoa primeiro.', v_email;
  END IF;
  
  -- 3. Criar ou atualizar registro em auth_users
  INSERT INTO auth_users (id, email, person_id, active, created_at, updated_at)
  VALUES (v_auth_user_id, v_email, v_person_id, true, now(), now())
  ON CONFLICT (id) 
  DO UPDATE SET
    person_id = v_person_id,
    email = EXCLUDED.email,
    active = true,
    updated_at = now();
  
  RAISE NOTICE '✅ SUCESSO! Registro auth_users criado/atualizado!';
  RAISE NOTICE '   Auth User ID: %', v_auth_user_id;
  RAISE NOTICE '   Person ID: %', v_person_id;
  RAISE NOTICE '   Email: %', v_email;
END $$;

-- =====================================================
-- PASSO 3: Verificar resultado final
-- =====================================================

SELECT 
  'RESULTADO FINAL' as status,
  au.id as auth_id,
  au.email,
  au.person_id,
  au.active,
  p.first_name || ' ' || p.last_name as nome_pessoa,
  r.name as role,
  ur.deleted_at as role_deleted
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id
LEFT JOIN user_roles ur ON ur.person_id = p.id AND ur.deleted_at IS NULL
LEFT JOIN roles r ON r.id = ur.role_id
WHERE au.email = 'junielsonfarias@gmail.com';

-- =====================================================
-- PASSO 4: Verificar se há problemas de RLS
-- =====================================================

-- Verificar políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'auth_users';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

