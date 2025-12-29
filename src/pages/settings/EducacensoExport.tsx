import { useState } from 'react'
import { Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import useSchoolStore from '@/stores/useSchoolStore'
import useStudentStore from '@/stores/useStudentStore'
import useTeacherStore from '@/stores/useTeacherStore'
import useCourseStore from '@/stores/useCourseStore'
import {
  exportEducacenso,
  downloadEducacensoFile,
  type EducacensoExportOptions,
} from '@/lib/exporters'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function EducacensoExport() {
  const { schools } = useSchoolStore()
  const { students } = useStudentStore()
  const { teachers } = useTeacherStore()
  const { etapasEnsino } = useCourseStore()
  const { toast } = useToast()

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('')
  const [selectedYearId, setSelectedYearId] = useState<string>('')
  const [includeStudents, setIncludeStudents] = useState(true)
  const [includeTeachers, setIncludeTeachers] = useState(true)
  const [includeClassrooms, setIncludeClassrooms] = useState(true)
  const [includeInfrastructure, setIncludeInfrastructure] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId && selectedSchoolId !== 'all')
  const academicYears = selectedSchool?.academicYears || []

  const handleExport = () => {
    setIsExporting(true)

    try {
      const options: EducacensoExportOptions = {
        schoolId: selectedSchoolId && selectedSchoolId !== 'all' ? selectedSchoolId : undefined,
        academicYearId: selectedYearId && selectedYearId !== 'all' ? selectedYearId : undefined,
        includeStudents,
        includeTeachers,
        includeClassrooms,
        includeInfrastructure,
      }

      const result = exportEducacenso(
        schools,
        students,
        teachers,
        etapasEnsino,
        options,
      )

      if (result.success) {
        downloadEducacensoFile(result)
        toast({
          title: 'Exportação concluída',
          description: `Arquivo ${result.fileName} gerado com sucesso.`,
        })

        if (result.warnings && result.warnings.length > 0) {
          toast({
            title: 'Avisos na exportação',
            description: `${result.warnings.length} aviso(s) encontrado(s). Verifique o arquivo.`,
            variant: 'default',
          })
        }
      } else {
        toast({
          title: 'Erro na exportação',
          description: result.errors?.join('. ') || 'Erro desconhecido',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Exportação Educacenso
        </h2>
        <p className="text-muted-foreground">
          Exporte os dados no formato exigido pelo Censo Escolar (INEP).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Exportação</CardTitle>
          <CardDescription>
            Selecione as opções para gerar o arquivo no formato Educacenso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Escola</Label>
            <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a escola (ou deixe em branco para todas)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as escolas</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSchoolId && selectedSchoolId !== 'all' && (
            <div className="space-y-2">
              <Label>Ano Letivo</Label>
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano letivo (ou deixe em branco para todos)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos letivos</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} ({year.status === 'active' ? 'Ativo' : year.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-4">
            <Label>Dados a Incluir</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-students"
                  checked={includeStudents}
                  onCheckedChange={(checked) =>
                    setIncludeStudents(checked === true)
                  }
                />
                <Label htmlFor="include-students" className="cursor-pointer">
                  Incluir alunos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-teachers"
                  checked={includeTeachers}
                  onCheckedChange={(checked) =>
                    setIncludeTeachers(checked === true)
                  }
                />
                <Label htmlFor="include-teachers" className="cursor-pointer">
                  Incluir professores
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-classrooms"
                  checked={includeClassrooms}
                  onCheckedChange={(checked) =>
                    setIncludeClassrooms(checked === true)
                  }
                />
                <Label htmlFor="include-classrooms" className="cursor-pointer">
                  Incluir turmas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-infrastructure"
                  checked={includeInfrastructure}
                  onCheckedChange={(checked) =>
                    setIncludeInfrastructure(checked === true)
                  }
                />
                <Label htmlFor="include-infrastructure" className="cursor-pointer">
                  Incluir infraestrutura
                </Label>
              </div>
            </div>
          </div>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>Formato do Arquivo</AlertTitle>
            <AlertDescription>
              O arquivo será gerado no formato texto (TXT) com campos separados por
              pipe (|), conforme especificação do Educacenso. Cada linha representa
              um registro (00=Escola, 10=Aluno, 20=Professor, 30=Turma, 40=Infraestrutura).
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
            size="lg"
          >
            {isExporting ? (
              <>
                <FileText className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar para Educacenso
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

