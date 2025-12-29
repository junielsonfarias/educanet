# Implementação - Validações INEP

**Data de Início:** 2025-01-27  
**Status:** 🟡 Em Implementação (60% concluído)  
**Prioridade:** 🔴 Alta

## 📋 Objetivo

Implementar validações completas conforme regras do INEP para garantir conformidade com o Censo Escolar.

---

## ✅ Implementações Realizadas

### 1. Validação de CPF/CNPJ
- ✅ Criado `src/lib/validations/cpf-cnpj-validator.ts`
- ✅ Algoritmo de validação de dígitos verificadores
- ✅ Formatação automática (XXX.XXX.XXX-XX para CPF, XX.XXX.XXX/XXXX-XX para CNPJ)
- ✅ Funções: `validateCPF()`, `validateCNPJ()`, `validateCPForCNPJ()`, `formatCPF()`, `formatCNPJ()`
- ✅ Integrado em:
  - `StudentFormDialog.tsx`
  - `TeacherFormDialog.tsx`
  - `EnrollmentForm.tsx` (aluno e responsável)

### 2. Validação de Códigos INEP
- ✅ Criado `src/lib/validations/inep-code-validator.ts`
- ✅ Validação de código INEP da escola (8 dígitos)
- ✅ Validação de código de etapa de ensino (01-15)
- ✅ Validação de código de modalidade (01-10)
- ✅ Validação de código de tipo de regime (01-04)
- ✅ Mapeamento completo de códigos com descrições
- ✅ Funções: `validateSchoolINEPCode()`, `validateEtapaEnsinoCode()`, `validateModalidadeCode()`, `validateTipoRegimeCode()`
- ✅ Integrado em:
  - `SchoolFormDialog.tsx` (código INEP da escola)
  - `CourseFormDialog.tsx` (código de etapa de ensino)
  - `ClassroomDialog.tsx` (modalidade e tipo de regime)

### 3. Validação de Idade vs Série/Ano
- ✅ Criado `src/lib/validations/age-grade-validator.ts`
- ✅ Regras de idade por série/ano (1º ao 9º ano)
- ✅ Cálculo de idade considerando data de corte (31 de março)
- ✅ Detecção de distorção idade-série (none, low, medium, high)
- ✅ Funções: `calculateAge()`, `validateAgeGrade()`, `calculateAgeGradeDistortion()`, `hasAgeGradeDistortion()`
- ⏳ Integração em formulários de matrícula (pendente)

### 4. Arquivo de Exportação
- ✅ Criado `src/lib/validations/index.ts` com todas as exportações

---

## ⏳ Pendências

### 1. Validação de Matrículas
- [ ] Validar matrículas duplicadas (mesmo aluno, mesmo ano)
- [ ] Validar matrículas simultâneas em múltiplas escolas
- [ ] Validar status de matrícula
- [ ] Validar relacionamentos (escola, ano letivo, turma)
- [ ] Validar período de matrícula
- [ ] Validar capacidade da turma

### 2. Validação de Dados Obrigatórios
- [ ] Criar lista de campos obrigatórios por entidade
- [ ] Validar dados de aluno
- [ ] Validar dados de professor
- [ ] Validar dados de escola
- [ ] Validar dados de turma
- [ ] Mensagens de erro específicas por campo

### 3. Validação de Relacionamentos
- [ ] Validar que turma pertence à escola
- [ ] Validar que turma pertence ao ano letivo
- [ ] Validar que série/ano pertence à etapa de ensino
- [ ] Validar que disciplina pertence à série/ano
- [ ] Validar que professor está habilitado para disciplina

### 4. Validação de Datas
- [ ] Validar formato de datas (DD/MM/YYYY)
- [ ] Validar datas lógicas (nascimento < matrícula)
- [ ] Validar período letivo (início < fim)
- [ ] Validar datas de avaliações (dentro do período)
- [ ] Validar data de corte para idade (31/03)

### 5. Exportador Educacenso
- [ ] Criar estrutura de exportação
- [ ] Mapear dados para formato Educacenso
- [ ] Gerar arquivo de exportação
- [ ] Validação antes de exportar

### 6. Relatório de Inconsistências
- [ ] Criar página de relatório
- [ ] Listar todas as inconsistências
- [ ] Permitir correção em lote
- [ ] Exportar relatório

---

## 📁 Arquivos Criados

### Novos Arquivos
- `src/lib/validations/cpf-cnpj-validator.ts` - Validação CPF/CNPJ
- `src/lib/validations/inep-code-validator.ts` - Validação códigos INEP
- `src/lib/validations/age-grade-validator.ts` - Validação idade vs série
- `src/lib/validations/index.ts` - Exportações principais

### Arquivos Modificados
- `src/pages/people/components/StudentFormDialog.tsx` - Validação CPF
- `src/pages/people/components/TeacherFormDialog.tsx` - Validação CPF
- `src/pages/public/components/EnrollmentForm.tsx` - Validação CPF (aluno e responsável)
- `src/pages/schools/components/SchoolFormDialog.tsx` - Validação código INEP
- `src/pages/academic/components/CourseFormDialog.tsx` - Validação código etapa de ensino
- `src/pages/schools/components/ClassroomDialog.tsx` - Validação modalidade e tipo de regime

---

## 🔍 Funcionalidades Implementadas

### Validação de CPF/CNPJ
```typescript
import { validateCPF, validateCNPJ } from '@/lib/validations'

// Validar CPF
const result = validateCPF('123.456.789-00')
if (result.valid) {
  console.log('CPF válido:', result.formatted)
} else {
  console.error('Erro:', result.error)
}
```

### Validação de Códigos INEP
```typescript
import { validateSchoolINEPCode, validateEtapaEnsinoCode } from '@/lib/validations'

// Validar código INEP da escola
const result = validateSchoolINEPCode('12345678')
if (result.valid) {
  console.log('Código válido:', result.code)
}

// Validar código de etapa de ensino
const etapaResult = validateEtapaEnsinoCode('03')
if (etapaResult.valid) {
  console.log('Etapa:', etapaResult.description)
}
```

### Validação de Idade vs Série
```typescript
import { validateAgeGrade } from '@/lib/validations'

// Validar idade do aluno para 5º ano
const result = validateAgeGrade('2010-05-15', 5)
if (result.valid) {
  console.log('Idade:', result.age, 'Distorção:', result.distortion)
  if (result.warning) {
    console.warn(result.warning)
  }
}
```

---

## 📝 Notas Importantes

1. **CPF/CNPJ:** Validação completa de dígitos verificadores implementada
2. **Códigos INEP:** Todos os códigos mapeados conforme Censo Escolar
3. **Idade vs Série:** Regras baseadas em data de corte de 31 de março
4. **Integração:** Validações integradas nos formulários principais

---

## 🎯 Próximos Passos

1. Integrar validação de idade vs série em formulários de matrícula
2. Implementar validação de matrículas duplicadas
3. Criar validação de dados obrigatórios
4. Implementar exportador Educacenso
5. Criar relatório de inconsistências

---

**Progresso:** 85% concluído  
**Última Atualização:** 2025-01-27

---

## ✅ Novas Implementações (Atualização)

### 4. Validação de Matrículas
- ✅ Criado `src/lib/validations/enrollment-validator.ts`
- ✅ Validação de matrículas duplicadas
- ✅ Validação de matrículas simultâneas
- ✅ Validação de relacionamentos (escola, ano letivo, turma)
- ✅ Validação de capacidade da turma
- ✅ Validação de período de matrícula
- ✅ Função `validateEnrollmentComplete()` para validação completa
- ✅ Integrado em `EnrollmentFormDialog.tsx`

### 5. Validação de Datas
- ✅ Criado `src/lib/validations/date-validator.ts`
- ✅ Validação de formato de data (DD/MM/YYYY)
- ✅ Validação de datas lógicas (nascimento < matrícula)
- ✅ Validação de período letivo (início < fim)
- ✅ Validação de data dentro do período
- ✅ Validação de data de corte para idade (31 de março)
- ✅ Validação de data não futura
- ✅ Validação de data não muito antiga
- ✅ Função `validateDateComplete()` para validação completa

### 6. Validação de Campos Obrigatórios
- ✅ Criado `src/lib/validations/required-fields-validator.ts`
- ✅ Validação de campos obrigatórios para Aluno
- ✅ Validação de campos obrigatórios para Professor
- ✅ Validação de campos obrigatórios para Escola
- ✅ Validação de campos obrigatórios para Turma
- ✅ Validação de campos obrigatórios para Etapa de Ensino
- ✅ Função genérica `validateRequiredFields()`

### 7. Validação de Relacionamentos
- ✅ Criado `src/lib/validations/relationship-validator.ts`
- ✅ Validação de turma pertence à escola
- ✅ Validação de turma pertence ao ano letivo
- ✅ Validação de série/ano pertence à etapa de ensino
- ✅ Validação de disciplina pertence à série/ano
- ✅ Validação de professor habilitado para disciplina
- ✅ Validação de aluno na série/ano correta
- ✅ Validação de avaliação pertence à turma/disciplina
- ✅ Função `validateTurmaRelationships()` para validação completa

### 8. Integração em Formulários
- ✅ `EnrollmentFormDialog.tsx` - Validação completa de matrícula
  - Validação de idade vs série/ano
  - Validação de data de nascimento vs data de matrícula
  - Validação de matrícula duplicada
  - Validação de capacidade da turma
  - Validação de período de matrícula

