import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  GeneralSettings,
  initialSettings,
  DashboardLayout,
  initialDashboardLayout,
} from '@/lib/mock-data'

interface SettingsContextType {
  settings: GeneralSettings
  updateSettings: (data: Partial<GeneralSettings>) => void
  saveDashboardLayout: (layout: DashboardLayout) => void
  loadDashboardLayout: (id: string) => void
  activeLayout: DashboardLayout
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
        const parsed = JSON.parse(stored)
        setSettings({ ...initialSettings, ...parsed })
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

  const saveDashboardLayout = (layout: DashboardLayout) => {
    setSettings((prev) => {
      const savedLayouts = prev.savedLayouts || []
      const existingIndex = savedLayouts.findIndex((l) => l.id === layout.id)
      let newLayouts = [...savedLayouts]

      if (existingIndex >= 0) {
        newLayouts[existingIndex] = layout
      } else {
        newLayouts.push(layout)
      }

      return {
        ...prev,
        dashboardLayout: layout, // Set as active
        savedLayouts: newLayouts,
      }
    })
  }

  const loadDashboardLayout = (id: string) => {
    const layout = settings.savedLayouts?.find((l) => l.id === id)
    if (layout) {
      updateSettings({ dashboardLayout: layout })
    }
  }

  const activeLayout = settings.dashboardLayout || initialDashboardLayout

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        saveDashboardLayout,
        loadDashboardLayout,
        activeLayout,
      }}
    >
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
