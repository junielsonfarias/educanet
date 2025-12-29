# Plano de Implementação - Validações INEP Completas

**Data de Criação:** 2025-01-27  
**Status:** 📋 Planejamento  
**Prioridade:** 🔴 Alta  
**Estimativa:** 2-3 semanas

## 📋 Objetivo

Implementar validações completas conforme as regras e especificações do INEP (Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira) para garantir conformidade com o Censo Escolar e facilitar a exportação de dados no formato Educacenso.

---

## 🎯 Escopo

### Validações a Implementar

#### 1. Validação de CPF/CNPJ
- [ ] Criar utilitário de validação de CPF
- [ ] Criar utilitário de validação de CNPJ
- [ ] Integrar validação em formulários de alunos
- [ ] Integrar validação em formulários de professores
- [ ] Integrar validação em formulários de escolas
- [ ] Mensagens de erro claras e específicas
- [ ] Máscara de entrada automática
- [ ] Validação de dígitos verificadores

#### 2. Validação de Código INEP
- [ ] Validar formato do código INEP da escola (8 dígitos)
- [ ] Validar códigos de etapa de ensino (01-15)
- [ ] Validar códigos de modalidade de ensino
- [ ] Validar códigos de tipo de atendimento
- [ ] Validar códigos de tipo de mediação didático-pedagógica
- [ ] Validar códigos de tipo de regime
- [ ] Verificar unicidade de códigos INEP
- [ ] Mensagens de erro específicas por tipo de código

#### 3. Validação de Idade vs Série
- [ ] Criar regras de idade mínima por série/ano
- [ ] Criar regras de idade máxima por série/ano
- [ ] Validar idade na matrícula
- [ ] Alertar sobre distorção idade-série
- [ ] Permitir exceções justificadas
- [ ] Calcular idade corretamente (considerando data de corte)
- [ ] Integrar com relatório de distorção idade-série

#### 4. Validação de Matrículas
- [ ] Validar matrículas duplicadas (mesmo aluno, mesmo ano)
- [ ] Validar matrículas simultâneas em múltiplas escolas
- [ ] Validar status de matrícula (Cursando, Transferido, etc)
- [ ] Validar relacionamentos (escola, ano letivo, turma)
- [ ] Validar período de matrícula (dentro do ano letivo)
- [ ] Validar capacidade da turma
- [ ] Validar turno e modalidade

#### 5. Validação de Dados Obrigatórios
- [ ] Criar lista de campos obrigatórios por entidade
- [ ] Validar dados de aluno (nome, CPF, data nascimento, etc)
- [ ] Validar dados de professor (formação, habilitação, etc)
- [ ] Validar dados de escola (nome, INEP, endereço, etc)
- [ ] Validar dados de turma (etapa, série, turno, etc)
- [ ] Validar dados de infraestrutura
- [ ] Mensagens de erro específicas por campo

#### 6. Validação de Relacionamentos
- [ ] Validar que turma pertence à escola
- [ ] Validar que turma pertence ao ano letivo
- [ ] Validar que série/ano pertence à etapa de ensino
- [ ] Validar que disciplina pertence à série/ano
- [ ] Validar que professor está habilitado para disciplina
- [ ] Validar que aluno está na série/ano correta
- [ ] Validar que avaliação pertence à turma/disciplina

#### 7. Validação de Datas
- [ ] Validar formato de datas (DD/MM/YYYY)
- [ ] Validar datas lógicas (nascimento < matrícula)
- [ ] Validar período letivo (início < fim)
- [ ] Validar datas de avaliações (dentro do período)
- [ ] Validar datas de frequência (dentro do período)
- [ ] Validar data de corte para idade (31/03)
- [ ] Validar datas futuras (não permitir)

#### 8. Validação de Números e Códigos
- [ ] Validar formato de telefone
- [ ] Validar formato de CEP
- [ ] Validar formato de registro escolar
- [ ] Validar códigos numéricos (INEP, CPF, etc)
- [ ] Validar valores numéricos (notas, idades, etc)
- [ ] Validar faixas de valores (notas 0-10, idades razoáveis, etc)

---

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── lib/
│   ├── validations/
│   │   ├── index.ts                    # Exportações principais
│   │   ├── cpf-cnpj-validator.ts       # Validação CPF/CNPJ
│   │   ├── inep-code-validator.ts      # Validação códigos INEP
│   │   ├── age-grade-validator.ts      # Validação idade vs série
│   │   ├── enrollment-validator.ts     # Validação de matrículas
│   │   ├── required-fields-validator.ts # Validação campos obrigatórios
│   │   ├── relationship-validator.ts   # Validação relacionamentos
│   │   ├── date-validator.ts          # Validação de datas
│   │   ├── number-validator.ts        # Validação números/códigos
│   │   └── types.ts                    # Tipos TypeScript
│   └── inep-rules/
│       ├── index.ts                    # Regras INEP
│       ├── age-rules.ts                # Regras de idade por série
│       ├── code-mappings.ts            # Mapeamento de códigos
│       └── required-fields.ts          # Campos obrigatórios por entidade
```

### Interfaces TypeScript

```typescript
// Tipos de validação
export type ValidationResult = {
  valid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

export type ValidationError = {
  field: string
  code: string
  message: string
  severity: 'error' | 'warning'
}

export type ValidationWarning = {
  field: string
  code: string
  message: string
  suggestion?: string
}

// Validações específicas
export interface CPFValidationResult extends ValidationResult {
  formatted?: string
  isValidFormat: boolean
  isValidChecksum: boolean
}

export interface AgeGradeValidationResult extends ValidationResult {
  age: number
  expectedAgeRange: { min: number; max: number }
  isInRange: boolean
  distortion?: 'above' | 'below' | null
}
```

---

## 📝 Fases de Implementação

### Fase 1: Infraestrutura Base (3-4 dias)
- [ ] Criar estrutura de diretórios
- [ ] Criar interfaces TypeScript
- [ ] Criar utilitário base de validação
- [ ] Criar sistema de mensagens de erro
- [ ] Criar tipos de erro padronizados
- [ ] Configurar testes unitários básicos

### Fase 2: Validações Básicas (4-5 dias)
- [ ] Implementar validação de CPF
- [ ] Implementar validação de CNPJ
- [ ] Implementar validação de códigos INEP
- [ ] Implementar validação de datas
- [ ] Implementar validação de números
- [ ] Criar máscaras de entrada
- [ ] Testar todas as validações básicas

### Fase 3: Validações de Negócio (5-6 dias)
- [ ] Implementar validação idade vs série
- [ ] Implementar validação de matrículas
- [ ] Implementar validação de relacionamentos
- [ ] Implementar validação de campos obrigatórios
- [ ] Criar regras INEP (arquivo de configuração)
- [ ] Testar validações de negócio

### Fase 4: Integração (3-4 dias)
- [ ] Integrar validações em formulários de alunos
- [ ] Integrar validações em formulários de professores
- [ ] Integrar validações em formulários de escolas
- [ ] Integrar validações em formulários de turmas
- [ ] Integrar validações em formulários de matrícula
- [ ] Adicionar feedback visual (erros em tempo real)
- [ ] Testar integração completa

### Fase 5: Relatório de Inconsistências (2-3 dias)
- [ ] Criar componente de relatório
- [ ] Implementar busca de inconsistências
- [ ] Implementar exportação de relatório
- [ ] Criar página de validação em lote
- [ ] Adicionar filtros e ordenação
- [ ] Testar relatório completo

### Fase 6: Exportador Educacenso (3-4 dias)
- [ ] Estudar formato Educacenso atual
- [ ] Criar mapeamento de dados para formato INEP
- [ ] Implementar exportador de dados
- [ ] Validar formato de exportação
- [ ] Criar interface de exportação
- [ ] Testar exportação completa

---

## 🔧 Dependências e Ferramentas

### Bibliotecas Necessárias
- [ ] `cpf-cnpj-validator` ou implementação própria
- [ ] `date-fns` (já instalado) - manipulação de datas
- [ ] `zod` (já instalado) - validação de schemas
- [ ] Biblioteca de máscaras (opcional)

### Documentação de Referência
- [ ] Manual do Censo Escolar (INEP)
- [ ] Especificações do formato Educacenso
- [ ] Regras de validação do MEC
- [ ] Documentação de códigos INEP

---

## ✅ Critérios de Sucesso

### Validações
- ✅ 100% dos campos obrigatórios validados
- ✅ 100% dos CPFs/CNPJs validados corretamente
- ✅ 100% dos códigos INEP validados
- ✅ 0% de matrículas duplicadas não detectadas
- ✅ 100% das idades validadas contra série
- ✅ Mensagens de erro claras e acionáveis

### Performance
- ✅ Validação em tempo real (< 100ms)
- ✅ Validação em lote (< 5s para 1000 registros)
- ✅ Exportação Educacenso (< 30s para escola média)

### Qualidade
- ✅ Cobertura de testes > 80%
- ✅ 0 erros de validação falsos positivos
- ✅ 0 erros de validação falsos negativos
- ✅ Documentação completa

---

## 📊 Regras de Validação INEP

### Idade por Série/Ano

| Série/Ano | Idade Mínima | Idade Máxima | Data de Corte |
|-----------|--------------|--------------|---------------|
| 1º Ano EF | 6 anos | 8 anos | 31/03 |
| 2º Ano EF | 7 anos | 9 anos | 31/03 |
| 3º Ano EF | 8 anos | 10 anos | 31/03 |
| 4º Ano EF | 9 anos | 11 anos | 31/03 |
| 5º Ano EF | 10 anos | 12 anos | 31/03 |
| 6º Ano EF | 11 anos | 13 anos | 31/03 |
| 7º Ano EF | 12 anos | 14 anos | 31/03 |
| 8º Ano EF | 13 anos | 15 anos | 31/03 |
| 9º Ano EF | 14 anos | 16 anos | 31/03 |
| 1º Ano EM | 15 anos | 17 anos | 31/03 |
| 2º Ano EM | 16 anos | 18 anos | 31/03 |
| 3º Ano EM | 17 anos | 19 anos | 31/03 |

### Códigos INEP - Etapas de Ensino

| Código | Descrição |
|--------|-----------|
| 01 | Educação Infantil - Creche |
| 02 | Educação Infantil - Pré-escola |
| 03 | Ensino Fundamental - Anos Iniciais |
| 04 | Ensino Fundamental - Anos Finais |
| 05 | Ensino Fundamental - 8 e 9 anos |
| 06 | Ensino Fundamental - 9 anos |
| 07 | Ensino Médio - Normal/Magistério |
| 08 | Ensino Médio |
| 09 | Ensino Médio Integrado |
| 10 | EJA - Ensino Fundamental |
| 11 | EJA - Ensino Médio |
| 14 | Educação Especial |
| 15 | Educação Profissional |

### Campos Obrigatórios por Entidade

#### Aluno
- Nome completo
- CPF (se maior de idade ou responsável)
- Data de nascimento
- Sexo
- Raça/Cor
- Nacionalidade
- Nome da mãe
- Endereço completo
- Telefone de contato

#### Professor
- Nome completo
- CPF
- Data de nascimento
- Formação acadêmica
- Disciplinas habilitadas
- Situação funcional
- Tipo de contrato

#### Escola
- Nome
- Código INEP
- Endereço completo
- Telefone
- Email
- Diretor
- Dependência administrativa
- Localização

#### Turma
- Nome
- Etapa de Ensino (código INEP)
- Série/Ano
- Turno
- Modalidade
- Tipo de Regime
- Ano Letivo

---

## 🧪 Estratégia de Testes

### Testes Unitários
- [ ] Testar cada função de validação isoladamente
- [ ] Testar casos válidos
- [ ] Testar casos inválidos
- [ ] Testar casos extremos
- [ ] Testar mensagens de erro

### Testes de Integração
- [ ] Testar validação em formulários
- [ ] Testar validação em lote
- [ ] Testar exportação Educacenso
- [ ] Testar relatório de inconsistências

### Testes de Aceitação
- [ ] Validar com dados reais
- [ ] Validar com dados do Censo Escolar
- [ ] Validar exportação com INEP (se possível)

---

## 📚 Documentação

### Documentação Técnica
- [ ] Documentar cada função de validação
- [ ] Documentar regras INEP implementadas
- [ ] Documentar formatos de erro
- [ ] Documentar como adicionar novas validações

### Documentação de Usuário
- [ ] Criar guia de uso das validações
- [ ] Documentar mensagens de erro
- [ ] Criar FAQ sobre validações
- [ ] Criar tutoriais em vídeo

---

## 🚀 Próximos Passos Imediatos

1. **Criar estrutura base** (1 dia)
   - Criar diretórios e arquivos base
   - Configurar tipos TypeScript
   - Criar utilitário base

2. **Implementar validação CPF/CNPJ** (1 dia)
   - Função de validação
   - Máscara de entrada
   - Testes unitários

3. **Implementar validação códigos INEP** (1 dia)
   - Validação de formato
   - Validação de valores permitidos
   - Testes unitários

4. **Integrar em formulários** (2 dias)
   - Formulário de aluno
   - Formulário de professor
   - Formulário de escola

---

## ⚠️ Pontos de Atenção

1. **Performance**: Validações em tempo real não devem travar a UI
2. **UX**: Mensagens de erro devem ser claras e acionáveis
3. **Compatibilidade**: Manter compatibilidade com dados existentes
4. **Atualizações**: Regras INEP podem mudar anualmente
5. **LGPD**: Validar dados pessoais com cuidado (CPF, etc)

---

## 📈 Métricas de Acompanhamento

- **Cobertura de Validações**: % de campos validados
- **Taxa de Erros**: % de validações que falham
- **Tempo de Validação**: Tempo médio de validação
- **Satisfação do Usuário**: Feedback sobre mensagens de erro
- **Conformidade INEP**: % de dados exportáveis sem erros

---

## 🔗 Referências

- [Manual do Censo Escolar](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar)
- [Especificações Educacenso](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar/documentos-tecnicos)
- [Códigos INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar/documentos-tecnicos)

