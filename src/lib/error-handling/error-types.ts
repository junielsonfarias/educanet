/**
 * Tipos e enums para sistema de tratamento de erros
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA = 'data',
  UI = 'ui',
  UNKNOWN = 'unknown',
}

export interface AppError {
  id: string
  message: string
  userMessage: string
  code: string
  category: ErrorCategory
  severity: ErrorSeverity
  timestamp: Date
  stack?: string
  context?: Record<string, unknown>
  recoverable: boolean
}

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  error?: AppError
  context?: Record<string, unknown>
  timestamp: Date
  userId?: string
  sessionId?: string
}

export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
}

export interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

/**
 * Gera um ID único para o erro
 */
export function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

