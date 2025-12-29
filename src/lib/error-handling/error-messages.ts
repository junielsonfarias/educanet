/**
 * Mensagens de erro padronizadas e amigáveis ao usuário
 */

import { ErrorCategory, ErrorSeverity } from './error-types'

export interface ErrorMessageConfig {
  userMessage: string
  code: string
  category: ErrorCategory
  severity: ErrorSeverity
  recoverable: boolean
}

/**
 * Mapeamento de mensagens de erro por tipo
 */
const errorMessages: Record<string, ErrorMessageConfig> = {
  // Erros de rede
  'network.timeout': {
    userMessage: 'A conexão está demorando muito. Verifique sua internet e tente novamente.',
    code: 'NETWORK_TIMEOUT',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },
  'network.offline': {
    userMessage: 'Você está offline. Verifique sua conexão com a internet.',
    code: 'NETWORK_OFFLINE',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },
  'network.server_error': {
    userMessage: 'O servidor está temporariamente indisponível. Tente novamente em alguns instantes.',
    code: 'NETWORK_SERVER_ERROR',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
  },

  // Erros de validação
  'validation.required': {
    userMessage: 'Por favor, preencha todos os campos obrigatórios.',
    code: 'VALIDATION_REQUIRED',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    recoverable: true,
  },
  'validation.invalid_format': {
    userMessage: 'O formato dos dados está incorreto. Verifique e tente novamente.',
    code: 'VALIDATION_INVALID_FORMAT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    recoverable: true,
  },
  'validation.duplicate': {
    userMessage: 'Este registro já existe. Verifique os dados informados.',
    code: 'VALIDATION_DUPLICATE',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },

  // Erros de autenticação
  'auth.unauthorized': {
    userMessage: 'Você não está autenticado. Faça login para continuar.',
    code: 'AUTH_UNAUTHORIZED',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },
  'auth.invalid_credentials': {
    userMessage: 'Email ou senha incorretos. Verifique suas credenciais.',
    code: 'AUTH_INVALID_CREDENTIALS',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },
  'auth.session_expired': {
    userMessage: 'Sua sessão expirou. Faça login novamente.',
    code: 'AUTH_SESSION_EXPIRED',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },

  // Erros de autorização
  'auth.forbidden': {
    userMessage: 'Você não tem permissão para realizar esta ação.',
    code: 'AUTH_FORBIDDEN',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.HIGH,
    recoverable: false,
  },

  // Erros de dados
  'data.not_found': {
    userMessage: 'O registro solicitado não foi encontrado.',
    code: 'DATA_NOT_FOUND',
    category: ErrorCategory.DATA,
    severity: ErrorSeverity.MEDIUM,
    recoverable: false,
  },
  'data.save_failed': {
    userMessage: 'Não foi possível salvar os dados. Tente novamente.',
    code: 'DATA_SAVE_FAILED',
    category: ErrorCategory.DATA,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
  },
  'data.delete_failed': {
    userMessage: 'Não foi possível excluir o registro. Tente novamente.',
    code: 'DATA_DELETE_FAILED',
    category: ErrorCategory.DATA,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
  },

  // Erros de UI
  'ui.render_error': {
    userMessage: 'Ocorreu um erro ao carregar esta página. Tente recarregar.',
    code: 'UI_RENDER_ERROR',
    category: ErrorCategory.UI,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },
  'ui.component_error': {
    userMessage: 'Um componente apresentou um erro. A página será recarregada.',
    code: 'UI_COMPONENT_ERROR',
    category: ErrorCategory.UI,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },
}

/**
 * Obtém mensagem de erro amigável baseada no tipo de erro
 */
export function getUserFriendlyMessage(error: Error): string {
  // Tenta encontrar mensagem específica pelo nome do erro
  const errorKey = Object.keys(errorMessages).find((key) =>
    error.message.toLowerCase().includes(key.split('.')[1] || '')
  )

  if (errorKey && errorMessages[errorKey]) {
    return errorMessages[errorKey].userMessage
  }

  // Mensagem padrão
  return 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.'
}

/**
 * Obtém configuração de erro baseada no tipo
 */
export function getErrorConfig(error: Error): ErrorMessageConfig {
  const errorKey = Object.keys(errorMessages).find((key) =>
    error.message.toLowerCase().includes(key.split('.')[1] || '')
  )

  if (errorKey && errorMessages[errorKey]) {
    return errorMessages[errorKey]
  }

  // Configuração padrão para erros desconhecidos
  return {
    userMessage: getUserFriendlyMessage(error),
    code: 'UNKNOWN_ERROR',
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    recoverable: false,
  }
}

/**
 * Determina se um erro é recuperável
 */
export function isRecoverable(error: Error): boolean {
  const config = getErrorConfig(error)
  return config.recoverable
}

/**
 * Obtém código de erro
 */
export function getErrorCode(error: Error): string {
  const config = getErrorConfig(error)
  return config.code
}

/**
 * Obtém categoria do erro
 */
export function getErrorCategory(error: Error): ErrorCategory {
  const config = getErrorConfig(error)
  return config.category
}

/**
 * Obtém severidade do erro
 */
export function getErrorSeverity(error: Error): ErrorSeverity {
  const config = getErrorConfig(error)
  return config.severity
}

