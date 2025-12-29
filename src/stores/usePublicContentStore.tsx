import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  NewsPost,
  PublicDocument,
  InstitutionalContent,
  mockNews,
  mockPublicDocuments,
  mockInstitutionalContent,
} from '@/lib/mock-data'
import { sanitizeStoreData } from '@/lib/data-sanitizer'
import { handleError } from '@/lib/error-handling'

interface PublicContentContextType {
  news: NewsPost[]
  documents: PublicDocument[]
  institutionalContent: InstitutionalContent[]
  addNews: (news: Omit<NewsPost, 'id' | 'active'>) => void
  updateNews: (id: string, data: Partial<NewsPost>) => void
  deleteNews: (id: string) => void
  addDocument: (doc: Omit<PublicDocument, 'id' | 'active'>) => void
  updateDocument: (id: string, data: Partial<PublicDocument>) => void
  deleteDocument: (id: string) => void
  updateInstitutionalContent: (
    section: 'semed_info' | 'semed_structure',
    data: Partial<InstitutionalContent>,
  ) => void
  getContent: (
    section: 'semed_info' | 'semed_structure',
  ) => InstitutionalContent | undefined
}

const PublicContentContext = createContext<PublicContentContextType | null>(
  null,
)

export const PublicContentProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [news, setNews] = useState<NewsPost[]>(() => {
    try {
      const stored = localStorage.getItem('edu_news')
      if (stored) {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<NewsPost>(parsed, {})
        return sanitized.length > 0 ? sanitized : mockNews
      }
    } catch (error) {
      handleError(error as Error, {
        showToast: false,
        context: { action: 'loadPublicContent', source: 'localStorage' },
      })
    }
    return mockNews
  })
  
  const [documents, setDocuments] = useState<PublicDocument[]>(() => {
    try {
      const stored = localStorage.getItem('edu_public_documents')
      if (stored) {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<PublicDocument>(parsed, {})
        return sanitized.length > 0 ? sanitized : mockPublicDocuments
      }
    } catch (error) {
      handleError(error as Error, {
        showToast: false,
        context: { action: 'loadPublicContent', source: 'localStorage' },
      })
    }
    return mockPublicDocuments
  })
  
  const [institutionalContent, setInstitutionalContent] = useState<
    InstitutionalContent[]
  >(() => {
    try {
      const stored = localStorage.getItem('edu_content')
      if (stored) {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<InstitutionalContent>(parsed, {})
        return sanitized.length > 0 ? sanitized : mockInstitutionalContent
      }
    } catch (error) {
      handleError(error as Error, {
        showToast: false,
        context: { action: 'loadPublicContent', source: 'localStorage' },
      })
    }
    return mockInstitutionalContent
  })

  // Initial load is handled by lazy initialization in useState above

  useEffect(() => {
    localStorage.setItem('edu_news', JSON.stringify(news))
  }, [news])

  useEffect(() => {
    localStorage.setItem('edu_public_documents', JSON.stringify(documents))
  }, [documents])

  useEffect(() => {
    localStorage.setItem('edu_content', JSON.stringify(institutionalContent))
  }, [institutionalContent])

  const addNews = (data: Omit<NewsPost, 'id' | 'active'>) => {
    const newPost: NewsPost = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      active: true,
    }
    setNews((prev) => [newPost, ...prev])
  }

  const updateNews = (id: string, data: Partial<NewsPost>) => {
    setNews((prev) =>
      prev.map((post) => (post.id === id ? { ...post, ...data } : post)),
    )
  }

  const deleteNews = (id: string) => {
    setNews((prev) => prev.filter((post) => post.id !== id))
  }

  const addDocument = (data: Omit<PublicDocument, 'id' | 'active'>) => {
    const newDoc: PublicDocument = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      active: true,
    }
    setDocuments((prev) => [newDoc, ...prev])
  }

  const updateDocument = (id: string, data: Partial<PublicDocument>) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, ...data } : doc)),
    )
  }

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const updateInstitutionalContent = (
    section: 'semed_info' | 'semed_structure',
    data: Partial<InstitutionalContent>,
  ) => {
    setInstitutionalContent((prev) => {
      const exists = prev.find((c) => c.section === section)
      if (exists) {
        return prev.map((c) =>
          c.section === section
            ? { ...c, ...data, updatedAt: new Date().toISOString() }
            : c,
        )
      } else {
        return [
          ...prev,
          {
            section,
            title: data.title || '',
            content: data.content || '',
            updatedAt: new Date().toISOString(),
          },
        ]
      }
    })
  }

  const getContent = (section: 'semed_info' | 'semed_structure') => {
    return institutionalContent.find((c) => c.section === section)
  }

  return (
    <PublicContentContext.Provider
      value={{
        news,
        documents,
        institutionalContent,
        addNews,
        updateNews,
        deleteNews,
        addDocument,
        updateDocument,
        deleteDocument,
        updateInstitutionalContent,
        getContent,
      }}
    >
      {children}
    </PublicContentContext.Provider>
  )
}

export default function usePublicContentStore() {
  const context = useContext(PublicContentContext)
  if (!context) {
    throw new Error(
      'usePublicContentStore must be used within a PublicContentProvider',
    )
  }
  return context
}
