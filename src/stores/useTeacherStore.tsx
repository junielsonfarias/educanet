import React, { createContext, useContext, useState, useEffect } from 'react'
import { Teacher, mockTeachers, TeacherAllocation } from '@/lib/mock-data'

interface TeacherContextType {
  teachers: Teacher[]
  addTeacher: (teacher: Omit<Teacher, 'id' | 'allocations'>) => void
  updateTeacher: (id: string, data: Partial<Teacher>) => void
  deleteTeacher: (id: string) => void
  getTeacher: (id: string) => Teacher | undefined
  addAllocation: (
    teacherId: string,
    allocation: Omit<TeacherAllocation, 'id' | 'createdAt'>,
  ) => void
}

const TeacherContext = createContext<TeacherContextType | null>(null)

export const TeacherProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers)

  useEffect(() => {
    const stored = localStorage.getItem('edu_teachers')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Ensure parsed data is an array
        if (Array.isArray(parsed)) {
          // Sanitize data: ensure every teacher object has allocations array
          const sanitized = parsed.map((t: any) => ({
            ...t,
            allocations: Array.isArray(t.allocations) ? t.allocations : [],
          }))
          setTeachers(sanitized)
        }
      } catch (error) {
        console.error('Failed to parse teachers from local storage:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_teachers', JSON.stringify(teachers))
  }, [teachers])

  const addTeacher = (data: Omit<Teacher, 'id' | 'allocations'>) => {
    const newTeacher: Teacher = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      allocations: [],
    }
    setTeachers((prev) => {
      const safePrev = Array.isArray(prev) ? prev : []
      return [...safePrev, newTeacher]
    })
  }

  const updateTeacher = (id: string, data: Partial<Teacher>) => {
    setTeachers((prev) => {
      const safePrev = Array.isArray(prev) ? prev : []
      return safePrev.map((t) => (t.id === id ? { ...t, ...data } : t))
    })
  }

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => {
      const safePrev = Array.isArray(prev) ? prev : []
      return safePrev.filter((t) => t.id !== id)
    })
  }

  const getTeacher = (id: string) => {
    const safeTeachers = Array.isArray(teachers) ? teachers : []
    return safeTeachers.find((t) => t.id === id)
  }

  const addAllocation = (
    teacherId: string,
    data: Omit<TeacherAllocation, 'id' | 'createdAt'>,
  ) => {
    setTeachers((prev) => {
      const safePrev = Array.isArray(prev) ? prev : []
      return safePrev.map((t) => {
        if (t.id === teacherId) {
          const currentAllocations = Array.isArray(t.allocations)
            ? t.allocations
            : []
          const newAllocation: TeacherAllocation = {
            ...data,
            id: Math.random().toString(36).substring(2, 11),
            createdAt: new Date().toISOString(),
          }
          return { ...t, allocations: [...currentAllocations, newAllocation] }
        }
        return t
      })
    })
  }

  return (
    <TeacherContext.Provider
      value={{
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        getTeacher,
        addAllocation,
      }}
    >
      {children}
    </TeacherContext.Provider>
  )
}

export default function useTeacherStore() {
  const context = useContext(TeacherContext)
  if (!context)
    throw new Error('useTeacherStore must be used within a TeacherProvider')
  return context
}
