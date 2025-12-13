import React, { createContext, useContext, useState, useEffect } from 'react'
import { Alert, AlertRule, mockAlerts, mockAlertRules } from '@/lib/mock-data'

interface AlertContextType {
  alerts: Alert[]
  rules: AlertRule[]
  addAlert: (alert: Omit<Alert, 'id' | 'read' | 'date'>) => void
  markAsRead: (id: string) => void
  deleteAlert: (id: string) => void
  addRule: (rule: Omit<AlertRule, 'id'>) => void
  updateRule: (id: string, data: Partial<AlertRule>) => void
  deleteRule: (id: string) => void
  unreadCount: number
}

const AlertContext = createContext<AlertContextType | null>(null)

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [rules, setRules] = useState<AlertRule[]>(mockAlertRules)

  useEffect(() => {
    const storedAlerts = localStorage.getItem('edu_alerts')
    if (storedAlerts) setAlerts(JSON.parse(storedAlerts))

    const storedRules = localStorage.getItem('edu_alert_rules')
    if (storedRules) setRules(JSON.parse(storedRules))
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_alerts', JSON.stringify(alerts))
  }, [alerts])

  useEffect(() => {
    localStorage.setItem('edu_alert_rules', JSON.stringify(rules))
  }, [rules])

  const addAlert = (data: Omit<Alert, 'id' | 'read' | 'date'>) => {
    const newAlert: Alert = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      date: new Date().toISOString(),
      read: false,
    }
    setAlerts((prev) => [newAlert, ...prev])
  }

  const markAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
    )
  }

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const addRule = (data: Omit<AlertRule, 'id'>) => {
    const newRule: AlertRule = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
    }
    setRules((prev) => [...prev, newRule])
  }

  const updateRule = (id: string, data: Partial<AlertRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)))
  }

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <AlertContext.Provider
      value={{
        alerts,
        rules,
        addAlert,
        markAsRead,
        deleteAlert,
        addRule,
        updateRule,
        deleteRule,
        unreadCount,
      }}
    >
      {children}
    </AlertContext.Provider>
  )
}

export default function useAlertStore() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlertStore must be used within an AlertProvider')
  }
  return context
}
