/**
 * Error Boundary específico para módulos/rotas
 * Permite tratamento customizado por módulo
 */

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './ErrorFallback'
import { logError } from '@/lib/error-handling/error-logger'

interface ModuleErrorBoundaryProps {
  children: React.ReactNode
  moduleName: string
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
  onReset?: () => void
}

export function ModuleErrorBoundary({
  children,
  moduleName,
  fallback = ErrorFallback,
  onReset,
}: ModuleErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback}
      onError={(error, errorInfo) => {
        // Loga o erro com contexto do módulo
        logError(error, {
          module: moduleName,
          componentStack: errorInfo.componentStack,
          errorBoundary: 'module',
        })
      }}
      onReset={() => {
        // Limpa estado do módulo se necessário
        if (onReset) {
          onReset()
        }
      }}
      resetKeys={[moduleName]} // Reset quando o módulo mudar
    >
      {children}
    </ReactErrorBoundary>
  )
}

