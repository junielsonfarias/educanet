/**
 * Sistema de logging centralizado para erros
 */

import { AppError, LogEntry } from './error-types'
import {
  getErrorCode,
  getErrorCategory,
  getErrorSeverity,
  getUserFriendlyMessage,
  isRecoverable,
} from './error-messages'
import { generateErrorId } from './error-types'

/**
 * Níveis de log disponíveis
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

/**
 * Configuração do logger
 */
interface LoggerConfig {
  enableConsole: boolean
  enableStorage: boolean
  maxLogs: number
  logLevel: LogLevel
}

const defaultConfig: LoggerConfig = {
  enableConsole: true,
  enableStorage: true,
  maxLogs: 100,
  logLevel: import.meta.env.DEV ? 'debug' : 'error',
}

/**
 * Armazena logs no localStorage
 */
function storeLog(logEntry: LogEntry): void {
  try {
    const stored = localStorage.getItem('edu_error_logs')
    const logs: LogEntry[] = stored ? JSON.parse(stored) : []

    logs.push(logEntry)

    // Limita quantidade de logs armazenados
    if (logs.length > defaultConfig.maxLogs) {
      logs.shift()
    }

    localStorage.setItem('edu_error_logs', JSON.stringify(logs))
  } catch (error) {
    // Se não conseguir armazenar, apenas loga no console
    console.warn('Não foi possível armazenar log:', error)
  }
}

/**
 * Envia log para serviço externo (futuro)
 */
function sendToLoggingService(logEntry: LogEntry): void {
  // TODO: Implementar integração com serviço de logging (Sentry, LogRocket, etc)
  if (import.meta.env.PROD) {
    // Em produção, poderia enviar para serviço externo
    // Exemplo: fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) })
  }
}

/**
 * Cria entrada de log a partir de um erro
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  error?: Error,
  context?: Record<string, unknown>
): LogEntry {
  let appError: AppError | undefined

  if (error) {
    appError = {
      id: generateErrorId(),
      message: error.message,
      userMessage: getUserFriendlyMessage(error),
      code: getErrorCode(error),
      category: getErrorCategory(error),
      severity: getErrorSeverity(error),
      timestamp: new Date(),
      stack: error.stack,
      context,
      recoverable: isRecoverable(error),
    }
  }

  return {
    level,
    message,
    error: appError,
    context,
    timestamp: new Date(),
    // TODO: Adicionar userId e sessionId quando disponíveis
  }
}

/**
 * Logger principal
 */
export const logger = {
  /**
   * Log de erro
   */
  error: (message: string, error?: Error, context?: Record<string, unknown>): void => {
    const logEntry = createLogEntry('error', message, error, context)

    if (defaultConfig.enableConsole && defaultConfig.logLevel !== 'info') {
      console.error('❌ Error:', logEntry)
    }

    if (defaultConfig.enableStorage) {
      storeLog(logEntry)
    }

    sendToLoggingService(logEntry)
  },

  /**
   * Log de aviso
   */
  warn: (message: string, context?: Record<string, unknown>): void => {
    const logEntry = createLogEntry('warn', message, undefined, context)

    if (defaultConfig.enableConsole && ['debug', 'warn'].includes(defaultConfig.logLevel)) {
      console.warn('⚠️ Warning:', logEntry)
    }

    if (defaultConfig.enableStorage) {
      storeLog(logEntry)
    }
  },

  /**
   * Log de informação
   */
  info: (message: string, context?: Record<string, unknown>): void => {
    const logEntry = createLogEntry('info', message, undefined, context)

    if (defaultConfig.enableConsole && ['debug', 'info'].includes(defaultConfig.logLevel)) {
      console.info('ℹ️ Info:', logEntry)
    }

    if (defaultConfig.enableStorage && import.meta.env.DEV) {
      storeLog(logEntry)
    }
  },

  /**
   * Log de debug
   */
  debug: (message: string, context?: Record<string, unknown>): void => {
    const logEntry = createLogEntry('debug', message, undefined, context)

    if (defaultConfig.enableConsole && defaultConfig.logLevel === 'debug') {
      console.debug('🔍 Debug:', logEntry)
    }

    // Debug não é armazenado em produção
    if (defaultConfig.enableStorage && import.meta.env.DEV) {
      storeLog(logEntry)
    }
  },
}

/**
 * Função principal para logar erros
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>
): void {
  logger.error(error.message, error, context)
}

/**
 * Obtém logs armazenados
 */
export function getStoredLogs(): LogEntry[] {
  try {
    const stored = localStorage.getItem('edu_error_logs')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Limpa logs armazenados
 */
export function clearStoredLogs(): void {
  localStorage.removeItem('edu_error_logs')
}

