# AssessmentInput.tsx - Refatoração Pendente

## Status
⚠️ **PENDENTE** - Requer refatoração completa

## Complexidade
- **Tamanho**: 900+ linhas
- **Dependências**: Múltiplos stores e estrutura de dados aninhada
- **Funcionalidade**: Lançamento de avaliações/notas por turma, turno e disciplina

## Problemas Identificados

### 1. Estrutura de Dados Antiga
O componente depende de uma estrutura aninhada que não existe mais no Supabase:
- `schools -> academicYears -> turmas -> students`
- `etapasEnsino -> seriesAnos -> subjects`
- `evaluationRules`

### 2. Estrutura Supabase
No Supabase, temos tabelas separadas:
- `schools` (tabela separada)
- `academic_years` (tabela separada)
- `academic_periods` (tabela separada)
- `classes` (tabela separada com `school_id`, `academic_year_id`, `course_id`)
- `courses` (tabela separada)
- `subjects` (tabela separada)
- `evaluation_instances` (tabela separada)
- `grades` (tabela separada)

### 3. Serviços Necessários
Faltam serviços específicos para:
- `academic_years` - Buscar anos letivos
- `academic_periods` - Buscar períodos de um ano letivo
- `evaluation_instances` - Criar/buscar instâncias de avaliação

## Mudanças Necessárias

### 1. Criar Serviços Faltantes
```typescript
// src/lib/supabase/services/academic-year-service.ts
// src/lib/supabase/services/academic-period-service.ts
// src/lib/supabase/services/evaluation-instance-service.ts
```

### 2. Adaptar Lógica de Filtros
- Carregar `academic_years` por escola
- Carregar `academic_periods` por ano letivo
- Carregar `classes` por escola, ano letivo, curso e turno
- Carregar `subjects` por curso
- Carregar `students` por turma

### 3. Adaptar Carregamento de Notas
- Usar `fetchClassGrades` do `useAssessmentStore.supabase`
- Adaptar estrutura de dados retornada
- Mapear `grades` para o formato esperado pelo componente

### 4. Adaptar Salvamento
- Criar `evaluation_instance` antes de salvar notas
- Usar `saveGradeBatch` do `useAssessmentStore.supabase`
- Adaptar estrutura de dados para `GradeData`

## Próximos Passos

1. ✅ Criar serviços para `academic_years` e `academic_periods`
2. ✅ Criar serviço para `evaluation_instances`
3. ⏳ Refatorar `AssessmentInput.tsx` para usar novos serviços
4. ⏳ Testar fluxo completo de lançamento de notas

## Nota
Este componente pode ser deixado para uma fase posterior, pois é complexo e requer análise detalhada da estrutura de dados do Supabase.

