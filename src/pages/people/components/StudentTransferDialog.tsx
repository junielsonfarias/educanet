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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useSchoolStore from '@/stores/useSchoolStore'
import { Student } from '@/lib/mock-data'

interface StudentTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransfer: (
    type: 'internal' | 'external',
    destination: string,
    notes?: string,
  ) => void
  student: Student
}

export function StudentTransferDialog({
  open,
  onOpenChange,
  onTransfer,
  student,
}: StudentTransferDialogProps) {
  const { schools } = useSchoolStore()
  const [transferType, setTransferType] = useState<'internal' | 'external'>(
    'internal',
  )
  const [destinationSchoolId, setDestinationSchoolId] = useState('')
  const [destinationExternal, setDestinationExternal] = useState('')
  const [notes, setNotes] = useState('')

  const handleTransfer = () => {
    const destination =
      transferType === 'internal'
        ? schools.find((s) => s.id === destinationSchoolId)?.name || 'Unknown'
        : destinationExternal

    onTransfer(transferType, destination, notes)
    onOpenChange(false)
    // Reset
    setTransferType('internal')
    setDestinationSchoolId('')
    setDestinationExternal('')
    setNotes('')
  }

  // Filter out the current school if possible (assuming we know it from enrollments)
  // For simplicity, just listing all schools
  const currentEnrollment = student.enrollments.find(
    (e) => e.status === 'Cursando',
  )
  const availableSchools = schools.filter(
    (s) => s.id !== currentEnrollment?.schoolId,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferência de Aluno</DialogTitle>
          <DialogDescription>
            Inicie o processo de transferência para {student.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={transferType}
            onValueChange={(v) => setTransferType(v as 'internal' | 'external')}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="internal" id="internal" />
              <Label htmlFor="internal">Transferência Interna (Rede)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="external" id="external" />
              <Label htmlFor="external">Transferência Externa</Label>
            </div>
          </RadioGroup>

          {transferType === 'internal' ? (
            <div className="space-y-2">
              <Label>Escola de Destino</Label>
              <Select
                onValueChange={setDestinationSchoolId}
                value={destinationSchoolId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escola..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSchools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Nome da Instituição de Destino</Label>
              <Input
                placeholder="Ex: Colégio Estadual..."
                value={destinationExternal}
                onChange={(e) => setDestinationExternal(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações / Motivo</Label>
            <Input
              placeholder="Opcional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={
              transferType === 'internal'
                ? !destinationSchoolId
                : !destinationExternal
            }
          >
            Confirmar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
