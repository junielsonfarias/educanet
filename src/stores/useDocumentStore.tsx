import React, { createContext, useContext, useState, useEffect } from 'react'
import { SchoolDocument } from '@/lib/mock-data'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface DocumentContextType {
  documents: SchoolDocument[]
  addDocument: (document: Omit<SchoolDocument, 'id' | 'generatedAt' | 'protocolNumber'>) => void
  updateDocument: (id: string, data: Partial<SchoolDocument>) => void
  deleteDocument: (id: string) => void
  getDocument: (id: string) => SchoolDocument | undefined
  getDocumentsByStudent: (studentId: string) => SchoolDocument[]
  getDocumentsBySchool: (schoolId: string) => SchoolDocument[]
  getNextSequentialNumber: (type: SchoolDocument['type'], schoolId: string) => number
  generateProtocolNumber: (schoolId: string) => string
}

const DocumentContext = createContext<DocumentContextType | null>(null)

export const DocumentProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [documents, setDocuments] = useState<SchoolDocument[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('edu_documents')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<SchoolDocument>(parsed, {})
        setDocuments(sanitized)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadDocuments', source: 'localStorage' },
        })
        setDocuments([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_documents', JSON.stringify(documents))
  }, [documents])

  const generateProtocolNumber = (schoolId: string): string => {
    const year = new Date().getFullYear()
    const schoolDocs = documents.filter((d) => d.schoolId === schoolId)
    const yearDocs = schoolDocs.filter(
      (d) => new Date(d.generatedAt).getFullYear() === year,
    )
    const nextNumber = yearDocs.length + 1
    return `${year}-${schoolId.slice(0, 3).toUpperCase()}-${String(nextNumber).padStart(4, '0')}`
  }

  const getNextSequentialNumber = (
    type: SchoolDocument['type'],
    schoolId: string,
  ): number => {
    const year = new Date().getFullYear()
    const typeDocs = documents.filter(
      (d) =>
        d.type === type &&
        d.schoolId === schoolId &&
        new Date(d.generatedAt).getFullYear() === year,
    )
    return typeDocs.length + 1
  }

  const addDocument = (
    document: Omit<SchoolDocument, 'id' | 'generatedAt' | 'protocolNumber'>,
  ) => {
    const newDocument: SchoolDocument = {
      ...document,
      id: Math.random().toString(36).substring(2, 11),
      generatedAt: new Date().toISOString(),
      protocolNumber: generateProtocolNumber(document.schoolId),
      sequentialNumber: getNextSequentialNumber(document.type, document.schoolId),
    }
    setDocuments((prev) => [...prev, newDocument])
  }

  const updateDocument = (id: string, data: Partial<SchoolDocument>) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, ...data } : doc)),
    )
  }

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const getDocument = (id: string) => {
    return documents.find((doc) => doc.id === id)
  }

  const getDocumentsByStudent = (studentId: string) => {
    return documents.filter((doc) => doc.studentId === studentId)
  }

  const getDocumentsBySchool = (schoolId: string) => {
    return documents.filter((doc) => doc.schoolId === schoolId)
  }

  return (
    <DocumentContext.Provider
      value={{
        documents,
        addDocument,
        updateDocument,
        deleteDocument,
        getDocument,
        getDocumentsByStudent,
        getDocumentsBySchool,
        getNextSequentialNumber,
        generateProtocolNumber,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}

const useDocumentStore = () => {
  const context = useContext(DocumentContext)
  if (!context) {
    throw new Error('useDocumentStore deve ser usado dentro de DocumentProvider')
  }
  return context
}

export default useDocumentStore

