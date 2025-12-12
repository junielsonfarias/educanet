import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building,
  ExternalLink,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import usePublicContentStore from '@/stores/usePublicContentStore'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default function PublicDocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { documents } = usePublicContentStore()

  const doc = documents.find((d) => d.id === id)

  if (!doc) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Documento não encontrado</h2>
        <Button onClick={() => navigate('/publico/documentos')}>
          Voltar para Documentos
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-3xl">
      <Button
        variant="ghost"
        className="mb-6 pl-0 hover:pl-2 transition-all"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card className="overflow-hidden border-t-4 border-t-primary shadow-lg">
        <CardHeader className="bg-muted/20 pb-8">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-4">
              <Badge variant="outline" className="bg-background">
                {doc.theme}
              </Badge>
              <h1 className="text-3xl font-bold text-primary leading-tight">
                {doc.documentNumber}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Publicado em:{' '}
                  {format(parseISO(doc.publishDate), 'dd/MM/yyyy')}
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="h-4 w-4" />
                  Órgão: {doc.organ}
                </div>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Ementa
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {doc.summary}
            </p>
          </div>

          <div className="bg-secondary/20 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-4">
            <FileText className="h-12 w-12 text-primary/50" />
            <div className="space-y-1">
              <h4 className="font-semibold">Visualizar Documento Completo</h4>
              <p className="text-sm text-muted-foreground">
                Acesse o arquivo original para ver todos os detalhes.
              </p>
            </div>
            <Button size="lg" className="gap-2" asChild>
              <a href={doc.driveLink} target="_blank" rel="noreferrer">
                Abrir Documento <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-4">
            <p>
              Este documento é público e foi disponibilizado para consulta
              através do Portal da Transparência da Educação.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
