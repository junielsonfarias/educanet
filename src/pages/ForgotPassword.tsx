import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react'
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
import { resetPassword } from '@/lib/supabase/auth'
import { toast } from 'sonner'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await resetPassword(email)

    if (result.success) {
      setSent(true)
      toast.success('E-mail de recuperação enviado!')
    } else {
      toast.error(result.error || 'Erro ao enviar e-mail de recuperação')
    }

    setLoading(false)
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
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-extrabold">
              {sent ? 'E-mail Enviado!' : 'Recuperar Senha'}
            </CardTitle>
            <CardDescription className="text-base">
              {sent
                ? 'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.'
                : 'Digite seu e-mail para receber um link de recuperação de senha.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="p-4 rounded-full bg-green-100">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Enviamos um e-mail para <strong>{email}</strong> com instruções para redefinir sua senha.
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  Não recebeu o e-mail? Verifique sua pasta de spam ou tente novamente.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSent(false)
                    setEmail('')
                  }}
                  className="w-full"
                >
                  Enviar novamente
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading || !email}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Enviando...</span>
                    </span>
                  ) : (
                    <span>Enviar Link de Recuperação</span>
                  )}
                </Button>
              </form>
            )}
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

