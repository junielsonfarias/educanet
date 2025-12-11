import React, { createContext, useContext, useState, useEffect } from 'react'
import { GeneralSettings, initialSettings } from '@/lib/mock-data'

interface SettingsContextType {
  settings: GeneralSettings
  updateSettings: (data: Partial<GeneralSettings>) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [settings, setSettings] = useState<GeneralSettings>(initialSettings)

  useEffect(() => {
    const stored = localStorage.getItem('edu_settings')
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse settings from local storage:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_settings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (data: Partial<GeneralSettings>) => {
    setSettings((prev) => ({ ...prev, ...data }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export default function useSettingsStore() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettingsStore must be used within a SettingsProvider')
  }
  return context
}
