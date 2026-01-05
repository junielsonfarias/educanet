import { useState, useEffect, useMemo } from 'react'
import { FileText, Download, Search, Filter, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useDocumentStore } from '@/stores/useDocumentStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useAssessmentStore } from '@/stores/useAssessmentStore.supabase'
import { useAttendanceStore } from '@/stores/useAttendanceStore.supabase'
import { useCourseStore } from '@/stores/useCourseStore.supabase'
import { documentService } from '@/lib/supabase/services'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DocumentType } from '@/lib/mock-data'
import { DocumentGenerationDialog } from './components/DocumentGenerationDialog'

export default function SchoolDocuments() {
  const {
    documents,
    loading: documentsLoading,
    fetchDocuments,
    addDocument,
  } = useDocumentStore()
  const { students, loading: studentsLoading, fetchStudents } = useStudentStore()
  const { schools, loading: schoolsLoading, fetchSchools } = useSchoolStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all')
  const [schoolFilter, setSchoolFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchDocuments()
    fetchStudents()
    fetchSchools()
  }, [fetchDocuments, fetchStudents, fetchSchools])

  // Filtrar documentos
  const safeDocuments = Array.isArray(documents) ? documents : []
  const safeStudents = Array.isArray(students) ? students : []
  const safeSchools = Array.isArray(schools) ? schools : []

  const filteredDocuments = useMemo(() => {
    return safeDocuments.map((doc) => {
      // Extrair protocol_number do campo notes (JSON)
      let protocolNumber = ''
      let schoolId: number | null = null
      try {
        if (doc.notes) {
          const metadata = JSON.parse(doc.notes)
          protocolNumber = metadata.protocol_number || ''
          schoolId = metadata.school_id || null
        }
      } catch {
        // Se não for JSON válido, usar campo direto se existir
        protocolNumber = (doc as any).protocol_number || ''
      }
      
      return {
        ...doc,
        protocol_number: protocolNumber,
        school_id: schoolId || doc.school_id,
      }
    }).filter((doc) => {
      const studentProfileId = doc.student_profile_id
      const student = studentProfileId ? safeStudents.find((s) => s.id === studentProfileId) : null
      const studentName = student 
        ? `${student.person?.first_name || ''} ${student.person?.last_name || ''}`.trim()
        : ''

      const matchesSearch =
        searchTerm === '' ||
        doc.protocol_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentName.toLowerCase().includes(searchTerm.toLowerCase())

      const docType = doc.document_type as DocumentType
      const matchesType = typeFilter === 'all' || docType === typeFilter
      const matchesSchool = schoolFilter === 'all' || doc.school_id?.toString() === schoolFilter

      return matchesSearch && matchesType && matchesSchool
    })
  }, [safeDocuments, safeStudents, searchTerm, typeFilter, schoolFilter])

  const handleGenerateDocument = async (
    type: DocumentType,
    studentId: string,
    schoolId: string,
    academicYearId?: string,
    classroomId?: string,
  ) => {
    try {
      const student = safeStudents.find((s) => s.id.toString() === studentId)
      const school = safeSchools.find((s) => s.id.toString() === schoolId)

      if (!student || !school) {
        toast.error('Aluno ou escola não encontrados.')
        return
      }

      // Gerar protocolo único
      const protocolNumber = `DOC-${Date.now()}`
      
      // Criar documento no Supabase
      await documentService.createDocument({
        student_profile_id: student.id,
        document_type: type,
        title: getDocumentTypeLabel(type),
        issue_date: new Date().toISOString().split('T')[0],
        notes: JSON.stringify({
          school_id: school.id,
          academic_year_id: academicYearId ? parseInt(academicYearId) : null,
          classroom_id: classroomId ? parseInt(classroomId) : null,
          protocol_number: protocolNumber,
        }),
      })

      toast.success('Documento gerado com sucesso.')
      fetchDocuments()
    } catch {
      toast.error('Erro ao gerar documento.')
    }
  }

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      historico: 'Histórico Escolar',
      declaracao_matricula: 'Declaração de Matrícula',
      ficha_individual: 'Ficha Individual',
      declaracao_transferencia: 'Declaração de Transferência',
      ata_resultados: 'Ata de Resultados',
      certificado: 'Certificado',
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive', label: string }> = {
      'draft': { variant: 'secondary', label: 'Rascunho' },
      'issued': { variant: 'default', label: 'Emitido' },
      'cancelled': { variant: 'destructive', label: 'Cancelado' },
    }
    const config = statusMap[status] || { variant: 'secondary' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Documentos Escolares
          </h2>
          <p className="text-muted-foreground">
            Gere e gerencie documentos oficiais dos alunos.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
        >
          <div className="p-1 rounded-md bg-white/20 mr-2">
            <Plus className="h-5 w-5" />
          </div>
          Gerar Documento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo ou aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as DocumentType | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="historico">Histórico Escolar</SelectItem>
                <SelectItem value="declaracao_matricula">Declaração de Matrícula</SelectItem>
                <SelectItem value="ficha_individual">Ficha Individual</SelectItem>
                <SelectItem value="declaracao_transferencia">Declaração de Transferência</SelectItem>
                <SelectItem value="ata_resultados">Ata de Resultados</SelectItem>
                <SelectItem value="certificado">Certificado</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={schoolFilter}
              onValueChange={setSchoolFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as escolas</SelectItem>
                {safeSchools.map((school) => (
                  <SelectItem key={school.id} value={school.id.toString()}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Gerados</CardTitle>
          <CardDescription>
            {filteredDocuments.length} documento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documentsLoading || studentsLoading || schoolsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento encontrado.</p>
              <p className="text-sm mt-2">Esta funcionalidade será implementada em breve no banco de dados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const student = doc.student_profile_id ? safeStudents.find((s) => s.id === doc.student_profile_id) : null
                  const school = doc.school_id ? safeSchools.find((s) => s.id === doc.school_id) : null
                  const studentName = student 
                    ? `${student.person?.first_name || ''} ${student.person?.last_name || ''}`.trim() || 'N/A'
                    : 'N/A'
                  
                  return (
                    <TableRow key={`doc-${doc.id}`}>
                      <TableCell className="font-mono text-sm">
                        {doc.protocol_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getDocumentTypeLabel(doc.document_type as DocumentType)}
                      </TableCell>
                      <TableCell>{studentName}</TableCell>
                      <TableCell>{school?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {doc.created_at
                          ? format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(doc.status || 'draft')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Implementar download quando documentos forem adicionados ao BD
                            toast.info('Download será implementado em breve.')
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DocumentGenerationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onGenerate={handleGenerateDocument}
      />
    </div>
  )
}
