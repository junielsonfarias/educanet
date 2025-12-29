import React, { createContext, useContext, useState, useEffect } from 'react'
import { ClassCouncil, StudentCouncilAnalysis, CouncilMember } from '@/lib/mock-data'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface CouncilContextType {
  councils: ClassCouncil[]
  addCouncil: (council: Omit<ClassCouncil, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCouncil: (id: string, data: Partial<ClassCouncil>) => void
  deleteCouncil: (id: string) => void
  getCouncil: (id: string) => ClassCouncil | undefined
  getCouncilsByClassroom: (classroomId: string, academicYearId: string) => ClassCouncil[]
  getCouncilsBySchool: (schoolId: string) => ClassCouncil[]
  addStudentAnalysis: (councilId: string, analysis: StudentCouncilAnalysis) => void
  updateStudentAnalysis: (councilId: string, studentId: string, data: Partial<StudentCouncilAnalysis>) => void
  addCouncilMember: (councilId: string, member: CouncilMember) => void
  removeCouncilMember: (councilId: string, memberId: string) => void
}

const CouncilContext = createContext<CouncilContextType | null>(null)

export const CouncilProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [councils, setCouncils] = useState<ClassCouncil[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('edu_councils')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<ClassCouncil>(parsed, {
          arrayFields: ['members', 'studentAnalyses'],
        })
        setCouncils(sanitized)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadCouncils', source: 'localStorage' },
        })
        setCouncils([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_councils', JSON.stringify(councils))
  }, [councils])

  const addCouncil = (
    council: Omit<ClassCouncil, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const now = new Date().toISOString()
    const newCouncil: ClassCouncil = {
      ...council,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: now,
      updatedAt: now,
    }
    setCouncils((prev) => [...prev, newCouncil])
  }

  const updateCouncil = (id: string, data: Partial<ClassCouncil>) => {
    setCouncils((prev) =>
      prev.map((council) => {
        if (council.id === id) {
          return {
            ...council,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        }
        return council
      }),
    )
  }

  const deleteCouncil = (id: string) => {
    setCouncils((prev) => prev.filter((council) => council.id !== id))
  }

  const getCouncil = (id: string) => {
    return councils.find((council) => council.id === id)
  }

  const getCouncilsByClassroom = (classroomId: string, academicYearId: string) => {
    return councils.filter(
      (council) =>
        council.classroomId === classroomId &&
        council.academicYearId === academicYearId,
    )
  }

  const getCouncilsBySchool = (schoolId: string) => {
    return councils.filter((council) => council.schoolId === schoolId)
  }

  const addStudentAnalysis = (councilId: string, analysis: StudentCouncilAnalysis) => {
    setCouncils((prev) =>
      prev.map((council) => {
        if (council.id === councilId) {
          return {
            ...council,
            studentsAnalysis: [...council.studentsAnalysis, analysis],
            updatedAt: new Date().toISOString(),
          }
        }
        return council
      }),
    )
  }

  const updateStudentAnalysis = (
    councilId: string,
    studentId: string,
    data: Partial<StudentCouncilAnalysis>,
  ) => {
    setCouncils((prev) =>
      prev.map((council) => {
        if (council.id === councilId) {
          return {
            ...council,
            studentsAnalysis: council.studentsAnalysis.map((analysis) =>
              analysis.studentId === studentId
                ? { ...analysis, ...data }
                : analysis,
            ),
            updatedAt: new Date().toISOString(),
          }
        }
        return council
      }),
    )
  }

  const addCouncilMember = (councilId: string, member: CouncilMember) => {
    setCouncils((prev) =>
      prev.map((council) => {
        if (council.id === councilId) {
          return {
            ...council,
            members: [...council.members, member],
            updatedAt: new Date().toISOString(),
          }
        }
        return council
      }),
    )
  }

  const removeCouncilMember = (councilId: string, memberId: string) => {
    setCouncils((prev) =>
      prev.map((council) => {
        if (council.id === councilId) {
          return {
            ...council,
            members: council.members.filter((m) => m.id !== memberId),
            updatedAt: new Date().toISOString(),
          }
        }
        return council
      }),
    )
  }

  return (
    <CouncilContext.Provider
      value={{
        councils,
        addCouncil,
        updateCouncil,
        deleteCouncil,
        getCouncil,
        getCouncilsByClassroom,
        getCouncilsBySchool,
        addStudentAnalysis,
        updateStudentAnalysis,
        addCouncilMember,
        removeCouncilMember,
      }}
    >
      {children}
    </CouncilContext.Provider>
  )
}

const useCouncilStore = () => {
  const context = useContext(CouncilContext)
  if (!context) {
    throw new Error('useCouncilStore deve ser usado dentro de CouncilProvider')
  }
  return context
}

export default useCouncilStore

