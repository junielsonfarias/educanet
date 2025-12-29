/**
 * Utilitários para sanitização de dados
 * Garante que dados carregados do localStorage ou APIs sempre tenham estrutura válida
 */

/**
 * Schema de sanitização para um tipo de dados
 */
export interface SanitizationSchema<T> {
  /** Campos que devem ser arrays (serão inicializados como [] se não forem arrays) */
  arrayFields?: string[]
  /** Campos que devem ser objetos (serão inicializados com defaults se não existirem) */
  objectFields?: Record<string, any>
  /** Valores padrão para aplicar em todos os itens */
  defaults?: Partial<T>
  /** Função customizada de sanitização por item */
  customSanitizer?: (item: any) => T
}

/**
 * Sanitiza um array de dados de acordo com um schema
 * @param data - Dados brutos (pode ser qualquer coisa)
 * @param schema - Schema de sanitização
 * @returns Array sanitizado e tipado
 */
export function sanitizeStoreData<T>(
  data: any,
  schema: SanitizationSchema<T>,
): T[] {
  // Se não for array, retorna array vazio
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((item: any, index: number) => {
    // Se houver sanitizador customizado, usar ele
    if (schema.customSanitizer) {
      try {
        return schema.customSanitizer(item)
      } catch (error) {
        console.warn(`Erro ao sanitizar item ${index}:`, error)
        return schema.defaults as T
      }
    }

    const sanitized: any = { ...item }

    // Sanitizar arrays
    if (schema.arrayFields) {
      schema.arrayFields.forEach((field) => {
        sanitized[field] = Array.isArray(item[field])
          ? item[field]
          : []
      })
    }

    // Sanitizar objetos
    if (schema.objectFields) {
      Object.entries(schema.objectFields).forEach(([field, defaults]) => {
        sanitized[field] =
          item[field] && typeof item[field] === 'object' && !Array.isArray(item[field])
            ? { ...defaults, ...item[field] }
            : { ...defaults }
      })
    }

    // Aplicar defaults (defaults têm menor prioridade que dados existentes)
    return { ...schema.defaults, ...sanitized } as T
  })
}

/**
 * Sanitiza um objeto único (não array)
 * @param data - Dados brutos
 * @param schema - Schema de sanitização
 * @returns Objeto sanitizado e tipado
 */
export function sanitizeStoreItem<T>(
  data: any,
  schema: SanitizationSchema<T>,
): T | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null
  }

  // Se houver sanitizador customizado, usar ele
  if (schema.customSanitizer) {
    try {
      return schema.customSanitizer(data)
    } catch (error) {
      console.warn('Erro ao sanitizar item:', error)
      return schema.defaults as T
    }
  }

  const sanitized: any = { ...data }

  // Sanitizar arrays
  if (schema.arrayFields) {
    schema.arrayFields.forEach((field) => {
      sanitized[field] = Array.isArray(data[field]) ? data[field] : []
    })
  }

  // Sanitizar objetos
  if (schema.objectFields) {
    Object.entries(schema.objectFields).forEach(([field, defaults]) => {
      sanitized[field] =
        data[field] && typeof data[field] === 'object' && !Array.isArray(data[field])
          ? { ...defaults, ...data[field] }
          : { ...defaults }
    })
  }

  // Aplicar defaults
  return { ...schema.defaults, ...sanitized } as T
}

/**
 * Valida se um valor é um array não vazio
 * @param value - Valor a validar
 * @returns true se for array não vazio
 */
export function isValidArray<T>(value: any): value is T[] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Valida se um valor é um objeto válido (não array, não null)
 * @param value - Valor a validar
 * @returns true se for objeto válido
 */
export function isValidObject(value: any): value is Record<string, any> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

/**
 * Garante que um campo seja sempre um array
 * @param field - Campo a verificar
 * @param defaultValue - Valor padrão se não for array
 * @returns Array válido
 */
export function ensureArray<T>(
  field: T[] | undefined | null,
  defaultValue: T[] = [],
): T[] {
  return Array.isArray(field) ? field : defaultValue
}

/**
 * Garante que um campo seja sempre um objeto
 * @param field - Campo a verificar
 * @param defaultValue - Valor padrão se não for objeto
 * @returns Objeto válido
 */
export function ensureObject<T extends Record<string, any>>(
  field: T | undefined | null,
  defaultValue: T,
): T {
  return isValidObject(field) ? field : defaultValue
}

