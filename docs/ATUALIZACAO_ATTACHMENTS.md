# Atualização: Tabela Attachments

## Resumo
Foram criadas as migrações necessárias para a tabela `attachments` que gerencia anexos (fotos e documentos) associados a diversas entidades do sistema.

## Mudanças Implementadas

### 1. Enum `entity_type` ✅
- **Status**: Já existia na migração `002_create_enums.sql`
- **Valores**: Inclui todos os tipos de entidades do sistema (school, person, student_profile, incident, school_event, etc.)

### 2. Tabela `attachments` ✅
- **Migração**: `026_create_attachments_table.sql`
- **Campos**:
  - `id` (PK)
  - `entity_type` (enum entity_type)
  - `entity_id` (INTEGER - chave estrangeira genérica)
  - `file_name` (VARCHAR(255))
  - `file_path_url` (VARCHAR(500))
  - `file_type` (VARCHAR(50) - MIME type)
  - `file_size_bytes` (INTEGER)
  - `description` (TEXT)
  - `uploaded_by_id` (FK para people.id)
  - `uploaded_at` (TIMESTAMP)
  - Campos de auditoria (created_at, updated_at, created_by, updated_by, deleted_at)

### 3. RLS Policies ✅
- **Migração**: `027_configure_rls_attachments.sql`
- **Políticas**:
  - **SELECT**: Usuários podem ver anexos de entidades que têm acesso
  - **INSERT**: Usuários autenticados podem criar anexos
  - **UPDATE**: Usuários podem atualizar seus próprios anexos ou admin pode atualizar qualquer um
  - **DELETE**: Usuários podem excluir seus próprios anexos ou admin pode excluir qualquer um

## Próximos Passos

### 1. Aplicar Migrações
```bash
# No Supabase Dashboard ou via CLI
supabase db push
```

### 2. Criar Serviço para Attachments
- Criar `src/lib/supabase/services/attachment-service.ts`
- Implementar métodos para:
  - Upload de arquivos
  - Listar anexos por entidade
  - Deletar anexos
  - Buscar anexos por tipo

### 3. Integrar com Supabase Storage
- Configurar buckets no Supabase Storage
- Implementar upload de arquivos
- Gerar URLs públicas/privadas

### 4. Atualizar Tipos TypeScript
```bash
# Regenerar tipos após aplicar migrações
npx supabase gen types typescript --project-id "seu-project-id" > src/lib/supabase/database.types.ts
```

### 5. Criar Componentes de UI
- Componente para upload de arquivos
- Componente para visualizar anexos
- Integração em formulários relevantes

## Estrutura de Dados

### Exemplo de Uso
```typescript
// Upload de foto de perfil de aluno
const attachment = {
  entity_type: 'student_profile',
  entity_id: studentProfileId,
  file_name: 'foto-perfil.jpg',
  file_path_url: 'https://storage.supabase.co/...',
  file_type: 'image/jpeg',
  file_size_bytes: 102400,
  description: 'Foto de perfil do aluno',
  uploaded_by_id: currentUserId
}

// Upload de documento de escola
const attachment = {
  entity_type: 'school',
  entity_id: schoolId,
  file_name: 'contrato-aluguel.pdf',
  file_path_url: 'https://storage.supabase.co/...',
  file_type: 'application/pdf',
  file_size_bytes: 512000,
  description: 'Contrato de aluguel do prédio',
  uploaded_by_id: currentUserId
}
```

## Notas Importantes

1. **Storage**: A tabela `attachments` armazena apenas metadados. Os arquivos físicos devem ser armazenados no Supabase Storage ou em outro serviço de armazenamento.

2. **Segurança**: As políticas RLS garantem que usuários só vejam anexos de entidades que têm acesso, mas é importante também configurar políticas de Storage no Supabase.

3. **Performance**: O índice em `(entity_type, entity_id)` otimiza buscas por entidade específica.

4. **Soft Delete**: A tabela usa `deleted_at` para soft delete, permitindo recuperação de dados se necessário.

