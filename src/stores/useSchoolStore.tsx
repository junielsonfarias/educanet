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
    year: Omit<AcademicYear, 'id' | 'classes' | 'status'>,
  ) => void
  updateAcademicYearStatus: (
    schoolId: string,
    yearId: string,
    status: 'pending' | 'active' | 'finished',
  ) => void
  addClassroom: (
    schoolId: string,
    yearId: string,
    classroom: Omit<Classroom, 'id'>,
  ) => void
  updateClassroom: (
    schoolId: string,
    yearId: string,
    classId: string,
    data: Partial<Classroom>,
  ) => void
  deleteClassroom: (schoolId: string, yearId: string, classId: string) => void
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
          // Sanitize data to ensure arrays exist
          const sanitized = parsed.map((s) => ({
            ...s,
            academicYears: Array.isArray(s.academicYears)
              ? s.academicYears
              : [],
          }))
          setSchools(sanitized)
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
      id: Math.random().toString(36).substring(2, 11),
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
    yearData: Omit<AcademicYear, 'id' | 'classes' | 'status'>,
  ) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          // Replication Logic
          const lastYear =
            s.academicYears.length > 0
              ? s.academicYears[s.academicYears.length - 1]
              : null

          let replicatedClasses: Classroom[] = []
          if (lastYear && lastYear.classes) {
            replicatedClasses = lastYear.classes.map((c) => ({
              ...c,
              id: Math.random().toString(36).substring(2, 11),
              studentCount: 0, // Reset student count
            }))
          }

          const newYear: AcademicYear = {
            ...yearData,
            status: 'pending', // Default status
            id: Math.random().toString(36).substring(2, 11),
            classes: replicatedClasses,
          }
          const currentYears = Array.isArray(s.academicYears)
            ? s.academicYears
            : []
          return { ...s, academicYears: [...currentYears, newYear] }
        }
        return s
      }),
    )
  }

  const updateAcademicYearStatus = (
    schoolId: string,
    yearId: string,
    status: 'pending' | 'active' | 'finished',
  ) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          return {
            ...s,
            academicYears: s.academicYears.map((y) =>
              y.id === yearId ? { ...y, status } : y,
            ),
          }
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
          const academicYears = Array.isArray(s.academicYears)
            ? s.academicYears
            : []
          return {
            ...s,
            academicYears: academicYears.map((y) => {
              if (y.id === yearId) {
                const currentClasses = Array.isArray(y.classes) ? y.classes : []
                return {
                  ...y,
                  classes: [
                    ...currentClasses,
                    { ...data, id: Math.random().toString(36).substring(2, 11) },
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

  const updateClassroom = (
    schoolId: string,
    yearId: string,
    classId: string,
    data: Partial<Classroom>,
  ) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          return {
            ...s,
            academicYears: s.academicYears.map((y) => {
              if (y.id === yearId) {
                return {
                  ...y,
                  classes: y.classes.map((c) =>
                    c.id === classId ? { ...c, ...data } : c,
                  ),
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

  const deleteClassroom = (
    schoolId: string,
    yearId: string,
    classId: string,
  ) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          return {
            ...s,
            academicYears: s.academicYears.map((y) => {
              if (y.id === yearId) {
                return {
                  ...y,
                  classes: y.classes.filter((c) => c.id !== classId),
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
        updateAcademicYearStatus,
        addClassroom,
        updateClassroom,
        deleteClassroom,
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
