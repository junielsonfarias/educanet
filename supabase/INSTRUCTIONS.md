# 📖 Instruções para Execução das Migrations - EduGestão Municipal

## 🎯 Objetivo

Este guia fornece instruções passo a passo para executar todas as migrations do banco de dados do sistema EduGestão Municipal no Supabase.

---

## ⚠️ IMPORTANTE: Ordem de Execução

**AS MIGRATIONS DEVEM SER EXECUTADAS NA ORDEM CORRETA!**

```
001_auth_setup.sql           ✅ Executada (Fase 1)
002_create_enums.sql          ⏳ Execute primeiro
003_create_base_tables.sql    ⏳ Execute segundo
004_seed_initial_data.sql     ⏳ Execute terceiro
005_create_profile_tables.sql ⏳ Pendente (criar)
... (demais migrations)
```

---

## 📋 Status Atual das Migrations

### ✅ Implementadas e Prontas

| Migration | Status | Descrição | Conteúdo |
|-----------|--------|-----------|----------|
| `001_auth_setup.sql` | ✅ Executada | Configuração de autenticação | Tabela auth_users, RLS, triggers |
| `002_create_enums.sql` | ✅ Pronta | Criar todos os ENUMs | 26 tipos ENUM |
| `003_create_base_tables.sql` | ✅ Pronta | Tabelas fundamentais | people, schools, positions, departments, roles, permissions |
| `004_seed_initial_data.sql` | ✅ Pronta | Dados iniciais | 7 roles, 60 permissions, 10 positions, 7 departments, role_permissions, user_roles |

### ⏳ Pendentes de Implementação

| Migration | Status | Descrição |
|-----------|--------|-----------|
| `005_create_profile_tables.sql` | ⏳ Pendente | Tabelas de perfis (student_profiles, teachers, staff, guardians) |
| `006_create_academic_tables.sql` | ⏳ Pendente | Tabelas acadêmicas (academic_years, courses, classes, etc.) |
| `007_create_assessment_tables.sql` | ⏳ Pendente | Tabelas de avaliação (evaluations, grades, attendance) |
| `008_create_other_tables.sql` | ⏳ Pendente | Demais tabelas (documents, communications, protocols, etc.) |
| `009_add_foreign_keys.sql` | ⏳ Pendente | Adicionar todas as Foreign Keys |
| `010_setup_rls_policies.sql` | ⏳ Pendente | Configurar todas as políticas RLS |
| `011_create_views.sql` | ⏳ Pendente | Criar views úteis |
| `012_create_functions.sql` | ⏳ Pendente | Criar functions úteis |

---

## 🚀 Como Executar (Passo a Passo)

### Pré-requisitos

- [x] Projeto Supabase criado
- [x] Variáveis de ambiente configuradas (`.env.local`)
- [x] Migration 001 já executada (Fase 1)

### Método 1: Via Supabase Dashboard (Recomendado)

#### Passo 1: Acessar o SQL Editor

1. Acesse [https://supabase.com](https://supabase.com)
2. Selecione seu projeto: `educanet-municipal`
3. Clique em **SQL Editor** no menu lateral
4. Clique em **+ New Query**

#### Passo 2: Executar Migration 002 (ENUMs)

1. Abra o arquivo `supabase/migrations/002_create_enums.sql`
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (▶️) no canto inferior direito
5. **Aguarde a confirmação de sucesso** (✅ "Success. No rows returned")

**Verificação:**
```sql
-- Execute esta query para verificar
SELECT typname FROM pg_type 
WHERE typtype = 'e' 
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY typname;

-- Deve retornar 26 ENUMs
```

#### Passo 3: Executar Migration 003 (Tabelas Base)

1. Abra o arquivo `supabase/migrations/003_create_base_tables.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor (em uma **nova query**)
4. Clique em **Run** (▶️)
5. **Aguarde a confirmação de sucesso**

**Verificação:**
```sql
-- Execute esta query para verificar
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Deve incluir: people, schools, positions, departments, roles, permissions
```

#### Passo 4: Executar Migration 004 (Dados Iniciais)

1. Abra o arquivo `supabase/migrations/004_seed_initial_data.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor (em uma **nova query**)
4. Clique em **Run** (▶️)
5. **Aguarde a confirmação de sucesso**

**Verificação:**
```sql
-- Verificar roles
SELECT id, name, description FROM roles ORDER BY id;
-- Deve retornar 7 roles

-- Verificar permissions
SELECT COUNT(*) as total_permissions FROM permissions;
-- Deve retornar 60 permissions

-- Verificar associações
SELECT r.name, COUNT(rp.permission_id) as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
GROUP BY r.id, r.name
ORDER BY r.name;
```

---

### Método 2: Via Supabase CLI (Opcional)

```bash
# 1. Instalar Supabase CLI (se ainda não instalou)
npm install -g supabase

# 2. Vincular ao projeto
supabase link --project-ref your-project-ref

# 3. Aplicar migrations
supabase db push

# 4. Verificar status
supabase db status
```

---

## 🔍 Verificações Importantes

### Após Executar Migration 002 (ENUMs)

```sql
-- 1. Contar ENUMs criados
SELECT COUNT(*) FROM pg_type 
WHERE typtype = 'e' 
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
-- Resultado esperado: 26

-- 2. Listar todos os ENUMs
SELECT 
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e'
  AND t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY t.typname
ORDER BY t.typname;
```

### Após Executar Migration 003 (Tabelas Base)

```sql
-- 1. Listar tabelas criadas
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar índices
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('people', 'schools', 'positions', 'departments', 'roles', 'permissions')
ORDER BY tablename, indexname;

-- 3. Verificar triggers
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('people', 'schools', 'positions', 'departments', 'roles', 'permissions')
ORDER BY event_object_table, trigger_name;
```

### Após Executar Migration 004 (Dados Iniciais)

```sql
-- 1. Verificar dados inseridos
SELECT 'Roles' as tabela, COUNT(*) as total FROM roles
UNION ALL
SELECT 'Permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'Role Permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'Positions', COUNT(*) FROM positions
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'People', COUNT(*) FROM people;

-- 2. Ver permissões por role
SELECT 
  r.name as role,
  COUNT(rp.permission_id) as total_permissions,
  string_agg(p.name, ', ' ORDER BY p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
GROUP BY r.id, r.name
ORDER BY COUNT(rp.permission_id) DESC;

-- 3. Verificar pessoa "Sistema"
SELECT * FROM people WHERE id = 1;
```

---

## 🔗 Próximos Passos

### 1. Criar Usuário Teste

Após executar todas as migrations acima, crie um usuário de teste:

```sql
-- 1. Criar pessoa admin
INSERT INTO people (
  first_name, last_name, date_of_birth, cpf, email, type, created_by
) VALUES (
  'Admin',
  'Sistema',
  '1990-01-01',
  '12345678901',
  'admin@edugestao.com',
  'Funcionario',
  1
) RETURNING id;
-- Anote o ID retornado (exemplo: 2)

-- 2. Associar role Admin
INSERT INTO user_roles (person_id, role_id, created_by)
SELECT 2, id, 1  -- Use o ID da pessoa criada
FROM roles
WHERE name = 'Admin';

-- 3. Criar usuário no Supabase Auth
-- Vá em: Authentication > Users > Add user
-- Email: admin@edugestao.com
-- Password: Admin@123456
-- Auto Confirm: ✅ Sim

-- 4. Vincular auth_user à pessoa
UPDATE auth_users
SET person_id = 2  -- Use o ID da pessoa criada
WHERE email = 'admin@edugestao.com';
```

### 2. Testar Login

```
1. Acesse: http://localhost:8080/login
2. Email: admin@edugestao.com
3. Senha: Admin@123456
4. Clique em "Entrar no Sistema"
5. Deve redirecionar para /dashboard
```

---

## 🐛 Troubleshooting

### Erro: "type X already exists"

**Causa:** ENUM já foi criado anteriormente

**Solução:**
```sql
-- Verificar se o ENUM existe
SELECT typname FROM pg_type WHERE typname = 'nome_do_enum';

-- Se existir e estiver correto, pode prosseguir
-- Se estiver incorreto, deletar e recriar
DROP TYPE nome_do_enum CASCADE;
-- Depois execute a migration novamente
```

### Erro: "relation X already exists"

**Causa:** Tabela já foi criada

**Solução:**
```sql
-- Verificar se a tabela existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'nome_da_tabela';

-- Se existir e estiver correta, pode prosseguir
-- Se estiver incorreta, deletar e recriar
DROP TABLE nome_da_tabela CASCADE;
-- Depois execute a migration novamente
```

### Erro: "duplicate key value violates unique constraint"

**Causa:** Tentativa de inserir dados que já existem

**Solução:** Isso é esperado devido ao `ON CONFLICT DO NOTHING`. Ignore o erro e prossiga.

### Erro: "permission denied"

**Causa:** Falta de permissões

**Solução:** Certifique-se de estar usando as credenciais corretas do Supabase com permissões de administrador.

---

## 📊 Progresso das Migrations

```
✅ 001_auth_setup.sql          - EXECUTADA
⏳ 002_create_enums.sql         - PRONTA PARA EXECUTAR
⏳ 003_create_base_tables.sql   - PRONTA PARA EXECUTAR
⏳ 004_seed_initial_data.sql    - PRONTA PARA EXECUTAR
⏳ 005-012_*.sql                - PENDENTE DE IMPLEMENTAÇÃO
───────────────────────────────────────────────────
   TOTAL: 4/12 migrations implementadas (33%)
```

---

## 📝 Checklist de Execução

- [x] Migration 001 executada (Fase 1)
- [ ] Migration 002 executada (ENUMs)
- [ ] Verificação 002 realizada (26 ENUMs)
- [ ] Migration 003 executada (Tabelas Base)
- [ ] Verificação 003 realizada (6 tabelas)
- [ ] Migration 004 executada (Dados Iniciais)
- [ ] Verificação 004 realizada (roles, permissions, etc.)
- [ ] Pessoa admin criada
- [ ] Usuário Supabase criado
- [ ] auth_users vinculado à pessoa
- [ ] Teste de login realizado
- [ ] Login funcionando ✅

---

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs** no SQL Editor do Supabase
2. **Execute as queries de verificação** para diagnosticar
3. **Consulte a documentação** do Supabase
4. **Revise as migrations** para entender o que está sendo criado

---

## 📚 Referências

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL ENUM Types](https://www.postgresql.org/docs/current/datatype-enum.html)
- [SQL Migrations Best Practices](https://www.postgresql.org/docs/current/ddl.html)

---

**Última atualização:** 29/12/2025  
**Versão:** 1.0  
**Status:** Migrations 002-004 implementadas e prontas

