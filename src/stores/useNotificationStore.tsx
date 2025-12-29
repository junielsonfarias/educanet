import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  Notification,
  NotificationTemplate,
  NotificationSettings,
} from '@/lib/mock-data'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface NotificationContextType {
  notifications: Notification[]
  templates: NotificationTemplate[]
  settings: NotificationSettings[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  updateNotification: (id: string, data: Partial<Notification>) => void
  deleteNotification: (id: string) => void
  getNotification: (id: string) => Notification | undefined
  getNotificationsByRecipient: (recipientId: string) => Notification[]
  addTemplate: (template: Omit<NotificationTemplate, 'id'>) => void
  updateTemplate: (id: string, data: Partial<NotificationTemplate>) => void
  deleteTemplate: (id: string) => void
  getTemplate: (id: string) => NotificationTemplate | undefined
  getSettings: (userId: string) => NotificationSettings | undefined
  updateSettings: (userId: string, settings: Partial<NotificationSettings>) => void
  sendNotification: (notification: Omit<Notification, 'id' | 'status' | 'sentAt'>) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [settings, setSettings] = useState<NotificationSettings[]>([])

  useEffect(() => {
    const storedNotifications = localStorage.getItem('edu_notifications')
    const storedTemplates = localStorage.getItem('edu_notification_templates')
    const storedSettings = localStorage.getItem('edu_notification_settings')

    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications)
        const sanitized = sanitizeStoreData<Notification>(parsed, {})
        setNotifications(sanitized)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadNotifications', source: 'localStorage' },
        })
        setNotifications([])
      }
    }

    if (storedTemplates) {
      try {
        const parsed = JSON.parse(storedTemplates)
        const sanitized = sanitizeStoreData<NotificationTemplate>(parsed, {
          arrayFields: ['variables'],
        })
        setTemplates(sanitized)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadTemplates', source: 'localStorage' },
        })
        setTemplates([])
      }
    }

    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings)
        const sanitized = sanitizeStoreData<NotificationSettings>(parsed, {})
        setSettings(sanitized)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadSettings', source: 'localStorage' },
        })
        setSettings([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem('edu_notification_templates', JSON.stringify(templates))
  }, [templates])

  useEffect(() => {
    localStorage.setItem('edu_notification_settings', JSON.stringify(settings))
  }, [settings])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 11),
    }
    setNotifications((prev) => [...prev, newNotification])
  }

  const updateNotification = (id: string, data: Partial<Notification>) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, ...data } : notif)),
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const getNotification = (id: string) => {
    return notifications.find((notif) => notif.id === id)
  }

  const getNotificationsByRecipient = (recipientId: string) => {
    return notifications.filter((notif) => notif.recipient.id === recipientId)
  }

  const addTemplate = (template: Omit<NotificationTemplate, 'id'>) => {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: Math.random().toString(36).substring(2, 11),
    }
    setTemplates((prev) => [...prev, newTemplate])
  }

  const updateTemplate = (id: string, data: Partial<NotificationTemplate>) => {
    setTemplates((prev) =>
      prev.map((template) => (template.id === id ? { ...template, ...data } : template)),
    )
  }

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((template) => template.id !== id))
  }

  const getTemplate = (id: string) => {
    return templates.find((template) => template.id === id)
  }

  const getSettings = (userId: string) => {
    return settings.find((s) => s.userId === userId)
  }

  const updateSettings = (userId: string, newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const existing = prev.find((s) => s.userId === userId)
      if (existing) {
        return prev.map((s) =>
          s.userId === userId ? { ...s, ...newSettings } : s,
        )
      }
      return [
        ...prev,
        {
          userId,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: false,
          preferences: {
            boletim: true,
            frequencia: true,
            avisos: true,
            eventos: true,
          },
          ...newSettings,
        } as NotificationSettings,
      ]
    })
  }

  const sendNotification = async (
    notification: Omit<Notification, 'id' | 'status' | 'sentAt'>,
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 11),
      status: 'pending',
    }

    setNotifications((prev) => [...prev, newNotification])

    // Simular envio (em produção, aqui seria a chamada à API)
    try {
      // TODO: Implementar integração real com serviço de e-mail/SMS
      await new Promise((resolve) => setTimeout(resolve, 1000))

      updateNotification(newNotification.id, {
        status: 'sent',
        sentAt: new Date().toISOString(),
      })
    } catch (error) {
      handleError(error as Error, {
        showToast: true,
        context: { action: 'sendNotification', notificationId: newNotification.id },
      })
      updateNotification(newNotification.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        templates,
        settings,
        addNotification,
        updateNotification,
        deleteNotification,
        getNotification,
        getNotificationsByRecipient,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplate,
        getSettings,
        updateSettings,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

const useNotificationStore = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotificationStore deve ser usado dentro de NotificationProvider',
    )
  }
  return context
}

export default useNotificationStore

