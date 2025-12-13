import React, { createContext, useContext, useState, useEffect } from 'react'
import { Occurrence, mockOccurrences } from '@/lib/mock-data'

interface OccurrenceContextType {
  occurrences: Occurrence[]
  addOccurrence: (occurrence: Omit<Occurrence, 'id' | 'createdAt'>) => void
  getStudentOccurrences: (studentId: string) => Occurrence[]
  getClassOccurrences: (classId: string) => Occurrence[]
}

const OccurrenceContext = createContext<OccurrenceContextType | null>(null)

export const OccurrenceProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>(mockOccurrences)

  useEffect(() => {
    const stored = localStorage.getItem('edu_occurrences')
    if (stored) {
      setOccurrences(JSON.parse(stored))
    } else {
      localStorage.setItem('edu_occurrences', JSON.stringify(mockOccurrences))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_occurrences', JSON.stringify(occurrences))
  }, [occurrences])

  const addOccurrence = (data: Omit<Occurrence, 'id' | 'createdAt'>) => {
    const newOccurrence: Occurrence = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    }
    setOccurrences((prev) => [...prev, newOccurrence])
  }

  const getStudentOccurrences = (studentId: string) => {
    return occurrences.filter((o) => o.studentId === studentId)
  }

  const getClassOccurrences = (classId: string) => {
    return occurrences.filter((o) => o.classroomId === classId)
  }

  return (
    <OccurrenceContext.Provider
      value={{
        occurrences,
        addOccurrence,
        getStudentOccurrences,
        getClassOccurrences,
      }}
    >
      {children}
    </OccurrenceContext.Provider>
  )
}

export default function useOccurrenceStore() {
  const context = useContext(OccurrenceContext)
  if (!context) {
    throw new Error(
      'useOccurrenceStore must be used within an OccurrenceProvider',
    )
  }
  return context
}
