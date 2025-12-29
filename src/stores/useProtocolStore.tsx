import React, { createContext, useContext, useState, useEffect } from 'react'
import { Protocol, ProtocolDocument, ProtocolHistory } from '@/lib/mock-data'
import { sanitizeStoreData } from '@/lib/data-sanitizer'
import { handleError } from '@/lib/error-handling'

interface ProtocolContextType {
  protocols: Protocol[]
  addProtocol: (protocol: Omit<Protocol, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'documents' | 'history'>) => void
  updateProtocol: (id: string, data: Partial<Protocol>) => void
  deleteProtocol: (id: string) => void
  getProtocol: (id: string) => Protocol | undefined
  getProtocolByNumber: (number: string) => Protocol | undefined
  getProtocolsBySchool: (schoolId: string) => Protocol[]
  getProtocolsByStudent: (studentId: string) => Protocol[]
  addProtocolDocument: (protocolId: string, document: Omit<ProtocolDocument, 'id' | 'requestedAt'>) => void
  updateProtocolDocument: (protocolId: string, documentId: string, data: Partial<ProtocolDocument>) => void
  addProtocolHistory: (protocolId: string, history: Omit<ProtocolHistory, 'id' | 'timestamp'>) => void
  generateProtocolNumber: (schoolId: string) => string
}

const ProtocolContext = createContext<ProtocolContextType | null>(null)

export const ProtocolProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [protocols, setProtocols] = useState<Protocol[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('edu_protocols')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<Protocol>(parsed, {
          arrayFields: ['documents', 'history'],
        })
        setProtocols(sanitized)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadProtocols', source: 'localStorage' },
        })
        setProtocols([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_protocols', JSON.stringify(protocols))
  }, [protocols])

  const generateProtocolNumber = (schoolId: string): string => {
    const year = new Date().getFullYear()
    const schoolProtocols = protocols.filter((p) => p.schoolId === schoolId)
    const yearProtocols = schoolProtocols.filter(
      (p) => new Date(p.createdAt).getFullYear() === year,
    )
    const nextNumber = yearProtocols.length + 1
    return `${year}${String(nextNumber).padStart(6, '0')}`
  }

  const addProtocol = (
    protocol: Omit<Protocol, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'documents' | 'history'>,
  ) => {
    const now = new Date().toISOString()
    const newProtocol: Protocol = {
      ...protocol,
      id: Math.random().toString(36).substring(2, 11),
      number: generateProtocolNumber(protocol.schoolId),
      createdAt: now,
      updatedAt: now,
      documents: [],
      history: [
        {
          id: Math.random().toString(36).substring(2, 11),
          action: 'Criado',
          description: 'Protocolo criado',
          userId: 'system',
          timestamp: now,
        },
      ],
    }
    setProtocols((prev) => [...prev, newProtocol])
  }

  const updateProtocol = (id: string, data: Partial<Protocol>) => {
    setProtocols((prev) =>
      prev.map((protocol) => {
        if (protocol.id === id) {
          return {
            ...protocol,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        }
        return protocol
      }),
    )
  }

  const deleteProtocol = (id: string) => {
    setProtocols((prev) => prev.filter((protocol) => protocol.id !== id))
  }

  const getProtocol = (id: string) => {
    return protocols.find((protocol) => protocol.id === id)
  }

  const getProtocolByNumber = (number: string) => {
    return protocols.find((protocol) => protocol.number === number)
  }

  const getProtocolsBySchool = (schoolId: string) => {
    return protocols.filter((protocol) => protocol.schoolId === schoolId)
  }

  const getProtocolsByStudent = (studentId: string) => {
    return protocols.filter((protocol) => protocol.studentId === studentId)
  }

  const addProtocolDocument = (
    protocolId: string,
    document: Omit<ProtocolDocument, 'id' | 'requestedAt'>,
  ) => {
    setProtocols((prev) =>
      prev.map((protocol) => {
        if (protocol.id === protocolId) {
          const newDocument: ProtocolDocument = {
            ...document,
            id: Math.random().toString(36).substring(2, 11),
            requestedAt: new Date().toISOString(),
          }
          return {
            ...protocol,
            documents: [...protocol.documents, newDocument],
            updatedAt: new Date().toISOString(),
          }
        }
        return protocol
      }),
    )
  }

  const updateProtocolDocument = (
    protocolId: string,
    documentId: string,
    data: Partial<ProtocolDocument>,
  ) => {
    setProtocols((prev) =>
      prev.map((protocol) => {
        if (protocol.id === protocolId) {
          return {
            ...protocol,
            documents: protocol.documents.map((doc) =>
              doc.id === documentId ? { ...doc, ...data } : doc,
            ),
            updatedAt: new Date().toISOString(),
          }
        }
        return protocol
      }),
    )
  }

  const addProtocolHistory = (
    protocolId: string,
    history: Omit<ProtocolHistory, 'id' | 'timestamp'>,
  ) => {
    setProtocols((prev) =>
      prev.map((protocol) => {
        if (protocol.id === protocolId) {
          const newHistory: ProtocolHistory = {
            ...history,
            id: Math.random().toString(36).substring(2, 11),
            timestamp: new Date().toISOString(),
          }
          return {
            ...protocol,
            history: [...protocol.history, newHistory],
            updatedAt: new Date().toISOString(),
          }
        }
        return protocol
      }),
    )
  }

  return (
    <ProtocolContext.Provider
      value={{
        protocols,
        addProtocol,
        updateProtocol,
        deleteProtocol,
        getProtocol,
        getProtocolByNumber,
        getProtocolsBySchool,
        getProtocolsByStudent,
        addProtocolDocument,
        updateProtocolDocument,
        addProtocolHistory,
        generateProtocolNumber,
      }}
    >
      {children}
    </ProtocolContext.Provider>
  )
}

const useProtocolStore = () => {
  const context = useContext(ProtocolContext)
  if (!context) {
    throw new Error('useProtocolStore deve ser usado dentro de ProtocolProvider')
  }
  return context
}

export default useProtocolStore

