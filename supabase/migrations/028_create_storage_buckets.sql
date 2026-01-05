-- =====================================================
-- MIGRATION 028: CRIAR STORAGE BUCKETS E POLÍTICAS RLS
-- =====================================================
-- Esta migration cria os buckets de storage necessários
-- e configura as políticas RLS para controle de acesso.
-- =====================================================

-- ==================== CRIAR BUCKETS ====================

-- Bucket para avatares (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Público
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Bucket para documentos (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Privado
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

-- Bucket para anexos (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false, -- Privado
 10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

-- Bucket para fotos (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true, -- Público
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- ==================== POLÍTICAS RLS PARA AVATARS ====================

-- Política: Todos podem ler avatares (bucket público)
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Política: Usuários autenticados podem fazer upload de avatares
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);

-- Política: Usuários podem atualizar seus próprios avatares ou admin pode atualizar qualquer um
CREATE POLICY "Users can update their own avatars or admin can update any"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
  )
);

-- Política: Usuários podem deletar seus próprios avatares ou admin pode deletar qualquer um
CREATE POLICY "Users can delete their own avatars or admin can delete any"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
  )
);

-- ==================== POLÍTICAS RLS PARA DOCUMENTS ====================

-- Política: Usuários autenticados podem ler documentos
CREATE POLICY "Authenticated users can view documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
);

-- Política: Usuários autenticados podem fazer upload de documentos
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
);

-- Política: Usuários podem atualizar seus próprios documentos ou admin pode atualizar qualquer um
CREATE POLICY "Users can update their own documents or admin can update any"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
  )
);

-- Política: Usuários podem deletar seus próprios documentos ou admin pode deletar qualquer um
CREATE POLICY "Users can delete their own documents or admin can delete any"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
  )
);

-- ==================== POLÍTICAS RLS PARA ATTACHMENTS ====================

-- Política: Usuários autenticados podem ler anexos
CREATE POLICY "Authenticated users can view attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'attachments'
  AND auth.uid() IS NOT NULL
);

-- Política: Usuários autenticados podem fazer upload de anexos
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.uid() IS NOT NULL
);

-- Política: Usuários podem atualizar seus próprios anexos ou admin pode atualizar qualquer um
CREATE POLICY "Users can update their own attachments or admin can update any"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
  )
);

-- Política: Usuários podem deletar seus próprios anexos ou admin pode deletar qualquer um
CREATE POLICY "Users can delete their own attachments or admin can delete any"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
  )
);

-- ==================== POLÍTICAS RLS PARA PHOTOS ====================

-- Política: Todos podem ler fotos (bucket público)
CREATE POLICY "Public can view photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'photos');

-- Política: Usuários autenticados podem fazer upload de fotos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'photos'
  AND auth.uid() IS NOT NULL
);

-- Política: Usuários podem atualizar suas próprias fotos ou admin pode atualizar qualquer uma
CREATE POLICY "Users can update their own photos or admin can update any"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'photos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
  )
);

-- Política: Usuários podem deletar suas próprias fotos ou admin pode deletar qualquer uma
CREATE POLICY "Users can delete their own photos or admin can delete any"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'photos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM auth_users au
      JOIN user_roles ur ON au.person_id = ur.person_id
      JOIN roles r ON ur.role_id = r.id
      WHERE au.id = auth.uid()
        AND r.name = 'Admin'
        AND ur.deleted_at IS NULL
    )
  )
);

