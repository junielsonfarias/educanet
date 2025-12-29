# Migração de Nomenclatura - Alinhamento com Censo Escolar

**Data:** 2025-01-27  
**Objetivo:** Alinhar a nomenclatura do sistema com os termos oficiais do Censo Escolar (Educacenso) do INEP.

## 📋 Análise da Estrutura Atual

### Estrutura Hierárquica Atual
```
Escola (School)
  └── Ano Letivo (AcademicYear)
      └── Turma (Classroom)
          └── gradeId → Grade (do Course)
              └── Série/Ano (representado por Grade.name)
```

### Problemas Identificados

1. **Nomenclatura Inconsistente:**
   - `Grade` representa "Série/Ano", mas o nome é ambíguo
   - `Course` representa "Etapa de Ensino", mas o nome é genérico
   - Falta clareza sobre o que é "Série" vs "Ano"

2. **Campos Faltantes (Censo Escolar):**
   - Etapa de Ensino na Turma (obrigatório no Censo)
   - Código do Censo para Etapa de Ensino
   - Campos adicionais de modalidade e tipo de atendimento

## 🎯 Nomenclatura do Censo Escolar

### Termos Oficiais

| Termo | Definição | Código INEP |
|-------|-----------|-------------|
| **Escola** | Unidade física e administrativa | Código INEP único |
| **Ano Letivo** | Período de atividades escolares | Ano civil (ex: 2024) |
| **Turma** | Grupo de alunos que compartilham espaço e tempo | Código único por turma |
| **Série/Ano** | Progressão anual (1º ao 9º no Fundamental, 1º ao 3º no Médio) | - |
| **Etapa de Ensino** | Educação Infantil, Ensino Fundamental, Ensino Médio | 01, 02, 03, etc. |
| **Modalidade** | Regular, EJA, Especial, Profissional, etc. | - |

### Códigos de Etapa de Ensino (INEP)

- **01** - Educação Infantil - Creche
- **02** - Educação Infantil - Pré-escola
- **03** - Ensino Fundamental - Anos Iniciais
- **04** - Ensino Fundamental - Anos Finais
- **05** - Ensino Fundamental - 8 e 9 anos
- **06** - Ensino Fundamental - 9 anos
- **07** - Ensino Médio - Normal/Magistério
- **08** - Ensino Médio
- **09** - Ensino Médio Integrado
- **10** - EJA - Ensino Fundamental
- **11** - EJA - Ensino Médio
- **14** - Educação Especial
- **15** - Educação Profissional

## 🔄 Plano de Migração

### Fase 1: Renomeação de Interfaces

#### Mapeamento de Nomenclatura

| Atual | Novo | Descrição |
|-------|------|-----------|
| `Classroom` | `Turma` | Grupo de alunos |
| `AcademicYear` | `AnoLetivo` | Período letivo |
| `Grade` | `SerieAno` | Série/Ano escolar |
| `Course` | `EtapaEnsino` | Etapa de ensino |
| `gradeId` | `serieAnoId` | Referência à série/ano |
| `classes` | `turmas` | Array de turmas |

#### Estrutura Proposta

```typescript
// NOVA ESTRUTURA
interface SerieAno {
  id: string
  name: string // Ex: "1º Ano", "2º Ano", "3º Ano"
  numero: number // 1, 2, 3, 4, 5, 6, 7, 8, 9 (para ordenação)
  subjects: Subject[]
  evaluationRuleId?: string
}

interface EtapaEnsino {
  id: string
  name: string // Ex: "Educação Infantil", "Ensino Fundamental", "Ensino Médio"
  codigoCenso: string // Ex: "01", "02", "03" (código do INEP)
  seriesAnos: SerieAno[]
}

interface Turma {
  id: string
  name: string
  serieAnoId: string // Referência a SerieAno
  etapaEnsinoId: string // NOVO: Referência direta à Etapa de Ensino
  shift: 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral'
  modalidadeEnsino: string // Ex: "Regular", "EJA", "Especial"
  tipoAtendimento?: string // Ex: "Regular", "AEE", "Hospitalar"
  tipoMediacaoDidaticoPedagogico?: string // Ex: "Presencial", "EAD"
  tipoRegime?: string // Ex: "Seriado", "Nao Seriado"
  codigoTurmaCenso?: string // Código único do Censo
  // ... outros campos existentes
}

interface AnoLetivo {
  id: string
  name: string // Ex: "2024", "2024/2025"
  ano: number // 2024, 2025 (para ordenação)
  startDate: string
  endDate: string
  status: 'pending' | 'active' | 'finished'
  periods: Period[]
  turmas: Turma[] // Renomear classes para turmas
}
```

### Fase 2: Compatibilidade com Código Existente

Para manter compatibilidade durante a migração, criaremos aliases TypeScript:

```typescript
// Aliases para compatibilidade
export type Classroom = Turma
export type AcademicYear = AnoLetivo
export type Grade = SerieAno
export type Course = EtapaEnsino
```

### Fase 3: Atualização de Stores

- `useSchoolStore`: Atualizar referências de `classes` para `turmas`
- `useCourseStore`: Renomear para `useEtapaEnsinoStore` ou manter com aliases
- Atualizar todos os métodos que usam `gradeId` para `serieAnoId`

### Fase 4: Atualização de Componentes

#### Componentes Principais

1. **ClassroomDialog** → **TurmaDialog**
   - Adicionar campo `etapaEnsinoId`
   - Atualizar labels para "Turma", "Série/Ano", "Etapa de Ensino"
   - Adicionar campos de modalidade e tipo de atendimento

2. **SchoolFormDialog**
   - Manter estrutura, mas atualizar referências internas

3. **Páginas de Listagem**
   - Atualizar títulos e labels
   - Atualizar filtros e buscas

### Fase 5: Atualização de Dados Mock

- Atualizar `mockSchools` com nova estrutura
- Atualizar `mockCourses` para `mockEtapasEnsino`
- Garantir que todos os relacionamentos estejam corretos

## 📝 Checklist de Implementação

### Interfaces e Tipos
- [ ] Renomear `Grade` → `SerieAno`
- [ ] Renomear `Course` → `EtapaEnsino`
- [ ] Renomear `Classroom` → `Turma`
- [ ] Renomear `AcademicYear` → `AnoLetivo`
- [ ] Adicionar campo `etapaEnsinoId` em `Turma`
- [ ] Adicionar campo `codigoCenso` em `EtapaEnsino`
- [ ] Adicionar campo `numero` em `SerieAno`
- [ ] Adicionar campos opcionais de modalidade em `Turma`
- [ ] Criar aliases TypeScript para compatibilidade

### Stores
- [ ] Atualizar `useSchoolStore` (classes → turmas)
- [ ] Atualizar `useCourseStore` (renomear ou criar aliases)
- [ ] Atualizar métodos que usam `gradeId` → `serieAnoId`

### Componentes
- [ ] Atualizar `ClassroomDialog` → `TurmaDialog`
- [ ] Atualizar `SchoolFormDialog`
- [ ] Atualizar todas as páginas de listagem
- [ ] Atualizar componentes de seleção (Select, etc)
- [ ] Atualizar labels e textos da UI

### Dados Mock
- [ ] Atualizar `mockSchools`
- [ ] Atualizar `mockCourses` → `mockEtapasEnsino`
- [ ] Garantir relacionamentos corretos

### Testes e Validação
- [ ] Verificar que não há erros de compilação
- [ ] Testar criação de turmas
- [ ] Testar criação de anos letivos
- [ ] Testar relacionamentos entre entidades
- [ ] Verificar exportação de dados

## 🚀 Ordem de Implementação

1. **Criar novas interfaces** com aliases para compatibilidade
2. **Atualizar mock-data.ts** gradualmente
3. **Atualizar stores** uma por uma
4. **Atualizar componentes** começando pelos mais críticos
5. **Atualizar páginas** e rotas
6. **Remover aliases** após migração completa (opcional)

## ⚠️ Notas Importantes

- Manter compatibilidade durante a migração usando aliases
- Testar cada fase antes de prosseguir
- Documentar todas as mudanças
- Atualizar documentação de relacionamentos
- Considerar impacto em relatórios e exportações

## 📚 Referências

- [Censo Escolar - INEP](https://www.gov.br/inep/pt-br/acesso-a-informacao/perguntas-frequentes/censo-escolar)
- [Educacenso - Manual do Usuário](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar)

