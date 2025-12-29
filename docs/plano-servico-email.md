# Plano de Implementação - Serviço de E-mail Real

**Data de Criação:** 2025-01-27  
**Status:** 📋 Planejamento  
**Prioridade:** 🟡 Média-Alta  
**Estimativa:** 1-2 semanas

## 📋 Objetivo

Implementar serviço de e-mail real para envio de notificações, boletins, alertas e comunicados aos responsáveis e alunos, substituindo o sistema simulado atual.

---

## 🎯 Escopo

### Funcionalidades a Implementar

#### 1. Configuração SMTP
- [ ] Criar interface de configuração SMTP
- [ ] Suportar múltiplos provedores (Gmail, SendGrid, AWS SES, etc)
- [ ] Configuração segura (variáveis de ambiente)
- [ ] Teste de conexão SMTP
- [ ] Validação de credenciais
- [ ] Histórico de configurações

#### 2. Templates de E-mail
- [ ] Sistema de templates HTML
- [ ] Templates para boletim
- [ ] Templates para frequência
- [ ] Templates para alertas
- [ ] Templates para comunicados
- [ ] Templates para notificações
- [ ] Editor de templates (WYSIWYG)
- [ ] Variáveis dinâmicas nos templates
- [ ] Preview de templates

#### 3. Envio de E-mails
- [ ] Envio individual
- [ ] Envio em massa (BCC)
- [ ] Envio agendado
- [ ] Fila de envio
- [ ] Retry automático em caso de falha
- [ ] Rate limiting (evitar spam)
- [ ] Logs de envio
- [ ] Status de entrega

#### 4. Integração com Sistema
- [ ] Integrar com notificações existentes
- [ ] Envio automático de boletim
- [ ] Envio automático de alertas
- [ ] Envio automático de frequência
- [ ] Envio manual de comunicados
- [ ] Histórico de e-mails enviados
- [ ] Relatórios de envio

---

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── services/
│   ├── email/
│   │   ├── index.ts                    # Exportações principais
│   │   ├── email-service.ts            # Serviço principal
│   │   ├── smtp-config.ts              # Configuração SMTP
│   │   ├── email-queue.ts              # Fila de envio
│   │   ├── email-templates.ts          # Gerenciamento de templates
│   │   ├── email-validator.ts          # Validação de e-mails
│   │   └── types.ts                    # Tipos TypeScript
│   └── providers/
│       ├── sendgrid-provider.ts        # Provedor SendGrid
│       ├── aws-ses-provider.ts         # Provedor AWS SES
│       ├── smtp-provider.ts            # Provedor SMTP genérico
│       └── mock-provider.ts            # Provedor mock (desenvolvimento)
├── stores/
│   └── useEmailStore.tsx               # Store para configuração
└── pages/
    └── settings/
        └── EmailSettings.tsx           # Página de configuração
```

### Interfaces TypeScript

```typescript
// Configuração SMTP
export interface SMTPConfig {
  host: string
  port: number
  secure: boolean // TLS/SSL
  auth: {
    user: string
    pass: string
  }
  from: {
    name: string
    email: string
  }
  provider?: 'smtp' | 'sendgrid' | 'aws-ses' | 'gmail'
  apiKey?: string // Para SendGrid/AWS SES
}

// E-mail
export interface Email {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: EmailAttachment[]
  replyTo?: string
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

// Template
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  html: string
  variables: string[] // Variáveis disponíveis
  category: 'boletim' | 'frequencia' | 'alerta' | 'comunicado' | 'notificacao'
}

// Resultado de envio
export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  sentAt: Date
  to: string
}
```

---

## 📝 Fases de Implementação

### Fase 1: Infraestrutura Base (2-3 dias)
- [ ] Criar estrutura de diretórios
- [ ] Criar interfaces TypeScript
- [ ] Criar serviço base de e-mail
- [ ] Criar sistema de templates
- [ ] Criar store de configuração
- [ ] Configurar variáveis de ambiente
- [ ] Criar provedor mock (desenvolvimento)

### Fase 2: Provedores de E-mail (3-4 dias)
- [ ] Implementar provedor SMTP genérico
- [ ] Implementar provedor SendGrid (opcional)
- [ ] Implementar provedor AWS SES (opcional)
- [ ] Implementar provedor Gmail (opcional)
- [ ] Sistema de seleção de provedor
- [ ] Testes de conexão
- [ ] Tratamento de erros por provedor

### Fase 3: Templates e Envio (3-4 dias)
- [ ] Criar templates HTML base
- [ ] Implementar sistema de variáveis
- [ ] Criar editor de templates
- [ ] Implementar envio individual
- [ ] Implementar envio em massa
- [ ] Implementar fila de envio
- [ ] Implementar retry automático
- [ ] Testes de envio

### Fase 4: Integração (2-3 dias)
- [ ] Integrar com sistema de notificações
- [ ] Implementar envio automático de boletim
- [ ] Implementar envio automático de alertas
- [ ] Implementar envio automático de frequência
- [ ] Criar interface de envio manual
- [ ] Criar histórico de envios
- [ ] Criar relatórios

### Fase 5: Interface de Configuração (2 dias)
- [ ] Criar página de configuração SMTP
- [ ] Criar formulário de configuração
- [ ] Implementar teste de conexão
- [ ] Criar gerenciador de templates
- [ ] Criar editor de templates
- [ ] Criar preview de templates

---

## 🔧 Dependências e Ferramentas

### Bibliotecas Necessárias

#### Opção 1: Nodemailer (SMTP Genérico)
```bash
npm install nodemailer
npm install @types/nodemailer --save-dev
```
- ✅ Suporta qualquer servidor SMTP
- ✅ Fácil configuração
- ✅ Bom para desenvolvimento e produção

#### Opção 2: SendGrid
```bash
npm install @sendgrid/mail
```
- ✅ API simples
- ✅ Alta taxa de entrega
- ✅ Analytics integrado
- ⚠️ Requer conta e API key

#### Opção 3: AWS SES
```bash
npm install @aws-sdk/client-ses
```
- ✅ Escalável
- ✅ Baixo custo
- ✅ Integração com AWS
- ⚠️ Requer conta AWS

#### Opção 4: Gmail API
```bash
npm install googleapis
```
- ✅ Gratuito (com limites)
- ✅ Fácil para testes
- ⚠️ Limites de envio (500/dia)

### Recomendação
**Começar com Nodemailer** (mais flexível) e adicionar SendGrid/AWS SES como opções avançadas.

---

## 📋 Templates de E-mail

### Template de Boletim

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Estilos do template */
  </style>
</head>
<body>
  <div class="container">
    <h1>Boletim Escolar - {{studentName}}</h1>
    <p>Ano Letivo: {{academicYear}}</p>
    <p>Turma: {{classroomName}}</p>
    
    <table>
      <thead>
        <tr>
          <th>Disciplina</th>
          <th>1º Bimestre</th>
          <th>2º Bimestre</th>
          <th>3º Bimestre</th>
          <th>4º Bimestre</th>
          <th>Média Final</th>
        </tr>
      </thead>
      <tbody>
        {{#subjects}}
        <tr>
          <td>{{name}}</td>
          <td>{{period1}}</td>
          <td>{{period2}}</td>
          <td>{{period3}}</td>
          <td>{{period4}}</td>
          <td>{{finalGrade}}</td>
        </tr>
        {{/subjects}}
      </tbody>
    </table>
    
    <p>Frequência: {{attendance}}%</p>
    <p>Situação: {{status}}</p>
  </div>
</body>
</html>
```

### Template de Alerta

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <div class="alert">
    <h2>Alerta: {{alertType}}</h2>
    <p>Olá {{guardianName}},</p>
    <p>{{message}}</p>
    <p>Aluno: {{studentName}}</p>
    <p>Data: {{date}}</p>
  </div>
</body>
</html>
```

---

## ✅ Critérios de Sucesso

### Funcionalidade
- ✅ 95%+ de taxa de entrega de e-mails
- ✅ Envio em < 5 segundos por e-mail
- ✅ Suporte a envio em massa (100+ destinatários)
- ✅ Templates personalizáveis funcionando
- ✅ Histórico completo de envios

### Segurança
- ✅ Credenciais em variáveis de ambiente
- ✅ Conexão SMTP segura (TLS/SSL)
- ✅ Validação de e-mails antes de enviar
- ✅ Rate limiting para evitar spam
- ✅ Logs sem informações sensíveis

### Performance
- ✅ Fila de envio assíncrona
- ✅ Retry automático em falhas
- ✅ Não bloquear UI durante envio
- ✅ Processamento em background

---

## 🔐 Segurança

### Variáveis de Ambiente

```env
# .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=escola@exemplo.com
SMTP_PASS=senha_segura
SMTP_FROM_NAME=Escola Municipal
SMTP_FROM_EMAIL=escola@exemplo.com

# Opcional: SendGrid
SENDGRID_API_KEY=SG.xxxxx

# Opcional: AWS SES
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
```

### Boas Práticas
- ✅ Nunca commitar credenciais
- ✅ Usar variáveis de ambiente
- ✅ Rotacionar senhas regularmente
- ✅ Usar conexão segura (TLS/SSL)
- ✅ Validar e-mails antes de enviar
- ✅ Implementar rate limiting
- ✅ Logs sem informações sensíveis

---

## 🧪 Estratégia de Testes

### Testes Unitários
- [ ] Testar validação de e-mail
- [ ] Testar renderização de templates
- [ ] Testar substituição de variáveis
- [ ] Testar formatação de e-mail

### Testes de Integração
- [ ] Testar conexão SMTP
- [ ] Testar envio de e-mail
- [ ] Testar envio em massa
- [ ] Testar fila de envio
- [ ] Testar retry automático

### Testes de Aceitação
- [ ] Enviar e-mail de teste
- [ ] Verificar recebimento
- [ ] Verificar formatação
- [ ] Testar com diferentes provedores

---

## 📊 Monitoramento

### Métricas a Acompanhar
- Taxa de entrega (%)
- Taxa de abertura (se disponível)
- Taxa de falha (%)
- Tempo médio de envio
- E-mails na fila
- E-mails enviados por dia

### Logs
- [ ] Log de cada envio
- [ ] Log de falhas
- [ ] Log de retries
- [ ] Log de configurações alteradas

---

## 🚀 Próximos Passos Imediatos

1. **Instalar dependências** (30 min)
   ```bash
   npm install nodemailer @types/nodemailer
   ```

2. **Criar estrutura base** (1 dia)
   - Criar diretórios
   - Criar interfaces
   - Criar serviço base

3. **Implementar provedor SMTP** (1 dia)
   - Configuração SMTP
   - Função de envio
   - Testes básicos

4. **Criar templates** (1 dia)
   - Template de boletim
   - Template de alerta
   - Sistema de variáveis

5. **Integrar com notificações** (1 dia)
   - Substituir envio simulado
   - Testar envio real
   - Verificar recebimento

---

## ⚠️ Pontos de Atenção

1. **Limites de Envio**: Gmail tem limite de 500 e-mails/dia
2. **Spam**: Implementar rate limiting e validação
3. **LGPD**: Obter consentimento para envio de e-mails
4. **Bounce**: Tratar e-mails inválidos
5. **Unsubscribe**: Implementar opção de descadastro
6. **Templates**: Manter compatibilidade com clientes de e-mail
7. **Anexos**: Limitar tamanho de anexos

---

## 📚 Documentação

### Documentação Técnica
- [ ] Documentar API do serviço de e-mail
- [ ] Documentar configuração SMTP
- [ ] Documentar sistema de templates
- [ ] Documentar variáveis disponíveis

### Documentação de Usuário
- [ ] Guia de configuração SMTP
- [ ] Guia de criação de templates
- [ ] Guia de envio de e-mails
- [ ] FAQ sobre problemas comuns

---

## 🔗 Referências

- [Nodemailer Documentation](https://nodemailer.com/)
- [SendGrid API](https://docs.sendgrid.com/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Gmail API](https://developers.google.com/gmail/api)

