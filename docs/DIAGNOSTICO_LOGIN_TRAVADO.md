# Diagnóstico: Login Travado (Botão Carregando Infinitamente)

**Data:** 2025-01-27  
**Problema:** Botão de login fica carregando infinitamente ao tentar fazer login

---

## 🔍 POSSÍVEIS CAUSAS

### 1. Erro na Query de `user_roles`
**Sintoma:** Login autentica no Supabase Auth mas falha ao buscar role

**Solução Aplicada:**
- ✅ Alterado `.single()` para `.maybeSingle()` na query de roles
- ✅ Adicionado tratamento de erro para quando não há role
- ✅ Role padrão 'user' é usado se não encontrar role

### 2. Erro na Query de `auth_users`
**Sintoma:** Usuário não encontrado na tabela `auth_users`

**Verificação:**
```sql
-- Execute no Supabase Dashboard > SQL Editor
SELECT * FROM auth_users WHERE email = 'seu-email@exemplo.com';
```

**Se não retornar nada:**
- O usuário foi criado no Supabase Auth mas não tem registro em `auth_users`
- Execute o script de diagnóstico: `supabase/scripts/diagnosticar_login_admin.sql`

### 3. Problema de RLS (Row Level Security)
**Sintoma:** Erro de permissão ao acessar `auth_users` ou `user_roles`

**Verificação:**
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'auth_users' 
AND schemaname = 'public';

SELECT * FROM pg_policies 
WHERE tablename = 'user_roles' 
AND schemaname = 'public';
```

### 4. `loadUser()` travando
**Sintoma:** Login bem-sucedido mas `loadUser()` não retorna

**Solução Aplicada:**
- ✅ Login agora usa dados retornados diretamente do `signIn()`
- ✅ `loadUser()` só é chamado se dados estiverem incompletos
- ✅ Timeout adicionado para evitar travamento

---

## 🛠️ CORREÇÕES APLICADAS

### 1. Correção na Query de Roles
```typescript
// ANTES (causava erro se não houvesse role)
.single()

// DEPOIS (não causa erro se não houver role)
.maybeSingle()
```

### 2. Melhor Tratamento de Erros
- ✅ Erros são logados no console
- ✅ Loading sempre é resetado, mesmo em caso de erro
- ✅ Mensagens de erro mais claras

### 3. Uso Direto dos Dados do Login
- ✅ Estado é atualizado diretamente com dados do `signIn()`
- ✅ Evita chamada desnecessária a `loadUser()`
- ✅ Reduz tempo de resposta

---

## 🧪 COMO TESTAR

### 1. Abrir Console do Navegador
1. Pressione `F12` ou `Ctrl+Shift+I`
2. Vá na aba **Console**
3. Tente fazer login
4. Verifique os logs que começam com `[useAuth]` e `[signIn]`

### 2. Verificar Erros Específicos

#### Se aparecer: "Usuário não encontrado no sistema"
```sql
-- Execute no Supabase Dashboard
SELECT * FROM auth_users WHERE email = 'seu-email@exemplo.com';
```

#### Se aparecer: "Erro de permissão RLS"
```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('auth_users', 'user_roles');
```

#### Se aparecer: "Person ID not found"
```sql
-- Verificar se person_id está vinculado
SELECT au.*, p.first_name, p.last_name
FROM auth_users au
LEFT JOIN people p ON p.id = au.person_id
WHERE au.email = 'seu-email@exemplo.com';
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Usuário existe no Supabase Auth (Dashboard > Authentication > Users)
- [ ] Usuário tem registro em `auth_users`
- [ ] `person_id` está vinculado em `auth_users`
- [ ] Usuário tem role em `user_roles`
- [ ] RLS está configurado corretamente
- [ ] Variáveis de ambiente estão configuradas (`.env.local`)

---

## 🔧 PRÓXIMOS PASSOS SE AINDA NÃO FUNCIONAR

1. **Verificar Console:**
   - Abra o console do navegador
   - Tente fazer login
   - Copie todos os erros que aparecerem

2. **Verificar Supabase Dashboard:**
   - Vá em **Authentication > Users**
   - Verifique se o usuário existe
   - Verifique se o email está confirmado

3. **Executar Script de Diagnóstico:**
   ```sql
   -- Execute no Supabase Dashboard > SQL Editor
   -- Arquivo: supabase/scripts/diagnosticar_login_admin.sql
   ```

4. **Verificar Logs do Supabase:**
   - Vá em **Logs > API**
   - Verifique se há erros relacionados ao login

---

## ✅ CORREÇÕES IMPLEMENTADAS

- ✅ Query de roles usa `.maybeSingle()` em vez de `.single()`
- ✅ Tratamento de erro melhorado em `signIn()`
- ✅ Loading sempre é resetado, mesmo em caso de erro
- ✅ Login usa dados retornados diretamente, evitando chamada extra
- ✅ Logs de debug adicionados para facilitar diagnóstico
- ✅ Timeout adicionado para evitar travamento

---

**Última atualização:** 2025-01-27  
**Status:** Correções aplicadas, aguardando teste

