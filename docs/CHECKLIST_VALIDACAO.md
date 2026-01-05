# Checklist de Validação - Integração Supabase

Este checklist ajuda a validar se a integração com Supabase está funcionando corretamente.

## ✅ Configuração Inicial

### Variáveis de Ambiente
- [ ] Arquivo `.env.local` criado na raiz do projeto
- [ ] `VITE_SUPABASE_URL` configurado corretamente
- [ ] `VITE_SUPABASE_ANON_KEY` configurado corretamente
- [ ] `.env.local` está no `.gitignore`
- [ ] Servidor de desenvolvimento reiniciado após configurar variáveis

### Projeto Supabase
- [ ] Projeto criado no Supabase
- [ ] Projeto provisionado e ativo
- [ ] Credenciais anotadas e seguras
- [ ] Região selecionada (preferencialmente São Paulo)

## ✅ Conexão e Testes

### Teste de Conexão
- [ ] Página de teste acessível (`/configuracoes/supabase-test`)
- [ ] Botão "Testar Conexão" funciona
- [ ] Todos os testes passam:
  - [ ] Teste de configuração
  - [ ] Teste de conexão
  - [ ] Teste de autenticação anônima
  - [ ] Teste de acesso ao banco

### Console do Navegador
- [ ] Sem erros relacionados ao Supabase no console
- [ ] Mensagens de verificação de ambiente aparecem (em dev)
- [ ] Sem warnings críticos

## ✅ Cliente Supabase

### Inicialização
- [ ] Cliente Supabase inicializa corretamente
- [ ] Variáveis de ambiente são validadas
- [ ] Erros de configuração são exibidos claramente

### Helpers
- [ ] `isSupabaseConfigured()` retorna `true`
- [ ] `checkConnection()` retorna sucesso
- [ ] `handleSupabaseError()` trata erros corretamente

## ✅ Storage (Se Implementado)

### Buckets
- [ ] Bucket `avatars` criado
- [ ] Bucket `documents` criado
- [ ] Bucket `photos` criado

### Políticas RLS
- [ ] Políticas de leitura configuradas
- [ ] Políticas de upload configuradas
- [ ] Políticas testadas com usuário autenticado
- [ ] Políticas testadas com usuário não autenticado (quando aplicável)

### Funcionalidades
- [ ] `uploadFile()` funciona corretamente
- [ ] `deleteFile()` funciona corretamente
- [ ] `getPublicUrl()` retorna URL válida
- [ ] `getSignedUrl()` funciona para arquivos privados
- [ ] Validação de tipo de arquivo funciona
- [ ] Validação de tamanho de arquivo funciona

## ✅ Autenticação (Se Implementado)

### Login/Logout
- [ ] Login funciona corretamente
- [ ] Logout funciona corretamente
- [ ] Sessão persiste após refresh da página
- [ ] Token é renovado automaticamente

### Usuários
- [ ] Criação de usuário funciona
- [ ] Dados do usuário são carregados corretamente
- [ ] Permissões são verificadas corretamente

## ✅ Banco de Dados (Se Implementado)

### Schema
- [ ] Tabelas criadas no banco
- [ ] Relacionamentos configurados
- [ ] Índices criados onde necessário
- [ ] Constraints configuradas

### Row Level Security (RLS)
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas de SELECT configuradas
- [ ] Políticas de INSERT configuradas
- [ ] Políticas de UPDATE configuradas
- [ ] Políticas de DELETE configuradas
- [ ] Políticas testadas com diferentes roles

### Serviços
- [ ] Serviços criados para cada entidade principal
- [ ] Funções `fetch*()` funcionam
- [ ] Funções `create*()` funcionam
- [ ] Funções `update*()` funcionam
- [ ] Funções `delete*()` funcionam
- [ ] Tratamento de erros implementado

## ✅ Integração com Frontend

### Stores
- [ ] Stores migrados para usar Supabase
- [ ] Dados são carregados do Supabase
- [ ] Operações CRUD funcionam
- [ ] Estados de loading são gerenciados
- [ ] Erros são tratados e exibidos

### Componentes
- [ ] Componentes atualizados para usar stores Supabase
- [ ] Formulários salvam dados no Supabase
- [ ] Listagens carregam dados do Supabase
- [ ] Validações funcionam corretamente

## ✅ Performance

### Requisições
- [ ] Requisições são otimizadas (apenas campos necessários)
- [ ] Sem requisições desnecessárias
- [ ] Cache implementado onde apropriado
- [ ] Paginação implementada para listas grandes

### Região
- [ ] Região do Supabase está próxima (São Paulo recomendado)
- [ ] Latência aceitável (< 200ms)

## ✅ Segurança

### Variáveis de Ambiente
- [ ] `.env.local` não está no repositório
- [ ] Apenas `anon` key usada no frontend
- [ ] `service_role` key nunca exposta no frontend

### Políticas
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas testadas e validadas
- [ ] Acesso restrito baseado em roles

### Validações
- [ ] Dados validados antes de enviar ao Supabase
- [ ] Sanitização de inputs implementada
- [ ] Proteção contra SQL injection (Supabase já faz isso)

## ✅ Documentação

### Documentos Criados
- [ ] `CONFIGURAR_VARIAVEIS_AMBIENTE.md` criado
- [ ] `SUPABASE_SETUP.md` criado
- [ ] `TROUBLESHOOTING.md` criado
- [ ] `ESTRUTURA_SUPABASE.md` criado
- [ ] `README.md` atualizado com informações do Supabase

### Código
- [ ] Código comentado onde necessário
- [ ] Tipos TypeScript definidos
- [ ] Erros tratados adequadamente

## 📊 Resumo

### Status Geral
- [ ] ✅ Configuração: ___/5 itens
- [ ] ✅ Conexão: ___/4 itens
- [ ] ✅ Cliente: ___/3 itens
- [ ] ✅ Storage: ___/6 itens (se implementado)
- [ ] ✅ Autenticação: ___/3 itens (se implementado)
- [ ] ✅ Banco de Dados: ___/9 itens (se implementado)
- [ ] ✅ Frontend: ___/5 itens
- [ ] ✅ Performance: ___/4 itens
- [ ] ✅ Segurança: ___/6 itens
- [ ] ✅ Documentação: ___/3 itens

### Próximos Passos
1. [ ] Revisar itens não marcados
2. [ ] Corrigir problemas encontrados
3. [ ] Testar novamente após correções
4. [ ] Atualizar documentação se necessário

## 🆘 Problemas Encontrados

Liste aqui os problemas encontrados durante a validação:

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

## 📝 Notas

Adicione aqui observações importantes:

_________________________________________________
_________________________________________________
_________________________________________________

---

**Última atualização:** [Data]
**Validado por:** [Nome]

