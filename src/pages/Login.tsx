import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, School, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const result = await login(email, password)

      if (result.success) {
        // Pequeno delay para garantir que o estado foi atualizado
        setTimeout(() => {
          navigate('/dashboard')
        }, 100)
      }
    } catch {
      // O erro já foi tratado no useAuth e mostrado via toast
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden">
      {/* Fundo com gradiente e padrões decorativos */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-blue-50 to-primary/10">
        {/* Círculos decorativos com blur */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        
        {/* Grid pattern sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative w-full max-w-md z-10 animate-fade-in-up">
        {/* Link Voltar */}
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 mb-6 w-fit group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Voltar ao Site Institucional
        </Link>

        {/* Card de Login */}
        <Card className="relative shadow-2xl border-0 bg-gradient-to-br from-white via-primary/5 to-white backdrop-blur-sm overflow-hidden">
          {/* Borda superior com gradiente */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-600 to-primary" />
          
          {/* Elementos decorativos no card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/5 rounded-full blur-xl translate-y-12 -translate-x-12" />

          <CardHeader className="space-y-1 text-center relative z-10">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-blue-600/20 to-primary/20 shadow-lg">
                  <School className="h-8 w-8 text-primary" />
                </div>
                {/* Brilho decorativo */}
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-75" />
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
              EduGestão Municipal
            </CardTitle>
            <CardDescription className="text-base">
              Entre com suas credenciais para acessar o painel administrativo
            </CardDescription>
          </CardHeader>
          
          <CardContent className="grid gap-4 relative z-10">
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    E-mail ou Login
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold">
                      Senha
                    </Label>
                    <Link
                      to="#"
                      className="text-xs text-primary hover:underline font-medium transition-colors"
                    >
                      Esqueceu sua senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        Toggle password visibility
                      </span>
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full mt-2 h-11 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar no Sistema
                      <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-2 text-center relative z-10">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline font-medium transition-colors"
            >
              Esqueci minha senha
            </Link>
            <div className="text-xs text-muted-foreground">
              <p>
                Problemas com o acesso?{' '}
                <Link 
                  to="#" 
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Contate o suporte
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
