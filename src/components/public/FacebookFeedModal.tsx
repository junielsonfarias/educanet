import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Facebook, ExternalLink, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FacebookFeedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageUrl: string
  pageName?: string
}

// Declaração global para o SDK do Facebook
declare global {
  interface Window {
    FB?: {
      init: (params: { xfbml: boolean; version: string }) => void
      XFBML: {
        parse: (element?: HTMLElement) => void
      }
    }
    fbAsyncInit?: () => void
  }
}

export function FacebookFeedModal({
  open,
  onOpenChange,
  pageUrl,
  pageName = 'Página do Facebook',
}: FacebookFeedModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) return

    setLoading(true)
    setError(false)

    // Carregar o SDK do Facebook
    const loadFacebookSDK = () => {
      // Se já existe, apenas re-parse
      if (window.FB) {
        window.FB.XFBML.parse(containerRef.current || undefined)
        setLoading(false)
        return
      }

      // Configurar callback de inicialização
      window.fbAsyncInit = function () {
        window.FB?.init({
          xfbml: true,
          version: 'v18.0',
        })
        setLoading(false)
      }

      // Verificar se o script já existe
      if (document.getElementById('facebook-jssdk')) {
        if (window.FB) {
          window.FB.XFBML.parse(containerRef.current || undefined)
          setLoading(false)
        }
        return
      }

      // Criar e inserir o script
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/pt_BR/sdk.js'
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'

      script.onload = () => {
        // Aguardar inicialização
        setTimeout(() => {
          if (window.FB) {
            window.FB.XFBML.parse(containerRef.current || undefined)
          }
          setLoading(false)
        }, 1000)
      }

      script.onerror = () => {
        setError(true)
        setLoading(false)
      }

      document.body.appendChild(script)
    }

    // Pequeno delay para garantir que o modal está renderizado
    const timer = setTimeout(loadFacebookSDK, 100)

    return () => clearTimeout(timer)
  }, [open, pageUrl])

  // Re-parse quando o container estiver pronto
  useEffect(() => {
    if (open && containerRef.current && window.FB) {
      window.FB.XFBML.parse(containerRef.current)
    }
  }, [open])

  // Extrair nome da página da URL
  const getPageName = () => {
    try {
      const url = new URL(pageUrl)
      return url.pathname.replace(/\//g, '') || pageName
    } catch {
      return pageUrl.replace('https://facebook.com/', '').replace('@', '')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[550px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b bg-[#1877F2] text-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Facebook className="h-6 w-6" />
              <div>
                <span className="text-lg font-bold">{pageName}</span>
                <p className="text-xs text-white/80 font-normal">
                  Últimas publicações
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
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-[#1877F2]" />
              <p className="text-muted-foreground">Carregando publicações...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Facebook className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center px-4">
                Não foi possível carregar as publicações.
              </p>
              <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2 bg-[#1877F2] hover:bg-[#166fe5]">
                  <ExternalLink className="h-4 w-4" />
                  Abrir no Facebook
                </Button>
              </a>
            </div>
          )}

          {/* Container do Facebook Page Plugin */}
          <div
            ref={containerRef}
            className={loading || error ? 'hidden' : 'flex justify-center p-2'}
          >
            <div
              className="fb-page"
              data-href={pageUrl}
              data-tabs="timeline"
              data-width="500"
              data-height="600"
              data-small-header="false"
              data-adapt-container-width="true"
              data-hide-cover="false"
              data-show-facepile="true"
            >
              <blockquote cite={pageUrl} className="fb-xfbml-parse-ignore">
                <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                  {getPageName()}
                </a>
              </blockquote>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t bg-muted/30">
          <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Button
              variant="outline"
              className="w-full gap-2 border-[#1877F2] text-[#1877F2] hover:bg-[#1877F2] hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir página no Facebook
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
