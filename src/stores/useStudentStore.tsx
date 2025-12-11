import React, { createContext, useContext, useState, useEffect } from 'react'
import { Student, mockStudents, Enrollment } from '@/lib/mock-data'
import { differenceInYears } from 'date-fns'

interface StudentContextType {
  students: Student[]
  addStudent: (
    student: Omit<Student, 'id' | 'enrollments' | 'projectIds'>,
    initialEnrollment: Omit<Enrollment, 'id' | 'status' | 'type'>,
  ) => void
  updateStudent: (id: string, data: Partial<Student>) => void
  deleteStudent: (id: string) => void
  getStudent: (id: string) => Student | undefined
  addEnrollment: (studentId: string, enrollment: Omit<Enrollment, 'id'>) => void
  updateEnrollment: (
    studentId: string,
    enrollmentId: string,
    data: Partial<Enrollment>,
  ) => void
  addProjectEnrollment: (studentId: string, projectId: string) => void
  removeProjectEnrollment: (studentId: string, projectId: string) => void
}

const StudentContext = createContext<StudentContextType | null>(null)

export const StudentProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [students, setStudents] = useState<Student[]>(mockStudents)

  useEffect(() => {
    const stored = localStorage.getItem('edu_students')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          // Robust data sanitization to ensure arrays and objects exist
          const sanitized = parsed.map((s: any) => ({
            ...s,
            enrollments: Array.isArray(s.enrollments) ? s.enrollments : [],
            projectIds: Array.isArray(s.projectIds) ? s.projectIds : [],
            // Ensure nested objects exist to prevent crashes
            address: s.address || {
              street: '',
              number: '',
              neighborhood: '',
              city: '',
              state: '',
              zipCode: '',
            },
            contacts: s.contacts || {
              phone: '',
              email: '',
            },
            social: s.social || {
              bolsaFamilia: false,
              nis: '',
            },
            transport: s.transport || {
              uses: false,
            },
            health: s.health || {
              hasSpecialNeeds: false,
            },
          }))
          setStudents(sanitized)
        } else {
          setStudents(mockStudents)
        }
      } catch (e) {
        console.error('Failed to load students from localStorage', e)
        setStudents(mockStudents)
      }
    } else {
      localStorage.setItem('edu_students', JSON.stringify(mockStudents))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_students', JSON.stringify(students))
  }, [students])

  const addStudent = (
    data: Omit<Student, 'id' | 'enrollments' | 'projectIds'>,
    initialEnrollment: Omit<Enrollment, 'id' | 'status' | 'type'>,
  ) => {
    const enrollment: Enrollment = {
      ...initialEnrollment,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Cursando',
      type: 'regular',
    }

    const newStudent: Student = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      enrollments: [enrollment],
      projectIds: [],
      // Legacy support
      grade: initialEnrollment.grade,
      status: 'Cursando',
      email: data.contacts.email,
      phone: data.contacts.phone,
      age: data.birthDate
        ? differenceInYears(new Date(), new Date(data.birthDate))
        : 0,
    }
    setStudents((prev) => [...prev, newStudent])
  }

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...data }
          // Recalculate helpers if needed
          if (data.birthDate) {
            updated.age = differenceInYears(
              new Date(),
              new Date(data.birthDate),
            )
          }
          if (data.contacts) {
            updated.email = data.contacts.email
            updated.phone = data.contacts.phone
          }
          return updated
        }
        return s
      }),
    )
  }

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  const getStudent = (id: string) => {
    return students.find((s) => s.id === id)
  }

  const addEnrollment = (
    studentId: string,
    enrollmentData: Omit<Enrollment, 'id'>,
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const newEnrollment: Enrollment = {
            ...enrollmentData,
            id: Math.random().toString(36).substr(2, 9),
          }
          const currentEnrollments = s.enrollments || []
          return {
            ...s,
            enrollments: [...currentEnrollments, newEnrollment],
            // Update "current" grade/status if it's a regular enrollment
            ...(enrollmentData.type === 'regular' &&
            enrollmentData.status === 'Cursando'
              ? {
                  grade: enrollmentData.grade,
                  status: enrollmentData.status,
                }
              : {}),
          }
        }
        return s
      }),
    )
  }

  const updateEnrollment = (
    studentId: string,
    enrollmentId: string,
    data: Partial<Enrollment>,
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            enrollments: s.enrollments.map((e) =>
              e.id === enrollmentId ? { ...e, ...data } : e,
            ),
          }
        }
        return s
      }),
    )
  }

  const addProjectEnrollment = (studentId: string, projectId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        const currentProjects = s.projectIds || []
        if (s.id === studentId && !currentProjects.includes(projectId)) {
          return { ...s, projectIds: [...currentProjects, projectId] }
        }
        return s
      }),
    )
  }

  const removeProjectEnrollment = (studentId: string, projectId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const currentProjects = s.projectIds || []
          return {
            ...s,
            projectIds: currentProjects.filter((id) => id !== projectId),
          }
        }
        return s
      }),
    )
  }

  return (
    <StudentContext.Provider
      value={{
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        getStudent,
        addEnrollment,
        updateEnrollment,
        addProjectEnrollment,
        removeProjectEnrollment,
      }}
    >
      {children}
    </StudentContext.Provider>
  )
}

export default function useStudentStore() {
  const context = useContext(StudentContext)
  if (!context) {
    throw new Error('useStudentStore must be used within a StudentProvider')
  }
  return context
}
