import React, { createContext, useContext, useState, useEffect } from 'react'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

export interface CustomReportConfig {
  id: string
  name: string
  description?: string
  fields: string[]
  filters: {
    schoolId?: string
    yearId?: string
    status?: string
    classId?: string
  }
  createdAt: string
}

interface ReportContextType {
  savedReports: CustomReportConfig[]
  saveReportConfig: (
    config: Omit<CustomReportConfig, 'id' | 'createdAt'>,
  ) => void
  deleteReportConfig: (id: string) => void
  getReportConfig: (id: string) => CustomReportConfig | undefined
}

const ReportContext = createContext<ReportContextType | null>(null)

export const ReportProvider = ({ children }: { children: React.ReactNode }) => {
  const [savedReports, setSavedReports] = useState<CustomReportConfig[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('edu_custom_reports')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<CustomReportConfig>(parsed, {
          arrayFields: ['fields'],
          objectFields: {
            filters: {},
          },
        })
        setSavedReports(sanitized)
      } catch (e) {
        handleError(e as Error, {
          showToast: false,
          context: { action: 'loadReports', source: 'localStorage' },
        })
        setSavedReports([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_custom_reports', JSON.stringify(savedReports))
  }, [savedReports])

  const saveReportConfig = (
    config: Omit<CustomReportConfig, 'id' | 'createdAt'>,
  ) => {
    const newReport: CustomReportConfig = {
      ...config,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    }
    setSavedReports((prev) => [...prev, newReport])
  }

  const deleteReportConfig = (id: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id))
  }

  const getReportConfig = (id: string) => savedReports.find((r) => r.id === id)

  return (
    <ReportContext.Provider
      value={{
        savedReports,
        saveReportConfig,
        deleteReportConfig,
        getReportConfig,
      }}
    >
      {children}
    </ReportContext.Provider>
  )
}

export default function useReportStore() {
  const context = useContext(ReportContext)
  if (!context) {
    throw new Error('useReportStore must be used within a ReportProvider')
  }
  return context
}
