# Projeto Criado com o Skip

Este projeto foi criado de ponta a ponta com o [Skip](https://goskip.dev).

## 🚀 Stack Tecnológica

- **React 19** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool extremamente rápida
- **TypeScript** - Superset tipado do JavaScript
- **Shadcn UI** - Componentes reutilizáveis e acessíveis
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Roteamento para aplicações React
- **React Hook Form** - Gerenciamento de formulários performático
- **Zod** - Validação de schemas TypeScript-first
- **Recharts** - Biblioteca de gráficos para React
- **Supabase** - Backend como serviço (BaaS) para autenticação e banco de dados

## 📋 Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Conta no Supabase (gratuita) - [Criar conta](https://supabase.com)

## 🔧 Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd educanet
```

### 2. Instalar dependências

```bash
pnpm install
# ou
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public-aqui
```

**📖 Para mais detalhes sobre configuração do Supabase, consulte:**
- [Guia de Configuração de Variáveis de Ambiente](docs/CONFIGURAR_VARIAVEIS_AMBIENTE.md)
- [Documentação Completa do Supabase](docs/SUPABASE_PRONTO_PARA_USO.md)

### 4. Iniciar o servidor de desenvolvimento

```bash
pnpm dev
# ou
npm run dev
```

## 💻 Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm start
# ou
npm run dev
```

Abre a aplicação em modo de desenvolvimento em [http://localhost:5173](http://localhost:5173).

### Build

```bash
# Build para produção
npm run build

# Build para desenvolvimento
npm run build:dev
```

Gera os arquivos otimizados para produção na pasta `dist/`.

### Preview

```bash
# Visualizar build de produção localmente
npm run preview
```

Permite visualizar a build de produção localmente antes do deploy.

### Linting e Formatação

```bash
# Executar linter
npm run lint

# Executar linter e corrigir problemas automaticamente
npm run lint:fix

# Formatar código com Prettier
npm run format
```

## 📁 Estrutura do Projeto

```
.
├── src/                      # Código fonte da aplicação
│   ├── lib/
│   │   └── supabase/         # Configuração e helpers do Supabase
│   │       ├── client.ts     # Cliente Supabase configurado
│   │       ├── helpers.ts    # Funções auxiliares
│   │       ├── storage.ts   # Helpers de Storage
│   │       └── types.ts     # Tipos TypeScript
│   ├── pages/                # Páginas da aplicação
│   ├── components/           # Componentes reutilizáveis
│   └── stores/               # Stores Zustand
├── docs/                     # Documentação do projeto
│   ├── CONFIGURAR_VARIAVEIS_AMBIENTE.md
│   ├── SUPABASE_SETUP.md
│   └── TROUBLESHOOTING.md
├── public/                   # Arquivos estáticos
├── dist/                     # Build de produção (gerado)
├── node_modules/             # Dependências (gerado)
└── package.json              # Configurações e dependências do projeto
```

**📖 Para mais detalhes sobre a estrutura do Supabase, consulte:**
- [Estrutura de Pastas do Supabase](docs/ESTRUTURA_SUPABASE.md)

## 🎨 Componentes UI

Este template inclui uma biblioteca completa de componentes Shadcn UI baseados em Radix UI:

- Accordion
- Alert Dialog
- Avatar
- Button
- Checkbox
- Dialog
- Dropdown Menu
- Form
- Input
- Label
- Select
- Switch
- Tabs
- Toast
- Tooltip
- E muito mais...

## 📝 Ferramentas de Qualidade de Código

- **TypeScript**: Tipagem estática
- **ESLint**: Análise de código estático
- **Oxlint**: Linter extremamente rápido
- **Prettier**: Formatação automática de código

## 🔄 Workflow de Desenvolvimento

1. Instale as dependências: `npm install`
2. Inicie o servidor de desenvolvimento: `npm start`
3. Faça suas alterações
4. Verifique o código: `npm run lint`
5. Formate o código: `npm run format`
6. Crie a build: `npm run build`
7. Visualize a build: `npm run preview`

## 📦 Build e Deploy

Para criar uma build otimizada para produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/` e estarão prontos para deploy.

## 🔐 Configuração do Supabase

Este projeto utiliza o Supabase como backend. Para configurar:

1. **Criar projeto no Supabase**: Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. **Configurar variáveis de ambiente**: Veja [Guia de Configuração](docs/CONFIGURAR_VARIAVEIS_AMBIENTE.md)
3. **Testar conexão**: Acesse `/configuracoes/supabase-test` (apenas para admins)

**📚 Documentação relacionada:**
- [Setup Completo do Supabase](docs/SUPABASE_SETUP.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Estrutura de Pastas](docs/ESTRUTURA_SUPABASE.md)

## 🆘 Problemas?

Consulte o [Guia de Troubleshooting](docs/TROUBLESHOOTING.md) para soluções de problemas comuns.
