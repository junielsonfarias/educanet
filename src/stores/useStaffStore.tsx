import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Staff } from '@/lib/mock-data'
import { mockStaff } from '@/lib/mock-data'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface StaffContextType {
  staff: Staff[]
  addStaff: (data: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateStaff: (id: string, data: Partial<Staff>) => void
  deleteStaff: (id: string) => void
  getStaff: (id: string) => Staff | undefined
  getStaffBySchool: (schoolId: string) => Staff[]
  getStaffByRole: (role: Staff['role']) => Staff[]
}

const StaffContext = createContext<StaffContextType | null>(null)

export const StaffProvider = ({ children }: { children: ReactNode }) => {
  const [staff, setStaff] = useState<Staff[]>(mockStaff)

  useEffect(() => {
    const stored = localStorage.getItem('edu_staff')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<Staff>(parsed, {})
        setStaff(sanitized.length > 0 ? sanitized : mockStaff)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadStaff', source: 'localStorage' },
        })
        setStaff(mockStaff)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_staff', JSON.stringify(staff))
  }, [staff])

  const addStaff = (data: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newStaff: Staff = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStaff((prev) => [...prev, newStaff])
  }

  const updateStaff = (id: string, data: Partial<Staff>) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, ...data, updatedAt: new Date().toISOString() }
          : s,
      ),
    )
  }

  const deleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id))
  }

  const getStaff = (id: string) => {
    return staff.find((s) => s.id === id)
  }

  const getStaffBySchool = (schoolId: string) => {
    return staff.filter((s) => s.schoolId === schoolId)
  }

  const getStaffByRole = (role: Staff['role']) => {
    return staff.filter((s) => s.role === role)
  }

  return (
    <StaffContext.Provider
      value={{
        staff,
        addStaff,
        updateStaff,
        deleteStaff,
        getStaff,
        getStaffBySchool,
        getStaffByRole,
      }}
    >
      {children}
    </StaffContext.Provider>
  )
}

export default function useStaffStore() {
  const context = useContext(StaffContext)
  if (!context) {
    throw new Error('useStaffStore must be used within StaffProvider')
  }
  return context
}

