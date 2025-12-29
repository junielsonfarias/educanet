import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, CheckCircle, Clock, AlertCircle, Search } from 'lucide-react'
import { EnrollmentForm } from './components/EnrollmentForm'
import { EnrollmentStatus } from './components/EnrollmentStatus'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function OnlineEnrollment() {
  const [activeTab, setActiveTab] = useState('new')
  const [searchProtocol, setSearchProtocol] = useState('')
  const [searchedProtocol, setSearchedProtocol] = useState<string | null>(null)

  const handleSearch = () => {
    if (searchProtocol.trim()) {
      setSearchedProtocol(searchProtocol.trim())
      setActiveTab('status')
    }
  }

  const handleEnrollmentSuccess = (protocol: string) => {
    setSearchedProtocol(protocol)
    setActiveTab('status')
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4 flex items-center justify-center gap-3">
          <FileText className="h-10 w-10" />
          Matrícula Online
        </h1>
        <p className="text-xl text-muted-foreground">
          Realize a matrícula do seu filho de forma rápida e prática pela internet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portal de Matrícula</CardTitle>
          <CardDescription>
            Preencha o formulário abaixo para solicitar a matrícula do aluno na rede municipal de ensino.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Nova Matrícula
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Consultar Status
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-6 mt-6">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Informações Importantes
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li>O processo de matrícula será analisado pela equipe pedagógica</li>
                      <li>Você receberá um protocolo para acompanhar o status da solicitação</li>
                      <li>Documentos podem ser solicitados durante a análise</li>
                      <li>O prazo de análise é de até 5 dias úteis</li>
                    </ul>
                  </div>
                </div>
              </div>

              <EnrollmentForm onSuccess={handleEnrollmentSuccess} />
            </TabsContent>

            <TabsContent value="status" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o número do protocolo"
                    value={searchProtocol}
                    onChange={(e) => setSearchProtocol(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Consultar
                  </Button>
                </div>

                {searchedProtocol ? (
                  <EnrollmentStatus protocol={searchedProtocol} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Digite o número do protocolo para consultar o status da matrícula.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-green-100 dark:bg-green-900/20 p-3 rounded-full mb-3 w-12 h-12 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-lg">Rápido e Prático</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Preencha o formulário online e aguarde a análise da equipe pedagógica.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full mb-3 w-12 h-12 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-lg">Acompanhamento</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Consulte o status da sua solicitação a qualquer momento usando o protocolo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-purple-100 dark:bg-purple-900/20 p-3 rounded-full mb-3 w-12 h-12 flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-lg">Documentação</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Documentos podem ser anexados durante o processo de análise.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

