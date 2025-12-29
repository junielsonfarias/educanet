import React, { createContext, useContext, useState, useEffect } from 'react'
import { Project, mockProjects } from '@/lib/mock-data'
import { sanitizeStoreData } from '@/lib/data-sanitizer'
import { handleError } from '@/lib/error-handling'

interface ProjectContextType {
  projects: Project[]
  addProject: (project: Omit<Project, 'id'>) => void
  getProject: (id: string) => Project | undefined
}

const ProjectContext = createContext<ProjectContextType | null>(null)

export const ProjectProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [projects, setProjects] = useState<Project[]>(mockProjects)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('edu_projects')
      if (stored) {
        const parsed = JSON.parse(stored)
        const sanitized = sanitizeStoreData<Project>(parsed, {})
        setProjects(sanitized.length > 0 ? sanitized : mockProjects)
      } else {
        localStorage.setItem('edu_projects', JSON.stringify(mockProjects))
      }
    } catch (error) {
      handleError(error as Error, {
        showToast: false,
        context: { action: 'loadProjects', source: 'localStorage' },
      })
      setProjects(mockProjects)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_projects', JSON.stringify(projects))
  }, [projects])

  const addProject = (data: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
    }
    setProjects((prev) => [...prev, newProject])
  }

  const getProject = (id: string) => {
    return projects.find((p) => p.id === id)
  }

  return (
    <ProjectContext.Provider value={{ projects, addProject, getProject }}>
      {children}
    </ProjectContext.Provider>
  )
}

export default function useProjectStore() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectStore must be used within a ProjectProvider')
  }
  return context
}
