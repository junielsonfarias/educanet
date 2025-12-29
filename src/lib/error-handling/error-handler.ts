/**
 * Função utilitária centralizada para tratamento de erros
 */

import { logError } from './error-logger'
import { toast } from 'sonner'
import { ErrorCategory, ErrorSeverity } from './error-types'
import { getUserFriendlyMessage, getErrorSeverity } from './error-messages'

/**
 * Trata um erro de forma centralizada
 * - Loga o erro
 * - Exibe mensagem amigável ao usuário (se necessário)
 * - Retorna informação sobre o erro
 */
export function handleError(
  error: Error | unknown,
  options?: {
    showToast?: boolean
    context?: Record<string, unknown>
    silent?: boolean
  }
): {
  message: string
  userMessage: string
  severity: ErrorSeverity
  category: ErrorCategory
} {
  // Converte erro desconhecido para Error
  const err = error instanceof Error ? error : new Error(String(error))

  // Loga o erro
  if (!options?.silent) {
    logError(err, options?.context)
  }

  // Obtém mensagem amigável
  const userMessage = getUserFriendlyMessage(err)
  const severity = getErrorSeverity(err)

  // Exibe toast se solicitado
  if (options?.showToast && !options?.silent) {
    const toastVariant = severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH
      ? 'error'
      : 'warning'

    toast[toastVariant](userMessage, {
      duration: severity === ErrorSeverity.CRITICAL ? 10000 : 5000,
    })
  }

  return {
    message: err.message,
    userMessage,
    severity,
    category: ErrorCategory.UNKNOWN, // Será determinado pela função de mensagem
  }
}

/**
 * Wrapper para funções assíncronas com tratamento de erro automático
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options?: {
    showToast?: boolean
    context?: Record<string, unknown>
    silent?: boolean
  }
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    handleError(error, options)
    return null
  }
}

/**
 * Wrapper para funções síncronas com tratamento de erro automático
 */
export function withErrorHandlingSync<T>(
  fn: () => T,
  options?: {
    showToast?: boolean
    context?: Record<string, unknown>
    silent?: boolean
  }
): T | null {
  try {
    return fn()
  } catch (error) {
    handleError(error, options)
    return null
  }
}

