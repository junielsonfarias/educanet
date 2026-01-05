# Guia de Teste de Autenticação

Este documento fornece instruções para testar o sistema de autenticação com Supabase.

## 📋 Pré-requisitos

- Projeto Supabase configurado
- Variáveis de ambiente configuradas
- Tabela `auth_users` criada no banco
- Tabela `people` criada no banco
- Tabela `user_roles` e `roles` criadas no banco

## 🔐 Criar Usuário de Teste

### Opção 1: Via Dashboard do Supabase

1. Acesse o Dashboard do Supabase
2. Vá em **Authentication** > **Users**
3. Clique em **Add User** > **Create new user**
4. Preencha:
   - **Email**: `teste@escola.com`
   - **Password**: Escolha uma senha forte
   - **Auto Confirm User**: ✅ Marcar
5. Clique em **Create User**

### Opção 2: Via SQL (Recomendado para teste completo)

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- 1. Criar pessoa
INSERT INTO people (
  first_name,
  last_name,
  email,
  type,
  active,
  created_at,
  updated_at
) VALUES (
  'Usuário',
  'Teste',
  'teste@escola.com',
  'staff',
  true,
  now(),
  now()
) RETURNING id;

-- Anote o ID retornado (ex: 1)

-- 2. Criar usuário no Supabase Auth (via Dashboard ou API)
-- Email: teste@escola.com
-- Password: SuaSenha123!

-- 3. Obter o ID do usuário criado no Auth
-- Vá em Authentication > Users e copie o UUID do usuário

-- 4. Vincular auth_users com person
INSERT INTO auth_users (
  id,  -- UUID do usuário do Supabase Auth
  person_id,  -- ID retornado no passo 1
  email,
  active,
  created_at,
  updated_at
) VALUES (
  'uuid-do-usuario-auth',  -- Substituir pelo UUID real
  1,  -- Substituir pelo ID da pessoa criada
  'teste@escola.com',
  true,
  now(),
  now()
);

-- 5. Criar role (se não existir)
INSERT INTO roles (name, description, created_at, updated_at)
VALUES ('Admin', 'Administrador do sistema', now(), now())
ON CONFLICT (name) DO NOTHING;

-- 6. Vincular usuário com role
INSERT INTO user_roles (
  person_id,
  role_id,
  created_at,
  updated_at
)
SELECT 
  1,  -- ID da pessoa
  id,  -- ID da role Admin
  now(),
  now()
FROM roles
WHERE name = 'Admin';
```

## ✅ Testar Login

### 1. Testar Login com Credenciais Válidas

1. Acesse `/login`
2. Digite:
   - **Email**: `teste@escola.com`
   - **Senha**: A senha definida
3. Clique em **Entrar**
4. **Resultado esperado**: Redirecionamento para `/dashboard`

### 2. Testar Login com Credenciais Inválidas

1. Acesse `/login`
2. Digite:
   - **Email**: `teste@escola.com`
   - **Senha**: `senhaerrada`
3. Clique em **Entrar**
4. **Resultado esperado**: Mensagem de erro "Credenciais inválidas"

### 3. Testar Login com Usuário Inexistente

1. Acesse `/login`
2. Digite:
   - **Email**: `naoexiste@escola.com`
   - **Senha**: `qualquersenha`
3. Clique em **Entrar**
4. **Resultado esperado**: Mensagem de erro "Credenciais inválidas"

## 🚪 Testar Logout

1. Faça login com usuário válido
2. Clique no botão **Sair** no sidebar ou header
3. **Resultado esperado**: 
   - Redirecionamento para `/login`
   - Sessão limpa
   - Não é possível acessar rotas protegidas

## 🔄 Testar Persistência de Sessão

1. Faça login com usuário válido
2. Feche o navegador completamente
3. Abra o navegador novamente
4. Acesse `/dashboard` diretamente
5. **Resultado esperado**: 
   - Usuário permanece logado
   - Não é redirecionado para `/login`
   - Dados do usuário carregados corretamente

## 🔑 Testar Recuperação de Senha

### 1. Solicitar Recuperação

1. Acesse `/login`
2. Clique em **Esqueci minha senha**
3. Digite o email: `teste@escola.com`
4. Clique em **Enviar Link de Recuperação**
5. **Resultado esperado**: 
   - Mensagem de sucesso
   - E-mail enviado (verificar caixa de entrada)

### 2. Redefinir Senha

1. Abra o e-mail recebido
2. Clique no link de recuperação
3. **Resultado esperado**: 
   - Redirecionamento para `/reset-password`
   - Formulário de nova senha exibido

4. Digite:
   - **Nova Senha**: `NovaSenha123!`
   - **Confirmar Senha**: `NovaSenha123!`
5. Clique em **Redefinir Senha**
6. **Resultado esperado**: 
   - Mensagem de sucesso
   - Redirecionamento para `/login` após 2 segundos

### 3. Testar Login com Nova Senha

1. Acesse `/login`
2. Digite:
   - **Email**: `teste@escola.com`
   - **Senha**: `NovaSenha123!` (nova senha)
3. Clique em **Entrar**
4. **Resultado esperado**: Login bem-sucedido

## 🔒 Testar Redirecionamentos

### 1. Acessar Rota Protegida sem Login

1. Limpe o localStorage e cookies
2. Acesse diretamente `/dashboard`
3. **Resultado esperado**: Redirecionamento para `/login`

### 2. Acessar Rota Protegida com Login

1. Faça login
2. Acesse `/dashboard`
3. **Resultado esperado**: Página carregada normalmente

## 📝 Checklist de Validação

- [ ] Login com credenciais válidas funciona
- [ ] Login com credenciais inválidas exibe erro
- [ ] Logout funciona corretamente
- [ ] Sessão persiste após fechar navegador
- [ ] Recuperação de senha envia e-mail
- [ ] Redefinição de senha funciona
- [ ] Login com nova senha funciona
- [ ] Redirecionamento para login quando não autenticado
- [ ] Acesso a rotas protegidas quando autenticado
- [ ] Dados do usuário carregados corretamente após login

## 🆘 Problemas Comuns

### Erro: "Usuário não encontrado no sistema"

**Causa**: Usuário existe no Supabase Auth mas não em `auth_users`

**Solução**: Execute o SQL para vincular o usuário:

```sql
INSERT INTO auth_users (id, person_id, email, active, created_at, updated_at)
VALUES (
  'uuid-do-usuario-auth',
  id_da_pessoa,
  'email@exemplo.com',
  true,
  now(),
  now()
);
```

### Erro: "Usuário não vinculado a uma pessoa"

**Causa**: `person_id` é NULL em `auth_users`

**Solução**: Atualize o registro:

```sql
UPDATE auth_users
SET person_id = id_da_pessoa
WHERE id = 'uuid-do-usuario-auth';
```

### Erro: "Erro de permissão ao acessar dados do usuário"

**Causa**: Políticas RLS não configuradas corretamente

**Solução**: Verifique as políticas RLS em `auth_users` no Dashboard do Supabase

### E-mail de recuperação não chega

**Causa**: Configuração de e-mail não configurada no Supabase

**Solução**: 
1. Configure SMTP no Supabase (Settings > Auth > SMTP Settings)
2. Ou use o link direto do Supabase (verificar logs)

## 📚 Recursos Adicionais

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Guia de Troubleshooting](TROUBLESHOOTING.md)
- [Setup Completo](SUPABASE_SETUP.md)

