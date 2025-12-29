import { useState, useRef } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import useAttachmentStore from '@/stores/useAttachmentStore'
import { AttachmentEntityType, AttachmentCategory } from '@/lib/mock-data'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AttachmentUploadProps {
  entityType: AttachmentEntityType
  entityId: string
  category?: AttachmentCategory
  onUploadComplete?: (attachmentId: string) => void
  maxSize?: number // em MB
  acceptedTypes?: string[]
  multiple?: boolean
}

export function AttachmentUpload({
  entityType,
  entityId,
  category = 'other',
  onUploadComplete,
  maxSize = 10, // 10MB padrão
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  multiple = false,
}: AttachmentUploadProps) {
  const { uploadFile } = useAttachmentStore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<AttachmentCategory>(category)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validar tamanho
    const invalidFiles = files.filter(
      (file) => file.size > maxSize * 1024 * 1024,
    )
    
    if (invalidFiles.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: `Alguns arquivos excedem o tamanho máximo de ${maxSize}MB.`,
      })
      return
    }

    if (multiple) {
      setSelectedFiles((prev) => [...prev, ...files])
    } else {
      setSelectedFiles(files)
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum arquivo selecionado',
        description: 'Selecione pelo menos um arquivo para fazer upload.',
      })
      return
    }

    setUploading(true)

    try {
      const uploadPromises = selectedFiles.map((file) =>
        uploadFile(file, entityType, entityId, selectedCategory, 'system'),
      )

      const uploaded = await Promise.all(uploadPromises)

      // Adicionar descrição se fornecida
      if (description) {
        uploaded.forEach((attachment) => {
          // Em produção, atualizar descrição via store
        })
      }

      toast({
        title: 'Upload concluído',
        description: `${uploaded.length} arquivo(s) enviado(s) com sucesso.`,
      })

      if (onUploadComplete && uploaded.length > 0) {
        onUploadComplete(uploaded[0].id)
      }

      // Limpar
      setSelectedFiles([])
      setDescription('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Ocorreu um erro ao fazer upload dos arquivos.',
      })
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getCategoryLabel = (cat: AttachmentCategory): string => {
    const labels: Record<AttachmentCategory, string> = {
      identity: 'Identidade',
      academic: 'Acadêmico',
      medical: 'Médico',
      legal: 'Legal',
      financial: 'Financeiro',
      administrative: 'Administrativo',
      other: 'Outro',
    }
    return labels[cat] || cat
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as AttachmentCategory)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="identity">Identidade</SelectItem>
            <SelectItem value="academic">Acadêmico</SelectItem>
            <SelectItem value="medical">Médico</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="financial">Financeiro</SelectItem>
            <SelectItem value="administrative">Administrativo</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Textarea
          placeholder="Descreva o documento..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Arquivo(s)</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={acceptedTypes.join(',')}
            multiple={multiple}
            className="hidden"
            id="file-upload"
          />
          <Label
            htmlFor="file-upload"
            className="flex-1 cursor-pointer border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors"
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Clique para selecionar ou arraste arquivos aqui
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tamanho máximo: {maxSize}MB
                </p>
              </div>
            </div>
          </Label>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Arquivos Selecionados</Label>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Enviar Arquivo(s)
          </>
        )}
      </Button>
    </div>
  )
}

