/**
 * FileUpload - Componente reutilizavel para upload de arquivos
 *
 * Suporta:
 * - Drag and drop
 * - Selecao de arquivo via clique
 * - Validacao de tipo e tamanho
 * - Preview de imagens
 * - Progresso de upload
 */

import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Progress } from './progress'
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  uploadFile,
  deleteFile,
  validateFileType,
  validateFileSize,
  type BucketName,
  type UploadResult,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
} from '@/lib/supabase/storage'

export interface FileUploadProps {
  bucket: BucketName
  onUploadComplete?: (result: UploadResult) => void
  onUploadError?: (error: string) => void
  onFileRemoved?: (path: string) => void
  accept?: string
  maxFiles?: number
  disabled?: boolean
  className?: string
  label?: string
  description?: string
  showPreview?: boolean
  existingFiles?: Array<{ path: string; publicUrl: string; name?: string }>
}

interface FileWithPreview {
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  result?: UploadResult
  error?: string
}

export function FileUpload({
  bucket,
  onUploadComplete,
  onUploadError,
  onFileRemoved,
  accept,
  maxFiles = 1,
  disabled = false,
  className,
  label = 'Arraste arquivos aqui ou clique para selecionar',
  description,
  showPreview = true,
  existingFiles = [],
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tipos aceitos baseado no bucket
  const acceptedTypes = accept || ALLOWED_FILE_TYPES[bucket].join(',')
  const maxSize = MAX_FILE_SIZES[bucket]
  const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)

  // Handler para arquivos selecionados
  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const newFiles: FileWithPreview[] = []

      for (const file of Array.from(fileList)) {
        // Verifica limite de arquivos
        if (files.length + newFiles.length >= maxFiles) {
          onUploadError?.(`Limite de ${maxFiles} arquivo(s) atingido`)
          break
        }

        // Valida tipo
        const typeValidation = validateFileType(file, bucket)
        if (!typeValidation.valid) {
          onUploadError?.(typeValidation.error || 'Tipo de arquivo invalido')
          continue
        }

        // Valida tamanho
        const sizeValidation = validateFileSize(file, bucket)
        if (!sizeValidation.valid) {
          onUploadError?.(sizeValidation.error || 'Arquivo muito grande')
          continue
        }

        // Cria preview para imagens
        let preview: string | undefined
        if (file.type.startsWith('image/') && showPreview) {
          preview = URL.createObjectURL(file)
        }

        newFiles.push({
          file,
          preview,
          status: 'pending',
          progress: 0,
        })
      }

      if (newFiles.length === 0) return

      setFiles((prev) => [...prev, ...newFiles])

      // Faz upload de cada arquivo
      for (let i = 0; i < newFiles.length; i++) {
        const fileWithPreview = newFiles[i]

        // Atualiza status para uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileWithPreview.file
              ? { ...f, status: 'uploading' as const, progress: 10 }
              : f
          )
        )

        // Simula progresso
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileWithPreview.file && f.status === 'uploading'
                ? { ...f, progress: Math.min(f.progress + 10, 90) }
                : f
            )
          )
        }, 200)

        // Faz upload
        const result = await uploadFile({
          bucket,
          file: fileWithPreview.file,
          upsert: false,
        })

        clearInterval(progressInterval)

        // Atualiza status com resultado
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileWithPreview.file
              ? {
                  ...f,
                  status: result.success ? ('success' as const) : ('error' as const),
                  progress: 100,
                  result: result.success ? result : undefined,
                  error: result.error,
                }
              : f
          )
        )

        if (result.success) {
          onUploadComplete?.(result)
        } else {
          onUploadError?.(result.error || 'Erro ao fazer upload')
        }
      }
    },
    [bucket, files.length, maxFiles, onUploadComplete, onUploadError, showPreview]
  )

  // Handlers de drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles)
      }
    },
    [disabled, handleFiles]
  )

  // Handler de clique
  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }, [disabled])

  // Handler de change do input
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files
      if (selectedFiles && selectedFiles.length > 0) {
        handleFiles(selectedFiles)
      }
      // Reset input para permitir selecionar o mesmo arquivo novamente
      e.target.value = ''
    },
    [handleFiles]
  )

  // Remover arquivo
  const handleRemove = useCallback(
    async (fileWithPreview: FileWithPreview) => {
      // Revoga URL do preview
      if (fileWithPreview.preview) {
        URL.revokeObjectURL(fileWithPreview.preview)
      }

      // Se foi feito upload, deleta do storage
      if (fileWithPreview.result?.path) {
        await deleteFile(bucket, fileWithPreview.result.path)
        onFileRemoved?.(fileWithPreview.result.path)
      }

      setFiles((prev) => prev.filter((f) => f.file !== fileWithPreview.file))
    },
    [bucket, onFileRemoved]
  )

  // Remover arquivo existente
  const handleRemoveExisting = useCallback(
    async (path: string) => {
      await deleteFile(bucket, path)
      onFileRemoved?.(path)
    },
    [bucket, onFileRemoved]
  )

  // Icone do arquivo baseado no tipo
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />
    }
    if (file.type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />
    }
    if (file.type.includes('word') || file.type.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-700" />
    }
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      return <FileText className="h-8 w-8 text-green-600" />
    }
    return <File className="h-8 w-8 text-gray-500" />
  }

  const canAddMore = files.length + existingFiles.length < maxFiles

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zona de Drop */}
      {canAddMore && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes}
            multiple={maxFiles > 1}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
          />

          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Upload
              className={cn(
                'h-10 w-10',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <p className="text-sm font-medium">{label}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Tamanho maximo: {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}

      {/* Arquivos existentes */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Arquivos existentes
          </p>
          {existingFiles.map((file) => (
            <div
              key={file.path}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
            >
              {file.publicUrl && file.publicUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={file.publicUrl}
                  alt={file.name || 'Arquivo'}
                  className="h-12 w-12 object-cover rounded"
                />
              ) : (
                <FileText className="h-8 w-8 text-gray-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {file.name || file.path.split('/').pop()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveExisting(file.path)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Lista de arquivos em upload */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileWithPreview, index) => (
            <div
              key={`${fileWithPreview.file.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg border"
            >
              {/* Preview ou icone */}
              {fileWithPreview.preview ? (
                <img
                  src={fileWithPreview.preview}
                  alt={fileWithPreview.file.name}
                  className="h-12 w-12 object-cover rounded"
                />
              ) : (
                getFileIcon(fileWithPreview.file)
              )}

              {/* Info do arquivo */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {fileWithPreview.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(fileWithPreview.file.size / 1024).toFixed(1)} KB
                </p>

                {/* Progresso */}
                {fileWithPreview.status === 'uploading' && (
                  <Progress value={fileWithPreview.progress} className="h-1 mt-1" />
                )}

                {/* Erro */}
                {fileWithPreview.status === 'error' && fileWithPreview.error && (
                  <p className="text-xs text-destructive mt-1">{fileWithPreview.error}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {fileWithPreview.status === 'uploading' && (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                {fileWithPreview.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {fileWithPreview.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}

                {/* Botao remover */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(fileWithPreview)}
                  disabled={fileWithPreview.status === 'uploading'}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload
