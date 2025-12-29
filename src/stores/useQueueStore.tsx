import React, { createContext, useContext, useState, useEffect } from 'react'
import { ServiceQueue } from '@/lib/mock-data'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface QueueContextType {
  queues: ServiceQueue[]
  addToQueue: (queue: Omit<ServiceQueue, 'id' | 'ticketNumber' | 'createdAt' | 'status'>) => void
  updateQueue: (id: string, data: Partial<ServiceQueue>) => void
  deleteQueue: (id: string) => void
  getQueue: (id: string) => ServiceQueue | undefined
  getQueuesBySchool: (schoolId: string) => ServiceQueue[]
  getActiveQueues: (schoolId: string) => ServiceQueue[]
  callNext: (schoolId: string, attendedBy: string) => ServiceQueue | null
  generateTicketNumber: (schoolId: string) => string
}

const QueueContext = createContext<QueueContextType | null>(null)

export const QueueProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [queues, setQueues] = useState<ServiceQueue[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('edu_queues')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<ServiceQueue>(parsed, {})
        setQueues(sanitized)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadQueues', source: 'localStorage' },
        })
        setQueues([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_queues', JSON.stringify(queues))
  }, [queues])

  const generateTicketNumber = (schoolId: string): string => {
    const today = new Date().toISOString().split('T')[0]
    const todayQueues = queues.filter(
      (q) => q.schoolId === schoolId && q.createdAt.startsWith(today),
    )
    const nextNumber = todayQueues.length + 1
    return `A${String(nextNumber).padStart(3, '0')}`
  }

  const addToQueue = (
    queue: Omit<ServiceQueue, 'id' | 'ticketNumber' | 'createdAt' | 'status'>,
  ) => {
    const newQueue: ServiceQueue = {
      ...queue,
      id: Math.random().toString(36).substring(2, 11),
      ticketNumber: generateTicketNumber(queue.schoolId),
      createdAt: new Date().toISOString(),
      status: 'waiting',
    }
    setQueues((prev) => [...prev, newQueue])
  }

  const updateQueue = (id: string, data: Partial<ServiceQueue>) => {
    setQueues((prev) =>
      prev.map((queue) => (queue.id === id ? { ...queue, ...data } : queue)),
    )
  }

  const deleteQueue = (id: string) => {
    setQueues((prev) => prev.filter((queue) => queue.id !== id))
  }

  const getQueue = (id: string) => {
    return queues.find((queue) => queue.id === id)
  }

  const getQueuesBySchool = (schoolId: string) => {
    return queues.filter((queue) => queue.schoolId === schoolId)
  }

  const getActiveQueues = (schoolId: string) => {
    return queues.filter(
      (queue) =>
        queue.schoolId === schoolId &&
        (queue.status === 'waiting' || queue.status === 'calling' || queue.status === 'attending'),
    )
  }

  const callNext = (schoolId: string, attendedBy: string): ServiceQueue | null => {
    const waitingQueues = queues
      .filter(
        (q) =>
          q.schoolId === schoolId &&
          (q.status === 'waiting' || q.status === 'calling'),
      )
      .sort((a, b) => {
        // Ordenar por prioridade e depois por data
        const priorityOrder = { urgent: 0, preferential: 1, normal: 2 }
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })

    if (waitingQueues.length === 0) {
      return null
    }

    const nextQueue = waitingQueues[0]
    updateQueue(nextQueue.id, {
      status: 'calling',
      calledAt: new Date().toISOString(),
    })

    return nextQueue
  }

  return (
    <QueueContext.Provider
      value={{
        queues,
        addToQueue,
        updateQueue,
        deleteQueue,
        getQueue,
        getQueuesBySchool,
        getActiveQueues,
        callNext,
        generateTicketNumber,
      }}
    >
      {children}
    </QueueContext.Provider>
  )
}

const useQueueStore = () => {
  const context = useContext(QueueContext)
  if (!context) {
    throw new Error('useQueueStore deve ser usado dentro de QueueProvider')
  }
  return context
}

export default useQueueStore

