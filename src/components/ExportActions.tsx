import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileDown, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { exportToCSV, exportToExcel, triggerPrint } from '@/lib/export-utils'
import { useToast } from '@/hooks/use-toast'

interface ExportActionsProps {
  data: any[]
  filename?: string
  columns?: string[] // Optional: restrict or order columns
  disablePrint?: boolean
}

export function ExportActions({
  data,
  filename = 'relatorio',
  columns,
  disablePrint = false,
}: ExportActionsProps) {
  const { toast } = useToast()

  const handleExportCSV = () => {
    exportToCSV(data, filename, columns)
    toast({ title: 'Exportação Concluída', description: 'Arquivo CSV gerado.' })
  }

  const handleExportExcel = () => {
    exportToExcel(data, filename, columns)
    toast({
      title: 'Exportação Concluída',
      description: 'Arquivo Excel gerado.',
    })
  }

  return (
    <div className="flex gap-2">
      {!disablePrint && (
        <Button
          variant="outline"
          size="sm"
          onClick={triggerPrint}
          className="hidden md:flex"
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportCSV}>
            <FileText className="mr-2 h-4 w-4" />
            CSV (Dados)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel (XLS)
          </DropdownMenuItem>
          {!disablePrint && (
            <DropdownMenuItem onClick={triggerPrint} className="md:hidden">
              <Printer className="mr-2 h-4 w-4" />
              PDF / Imprimir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
