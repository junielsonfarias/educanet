import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  Course,
  mockCourses,
  EvaluationRule,
  mockEvaluationRules,
  Grade,
  Subject,
} from '@/lib/mock-data'

interface CourseContextType {
  courses: Course[]
  evaluationRules: EvaluationRule[]
  addCourse: (course: Omit<Course, 'id' | 'grades'>) => void
  updateCourse: (id: string, data: Partial<Course>) => void
  addGrade: (courseId: string, grade: Omit<Grade, 'id' | 'subjects'>) => void
  updateGrade: (courseId: string, gradeId: string, data: Partial<Grade>) => void
  addSubject: (
    courseId: string,
    gradeId: string,
    subject: Omit<Subject, 'id'>,
  ) => void
  updateSubject: (
    courseId: string,
    gradeId: string,
    subjectId: string,
    data: Partial<Subject>,
  ) => void
  removeSubject: (courseId: string, gradeId: string, subjectId: string) => void
  addEvaluationRule: (rule: Omit<EvaluationRule, 'id'>) => void
  updateEvaluationRule: (id: string, rule: Partial<EvaluationRule>) => void
  getCourse: (id: string) => Course | undefined
}

const CourseContext = createContext<CourseContextType | null>(null)

export const CourseProvider = ({ children }: { children: React.ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>(mockCourses)
  const [evaluationRules, setEvaluationRules] =
    useState<EvaluationRule[]>(mockEvaluationRules)

  useEffect(() => {
    const storedCourses = localStorage.getItem('edu_courses')
    if (storedCourses) setCourses(JSON.parse(storedCourses))

    const storedRules = localStorage.getItem('edu_eval_rules')
    if (storedRules) setEvaluationRules(JSON.parse(storedRules))
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_courses', JSON.stringify(courses))
  }, [courses])

  useEffect(() => {
    localStorage.setItem('edu_eval_rules', JSON.stringify(evaluationRules))
  }, [evaluationRules])

  const addCourse = (data: Omit<Course, 'id' | 'grades'>) => {
    const newCourse: Course = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      grades: [],
    }
    setCourses((prev) => [...prev, newCourse])
  }

  const updateCourse = (id: string, data: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }

  const addGrade = (courseId: string, data: Omit<Grade, 'id' | 'subjects'>) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            grades: [
              ...c.grades,
              {
                ...data,
                id: Math.random().toString(36).substr(2, 9),
                subjects: [],
              },
            ],
          }
        }
        return c
      }),
    )
  }

  const updateGrade = (
    courseId: string,
    gradeId: string,
    data: Partial<Grade>,
  ) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            grades: c.grades.map((g) =>
              g.id === gradeId ? { ...g, ...data } : g,
            ),
          }
        }
        return c
      }),
    )
  }

  const addSubject = (
    courseId: string,
    gradeId: string,
    data: Omit<Subject, 'id'>,
  ) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            grades: c.grades.map((g) => {
              if (g.id === gradeId) {
                return {
                  ...g,
                  subjects: [
                    ...g.subjects,
                    { ...data, id: Math.random().toString(36).substr(2, 9) },
                  ],
                }
              }
              return g
            }),
          }
        }
        return c
      }),
    )
  }

  const updateSubject = (
    courseId: string,
    gradeId: string,
    subjectId: string,
    data: Partial<Subject>,
  ) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            grades: c.grades.map((g) => {
              if (g.id === gradeId) {
                return {
                  ...g,
                  subjects: g.subjects.map((s) =>
                    s.id === subjectId ? { ...s, ...data } : s,
                  ),
                }
              }
              return g
            }),
          }
        }
        return c
      }),
    )
  }

  const removeSubject = (
    courseId: string,
    gradeId: string,
    subjectId: string,
  ) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            grades: c.grades.map((g) => {
              if (g.id === gradeId) {
                return {
                  ...g,
                  subjects: g.subjects.filter((s) => s.id !== subjectId),
                }
              }
              return g
            }),
          }
        }
        return c
      }),
    )
  }

  const addEvaluationRule = (data: Omit<EvaluationRule, 'id'>) => {
    const newRule: EvaluationRule = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
    }
    setEvaluationRules((prev) => [...prev, newRule])
  }

  const updateEvaluationRule = (id: string, data: Partial<EvaluationRule>) => {
    setEvaluationRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r)),
    )
  }

  const getCourse = (id: string) => courses.find((c) => c.id === id)

  return (
    <CourseContext.Provider
      value={{
        courses,
        evaluationRules,
        addCourse,
        updateCourse,
        addGrade,
        updateGrade,
        addSubject,
        updateSubject,
        removeSubject,
        addEvaluationRule,
        updateEvaluationRule,
        getCourse,
      }}
    >
      {children}
    </CourseContext.Provider>
  )
}

export default function useCourseStore() {
  const context = useContext(CourseContext)
  if (!context)
    throw new Error('useCourseStore must be used within a CourseProvider')
  return context
}
