# Análise de Relacionamentos e Lógica entre Módulos

Data da Análise: 2025-01-27

## 📊 Estrutura de Módulos Administrativos

### Módulos Identificados

1. **Escolas** (`useSchoolStore`)
2. **Pessoas** (`useStudentStore`, `useTeacherStore`)
3. **Acadêmico** (`useCourseStore`, `useAssessmentStore`, `useAttendanceStore`, `useOccurrenceStore`, `useLessonPlanStore`)
4. **Relatórios** (`useReportStore`)
5. **Alertas** (`useAlertStore`)
6. **Configurações** (`useSettingsStore`, `useUserStore`)
7. **Conteúdo Público** (`usePublicContentStore`)
8. **Projetos** (`useProjectStore`)

---

## 🔗 Relacionamentos Identificados

### Hierarquia de Dados

```
Escola (School)
  └── Ano Letivo (AcademicYear)
      └── Turma (Classroom)
          ├── gradeId → Grade (do Course)
          └── Alunos (Students via Enrollment)
              └── Avaliações (Assessments)
                  ├── subjectId → Subject (do Grade)
                  └── periodId → Period (do AcademicYear)
```

### Relacionamentos Cruzados

1. **Student ↔ School**: Via `Enrollment.schoolId`
2. **Student ↔ Classroom**: Via `Enrollment.classroomId` (NOVO) ou `Enrollment.grade` (legado)
3. **Classroom ↔ Grade**: Via `Classroom.gradeId`
4. **Grade ↔ Subject**: Via `Grade.subjects[]`
5. **Assessment ↔ Student**: Via `Assessment.studentId`
6. **Assessment ↔ Subject**: Via `Assessment.subjectId`
7. **Assessment ↔ Classroom**: Via `Assessment.classroomId`
8. **Teacher ↔ Classroom**: Via `TeacherAllocation.classroomId`
9. **Teacher ↔ Subject**: Via `TeacherAllocation.subjectId`

---

## ✅ Correções Implementadas

### 1. ✅ CRÍTICO - Adicionado classroomId e academicYearId ao Enrollment

**Correção Aplicada:**
- Interface `Enrollment` agora inclui:
  - `academicYearId?: string` - ID do ano letivo (preferencial)
  - `classroomId?: string` - ID da turma (preferencial)
  - `grade: string` - Mantido para compatibilidade com dados antigos
  - `year: number` - Mantido para compatibilidade com dados antigos

**Arquivos Modificados:**
- `src/lib/mock-data.ts` - Interface atualizada
- `src/pages/people/components/EnrollmentFormDialog.tsx` - Agora salva os IDs
- `src/pages/people/components/StudentFormDialog.tsx` - Agora salva os IDs

### 2. ✅ CRÍTICO - Criadas Funções Utilitárias Centralizadas

**Correção Aplicada:**
- Criado arquivo `src/lib/enrollment-utils.ts` com funções:
  - `getClassroomFromEnrollment()` - Busca turma por ID (prioritário) ou nome (fallback)
  - `getAcademicYearFromEnrollment()` - Busca ano letivo por ID (prioritário) ou nome (fallback)
  - `getStudentsByClassroom()` - Busca alunos de uma turma usando IDs ou nomes
  - `validateEnrollment()` - Valida relacionamentos de um Enrollment

**Arquivos Criados:**
- `src/lib/enrollment-utils.ts`

### 3. ✅ CRÍTICO - Atualizados Componentes para Usar IDs

**Correção Aplicada:**
- Todos os componentes que faziam match por nome agora usam as funções utilitárias
- Priorizam IDs quando disponíveis, fazem fallback para nomes (compatibilidade)

**Arquivos Modificados:**
- `src/pages/academic/DigitalClassDiary.tsx`
- `src/pages/reports/PerformanceReport.tsx`
- `src/pages/reports/GradeEntryReport.tsx`
- `src/pages/people/StudentDetails.tsx`
- `src/pages/people/components/StudentPerformanceCard.tsx`

---

## ⚠️ Problemas Restantes (Não Críticos)

### 1. 🟡 MÉDIO - Falta de Validação de Relacionamentos nos Stores

**Status:** Parcialmente resolvido
- Função `validateEnrollment()` criada, mas não integrada nos stores
- Stores não podem acessar outros stores diretamente (limitação do Context API)
- **Solução:** Validação deve ser feita nos componentes antes de chamar os stores

**Recomendação:**
- Adicionar validação nos componentes que criam/atualizam Enrollments
- Usar `validateEnrollment()` antes de chamar `addEnrollment()`

### 2. 🟡 MÉDIO - Falta de Sincronização de Deleção

**Status:** Documentado, não implementado
- Ao deletar turma, não há limpeza automática de dados relacionados
- **Solução:** Implementar função de limpeza nos componentes que deletam turmas

**Recomendação:**
- Criar função `cleanupClassroomData(classroomId)` que:
  - Remove/atualiza Enrollments relacionados
  - Remove Assessments relacionados
  - Remove AttendanceRecords relacionados
  - Remove Occurrences relacionados
  - Remove TeacherAllocations relacionados

### 3. 🟢 BAIXO - TeacherAllocation sem Validação

**Status:** Não implementado
- Não valida se a turma existe antes de criar alocação
- Não valida se professor já está alocado

**Recomendação:**
- Adicionar validação em `TeacherAllocationDialog` antes de submeter

---

## 📋 Resumo de Correções

| # | Problema | Status | Arquivos Modificados |
|---|----------|--------|---------------------|
| 1 | Enrollment ↔ Classroom por nome | ✅ Corrigido | mock-data.ts, EnrollmentFormDialog.tsx, StudentFormDialog.tsx |
| 2 | Enrollment ↔ AcademicYear por conversão | ✅ Corrigido | mock-data.ts, EnrollmentFormDialog.tsx, StudentFormDialog.tsx |
| 3 | Funções utilitárias centralizadas | ✅ Criado | enrollment-utils.ts (novo) |
| 4 | Componentes usando match por nome | ✅ Atualizado | DigitalClassDiary, PerformanceReport, GradeEntryReport, StudentDetails, StudentPerformanceCard |
| 5 | Falta validação de relacionamentos | 🟡 Parcial | Função criada, precisa integração |
| 6 | Falta sincronização de deleção | 🟡 Documentado | Precisa implementação |
| 7 | TeacherAllocation sem validação | 🟢 Pendente | Precisa implementação |

---

## 🔧 Funções Utilitárias Criadas

### `getClassroomFromEnrollment(enrollment, schools)`
- **Prioridade 1:** Busca por `enrollment.classroomId`
- **Fallback:** Busca por `enrollment.grade` (nome da turma)
- **Retorna:** `Classroom | undefined`

### `getAcademicYearFromEnrollment(enrollment, schools)`
- **Prioridade 1:** Busca por `enrollment.academicYearId`
- **Fallback:** Busca por `enrollment.year` (número)
- **Retorna:** `AcademicYear | undefined`

### `getStudentsByClassroom(students, classroomId, classroomName, schoolId, academicYearId?, academicYearName?)`
- **Prioridade 1:** Match por IDs (`classroomId`, `academicYearId`)
- **Fallback:** Match por nomes (`classroomName`, `academicYearName`)
- **Retorna:** Array de estudantes

### `validateEnrollment(enrollment, schools)`
- Valida se escola existe
- Valida se ano letivo existe (quando `academicYearId` presente)
- Valida se turma existe (quando `classroomId` presente)
- Valida se turma pertence ao ano letivo correto
- **Retorna:** `{ valid: boolean, errors: string[] }`

---

## 📊 Fluxo de Dados Atualizado

### Criação de Matrícula (NOVO)
```
1. User seleciona: Escola → Ano Letivo → Turma
2. EnrollmentFormDialog cria Enrollment com:
   - schoolId ✅
   - academicYearId ✅ (NOVO)
   - classroomId ✅ (NOVO)
   - year: number (mantido para compatibilidade)
   - grade: string (mantido para compatibilidade)
3. useStudentStore.addEnrollment salva
4. ✅ Relacionamento agora é por ID, não por nome
```

### Busca de Alunos por Turma (NOVO)
```
1. Componente chama getStudentsByClassroom()
2. Função prioriza match por classroomId
3. Se não encontrar, faz fallback para match por nome
4. ✅ Garante compatibilidade com dados antigos
```

---

## ✅ Pontos Positivos Mantidos

1. **Estrutura de Stores bem organizada** ✅
2. **Relacionamentos principais funcionam** ✅
3. **Lógica de negócio implementada** ✅
4. **Compatibilidade com dados antigos** ✅ (através de fallback)

---

## 🎯 Próximos Passos Recomendados

### Prioridade 1 (Média)
1. **Integrar validação nos componentes**
   - Adicionar `validateEnrollment()` antes de criar Enrollment
   - Mostrar erros ao usuário se validação falhar

2. **Implementar sincronização de deleção**
   - Criar função `cleanupClassroomData()`
   - Chamar antes de deletar turma
   - Atualizar ou remover dados relacionados

### Prioridade 2 (Baixa)
3. **Adicionar validação em TeacherAllocation**
   - Validar existência da turma
   - Validar duplicatas

4. **Migração de dados existentes**
   - Script para popular `classroomId` e `academicYearId` em Enrollments existentes
   - Baseado em match por nome (uma única vez)

---

## 📝 Notas Técnicas

### Estrutura de Dados Atualizada

```typescript
// Enrollment (CORRIGIDO)
interface Enrollment {
  id: string
  schoolId: string        // ✅ OK
  academicYearId?: string // ✅ NOVO - ID do ano letivo
  classroomId?: string    // ✅ NOVO - ID da turma
  grade: string          // ⚠️ Mantido para compatibilidade
  year: number           // ⚠️ Mantido para compatibilidade
  status: string
  type: 'regular' | 'dependency'
}
```

### Compatibilidade com Dados Antigos

- ✅ Funções utilitárias fazem fallback para match por nome
- ✅ Dados antigos continuam funcionando
- ✅ Novos dados usam IDs (mais robusto)
- ✅ Migração gradual possível

---

## 🔍 Análise de Consistência

### Consistência de Nomenclatura
- ✅ Uso consistente de `schoolId`, `classroomId`, `subjectId`
- ✅ Agora também `academicYearId` (consistente)
- ⚠️ `grade` ainda usado para nome (compatibilidade)

### Consistência de Validação
- ✅ Função de validação criada
- 🟡 Validação não integrada nos stores (limitação do Context API)
- ✅ Validação pode ser feita nos componentes

### Consistência de Relacionamentos
- ✅ Relacionamentos principais por ID funcionam
- ✅ Fallback para nomes mantém compatibilidade
- ✅ Funções utilitárias centralizam lógica

---

## 🎓 Conclusão

**Correções Críticas Implementadas:**
- ✅ Interface `Enrollment` atualizada com IDs
- ✅ Funções utilitárias centralizadas criadas
- ✅ Componentes atualizados para usar IDs (com fallback)

**Resultado:**
- Relacionamentos agora são mais robustos e usam IDs quando disponíveis
- Compatibilidade com dados antigos mantida através de fallback
- Código mais limpo e centralizado

**Próximos Passos:**
- Integrar validações nos componentes
- Implementar sincronização de deleção
- Considerar migração de dados existentes

