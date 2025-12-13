import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  Assessment,
  mockAssessments,
  AssessmentType,
  mockAssessmentTypes,
} from '@/lib/mock-data'

interface AssessmentContextType {
  assessments: Assessment[]
  assessmentTypes: AssessmentType[]
  addAssessment: (assessment: Omit<Assessment, 'id'>) => void
  updateAssessment: (id: string, data: Partial<Assessment>) => void
  getStudentAssessments: (studentId: string) => Assessment[]
  getAssessmentsByClass: (
    classId: string,
    subjectId: string,
    periodId: string,
  ) => Assessment[]
  addAssessmentType: (type: Omit<AssessmentType, 'id'>) => void
  updateAssessmentType: (id: string, data: Partial<AssessmentType>) => void
  deleteAssessmentType: (id: string) => void
}

const AssessmentContext = createContext<AssessmentContextType | null>(null)

export const AssessmentProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [assessments, setAssessments] = useState<Assessment[]>(mockAssessments)
  const [assessmentTypes, setAssessmentTypes] =
    useState<AssessmentType[]>(mockAssessmentTypes)

  useEffect(() => {
    const stored = localStorage.getItem('edu_assessments')
    if (stored) {
      setAssessments(JSON.parse(stored))
    } else {
      localStorage.setItem('edu_assessments', JSON.stringify(mockAssessments))
    }

    const storedTypes = localStorage.getItem('edu_assessment_types')
    if (storedTypes) {
      setAssessmentTypes(JSON.parse(storedTypes))
    } else {
      localStorage.setItem(
        'edu_assessment_types',
        JSON.stringify(mockAssessmentTypes),
      )
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_assessments', JSON.stringify(assessments))
  }, [assessments])

  useEffect(() => {
    localStorage.setItem(
      'edu_assessment_types',
      JSON.stringify(assessmentTypes),
    )
  }, [assessmentTypes])

  const addAssessment = (data: Omit<Assessment, 'id'>) => {
    // Check if assessment already exists for this student/subject/period AND category AND type
    // If multiple types exist per period, we must differentiate.
    // For now, assuming replacement logic handles upgrades or specific type instances.
    // Simplified logic: Append if different type, update if same type/category/period.
    const category = data.category || 'regular'
    const typeId = data.assessmentTypeId

    const existingIndex = assessments.findIndex(
      (a) =>
        a.studentId === data.studentId &&
        a.subjectId === data.subjectId &&
        a.periodId === data.periodId &&
        (a.category || 'regular') === category &&
        a.assessmentTypeId === typeId, // Differentiate by type as well
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
        id: Math.random().toString(36).substring(2, 11),
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

  const addAssessmentType = (data: Omit<AssessmentType, 'id'>) => {
    const newType: AssessmentType = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
    }
    setAssessmentTypes((prev) => [...prev, newType])
  }

  const updateAssessmentType = (id: string, data: Partial<AssessmentType>) => {
    setAssessmentTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
    )
  }

  const deleteAssessmentType = (id: string) => {
    setAssessmentTypes((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <AssessmentContext.Provider
      value={{
        assessments,
        assessmentTypes,
        addAssessment,
        updateAssessment,
        getStudentAssessments,
        getAssessmentsByClass,
        addAssessmentType,
        updateAssessmentType,
        deleteAssessmentType,
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
