# Implementação de Attachments - Completa ✅

## Status
✅ **COMPLETO** - Tabela, RLS e Serviço implementados

## O que foi implementado

### 1. Tabela `attachments` ✅
- **Status**: Já existia no banco de dados
- **Estrutura**: Confirmada e compatível com o design
- **Campos**: Todos os campos necessários estão presentes

### 2. Políticas RLS ✅
- **Migração**: `027_configure_rls_attachments.sql` aplicada com sucesso
- **Políticas**:
  - ✅ SELECT: Usuários podem ver anexos de entidades acessíveis
  - ✅ INSERT: Usuários autenticados podem criar anexos
  - ✅ UPDATE: Usuários podem atualizar seus próprios anexos ou admin pode atualizar qualquer um
  - ✅ DELETE: Usuários podem excluir seus próprios anexos ou admin pode excluir qualquer um

### 3. Serviço `attachment-service.ts` ✅
- **Arquivo**: `src/lib/supabase/services/attachment-service.ts`
- **Métodos implementados**:
  - ✅ `getAttachmentFullInfo(id)` - Buscar anexo com informações completas
  - ✅ `getByEntity(entityType, entityId, options?)` - Buscar anexos por entidade
  - ✅ `getByFileType(fileType, options?)` - Buscar anexos por tipo de arquivo
  - ✅ `createAttachment(data)` - Criar anexo (apenas metadados)
  - ✅ `uploadAttachment(file, entityType, entityId, options?)` - Upload completo (Storage + metadados)
  - ✅ `deleteAttachment(id)` - Deletar anexo (soft delete)
  - ✅ `updateDescription(id, description)` - Atualizar descrição
  - ✅ `countByEntity(entityType, entityId)` - Contar anexos por entidade
  - ✅ `getRecentAttachments(limit?)` - Buscar anexos recentes

### 4. Exportação no Index ✅
- **Arquivo**: `src/lib/supabase/services/index.ts`
- **Exports**: `attachmentService` e tipos relacionados adicionados

## Como usar

### Exemplo 1: Upload de foto de perfil de aluno
```typescript
import { attachmentService } from '@/lib/supabase/services';

const file = event.target.files[0]; // File object
const studentProfileId = 123;

const attachment = await attachmentService.uploadAttachment(
  file,
  'student_profile',
  studentProfileId,
  {
    bucket: 'attachments',
    description: 'Foto de perfil do aluno',
    folder: 'student_profiles'
  }
);
```

### Exemplo 2: Listar anexos de uma escola
```typescript
const schoolAttachments = await attachmentService.getByEntity(
  'school',
  schoolId,
  {
    fileType: 'image/jpeg', // Opcional: filtrar por tipo
    limit: 10 // Opcional: limitar resultados
  }
);
```

### Exemplo 3: Criar anexo com URL externa
```typescript
const attachment = await attachmentService.createAttachment({
  entity_type: 'school',
  entity_id: schoolId,
  file_name: 'contrato.pdf',
  file_path_url: 'https://exemplo.com/arquivo.pdf',
  file_type: 'application/pdf',
  file_size_bytes: 512000,
  description: 'Contrato de aluguel'
});
```

### Exemplo 4: Deletar anexo
```typescript
await attachmentService.deleteAttachment(attachmentId);
```

## Próximos passos (opcional)

1. **Configurar Supabase Storage**:
   - Criar bucket `attachments` no Supabase Storage
   - Configurar políticas de Storage para acesso seguro
   - Definir limites de tamanho de arquivo

2. **Criar componentes de UI**:
   - Componente de upload de arquivos
   - Componente para visualizar galeria de anexos
   - Integração em formulários relevantes

3. **Regenerar tipos TypeScript** (se necessário):
   ```bash
   npx supabase gen types typescript --project-id "seu-project-id" > src/lib/supabase/database.types.ts
   ```

## Notas importantes

1. **Storage**: O método `uploadAttachment` faz upload para Supabase Storage e cria o registro. Certifique-se de que o bucket `attachments` existe.

2. **Segurança**: As políticas RLS garantem acesso seguro, mas também configure políticas de Storage no Supabase.

3. **Performance**: Os índices criados otimizam buscas por entidade e tipo de arquivo.

4. **Soft Delete**: A tabela usa `deleted_at` para soft delete, permitindo recuperação se necessário.

