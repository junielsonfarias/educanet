/**
 * AcademicConfig - Configurações Acadêmicas Centralizadas
 *
 * Esta página consolida todas as configurações acadêmicas que se aplicam
 * automaticamente a todas as escolas do sistema:
 * - Cursos e Etapas de Ensino
 * - Regras de Avaliação por Curso/Série
 * - Tipos de Avaliação
 * - Períodos Acadêmicos por Tipo de Curso
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calculator,
  BookOpen,
  GraduationCap,
  Calendar,
  Settings,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { evaluationRulesService, courseService, assessmentTypeService } from '@/lib/supabase/services'
import type { EvaluationRule, AssessmentType } from '@/lib/supabase/services'

interface Course {
  id: number
  name: string
  education_level: string
  description?: string
}

export default function AcademicConfig() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [rules, setRules] = useState<EvaluationRule[]>([])
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [coursesData, rulesData, typesData] = await Promise.all([
        courseService.getAll(),
        evaluationRulesService.getAll(),
        assessmentTypeService.getAll()
      ])
      setCourses(coursesData || [])
      setRules(rulesData || [])
      setAssessmentTypes(typesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Agrupar cursos por nível de ensino
  const coursesByLevel = courses.reduce((acc, course) => {
    const level = course.education_level || 'Outros'
    if (!acc[level]) acc[level] = []
    acc[level].push(course)
    return acc
  }, {} as Record<string, Course[]>)

  // Estatísticas
  const stats = {
    totalCourses: courses.length,
    totalRules: rules.length,
    totalAssessmentTypes: assessmentTypes.length,
    rulesWithCourse: rules.filter(r => r.course_id).length,
    rulesWithGrade: rules.filter(r => r.education_grade_id).length
  }

  // Verificar cursos sem regra de avaliação
  const coursesWithoutRule = courses.filter(course =>
    !rules.some(r => r.course_id === course.id)
  )

  const getPeriodTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'Bimestre': 'Bimestral (4x ao ano)',
      'Trimestre': 'Trimestral (3x ao ano)',
      'Semestre': 'Semestral (2x ao ano)',
      'Anual': 'Anual (1x ao ano)'
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">
              Configurações Acadêmicas
            </h2>
            <p className="text-muted-foreground">
              Configure regras de avaliação, tipos de avaliação e períodos por curso.
              Estas configurações se aplicam automaticamente a todas as escolas.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Cursos Cadastrados</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Regras de Avaliação</p>
                <p className="text-2xl font-bold text-purple-700">{stats.totalRules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600">Tipos de Avaliação</p>
                <p className="text-2xl font-bold text-green-700">{stats.totalAssessmentTypes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Cursos c/ Regras</p>
                <p className="text-2xl font-bold text-amber-700">{stats.rulesWithCourse}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de cursos sem regra */}
      {coursesWithoutRule.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800">
              {coursesWithoutRule.length} curso(s) sem regra de avaliação configurada
            </h4>
            <p className="text-sm text-amber-700 mt-1">
              Os cursos a seguir não possuem regra de avaliação específica e usarão a regra padrão do nível de ensino:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {coursesWithoutRule.slice(0, 5).map(course => (
                <Badge key={course.id} variant="outline" className="bg-white">
                  {course.name}
                </Badge>
              ))}
              {coursesWithoutRule.length > 5 && (
                <Badge variant="outline" className="bg-white">
                  +{coursesWithoutRule.length - 5} mais
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid de Configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Regras de Avaliação */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-white border-purple-200/50 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
                  <Calculator className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Regras de Avaliação</CardTitle>
                  <CardDescription>
                    Nota mínima, frequência e cálculo de médias
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{rules.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {rules.slice(0, 4).map(rule => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/50 border hover:bg-white/80 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{rule.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Nota: {rule.min_approval_grade}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rule.academic_period_type}
                      </Badge>
                    </div>
                  </div>
                  {rule.course && (
                    <Badge variant="secondary" className="text-xs">
                      {rule.course.name}
                    </Badge>
                  )}
                </div>
              ))}
              {rules.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma regra configurada</p>
                </div>
              )}
            </div>
            <Link to="/academico/regras-avaliacao">
              <Button variant="outline" className="w-full group">
                Gerenciar Regras
                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card de Tipos de Avaliação */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-green-50/20 to-white border-green-200/50 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Tipos de Avaliação</CardTitle>
                  <CardDescription>
                    Provas, trabalhos, recuperações
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{assessmentTypes.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {assessmentTypes.slice(0, 4).map(type => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/50 border hover:bg-white/80 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{type.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Peso: {type.weight}x
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Máx: {type.max_score}
                      </Badge>
                    </div>
                  </div>
                  {type.is_recovery && (
                    <Badge className="bg-orange-100 text-orange-700 text-xs">
                      Recuperação
                    </Badge>
                  )}
                </div>
              ))}
              {assessmentTypes.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum tipo configurado</p>
                </div>
              )}
            </div>
            <Link to="/academico/tipos-avaliacao">
              <Button variant="outline" className="w-full group">
                Gerenciar Tipos
                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Configuração por Nível de Ensino */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Configuração por Nível de Ensino
          </CardTitle>
          <CardDescription>
            Visão geral das configurações aplicadas a cada nível de ensino
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(coursesByLevel).map(([level, levelCourses]) => {
              // Encontrar regra padrão para este nível
              const defaultRule = rules.find(r =>
                r.name?.toLowerCase().includes(level.toLowerCase()) &&
                !r.course_id
              )

              return (
                <div
                  key={level}
                  className="p-4 rounded-lg border bg-gradient-to-r from-slate-50 to-white"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-blue-600">
                        {level}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {levelCourses.length} curso(s)
                      </span>
                    </div>
                    {defaultRule ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Regra configurada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sem regra padrão
                      </Badge>
                    )}
                  </div>

                  {defaultRule && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="p-2 rounded bg-white border">
                        <p className="text-muted-foreground text-xs">Nota Mínima</p>
                        <p className="font-semibold">{defaultRule.min_approval_grade}</p>
                      </div>
                      <div className="p-2 rounded bg-white border">
                        <p className="text-muted-foreground text-xs">Frequência Mín.</p>
                        <p className="font-semibold">{defaultRule.min_attendance_percent}%</p>
                      </div>
                      <div className="p-2 rounded bg-white border">
                        <p className="text-muted-foreground text-xs">Tipo de Período</p>
                        <p className="font-semibold">{defaultRule.academic_period_type}</p>
                      </div>
                      <div className="p-2 rounded bg-white border">
                        <p className="text-muted-foreground text-xs">Períodos/Ano</p>
                        <p className="font-semibold">{defaultRule.periods_per_year}x</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {levelCourses.map(course => (
                      <Badge key={course.id} variant="outline" className="text-xs">
                        {course.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-2 text-sm text-blue-800">
          <h4 className="font-semibold">Como funcionam as configurações centralizadas?</h4>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>
              <strong>Regras de Avaliação:</strong> Definem nota mínima, frequência e tipo de período (bimestre/semestre) para cada curso ou série
            </li>
            <li>
              <strong>Tipos de Avaliação:</strong> Definem os tipos de atividades avaliativas (provas, trabalhos, recuperações) disponíveis
            </li>
            <li>
              <strong>Aplicação Automática:</strong> Quando uma escola cria uma turma, o sistema carrega automaticamente as regras e tipos correspondentes ao curso selecionado
            </li>
            <li>
              <strong>Períodos Filtrados:</strong> No cadastro de turmas, apenas os períodos do tipo definido na regra (ex: bimestres) são exibidos
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
