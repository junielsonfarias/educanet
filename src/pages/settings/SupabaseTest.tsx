import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, Database, Info } from 'lucide-react'
import { checkConnection, isSupabaseConfigured } from '@/lib/supabase/helpers'
import { supabase } from '@/lib/supabase/client'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'running'
  message?: string
  details?: any
  timestamp?: string
}

export default function SupabaseTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Verificar Configuração', status: 'pending' },
    { name: 'Testar Conexão', status: 'pending' },
    { name: 'Verificar Cliente', status: 'pending' },
  ])

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, ...updates } : test)),
    )
  }

  const runTests = async () => {
    setIsLoading(true)

    try {
      // Teste 1: Verificar configuração
      updateTest(0, { status: 'running' })
      const isConfigured = isSupabaseConfigured()
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (isConfigured) {
        updateTest(0, {
          status: 'success',
          message: 'Variáveis de ambiente configuradas corretamente',
          timestamp: new Date().toISOString(),
          details: {
            url: import.meta.env.VITE_SUPABASE_URL,
            hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        })
      } else {
        updateTest(0, {
          status: 'error',
          message: 'Variáveis de ambiente não configuradas',
          timestamp: new Date().toISOString(),
        })
        setIsLoading(false)
        return
      }

      // Teste 2: Testar conexão
      updateTest(1, { status: 'running' })
      const connectionResult = await checkConnection()
      await new Promise((resolve) => setTimeout(resolve, 500))

      updateTest(1, {
        status: connectionResult.success ? 'success' : 'error',
        message: connectionResult.message,
        details: connectionResult.details,
        timestamp: new Date().toISOString(),
      })

      // Teste 3: Verificar cliente
      updateTest(2, { status: 'running' })
      await new Promise((resolve) => setTimeout(resolve, 500))

      try {
        const clientStatus = {
          initialized: !!supabase,
          authConfigured: !!supabase.auth,
          storageConfigured: !!supabase.storage,
        }

        updateTest(2, {
          status: 'success',
          message: 'Cliente Supabase inicializado corretamente',
          details: clientStatus,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        updateTest(2, {
          status: 'error',
          message: 'Erro ao verificar cliente Supabase',
          details: error,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('Erro ao executar testes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary">Executando...</Badge>
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600">Sucesso</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  const allTestsSuccess = tests.every((t) => t.status === 'success')
  const anyTestError = tests.some((t) => t.status === 'error')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Teste de Conexão Supabase
          </h1>
          <p className="text-muted-foreground mt-2">
            Verifique se o Supabase está configurado e funcionando corretamente
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Informação</AlertTitle>
        <AlertDescription>
          Esta página executa testes de conexão com o Supabase. Use-a para validar a
          configuração antes de prosseguir com a integração.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Executar Testes</CardTitle>
          <CardDescription>
            Clique no botão abaixo para executar todos os testes de conexão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runTests}
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executando Testes...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Executar Testes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados dos Testes</CardTitle>
          <CardDescription>Status de cada teste executado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tests.map((test, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.name}</span>
                </div>
                {getStatusBadge(test.status)}
              </div>

              {test.message && (
                <p className="text-sm text-muted-foreground ml-7">{test.message}</p>
              )}

              {test.timestamp && (
                <p className="text-xs text-muted-foreground ml-7">
                  Executado em: {new Date(test.timestamp).toLocaleString('pt-BR')}
                </p>
              )}

              {test.details && (
                <details className="ml-7 mt-2">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    Ver detalhes
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {allTestsSuccess && !isLoading && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Todos os testes passaram!</AlertTitle>
          <AlertDescription className="text-green-600">
            O Supabase está configurado e funcionando corretamente. Você pode prosseguir
            com a integração.
          </AlertDescription>
        </Alert>
      )}

      {anyTestError && !isLoading && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Alguns testes falharam</AlertTitle>
          <AlertDescription>
            Verifique os detalhes dos erros acima e corrija as configurações antes de
            prosseguir.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

