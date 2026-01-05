import { useState, useEffect, useMemo } from 'react'
import { Mail, MessageSquare, Bell, Plus, Search, Filter, Send, Edit, Trash2 } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useNotificationStore } from '@/stores/useNotificationStore.supabase'
import { useStudentStore } from '@/stores/useStudentStore.supabase'
import { NotificationFormDialog } from './components/NotificationFormDialog'
import { TemplateFormDialog } from './components/TemplateFormDialog'
import { RequirePermission } from '@/components/RequirePermission'
import type { Database } from '@/lib/supabase/database.types'
import { format, parseISO } from 'date-fns'

type CommunicationRow = Database['public']['Tables']['communications']['Row']

export default function NotificationsManager() {
  const {
    communications,
    loading,
    fetchCommunications,
    sendCommunication,
    updateCommunicationStatus,
    deleteCommunication,
  } = useNotificationStore()
  const { students, fetchStudents } = useStudentStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'email' | 'sms' | 'push'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all')
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<CommunicationRow | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null)

  // Fetch data on mount
  useEffect(() => {
    fetchCommunications()
    fetchStudents()
  }, [fetchCommunications, fetchStudents])

  // Filtrar notificações
  const filteredNotifications = useMemo(() => {
    if (!Array.isArray(communications)) return []
    
    return communications.map((notif) => {
      // Mapear campos do Supabase para o formato esperado pelo componente
      const subject = notif.title || (notif as any).subject || ''
      const channel = notif.communication_type || (notif as any).channel || 'email'
      const status = (notif as any).status || 'pending'
      const recipientName = notif.recipients?.[0]?.person?.first_name 
        ? `${notif.recipients[0].person.first_name} ${notif.recipients[0].person.last_name || ''}`.trim()
        : (notif as any).recipient_name || 'N/A'
      const sentAt = notif.sent_date || (notif as any).sent_at || notif.created_at
      
      return {
        ...notif,
        subject,
        channel,
        status,
        recipient_name: recipientName,
        sent_at: sentAt,
      }
    }).filter((notif) => {
      const matchesSearch =
        searchTerm === '' ||
        notif.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === 'all' || notif.channel === typeFilter
      const matchesStatus = statusFilter === 'all' || notif.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [communications, searchTerm, typeFilter, statusFilter])

  // Templates - por enquanto vazio, pode ser implementado depois
  const templates: any[] = []

  const handleCreateNotification = () => {
    setEditingNotification(null)
    setIsNotificationDialogOpen(true)
  }

  const handleEditNotification = (notification: CommunicationRow) => {
    setEditingNotification(notification)
    setIsNotificationDialogOpen(true)
  }

  const handleDeleteNotification = async (id: number) => {
    try {
      await deleteCommunication(id)
      toast.success('Notificação removida com sucesso.')
    } catch (error) {
      toast.error('Erro ao remover notificação')
    }
  }

  const handleSendNotification = async (id: number) => {
    try {
      await updateCommunicationStatus(id, 'sent')
      toast.success('Notificação enviada com sucesso.')
      fetchCommunications()
    } catch (error) {
      toast.error('Erro ao enviar notificação')
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setIsTemplateDialogOpen(true)
  }

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template)
    setIsTemplateDialogOpen(true)
  }

  const handleDeleteTemplate = (id: string) => {
    // TODO: Implementar quando templates forem adicionados ao BD
    toast.info('Funcionalidade de templates será implementada em breve.')
  }

  const getChannelIcon = (channel: string | null) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'push':
        return <Bell className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive', label: string }> = {
      'pending': { variant: 'secondary', label: 'Pendente' },
      'sent': { variant: 'default', label: 'Enviado' },
      'failed': { variant: 'destructive', label: 'Falhou' },
    }
    const config = status ? statusMap[status] : { variant: 'secondary' as const, label: 'Pendente' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Comunicação e Notificações
          </h2>
          <p className="text-muted-foreground">
            Gerencie notificações, templates e envios para responsáveis e alunos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCreateTemplate}
            className="w-full sm:w-auto border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all"
          >
            <div className="p-1 rounded-md bg-indigo-50 mr-2">
              <Plus className="h-5 w-5" />
            </div>
            Novo Template
          </Button>
          <RequirePermission permission="create:notification">
            <Button 
              onClick={handleCreateNotification} 
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
            >
              <div className="p-1 rounded-md bg-white/20 mr-2">
                <Plus className="h-5 w-5" />
              </div>
              Nova Notificação
            </Button>
          </RequirePermission>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Notificações Enviadas</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as notificações enviadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por assunto ou destinatário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os canais</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      // Loading skeletons
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[300px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredNotifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          Nenhuma notificação encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredNotifications.map((notif) => {
                        const channel = notif.channel || 'email'
                        const status = notif.status || 'pending'
                        const sentDate = notif.sent_at || notif.created_at
                        
                        return (
                          <TableRow key={`comm-${notif.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getChannelIcon(channel)}
                                <span className="capitalize">{channel}</span>
                              </div>
                            </TableCell>
                            <TableCell>{notif.recipient_name || 'N/A'}</TableCell>
                            <TableCell className="max-w-[300px] truncate">
                              {notif.subject || 'Sem assunto'}
                            </TableCell>
                            <TableCell>
                              {sentDate ? format(parseISO(sentDate), 'dd/MM/yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusBadge(status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {status === 'pending' && (
                                  <RequirePermission permission="create:notification">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSendNotification(notif.id)}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </RequirePermission>
                                )}
                                <RequirePermission permission="edit:notification">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditNotification(notif)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </RequirePermission>
                                <RequirePermission permission="delete:notification">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNotification(notif.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </RequirePermission>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Templates de Notificação</CardTitle>
              <CardDescription>
                Gerencie templates reutilizáveis para notificações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          Nenhum template cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getChannelIcon(template.channel)}
                              <span className="capitalize">{template.channel}</span>
                            </div>
                          </TableCell>
                          <TableCell>{template.subject}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTemplate(template)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NotificationFormDialog
        open={isNotificationDialogOpen}
        onOpenChange={setIsNotificationDialogOpen}
        onSave={async (data) => {
          try {
            if (editingNotification) {
              await updateCommunicationStatus(editingNotification.id, data.status || 'pending')
              toast.success('Notificação atualizada com sucesso.')
            } else {
              await sendCommunication({
                recipient_person_id: data.recipient_person_id,
                channel: data.channel || 'email',
                subject: data.subject,
                content: data.content,
                priority: data.priority || 'normal',
              })
              toast.success('Notificação criada com sucesso.')
            }
            setEditingNotification(null)
            fetchCommunications()
          } catch (error) {
            toast.error('Erro ao salvar notificação')
          }
        }}
        initialData={editingNotification}
      />

      <TemplateFormDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        onSave={async (data) => {
          // TODO: Implementar quando templates forem adicionados ao BD
          toast.info('Funcionalidade de templates será implementada em breve.')
          setEditingTemplate(null)
        }}
        initialData={editingTemplate}
      />
    </div>
  )
}

