import React, { createContext, useContext, useState, useEffect } from 'react'
import { School, mockSchools } from '@/lib/mock-data'

interface SchoolContextType {
  schools: School[]
  addSchool: (school: Omit<School, 'id'>) => void
  updateSchool: (id: string, data: Partial<School>) => void
  deleteSchool: (id: string) => void
  getSchool: (id: string) => School | undefined
}

const SchoolContext = createContext<SchoolContextType | null>(null)

export const SchoolProvider = ({ children }: { children: React.ReactNode }) => {
  const [schools, setSchools] = useState<School[]>(mockSchools)

  useEffect(() => {
    const stored = localStorage.getItem('edu_schools')
    if (stored) {
      setSchools(JSON.parse(stored))
    } else {
      localStorage.setItem('edu_schools', JSON.stringify(mockSchools))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_schools', JSON.stringify(schools))
  }, [schools])

  const addSchool = (schoolData: Omit<School, 'id'>) => {
    const newSchool: School = {
      ...schoolData,
      id: Math.random().toString(36).substr(2, 9),
    }
    setSchools((prev) => [...prev, newSchool])
  }

  const updateSchool = (id: string, data: Partial<School>) => {
    setSchools((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)))
  }

  const deleteSchool = (id: string) => {
    setSchools((prev) => prev.filter((s) => s.id !== id))
  }

  const getSchool = (id: string) => {
    return schools.find((s) => s.id === id)
  }

  return (
    <SchoolContext.Provider
      value={{ schools, addSchool, updateSchool, deleteSchool, getSchool }}
    >
      {children}
    </SchoolContext.Provider>
  )
}

export default function useSchoolStore() {
  const context = useContext(SchoolContext)
  if (!context) {
    throw new Error('useSchoolStore must be used within a SchoolProvider')
  }
  return context
}
