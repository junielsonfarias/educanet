import usePublicContentStore from '@/stores/usePublicContentStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building } from 'lucide-react'

export default function Structure() {
  const { getContent } = usePublicContentStore()
  const content = getContent('semed_structure')

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4 flex items-center justify-center gap-3">
          <Building className="h-10 w-10" />
          Estrutura Organizacional
        </h1>
        <p className="text-xl text-muted-foreground">
          Conheça os departamentos e a organização da Secretaria de Educação.
        </p>
      </div>

      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl">
            {content?.title || 'Estrutura da SEMED'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content ? (
            <div
              className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-primary prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          ) : (
            <p className="text-center text-muted-foreground py-10">
              Conteúdo não disponível no momento.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
