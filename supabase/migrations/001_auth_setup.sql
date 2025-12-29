-- =====================================================
-- FASE 1: AUTENTICAÇÃO - CONFIGURAÇÃO INICIAL
-- =====================================================

-- 1. Criar tabela auth_users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auth_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id INTEGER UNIQUE,
  email TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.auth_users IS 'Tabela que vincula usuários do auth.users com a tabela people';
COMMENT ON COLUMN public.auth_users.id IS 'UUID do usuário no Supabase Auth';
COMMENT ON COLUMN public.auth_users.person_id IS 'FK para a tabela people';
COMMENT ON COLUMN public.auth_users.email IS 'Email do usuário';
COMMENT ON COLUMN public.auth_users.active IS 'Indica se o usuário está ativo';
COMMENT ON COLUMN public.auth_users.last_login IS 'Data e hora do último login';

-- 2. Criar índices
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON public.auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_person_id ON public.auth_users(person_id);
CREATE INDEX IF NOT EXISTS idx_auth_users_active ON public.auth_users(active);

-- 3. Habilitar RLS
-- =====================================================
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
-- =====================================================

-- Política de SELECT: Usuário pode ler seus próprios dados
DROP POLICY IF EXISTS "Users can read own auth data" ON public.auth_users;
CREATE POLICY "Users can read own auth data"
  ON public.auth_users
  FOR SELECT
  USING (auth.uid() = id);

-- Política de SELECT: Admins podem ler todos os dados
DROP POLICY IF EXISTS "Admins can read all auth data" ON public.auth_users;
CREATE POLICY "Admins can read all auth data"
  ON public.auth_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.person_id = (SELECT person_id FROM public.auth_users WHERE id = auth.uid())
        AND r.name = 'Admin'
    )
  );

-- Política de UPDATE: Usuário pode atualizar apenas last_login
DROP POLICY IF EXISTS "Users can update own last_login" ON public.auth_users;
CREATE POLICY "Users can update own last_login"
  ON public.auth_users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política de UPDATE: Admins podem atualizar todos os campos
DROP POLICY IF EXISTS "Admins can update all auth data" ON public.auth_users;
CREATE POLICY "Admins can update all auth data"
  ON public.auth_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.person_id = (SELECT person_id FROM public.auth_users WHERE id = auth.uid())
        AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.person_id = (SELECT person_id FROM public.auth_users WHERE id = auth.uid())
        AND r.name = 'Admin'
    )
  );

-- 5. Criar função para atualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar trigger para updated_at
-- =====================================================
DROP TRIGGER IF EXISTS set_auth_users_updated_at ON public.auth_users;
CREATE TRIGGER set_auth_users_updated_at
  BEFORE UPDATE ON public.auth_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 7. Criar função para criar auth_user automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.auth_users (id, email, created_at)
  VALUES (NEW.id, NEW.email, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar trigger para novos usuários no auth.users
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Criar função auxiliar para verificar se usuário é admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.person_id = (SELECT person_id FROM public.auth_users WHERE id = user_id)
      AND r.name = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar função auxiliar para obter role do usuário
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.person_id = (SELECT person_id FROM public.auth_users WHERE id = user_id)
  LIMIT 1;
  
  RETURN COALESCE(role_name, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIM DA CONFIGURAÇÃO DE AUTENTICAÇÃO
-- =====================================================

