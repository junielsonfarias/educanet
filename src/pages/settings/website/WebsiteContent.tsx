import { useState, useEffect } from 'react'
import {
  Save,
  Info,
  Building,
  LayoutGrid,
  Link2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import usePublicContentStore from '@/stores/usePublicContentStore'
import useSettingsStore from '@/stores/useSettingsStore'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ServiceCard, QuickLink } from '@/lib/mock-data'

export default function WebsiteContent() {
  const { getContent, updateInstitutionalContent } = usePublicContentStore()
  const { settings, updateSettings } = useSettingsStore()
  const { toast } = useToast()

  const infoContent = getContent('semed_info')
  const structureContent = getContent('semed_structure')

  const [infoData, setInfoData] = useState({
    title: infoContent?.title || '',
    content: infoContent?.content || '',
  })

  const [structureData, setStructureData] = useState({
    title: structureContent?.title || '',
    content: structureContent?.content || '',
  })

  // Local state for management
  const [serviceCards, setServiceCards] = useState<ServiceCard[]>([])
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([])

  // Load from store on mount
  useEffect(() => {
    if (settings.serviceCards) setServiceCards(settings.serviceCards)
    if (settings.quickLinks) setQuickLinks(settings.quickLinks)
  }, [settings])

  const handleSaveInfo = () => {
    updateInstitutionalContent('semed_info', infoData)
    toast({
      title: 'Conteúdo atualizado',
      description: 'As informações da SEMED foram salvas com sucesso.',
    })
  }

  const handleSaveStructure = () => {
    updateInstitutionalContent('semed_structure', structureData)
    toast({
      title: 'Conteúdo atualizado',
      description: 'A estrutura da SEMED foi salva com sucesso.',
    })
  }

  // --- Service Card Handlers ---
  const addServiceCard = () => {
    const newCard: ServiceCard = {
      id: Math.random().toString(36).substring(2, 11),
      title: 'Novo Serviço',
      description: 'Descrição do serviço',
      icon: 'Star',
      link: '#',
      color: 'blue',
      active: true,
      order: serviceCards.length + 1,
    }
    setServiceCards([...serviceCards, newCard])
  }

  const updateServiceCard = (
    id: string,
    field: keyof ServiceCard,
    value: any,
  ) => {
    setServiceCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, [field]: value } : card)),
    )
  }

  const removeServiceCard = (id: string) => {
    setServiceCards((prev) => prev.filter((card) => card.id !== id))
  }

  const saveServiceCards = () => {
    updateSettings({ serviceCards })
    toast({
      title: 'Cartões salvos',
      description: 'A lista de serviços foi atualizada.',
    })
  }

  // --- Quick Link Handlers ---
  const addQuickLink = () => {
    const newLink: QuickLink = {
      id: Math.random().toString(36).substring(2, 11),
      label: 'Novo Link',
      url: '#',
      active: true,
      order: quickLinks.length + 1,
    }
    setQuickLinks([...quickLinks, newLink])
  }

  const updateQuickLink = (id: string, field: keyof QuickLink, value: any) => {
    setQuickLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, [field]: value } : link)),
    )
  }

  const removeQuickLink = (id: string) => {
    setQuickLinks((prev) => prev.filter((link) => link.id !== id))
  }

  const saveQuickLinks = () => {
    updateSettings({ quickLinks })
    toast({
      title: 'Links salvos',
      description: 'Os links rápidos foram atualizados.',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Gestão de Conteúdo Institucional
        </h2>
        <p className="text-muted-foreground">
          Edite os textos, cartões de serviço e links do site público.
        </p>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="info" className="gap-2">
            <Info className="h-4 w-4" /> Informações
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-2">
            <Building className="h-4 w-4" /> Estrutura
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <LayoutGrid className="h-4 w-4" /> Cartões de Serviço
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2">
            <Link2 className="h-4 w-4" /> Links Rápidos
          </TabsTrigger>
        </TabsList>

        {/* Existing Info Tab */}
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Texto de apresentação da Secretaria de Educação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="info-title">Título da Seção</Label>
                <Input
                  id="info-title"
                  value={infoData.title}
                  onChange={(e) =>
                    setInfoData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Ex: Sobre a SEMED"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="info-content">Conteúdo (HTML suportado)</Label>
                <Textarea
                  id="info-content"
                  className="min-h-[200px] font-mono text-sm"
                  value={infoData.content}
                  onChange={(e) =>
                    setInfoData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="<p>Texto descritivo...</p>"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveInfo}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Existing Structure Tab */}
        <TabsContent value="structure" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Estrutura Organizacional</CardTitle>
              <CardDescription>
                Organograma e descrição dos departamentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="structure-title">Título da Seção</Label>
                <Input
                  id="structure-title"
                  value={structureData.title}
                  onChange={(e) =>
                    setStructureData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Ex: Nossa Estrutura"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="structure-content">
                  Conteúdo (HTML suportado)
                </Label>
                <Textarea
                  id="structure-content"
                  className="min-h-[200px] font-mono text-sm"
                  value={structureData.content}
                  onChange={(e) =>
                    setStructureData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="<p>Descrição dos departamentos...</p>"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveStructure}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Service Cards Tab */}
        <TabsContent value="services" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cartões de Serviço</CardTitle>
                <CardDescription>
                  Gerencie os atalhos exibidos na página inicial.
                </CardDescription>
              </div>
              <Button onClick={addServiceCard} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Cartão
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {serviceCards.map((card, index) => (
                  <div
                    key={card.id}
                    className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-card items-start"
                  >
                    <div className="flex-1 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={card.title}
                          onChange={(e) =>
                            updateServiceCard(card.id, 'title', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2 lg:col-span-2">
                        <Label>Descrição</Label>
                        <Input
                          value={card.description}
                          onChange={(e) =>
                            updateServiceCard(
                              card.id,
                              'description',
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Link</Label>
                        <Input
                          value={card.link}
                          onChange={(e) =>
                            updateServiceCard(card.id, 'link', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ícone (Lucide)</Label>
                        <Input
                          value={card.icon}
                          onChange={(e) =>
                            updateServiceCard(card.id, 'icon', e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor</Label>
                        <Select
                          value={card.color}
                          onValueChange={(val) =>
                            updateServiceCard(card.id, 'color', val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blue">Azul</SelectItem>
                            <SelectItem value="green">Verde</SelectItem>
                            <SelectItem value="orange">Laranja</SelectItem>
                            <SelectItem value="purple">Roxo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-8">
                        <Switch
                          checked={card.active}
                          onCheckedChange={(checked) =>
                            updateServiceCard(card.id, 'active', checked)
                          }
                        />
                        <Label>Ativo</Label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeServiceCard(card.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={saveServiceCards}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Cartões
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Quick Links Tab */}
        <TabsContent value="links" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Links Rápidos</CardTitle>
                <CardDescription>
                  Gerencie os links do rodapé e menus.
                </CardDescription>
              </div>
              <Button onClick={addQuickLink} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Link
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {quickLinks.map((link, index) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-4 p-3 border rounded-lg bg-card"
                  >
                    <div className="flex-1 grid gap-4 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Rótulo</Label>
                        <Input
                          value={link.label}
                          onChange={(e) =>
                            updateQuickLink(link.id, 'label', e.target.value)
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">URL</Label>
                        <Input
                          value={link.url}
                          onChange={(e) =>
                            updateQuickLink(link.id, 'url', e.target.value)
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-5">
                        <Switch
                          checked={link.active}
                          onCheckedChange={(checked) =>
                            updateQuickLink(link.id, 'active', checked)
                          }
                        />
                        <Label className="text-sm">Visível</Label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeQuickLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={saveQuickLinks}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Links
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
