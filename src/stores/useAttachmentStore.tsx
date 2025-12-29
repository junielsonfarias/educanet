import React, { createContext, useContext, useState, useEffect } from 'react'
import { DocumentAttachment, AttachmentEntityType, AttachmentCategory } from '@/lib/mock-data'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface AttachmentContextType {
  attachments: DocumentAttachment[]
  addAttachment: (attachment: Omit<DocumentAttachment, 'id' | 'uploadedAt'>) => void
  updateAttachment: (id: string, data: Partial<DocumentAttachment>) => void
  deleteAttachment: (id: string) => void
  getAttachment: (id: string) => DocumentAttachment | undefined
  getAttachmentsByEntity: (entityType: AttachmentEntityType, entityId: string) => DocumentAttachment[]
  getAttachmentsByCategory: (category: AttachmentCategory) => DocumentAttachment[]
  uploadFile: (file: File, entityType: AttachmentEntityType, entityId: string, category: AttachmentCategory, uploadedBy: string) => Promise<DocumentAttachment>
}

const AttachmentContext = createContext<AttachmentContextType | null>(null)

export const AttachmentProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('edu_attachments')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<DocumentAttachment>(parsed, {})
        setAttachments(sanitized)
      } catch (error) {
        handleError(error as Error, {
          showToast: false,
          context: { action: 'loadAttachments', source: 'localStorage' },
        })
        setAttachments([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_attachments', JSON.stringify(attachments))
  }, [attachments])

  const uploadFile = async (
    file: File,
    entityType: AttachmentEntityType,
    entityId: string,
    category: AttachmentCategory,
    uploadedBy: string,
  ): Promise<DocumentAttachment> => {
    // Em produção, aqui seria feito upload para servidor (S3, Cloudinary, etc)
    // Por enquanto, simulamos criando um objeto URL local
    const fileUrl = URL.createObjectURL(file)
    
    const newAttachment: DocumentAttachment = {
      id: Math.random().toString(36).substring(2, 11),
      entityType,
      entityId,
      category,
      name: file.name.split('.')[0],
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      isPublic: false,
    }

    setAttachments((prev) => [...prev, newAttachment])
    return newAttachment
  }

  const addAttachment = (
    attachment: Omit<DocumentAttachment, 'id' | 'uploadedAt'>,
  ) => {
    const newAttachment: DocumentAttachment = {
      ...attachment,
      id: Math.random().toString(36).substring(2, 11),
      uploadedAt: new Date().toISOString(),
    }
    setAttachments((prev) => [...prev, newAttachment])
  }

  const updateAttachment = (id: string, data: Partial<DocumentAttachment>) => {
    setAttachments((prev) =>
      prev.map((attachment) =>
        attachment.id === id ? { ...attachment, ...data } : attachment,
      ),
    )
  }

  const deleteAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id)
      if (attachment?.fileUrl && attachment.fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.fileUrl)
      }
      return prev.filter((attachment) => attachment.id !== id)
    })
  }

  const getAttachment = (id: string) => {
    return attachments.find((attachment) => attachment.id === id)
  }

  const getAttachmentsByEntity = (
    entityType: AttachmentEntityType,
    entityId: string,
  ) => {
    return attachments.filter(
      (attachment) =>
        attachment.entityType === entityType &&
        attachment.entityId === entityId,
    )
  }

  const getAttachmentsByCategory = (category: AttachmentCategory) => {
    return attachments.filter((attachment) => attachment.category === category)
  }

  return (
    <AttachmentContext.Provider
      value={{
        attachments,
        addAttachment,
        updateAttachment,
        deleteAttachment,
        getAttachment,
        getAttachmentsByEntity,
        getAttachmentsByCategory,
        uploadFile,
      }}
    >
      {children}
    </AttachmentContext.Provider>
  )
}

const useAttachmentStore = () => {
  const context = useContext(AttachmentContext)
  if (!context) {
    throw new Error('useAttachmentStore deve ser usado dentro de AttachmentProvider')
  }
  return context
}

export default useAttachmentStore

