import { useState, useRef } from 'react'
import {
  Save,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileJson,
  Database,
  History,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

// List of all localStorage keys used by the application stores
const STORAGE_KEYS = [
  'edu_users',
  'edu_schools',
  'edu_students',
  'edu_teachers',
  'edu_projects',
  'edu_courses',
  'edu_eval_rules',
  'edu_assessments',
  'edu_assessment_types',
  'edu_settings',
  'edu_attendance',
  'edu_news',
  'edu_documents',
  'edu_content',
  'edu_occurrences',
  'edu_lesson_plans',
  'edu_alerts',
  'edu_alert_rules',
]

interface BackupData {
  metadata: {
    version: string
    timestamp: string
    system: string
    stats: {
      keys: number
      size: number
    }
  }
  data: Record<string, any>
}

export default function BackupRestore() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isBackupLoading, setIsBackupLoading] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [lastBackupDate, setLastBackupDate] = useState<Date | null>(null)

  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoreData, setRestoreData] = useState<BackupData | null>(null)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  // --- Backup Logic ---

  const handleCreateBackup = () => {
    setIsBackupLoading(true)
    setBackupProgress(0)

    // Simulate progress for better UX
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    setTimeout(() => {
      try {
        const data: Record<string, any> = {}
        let totalSize = 0

        STORAGE_KEYS.forEach((key) => {
          const item = localStorage.getItem(key)
          if (item) {
            try {
              data[key] = JSON.parse(item)
              totalSize += item.length
            } catch (e) {
              console.error(`Error parsing key ${key}`, e)
              data[key] = null
            }
          }
        })

        const backup: BackupData = {
          metadata: {
            version: '1.0',
            timestamp: new Date().toISOString(),
            system: 'EduGestao',
            stats: {
              keys: Object.keys(data).length,
              size: totalSize,
            },
          },
          data,
        }

        const blob = new Blob([JSON.stringify(backup, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `backup_edugestao_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setBackupProgress(100)
        setLastBackupDate(new Date())
        toast({
          title: 'Backup Concluído',
          description: 'O arquivo foi gerado e o download iniciado.',
        })
      } catch (error) {
        console.error(error)
        toast({
          variant: 'destructive',
          title: 'Erro no Backup',
          description: 'Não foi possível gerar o arquivo de backup.',
        })
      } finally {
        clearInterval(interval)
        setIsBackupLoading(false)
      }
    }, 1500)
  }

  // --- Restore Logic ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        toast({
          variant: 'destructive',
          title: 'Arquivo Inválido',
          description: 'Por favor, selecione um arquivo JSON válido.',
        })
        return
      }
      setRestoreFile(file)
      // Reset input value to allow re-selecting same file if needed
      e.target.value = ''
    }
  }

  const handlePreRestore = async () => {
    if (!restoreFile) return

    const text = await restoreFile.text()
    try {
      const parsed = JSON.parse(text) as BackupData

      // Basic Validation
      if (
        !parsed.metadata ||
        parsed.metadata.system !== 'EduGestao' ||
        !parsed.data
      ) {
        throw new Error('Formato de arquivo inválido ou incompatível.')
      }

      setRestoreData(parsed)
      setIsRestoreDialogOpen(true)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na Leitura',
        description:
          'O arquivo está corrompido ou não é um backup válido do EduGestão.',
      })
    }
  }

  const executeRestore = () => {
    if (!restoreData) return

    setIsRestoring(true)
    setIsRestoreDialogOpen(false) // Close dialog, show loading state in UI

    setTimeout(() => {
      try {
        // Clear existing data first to avoid conflicts/merging issues
        STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))

        // Restore data
        Object.entries(restoreData.data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            localStorage.setItem(key, JSON.stringify(value))
          }
        })

        toast({
          title: 'Restauração Concluída',
          description: 'O sistema será recarregado para aplicar as alterações.',
        })

        // Delay reload slightly to let toast show
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } catch (error) {
        setIsRestoring(false)
        toast({
          variant: 'destructive',
          title: 'Falha na Restauração',
          description:
            'Ocorreu um erro crítico ao aplicar os dados. Verifique o console.',
        })
        console.error(error)
      }
    }, 1000)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Database className="h-8 w-8" />
          Backup e Restauração
        </h2>
        <p className="text-muted-foreground">
          Gerencie a segurança dos dados do sistema. Exporte cópias de segurança
          ou restaure o sistema a partir de um arquivo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Backup Section */}
        <Card className="border-t-4 border-t-blue-500 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Download className="h-5 w-5" />
              Exportar Dados (Backup)
            </CardTitle>
            <CardDescription>
              Gera um arquivo contendo todos os dados atuais do sistema,
              incluindo configurações, alunos, notas e conteúdo do site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Segurança dos Dados</p>
                <p>
                  Recomendamos realizar backups periodicamente e antes de
                  grandes alterações no sistema.
                </p>
              </div>
            </div>

            {isBackupLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Gerando arquivo...</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} />
              </div>
            )}

            {lastBackupDate && !isBackupLoading && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded justify-center">
                <CheckCircle className="h-4 w-4" />
                Backup gerado com sucesso em{' '}
                {format(lastBackupDate, 'HH:mm:ss')}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateBackup}
              disabled={isBackupLoading}
            >
              {isBackupLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Gerar Backup Agora
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Restore Section */}
        <Card className="border-t-4 border-t-orange-500 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Upload className="h-5 w-5" />
              Importar Dados (Restaurar)
            </CardTitle>
            <CardDescription>
              Recupere o sistema a partir de um arquivo de backup previamente
              gerado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert
              variant="destructive"
              className="bg-orange-50 border-orange-200 text-orange-800"
            >
              <AlertTriangle className="h-4 w-4 text-orange-800" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                A restauração irá{' '}
                <strong>substituir todos os dados atuais</strong> pelos dados do
                arquivo. Esta ação é irreversível.
              </AlertDescription>
            </Alert>

            <div
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[120px] transition-colors ${
                restoreFile
                  ? 'bg-green-50 border-green-300'
                  : 'bg-muted/30 hover:bg-muted/50 border-muted-foreground/30'
              }`}
            >
              {restoreFile ? (
                <div className="text-center space-y-2">
                  <div className="mx-auto h-10 w-10 text-green-600 flex items-center justify-center bg-white rounded-full shadow-sm">
                    <FileJson className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium text-green-800 break-all">
                    {restoreFile.name}
                  </div>
                  <div className="text-xs text-green-600">
                    {(restoreFile.size / 1024).toFixed(2)} KB
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 mt-2"
                    onClick={() => setRestoreFile(null)}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="mx-auto h-10 w-10 text-muted-foreground/50">
                    <Upload className="h-full w-full" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span
                      className="font-semibold text-primary cursor-pointer hover:underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Selecione o arquivo
                    </span>{' '}
                    (.json)
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant="secondary"
              onClick={handlePreRestore}
              disabled={!restoreFile || isRestoring}
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando Sistema...
                </>
              ) : (
                <>
                  <History className="mr-2 h-4 w-4" />
                  Iniciar Restauração
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={isRestoreDialogOpen}
        onOpenChange={setIsRestoreDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Restauração</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a restaurar um backup de{' '}
              <strong>
                {restoreData &&
                  format(
                    new Date(restoreData.metadata.timestamp),
                    'dd/MM/yyyy HH:mm',
                  )}
              </strong>
              .
              <br />
              <br />
              <span className="font-bold text-red-600">
                Isso apagará TODOS os dados atuais do sistema.
              </span>{' '}
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {restoreData && (
            <div className="bg-muted p-3 rounded-md text-xs font-mono mb-4">
              <p>Versão: {restoreData.metadata.version}</p>
              <p>Registros: {restoreData.metadata.stats.keys}</p>
              <p>
                Tamanho: {(restoreData.metadata.stats.size / 1024).toFixed(2)}{' '}
                KB
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoreFile(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeRestore}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, Restaurar Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isRestoring && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary" />
          <h3 className="text-xl font-bold">Restaurando dados...</h3>
          <p className="text-muted-foreground">
            Por favor, não feche esta página. O sistema será reiniciado em
            breve.
          </p>
        </div>
      )}
    </div>
  )
}
