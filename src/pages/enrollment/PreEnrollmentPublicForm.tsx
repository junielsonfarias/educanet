/**
 * PreEnrollmentPublicForm - Formulario publico de pre-matricula
 *
 * Este formulario e acessado pelo portal publico para que familias
 * possam solicitar vagas antes do inicio do ano letivo.
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, differenceInYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  User,
  GraduationCap,
  UserCircle,
  MapPin,
  Building2,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
  Clock,
  Phone,
  Mail,
  Search,
} from 'lucide-react'
import { usePreEnrollmentStore } from '@/stores/usePreEnrollmentStore.supabase'
import type { PreEnrollmentPeriod, PreEnrollmentType } from '@/lib/supabase/services'

const seriesDisponiveis = [
  { value: 'Creche I', label: 'Creche I (0-1 ano)' },
  { value: 'Creche II', label: 'Creche II (1-2 anos)' },
  { value: 'Creche III', label: 'Creche III (2-3 anos)' },
  { value: 'Pre I', label: 'Pre I (3-4 anos)' },
  { value: 'Pre II', label: 'Pre II (4-5 anos)' },
  { value: '1o Ano', label: '1o Ano (5-6 anos)' },
  { value: '2o Ano', label: '2o Ano' },
  { value: '3o Ano', label: '3o Ano' },
  { value: '4o Ano', label: '4o Ano' },
  { value: '5o Ano', label: '5o Ano' },
  { value: '6o Ano', label: '6o Ano' },
  { value: '7o Ano', label: '7o Ano' },
  { value: '8o Ano', label: '8o Ano' },
  { value: '9o Ano', label: '9o Ano' },
]

const turnosDisponiveis = [
  { value: 'Matutino', label: 'Matutino' },
  { value: 'Vespertino', label: 'Vespertino' },
  { value: 'Integral', label: 'Integral' },
]

const tiposPreMatricula: { value: PreEnrollmentType; label: string; description: string }[] = [
  { value: 'Aluno_Novo', label: 'Aluno Novo', description: 'Primeira matricula na rede municipal' },
  { value: 'Transferencia_Externa', label: 'Transferencia Externa', description: 'Vindo de outra rede (particular, estadual ou outro municipio)' },
  { value: 'Transferencia_Interna', label: 'Transferencia Interna', description: 'Vindo de outra escola da rede municipal' },
  { value: 'Retorno', label: 'Retorno', description: 'Ja estudou na rede e deseja retornar' },
]

const estadosBrasileiros = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const formSchema = z.object({
  // Tipo
  tipo: z.enum(['Aluno_Novo', 'Transferencia_Externa', 'Transferencia_Interna', 'Retorno'], {
    required_error: 'Selecione o tipo de pre-matricula',
  }),

  // Dados do Aluno
  aluno_nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  aluno_data_nascimento: z.string().min(1, 'Data de nascimento e obrigatoria'),
  aluno_cpf: z.string().optional(),
  aluno_certidao_nascimento: z.string().optional(),
  aluno_sexo: z.string().optional(),
  serie_desejada: z.string().min(1, 'Selecione a serie desejada'),
  turno_desejado: z.string().optional(),
  aluno_deficiencia: z.boolean().default(false),
  aluno_tipo_deficiencia: z.string().optional(),

  // Escola de Origem (se transferencia)
  escola_origem_nome: z.string().optional(),
  escola_origem_cidade: z.string().optional(),
  escola_origem_estado: z.string().optional(),

  // Dados do Responsavel
  responsavel_nome: z.string().min(3, 'Nome do responsavel e obrigatorio'),
  responsavel_cpf: z.string().min(11, 'CPF do responsavel e obrigatorio').max(14),
  responsavel_rg: z.string().optional(),
  responsavel_telefone: z.string().min(10, 'Telefone do responsavel e obrigatorio'),
  responsavel_email: z.string().email('E-mail invalido').optional().or(z.literal('')),
  responsavel_parentesco: z.string().optional(),

  // Endereco
  endereco_cep: z.string().min(8, 'CEP e obrigatorio').max(9),
  endereco_logradouro: z.string().min(3, 'Logradouro e obrigatorio'),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().min(2, 'Bairro e obrigatorio'),
  endereco_cidade: z.string().min(2, 'Cidade e obrigatoria'),
  endereco_estado: z.string().min(2, 'Estado e obrigatorio'),

  // Vulnerabilidade
  vulnerabilidade_social: z.boolean().default(false),
  nis_cadunico: z.string().optional(),

  // Preferencias de Escola
  escolas_preferencia: z.array(z.number()).optional(),

  // Termos
  aceito_termos: z.boolean().refine((v) => v === true, {
    message: 'Voce precisa aceitar os termos para continuar',
  }),
})

type FormData = z.infer<typeof formSchema>

interface PreEnrollmentPublicFormProps {
  periodoAtivo?: PreEnrollmentPeriod | null
}

export default function PreEnrollmentPublicForm({ periodoAtivo }: PreEnrollmentPublicFormProps) {
  const {
    loading,
    escolasComVagas,
    acompanhamento,
    fetchPeriodoAtivo,
    criarPreMatricula,
    buscarEscolasComVagas,
    acompanharPorProtocolo,
    clearAcompanhamento,
  } = usePreEnrollmentStore()

  const [periodo, setPeriodo] = useState<PreEnrollmentPeriod | null>(periodoAtivo || null)
  const [protocolo, setProtocolo] = useState('')
  const [protocoloCriado, setProtocoloCriado] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'acompanhar' | 'sucesso'>('form')
  const [buscandoCep, setBuscandoCep] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'Aluno_Novo',
      aluno_nome: '',
      aluno_data_nascimento: '',
      aluno_cpf: '',
      aluno_certidao_nascimento: '',
      aluno_sexo: '',
      serie_desejada: '',
      turno_desejado: '',
      aluno_deficiencia: false,
      aluno_tipo_deficiencia: '',
      escola_origem_nome: '',
      escola_origem_cidade: '',
      escola_origem_estado: '',
      responsavel_nome: '',
      responsavel_cpf: '',
      responsavel_rg: '',
      responsavel_telefone: '',
      responsavel_email: '',
      responsavel_parentesco: '',
      endereco_cep: '',
      endereco_logradouro: '',
      endereco_numero: '',
      endereco_complemento: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_estado: '',
      vulnerabilidade_social: false,
      nis_cadunico: '',
      escolas_preferencia: [],
      aceito_termos: false,
    },
  })

  const tipoSelecionado = form.watch('tipo')
  const serieSelecionada = form.watch('serie_desejada')
  const turnoSelecionado = form.watch('turno_desejado')
  const bairro = form.watch('endereco_bairro')

  // Buscar periodo ativo
  useEffect(() => {
    if (!periodoAtivo) {
      fetchPeriodoAtivo().then((p) => setPeriodo(p))
    }
  }, [periodoAtivo, fetchPeriodoAtivo])

  // Buscar escolas com vagas quando selecionar serie
  useEffect(() => {
    if (periodo && serieSelecionada) {
      buscarEscolasComVagas(
        periodo.academic_year_id,
        serieSelecionada,
        turnoSelecionado || undefined,
        bairro || undefined
      )
    }
  }, [periodo, serieSelecionada, turnoSelecionado, bairro, buscarEscolasComVagas])

  // Buscar endereco por CEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    setBuscandoCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (!data.erro) {
        form.setValue('endereco_logradouro', data.logradouro || '')
        form.setValue('endereco_bairro', data.bairro || '')
        form.setValue('endereco_cidade', data.localidade || '')
        form.setValue('endereco_estado', data.uf || '')
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setBuscandoCep(false)
    }
  }

  // Acompanhar por protocolo
  const handleAcompanhar = async () => {
    if (protocolo.trim()) {
      await acompanharPorProtocolo(protocolo.trim().toUpperCase())
    }
  }

  // Submeter formulario
  const onSubmit = async (data: FormData) => {
    if (!periodo) return

    const result = await criarPreMatricula(periodo.id, {
      tipo: data.tipo,
      aluno_nome: data.aluno_nome,
      aluno_data_nascimento: data.aluno_data_nascimento,
      aluno_cpf: data.aluno_cpf,
      aluno_certidao_nascimento: data.aluno_certidao_nascimento,
      aluno_sexo: data.aluno_sexo,
      serie_desejada: data.serie_desejada,
      turno_desejado: data.turno_desejado,
      escola_origem_nome: data.escola_origem_nome,
      escola_origem_cidade: data.escola_origem_cidade,
      escola_origem_estado: data.escola_origem_estado,
      responsavel_nome: data.responsavel_nome,
      responsavel_cpf: data.responsavel_cpf,
      responsavel_telefone: data.responsavel_telefone,
      responsavel_email: data.responsavel_email || undefined,
      responsavel_parentesco: data.responsavel_parentesco,
      endereco_cep: data.endereco_cep,
      endereco_logradouro: data.endereco_logradouro,
      endereco_numero: data.endereco_numero,
      endereco_bairro: data.endereco_bairro,
      endereco_cidade: data.endereco_cidade,
      vulnerabilidade_social: data.vulnerabilidade_social,
      nis_cadunico: data.nis_cadunico,
      escolas_preferencia: data.escolas_preferencia,
    })

    if (result) {
      setProtocoloCriado(result.protocolo)
      setStep('sucesso')
    }
  }

  // Periodo nao ativo
  if (!periodo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <CardTitle>Pre-Matricula Indisponivel</CardTitle>
            <CardDescription>
              Nao ha periodo de pre-matricula aberto no momento.
              Por favor, aguarde a abertura das inscricoes.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => setStep('acompanhar')}>
              Ja tenho um protocolo
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de sucesso
  if (step === 'sucesso' && protocoloCriado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-green-600">Pre-Matricula Enviada!</CardTitle>
            <CardDescription>
              Sua solicitacao foi recebida com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Seu protocolo e:</p>
              <p className="text-2xl font-bold text-primary">{protocoloCriado}</p>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                Guarde este protocolo! Voce precisara dele para acompanhar
                o status da sua pre-matricula.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('form')
                  setProtocoloCriado(null)
                  form.reset()
                }}
              >
                Nova Pre-Matricula
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setProtocolo(protocoloCriado)
                  setStep('acompanhar')
                  handleAcompanhar()
                }}
              >
                Acompanhar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de acompanhamento
  if (step === 'acompanhar') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Acompanhar Pre-Matricula
              </CardTitle>
              <CardDescription>
                Digite o protocolo para verificar o status da sua solicitacao.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o protocolo (ex: PM2025XXXX)"
                  value={protocolo}
                  onChange={(e) => setProtocolo(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button onClick={handleAcompanhar} disabled={loading || !protocolo.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar
                </Button>
              </div>

              {acompanhamento && (
                <div className="space-y-4 pt-4">
                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Protocolo</Label>
                      <p className="font-medium">{acompanhamento.protocolo}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Badge variant="outline" className="mt-1">
                        {acompanhamento.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Aluno</Label>
                      <p className="font-medium">{acompanhamento.aluno_nome}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Serie</Label>
                      <p>{acompanhamento.serie_desejada}</p>
                    </div>
                    {acompanhamento.escola_alocada && (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Escola Alocada</Label>
                        <p className="font-medium text-green-600">{acompanhamento.escola_alocada}</p>
                      </div>
                    )}
                    {acompanhamento.posicao_lista_espera && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Posicao na Lista</Label>
                        <p className="font-medium text-orange-600">{acompanhamento.posicao_lista_espera}o lugar</p>
                      </div>
                    )}
                    {acompanhamento.data_limite_comparecimento && (
                      <div className="col-span-2">
                        <Alert variant="default" className="bg-orange-50 border-orange-200">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <AlertTitle className="text-orange-800">Prazo para Comparecimento</AlertTitle>
                          <AlertDescription className="text-orange-700">
                            Compareca ate{' '}
                            <strong>
                              {format(new Date(acompanhamento.data_limite_comparecimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </strong>{' '}
                            na escola com os documentos necessarios.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm">{acompanhamento.mensagem_status}</p>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('form')
                    clearAcompanhamento()
                    setProtocolo('')
                  }}
                >
                  Fazer Nova Pre-Matricula
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Formulario de pre-matricula
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              Pre-Matricula Online
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              {periodo.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(periodo.data_inicio), 'dd/MM/yyyy')} ate{' '}
                  {format(new Date(periodo.data_fim), 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link para acompanhar */}
        <div className="flex justify-end">
          <Button variant="link" onClick={() => setStep('acompanhar')}>
            <Search className="mr-2 h-4 w-4" />
            Ja tenho um protocolo
          </Button>
        </div>

        {/* Formulario */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Pre-Matricula */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tipo de Solicitacao
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          {tiposPreMatricula.map((tipo) => (
                            <div key={tipo.value}>
                              <RadioGroupItem
                                value={tipo.value}
                                id={tipo.value}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={tipo.value}
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <span className="font-medium">{tipo.label}</span>
                                <span className="text-xs text-muted-foreground text-center mt-1">
                                  {tipo.description}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Dados do Aluno */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Aluno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="aluno_nome"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo do aluno" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aluno_data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aluno_sexo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aluno_cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF do Aluno</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aluno_certidao_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certidao de Nascimento</FormLabel>
                        <FormControl>
                          <Input placeholder="Numero da certidao" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serie_desejada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serie Desejada *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a serie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {seriesDisponiveis.map((serie) => (
                              <SelectItem key={serie.value} value={serie.value}>
                                {serie.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="turno_desejado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turno Desejado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o turno" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {turnosDisponiveis.map((turno) => (
                              <SelectItem key={turno.value} value={turno.value}>
                                {turno.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="aluno_deficiencia"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Pessoa com Deficiencia (PcD)
                        </FormLabel>
                        <FormDescription>
                          Marque se o aluno possui algum tipo de deficiencia
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('aluno_deficiencia') && (
                  <FormField
                    control={form.control}
                    name="aluno_tipo_deficiencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Deficiencia</FormLabel>
                        <FormControl>
                          <Input placeholder="Descreva o tipo de deficiencia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Escola de Origem (se transferencia) */}
            {(tipoSelecionado === 'Transferencia_Externa' || tipoSelecionado === 'Transferencia_Interna') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Escola de Origem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="escola_origem_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Escola</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da escola atual" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="escola_origem_cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade da escola" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="escola_origem_estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {estadosBrasileiros.map((uf) => (
                                <SelectItem key={uf} value={uf}>
                                  {uf}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados do Responsavel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Dados do Responsavel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsavel_nome"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo do responsavel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavel_cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF *</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavel_rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input placeholder="Numero do RG" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavel_parentesco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parentesco</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mae">Mae</SelectItem>
                            <SelectItem value="Pai">Pai</SelectItem>
                            <SelectItem value="Avo">Avo/Avo</SelectItem>
                            <SelectItem value="Tio">Tio/Tia</SelectItem>
                            <SelectItem value="Responsavel_Legal">Responsavel Legal</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavel_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="(00) 00000-0000" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavel_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="email@exemplo.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Endereco */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereco
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="endereco_cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="00000-000"
                              {...field}
                              onBlur={(e) => {
                                field.onBlur()
                                buscarCep(e.target.value)
                              }}
                            />
                            {buscandoCep && (
                              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="endereco_logradouro"
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <FormLabel>Logradouro *</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, Avenida, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco_numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero</FormLabel>
                        <FormControl>
                          <Input placeholder="No" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endereco_complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, Bloco, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco_bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro *</FormLabel>
                        <FormControl>
                          <Input placeholder="Bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endereco_cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco_estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {estadosBrasileiros.map((uf) => (
                              <SelectItem key={uf} value={uf}>
                                {uf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vulnerabilidade Social */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Vulnerabilidade Social
                </CardTitle>
                <CardDescription>
                  Informacoes para priorizacao conforme criterios da Secretaria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="vulnerabilidade_social"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Familia em situacao de vulnerabilidade social
                        </FormLabel>
                        <FormDescription>
                          Inscrito no CadUnico ou beneficiario de programa social
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('vulnerabilidade_social') && (
                  <FormField
                    control={form.control}
                    name="nis_cadunico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIS / Numero do CadUnico</FormLabel>
                        <FormControl>
                          <Input placeholder="Numero do NIS ou CadUnico" {...field} />
                        </FormControl>
                        <FormDescription>
                          Informe o numero para validacao automatica
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Preferencias de Escola */}
            {periodo.permite_escolha_escola && serieSelecionada && escolasComVagas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Preferencia de Escola
                  </CardTitle>
                  <CardDescription>
                    Selecione ate {periodo.max_opcoes_escola} escolas por ordem de preferencia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="escolas_preferencia"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          {escolasComVagas.map((escola) => (
                            <div
                              key={escola.school_id}
                              className="flex items-center justify-between rounded-md border p-3"
                            >
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={field.value?.includes(escola.school_id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || []
                                    if (checked) {
                                      if (currentValue.length < periodo.max_opcoes_escola) {
                                        field.onChange([...currentValue, escola.school_id])
                                      }
                                    } else {
                                      field.onChange(currentValue.filter((id) => id !== escola.school_id))
                                    }
                                  }}
                                  disabled={
                                    !field.value?.includes(escola.school_id) &&
                                    (field.value?.length || 0) >= periodo.max_opcoes_escola
                                  }
                                />
                                <div>
                                  <p className="font-medium">{escola.school_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {escola.vagas_disponiveis} vagas disponiveis
                                  </p>
                                </div>
                              </div>
                              {field.value?.includes(escola.school_id) && (
                                <Badge variant="outline">
                                  {(field.value?.indexOf(escola.school_id) || 0) + 1}a opcao
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Termos */}
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="aceito_termos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Declaro que as informacoes prestadas sao verdadeiras *
                        </FormLabel>
                        <FormDescription>
                          Estou ciente de que a falsidade das informacoes pode resultar
                          no cancelamento da pre-matricula e em sancoes legais.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botao de Envio */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={loading}
              >
                Limpar
              </Button>
              <Button type="submit" disabled={loading} size="lg">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                Enviar Pre-Matricula
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
