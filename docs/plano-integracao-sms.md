# Plano de Implementação - Integração SMS

**Data de Criação:** 2025-01-27  
**Status:** 📋 Planejamento  
**Prioridade:** 🟡 Média  
**Estimativa:** 1 semana

## 📋 Objetivo

Implementar integração com serviço de SMS para envio de notificações críticas, alertas e lembretes aos responsáveis, complementando o sistema de e-mail.

---

## 🎯 Escopo

### Funcionalidades a Implementar

#### 1. Configuração de Provedor SMS
- [ ] Suporte a múltiplos provedores (Twilio, Zenvia, etc)
- [ ] Configuração de API keys
- [ ] Configuração de número remetente
- [ ] Teste de conexão
- [ ] Validação de credenciais

#### 2. Templates de SMS
- [ ] Templates para alertas críticos
- [ ] Templates para lembretes
- [ ] Templates para notificações
- [ ] Limite de caracteres (160)
- [ ] Variáveis dinâmicas
- [ ] Preview de templates

#### 3. Envio de SMS
- [ ] Envio individual
- [ ] Envio em massa
- [ ] Envio agendado
- [ ] Fila de envio
- [ ] Retry automático
- [ ] Rate limiting
- [ ] Logs de envio
- [ ] Status de entrega

#### 4. Integração com Sistema
- [ ] Integrar com alertas existentes
- [ ] Envio automático de alertas críticos
- [ ] Envio automático de lembretes
- [ ] Envio manual
- [ ] Histórico de SMS enviados
- [ ] Relatórios de envio

---

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── services/
│   ├── sms/
│   │   ├── index.ts                    # Exportações principais
│   │   ├── sms-service.ts              # Serviço principal
│   │   ├── sms-queue.ts                # Fila de envio
│   │   ├── sms-templates.ts            # Gerenciamento de templates
│   │   ├── sms-validator.ts            # Validação de telefones
│   │   └── types.ts                    # Tipos TypeScript
│   └── providers/
│       ├── twilio-provider.ts          # Provedor Twilio
│       ├── zenvia-provider.ts          # Provedor Zenvia
│       ├── aws-sns-provider.ts         # Provedor AWS SNS
│       └── mock-provider.ts            # Provedor mock (desenvolvimento)
├── stores/
│   └── useSmsStore.tsx                 # Store para configuração
└── pages/
    └── settings/
        └── SmsSettings.tsx            # Página de configuração
```

### Interfaces TypeScript

```typescript
// Configuração SMS
export interface SMSConfig {
  provider: 'twilio' | 'zenvia' | 'aws-sns' | 'mock'
  apiKey?: string
  apiSecret?: string
  accountSid?: string // Twilio
  fromNumber?: string
  region?: string // AWS
}

// SMS
export interface SMS {
  to: string // Número de telefone (formato internacional)
  message: string
  scheduledAt?: Date
}

// Template
export interface SMSTemplate {
  id: string
  name: string
  message: string
  variables: string[]
  category: 'alerta' | 'lembrete' | 'notificacao'
  maxLength: number // 160 caracteres padrão
}

// Resultado de envio
export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
  sentAt: Date
  to: string
  cost?: number // Custo do SMS
}
```

---

## 📝 Fases de Implementação

### Fase 1: Infraestrutura Base (1-2 dias)
- [ ] Criar estrutura de diretórios
- [ ] Criar interfaces TypeScript
- [ ] Criar serviço base de SMS
- [ ] Criar sistema de templates
- [ ] Criar store de configuração
- [ ] Configurar variáveis de ambiente
- [ ] Criar provedor mock (desenvolvimento)

### Fase 2: Provedores SMS (2-3 dias)
- [ ] Implementar provedor Twilio
- [ ] Implementar provedor Zenvia
- [ ] Implementar provedor AWS SNS (opcional)
- [ ] Sistema de seleção de provedor
- [ ] Testes de conexão
- [ ] Tratamento de erros por provedor

### Fase 3: Templates e Envio (2 dias)
- [ ] Criar templates SMS base
- [ ] Implementar sistema de variáveis
- [ ] Implementar validação de tamanho (160 chars)
- [ ] Implementar envio individual
- [ ] Implementar envio em massa
- [ ] Implementar fila de envio
- [ ] Implementar retry automático
- [ ] Testes de envio

### Fase 4: Integração (1-2 dias)
- [ ] Integrar com sistema de alertas
- [ ] Implementar envio automático de alertas críticos
- [ ] Implementar envio automático de lembretes
- [ ] Criar interface de envio manual
- [ ] Criar histórico de envios
- [ ] Criar relatórios

### Fase 5: Interface de Configuração (1 dia)
- [ ] Criar página de configuração SMS
- [ ] Criar formulário de configuração
- [ ] Implementar teste de conexão
- [ ] Criar gerenciador de templates
- [ ] Criar editor de templates

---

## 🔧 Dependências e Ferramentas

### Bibliotecas Necessárias

#### Opção 1: Twilio
```bash
npm install twilio
```
- ✅ API simples e confiável
- ✅ Boa documentação
- ✅ Suporte internacional
- ⚠️ Requer conta e créditos

#### Opção 2: Zenvia (Brasil)
```bash
npm install @zenvia/sdk
```
- ✅ Focado no Brasil
- ✅ Preços competitivos
- ✅ Suporte em português
- ⚠️ Requer conta e créditos

#### Opção 3: AWS SNS
```bash
npm install @aws-sdk/client-sns
```
- ✅ Escalável
- ✅ Baixo custo
- ✅ Integração com AWS
- ⚠️ Requer conta AWS

### Recomendação
**Começar com Twilio** (mais popular e documentado) e adicionar Zenvia como alternativa para o Brasil.

---

## 📋 Templates de SMS

### Template de Alerta Crítico

```
Alerta: {{alertType}}
{{studentName}} - {{message}}
Escola: {{schoolName}}
Data: {{date}}
```

### Template de Lembrete

```
Lembrete: {{reminderType}}
{{message}}
Data: {{date}}
Escola: {{schoolName}}
```

### Template de Notificação

```
Notificação: {{notificationType}}
{{message}}
{{link}} (se disponível)
```

---

## ✅ Critérios de Sucesso

### Funcionalidade
- ✅ 95%+ de taxa de entrega de SMS
- ✅ Envio em < 3 segundos por SMS
- ✅ Suporte a envio em massa
- ✅ Templates funcionando
- ✅ Histórico completo de envios

### Segurança
- ✅ Credenciais em variáveis de ambiente
- ✅ Validação de números de telefone
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
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+5511999999999

# Opcional: Zenvia
ZENVIA_API_KEY=xxxxx
ZENVIA_FROM_NUMBER=5511999999999

# Opcional: AWS SNS
AWS_SNS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
```

### Boas Práticas
- ✅ Nunca commitar credenciais
- ✅ Usar variáveis de ambiente
- ✅ Validar números antes de enviar
- ✅ Implementar rate limiting
- ✅ Logs sem informações sensíveis
- ✅ Obter consentimento para SMS (LGPD)

---

## 🧪 Estratégia de Testes

### Testes Unitários
- [ ] Testar validação de telefone
- [ ] Testar renderização de templates
- [ ] Testar substituição de variáveis
- [ ] Testar validação de tamanho (160 chars)

### Testes de Integração
- [ ] Testar conexão com provedor
- [ ] Testar envio de SMS
- [ ] Testar envio em massa
- [ ] Testar fila de envio
- [ ] Testar retry automático

### Testes de Aceitação
- [ ] Enviar SMS de teste
- [ ] Verificar recebimento
- [ ] Verificar formatação
- [ ] Testar com diferentes provedores

---

## 📊 Monitoramento

### Métricas a Acompanhar
- Taxa de entrega (%)
- Taxa de falha (%)
- Tempo médio de envio
- SMS na fila
- SMS enviados por dia
- Custo total

### Logs
- [ ] Log de cada envio
- [ ] Log de falhas
- [ ] Log de retries
- [ ] Log de configurações alteradas

---

## 🚀 Próximos Passos Imediatos

1. **Instalar dependências** (30 min)
   ```bash
   npm install twilio
   ```

2. **Criar estrutura base** (1 dia)
   - Criar diretórios
   - Criar interfaces
   - Criar serviço base

3. **Implementar provedor Twilio** (1 dia)
   - Configuração Twilio
   - Função de envio
   - Testes básicos

4. **Criar templates** (1 dia)
   - Templates de alerta
   - Templates de lembrete
   - Sistema de variáveis

5. **Integrar com alertas** (1 dia)
   - Substituir notificações
   - Testar envio real
   - Verificar recebimento

---

## ⚠️ Pontos de Atenção

1. **Custos**: SMS tem custo por mensagem
2. **Limites**: Provedores têm limites de envio
3. **LGPD**: Obter consentimento para SMS
4. **Formato**: Validar formato internacional (+55...)
5. **Tamanho**: Limitar a 160 caracteres
6. **Horário**: Considerar horário para envio
7. **Opt-out**: Implementar descadastro

---

## 📚 Documentação

### Documentação Técnica
- [ ] Documentar API do serviço SMS
- [ ] Documentar configuração de provedores
- [ ] Documentar sistema de templates
- [ ] Documentar variáveis disponíveis

### Documentação de Usuário
- [ ] Guia de configuração SMS
- [ ] Guia de criação de templates
- [ ] Guia de envio de SMS
- [ ] FAQ sobre problemas comuns

---

## 🔗 Referências

- [Twilio Documentation](https://www.twilio.com/docs)
- [Zenvia API](https://developers.zenvia.com/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)

