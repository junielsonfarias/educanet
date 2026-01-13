/**
 * Script de teste para verificar Storage Buckets do Supabase
 * 
 * Execute no console do navegador após fazer login:
 * 
 * import { testStorageBuckets } from '@/lib/supabase/test-storage'
 * testStorageBuckets()
 */

import { supabase } from './client'
import { uploadFile, deleteFile } from './storage'
import { toast } from 'sonner'

const isDev = import.meta.env.DEV

// Logger condicional que só exibe em desenvolvimento
const devLog = {
  log: (...args: unknown[]) => isDev && console.log(...args),
  warn: (...args: unknown[]) => isDev && console.warn(...args),
  table: (data: unknown) => isDev && console.table(data),
}

export interface StorageTestResult {
  bucket: string
  test: string
  success: boolean
  message: string
  details?: Record<string, unknown> | Error
}

/**
 * Testa se os buckets existem e estão acessíveis
 */
export async function testStorageBuckets(): Promise<StorageTestResult[]> {
  const results: StorageTestResult[] = []
  
  devLog.log('🧪 Iniciando testes de Storage Buckets...')
  
  const buckets: Array<'avatars' | 'documents' | 'attachments' | 'photos'> = [
    'avatars',
    'documents',
    'attachments',
    'photos',
  ]

  // Teste 1: Verificar se buckets existem
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', {
        limit: 1,
      })

      if (error) {
        results.push({
          bucket,
          test: 'Verificar existência',
          success: false,
          message: `Erro ao acessar bucket: ${error.message}`,
          details: error,
        })
      } else {
        results.push({
          bucket,
          test: 'Verificar existência',
          success: true,
          message: 'Bucket existe e está acessível',
        })
      }
    } catch (error: unknown) {
      results.push({
        bucket,
        test: 'Verificar existência',
        success: false,
        message: `Erro inesperado: ${(error as Error).message}`,
        details: error as Error,
      })
    }
  }

  // Teste 2: Verificar permissões de leitura (apenas para buckets públicos)
  const publicBuckets: Array<'avatars' | 'photos'> = ['avatars', 'photos']
  
  for (const bucket of publicBuckets) {
    try {
      // Tentar listar arquivos (deve funcionar mesmo sem autenticação para buckets públicos)
      const { data, error } = await supabase.storage.from(bucket).list('', {
        limit: 1,
      })

      if (error && error.message.includes('permission')) {
        results.push({
          bucket,
          test: 'Permissão de leitura pública',
          success: false,
          message: 'Bucket público não permite leitura pública',
          details: error,
        })
      } else {
        results.push({
          bucket,
          test: 'Permissão de leitura pública',
          success: true,
          message: 'Leitura pública funcionando',
        })
      }
    } catch (error: unknown) {
      results.push({
        bucket,
        test: 'Permissão de leitura pública',
        success: false,
        message: `Erro: ${(error as Error).message}`,
        details: error as Error,
      })
    }
  }

  // Teste 3: Verificar permissões de upload (requer autenticação)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Criar um arquivo de teste pequeno
    const testFile = new Blob(['test content'], { type: 'text/plain' })
    const testFileName = `test-${Date.now()}.txt`

    for (const bucket of buckets) {
      try {
        // Criar arquivo de teste apropriado para cada bucket
        let testFileObj: File
        
        if (bucket === 'avatars' || bucket === 'photos') {
          // Para buckets de imagens, criar um PNG fake
          const imageBlob = new Blob(['fake image data'], { type: 'image/png' })
          testFileObj = new File([imageBlob], `test-${Date.now()}.png`, { type: 'image/png' })
        } else if (bucket === 'documents' || bucket === 'attachments') {
          // Para buckets de documentos, criar um PDF fake ou texto
          const docBlob = new Blob(['test document content'], { type: 'text/plain' })
          testFileObj = new File([docBlob], `test-${Date.now()}.txt`, { type: 'text/plain' })
        } else {
          // Fallback
          testFileObj = new File([testFile], testFileName, { type: 'text/plain' })
        }

        // Tentar fazer upload
        const uploadResult = await uploadFile({
          bucket,
          file: testFileObj,
          path: `test/${testFileObj.name}`,
        })

        if (uploadResult.success) {
          results.push({
            bucket,
            test: 'Permissão de upload',
            success: true,
            message: 'Upload funcionando',
            details: { path: uploadResult.path },
          })

          // Limpar arquivo de teste
          if (uploadResult.path) {
            await deleteFile(bucket, uploadResult.path)
          }
        } else {
          results.push({
            bucket,
            test: 'Permissão de upload',
            success: false,
            message: uploadResult.error || 'Upload falhou',
            details: uploadResult,
          })
        }
      } catch (error: unknown) {
        results.push({
          bucket,
          test: 'Permissão de upload',
          success: false,
          message: `Erro: ${(error as Error).message}`,
          details: error as Error,
        })
      }
    }
  } else {
    results.push({
      bucket: 'all',
      test: 'Permissão de upload',
      success: false,
      message: 'Usuário não autenticado - não é possível testar upload',
    })
  }

  // Exibir resultados
  devLog.log('📊 Resultados dos Testes:')
  devLog.table(results)

  const successCount = results.filter((r) => r.success).length
  const totalCount = results.length

  if (successCount === totalCount) {
    devLog.log(`✅ Todos os testes passaram! (${successCount}/${totalCount})`)
    toast.success(`Testes de Storage: ${successCount}/${totalCount} passaram`)
  } else {
    devLog.warn(`⚠️ Alguns testes falharam: ${successCount}/${totalCount}`)
    toast.warning(`Testes de Storage: ${successCount}/${totalCount} passaram`)
  }

  return results
}

/**
 * Testa upload de arquivo em um bucket específico
 */
export async function testUploadFile(
  bucket: 'avatars' | 'documents' | 'attachments' | 'photos',
  file: File,
): Promise<StorageTestResult> {
  try {
    const result = await uploadFile({
      bucket,
      file,
      path: `test/${Date.now()}-${file.name}`,
    })

    if (result.success) {
      return {
        bucket,
        test: 'Upload de arquivo',
        success: true,
        message: 'Upload realizado com sucesso',
        details: { path: result.path, publicUrl: result.publicUrl },
      }
    } else {
      return {
        bucket,
        test: 'Upload de arquivo',
        success: false,
        message: result.error || 'Upload falhou',
        details: result,
      }
    }
  } catch (error: unknown) {
    return {
      bucket,
      test: 'Upload de arquivo',
      success: false,
      message: `Erro: ${(error as Error).message}`,
      details: error as Error,
    }
  }
}

// Expor globalmente para uso no console
if (typeof window !== 'undefined') {
  const windowWithTests = window as Window & {
    testStorageBuckets: typeof testStorageBuckets;
    testUploadFile: typeof testUploadFile;
  }
  windowWithTests.testStorageBuckets = testStorageBuckets
  windowWithTests.testUploadFile = testUploadFile
}

