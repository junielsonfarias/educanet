import React, { createContext, useContext, useState, useEffect } from 'react'
import { Assessment, mockAssessments } from '@/lib/mock-data'

interface AssessmentContextType {
  assessments: Assessment[]
  addAssessment: (assessment: Omit<Assessment, 'id'>) => void
  updateAssessment: (id: string, data: Partial<Assessment>) => void
  getStudentAssessments: (studentId: string) => Assessment[]
  getAssessmentsByClass: (
    classId: string,
    subjectId: string,
    periodId: string,
  ) => Assessment[]
}

const AssessmentContext = createContext<AssessmentContextType | null>(null)

export const AssessmentProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [assessments, setAssessments] = useState<Assessment[]>(mockAssessments)

  useEffect(() => {
    const stored = localStorage.getItem('edu_assessments')
    if (stored) {
      setAssessments(JSON.parse(stored))
    } else {
      localStorage.setItem('edu_assessments', JSON.stringify(mockAssessments))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_assessments', JSON.stringify(assessments))
  }, [assessments])

  const addAssessment = (data: Omit<Assessment, 'id'>) => {
    // Check if assessment already exists for this student/subject/period AND category
    const category = data.category || 'regular'
    const existingIndex = assessments.findIndex(
      (a) =>
        a.studentId === data.studentId &&
        a.subjectId === data.subjectId &&
        a.periodId === data.periodId &&
        (a.category || 'regular') === category,
    )

    if (existingIndex >= 0) {
      // Update existing
      setAssessments((prev) =>
        prev.map((a, i) =>
          i === existingIndex
            ? { ...a, value: data.value, date: data.date }
            : a,
        ),
      )
    } else {
      // Create new
      const newAssessment: Assessment = {
        ...data,
        category, // ensure category is set
        id: Math.random().toString(36).substr(2, 9),
      }
      setAssessments((prev) => [...prev, newAssessment])
    }
  }

  const updateAssessment = (id: string, data: Partial<Assessment>) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data } : a)),
    )
  }

  const getStudentAssessments = (studentId: string) => {
    return assessments.filter((a) => a.studentId === studentId)
  }

  const getAssessmentsByClass = (
    classId: string,
    subjectId: string,
    periodId: string,
  ) => {
    return assessments.filter(
      (a) =>
        a.classroomId === classId &&
        a.subjectId === subjectId &&
        a.periodId === periodId,
    )
  }

  return (
    <AssessmentContext.Provider
      value={{
        assessments,
        addAssessment,
        updateAssessment,
        getStudentAssessments,
        getAssessmentsByClass,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  )
}

export default function useAssessmentStore() {
  const context = useContext(AssessmentContext)
  if (!context) {
    throw new Error(
      'useAssessmentStore must be used within an AssessmentProvider',
    )
  }
  return context
}
