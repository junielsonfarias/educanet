import { supabase } from './client'
import { handleSupabaseError } from './helpers'

/**
 * Tipos de arquivos permitidos por bucket
 */
export const ALLOWED_FILE_TYPES = {
  avatars: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  photos: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  attachments: [
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
    'text/plain',
  ],
} as const

/**
 * Tamanhos máximos de arquivo por bucket (em bytes)
 */
export const MAX_FILE_SIZES = {
  avatars: 5 * 1024 * 1024, // 5MB
  documents: 10 * 1024 * 1024, // 10MB
  photos: 10 * 1024 * 1024, // 10MB
  attachments: 10 * 1024 * 1024, // 10MB
} as const

export type BucketName = 'avatars' | 'documents' | 'photos' | 'attachments'

/**
 * Interface para resultado de upload
 */
export interface UploadResult {
  success: boolean
  path?: string
  publicUrl?: string
  error?: string
}

/**
 * Interface para opções de upload
 */
export interface UploadOptions {
  bucket: BucketName
  file: File
  path?: string // Caminho dentro do bucket (ex: 'user-123/avatar.jpg')
  upsert?: boolean // Se true, substitui arquivo existente
  cacheControl?: string // Cache control header (ex: '3600')
  contentType?: string // Content type override
}

/**
 * Valida o tipo de arquivo antes do upload
 */
export function validateFileType(
  file: File,
  bucket: BucketName,
): { valid: boolean; error?: string } {
  const allowedTypes = ALLOWED_FILE_TYPES[bucket]
  const fileType = file.type

  if (!allowedTypes.includes(fileType as any)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Valida o tamanho do arquivo antes do upload
 */
export function validateFileSize(
  file: File,
  bucket: BucketName,
): { valid: boolean; error?: string } {
  const maxSize = MAX_FILE_SIZES[bucket]
  const fileSize = file.size

  if (fileSize > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
    }
  }

  return { valid: true }
}

/**
 * Gera um caminho único para o arquivo
 */
function generateFilePath(bucket: BucketName, file: File, customPath?: string): string {
  if (customPath) {
    return customPath
  }

  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop()
  const fileName = file.name.replace(/\s+/g, '-').toLowerCase()

  return `${bucket}/${timestamp}-${randomString}-${fileName}`
}

/**
 * Faz upload de um arquivo para o Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  try {
    const { bucket, file, path, upsert = false, cacheControl, contentType } = options

    // Validações
    const typeValidation = validateFileType(file, bucket)
    if (!typeValidation.valid) {
      return {
        success: false,
        error: typeValidation.error,
      }
    }

    const sizeValidation = validateFileSize(file, bucket)
    if (!sizeValidation.valid) {
      return {
        success: false,
        error: sizeValidation.error,
      }
    }

    // Gera caminho do arquivo
    const filePath = generateFilePath(bucket, file, path)

    // Faz upload
    const uploadOptions: any = {
      cacheControl: cacheControl || '3600',
      upsert,
    }

    if (contentType) {
      uploadOptions.contentType = contentType
    }

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, uploadOptions)

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      }
    }

    // Obtém URL pública
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer upload',
    }
  }
}

/**
 * Deleta um arquivo do Supabase Storage
 */
export async function deleteFile(
  bucket: BucketName,
  path: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao deletar arquivo',
    }
  }
}

/**
 * Obtém URL pública de um arquivo
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Obtém URL assinada (temporária) de um arquivo privado
 */
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600, // 1 hora padrão
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      }
    }

    return {
      success: true,
      url: data.signedUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar URL assinada',
    }
  }
}

/**
 * Lista arquivos em um bucket
 */
export async function listFiles(
  bucket: BucketName,
  path?: string,
  limit?: number,
  offset?: number,
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    let query = supabase.storage.from(bucket).list(path || '', {
      limit: limit || 100,
      offset: offset || 0,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      }
    }

    return {
      success: true,
      files: data || [],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao listar arquivos',
    }
  }
}

/**
 * Verifica se um arquivo existe no bucket
 */
export async function fileExists(
  bucket: BucketName,
  path: string,
): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path.split('/').slice(0, -1).join('/'))

    if (error) {
      return {
        exists: false,
        error: handleSupabaseError(error),
      }
    }

    const fileName = path.split('/').pop()
    const exists = data?.some((file) => file.name === fileName) || false

    return { exists }
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar arquivo',
    }
  }
}

/**
 * Faz download de um arquivo
 */
export async function downloadFile(
  bucket: BucketName,
  path: string,
): Promise<{ success: boolean; data?: Blob; error?: string }> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) {
      return {
        success: false,
        error: handleSupabaseError(error),
      }
    }

    return {
      success: true,
      data: data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer download',
    }
  }
}

