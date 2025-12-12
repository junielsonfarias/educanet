import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import usePublicContentStore from '@/stores/usePublicContentStore'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default function PublicNewsDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { news } = usePublicContentStore()

  const post = news.find((n) => n.id === id)

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Notícia não encontrada</h2>
        <Button onClick={() => navigate('/publico/noticias')}>
          Voltar para Notícias
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6 pl-0 hover:pl-2 transition-all"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <article className="space-y-8">
        <div className="space-y-4">
          <Badge variant="secondary" className="mb-2">
            Notícias
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight text-primary">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm border-b pb-6">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(parseISO(post.publishDate), 'dd/MM/yyyy')}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author}
            </div>
            <Button variant="ghost" size="sm" className="ml-auto gap-2">
              <Share2 className="h-4 w-4" /> Compartilhar
            </Button>
          </div>
        </div>

        {post.imageUrl && (
          <div className="rounded-xl overflow-hidden shadow-lg aspect-video max-h-[500px] w-full">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div
              className="prose prose-lg max-w-none prose-headings:text-primary prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Sobre esta notícia</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {post.summary}
                </p>
                <div className="text-xs text-muted-foreground">
                  Publicado em:{' '}
                  {format(parseISO(post.publishDate), "dd 'de' MMMM 'de' yyyy")}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </article>
    </div>
  )
}
