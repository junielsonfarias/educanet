import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname,
    )
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="bg-secondary/50 p-8 rounded-full mb-6">
        <AlertCircle className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-4xl font-bold mb-2">Página não encontrada</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        Desculpe, a página que você está procurando não existe ou foi movida.
      </p>
      <Link to="/dashboard">
        <Button size="lg">Voltar para o Início</Button>
      </Link>
    </div>
  )
}

export default NotFound
