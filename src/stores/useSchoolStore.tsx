import React, { createContext, useContext, useState, useEffect } from 'react'
import { School, mockSchools, AnoLetivo, Turma } from '@/lib/mock-data'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface SchoolContextType {
  schools: School[]
  addSchool: (school: Omit<School, 'id' | 'academicYears'>) => void
  updateSchool: (id: string, data: Partial<School>) => void
  deleteSchool: (id: string) => void
  getSchool: (id: string) => School | undefined
  addAcademicYear: (
    schoolId: string,
    year: Omit<AnoLetivo, 'id' | 'turmas' | 'status'>,
  ) => void
  updateAcademicYearStatus: (
    schoolId: string,
    yearId: string,
    status: 'pending' | 'active' | 'finished',
  ) => void
  addClassroom: (
    schoolId: string,
    yearId: string,
    classroom: Omit<Turma, 'id'>,
  ) => void
  updateClassroom: (
    schoolId: string,
    yearId: string,
    classId: string,
    data: Partial<Turma>,
  ) => void
  deleteClassroom: (schoolId: string, yearId: string, classId: string) => void
  // Aliases para compatibilidade (deprecated)
  addTurma: (
    schoolId: string,
    yearId: string,
    turma: Omit<Turma, 'id'>,
  ) => void
  updateTurma: (
    schoolId: string,
    yearId: string,
    turmaId: string,
    data: Partial<Turma>,
  ) => void
  deleteTurma: (schoolId: string, yearId: string, turmaId: string) => void
}

const SchoolContext = createContext<SchoolContextType | null>(null)

export const SchoolProvider = ({ children }: { children: React.ReactNode }) => {
  const [schools, setSchools] = useState<School[]>(mockSchools)

  useEffect(() => {
    const stored = localStorage.getItem('edu_schools')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Sanitizar dados usando utilitário centralizado
        const sanitized = sanitizeStoreData<School>(parsed, {
          arrayFields: ['academicYears'],
          customSanitizer: (s: any) => ({
            ...s,
            academicYears: Array.isArray(s.academicYears)
              ? s.academicYears.map((year: any) => ({
                  ...year,
                  turmas: Array.isArray(year.turmas) ? year.turmas : [],
                  periods: Array.isArray(year.periods) ? year.periods : [],
                }))
              : [],
          }),
        })
        setSchools(sanitized.length > 0 ? sanitized : mockSchools)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadSchools', source: 'localStorage' },
        })
        setSchools(mockSchools)
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
    yearData: Omit<AnoLetivo, 'id' | 'turmas' | 'status'>,
  ) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          // Replication Logic
          const lastYear =
            (s.academicYears || []).length > 0
              ? (s.academicYears || [])[(s.academicYears || []).length - 1]
              : null

          let replicatedTurmas: Turma[] = []
          // Usa turmas (com fallback para classes apenas durante migração)
          const lastYearTurmas = lastYear?.turmas || lastYear?.classes || []
          if (lastYear && lastYearTurmas.length > 0) {
            replicatedTurmas = lastYearTurmas.map((c) => ({
              ...c,
              id: Math.random().toString(36).substring(2, 11),
              studentCount: 0, // Reset student count
            }))
          }

          const newYear: AnoLetivo = {
            ...yearData,
            status: 'pending', // Default status
            id: Math.random().toString(36).substring(2, 11),
            turmas: replicatedTurmas,
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
            academicYears: (s.academicYears || []).map((y) =>
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
    data: Omit<Turma, 'id'>,
  ) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          const academicYears = Array.isArray(s.academicYears)
            ? s.academicYears
            : []
          return {
            ...s,
            academicYears: (academicYears || []).map((y) => {
              if (y.id === yearId) {
                // Usa turmas (com fallback para classes apenas durante migração)
                const currentTurmas = y.turmas || y.classes || []
                const newTurma = { ...data, id: Math.random().toString(36).substring(2, 11) }
                return {
                  ...y,
                  turmas: [...currentTurmas, newTurma],
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

  // Alias para compatibilidade
  const addTurma = addClassroom

  const updateClassroom = (
    schoolId: string,
    yearId: string,
    classId: string,
    data: Partial<Turma>,
  ) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          return {
            ...s,
            academicYears: (s.academicYears || []).map((y) => {
              if (y.id === yearId) {
                // Usa turmas (com fallback para classes apenas durante migração)
                const turmas = y.turmas || y.classes || []
                const updatedTurmas = turmas.map((c) =>
                  c.id === classId ? { ...c, ...data } : c,
                )
                return {
                  ...y,
                  turmas: updatedTurmas,
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

  // Alias para compatibilidade
  const updateTurma = updateClassroom

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
            academicYears: (s.academicYears || []).map((y) => {
              if (y.id === yearId) {
                // Usa turmas (com fallback para classes apenas durante migração)
                const turmas = y.turmas || y.classes || []
                const filteredTurmas = turmas.filter((c) => c.id !== classId)
                return {
                  ...y,
                  turmas: filteredTurmas,
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

  // Alias para compatibilidade
  const deleteTurma = deleteClassroom

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
        // Aliases para compatibilidade
        addTurma,
        updateTurma,
        deleteTurma,
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
