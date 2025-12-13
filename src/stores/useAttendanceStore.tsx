import React, { createContext, useContext, useState, useEffect } from 'react'
import { AttendanceRecord, mockAttendance } from '@/lib/mock-data'

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[]
  addAttendance: (record: Omit<AttendanceRecord, 'id'>) => void
  getStudentAttendance: (studentId: string) => AttendanceRecord[]
  getClassAttendance: (
    classId: string,
    subjectId: string,
    date: string,
  ) => AttendanceRecord[]
}

const AttendanceContext = createContext<AttendanceContextType | null>(null)

export const AttendanceProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [attendanceRecords, setAttendanceRecords] =
    useState<AttendanceRecord[]>(mockAttendance)

  useEffect(() => {
    const stored = localStorage.getItem('edu_attendance')
    if (stored) {
      try {
        setAttendanceRecords(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse attendance from local storage:', error)
      }
    } else {
      localStorage.setItem('edu_attendance', JSON.stringify(mockAttendance))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_attendance', JSON.stringify(attendanceRecords))
  }, [attendanceRecords])

  const addAttendance = (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: Math.random().toString(36).substring(2, 11),
    }
    setAttendanceRecords((prev) => [...prev, newRecord])
  }

  const getStudentAttendance = (studentId: string) => {
    return attendanceRecords.filter((r) => r.studentId === studentId)
  }

  const getClassAttendance = (
    classId: string,
    subjectId: string,
    date: string,
  ) => {
    return attendanceRecords.filter(
      (r) =>
        r.classroomId === classId &&
        r.subjectId === subjectId &&
        r.date === date,
    )
  }

  return (
    <AttendanceContext.Provider
      value={{
        attendanceRecords,
        addAttendance,
        getStudentAttendance,
        getClassAttendance,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  )
}

export default function useAttendanceStore() {
  const context = useContext(AttendanceContext)
  if (!context) {
    throw new Error(
      'useAttendanceStore must be used within an AttendanceProvider',
    )
  }
  return context
}
