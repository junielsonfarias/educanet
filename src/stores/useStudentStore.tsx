import React, { createContext, useContext, useState, useEffect } from 'react'
import { Student, mockStudents } from '@/lib/mock-data'

interface StudentContextType {
  students: Student[]
  addStudent: (student: Omit<Student, 'id'>) => void
  updateStudent: (id: string, data: Partial<Student>) => void
  deleteStudent: (id: string) => void
  getStudent: (id: string) => Student | undefined
}

const StudentContext = createContext<StudentContextType | null>(null)

export const StudentProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [students, setStudents] = useState<Student[]>(mockStudents)

  useEffect(() => {
    const stored = localStorage.getItem('edu_students')
    if (stored) {
      setStudents(JSON.parse(stored))
    } else {
      localStorage.setItem('edu_students', JSON.stringify(mockStudents))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_students', JSON.stringify(students))
  }, [students])

  const addStudent = (data: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
    }
    setStudents((prev) => [...prev, newStudent])
  }

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s)),
    )
  }

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  const getStudent = (id: string) => {
    return students.find((s) => s.id === id)
  }

  return (
    <StudentContext.Provider
      value={{
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        getStudent,
      }}
    >
      {children}
    </StudentContext.Provider>
  )
}

export default function useStudentStore() {
  const context = useContext(StudentContext)
  if (!context) {
    throw new Error('useStudentStore must be used within a StudentProvider')
  }
  return context
}
