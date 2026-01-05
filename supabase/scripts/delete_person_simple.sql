-- =====================================================
-- Script Simples para Excluir Pessoa
-- =====================================================
-- IMPORTANTE: Substitua o ID ou email pela pessoa que deseja excluir
-- =====================================================

-- =====================================================
-- PASSO 1: Listar todas as pessoas para identificar
-- =====================================================
SELECT 
  id,
  first_name || ' ' || last_name as nome,
  email,
  type,
  deleted_at
FROM people
ORDER BY id;

-- =====================================================
-- PASSO 2: Excluir pessoa por ID (Soft Delete)
-- =====================================================
-- Substitua 2 pelo ID da pessoa que deseja excluir

-- Desativar usuário auth (se existir)
UPDATE auth_users
SET active = false,
    deleted_at = now()
WHERE person_id = 2;  -- ⚠️ ALTERE O ID AQUI

-- Remover roles
UPDATE user_roles
SET deleted_at = now()
WHERE person_id = 2;  -- ⚠️ ALTERE O ID AQUI

-- Excluir pessoa
UPDATE people
SET deleted_at = now()
WHERE id = 2;  -- ⚠️ ALTERE O ID AQUI

-- =====================================================
-- OU: Excluir por email
-- =====================================================
/*
UPDATE auth_users
SET active = false,
    deleted_at = now()
WHERE email = 'admin@edugestao.com';  -- ⚠️ ALTERE O EMAIL AQUI

UPDATE user_roles
SET deleted_at = now()
WHERE person_id = (
  SELECT id FROM people WHERE email = 'admin@edugestao.com'  -- ⚠️ ALTERE O EMAIL AQUI
);

UPDATE people
SET deleted_at = now()
WHERE email = 'admin@edugestao.com';  -- ⚠️ ALTERE O EMAIL AQUI
*/

-- =====================================================
-- PASSO 3: Verificar se foi excluído
-- =====================================================
SELECT 
  id,
  first_name || ' ' || last_name as nome,
  email,
  deleted_at
FROM people
WHERE id = 2;  -- ⚠️ ALTERE O ID AQUI
-- Se deleted_at não for NULL, a pessoa foi excluída

-- =====================================================
-- NOTA: Para excluir PERMANENTEMENTE (não recomendado)
-- =====================================================
/*
-- CUIDADO: Isso remove os dados permanentemente!

DELETE FROM user_roles WHERE person_id = 2;
DELETE FROM people WHERE id = 2;
-- auth_users será deletado automaticamente quando deletar o usuário no Dashboard
*/

