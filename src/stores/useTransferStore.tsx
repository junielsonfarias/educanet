import React, { createContext, useContext, useState, useEffect } from 'react'
import { StudentTransfer } from '@/lib/mock-data'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface TransferContextType {
  transfers: StudentTransfer[]
  addTransfer: (transfer: Omit<StudentTransfer, 'id' | 'createdAt' | 'updatedAt' | 'notificationSent' | 'status'>) => void
  updateTransfer: (id: string, data: Partial<StudentTransfer>) => void
  deleteTransfer: (id: string) => void
  getTransfer: (id: string) => StudentTransfer | undefined
  getTransfersByStudent: (studentId: string) => StudentTransfer[]
  getTransfersBySchool: (schoolId: string) => StudentTransfer[]
  getPendingTransfers: (schoolId?: string) => StudentTransfer[]
  approveTransfer: (id: string, approvedBy: string) => void
  rejectTransfer: (id: string, approvedBy: string, reason?: string) => void
  completeTransfer: (id: string) => void
  sendNotification: (id: string) => Promise<void>
}

const TransferContext = createContext<TransferContextType | null>(null)

export const TransferProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [transfers, setTransfers] = useState<StudentTransfer[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('edu_transfers')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<StudentTransfer>(parsed, {})
        setTransfers(sanitized)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadTransfers', source: 'localStorage' },
        })
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_transfers', JSON.stringify(transfers))
  }, [transfers])

  const addTransfer = (
    transfer: Omit<StudentTransfer, 'id' | 'createdAt' | 'updatedAt' | 'notificationSent' | 'status'>,
  ) => {
    const now = new Date().toISOString()
    const newTransfer: StudentTransfer = {
      ...transfer,
      id: Math.random().toString(36).substring(2, 11),
      status: 'pending',
      notificationSent: false,
      createdAt: now,
      updatedAt: now,
    }
    setTransfers((prev) => [...prev, newTransfer])
    
    // Enviar notificação automaticamente se for transferência interna
    if (transfer.type === 'internal' && transfer.toSchoolId) {
      sendNotification(newTransfer.id)
    }
  }

  const updateTransfer = (id: string, data: Partial<StudentTransfer>) => {
    setTransfers((prev) =>
      prev.map((transfer) => {
        if (transfer.id === id) {
          return {
            ...transfer,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        }
        return transfer
      }),
    )
  }

  const deleteTransfer = (id: string) => {
    setTransfers((prev) => prev.filter((transfer) => transfer.id !== id))
  }

  const getTransfer = (id: string) => {
    return transfers.find((transfer) => transfer.id === id)
  }

  const getTransfersByStudent = (studentId: string) => {
    return transfers.filter((transfer) => transfer.studentId === studentId)
  }

  const getTransfersBySchool = (schoolId: string) => {
    return transfers.filter(
      (transfer) =>
        transfer.fromSchoolId === schoolId || transfer.toSchoolId === schoolId,
    )
  }

  const getPendingTransfers = (schoolId?: string) => {
    let pending = transfers.filter((transfer) => transfer.status === 'pending')
    if (schoolId) {
      pending = pending.filter(
        (transfer) =>
          transfer.fromSchoolId === schoolId || transfer.toSchoolId === schoolId,
      )
    }
    return pending
  }

  const approveTransfer = (id: string, approvedBy: string) => {
    updateTransfer(id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
    })
    
    // Enviar notificação para escola destino
    sendNotification(id)
  }

  const rejectTransfer = (id: string, approvedBy: string, reason?: string) => {
    updateTransfer(id, {
      status: 'rejected',
      approvedBy,
      approvedAt: new Date().toISOString(),
      notes: reason,
    })
  }

  const completeTransfer = (id: string) => {
    updateTransfer(id, {
      status: 'completed',
    })
  }

  const sendNotification = async (id: string) => {
    const transfer = getTransfer(id)
    if (!transfer || transfer.notificationSent) return

    // Em produção, aqui seria feita a integração com serviço de notificação
    // Por enquanto, apenas marcamos como enviado
    try {
      // TODO: Implementar integração real com serviço de e-mail/SMS
      await new Promise((resolve) => setTimeout(resolve, 500))

      updateTransfer(id, {
        notificationSent: true,
        notificationSentAt: new Date().toISOString(),
      })
    } catch (error) {
      handleError(error as Error, {
        showToast: true,
        context: { action: 'sendNotification', transferId: id },
      })
      throw error // Re-throw para que o chamador saiba que falhou
    }
  }

  return (
    <TransferContext.Provider
      value={{
        transfers,
        addTransfer,
        updateTransfer,
        deleteTransfer,
        getTransfer,
        getTransfersByStudent,
        getTransfersBySchool,
        getPendingTransfers,
        approveTransfer,
        rejectTransfer,
        completeTransfer,
        sendNotification,
      }}
    >
      {children}
    </TransferContext.Provider>
  )
}

const useTransferStore = () => {
  const context = useContext(TransferContext)
  if (!context) {
    throw new Error('useTransferStore deve ser usado dentro de TransferProvider')
  }
  return context
}

export default useTransferStore

