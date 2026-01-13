import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  EtapaEnsino,
  mockEtapasEnsino,
  EvaluationRule,
  mockEvaluationRules,
  SerieAno,
  Subject,
} from '@/lib/mock-data'
import { handleError } from '@/lib/error-handling'
import { sanitizeStoreData } from '@/lib/data-sanitizer'

interface CourseContextType {
  etapasEnsino: EtapaEnsino[]
  evaluationRules: EvaluationRule[]
  addEtapaEnsino: (etapa: Omit<EtapaEnsino, 'id' | 'seriesAnos'>) => void
  updateEtapaEnsino: (id: string, data: Partial<EtapaEnsino>) => void
  addSerieAno: (etapaEnsinoId: string, serieAno: Omit<SerieAno, 'id' | 'subjects'>) => void
  updateSerieAno: (etapaEnsinoId: string, serieAnoId: string, data: Partial<SerieAno>) => void
  addSubject: (
    etapaEnsinoId: string,
    serieAnoId: string,
    subject: Omit<Subject, 'id'>,
  ) => void
  updateSubject: (
    etapaEnsinoId: string,
    serieAnoId: string,
    subjectId: string,
    data: Partial<Subject>,
  ) => void
  removeSubject: (etapaEnsinoId: string, serieAnoId: string, subjectId: string) => void
  addEvaluationRule: (rule: Omit<EvaluationRule, 'id'>) => void
  updateEvaluationRule: (id: string, rule: Partial<EvaluationRule>) => void
  getEtapaEnsino: (id: string) => EtapaEnsino | undefined
  // Aliases para compatibilidade (deprecated)
  courses: EtapaEnsino[]
  addCourse: (course: Omit<EtapaEnsino, 'id' | 'seriesAnos'>) => void
  updateCourse: (id: string, data: Partial<EtapaEnsino>) => void
  addGrade: (courseId: string, grade: Omit<SerieAno, 'id' | 'subjects'>) => void
  updateGrade: (courseId: string, gradeId: string, data: Partial<SerieAno>) => void
  getCourse: (id: string) => EtapaEnsino | undefined
}

const CourseContext = createContext<CourseContextType | null>(null)

export const CourseProvider = ({ children }: { children: React.ReactNode }) => {
  const [etapasEnsino, setEtapasEnsino] = useState<EtapaEnsino[]>(mockEtapasEnsino)
  const [evaluationRules, setEvaluationRules] =
    useState<EvaluationRule[]>(mockEvaluationRules)

  useEffect(() => {
    try {
      // Migração: tenta buscar da nova key, se não encontrar, tenta da antiga
      const storedEtapas = localStorage.getItem('edu_etapas_ensino')
      const storedCourses = localStorage.getItem('edu_courses')
      
      if (storedEtapas) {
        const parsed = JSON.parse(storedEtapas)
        // Sanitizar dados usando utilitário centralizado
        const sanitized = sanitizeStoreData<EtapaEnsino>(parsed, {
          arrayFields: ['seriesAnos'],
          customSanitizer: (e: Record<string, unknown>) => ({
            ...e,
            seriesAnos: Array.isArray(e.seriesAnos)
              ? e.seriesAnos.map((s: Record<string, unknown>) => ({
                  ...s,
                  subjects: Array.isArray(s.subjects) ? s.subjects : [],
                }))
              : [],
          }),
          defaults: {} as Partial<EtapaEnsino>,
        })
        setEtapasEnsino(sanitized.length > 0 ? sanitized : mockEtapasEnsino)
      } else if (storedCourses) {
        // Migra dados antigos para nova estrutura
        const oldCourses = JSON.parse(storedCourses)
        // Sanitizar dados: garantir que todas as etapas tenham seriesAnos como array
        const sanitized = sanitizeStoreData<EtapaEnsino>(oldCourses, {
          arrayFields: ['seriesAnos'],
          customSanitizer: (e: Record<string, unknown>) => ({
            ...e,
            seriesAnos: Array.isArray(e.seriesAnos)
              ? e.seriesAnos.map((s: Record<string, unknown>) => ({
                  ...s,
                  subjects: Array.isArray(s.subjects) ? s.subjects : [],
                }))
              : Array.isArray(e.grades)
                ? e.grades.map((g: any) => ({
                    ...g,
                    subjects: Array.isArray(g.subjects) ? g.subjects : [],
                  }))
                : [],
          }),
          defaults: {} as Partial<EtapaEnsino>,
        })
        setEtapasEnsino(sanitized.length > 0 ? sanitized : mockEtapasEnsino)
        // Salva na nova key
        localStorage.setItem('edu_etapas_ensino', JSON.stringify(sanitized))
        // Remove key antiga após migração
        localStorage.removeItem('edu_courses')
      }

      const storedRules = localStorage.getItem('edu_eval_rules')
      if (storedRules) {
        setEvaluationRules(JSON.parse(storedRules))
      }
    } catch (error) {
      handleError(error as Error, {
        showToast: false,
        context: { action: 'loadCourses', source: 'localStorage' },
      })
      setEtapasEnsino(mockEtapasEnsino)
      setEvaluationRules(mockEvaluationRules)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('edu_etapas_ensino', JSON.stringify(etapasEnsino))
  }, [etapasEnsino])

  useEffect(() => {
    localStorage.setItem('edu_eval_rules', JSON.stringify(evaluationRules))
  }, [evaluationRules])

  const addEtapaEnsino = (data: Omit<EtapaEnsino, 'id' | 'seriesAnos'>) => {
    const newEtapa: EtapaEnsino = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      seriesAnos: [],
      // Garante que codigoCenso seja salvo se fornecido
      ...((data as any).codigoCenso ? { codigoCenso: (data as any).codigoCenso } : {}),
    }
    setEtapasEnsino((prev) => [...prev, newEtapa])
  }

  const updateEtapaEnsino = (id: string, data: Partial<EtapaEnsino>) => {
    setEtapasEnsino((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...data,
              // Garantir que seriesAnos sempre seja um array
              seriesAnos: Array.isArray(data.seriesAnos)
                ? data.seriesAnos
                : Array.isArray(e.seriesAnos)
                  ? e.seriesAnos
                  : [],
            }
          : e,
      ),
    )
  }

  // Aliases para compatibilidade (deprecated)
  const addCourse = addEtapaEnsino
  const updateCourse = updateEtapaEnsino

  const addSerieAno = (etapaEnsinoId: string, data: Omit<SerieAno, 'id' | 'subjects'>) => {
    setEtapasEnsino((prev) =>
      prev.map((e) => {
        if (e.id === etapaEnsinoId) {
          const newSerieAno: SerieAno = {
            ...data,
            id: Math.random().toString(36).substring(2, 11),
            subjects: [],
            // Garante que numero seja salvo
            ...(data.numero !== undefined ? { numero: data.numero } : {}),
          }
          return {
            ...e,
            seriesAnos: [...(e.seriesAnos || []), newSerieAno],
          }
        }
        return e
      }),
    )
  }

  // Alias para compatibilidade (deprecated)
  const addGrade = (courseId: string, data: Omit<SerieAno, 'id' | 'subjects'>) => {
    addSerieAno(courseId, data)
  }

  const updateSerieAno = (
    etapaEnsinoId: string,
    serieAnoId: string,
    data: Partial<SerieAno>,
  ) => {
    setEtapasEnsino((prev) =>
      prev.map((e) => {
        if (e.id === etapaEnsinoId) {
          return {
            ...e,
            seriesAnos: (e.seriesAnos || []).map((s) =>
              s.id === serieAnoId ? { ...s, ...data } : s,
            ),
          }
        }
        return e
      }),
    )
  }

  // Alias para compatibilidade (deprecated)
  const updateGrade = (courseId: string, gradeId: string, data: Partial<SerieAno>) => {
    updateSerieAno(courseId, gradeId, data)
  }

  const addSubject = (
    etapaEnsinoId: string,
    serieAnoId: string,
    data: Omit<Subject, 'id'>,
  ) => {
    setEtapasEnsino((prev) =>
      prev.map((e) => {
        if (e.id === etapaEnsinoId) {
          return {
            ...e,
            seriesAnos: (e.seriesAnos || []).map((s) => {
              if (s.id === serieAnoId) {
                return {
                  ...s,
                  subjects: [
                    ...(s.subjects || []),
                    { ...data, id: Math.random().toString(36).substring(2, 11) },
                  ],
                }
              }
              return s
            }),
          }
        }
        return e
      }),
    )
  }

  const updateSubject = (
    etapaEnsinoId: string,
    serieAnoId: string,
    subjectId: string,
    data: Partial<Subject>,
  ) => {
    setEtapasEnsino((prev) =>
      prev.map((e) => {
        if (e.id === etapaEnsinoId) {
          return {
            ...e,
            seriesAnos: (e.seriesAnos || []).map((s) => {
              if (s.id === serieAnoId) {
                return {
                  ...s,
                  subjects: (s.subjects || []).map((subj) =>
                    subj.id === subjectId ? { ...subj, ...data } : subj,
                  ),
                }
              }
              return s
            }),
          }
        }
        return e
      }),
    )
  }

  const removeSubject = (
    etapaEnsinoId: string,
    serieAnoId: string,
    subjectId: string,
  ) => {
    setEtapasEnsino((prev) =>
      prev.map((e) => {
        if (e.id === etapaEnsinoId) {
          return {
            ...e,
            seriesAnos: (e.seriesAnos || []).map((s) => {
              if (s.id === serieAnoId) {
                return {
                  ...s,
                  subjects: (s.subjects || []).filter((subj) => subj.id !== subjectId),
                }
              }
              return s
            }),
          }
        }
        return e
      }),
    )
  }

  const addEvaluationRule = (data: Omit<EvaluationRule, 'id'>) => {
    const newRule: EvaluationRule = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
    }
    setEvaluationRules((prev) => [...prev, newRule])
  }

  const updateEvaluationRule = (id: string, data: Partial<EvaluationRule>) => {
    setEvaluationRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r)),
    )
  }

  const getEtapaEnsino = (id: string) => etapasEnsino.find((e) => e.id === id)

  // Aliases para compatibilidade (deprecated)
  const courses = etapasEnsino
  const getCourse = getEtapaEnsino

  return (
    <CourseContext.Provider
      value={{
        etapasEnsino,
        evaluationRules,
        addEtapaEnsino,
        updateEtapaEnsino,
        addSerieAno,
        updateSerieAno,
        addSubject,
        updateSubject,
        removeSubject,
        addEvaluationRule,
        updateEvaluationRule,
        getEtapaEnsino,
        // Aliases para compatibilidade (deprecated)
        courses,
        addCourse,
        updateCourse,
        addGrade,
        updateGrade,
        getCourse,
      }}
    >
      {children}
    </CourseContext.Provider>
  )
}

export default function useCourseStore() {
  const context = useContext(CourseContext)
  if (!context)
    throw new Error('useCourseStore must be used within a CourseProvider')
  return context
}
