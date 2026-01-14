import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Instagram, ExternalLink, Loader2, X, Heart, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InstagramFeedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileUrl: string
  profileName?: string
  profileHandle?: string
}

export function InstagramFeedModal({
  open,
  onOpenChange,
  profileUrl,
  profileName = 'Perfil do Instagram',
  profileHandle = '@semed_oficial',
}: InstagramFeedModalProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      // Simular carregamento
      const timer = setTimeout(() => setLoading(false), 800)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Imagens de exemplo para o grid (simulando posts)
  const mockPosts = [
    { id: 1, likes: 234, comments: 18, query: 'education classroom students' },
    { id: 2, likes: 189, comments: 12, query: 'school children learning' },
    { id: 3, likes: 312, comments: 24, query: 'teacher teaching class' },
    { id: 4, likes: 156, comments: 8, query: 'students graduation ceremony' },
    { id: 5, likes: 278, comments: 21, query: 'school library books' },
    { id: 6, likes: 198, comments: 15, query: 'art class painting' },
    { id: 7, likes: 267, comments: 19, query: 'sports day school' },
    { id: 8, likes: 145, comments: 11, query: 'science experiment lab' },
    { id: 9, likes: 223, comments: 16, query: 'music class instruments' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Header com gradiente Instagram */}
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Instagram className="h-6 w-6" />
              <div>
                <span className="text-lg font-bold">{profileName}</span>
                <p className="text-xs text-white/80 font-normal">
                  {profileHandle}
                </p>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
              <p className="text-muted-foreground">Carregando perfil...</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Perfil Header Compacto */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-0.5 flex-shrink-0">
                  <div className="h-full w-full rounded-full bg-white p-0.5">
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      <Instagram className="h-6 w-6 text-pink-500" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold truncate">{profileName}</h2>
                  <p className="text-sm text-muted-foreground">{profileHandle}</p>
                </div>
                <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white text-xs">
                    Seguir
                  </Button>
                </a>
              </div>

              {/* Estatísticas */}
              <div className="flex justify-around py-3 border-y mb-4 text-center">
                <div>
                  <span className="font-bold block">127</span>
                  <span className="text-xs text-muted-foreground">publicações</span>
                </div>
                <div>
                  <span className="font-bold block">5.4K</span>
                  <span className="text-xs text-muted-foreground">seguidores</span>
                </div>
                <div>
                  <span className="font-bold block">89</span>
                  <span className="text-xs text-muted-foreground">seguindo</span>
                </div>
              </div>

              {/* Grid de Posts */}
              <div className="grid grid-cols-3 gap-1">
                {mockPosts.map((post) => (
                  <a
                    key={post.id}
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square relative group overflow-hidden bg-muted"
                  >
                    <img
                      src={`https://img.usecurling.com/p/400/400?q=${encodeURIComponent(post.query)}`}
                      alt={`Post ${post.id}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Overlay com estatísticas */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <div className="flex items-center gap-1 text-white text-xs">
                        <Heart className="h-4 w-4 fill-white" />
                        <span className="font-bold">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white text-xs">
                        <MessageCircle className="h-4 w-4 fill-white" />
                        <span className="font-bold">{post.comments}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t bg-muted/30">
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Button
              variant="outline"
              className="w-full gap-2 border-pink-400 text-pink-600 hover:bg-gradient-to-r hover:from-purple-600 hover:via-pink-500 hover:to-orange-400 hover:text-white hover:border-transparent"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir perfil no Instagram
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
