import { useState, useRef, useEffect } from 'react'
import {
  Save,
  Upload,
  Building,
  FileText,
  Settings as SettingsIcon,
  Facebook,
  Instagram,
  Type,
  BarChart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettingsStore } from '@/stores/useSettingsStore.supabase'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { availableMunicipalities } from '@/services/qedu-service'

// Interface para o formulário de configurações
interface SettingsFormData {
  municipalityName: string
  educationSecretaryName: string
  municipalityLogo: string
  secretaryLogo: string
  facebookHandle: string
  instagramHandle: string
  footerText: string
  qeduMunicipalityId: string
  defaultRecoveryStrategy: string
}

const defaultFormData: SettingsFormData = {
  municipalityName: '',
  educationSecretaryName: '',
  municipalityLogo: '',
  secretaryLogo: '',
  facebookHandle: '',
  instagramHandle: '',
  footerText: '',
  qeduMunicipalityId: '',
  defaultRecoveryStrategy: 'replace_if_higher',
}

export default function GeneralSettings() {
  const { settings, fetchSettings, loading } = useSettingsStore()

  const [formData, setFormData] = useState<SettingsFormData>(defaultFormData)
  const [saving, setSaving] = useState(false)
  const municipalityLogoInputRef = useRef<HTMLInputElement>(null)
  const secretaryLogoInputRef = useRef<HTMLInputElement>(null)

  // Carregar configurações ao montar o componente
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Atualizar formData quando settings mudar
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData({
        municipalityName: (settings.municipalityName as string) || '',
        educationSecretaryName: (settings.educationSecretaryName as string) || '',
        municipalityLogo: (settings.municipalityLogo as string) || '',
        secretaryLogo: (settings.secretaryLogo as string) || '',
        facebookHandle: (settings.facebookHandle as string) || '',
        instagramHandle: (settings.instagramHandle as string) || '',
        footerText: (settings.footerText as string) || '',
        qeduMunicipalityId: (settings.qeduMunicipalityId as string) || '',
        defaultRecoveryStrategy: (settings.defaultRecoveryStrategy as string) || 'replace_if_higher',
      })
    }
  }, [settings])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'municipalityLogo' | 'secretaryLogo',
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Fazer upload para Supabase Storage (validações são feitas dentro da função)
        const { uploadFile } = await import('@/lib/supabase/storage')
        
        const filePath = `logos/${field}/${Date.now()}-${file.name}`
        const uploadResult = await uploadFile({
          bucket: 'photos', // Usar bucket 'photos' que é público
          file,
          path: filePath,
          upsert: true, // Substituir se já existir
        })

        if (!uploadResult.success || !uploadResult.publicUrl) {
          throw new Error(uploadResult.error || 'Erro ao fazer upload da imagem')
        }

        // Atualizar formData com a URL pública
        setFormData((prev) => ({ ...prev, [field]: uploadResult.publicUrl }))
        
        toast.success('Arquivo carregado', {
          description: 'A imagem foi enviada com sucesso. Salve para confirmar.',
        })
      } catch (error) {
        toast.error('Erro no carregamento', {
          description: error instanceof Error ? error.message : 'Não foi possível processar a imagem.',
        })
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Salvar no Supabase usando settingsService
      const { settingsService } = await import('@/lib/supabase/services')

      // Preparar dados para salvar (remover valores vazios como null)
      const dataToSave: Record<string, string | null> = {
        municipalityName: formData.municipalityName || null,
        educationSecretaryName: formData.educationSecretaryName || null,
        municipalityLogo: formData.municipalityLogo || null,
        secretaryLogo: formData.secretaryLogo || null,
        facebookHandle: formData.facebookHandle || null,
        instagramHandle: formData.instagramHandle || null,
        footerText: formData.footerText || null,
        qeduMunicipalityId: formData.qeduMunicipalityId || null,
        defaultRecoveryStrategy: formData.defaultRecoveryStrategy || null,
      }

      // Salvar cada campo de configuração no Supabase
      await settingsService.setMultiple(dataToSave, 'general')

      // Recarregar configurações do servidor
      await fetchSettings()

      toast.success('Configurações salvas', {
        description: 'As alterações foram aplicadas ao sistema.',
      })
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar', {
        description: 'Não foi possível salvar as configurações. Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Configurações Gerais
        </h2>
        <p className="text-muted-foreground">
          Gerencie as informações institucionais, identidade visual e regras
          globais.
        </p>
      </div>

      <Tabs defaultValue="institution" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="institution">Instituição & Visual</TabsTrigger>
          <TabsTrigger value="recovery">Políticas de Recuperação</TabsTrigger>
          <TabsTrigger value="qedu" className="gap-2">
            <BarChart className="h-4 w-4" /> Integração QEdu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institution" className="space-y-6 mt-4">
          <div className="grid gap-6">
            <Card className="relative overflow-hidden bg-gradient-to-br from-white via-primary/5 to-white border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  Dados da Instituição
                </CardTitle>
                <CardDescription>
                  Estas informações aparecerão em todos os documentos oficiais
                  gerados e no cabeçalho do site institucional.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="municipalityName">Nome do Município</Label>
                    <Input
                      id="municipalityName"
                      value={formData.municipalityName}
                      onChange={handleChange}
                      placeholder="Ex: Prefeitura Municipal de Exemplo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="educationSecretaryName">
                      Nome da Secretaria Municipal de Educação
                      <span className="text-primary ml-1">*</span>
                    </Label>
                    <Input
                      id="educationSecretaryName"
                      value={formData.educationSecretaryName}
                      onChange={handleChange}
                      placeholder="Ex: Secretaria Municipal de Educação"
                      className="font-semibold"
                    />
                    <p className="text-xs text-muted-foreground">
                      Este nome aparecerá no cabeçalho do site institucional junto com "SEMED"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Identidade Visual do Cabeçalho
                </CardTitle>
                <CardDescription>
                  Configure os logotipos que aparecem no cabeçalho do site institucional e textos de rodapé.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-sm mb-2">Estrutura do Cabeçalho:</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Primeira linha:</strong> Logo do Município (esquerda) | Nome da Secretaria + SEMED (centro) | Logo da Secretaria (direita)</p>
                    <p><strong>Segunda linha:</strong> Menu de navegação</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Municipality Logo */}
                  <div className="space-y-4">
                    <Label>
                      Logo do Município (Logo 1)
                      <span className="text-primary ml-1">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground -mt-2">
                      Aparece no lado esquerdo do cabeçalho
                    </p>
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] bg-muted/30">
                      {formData.municipalityLogo ? (
                        <div className="relative group w-full h-full flex items-center justify-center">
                          <img
                            src={formData.municipalityLogo}
                            alt="Logo Município"
                            className="max-h-[160px] max-w-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                municipalityLogoInputRef.current?.click()
                              }
                            >
                              Alterar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <div className="mx-auto h-12 w-12 text-muted-foreground/50">
                            <Upload className="h-full w-full" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span
                              className="font-semibold text-primary cursor-pointer hover:underline"
                              onClick={() =>
                                municipalityLogoInputRef.current?.click()
                              }
                            >
                              Clique para enviar
                            </span>{' '}
                            ou arraste
                          </div>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG (Max. 5MB)
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={municipalityLogoInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(e, 'municipalityLogo')
                        }
                      />
                    </div>
                  </div>

                  {/* Secretary Logo */}
                  <div className="space-y-4">
                    <Label>
                      Logo da Secretaria (Logo 2)
                      <span className="text-primary ml-1">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground -mt-2">
                      Aparece no lado direito do cabeçalho
                    </p>
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] bg-muted/30">
                      {formData.secretaryLogo ? (
                        <div className="relative group w-full h-full flex items-center justify-center">
                          <img
                            src={formData.secretaryLogo}
                            alt="Logo Secretaria"
                            className="max-h-[160px] max-w-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                secretaryLogoInputRef.current?.click()
                              }
                            >
                              Alterar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <div className="mx-auto h-12 w-12 text-muted-foreground/50">
                            <Upload className="h-full w-full" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span
                              className="font-semibold text-primary cursor-pointer hover:underline"
                              onClick={() =>
                                secretaryLogoInputRef.current?.click()
                              }
                            >
                              Clique para enviar
                            </span>{' '}
                            ou arraste
                          </div>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG (Max. 5MB)
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={secretaryLogoInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'secretaryLogo')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="footerText"
                    className="flex items-center gap-2"
                  >
                    <Type className="h-4 w-4" /> Texto do Rodapé
                  </Label>
                  <Textarea
                    id="footerText"
                    value={formData.footerText}
                    onChange={handleChange}
                    placeholder="© 2025 Prefeitura Municipal... Todos os direitos reservados."
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este texto será exibido no rodapé de todas as páginas do
                    site público.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-primary" />
                  Redes Sociais
                </CardTitle>
                <CardDescription>
                  Configuração de integração com redes sociais.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebookHandle">Facebook Page Handle</Label>
                    <div className="relative">
                      <Facebook className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="facebookHandle"
                        value={formData.facebookHandle}
                        onChange={handleChange}
                        placeholder="@semed_oficial"
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O identificador da página do Facebook (ex: @semedssbvpa)
                      para exibir no portal.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagramHandle">Instagram Handle</Label>
                    <div className="relative">
                      <Instagram className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="instagramHandle"
                        value={formData.instagramHandle}
                        onChange={handleChange}
                        placeholder="@semed_oficial"
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O identificador do perfil do Instagram (ex: @semedssbvpa)
                      para exibir no portal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Configurações Globais de Recuperação
              </CardTitle>
              <CardDescription>
                Defina o comportamento padrão para o cálculo de notas de
                recuperação na rede de ensino.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="defaultRecoveryStrategy">
                    Estratégia Padrão de Recuperação
                  </Label>
                  <Select
                    value={formData.defaultRecoveryStrategy}
                    onValueChange={(value) =>
                      handleSelectChange('defaultRecoveryStrategy', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a estratégia padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="replace_if_higher">
                        Substituir se for maior (Padrão)
                      </SelectItem>
                      <SelectItem value="always_replace">
                        Sempre substituir a nota original
                      </SelectItem>
                      <SelectItem value="average">
                        Média entre nota original e recuperação
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta regra será aplicada automaticamente se nenhuma regra
                    específica for definida no nível da série ou disciplina.
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-md border text-sm">
                <h4 className="font-semibold mb-2">Resumo das Estratégias:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>
                    <strong>Substituir se for maior:</strong> A nota final será
                    a maior entre a nota original e a nota de recuperação.
                  </li>
                  <li>
                    <strong>Sempre substituir:</strong> A nota de recuperação
                    será a nota final, independente se for maior ou menor que a
                    original.
                  </li>
                  <li>
                    <strong>Média:</strong> A nota final será a média aritmética
                    entre a nota original e a nota de recuperação.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qedu" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Dados do QEdu
              </CardTitle>
              <CardDescription>
                Selecione o município para integrar dados de relatórios
                educacionais oficiais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="qeduMunicipalityId">Município</Label>
                  <Select
                    value={formData.qeduMunicipalityId}
                    onValueChange={(value) =>
                      handleSelectChange('qeduMunicipalityId', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o município" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMunicipalities.map((municipality) => (
                        <SelectItem
                          key={municipality.id}
                          value={municipality.id}
                        >
                          {municipality.name} - {municipality.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta seleção determinará a fonte de dados para os relatórios
                    de Distorção Idade-Série e Taxas de Rendimento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving || loading}>
          <Save className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}
