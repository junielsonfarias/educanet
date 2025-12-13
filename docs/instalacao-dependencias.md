# Instalação de Dependências - Problemas e Soluções

Data: 2025-01-27

## 🔴 Problema Encontrado

Ao tentar executar `npm run dev` ou `pnpm run dev`, o erro ocorria:
```
'vite' não é reconhecido como um comando interno ou externo
```

E o Tailwind CSS IntelliSense reportava:
```
Error: Can't resolve 'tailwindcss/package.json'
Error: Can't resolve 'tailwindcss-animate'
```

## 🔍 Causa Raiz

O projeto estava configurado para usar **pnpm** (arquivo `.npmrc` e `pnpm-workspace.yaml`), mas as dependências não estavam sendo instaladas corretamente devido a:

1. Configuração do pnpm workspace apontando para diretórios não existentes
2. Dependências não sendo instaladas completamente
3. TailwindCSS e outras dependências críticas faltando

## ✅ Solução Aplicada

### 1. Limpeza e Reinstalação Completa
```bash
# Remover node_modules e lockfile
Remove-Item node_modules -Recurse -Force
Remove-Item pnpm-lock.yaml -Force

# Instalar todas as dependências com shamefully-hoist
pnpm install --shamefully-hoist --force
```

### 2. Instalação Manual de Dependências Críticas
```bash
# TailwindCSS e plugins
pnpm add -D tailwindcss@^3.4.18 tailwindcss-animate@^1.0.7 @tailwindcss/typography@^0.5.19 @tailwindcss/aspect-ratio@^0.4.2 autoprefixer@^10.4.22 postcss@^8.5.6

# React e dependências principais
pnpm add react@^19.2.0 react-dom@^19.2.0 react-router-dom@^6.30.2
```

### 3. Verificação de Dependências Instaladas
- ✅ `rolldown-vite` (vite 7.2.11) - Instalado
- ✅ `tailwindcss` (3.4.19) - Instalado
- ✅ `react` (19.2.3) - Instalado
- ✅ `react-dom` (19.2.3) - Instalado
- ✅ `react-router-dom` (6.30.2) - Instalado
- ✅ Todas as dependências do package.json - Instaladas (149 pacotes)

### 4. Comando para Rodar o Projeto
```bash
pnpm run dev
```

## 📋 Status Atual

- ✅ **149 pacotes instalados** (121 diretórios no node_modules)
- ✅ Vite instalado e funcionando
- ✅ TailwindCSS instalado e configurado
- ✅ React 19.2.3 e todas as dependências principais instaladas
- ✅ Servidor rodando na porta 8080
- ✅ Node_modules criado em `C:\Users\JUNIELSON\node_modules` (devido à configuração do .npmrc)

## ⚠️ Notas Importantes

1. **Gerenciador de Pacotes:** Este projeto usa **pnpm**, não npm
2. **Configuração:** O arquivo `.npmrc` contém configurações específicas do pnpm:
   - `shamefully-hoist=true` - Faz hoist de todas as dependências
   - `store-dir` - Configurado para usar diretório específico
3. **Workspace:** O projeto tem configuração de workspace do pnpm
4. **Node_modules:** Devido à configuração, o pnpm pode criar node_modules em `C:\Users\JUNIELSON\node_modules` além do local
5. **Solução Final:** Usar `pnpm install --shamefully-hoist --force` para garantir instalação completa

## 🚀 Solução Final (Se Problemas Persistirem)

1. **Limpar completamente:**
```bash
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item pnpm-lock.yaml -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\JUNIELSON\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
```

2. **Reinstalar tudo:**
```bash
pnpm install --shamefully-hoist --force
```

3. **Verificar instalação:**
```bash
pnpm list --depth=0
Get-ChildItem node_modules -Directory | Measure-Object
# Deve mostrar ~121+ diretórios
```

4. **Testar servidor:**
```bash
pnpm run dev
# Deve iniciar em http://localhost:8080
```

## 🔧 Correção Final Aplicada

### Ajuste nos Scripts do package.json

Os scripts foram atualizados para usar `pnpm exec vite` em vez de apenas `vite`:

```json
{
  "scripts": {
    "start": "pnpm exec vite dev",
    "dev": "pnpm exec vite",
    "build": "pnpm exec vite build",
    "build:dev": "pnpm exec vite build --mode development",
    "preview": "pnpm exec vite preview"
  }
}
```

Isso garante que o pnpm encontre o vite corretamente, mesmo com a configuração de hoisting.

## 📝 Comandos Úteis

```bash
# Instalar todas as dependências
pnpm install --shamefully-hoist

# Rodar servidor de desenvolvimento
pnpm run dev
# ou
pnpm start

# Build para produção
pnpm run build

# Verificar dependências instaladas
pnpm list --depth=0

# Testar se vite está disponível
pnpm exec vite --version
```

