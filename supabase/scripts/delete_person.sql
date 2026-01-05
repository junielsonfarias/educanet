-- =====================================================
-- Script para Excluir Pessoa do Banco de Dados
-- =====================================================
-- ATENÇÃO: Este script exclui uma pessoa e suas dependências
-- Use com cuidado!
-- =====================================================

-- =====================================================
-- OPÇÃO 1: Excluir pessoa específica por ID
-- =====================================================
-- Substitua 2 pelo ID da pessoa que deseja excluir

-- Verificar dependências antes de excluir
SELECT 
  'Pessoa' as tipo,
  id,
  first_name || ' ' || last_name as nome,
  email,
  type
FROM people
WHERE id = 2;  -- Substitua pelo ID desejado

-- Verificar se há usuário auth associado
SELECT 
  'Auth User' as tipo,
  au.id,
  au.email,
  au.person_id
FROM auth_users au
WHERE au.person_id = 2;  -- Substitua pelo ID desejado

-- Verificar roles associados
SELECT 
  'User Roles' as tipo,
  ur.id,
  r.name as role
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.person_id = 2;  -- Substitua pelo ID desejado

-- =====================================================
-- EXCLUIR (Soft Delete - Recomendado)
-- =====================================================
-- Isso marca como deletado mas preserva os dados

-- 1. Desativar usuário auth (se existir)
UPDATE auth_users
SET active = false,
    deleted_at = now()
WHERE person_id = 2;  -- Substitua pelo ID desejado

-- 2. Remover roles (soft delete)
UPDATE user_roles
SET deleted_at = now()
WHERE person_id = 2;  -- Substitua pelo ID desejado

-- 3. Excluir pessoa (soft delete)
UPDATE people
SET deleted_at = now()
WHERE id = 2;  -- Substitua pelo ID desejado

-- =====================================================
-- EXCLUIR PERMANENTEMENTE (CUIDADO!)
-- =====================================================
-- Descomente apenas se tiver certeza que quer deletar permanentemente
-- Isso remove os dados do banco!

/*
-- 1. Remover roles
DELETE FROM user_roles
WHERE person_id = 2;  -- Substitua pelo ID desejado

-- 2. Remover auth_user (se existir)
-- NOTA: Não podemos deletar diretamente de auth.users via SQL
-- Você precisa deletar manualmente no Supabase Dashboard
-- Authentication > Users > [seu usuário] > Delete

-- 3. Remover pessoa
DELETE FROM people
WHERE id = 2;  -- Substitua pelo ID desejado
*/

-- =====================================================
-- OPÇÃO 2: Excluir pessoa por email
-- =====================================================
-- Use este script se souber o email da pessoa

/*
-- Verificar pessoa por email
SELECT 
  id,
  first_name || ' ' || last_name as nome,
  email,
  type
FROM people
WHERE email = 'admin@edugestao.com';  -- Substitua pelo email

-- Excluir (soft delete)
UPDATE auth_users
SET active = false,
    deleted_at = now()
WHERE email = 'admin@edugestao.com';  -- Substitua pelo email

UPDATE user_roles
SET deleted_at = now()
WHERE person_id = (
  SELECT id FROM people WHERE email = 'admin@edugestao.com'
);

UPDATE people
SET deleted_at = now()
WHERE email = 'admin@edugestao.com';  -- Substitua pelo email
*/

-- =====================================================
-- OPÇÃO 3: Listar todas as pessoas para escolher
-- =====================================================
SELECT 
  id,
  first_name || ' ' || last_name as nome,
  email,
  type,
  created_at,
  deleted_at
FROM people
ORDER BY id;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

