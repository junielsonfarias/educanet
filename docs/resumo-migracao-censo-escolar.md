# Resumo da Migração - Alinhamento com Censo Escolar

**Data:** 2025-01-27  
**Status:** ✅ Implementação Inicial Concluída

## 📋 O que foi implementado

### 1. Novas Interfaces (Alinhadas ao Censo Escolar)

#### `SerieAno` (antes `Grade`)
- Representa a progressão anual (1º ao 9º ano no Fundamental, 1º ao 3º no Médio)
- Adicionado campo `numero` para ordenação
- Mantém compatibilidade com `Grade` via alias TypeScript

#### `EtapaEnsino` (antes `Course`)
- Representa os níveis educacionais (Educação Infantil, Ensino Fundamental, Ensino Médio)
- Adicionado campo `codigoCenso` com códigos INEP
- Mantém compatibilidade com `Course` via alias TypeScript

#### `Turma` (antes `Classroom`)
- Adicionado campo obrigatório `etapaEnsinoId` (requerido pelo Censo)
- Adicionado campo `serieAnoId` (preferencial sobre `gradeId`)
- Adicionados campos opcionais do Censo:
  - `tipoAtendimento`
  - `tipoMediacaoDidaticoPedagogico`
  - `tipoRegime`
  - `codigoTurmaCenso`
- Mantém compatibilidade com `Classroom` via alias TypeScript
- Mantém campos legados `gradeId` e `gradeName` para compatibilidade

#### `AnoLetivo` (antes `AcademicYear`)
- Adicionado campo `ano` para ordenação numérica
- Renomeado `classes` para `turmas`
- Mantém campo legado `classes` para compatibilidade
- Mantém compatibilidade com `AcademicYear` via alias TypeScript

### 2. Dados Mock Atualizados

- `mockEtapasEnsino`: Novo array com etapas de ensino e códigos INEP
- `mockCourses`: Mantido como alias para compatibilidade
- Dados de exemplo atualizados com nova estrutura

### 3. Stores Atualizados

#### `useSchoolStore`
- Métodos atualizados para usar `turmas` ao invés de `classes`
- Suporta tanto `turmas` quanto `classes` para compatibilidade
- Adicionados aliases: `addTurma`, `updateTurma`, `deleteTurma`

#### `useCourseStore`
- Mantém compatibilidade com `Course` e `Grade`
- Suporta tanto `grades` quanto `seriesAnos` para compatibilidade

### 4. Componentes Atualizados

#### `ClassroomDialog`
- Adicionado campo obrigatório "Etapa de Ensino" com seleção de códigos INEP
- Campo "Série/Ano" agora filtrado pela etapa de ensino selecionada
- Adicionado campo "Tipo de Regime" (Seriado/Não Seriado)
- Labels atualizados para usar nomenclatura do Censo Escolar
- Mantém compatibilidade com campos legados (`gradeId`)

## 🔄 Estratégia de Compatibilidade

Para garantir que o código existente continue funcionando durante a migração:

1. **Aliases TypeScript**: Todas as interfaces antigas são aliases das novas
2. **Campos Legados**: Campos antigos são mantidos e populados automaticamente
3. **Suporte Duplo**: Stores suportam tanto campos novos quanto antigos
4. **Migração Gradual**: Componentes podem ser atualizados gradualmente

## 📝 Próximos Passos

### Fase 1: Atualização de Referências (Em Progresso)
- [ ] Atualizar todas as referências de `classes` para `turmas` nos componentes
- [ ] Atualizar todas as referências de `gradeId` para `serieAnoId`
- [ ] Atualizar labels e textos da UI para usar nova nomenclatura

### Fase 2: Validação e Testes
- [ ] Testar criação de turmas com nova estrutura
- [ ] Testar criação de anos letivos
- [ ] Verificar relacionamentos entre entidades
- [ ] Testar exportação de dados

### Fase 3: Limpeza (Opcional - Futuro)
- [ ] Remover aliases TypeScript após migração completa
- [ ] Remover campos legados após migração completa
- [ ] Atualizar documentação final

## 🎯 Benefícios Alcançados

1. ✅ **Alinhamento com Censo Escolar**: Nomenclatura oficial do INEP
2. ✅ **Estrutura Mais Clara**: Hierarquia clara (Escola → Ano Letivo → Turma → Etapa de Ensino → Série/Ano)
3. ✅ **Campos Obrigatórios**: `etapaEnsinoId` agora obrigatório conforme Censo
4. ✅ **Códigos INEP**: Suporte a códigos oficiais do Censo Escolar
5. ✅ **Compatibilidade**: Código existente continua funcionando

## 📚 Documentação

- **Plano de Migração**: `docs/migracao-nomenclatura-censo-escolar.md`
- **Análise Inicial**: Documento criado com análise completa da estrutura

## ⚠️ Notas Importantes

- Os aliases TypeScript (`Grade`, `Course`, `Classroom`, `AcademicYear`) estão marcados como `@deprecated`
- Campos legados (`gradeId`, `gradeName`, `classes`) são mantidos para compatibilidade
- A migração é gradual e não quebra código existente
- Todos os novos campos do Censo Escolar são opcionais, exceto `etapaEnsinoId` que é obrigatório

