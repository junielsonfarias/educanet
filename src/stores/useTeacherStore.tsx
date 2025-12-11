import React, { createContext, useContext, useState, useEffect } from 'react'
import { Teacher, mockTeachers } from '@/lib/mock-data'

interface TeacherContextType {
  teachers: Teacher[]
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void
  updateTeacher: (id: string, data: Partial<Teacher>) => void
  deleteTeacher: (id: string) => void
  getTeacher: (id: string) => Teacher | undefined
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
      setTeachers(JSON.parse(stored))
    } else {
      localStorage.setItem('edu_teachers', JSON.stringify(mockTeachers))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_teachers', JSON.stringify(teachers))
  }, [teachers])

  const addTeacher = (data: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
    }
    setTeachers((prev) => [...prev, newTeacher])
  }

  const updateTeacher = (id: string, data: Partial<Teacher>) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
    )
  }

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id))
  }

  const getTeacher = (id: string) => {
    return teachers.find((t) => t.id === id)
  }

  return (
    <TeacherContext.Provider
      value={{
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        getTeacher,
      }}
    >
      {children}
    </TeacherContext.Provider>
  )
}

export default function useTeacherStore() {
  const context = useContext(TeacherContext)
  if (!context) {
    throw new Error('useTeacherStore must be used within a TeacherProvider')
  }
  return context
}
