import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, initialUsers } from '@/lib/mock-data'

interface UserContextType {
  users: User[]
  currentUser: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void
}

const UserContext = createContext<UserContextType | null>(null)

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Load from localStorage if available (mock persistence)
  useEffect(() => {
    const storedUsers = localStorage.getItem('edu_users')
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers))
    } else {
      localStorage.setItem('edu_users', JSON.stringify(initialUsers))
    }

    const storedSession = localStorage.getItem('edu_session')
    if (storedSession) {
      setCurrentUser(JSON.parse(storedSession))
    }
  }, [])

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
    // Basic mock authentication
    const user = users.find((u) => u.email === email && u.password === password)
    if (user) {
      setCurrentUser(user)
      return true
    }
    // Fallback for the hardcoded admin if not in list (safety net)
    if (email === 'admin@escola.com' && password === 'admin') {
      const demoAdmin: User = {
        id: 'demo-admin',
        name: 'Administrador Demo',
        email: 'admin@escola.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
      }
      setCurrentUser(demoAdmin)
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }
    setUsers((prev) => [...prev, newUser])
  }

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...data } : user)),
    )
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
