import { useState, useMemo } from 'react'
import {
  ArrowRight,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
import { useToast } from '@/hooks/use-toast'
import useTransferStore from '@/stores/useTransferStore'
import useStudentStore from '@/stores/useStudentStore'
import useSchoolStore from '@/stores/useSchoolStore'
import { TransferFormDialog } from './components/TransferFormDialog'
import { TransferDetailsDialog } from './components/TransferDetailsDialog'
import { RequirePermission } from '@/components/RequirePermission'

export default function TransfersManager() {
  const {
    transfers,
    getTransfersBySchool,
    getPendingTransfers,
    approveTransfer,
    rejectTransfer,
    completeTransfer,
  } = useTransferStore()
  const { students } = useStudentStore()
  const { schools } = useSchoolStore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'internal' | 'external'>('all')
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<string | null>(null)
  const [editingTransfer, setEditingTransfer] = useState<string | null>(null)

  // Filtrar transferências
  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const student = students.find((s) => s.id === transfer.studentId)
      const matchesSearch =
        searchTerm === '' ||
        transfer.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.fromSchoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transfer.toSchoolName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSchool =
        schoolFilter === 'all' ||
        transfer.fromSchoolId === schoolFilter ||
        transfer.toSchoolId === schoolFilter

      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter
      const matchesType = typeFilter === 'all' || transfer.type === typeFilter

      return matchesSearch && matchesSchool && matchesStatus && matchesType
    })
  }, [transfers, students, searchTerm, schoolFilter, statusFilter, typeFilter])

  const availableSchools = schools.filter((s) => s.status === 'active')

  const handleCreateTransfer = () => {
    setEditingTransfer(null)
    setIsFormDialogOpen(true)
  }

  const handleViewTransfer = (transferId: string) => {
    setSelectedTransfer(transferId)
    setIsDetailsDialogOpen(true)
  }

  const handleApprove = (transferId: string) => {
    approveTransfer(transferId, 'system')
    toast({
      title: 'Transferência aprovada',
      description: 'A transferência foi aprovada e a notificação foi enviada.',
    })
  }

  const handleReject = (transferId: string, reason?: string) => {
    rejectTransfer(transferId, 'system', reason)
    toast({
      title: 'Transferência rejeitada',
      description: 'A transferência foi rejeitada.',
    })
  }

  const handleComplete = (transferId: string) => {
    completeTransfer(transferId)
    toast({
      title: 'Transferência concluída',
      description: 'A transferência foi marcada como concluída.',
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'secondary',
      rejected: 'destructive',
      completed: 'default',
    }

    const labels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovada',
      rejected: 'Rejeitada',
      completed: 'Concluída',
    }

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      approved: <CheckCircle className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
    }

    const statusClasses: Record<string, string> = {
      pending: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md',
      approved: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md',
      rejected: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md',
      completed: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md',
    }
    return (
      <Badge className={`flex items-center gap-1.5 px-2.5 py-1 font-medium ${statusClasses[status] || 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'}`}>
        {icons[status]}
        <div className="h-2 w-2 rounded-full bg-white" />
        {labels[status] || status}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline">
        {type === 'internal' ? 'Interna' : 'Externa'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transferências</h1>
          <p className="text-muted-foreground">
            Gerencie transferências de alunos entre escolas.
          </p>
        </div>
        <RequirePermission permission="create:student">
          <Button onClick={handleCreateTransfer}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Transferência
          </Button>
        </RequirePermission>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por aluno, escola ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Escolas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Escolas</SelectItem>
                {availableSchools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovada</SelectItem>
                <SelectItem value="rejected">Rejeitada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="internal">Interna</SelectItem>
                <SelectItem value="external">Externa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transferências */}
      <Card>
        <CardHeader>
          <CardTitle>Transferências</CardTitle>
          <CardDescription>
            {filteredTransfers.length} transferência(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4 p-4 rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent inline-flex">
                <ArrowRight className="h-12 w-12 text-blue-600/60" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Nenhuma transferência encontrada</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {transfers.length === 0
                  ? 'Comece criando uma nova transferência.'
                  : 'Tente ajustar os filtros para encontrar transferências.'}
              </p>
              {transfers.length === 0 && (
                <RequirePermission permission="create:student">
                  <Button 
                    onClick={handleCreateTransfer}
                    className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
                  >
                    <div className="p-1 rounded-md bg-white/20 mr-2">
                      <Plus className="h-5 w-5" />
                    </div>
                    Criar Primeira Transferência
                  </Button>
                </RequirePermission>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">
                      {transfer.studentName}
                    </TableCell>
                    <TableCell>{transfer.fromSchoolName}</TableCell>
                    <TableCell>
                      {transfer.type === 'internal' ? (
                        transfer.toSchoolName || 'N/A'
                      ) : (
                        transfer.toSchoolExternal || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>{getTypeBadge(transfer.type)}</TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell>
                      {format(new Date(transfer.transferDate), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewTransfer(transfer.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {transfer.status === 'pending' && (
                          <>
                            <RequirePermission permission="edit:student">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(transfer.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </RequirePermission>
                            <RequirePermission permission="edit:student">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReject(transfer.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </RequirePermission>
                          </>
                        )}
                        {transfer.status === 'approved' && (
                          <RequirePermission permission="edit:student">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleComplete(transfer.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </RequirePermission>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TransferFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        transferId={editingTransfer}
        onSuccess={() => {
          setIsFormDialogOpen(false)
          setEditingTransfer(null)
        }}
      />

      <TransferDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        transferId={selectedTransfer}
        onApprove={() => {
          if (selectedTransfer) {
            handleApprove(selectedTransfer)
            setIsDetailsDialogOpen(false)
            setSelectedTransfer(null)
          }
        }}
        onReject={(reason) => {
          if (selectedTransfer) {
            handleReject(selectedTransfer, reason)
            setIsDetailsDialogOpen(false)
            setSelectedTransfer(null)
          }
        }}
        onComplete={() => {
          if (selectedTransfer) {
            handleComplete(selectedTransfer)
            setIsDetailsDialogOpen(false)
            setSelectedTransfer(null)
          }
        }}
      />
    </div>
  )
}

