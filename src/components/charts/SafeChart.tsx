/**
 * Componente wrapper seguro para gráficos Recharts
 * Previne erros de renderização quando dados estão vazios ou inválidos
 */

import { ReactNode } from 'react'
import { isValidArray } from '@/lib/data-sanitizer'

interface SafeChartProps {
  /** Dados do gráfico (deve ser array) */
  data: any[]
  /** Componentes filhos (gráfico Recharts) */
  children: ReactNode
  /** Mensagem exibida quando não há dados */
  emptyMessage?: string
  /** Altura mínima do container */
  minHeight?: number
  /** Validação customizada de dados */
  validateData?: (data: any[]) => boolean
  /** Classe CSS adicional para o container vazio */
  emptyClassName?: string
}

/**
 * Wrapper seguro para gráficos que valida dados antes de renderizar
 * Previne erros de removeChild e renderização com dados inválidos
 */
export function SafeChart({
  data,
  children,
  emptyMessage = 'Nenhum dado disponível',
  minHeight = 350,
  validateData,
  emptyClassName = '',
}: SafeChartProps) {
  // Validação padrão: array não vazio e primeiro item tem propriedades válidas
  const defaultValidation = (d: any[]) => {
    if (!isValidArray(d)) return false
    const firstItem = d[0]
    return (
      firstItem !== null &&
      firstItem !== undefined &&
      typeof firstItem === 'object'
    )
  }

  // Usar validação customizada ou padrão
  const isValid = validateData
    ? validateData(data)
    : defaultValidation(data)

  // Se dados inválidos, mostrar mensagem vazia
  if (!isValid) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground ${emptyClassName}`}
        style={{ minHeight: `${minHeight}px` }}
        role="status"
        aria-live="polite"
      >
        {emptyMessage}
      </div>
    )
  }

  // Renderizar gráfico dentro de container com altura mínima
  return (
    <div
      style={{ minHeight: `${minHeight}px` }}
      className="w-full"
      role="img"
      aria-label="Gráfico de dados"
    >
      {children}
    </div>
  )
}

/**
 * Hook para validar dados de gráfico
 * @param data - Dados do gráfico
 * @param minItems - Número mínimo de itens (padrão: 1)
 * @returns true se dados são válidos
 */
export function useChartDataValidation(
  data: any[],
  minItems: number = 1,
): boolean {
  if (!isValidArray(data)) return false
  if (data.length < minItems) return false

  // Verificar se todos os itens são objetos válidos
  return data.every(
    (item) =>
      item !== null &&
      item !== undefined &&
      typeof item === 'object' &&
      !Array.isArray(item),
  )
}

