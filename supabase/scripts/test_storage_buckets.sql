-- =====================================================
-- SCRIPT DE TESTE: VERIFICAR STORAGE BUCKETS
-- =====================================================
-- Este script verifica se os buckets foram criados
-- corretamente e se as políticas RLS estão funcionando.
-- =====================================================

-- ==================== VERIFICAR BUCKETS ====================

-- 1. Verificar se todos os buckets foram criados
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('avatars', 'documents', 'attachments', 'photos')
ORDER BY name;

-- Resultado esperado: 4 buckets

-- ==================== VERIFICAR POLÍTICAS RLS ====================

-- 2. Verificar políticas de SELECT para avatars
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- 3. Verificar políticas de SELECT para documents
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%document%'
ORDER BY policyname;

-- 4. Verificar políticas de SELECT para attachments
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%attachment%'
ORDER BY policyname;

-- 5. Verificar políticas de SELECT para photos
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%photo%'
ORDER BY policyname;

-- 6. Contar total de políticas criadas
SELECT 
  COUNT(*) as total_policies,
  COUNT(DISTINCT policyname) as unique_policies
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%avatar%' OR
    policyname LIKE '%document%' OR
    policyname LIKE '%attachment%' OR
    policyname LIKE '%photo%'
  );

-- Resultado esperado: 16 políticas (4 buckets × 4 operações: SELECT, INSERT, UPDATE, DELETE)

-- ==================== VERIFICAR CONFIGURAÇÕES ====================

-- 7. Verificar configurações dos buckets
SELECT 
  id as bucket_id,
  name,
  public as is_public,
  file_size_limit / 1024 / 1024 as max_size_mb,
  array_length(allowed_mime_types, 1) as allowed_types_count,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('avatars', 'documents', 'attachments', 'photos')
ORDER BY name;

-- ==================== RESUMO DE VERIFICAÇÃO ====================

-- 8. Resumo completo
SELECT 
  'Buckets criados' as verificacao,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as status
FROM storage.buckets
WHERE id IN ('avatars', 'documents', 'attachments', 'photos')

UNION ALL

SELECT 
  'Políticas RLS criadas' as verificacao,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) >= 16 THEN '✅ OK'
    ELSE '❌ FALTANDO'
  END as status
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%avatar%' OR
    policyname LIKE '%document%' OR
    policyname LIKE '%attachment%' OR
    policyname LIKE '%photo%'
  );

