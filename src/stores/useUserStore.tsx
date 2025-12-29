import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, initialUsers } from '@/lib/mock-data'
import { comparePassword, hashPassword, migratePasswordToHash } from '@/lib/auth-utils'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface UserContextType {
  users: User[]
  currentUser: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string }) => Promise<void>
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void
  migratePasswords: () => Promise<void>
}

const UserContext = createContext<UserContextType | null>(null)

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Load from localStorage if available (mock persistence)
  useEffect(() => {
    const storedUsers = localStorage.getItem('edu_users')
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers)
        const sanitized = sanitizeStoreData<User>(parsed, {})
        setUsers(sanitized.length > 0 ? sanitized : initialUsers)
        // Migrar senhas antigas automaticamente na primeira carga
        migratePasswordsIfNeeded(sanitized.length > 0 ? sanitized : initialUsers)
      } catch (error) {
        handleError(error as Error, {
          context: { action: 'loadUsers', source: 'localStorage' },
        })
        // Fallback para usuários iniciais se houver erro
        setUsers(initialUsers)
        localStorage.setItem('edu_users', JSON.stringify(initialUsers))
      }
    } else {
      localStorage.setItem('edu_users', JSON.stringify(initialUsers))
    }

    const storedSession = localStorage.getItem('edu_session')
    if (storedSession) {
      try {
        setCurrentUser(JSON.parse(storedSession))
      } catch (error) {
        handleError(error as Error, {
          context: { action: 'loadSession', source: 'localStorage' },
        })
        localStorage.removeItem('edu_session')
      }
    }
  }, [])

  // Função auxiliar para migrar senhas antigas
  const migratePasswordsIfNeeded = async (users: User[]) => {
    const needsMigration = users.some((u) => u.password && !u.passwordHash)
    if (needsMigration) {
      try {
        const migratedUsers = await Promise.all(
          users.map(async (user) => {
            if (user.password && !user.passwordHash) {
              const hash = await migratePasswordToHash(user.password)
              // Remover senha em texto plano após migração
              const { password, ...userWithoutPassword } = user
              return { ...userWithoutPassword, passwordHash: hash }
            }
            return user
          }),
        )
        setUsers(migratedUsers)
        localStorage.setItem('edu_users', JSON.stringify(migratedUsers))
      } catch (error) {
        handleError(error as Error, {
          context: { action: 'migratePasswords', source: 'useUserStore' },
        })
      }
    }
  }

  useEffect(() => {
    localStorage.setItem('edu_users', JSON.stringify(users))
  }, [users])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('edu_session', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('edu_session')
    }
  }, [currentUser])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = users.find((u) => u.email === email)
      if (!user) {
        return false
      }

      // Suporte a migração: verificar senha antiga primeiro (se existir)
      if (user.password && !user.passwordHash) {
        // Migrar senha antiga durante login
        if (user.password === password) {
          const hash = await migratePasswordToHash(password)
          const updatedUser = { ...user, passwordHash: hash }
          // Remover senha em texto plano
          delete (updatedUser as any).password
          updateUser(user.id, updatedUser)
          setCurrentUser(updatedUser)
          return true
        }
        return false
      }

      // Verificar senha usando hash
      if (user.passwordHash) {
        const isValid = await comparePassword(password, user.passwordHash)
        if (isValid) {
          // Não incluir passwordHash no currentUser por segurança
          const { passwordHash, password: _, ...userWithoutPassword } = user
          setCurrentUser(userWithoutPassword as User)
          return true
        }
      }

      return false
    } catch (error) {
      handleError(error as Error, {
        context: { action: 'login', email },
      })
      return false
    }
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const addUser = async (
    userData: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string },
  ): Promise<void> => {
    try {
      // Gerar hash da senha antes de salvar
      const passwordHash = await hashPassword(userData.password)
      const newUser: User = {
        ...userData,
        passwordHash,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
      }
      // Remover senha em texto plano
      delete (newUser as any).password
      setUsers((prev) => [...prev, newUser])
    } catch (error) {
      handleError(error as Error, {
        context: { action: 'addUser', email: userData.email },
      })
      throw error
    }
  }

  const updateUser = async (id: string, data: Partial<User>) => {
    try {
      // Se estiver atualizando a senha, fazer hash
      if ('password' in data && data.password) {
        const passwordHash = await hashPassword(data.password)
        const { password, ...dataWithoutPassword } = data
        setUsers((prev) =>
          prev.map((user) =>
            user.id === id ? { ...user, ...dataWithoutPassword, passwordHash } : user,
          ),
        )
      } else {
        setUsers((prev) =>
          prev.map((user) => (user.id === id ? { ...user, ...data } : user)),
        )
      }
    } catch (error) {
      handleError(error as Error, {
        context: { action: 'updateUser', userId: id },
      })
      throw error
    }
  }

  const migratePasswords = async (): Promise<void> => {
    try {
      const needsMigration = users.some((u) => u.password && !u.passwordHash)
      if (!needsMigration) {
        return
      }

      const migratedUsers = await Promise.all(
        users.map(async (user) => {
          if (user.password && !user.passwordHash) {
            const hash = await migratePasswordToHash(user.password)
            const { password, ...userWithoutPassword } = user
            return { ...userWithoutPassword, passwordHash: hash }
          }
          return user
        }),
      )

      setUsers(migratedUsers)
      localStorage.setItem('edu_users', JSON.stringify(migratedUsers))
    } catch (error) {
      handleError(error as Error, {
        context: { action: 'migratePasswords', source: 'useUserStore' },
      })
      throw error
    }
  }

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id))
  }

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        migratePasswords,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default function useUserStore() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserStore must be used within a UserProvider')
  }
  return context
}
