# 🔍 DIAGNÓSTICO: Variáveis de Ambiente do Supabase

## 🎯 Problema

Mesmo após criar o arquivo `.env.local` e reiniciar o servidor, o erro "Invalid API key" persiste.

## ✅ Verificações Necessárias

### 1. Verificar Localização do Arquivo

O arquivo `.env.local` **DEVE** estar na **raiz do projeto**, ao lado de `package.json`:

```
educanet/
├── .env.local          ← AQUI (raiz do projeto)
├── package.json
├── src/
├── public/
└── ...
```

**❌ ERRADO:**
- `.env.local` dentro de `src/`
- `.env.local` dentro de qualquer subpasta
- Arquivo chamado `.env` (deve ser `.env.local`)

### 2. Verificar Formato do Arquivo

O arquivo `.env.local` deve ter **exatamente** este formato:

```env
VITE_SUPABASE_URL=https://uosydcxfrbnhhasbyhqr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvc3lkY3hmcmJuaGhhc2J5aHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ4MjM0NTAsImV4cCI6MjAzMDM5OTQ1MH0.sua-chave-completa-aqui
```

**⚠️ IMPORTANTE:**
- **SEM espaços** antes ou depois do `=`
- **SEM aspas** ao redor dos valores
- **SEM comentários** na mesma linha
- **COM** o prefixo `VITE_` obrigatório

### 3. Verificar se o Servidor Foi Reiniciado

**CRÍTICO:** O Vite só carrega variáveis de ambiente na inicialização!

1. **Pare o servidor completamente:**
   - Pressione `Ctrl+C` no terminal
   - Aguarde até ver "Process exited"

2. **Inicie novamente:**
   ```bash
   pnpm dev
   # ou
   npm run dev
   ```

3. **NÃO** apenas recarregue a página do navegador

### 4. Verificar no Console do Navegador

Abra o console do navegador (F12 > Console) e procure por:

```
🔍 Verificação de Variáveis de Ambiente Supabase
```

Isso mostrará se as variáveis estão sendo carregadas.

### 5. Usar a Página de Teste

Acesse: `http://localhost:8080/configuracoes/supabase-test`

Clique em "Executar Testes" e veja os detalhes de cada teste.

## 🐛 Problemas Comuns

### Problema 1: Arquivo no Lugar Errado

**Sintoma:** Variáveis não são carregadas

**Solução:**
1. Verifique se o arquivo está na raiz (ao lado de `package.json`)
2. Use o caminho absoluto se necessário

### Problema 2: Formato Incorreto

**Sintoma:** Variáveis aparecem como `undefined`

**Solução:**
```env
# ❌ ERRADO
VITE_SUPABASE_URL = https://...
VITE_SUPABASE_URL="https://..."
VITE_SUPABASE_URL=https://... # comentário

# ✅ CORRETO
VITE_SUPABASE_URL=https://...
```

### Problema 3: Chave Incorreta

**Sintoma:** "Invalid API key"

**Solução:**
1. Verifique se está usando a chave **anon public** (não service_role)
2. Verifique se copiou a chave completa (é muito longa)
3. Verifique se não há espaços ou quebras de linha

### Problema 4: Cache do Vite

**Sintoma:** Variáveis antigas ainda sendo usadas

**Solução:**
```bash
# Pare o servidor
# Delete a pasta node_modules/.vite (se existir)
# Reinicie
pnpm dev
```

## 🔧 Script de Diagnóstico

Execute no console do navegador (F12 > Console):

```javascript
// Verificar variáveis de ambiente
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado')
console.log('Todas as variáveis VITE_:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))
```

## 📋 Checklist Completo

- [ ] Arquivo `.env.local` existe na raiz do projeto
- [ ] Arquivo está ao lado de `package.json`
- [ ] Formato está correto (sem espaços, sem aspas)
- [ ] Variáveis começam com `VITE_`
- [ ] Chave anon public está completa
- [ ] Servidor foi reiniciado após criar/modificar o arquivo
- [ ] Console do navegador mostra as variáveis carregadas
- [ ] Página de teste mostra sucesso

## 🆘 Se Ainda Não Funcionar

1. **Verifique o arquivo manualmente:**
   ```bash
   # No terminal, na raiz do projeto
   cat .env.local
   # ou no Windows PowerShell
   Get-Content .env.local
   ```

2. **Verifique se o Vite está lendo:**
   - Abra `http://localhost:8080/configuracoes/supabase-test`
   - Execute os testes
   - Veja os detalhes de cada teste

3. **Tente criar um arquivo `.env` também:**
   - Às vezes o Vite carrega `.env` antes de `.env.local`
   - Crie ambos com o mesmo conteúdo

4. **Verifique permissões do arquivo:**
   - Certifique-se de que o arquivo não está somente leitura

---

**Última atualização:** 29/12/2025

