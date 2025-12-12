import { useState } from 'react'
import { Save, Info, Building } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'

export default function WebsiteContent() {
  const { getContent, updateInstitutionalContent } = usePublicContentStore()
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Gestão de Conteúdo Institucional
        </h2>
        <p className="text-muted-foreground">
          Edite os textos exibidos nas seções principais do site público.
        </p>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <Info className="h-4 w-4" /> Informações da SEMED
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-2">
            <Building className="h-4 w-4" /> Estrutura Organizacional
          </TabsTrigger>
        </TabsList>

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
                <p className="text-xs text-muted-foreground">
                  Dica: Você pode usar tags HTML básicas para formatação (p,
                  strong, ul, li).
                </p>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveInfo}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
      </Tabs>
    </div>
  )
}
