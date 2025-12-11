import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import useProjectStore from '@/stores/useProjectStore'

interface ProjectEnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (projectId: string) => void
  excludeProjectIds: string[]
}

export function ProjectEnrollmentDialog({
  open,
  onOpenChange,
  onSubmit,
  excludeProjectIds,
}: ProjectEnrollmentDialogProps) {
  const { projects } = useProjectStore()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')

  const availableProjects = projects.filter(
    (p) => !excludeProjectIds.includes(p.id),
  )

  const handleSubmit = () => {
    if (selectedProjectId) {
      onSubmit(selectedProjectId)
      onOpenChange(false)
      setSelectedProjectId('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Matricular em Projeto</DialogTitle>
          <DialogDescription>
            Selecione uma atividade extracurricular.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Projeto disponível</Label>
            <Select
              onValueChange={setSelectedProjectId}
              value={selectedProjectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum projeto disponível
                  </SelectItem>
                ) : (
                  availableProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.schedule}
                    </SelectItem>
                  ))
                )}
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
            type="button"
            onClick={handleSubmit}
            disabled={!selectedProjectId}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
