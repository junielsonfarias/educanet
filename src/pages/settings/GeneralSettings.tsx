import { useState, useRef } from 'react'
import { Save, Upload, Building, FileText } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import useSettingsStore from '@/stores/useSettingsStore'
import { useToast } from '@/hooks/use-toast'
import { fileToBase64 } from '@/lib/file-utils'

export default function GeneralSettings() {
  const { settings, updateSettings } = useSettingsStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState(settings)
  const municipalityLogoInputRef = useRef<HTMLInputElement>(null)
  const secretaryLogoInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'municipalityLogo' | 'secretaryLogo',
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const base64 = await fileToBase64(file)
        setFormData((prev) => ({ ...prev, [field]: base64 }))
        toast({
          title: 'Arquivo carregado',
          description: `A imagem foi processada. Salve para confirmar.`,
        })
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro no carregamento',
          description: 'Não foi possível processar a imagem.',
        })
      }
    }
  }

  const handleSave = () => {
    updateSettings(formData)
    toast({
      title: 'Configurações salvas',
      description: 'As alterações foram aplicadas ao sistema.',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          Configurações Gerais
        </h2>
        <p className="text-muted-foreground">
          Gerencie as informações institucionais e identidade visual.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Dados da Instituição
            </CardTitle>
            <CardDescription>
              Estas informações aparecerão em todos os documentos oficiais
              gerados.
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
                  Nome da Secretaria de Educação
                </Label>
                <Input
                  id="educationSecretaryName"
                  value={formData.educationSecretaryName}
                  onChange={handleChange}
                  placeholder="Ex: Secretaria Municipal de Educação"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Identidade Visual
            </CardTitle>
            <CardDescription>
              Logotipos para cabeçalhos de documentos e relatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Municipality Logo */}
              <div className="space-y-4">
                <Label>Logo do Município</Label>
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
                        PNG, JPG (Max. 2MB)
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={municipalityLogoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'municipalityLogo')}
                  />
                </div>
              </div>

              {/* Secretary Logo */}
              <div className="space-y-4">
                <Label>Logo da Secretaria</Label>
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
                          onClick={() => secretaryLogoInputRef.current?.click()}
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
                          onClick={() => secretaryLogoInputRef.current?.click()}
                        >
                          Clique para enviar
                        </span>{' '}
                        ou arraste
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG (Max. 2MB)
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
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  )
}
