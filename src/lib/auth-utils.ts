import bcrypt from 'bcryptjs'

/**
 * Utilitários para autenticação e segurança
 */

/**
 * Gera hash de senha usando bcrypt
 * @param password - Senha em texto plano
 * @param saltRounds - Número de rounds de salt (padrão: 10)
 * @returns Hash da senha
 */
export async function hashPassword(
  password: string,
  saltRounds: number = 10,
): Promise<string> {
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Compara senha em texto plano com hash
 * @param password - Senha em texto plano
 * @param hash - Hash armazenado
 * @returns true se a senha corresponde ao hash
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Valida força da senha
 * @param password - Senha a validar
 * @returns Objeto com validação e mensagens
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Migra senha em texto plano para hash
 * @param plainPassword - Senha em texto plano
 * @returns Hash da senha
 */
export async function migratePasswordToHash(
  plainPassword: string,
): Promise<string> {
  return await hashPassword(plainPassword)
}

