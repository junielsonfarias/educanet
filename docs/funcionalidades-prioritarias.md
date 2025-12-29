# Funcionalidades Prioritárias para Implementação

Data de Atualização: 2025-01-27

## 🔴 PRIORIDADE MÁXIMA - Documentos Escolares Obrigatórios

### 1. GESTÃO DE DOCUMENTOS ESCOLARES

**Status Atual:** ⚠️ Parcialmente implementado  
**Impacto:** Crítico - Documentos exigidos por lei

#### Funcionalidades a Implementar:

- [ ] **Histórico Escolar**
  - Geração automática com todas as séries cursadas
  - Notas por disciplina e período
  - Frequência consolidada
  - Situação final (Aprovado/Reprovado)
  - Assinatura digital do diretor
  - Numeração sequencial
  - Validação de dados antes de gerar

- [ ] **Declaração de Matrícula**
  - Geração automática ao matricular aluno
  - Dados do aluno e escola
  - Ano letivo e turma
  - Data de matrícula
  - Validade do documento
  - Reimpressão de 2ª via

- [ ] **Ficha Individual do Aluno (Censo Escolar)**
  - Todos os dados do Educacenso
  - Histórico completo de matrículas
  - Dados de desempenho
  - Situação atual
  - Exportação em formato padrão

- [ ] **Declaração de Transferência**
  - Dados do aluno
  - Escola de origem e destino
  - Motivo da transferência
  - Histórico resumido
  - Data de saída
  - Pendências (dependências, documentos)

- [ ] **Ata de Resultados Finais**
  - Lista de todos os alunos da turma
  - Resultado final por aluno
  - Aprovação/Reprovação/Dependência
  - Assinatura do conselho de classe
  - Numeração sequencial por ano
  - Arquivo PDF assinável

- [ ] **Certificado de Conclusão**
  - Para alunos concluintes
  - Dados do curso concluído
  - Data de conclusão
  - Assinatura do diretor
  - Numeração sequencial
  - Validação de conclusão

---

## 🔴 PRIORIDADE MÁXIMA - Censo Escolar (Educacenso)

### 2. CENSO ESCOLAR - COMPLETAR DADOS

**Status Atual:** ⚠️ Campos parciais  
**Impacto:** Crítico - Obrigatório para recebimento de recursos

#### Funcionalidades a Implementar:

- [ ] **Dados Completos do Professor**
  - Formação acadêmica completa (graduação, pós, especialização)
  - Disciplinas habilitadas (por formação)
  - Situação funcional detalhada
  - Tipo de contrato (efetivo, temporário, terceirizado)
  - Carga horária total e por disciplina
  - Tempo de experiência docente
  - Certificações e cursos de formação

- [ ] **Dados de Infraestrutura Detalhados**
  - Salas de aula (quantidade, capacidade, acessibilidade)
  - Salas especiais (laboratórios, biblioteca, informática)
  - Banheiros (quantidade, acessibilidade)
  - Dependências (cozinha, refeitório, quadra, pátio)
  - Água (rede pública, poço, cisterna)
  - Energia (rede pública, gerador, sem energia)
  - Esgoto (rede pública, fossa, sem esgoto)
  - Internet (tipo de conexão, velocidade)
  - Equipamentos (computadores, projetores, TVs)

- [ ] **Dependências Administrativas Completas**
  - Secretaria (quantidade, equipamentos)
  - Direção (sala, equipamentos)
  - Coordenação (salas, equipamentos)
  - Almoxarifado
  - Sala de professores
  - Sala de reuniões
  - Outros espaços administrativos

- [ ] **Modalidades de Ensino**
  - Educação Infantil (creche, pré-escola)
  - Ensino Fundamental (anos iniciais, finais)
  - Ensino Médio
  - EJA (Educação de Jovens e Adultos)
  - Educação Especial
  - Educação Profissional
  - Atendimento em tempo integral

- [ ] **Validação dos Dados conforme Regras do INEP**
  - Validação de CPF de alunos e professores
  - Validação de INEP code da escola
  - Validação de idade vs série
  - Validação de matrículas duplicadas
  - Validação de dados obrigatórios
  - Geração de relatório de inconsistências
  - Exportação no formato Educacenso

---

## 🟡 PRIORIDADE ALTA - Comunicação e Notificações

### 3. COMUNICAÇÃO E NOTIFICAÇÕES

**Status Atual:** ⚠️ Básico  
**Impacto:** Alto - Melhora comunicação escola-família

#### Funcionalidades a Implementar:

- [ ] **Envio de E-mails para Responsáveis**
  - Configuração de SMTP
  - Templates de e-mail (boletim, frequência, avisos)
  - Envio automático de boletim
  - Envio automático de alertas (baixa frequência, notas)
  - Envio manual de comunicados
  - Histórico de e-mails enviados
  - Status de entrega (enviado, falhou, lido)

- [ ] **Envio de SMS para Responsáveis**
  - Integração com API de SMS (Twilio, Zenvia, etc)
  - Templates de SMS
  - Envio automático de alertas críticos
  - Envio manual de comunicados
  - Histórico de SMS enviados
  - Status de entrega

- [ ] **Notificações Push (Futuro)**
  - Sistema de notificações no navegador
  - Notificações no app mobile (quando implementado)
  - Preferências de notificação por usuário

---

## 🟡 PRIORIDADE ALTA - Secretaria Escolar

### 4. SECRETARIA ESCOLAR - PROTOCOLO E ATENDIMENTO

**Status Atual:** ⚠️ Parcial  
**Impacto:** Alto - Melhora atendimento ao público

#### Funcionalidades a Implementar:

- [ ] **Protocolo de Documentos**
  - Numeração sequencial automática
  - Tipos de protocolo (matrícula, transferência, declaração, recurso, outros)
  - Vinculação com aluno/escola
  - Status do protocolo (pendente, em andamento, concluído, cancelado)
  - Prazo de atendimento
  - Histórico de movimentações
  - Busca por número de protocolo

- [ ] **Controle de Expedição de Documentos**
  - Lista de documentos solicitados
  - Status de cada documento (solicitado, em preparação, pronto, entregue)
  - Data de solicitação e entrega
  - Responsável pela preparação
  - Observações
  - Anexos digitais

- [ ] **Fila de Atendimento**
  - Sistema de senhas
  - Tipos de atendimento (matrícula, documentos, informações)
  - Prioridades (normal, preferencial, urgente)
  - Tempo médio de atendimento
  - Chamada de senha
  - Relatório de atendimentos do dia

- [ ] **Agendamento de Atendimento**
  - Calendário de disponibilidade
  - Horários disponíveis
  - Tipos de atendimento agendáveis
  - Confirmação por e-mail/SMS
  - Lembretes automáticos
  - Cancelamento e reagendamento

- [ ] **Solicitações Online (Portal do Responsável)**
  - Login para responsáveis
  - Solicitação de 2ª via de documentos
  - Solicitação de declarações
  - Acompanhamento de protocolos
  - Download de documentos prontos
  - Histórico de solicitações

- [ ] **Histórico de Atendimentos**
  - Registro de todos os atendimentos
  - Busca por aluno, responsável, data
  - Estatísticas de atendimento
  - Tempo médio por tipo
  - Relatórios gerenciais

---

## 📋 RESUMO DE IMPLEMENTAÇÃO

### Fase 1 - Documentos Escolares (2-3 semanas)
1. Criar store de documentos
2. Implementar geradores de PDF
3. Criar interfaces de geração
4. Implementar histórico escolar
5. Implementar declaração de matrícula
6. Implementar ficha individual
7. Implementar declaração de transferência
8. Implementar ata de resultados
9. Implementar certificado

### Fase 2 - Censo Escolar (2-3 semanas)
1. Atualizar interfaces de Teacher e School
2. Criar formulários completos
3. Implementar validações do INEP
4. Criar exportador Educacenso
5. Criar relatório de inconsistências
6. Testar exportação

### Fase 3 - Comunicação (1-2 semanas)
1. Configurar serviço de e-mail
2. Criar templates
3. Implementar envio automático
4. Integrar SMS (opcional)
5. Criar painel de notificações

### Fase 4 - Secretaria (2-3 semanas)
1. Criar sistema de protocolos
2. Implementar fila de atendimento
3. Criar agendamento
4. Implementar solicitações online
5. Criar histórico e relatórios

---

## 🎯 MÉTRICAS DE SUCESSO

### Documentos Escolares
- ✅ Geração de histórico em < 5 segundos
- ✅ 100% dos documentos com numeração sequencial
- ✅ Assinatura digital funcional
- ✅ Reimpressão de 2ª via disponível

### Censo Escolar
- ✅ 100% dos campos obrigatórios preenchidos
- ✅ Exportação sem erros de validação
- ✅ Compatibilidade com formato INEP

### Comunicação
- ✅ 95% de taxa de entrega de e-mails
- ✅ Notificações automáticas funcionando
- ✅ Templates personalizáveis

### Secretaria
- ✅ Protocolo gerado em < 1 minuto
- ✅ Fila de atendimento operacional
- ✅ Agendamento online funcional
- ✅ Solicitações online disponíveis

---

## 📝 NOTAS IMPORTANTES

1. **Documentos Escolares** são obrigatórios por lei - prioridade máxima
2. **Censo Escolar** é necessário para recebimento de recursos federais
3. **Comunicação** melhora significativamente o relacionamento escola-família
4. **Protocolo** organiza e agiliza atendimento ao público

5. Todas as funcionalidades devem manter **compatibilidade com dados existentes**
6. Implementar **validações robustas** antes de gerar documentos
7. Considerar **LGPD** ao implementar comunicação e protocolos
8. Documentar **processos e fluxos** de cada funcionalidade

---

## 🔄 INTEGRAÇÕES NECESSÁRIAS

### Para Comunicação:
- Serviço de e-mail (SendGrid, AWS SES, etc)
- Serviço de SMS (Twilio, Zenvia, etc)
- Configuração de variáveis de ambiente

### Para Documentos:
- Biblioteca de geração de PDF (jsPDF, PDFKit, etc)
- Sistema de assinatura digital (futuro)
- Armazenamento de documentos gerados

### Para Censo:
- Validação de CPF/CNPJ
- Validação de INEP codes
- Formato de exportação do MEC

