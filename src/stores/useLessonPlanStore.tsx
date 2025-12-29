import React, { createContext, useContext, useState, useEffect } from 'react'
import { LessonPlan, mockLessonPlans } from '@/lib/mock-data'
import { sanitizeStoreData } from '@/lib/data-sanitizer'
import { handleError } from '@/lib/error-handling'

interface LessonPlanContextType {
  lessonPlans: LessonPlan[]
  addLessonPlan: (
    plan: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void
  updateLessonPlan: (id: string, data: Partial<LessonPlan>) => void
  deleteLessonPlan: (id: string) => void
  getTeacherPlans: (teacherId: string) => LessonPlan[]
  getPlansByClass: (classId: string) => LessonPlan[]
}

const LessonPlanContext = createContext<LessonPlanContextType | null>(null)

export const LessonPlanProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(mockLessonPlans)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('edu_lesson_plans')
      if (stored) {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<LessonPlan>(parsed, {
          arrayFields: ['objectives', 'activities', 'resources'],
        })
        setLessonPlans(sanitized.length > 0 ? sanitized : mockLessonPlans)
      } else {
        localStorage.setItem('edu_lesson_plans', JSON.stringify(mockLessonPlans))
      }
    } catch (error) {
      handleError(error as Error, {
        showToast: false,
        context: { action: 'loadLessonPlans', source: 'localStorage' },
      })
      setLessonPlans(mockLessonPlans)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_lesson_plans', JSON.stringify(lessonPlans))
  }, [lessonPlans])

  const addLessonPlan = (
    data: Omit<LessonPlan, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const newPlan: LessonPlan = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setLessonPlans((prev) => [...prev, newPlan])
  }

  const updateLessonPlan = (id: string, data: Partial<LessonPlan>) => {
    setLessonPlans((prev) =>
      prev.map((plan) =>
        plan.id === id
          ? { ...plan, ...data, updatedAt: new Date().toISOString() }
          : plan,
      ),
    )
  }

  const deleteLessonPlan = (id: string) => {
    setLessonPlans((prev) => prev.filter((p) => p.id !== id))
  }

  const getTeacherPlans = (teacherId: string) => {
    return lessonPlans.filter((p) => p.teacherId === teacherId)
  }

  const getPlansByClass = (classId: string) => {
    return lessonPlans.filter((p) => p.classroomId === classId)
  }

  return (
    <LessonPlanContext.Provider
      value={{
        lessonPlans,
        addLessonPlan,
        updateLessonPlan,
        deleteLessonPlan,
        getTeacherPlans,
        getPlansByClass,
      }}
    >
      {children}
    </LessonPlanContext.Provider>
  )
}

export default function useLessonPlanStore() {
  const context = useContext(LessonPlanContext)
  if (!context) {
    throw new Error(
      'useLessonPlanStore must be used within a LessonPlanProvider',
    )
  }
  return context
}
