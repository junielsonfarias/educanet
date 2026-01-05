import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Newspaper, Calendar, Search, ArrowRight, FileText } from 'lucide-react'
import { usePublicContentStore } from '@/stores/usePublicContentStore.supabase'
import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'

export default function PublicNews() {
  const { publishedContents, fetchPublishedContents, loading } = usePublicContentStore()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPublishedContents({
      contentType: 'Noticia',
      limit: undefined, // Buscar todas
      featuredOnly: false
    })
  }, [fetchPublishedContents])

  const filteredNews = useMemo(() => {
    if (!Array.isArray(publishedContents)) return []
    
    return publishedContents.filter((item) => {
      const title = item.title || ''
      const summary = item.summary || item.content || ''
      
      return (
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        summary.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [publishedContents, searchTerm])

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in space-y-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
            Notícias e Comunicados
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Fique por dentro de tudo o que acontece na educação municipal.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar notícias..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="flex flex-col h-full">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredNews.length > 0 ? (
          filteredNews.map((post) => {
            const publishDate = post.publication_date || post.created_at
            const imageUrl = post.cover_image_url || 'https://img.usecurling.com/p/400/300?q=education'
            const summary = post.summary || post.content?.substring(0, 150) || ''
            
            return (
              <Link
                to={`/publico/noticias/${post.id}`}
                key={post.id}
                className="block h-full"
              >
                <Card className="group relative overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full bg-gradient-to-br from-white via-primary/5 to-white">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="h-48 bg-muted relative overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {publishDate && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-primary/90 to-blue-600/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-lg flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(publishDate), 'dd/MM/yyyy')}
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors font-bold">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 leading-relaxed">
                      {summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4 relative z-10">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 group/btn border-2 border-primary/20 hover:border-primary hover:bg-primary/10 transition-all duration-300"
                    >
                      Ler Notícia
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="mb-4 p-4 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent inline-flex">
              <FileText className="h-12 w-12 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Nenhuma notícia disponível</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhuma notícia encontrada com o termo buscado.' : 'Nenhuma notícia encontrada.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
