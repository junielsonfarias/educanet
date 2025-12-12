export type GradeData = {
  subject: string
  periodGrades: number[]
  final: number
  status: string
  passing: boolean
  formula?: string
}

export type RecoveryGradeData = {
  subject: string
  periodGrades: (number | null)[]
}

export type EvaluationEntry = {
  subject: string
  periodName: string
  value: number
}

export type EvaluationTypeData = {
  id: string
  name: string
  entries: EvaluationEntry[]
}

export type DependencyData = {
  className: string
  grades: GradeData[]
  recoveries: RecoveryGradeData[]
  evaluationTypes: EvaluationTypeData[]
  ruleName: string
}

export type HistoryEntry = {
  id: string
  date: string
  subject: string
  period: string
  type: string
  category: 'regular' | 'recuperation'
  value: number
  originalValue?: number
  isRecovered?: boolean
  recoveryValue?: number
}

export type ReportCardData = {
  name: string
  registration: string
  school: string
  schoolLogo?: string
  grade: string
  year: number
  ruleName: string
  periodNames: string[]
  grades: GradeData[]
  recoveries: RecoveryGradeData[]
  evaluationTypes: EvaluationTypeData[]
  dependencies: DependencyData[]
  history: HistoryEntry[]
  generatedAt: string
}
