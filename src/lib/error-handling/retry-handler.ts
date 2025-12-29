/**
 * Sistema de retry automático para operações que falharam
 */

import { logError, logger } from './error-logger'

export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  exponentialBackoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  exponentialBackoff: true,
  onRetry: () => {},
}

/**
 * Calcula o delay para o próximo retry
 */
function calculateDelay(attempt: number, baseDelay: number, exponential: boolean): number {
  if (!exponential) return baseDelay
  return baseDelay * Math.pow(2, attempt - 1)
}

/**
 * Aguarda por um período de tempo
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Determina se um erro é recuperável e vale a pena fazer retry
 */
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()
  
  // Erros de rede geralmente são recuperáveis
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('offline') ||
    message.includes('fetch') ||
    message.includes('connection')
  ) {
    return true
  }
  
  // Erros de validação não são recuperáveis
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required')
  ) {
    return false
  }
  
  return false
}

/**
 * Executa uma função com retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Verifica se vale a pena fazer retry
      if (!isRetryableError(lastError)) {
        logger.warn('Erro não recuperável, abortando retry', {
          error: lastError.message,
          attempt,
        })
        throw lastError
      }
      
      // Se não é a última tentativa, aguarda e tenta novamente
      if (attempt < opts.maxAttempts) {
        const delay = calculateDelay(attempt, opts.delay, opts.exponentialBackoff)
        
        logger.info(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`, {
          error: lastError.message,
          nextAttempt: attempt + 1,
        })
        
        opts.onRetry(attempt, lastError)
        await wait(delay)
      } else {
        // Última tentativa falhou
        logger.error('Todas as tentativas falharam', {
          attempts: opts.maxAttempts,
          error: lastError.message,
        })
        logError(lastError, {
          retryAttempts: opts.maxAttempts,
          finalFailure: true,
        })
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  throw lastError!
}

/**
 * Wrapper que adiciona retry automático a uma função
 */
export function withAutoRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options)
  }) as T
}

