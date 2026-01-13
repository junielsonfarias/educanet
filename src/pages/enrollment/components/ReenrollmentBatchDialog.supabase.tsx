/**
 * ReenrollmentBatchDialog - Dialog para criar lote de rematricula (Versao Supabase)
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Users,
  GraduationCap,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  RefreshCcw,
} from 'lucide-react'

interface ResumoPreviaRematricula {
  total_alunos: number
  total_aprovados: number
  total_reprovados: number
  total_concluidos: number
  total_trocam_escola: number
  por_serie_destino: Record<string, number>
}

interface ReenrollmentBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: number | null
  anoOrigemId: number
  anoDestinoId: number
  resumoPrevia: ResumoPreviaRematricula | null
  onConfirm: () => void
  loading: boolean
}

export function ReenrollmentBatchDialogSupabase({
  open,
  onOpenChange,
  schoolId,
  anoOrigemId,
  anoDestinoId,
  resumoPrevia,
  onConfirm,
  loading,
}: ReenrollmentBatchDialogProps) {
  if (!schoolId || !resumoPrevia) return null

  const totalParaRematricular = resumoPrevia.total_alunos - resumoPrevia.total_concluidos

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Criar Lote de Rematricula
          </DialogTitle>
          <DialogDescription>
            Revise as informacoes antes de criar o lote de rematricula
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumo Geral */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Total de Alunos</span>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{resumoPrevia.total_alunos}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Serao Rematriculados</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{totalParaRematricular}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Detalhamento */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <ArrowUpRight className="h-5 w-5 mx-auto text-green-500" />
              <p className="text-xl font-bold text-green-600 mt-1">
                {resumoPrevia.total_aprovados}
              </p>
              <p className="text-xs text-muted-foreground">Aprovados</p>
            </div>

            <div className="rounded-lg border p-3 text-center">
              <ArrowDownRight className="h-5 w-5 mx-auto text-red-500" />
              <p className="text-xl font-bold text-red-600 mt-1">
                {resumoPrevia.total_reprovados}
              </p>
              <p className="text-xs text-muted-foreground">Reprovados</p>
            </div>

            <div className="rounded-lg border p-3 text-center">
              <GraduationCap className="h-5 w-5 mx-auto text-purple-500" />
              <p className="text-xl font-bold text-purple-600 mt-1">
                {resumoPrevia.total_concluidos}
              </p>
              <p className="text-xs text-muted-foreground">Concluiram Ciclo</p>
            </div>

            <div className="rounded-lg border p-3 text-center">
              <Building2 className="h-5 w-5 mx-auto text-orange-500" />
              <p className="text-xl font-bold text-orange-600 mt-1">
                {resumoPrevia.total_trocam_escola}
              </p>
              <p className="text-xs text-muted-foreground">Trocam Escola</p>
            </div>
          </div>

          {/* Distribuicao por Serie */}
          {Object.keys(resumoPrevia.por_serie_destino).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Distribuicao por Serie Destino</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(resumoPrevia.por_serie_destino)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([serie, count]) => (
                      <Badge key={serie} variant="secondary" className="text-sm">
                        {serie}: {count}
                      </Badge>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* Alertas */}
          {resumoPrevia.total_trocam_escola > 0 && (
            <Alert variant="default" className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Atencao</AlertTitle>
              <AlertDescription className="text-orange-700">
                {resumoPrevia.total_trocam_escola} aluno(s) precisam trocar de escola
                pois a serie destino nao esta disponivel na escola atual. Apos criar
                o lote, sera necessario definir manualmente a escola de destino.
              </AlertDescription>
            </Alert>
          )}

          {resumoPrevia.total_concluidos > 0 && (
            <Alert>
              <GraduationCap className="h-4 w-4" />
              <AlertTitle>Alunos Concluintes</AlertTitle>
              <AlertDescription>
                {resumoPrevia.total_concluidos} aluno(s) concluiram o ciclo e nao
                serao rematriculados. Eles terao seu status alterado para &quot;Concluido&quot;.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading || resumoPrevia.total_alunos === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Lote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
