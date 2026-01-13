import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
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
import { updatePassword } from '@/lib/supabase/auth'
import { toast } from 'sonner'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar se há token de recuperação na URL
    const accessToken = searchParams.get('access_token')
    const type = searchParams.get('type')

    if (!accessToken || type !== 'recovery') {
      toast.error('Link inválido ou expirado')
      navigate('/forgot-password')
    }
  }, [searchParams, navigate])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'A senha deve conter pelo menos uma letra maiúscula'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'A senha deve conter pelo menos uma letra minúscula'
    }
    if (!/[0-9]/.test(pwd)) {
      return 'A senha deve conter pelo menos um número'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    const passwordError = validatePassword(password)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)

    const result = await updatePassword(password)

    if (result.success) {
      setSuccess(true)
      toast.success('Senha redefinida com sucesso!')
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } else {
      toast.error(result.error || 'Erro ao redefinir senha')
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-blue-50 to-primary/10">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse" />
          </div>
        </div>

        <div className="relative w-full max-w-md z-10">
          <Card className="border-2 shadow-xl backdrop-blur-sm bg-white/95">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-extrabold text-center">
                Senha Redefinida!
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                Sua senha foi redefinida com sucesso. Redirecionando para o login...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden">
      {/* Fundo com gradiente e padrões decorativos */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-blue-50 to-primary/10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative w-full max-w-md z-10 animate-fade-in-up">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para login
        </Link>

        <Card className="border-2 shadow-xl backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-primary/10">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-extrabold">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-base">
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e números
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Redefinindo...</span>
                  </span>
                ) : (
                  <span>Redefinir Senha</span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <p className="text-xs text-center text-muted-foreground">
              Lembrou sua senha?{' '}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Voltar para login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

