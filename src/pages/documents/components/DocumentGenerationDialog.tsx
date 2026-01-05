import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { useSchoolStore } from '@/stores/useSchoolStore.supabase'
import { useAcademicYearStore } from '@/stores/useAcademicYearStore.supabase'
import { classService } from '@/lib/supabase/services'
import { DocumentType } from '@/lib/mock-data'
import { Skeleton } from '@/components/ui/skeleton'

interface DocumentGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (
    type: DocumentType,
    studentId: string,
    schoolId: string,
    academicYearId?: string,
    classroomId?: string,
  ) => void
}

export function DocumentGenerationDialog({
  open,
  onOpenChange,
  onGenerate,
}: DocumentGenerationDialogProps) {
  const { students, fetchStudents } = useStudentStore()
  const { schools, fetchSchools } = useSchoolStore()
  const { academicYears, fetchAcademicYears } = useAcademicYearStore()

  const [documentType, setDocumentType] = useState<DocumentType>('historico')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('')
  const [selectedClassroom, setSelectedClassroom] = useState<string>('')
  const [classes, setClasses] = useState<any[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    if (open) {
      fetchStudents()
      fetchSchools()
      fetchAcademicYears()
    }
  }, [open, fetchStudents, fetchSchools, fetchAcademicYears])

  // Filtrar anos letivos por escola
  const filteredAcademicYears = academicYears.filter((y) => 
    y.school_id?.toString() === selectedSchool
  )

  // Buscar turmas quando escola e ano são selecionados
  useEffect(() => {
    const fetchClasses = async () => {
      if (selectedSchool && selectedAcademicYear) {
        setLoadingClasses(true)
        try {
          const classesData = await classService.getBySchool(parseInt(selectedSchool))
          const filteredClasses = (classesData || []).filter(
            (c) => c.academic_year_id?.toString() === selectedAcademicYear
          )
          setClasses(filteredClasses)
        } catch (error) {
          console.error('Erro ao buscar turmas:', error)
          setClasses([])
        } finally {
          setLoadingClasses(false)
        }
      } else {
        setClasses([])
      }
    }
    fetchClasses()
  }, [selectedSchool, selectedAcademicYear])

  const safeStudents = Array.isArray(students) ? students : []
  const safeSchools = Array.isArray(schools) ? schools : []

  const handleGenerate = () => {
    if (!selectedStudent || !selectedSchool) {
      return
    }

    // Para histórico e ficha individual, não precisa de ano/turma específicos
    if (documentType === 'historico' || documentType === 'ficha_individual') {
      onGenerate(documentType, selectedStudent, selectedSchool)
    } else {
      // Para outros documentos, precisa de ano letivo e turma
      if (!selectedAcademicYear || !selectedClassroom) {
        return
      }
      onGenerate(
        documentType,
        selectedStudent,
        selectedSchool,
        selectedAcademicYear,
        selectedClassroom,
      )
    }

    // Reset form
    setSelectedStudent('')
    setSelectedSchool('')
    setSelectedAcademicYear('')
    setSelectedClassroom('')
    onOpenChange(false)
  }

  const canGenerate = () => {
    if (!selectedStudent || !selectedSchool) return false
    if (documentType === 'historico' || documentType === 'ficha_individual') return true
    return !!selectedAcademicYear && !!selectedClassroom
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerar Documento Escolar</DialogTitle>
          <DialogDescription>
            Selecione o tipo de documento e os dados necessários para gerar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Tipo de Documento</Label>
            <Select
              value={documentType}
              onValueChange={(v) => setDocumentType(v as DocumentType)}
            >
              <SelectTrigger id="document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="historico">Histórico Escolar</SelectItem>
                <SelectItem value="declaracao_matricula">Declaração de Matrícula</SelectItem>
                <SelectItem value="ficha_individual">Ficha Individual</SelectItem>
                <SelectItem value="declaracao_transferencia">Declaração de Transferência</SelectItem>
                <SelectItem value="ata_resultados">Ata de Resultados</SelectItem>
                <SelectItem value="certificado">Certificado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student">Aluno</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger id="student">
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {safeStudents.map((student) => {
                  const fullName = `${student.person?.first_name || ''} ${student.person?.last_name || ''}`.trim()
                  return (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {fullName} - {student.registration_number || student.id}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">Escola</Label>
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger id="school">
                <SelectValue placeholder="Selecione a escola" />
              </SelectTrigger>
              <SelectContent>
                {safeSchools.map((school) => (
                  <SelectItem key={school.id} value={school.id.toString()}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {documentType !== 'historico' && documentType !== 'ficha_individual' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="academic-year">Ano Letivo</Label>
                <Select
                  value={selectedAcademicYear}
                  onValueChange={setSelectedAcademicYear}
                >
                  <SelectTrigger id="academic-year">
                    <SelectValue placeholder="Selecione o ano letivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAcademicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classroom">Turma</Label>
                <Select
                  value={selectedClassroom}
                  onValueChange={setSelectedClassroom}
                >
                  <SelectTrigger id="classroom">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClasses ? (
                      <div className="flex justify-center p-2">
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ) : (
                      classes.map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.id.toString()}>
                          {classroom.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={!canGenerate()}>
            Gerar Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

