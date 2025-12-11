import React, { createContext, useContext, useState, useEffect } from 'react'
import { School, mockSchools, AcademicYear, Classroom } from '@/lib/mock-data'

interface SchoolContextType {
  schools: School[]
  addSchool: (school: Omit<School, 'id' | 'academicYears'>) => void
  updateSchool: (id: string, data: Partial<School>) => void
  deleteSchool: (id: string) => void
  getSchool: (id: string) => School | undefined
  addAcademicYear: (
    schoolId: string,
    year: Omit<AcademicYear, 'id' | 'classes'>,
  ) => void
  addClassroom: (
    schoolId: string,
    yearId: string,
    classroom: Omit<Classroom, 'id'>,
  ) => void
}

const SchoolContext = createContext<SchoolContextType | null>(null)

export const SchoolProvider = ({ children }: { children: React.ReactNode }) => {
  const [schools, setSchools] = useState<School[]>(mockSchools)

  useEffect(() => {
    const stored = localStorage.getItem('edu_schools')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setSchools(parsed)
        }
      } catch (error) {
        console.error('Failed to parse schools from local storage:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_schools', JSON.stringify(schools))
  }, [schools])

  const addSchool = (schoolData: Omit<School, 'id' | 'academicYears'>) => {
    const newSchool: School = {
      ...schoolData,
      id: Math.random().toString(36).substr(2, 9),
      academicYears: [],
    }
    setSchools((prev) => [...prev, newSchool])
  }

  const updateSchool = (id: string, data: Partial<School>) => {
    setSchools((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)))
  }

  const deleteSchool = (id: string) => {
    setSchools((prev) => prev.filter((s) => s.id !== id))
  }

  const getSchool = (id: string) => schools.find((s) => s.id === id)

  const addAcademicYear = (
    schoolId: string,
    yearData: Omit<AcademicYear, 'id' | 'classes'>,
  ) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          const newYear: AcademicYear = {
            ...yearData,
            id: Math.random().toString(36).substr(2, 9),
            classes: [],
          }
          // Ensure academicYears is an array to prevent crashes with corrupted data
          const currentYears = Array.isArray(s.academicYears)
            ? s.academicYears
            : []
          return { ...s, academicYears: [...currentYears, newYear] }
        }
        return s
      }),
    )
  }

  const addClassroom = (
    schoolId: string,
    yearId: string,
    data: Omit<Classroom, 'id'>,
  ) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          // Ensure academicYears exists
          const academicYears = Array.isArray(s.academicYears)
            ? s.academicYears
            : []
          return {
            ...s,
            academicYears: academicYears.map((y) => {
              if (y.id === yearId) {
                // Ensure classes exists
                const currentClasses = Array.isArray(y.classes) ? y.classes : []
                return {
                  ...y,
                  classes: [
                    ...currentClasses,
                    { ...data, id: Math.random().toString(36).substr(2, 9) },
                  ],
                }
              }
              return y
            }),
          }
        }
        return s
      }),
    )
  }

  return (
    <SchoolContext.Provider
      value={{
        schools,
        addSchool,
        updateSchool,
        deleteSchool,
        getSchool,
        addAcademicYear,
        addClassroom,
      }}
    >
      {children}
    </SchoolContext.Provider>
  )
}

export default function useSchoolStore() {
  const context = useContext(SchoolContext)
  if (!context)
    throw new Error('useSchoolStore must be used within a SchoolProvider')
  return context
}
