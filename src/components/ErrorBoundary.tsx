/**
 * Error Boundary global para capturar erros em componentes React
 */

import { Component, ReactNode } from 'react'
import { ErrorFallback } from './ErrorFallback'
import { logError } from '@/lib/error-handling/error-logger'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Verifica se o erro é causado por extensoes do browser manipulando o DOM
 * Esse tipo de erro nao e um problema real da aplicacao e pode ser ignorado
 */
function isBrowserExtensionError(error: Error): boolean {
  const message = error.message || ''
  const name = error.name || ''

  // Erros comuns causados por extensoes de browser (tradutores, Grammarly, etc)
  const extensionErrorPatterns = [
    "removeChild",
    "insertBefore",
    "appendChild",
    "The node to be removed is not a child of this node",
    "Failed to execute 'removeChild' on 'Node'",
    "Failed to execute 'insertBefore' on 'Node'",
    "NotFoundError",
  ]

  return extensionErrorPatterns.some(pattern =>
    message.includes(pattern) || name.includes(pattern)
  )
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Se for erro de extensao do browser, nao mostra fallback
    if (isBrowserExtensionError(error)) {
      console.warn('[ErrorBoundary] Erro de extensao do browser ignorado:', error.message)
      return { hasError: false, error: null }
    }
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Ignora erros de extensoes de browser
    if (isBrowserExtensionError(error)) {
      console.warn('[ErrorBoundary] Erro de extensao do browser capturado e ignorado')
      return
    }

    // Loga apenas erros reais da aplicacao
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    })
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback: FallbackComponent = ErrorFallback } = this.props

    if (hasError && error) {
      return (
        <FallbackComponent
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      )
    }

    return children
  }
}

