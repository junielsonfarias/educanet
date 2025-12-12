import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Newspaper, Calendar, Search, ArrowRight } from 'lucide-react'
import usePublicContentStore from '@/stores/usePublicContentStore'
import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'

export default function PublicNews() {
  const { news } = usePublicContentStore()
  const [searchTerm, setSearchTerm] = useState('')

  const activeNews = news
    .filter((n) => n.active)
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime(),
    )

  const filteredNews = activeNews.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4 flex items-center justify-center gap-3">
          <Newspaper className="h-10 w-10" />
          Notícias e Comunicados
        </h1>
        <p className="text-xl text-muted-foreground">
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
        {filteredNews.length > 0 ? (
          filteredNews.map((post) => (
            <Link
              to={`/publico/noticias/${post.id}`}
              key={post.id}
              className="block h-full"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full group">
                <div className="h-48 bg-muted relative overflow-hidden">
                  <img
                    src={
                      post.imageUrl ||
                      'https://img.usecurling.com/p/400/300?q=education'
                    }
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(post.publishDate), 'dd/MM/yyyy')}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {post.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-4">
                  <Button variant="outline" className="w-full gap-2 group/btn">
                    Ler Notícia
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma notícia encontrada.</p>
          </div>
        )}
      </div>
    </div>
  )
}
