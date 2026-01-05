/**
 * Script de Teste de Integração Supabase
 * 
 * Este arquivo contém funções de teste para validar a integração com Supabase.
 * Execute estas funções no console do navegador ou crie uma página de teste.
 */

import { supabase } from './client'
import { checkConnection, isSupabaseConfigured } from './helpers'
import { signIn, signOut, getCurrentUser, resetPassword } from './auth'
import { uploadFile, getPublicUrl, deleteFile, type BucketName } from './storage'
import { attachmentService } from './services/attachment-service'

export interface TestResult {
  name: string
  success: boolean
  message: string
  details?: any
}

/**
 * Testa a configuração básica do Supabase
 */
export async function testConfiguration(): Promise<TestResult> {
  try {
    const configured = isSupabaseConfigured()
    
    if (!configured) {
      return {
        name: 'Configuração',
        success: false,
        message: 'Variáveis de ambiente não configuradas',
      }
    }

    const connection = await checkConnection()
    
    return {
      name: 'Configuração',
      success: connection.success,
      message: connection.message,
      details: connection.details,
    }
  } catch (error) {
    return {
      name: 'Configuração',
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Testa autenticação básica
 */
export async function testAuthentication(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Teste 1: Verificar se há sessão ativa
  try {
    const { user, userData } = await getCurrentUser()
    results.push({
      name: 'Sessão Ativa',
      success: !!user,
      message: user ? `Usuário autenticado: ${user.email}` : 'Nenhuma sessão ativa',
      details: { user, userData },
    })
  } catch (error) {
    results.push({
      name: 'Sessão Ativa',
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    })
  }

  return results
}

/**
 * Testa login (requer credenciais válidas)
 */
export async function testLogin(email: string, password: string): Promise<TestResult> {
  try {
    const result = await signIn(email, password)
    
    return {
      name: 'Login',
      success: result.success,
      message: result.success 
        ? `Login bem-sucedido como ${result.user?.email}` 
        : result.error || 'Erro ao fazer login',
      details: {
        user: result.user,
        person_id: result.person_id,
        role: result.role,
      },
    }
  } catch (error) {
    return {
      name: 'Login',
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Testa logout
 */
export async function testLogout(): Promise<TestResult> {
  try {
    const result = await signOut()
    
    return {
      name: 'Logout',
      success: result.success,
      message: result.success ? 'Logout bem-sucedido' : result.error || 'Erro ao fazer logout',
    }
  } catch (error) {
    return {
      name: 'Logout',
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Testa Storage - Upload de arquivo
 */
export async function testStorageUpload(
  bucket: BucketName,
  file: File
): Promise<TestResult> {
  try {
    const result = await uploadFile({
      bucket,
      file,
      path: `test/${Date.now()}-${file.name}`,
    })

    return {
      name: 'Storage Upload',
      success: result.success,
      message: result.success 
        ? `Arquivo enviado com sucesso: ${result.path}` 
        : result.error || 'Erro ao fazer upload',
      details: {
        path: result.path,
        publicUrl: result.publicUrl,
      },
    }
  } catch (error) {
    return {
      name: 'Storage Upload',
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Testa Storage - Obter URL pública
 */
export async function testStorageGetUrl(
  bucket: BucketName,
  path: string
): Promise<TestResult> {
  try {
    const url = getPublicUrl(bucket, path)
    
    return {
      name: 'Storage Get URL',
      success: !!url,
      message: url ? `URL obtida: ${url}` : 'Erro ao obter URL',
      details: { url },
    }
  } catch (error) {
    return {
      name: 'Storage Get URL',
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Testa Attachment Service - Upload
 */
export async function testAttachmentUpload(
  file: File,
  entityType: 'student' | 'teacher' | 'school',
  entityId: number
): Promise<TestResult> {
  try {
    const attachment = await attachmentService.uploadAttachment(
      file,
      entityType,
      entityId,
      {
        bucket: 'attachments',
        description: 'Arquivo de teste',
      }
    )

    return {
      name: 'Attachment Upload',
      success: !!attachment,
      message: `Anexo criado com sucesso: ${attachment.id}`,
      details: attachment,
    }
  } catch (error) {
    return {
      name: 'Attachment Upload',
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Testa Attachment Service - Listar anexos
 */
export async function testAttachmentList(
  entityType: 'student' | 'teacher' | 'school',
  entityId: number
): Promise<TestResult> {
  try {
    const attachments = await attachmentService.getByEntity(entityType, entityId)

    return {
      name: 'Attachment List',
      success: true,
      message: `${attachments.length} anexo(s) encontrado(s)`,
      details: { count: attachments.length, attachments },
    }
  } catch (error) {
    return {
      name: 'Attachment List',
      success: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Executa todos os testes básicos
 */
export async function runAllTests(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Teste 1: Configuração
  results.push(await testConfiguration())

  // Teste 2: Autenticação
  const authResults = await testAuthentication()
  results.push(...authResults)

  return results
}

/**
 * Executa testes de autenticação completos (requer credenciais)
 */
export async function runAuthTests(
  email: string,
  password: string
): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Teste 1: Login
  results.push(await testLogin(email, password))

  // Teste 2: Verificar sessão
  const sessionResults = await testAuthentication()
  results.push(...sessionResults)

  // Teste 3: Logout
  results.push(await testLogout())

  return results
}

/**
 * Formata resultados de teste para exibição
 */
export function formatTestResults(results: TestResult[]): string {
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length

  let output = `\n📊 Resultados dos Testes (${successCount}/${totalCount} passaram)\n\n`
  output += '='.repeat(60) + '\n\n'

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌'
    output += `${icon} ${index + 1}. ${result.name}\n`
    output += `   ${result.message}\n`
    if (result.details) {
      output += `   Detalhes: ${JSON.stringify(result.details, null, 2)}\n`
    }
    output += '\n'
  })

  output += '='.repeat(60) + '\n'
  output += `\nResumo: ${successCount} de ${totalCount} testes passaram\n`

  return output
}

// Exportar funções para uso no console do navegador
if (typeof window !== 'undefined') {
  (window as any).testSupabase = {
    testConfiguration,
    testAuthentication,
    testLogin,
    testLogout,
    testStorageUpload,
    testStorageGetUrl,
    testAttachmentUpload,
    testAttachmentList,
    runAllTests,
    runAuthTests,
    formatTestResults,
  }
}

