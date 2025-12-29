# Ponto de Restauração - Tela de Login (Antes das Melhorias)

**Data:** 2025-01-27
**Arquivo:** `src/pages/Login.tsx`

Este documento contém o estado anterior da tela de login antes das melhorias de design.

## Estado Anterior

```tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, School, ArrowLeft } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import useUserStore from '@/stores/useUserStore'

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useUserStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call latency
    setTimeout(async () => {
      const success = await login(email, password)
      setIsLoading(false)

      if (success) {
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo ao Sistema de Gestão Escolar.',
        })
        navigate('/dashboard')
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro no login',
          description: 'Credenciais inválidas. Verifique e-mail e senha.',
        })
      }
    }, 1500)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-secondary/30 p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] opacity-30"></div>

      <div className="w-full max-w-md">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Site Institucional
        </Link>

        <Card className="shadow-xl border-t-4 border-t-primary">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <School className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              EduGestão Municipal
            </CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o painel administrativo
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail ou Login</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link
                      to="#"
                      className="text-xs text-primary hover:underline"
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
                  className="w-full mt-2"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar no Sistema'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-center">
            <div className="text-xs text-muted-foreground">
              <p>
                Problemas com o acesso?{' '}
                <Link to="#" className="text-primary hover:underline">
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
```

## Características do Estado Anterior

- Fundo simples com gradiente radial roxo
- Card básico com sombra simples
- Ícone simples sem gradiente
- Botão padrão sem gradiente
- Sem padrões decorativos
- Sem animações de entrada
- Design básico e funcional

