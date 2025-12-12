import { useState } from 'react'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Trash2,
  Filter,
  Search,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import useAlertStore from '@/stores/useAlertStore'
import { format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function AlertsDashboard() {
  const { alerts, markAsRead, deleteAlert } = useAlertStore()
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || alert.type === filterType
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unread' ? !alert.read : alert.read)

    return matchesSearch && matchesType && matchesStatus
  })

  // Sort by unread first, then date
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (a.read === b.read) {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    return a.read ? 1 : -1
  })

  const handleResolve = (id: string) => {
    markAsRead(id)
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Bell className="h-8 w-8" /> Central de Alertas
          </h1>
          <p className="text-muted-foreground">
            Monitore riscos, pendências e avisos importantes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/alertas/regras')}
            className="gap-2"
          >
            <Settings className="h-4 w-4" /> Configurar Regras
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Risco de Evasão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {
                alerts.filter((a) => a.type === 'dropout_risk' && !a.read)
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Alertas não lidos</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Baixo Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {
                alerts.filter((a) => a.type === 'low_performance' && !a.read)
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Alertas não lidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter((a) => !a.read).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Notificações pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
              <CardTitle>Lista de Alertas</CardTitle>
              <CardDescription>
                Gerencie as notificações do sistema.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-8 w-full md:w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="dropout_risk">Risco de Evasão</SelectItem>
                  <SelectItem value="low_performance">
                    Baixo Desempenho
                  </SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="unread">Não Lidos</SelectItem>
                  <SelectItem value="read">Resolvidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p>Nenhum alerta encontrado com os filtros atuais.</p>
              </div>
            ) : (
              sortedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg transition-colors',
                    !alert.read
                      ? 'bg-background border-l-4 border-l-primary shadow-sm'
                      : 'bg-muted/30 opacity-70',
                  )}
                >
                  <div className="flex gap-4 items-start mb-2 md:mb-0">
                    <div
                      className={cn(
                        'p-2 rounded-full',
                        alert.type === 'dropout_risk'
                          ? 'bg-red-100 text-red-600'
                          : alert.type === 'low_performance'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-blue-100 text-blue-600',
                      )}
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{alert.title}</h4>
                        {!alert.read && (
                          <Badge variant="default" className="text-[10px] h-5">
                            Novo
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(alert.date), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                      {alert.studentId && (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-xs mt-1"
                          onClick={() =>
                            navigate(`/pessoas/alunos/${alert.studentId}`)
                          }
                        >
                          Ver Perfil do Aluno
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    {!alert.read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(alert.id)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        Marcar como Lido
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
