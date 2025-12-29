import { useState, useEffect } from 'react'
import { AlertTriangle, Download, RefreshCw, CheckCircle2, XCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import useSchoolStore from '@/stores/useSchoolStore'
import useStudentStore from '@/stores/useStudentStore'
import useTeacherStore from '@/stores/useTeacherStore'
import useCourseStore from '@/stores/useCourseStore'
import {
  generateInconsistencyReport,
  downloadInconsistencyReport,
  type InconsistencyReport,
} from '@/lib/exporters'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function InconsistenciesReport() {
  const { schools } = useSchoolStore()
  const { students } = useStudentStore()
  const { teachers } = useTeacherStore()
  const { etapasEnsino } = useCourseStore()
  const { toast } = useToast()

  const [report, setReport] = useState<InconsistencyReport | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'error' | 'warning' | 'info'>('all')
  const [filterEntity, setFilterEntity] = useState<
    'all' | 'school' | 'student' | 'teacher' | 'classroom' | 'enrollment'
  >('all')

  const generateReport = () => {
    setIsGenerating(true)
    try {
      const newReport = generateInconsistencyReport(
        schools,
        students,
        teachers,
        etapasEnsino,
      )
      setReport(newReport)
      toast({
        title: 'Relatório gerado',
        description: `Encontradas ${newReport.totalErrors} erro(s) e ${newReport.totalWarnings} aviso(s).`,
      })
    } catch (error) {
      toast({
        title: 'Erro ao gerar relatório',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    generateReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = () => {
    if (report) {
      downloadInconsistencyReport(report)
      toast({
        title: 'Relatório exportado',
        description: 'Arquivo CSV baixado com sucesso.',
      })
    }
  }

  const filteredInconsistencies = report
    ? report.inconsistencies.filter((inc) => {
        const typeMatch = filterType === 'all' || inc.type === filterType
        const entityMatch = filterEntity === 'all' || inc.entity === filterEntity
        return typeMatch && entityMatch
      })
    : []

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Aviso</Badge>
      case 'info':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Info</Badge>
      default:
        return null
    }
  }

  const getEntityBadge = (entity: string) => {
    const colors: Record<string, string> = {
      school: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800',
      teacher: 'bg-purple-100 text-purple-800',
      classroom: 'bg-orange-100 text-orange-800',
      enrollment: 'bg-pink-100 text-pink-800',
    }
    return (
      <Badge className={colors[entity] || 'bg-gray-100 text-gray-800'}>
        {entity}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Relatório de Inconsistências
          </h2>
          <p className="text-muted-foreground">
            Identifique e corrija inconsistências nos dados conforme regras do INEP.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generateReport}
            disabled={isGenerating}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
          {report && (
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {report && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Erros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {report.totalErrors}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Avisos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {report.totalWarnings}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {report.totalInfo}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.inconsistencies.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                {report.totalErrors === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">OK</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">Atenção</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inconsistências Detalhadas</CardTitle>
                  <CardDescription>
                    Lista completa de inconsistências encontradas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="error">Erros</SelectItem>
                        <SelectItem value="warning">Avisos</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Entidade</Label>
                    <Select
                      value={filterEntity}
                      onValueChange={(v: any) => setFilterEntity(v)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="school">Escolas</SelectItem>
                        <SelectItem value="student">Alunos</SelectItem>
                        <SelectItem value="teacher">Professores</SelectItem>
                        <SelectItem value="classroom">Turmas</SelectItem>
                        <SelectItem value="enrollment">Matrículas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredInconsistencies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma inconsistência encontrada com os filtros selecionados.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Tipo</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Sugestão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInconsistencies.map((inc, index) => (
                        <TableRow key={`${inc.entityId}-${inc.field}-${index}`}>
                          <TableCell>{getTypeIcon(inc.type)}</TableCell>
                          <TableCell>{getEntityBadge(inc.entity)}</TableCell>
                          <TableCell className="font-medium">
                            {inc.entityName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{inc.field || '-'}</Badge>
                          </TableCell>
                          <TableCell>{inc.message}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {inc.suggestion || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!report && !isGenerating && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Nenhum relatório gerado</AlertTitle>
          <AlertDescription>
            Clique em "Atualizar" para gerar o relatório de inconsistências.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

