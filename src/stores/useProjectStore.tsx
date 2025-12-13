import React, { createContext, useContext, useState, useEffect } from 'react'
import { Project, mockProjects } from '@/lib/mock-data'

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
    const stored = localStorage.getItem('edu_projects')
    if (stored) {
      setProjects(JSON.parse(stored))
    } else {
      localStorage.setItem('edu_projects', JSON.stringify(mockProjects))
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
