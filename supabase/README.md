# Supabase - Migrations e Configuração

## 📁 Estrutura de Migrations

```
supabase/
├── migrations/
│   ├── 001_auth_setup.sql          # ✅ Configuração de autenticação
│   ├── 002_create_enums.sql        # ⏳ Pendente - Criar todos os ENUMs
│   ├── 003_create_tables.sql       # ⏳ Pendente - Criar todas as tabelas
│   ├── 004_create_foreign_keys.sql # ⏳ Pendente - Adicionar FKs
│   ├── 005_setup_rls.sql           # ⏳ Pendente - Configurar RLS
│   ├── 006_create_views.sql        # ⏳ Pendente - Criar Views
│   └── 007_seed_data.sql           # ⏳ Pendente - Dados iniciais
└── README.md
```

## 🚀 Como Executar as Migrations

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse [https://supabase.com](https://supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **+ New Query**
5. Copie o conteúdo do arquivo SQL da migration
6. Cole no editor
7. Clique em **Run** (▶️)
8. Verifique se não houve erros

### Opção 2: Via Supabase CLI

```bash
# Se ainda não instalou o Supabase CLI
npm install -g supabase

# Inicializar Supabase no projeto (se ainda não fez)
supabase init

# Vincular ao projeto remoto
supabase link --project-ref your-project-ref

# Executar migration específica
supabase db push

# Ou aplicar todas as migrations
supabase db reset
```

## ✅ Migrations Implementadas

### 001_auth_setup.sql - Configuração de Autenticação

**Status:** ✅ Implementado

**Conteúdo:**
- ✅ Tabela `auth_users`
- ✅ Índices (`email`, `person_id`, `active`)
- ✅ RLS habilitado
- ✅ Políticas RLS:
  - Usuário pode ler seus próprios dados
  - Admin pode ler todos os dados
  - Usuário pode atualizar `last_login`
  - Admin pode atualizar todos os campos
- ✅ Function `update_updated_at()`
- ✅ Trigger para `updated_at`
- ✅ Function `handle_new_user()`
- ✅ Trigger para novos usuários
- ✅ Function auxiliar `is_admin()`
- ✅ Function auxiliar `get_user_role()`

**Como executar:**
```sql
-- Copie e cole o conteúdo de supabase/migrations/001_auth_setup.sql
-- no SQL Editor do Supabase Dashboard
```

## ⏳ Próximas Migrations (Pendentes)

### 002_create_enums.sql
Criar todos os 26 tipos ENUM do banco.md

### 003_create_tables.sql
Criar todas as 50+ tabelas em ordem de dependência

### 004_create_foreign_keys.sql
Adicionar todas as Foreign Keys

### 005_setup_rls.sql
Configurar RLS para todas as tabelas

### 006_create_views.sql
Criar Views úteis (student_full_info, teacher_full_info, etc.)

### 007_seed_data.sql
Inserir dados iniciais (roles, permissions, etc.)

## 🔧 Verificar Status das Migrations

```sql
-- Ver todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver políticas RLS de uma tabela
SELECT * 
FROM pg_policies 
WHERE tablename = 'auth_users';

-- Ver triggers de uma tabela
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'auth_users';
```

## 🔐 Testar Autenticação

Após executar `001_auth_setup.sql`:

1. **Criar usuário de teste:**
   ```sql
   -- Via Supabase Dashboard > Authentication > Users
   -- Ou via SQL:
   -- (Nota: Normalmente você criaria via interface do Supabase)
   ```

2. **Vincular usuário a uma pessoa:**
   ```sql
   -- Primeiro, certifique-se de que as tabelas people e roles existem
   -- Depois, vincule o auth_user a um person_id
   UPDATE public.auth_users
   SET person_id = 1  -- ID da pessoa na tabela people
   WHERE email = 'teste@example.com';
   ```

3. **Testar login no sistema:**
   - Abra a aplicação
   - Vá para `/login`
   - Use as credenciais criadas
   - Verifique se o login funciona

## 📊 Monitoramento

### Ver logs de autenticação
```sql
SELECT * FROM public.auth_users 
ORDER BY last_login DESC LIMIT 10;
```

### Ver usuários ativos
```sql
SELECT COUNT(*) as total_usuarios_ativos
FROM public.auth_users 
WHERE active = true;
```

### Ver últimos logins
```sql
SELECT 
  au.email,
  au.last_login,
  p.first_name || ' ' || p.last_name as nome_completo
FROM public.auth_users au
LEFT JOIN public.people p ON p.id = au.person_id
WHERE au.last_login IS NOT NULL
ORDER BY au.last_login DESC
LIMIT 20;
```

## ⚠️ Avisos Importantes

1. **Backup:** Sempre faça backup do banco antes de executar migrations
2. **Ordem:** Execute as migrations na ordem numérica
3. **Testes:** Teste cada migration em ambiente de desenvolvimento primeiro
4. **RLS:** As políticas RLS só funcionarão quando as tabelas `people`, `roles` e `user_roles` existirem
5. **Auth:** O trigger `on_auth_user_created` criará automaticamente um registro em `auth_users` quando um novo usuário for criado no Supabase Auth

## 🐛 Troubleshooting

### Erro: "relation public.people does not exist"
**Solução:** A tabela `people` ainda não foi criada. Execute primeiro a migration `003_create_tables.sql`

### Erro: "relation public.roles does not exist"
**Solução:** A tabela `roles` ainda não foi criada. Execute primeiro a migration `003_create_tables.sql`

### Erro: "permission denied for schema auth"
**Solução:** Certifique-se de estar usando as credenciais corretas do Supabase. O trigger `on_auth_user_created` requer permissões especiais.

### Política RLS não está funcionando
**Solução:** 
1. Verifique se RLS está habilitado: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Verifique as políticas: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`
3. Teste com diferentes usuários

## 📝 Notas de Desenvolvimento

- As funções `is_admin()` e `get_user_role()` são helper functions que facilitam verificações de permissão
- O trigger `handle_new_user()` garante que todo usuário criado no Supabase Auth tenha um registro em `auth_users`
- O campo `person_id` em `auth_users` deve ser preenchido manualmente ou via outra migration/script
- A função `update_updated_at()` será reutilizada em todas as tabelas

## 🔗 Links Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [SQL Editor](https://supabase.com/docs/guides/database/overview#the-sql-editor)

---

**Última atualização:** 29/12/2025  
**Versão:** 1.0  
**Status:** Fase 1 (Autenticação) Implementada

