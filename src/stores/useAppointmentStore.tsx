import React, { createContext, useContext, useState, useEffect } from 'react'
import { Appointment } from '@/lib/mock-data'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface AppointmentContextType {
  appointments: Appointment[]
  addAppointment: (appointment: Omit<Appointment, 'id' | 'reminderSent'>) => void
  updateAppointment: (id: string, data: Partial<Appointment>) => void
  deleteAppointment: (id: string) => void
  getAppointment: (id: string) => Appointment | undefined
  getAppointmentsBySchool: (schoolId: string, date?: string) => Appointment[]
  getAppointmentsByDate: (date: string) => Appointment[]
  confirmAppointment: (id: string) => void
  cancelAppointment: (id: string) => void
}

const AppointmentContext = createContext<AppointmentContextType | null>(null)

export const AppointmentProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('edu_appointments')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<Appointment>(parsed, {})
        setAppointments(sanitized)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadAppointments', source: 'localStorage' },
        })
        setAppointments([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_appointments', JSON.stringify(appointments))
  }, [appointments])

  const addAppointment = (appointment: Omit<Appointment, 'id' | 'reminderSent'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: Math.random().toString(36).substring(2, 11),
      reminderSent: false,
    }
    setAppointments((prev) => [...prev, newAppointment])
  }

  const updateAppointment = (id: string, data: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id ? { ...appointment, ...data } : appointment,
      ),
    )
  }

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((appointment) => appointment.id !== id))
  }

  const getAppointment = (id: string) => {
    return appointments.find((appointment) => appointment.id === id)
  }

  const getAppointmentsBySchool = (schoolId: string, date?: string) => {
    let filtered = appointments.filter((appointment) => appointment.schoolId === schoolId)
    if (date) {
      filtered = filtered.filter((appointment) => appointment.date === date)
    }
    return filtered
  }

  const getAppointmentsByDate = (date: string) => {
    return appointments.filter((appointment) => appointment.date === date)
  }

  const confirmAppointment = (id: string) => {
    updateAppointment(id, {
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
    })
  }

  const cancelAppointment = (id: string) => {
    updateAppointment(id, {
      status: 'cancelled',
    })
  }

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        getAppointment,
        getAppointmentsBySchool,
        getAppointmentsByDate,
        confirmAppointment,
        cancelAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  )
}

const useAppointmentStore = () => {
  const context = useContext(AppointmentContext)
  if (!context) {
    throw new Error(
      'useAppointmentStore deve ser usado dentro de AppointmentProvider',
    )
  }
  return context
}

export default useAppointmentStore

