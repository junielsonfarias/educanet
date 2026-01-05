# Correção: Tabela system_settings não existe

**Data:** 2025-01-27  
**Status:** ✅ **MIGRAÇÃO CRIADA**

---

## 🔍 PROBLEMA IDENTIFICADO

Ao tentar salvar configurações (logos, etc.), o sistema retornava o erro:
```
column system_settings.key does not exist
```

**Causa:** A tabela `system_settings` não existe no banco de dados.

---

## ✅ SOLUÇÃO IMPLEMENTADA

### Migração Criada
**Arquivo:** `supabase/migrations/029_create_system_settings.sql`

**Estrutura da Tabela:**
```sql
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,  -- Chave da configuração
  value JSONB NOT NULL,                -- Valor em JSONB (flexível)
  category VARCHAR(100),               -- Categoria (ex: 'general')
  description TEXT,                   -- Descrição opcional
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP                -- Soft delete
);
```

**Características:**
- ✅ Campo `key` único para identificar cada configuração
- ✅ Campo `value` em JSONB para armazenar qualquer tipo de dado
- ✅ Campo `category` para organizar configurações
- ✅ RLS habilitado com políticas de acesso
- ✅ Trigger para atualizar `updated_at` automaticamente
- ✅ Soft delete com `deleted_at`

**Políticas RLS:**
- ✅ Leitura pública (todos podem ler)
- ✅ Inserção/Atualização apenas para usuários autenticados
- ✅ Deleção apenas para admins

---

## 🚀 COMO APLICAR A MIGRAÇÃO

### Opção 1: Via Supabase Dashboard
1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie o conteúdo de `supabase/migrations/029_create_system_settings.sql`
4. Cole e execute o SQL

### Opção 2: Via Supabase CLI
```bash
# Se estiver usando Supabase CLI localmente
supabase db push

# Ou aplicar a migração específica
supabase migration up 029_create_system_settings
```

---

## 📋 VERIFICAÇÃO

Após aplicar a migração, verifique:

1. **Tabela criada:**
```sql
SELECT * FROM system_settings;
```

2. **Estrutura correta:**
```sql
\d system_settings
```

3. **Políticas RLS:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'system_settings';
```

---

## ✅ APÓS APLICAR A MIGRAÇÃO

1. **Recarregue a página** do sistema
2. **Tente fazer upload de logo novamente**
3. **Verifique se salva corretamente**

---

## 🔧 ARQUIVOS MODIFICADOS

1. ✅ `supabase/migrations/029_create_system_settings.sql` (NOVO)
   - Criação da tabela `system_settings`
   - Políticas RLS
   - Triggers

---

## 📝 NOTAS IMPORTANTES

- **JSONB:** O campo `value` usa JSONB para flexibilidade (pode armazenar strings, números, objetos, arrays)
- **Chaves esperadas:**
  - `municipalityName`
  - `educationSecretaryName`
  - `municipalityLogo` (URL da logo)
  - `secretaryLogo` (URL da logo)
  - `facebookHandle`
  - `footerText`
  - `qeduMunicipalityId`

---

**Última atualização:** 2025-01-27  
**Status:** Migração criada, aguardando execução no Supabase

