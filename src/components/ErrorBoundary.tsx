/**
 * Error Boundary global para capturar erros em componentes React
 */

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from './ErrorFallback'
import { logError } from '@/lib/error-handling/error-logger'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
  onReset?: () => void
}

export default function ErrorBoundary({
  children,
  fallback = ErrorFallback,
  onReset,
}: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback}
      onError={(error, errorInfo) => {
        // Loga o erro
        logError(error, {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        })
      }}
      onReset={() => {
        // Limpa estado se necessário
        if (onReset) {
          onReset()
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}

