/**
 * Utilitários para manipulação segura de arrays
 * Previne erros de "Cannot read properties of undefined" e "is not a function"
 */

/**
 * Garante que o valor seja sempre um array válido
 * @param arr - Array, undefined ou null
 * @returns Array válido (vazio se input for inválido)
 */
export function safeArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : []
}

/**
 * Encontra um item em um array de forma segura
 * @param arr - Array, undefined ou null
 * @param predicate - Função de busca
 * @returns Item encontrado ou undefined
 */
export function safeFind<T>(
  arr: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean,
): T | undefined {
  const safe = safeArray(arr)
  return safe.find(predicate)
}

/**
 * Mapeia um array de forma segura
 * @param arr - Array, undefined ou null
 * @param mapper - Função de mapeamento
 * @returns Array mapeado (vazio se input for inválido)
 */
export function safeMap<T, R>(
  arr: T[] | undefined | null,
  mapper: (item: T, index: number) => R,
): R[] {
  return safeArray(arr).map(mapper)
}

/**
 * Filtra um array de forma segura
 * @param arr - Array, undefined ou null
 * @param predicate - Função de filtro
 * @returns Array filtrado (vazio se input for inválido)
 */
export function safeFilter<T>(
  arr: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean,
): T[] {
  return safeArray(arr).filter(predicate)
}

/**
 * Itera sobre um array de forma segura
 * @param arr - Array, undefined ou null
 * @param callback - Função de callback
 */
export function safeForEach<T>(
  arr: T[] | undefined | null,
  callback: (item: T, index: number) => void,
): void {
  safeArray(arr).forEach(callback)
}

/**
 * Verifica se um array tem itens de forma segura
 * @param arr - Array, undefined ou null
 * @returns true se o array tiver itens, false caso contrário
 */
export function safeHasItems<T>(arr: T[] | undefined | null): boolean {
  const safe = safeArray(arr)
  return safe.length > 0
}

/**
 * Obtém o comprimento de um array de forma segura
 * @param arr - Array, undefined ou null
 * @returns Comprimento do array (0 se inválido)
 */
export function safeLength<T>(arr: T[] | undefined | null): number {
  return safeArray(arr).length
}

/**
 * Aplica flatMap de forma segura
 * @param arr - Array, undefined ou null
 * @param mapper - Função de mapeamento que retorna array
 * @returns Array achatado
 */
export function safeFlatMap<T, R>(
  arr: T[] | undefined | null,
  mapper: (item: T, index: number) => R[],
): R[] {
  return safeArray(arr).flatMap(mapper)
}

/**
 * Verifica se algum item do array satisfaz a condição
 * @param arr - Array, undefined ou null
 * @param predicate - Função de teste
 * @returns true se algum item satisfizer, false caso contrário
 */
export function safeSome<T>(
  arr: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean,
): boolean {
  return safeArray(arr).some(predicate)
}

/**
 * Verifica se todos os itens do array satisfazem a condição
 * @param arr - Array, undefined ou null
 * @param predicate - Função de teste
 * @returns true se todos satisfizerem, false caso contrário
 */
export function safeEvery<T>(
  arr: T[] | undefined | null,
  predicate: (item: T, index: number) => boolean,
): boolean {
  return safeArray(arr).every(predicate)
}

/**
 * Reduz um array de forma segura
 * @param arr - Array, undefined ou null
 * @param reducer - Função de redução
 * @param initialValue - Valor inicial
 * @returns Valor reduzido
 */
export function safeReduce<T, R>(
  arr: T[] | undefined | null,
  reducer: (accumulator: R, currentValue: T, index: number) => R,
  initialValue: R,
): R {
  return safeArray(arr).reduce(reducer, initialValue)
}

