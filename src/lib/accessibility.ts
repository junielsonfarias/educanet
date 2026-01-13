/**
 * Utilidades de Acessibilidade (ARIA)
 *
 * Este arquivo contem funcoes e constantes para melhorar a acessibilidade
 * da aplicacao seguindo as diretrizes WCAG 2.1.
 */

/**
 * Gera um ID unico para associar labels com inputs
 */
export function generateId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Props de acessibilidade para inputs de formulario
 */
export interface FormFieldAriaProps {
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  'aria-disabled'?: boolean
}

/**
 * Gera props de acessibilidade para campos de formulario
 */
export function getFormFieldAriaProps(options: {
  labelId?: string
  descriptionId?: string
  errorId?: string
  hasError?: boolean
  isRequired?: boolean
  isDisabled?: boolean
}): FormFieldAriaProps {
  const { labelId, descriptionId, errorId, hasError, isRequired, isDisabled } = options

  const describedBy = [descriptionId, hasError ? errorId : undefined]
    .filter(Boolean)
    .join(' ')

  return {
    'aria-labelledby': labelId,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': hasError || undefined,
    'aria-required': isRequired || undefined,
    'aria-disabled': isDisabled || undefined,
  }
}

/**
 * Props de acessibilidade para dialogos
 */
export interface DialogAriaProps {
  role: 'dialog' | 'alertdialog'
  'aria-modal': boolean
  'aria-labelledby': string
  'aria-describedby'?: string
}

/**
 * Gera props de acessibilidade para dialogos
 */
export function getDialogAriaProps(options: {
  titleId: string
  descriptionId?: string
  isAlert?: boolean
}): DialogAriaProps {
  return {
    role: options.isAlert ? 'alertdialog' : 'dialog',
    'aria-modal': true,
    'aria-labelledby': options.titleId,
    'aria-describedby': options.descriptionId,
  }
}

/**
 * Props de acessibilidade para tabelas
 */
export interface TableAriaProps {
  role: 'table'
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-rowcount'?: number
  'aria-colcount'?: number
}

/**
 * Gera props de acessibilidade para tabelas
 */
export function getTableAriaProps(options: {
  label?: string
  descriptionId?: string
  rowCount?: number
  colCount?: number
}): TableAriaProps {
  return {
    role: 'table',
    'aria-label': options.label,
    'aria-describedby': options.descriptionId,
    'aria-rowcount': options.rowCount,
    'aria-colcount': options.colCount,
  }
}

/**
 * Props de acessibilidade para botoes
 */
export interface ButtonAriaProps {
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  'aria-pressed'?: boolean
  'aria-disabled'?: boolean
}

/**
 * Gera props de acessibilidade para botoes
 */
export function getButtonAriaProps(options: {
  label?: string
  describedBy?: string
  isExpanded?: boolean
  hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  isPressed?: boolean
  isDisabled?: boolean
}): ButtonAriaProps {
  return {
    'aria-label': options.label,
    'aria-describedby': options.describedBy,
    'aria-expanded': options.isExpanded,
    'aria-haspopup': options.hasPopup,
    'aria-pressed': options.isPressed,
    'aria-disabled': options.isDisabled,
  }
}

/**
 * Props de acessibilidade para alertas e notificacoes
 */
export interface AlertAriaProps {
  role: 'alert' | 'status'
  'aria-live': 'polite' | 'assertive' | 'off'
  'aria-atomic'?: boolean
}

/**
 * Gera props de acessibilidade para alertas
 */
export function getAlertAriaProps(options: {
  isUrgent?: boolean
  isAtomic?: boolean
}): AlertAriaProps {
  return {
    role: options.isUrgent ? 'alert' : 'status',
    'aria-live': options.isUrgent ? 'assertive' : 'polite',
    'aria-atomic': options.isAtomic,
  }
}

/**
 * Props de acessibilidade para navegacao
 */
export interface NavAriaProps {
  role: 'navigation'
  'aria-label': string
}

/**
 * Gera props de acessibilidade para navegacao
 */
export function getNavAriaProps(label: string): NavAriaProps {
  return {
    role: 'navigation',
    'aria-label': label,
  }
}

/**
 * Props de acessibilidade para listas
 */
export interface ListAriaProps {
  role: 'list' | 'listbox' | 'menu'
  'aria-label'?: string
  'aria-multiselectable'?: boolean
}

/**
 * Gera props de acessibilidade para listas
 */
export function getListAriaProps(options: {
  type?: 'list' | 'listbox' | 'menu'
  label?: string
  isMultiSelectable?: boolean
}): ListAriaProps {
  return {
    role: options.type || 'list',
    'aria-label': options.label,
    'aria-multiselectable': options.isMultiSelectable,
  }
}

/**
 * Props de acessibilidade para progress bars
 */
export interface ProgressAriaProps {
  role: 'progressbar'
  'aria-valuenow': number
  'aria-valuemin': number
  'aria-valuemax': number
  'aria-valuetext'?: string
  'aria-label'?: string
}

/**
 * Gera props de acessibilidade para progress bars
 */
export function getProgressAriaProps(options: {
  value: number
  min?: number
  max?: number
  label?: string
  valueText?: string
}): ProgressAriaProps {
  const { value, min = 0, max = 100, label, valueText } = options

  return {
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuetext': valueText || `${value}%`,
    'aria-label': label,
  }
}

/**
 * Constantes de teclas para navegacao por teclado
 */
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const

/**
 * Verifica se uma tecla de acao foi pressionada (Enter ou Space)
 */
export function isActionKey(key: string): boolean {
  return key === KEYS.ENTER || key === KEYS.SPACE
}

/**
 * Handler para elementos clicaveis com suporte a teclado
 */
export function handleKeyboardClick(
  event: React.KeyboardEvent,
  callback: () => void
): void {
  if (isActionKey(event.key)) {
    event.preventDefault()
    callback()
  }
}

/**
 * Foca o primeiro elemento focavel dentro de um container
 */
export function focusFirstElement(container: HTMLElement | null): void {
  if (!container) return

  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  if (focusableElements.length > 0) {
    focusableElements[0].focus()
  }
}

/**
 * Trap de foco dentro de um container (para modais)
 */
export function trapFocus(container: HTMLElement | null, event: KeyboardEvent): void {
  if (!container || event.key !== KEYS.TAB) return

  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement?.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement?.focus()
  }
}

/**
 * Mensagens de status para leitores de tela
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove apos anuncio
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Hook customizado para gerenciar anuncios de tela
 */
export function useScreenReaderAnnouncement() {
  return {
    announce: announceToScreenReader,
    announcePolite: (message: string) => announceToScreenReader(message, 'polite'),
    announceAssertive: (message: string) => announceToScreenReader(message, 'assertive'),
  }
}
