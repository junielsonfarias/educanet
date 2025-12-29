import { useState } from 'react'
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
import useSchoolStore from '@/stores/useSchoolStore'
import useCourseStore from '@/stores/useCourseStore'

interface TeacherAllocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function TeacherAllocationDialog({
  open,
  onOpenChange,
  onSubmit,
}: TeacherAllocationDialogProps) {
  const { schools } = useSchoolStore()
  const { etapasEnsino } = useCourseStore()

  const [schoolId, setSchoolId] = useState('')
  const [yearId, setYearId] = useState('')
  const [classroomId, setClassroomId] = useState('')

  const selectedSchool = schools.find((s) => s.id === schoolId)
  const selectedYear = selectedSchool?.academicYears.find(
    (y) => y.id === yearId,
  )
  const turmas = selectedYear?.turmas || []
  const selectedClass = turmas.find((c) => c.id === classroomId)

  // Find subject options based on the class serieAno
  // Flatten all seriesAnos to find the one matching the class serieAnoId
  const allSeriesAnos = etapasEnsino.flatMap((e) => e.seriesAnos)
  const classSerieAno = allSeriesAnos.find((s) => s.id === selectedClass?.serieAnoId)
  const subjects = classSerieAno?.subjects || []

  const [subjectId, setSubjectId] = useState('')

  const handleSubmit = () => {
    onSubmit({
      schoolId,
      academicYearId: yearId,
      classroomId,
      subjectId: subjectId || undefined,
    })
    onOpenChange(false)
    // Reset state
    setSchoolId('')
    setYearId('')
    setClassroomId('')
    setSubjectId('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Alocação</DialogTitle>
          <DialogDescription>
            Atribua o professor a uma turma e disciplina.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Escola</Label>
            <Select onValueChange={setSchoolId} value={schoolId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a escola" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ano Letivo</Label>
            <Select
              onValueChange={setYearId}
              value={yearId}
              disabled={!schoolId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {selectedSchool?.academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Turma</Label>
            <Select
              onValueChange={setClassroomId}
              value={classroomId}
              disabled={!yearId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Disciplina (Opcional)</Label>
            <Select
              onValueChange={setSubjectId}
              value={subjectId}
              disabled={!classroomId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Regente (Polivalente)</SelectItem>
                {subjects.map((subj) => (
                  <SelectItem key={subj.id} value={subj.id}>
                    {subj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!schoolId || !yearId || !classroomId}
          >
            Alocar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
