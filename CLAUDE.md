# Regras e Convencoes do Projeto EduCanet

Este arquivo define as regras e convencoes que devem ser seguidas ao trabalhar neste projeto.

---

## 1. REGRA DE DOCUMENTACAO OBRIGATORIA

**IMPORTANTE:** Sempre que uma acao significativa for realizada no sistema, o arquivo `docs/ESTADO_ATUAL_PROJETO.md` DEVE ser atualizado para refletir as mudancas.

### Acoes que Requerem Atualizacao:

1. **Criacao de novos arquivos/componentes**
   - Adicionar na secao de estrutura do projeto
   - Atualizar contagem de arquivos

2. **Correcao de bugs**
   - Adicionar na secao "Problemas Resolvidos"
   - Documentar causa e solucao

3. **Novas funcionalidades**
   - Adicionar na secao "Funcionalidades Implementadas"
   - Atualizar estatisticas

4. **Alteracoes no banco de dados**
   - Atualizar secao de tabelas/ENUMs
   - Documentar novas migrations

5. **Correcoes de TypeScript/Qualidade**
   - Atualizar secao de pendencias
   - Documentar o que foi corrigido

6. **Alteracoes em services/stores**
   - Atualizar contagem de metodos/acoes
   - Documentar novas funcionalidades

### Formato de Atualizacao:

Ao atualizar o documento, incluir:
- **Data** da alteracao
- **Descricao** breve do que foi feito
- **Impacto** no sistema (se aplicavel)
- **Arquivos** modificados (principais)

### Exemplo de Atualizacao:

```markdown
### Correcao realizada em DD/MM/AAAA
- **Descricao:** Corrigidos 50 usos de `any` nos services
- **Arquivos:** 14 arquivos em src/lib/supabase/services/
- **Impacto:** Melhoria na tipagem e seguranca do codigo
```

---

## 2. CONVENCOES DE CODIGO

### TypeScript
- Evitar uso de `any` - usar `unknown` ou tipos especificos
- Usar `Record<string, unknown>` para objetos genericos
- Manter tipagem forte em todas as funcoes

### Nomenclatura
- Arquivos: `kebab-case.ts` ou `PascalCase.tsx` para componentes
- Funcoes: `camelCase`
- Interfaces/Types: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`

### Estrutura de Pastas
```
src/
  components/     # Componentes reutilizaveis
  pages/          # Paginas da aplicacao
  stores/         # Zustand stores
  lib/
    supabase/
      services/   # Services de dados
  hooks/          # Hooks customizados
  utils/          # Funcoes utilitarias
```

---

## 3. CONVENCOES DE GIT

### Commits
- Mensagens em portugues ou ingles (consistente)
- Formato: `tipo: descricao breve`
- Tipos: `feat`, `fix`, `docs`, `refactor`, `style`, `test`

### Branches
- `main` - producao
- `develop` - desenvolvimento
- `feature/nome` - novas funcionalidades
- `fix/nome` - correcoes

---

## 4. DOCUMENTACAO

### Arquivos de Documentacao Principais
1. `README.md` - Visao geral e instalacao
2. `docs/ESTADO_ATUAL_PROJETO.md` - Estado completo do projeto (MANTER ATUALIZADO)
3. `docs/TROUBLESHOOTING.md` - Solucao de problemas
4. `CLAUDE.md` - Este arquivo de regras

### Atualizacao do ESTADO_ATUAL_PROJETO.md

O arquivo deve conter:
- Resumo executivo
- Stack tecnologica
- Estrutura do projeto
- Banco de dados (tabelas, ENUMs, RLS)
- Services e Stores
- Funcionalidades implementadas
- Problemas conhecidos e solucoes
- Pendencias e melhorias futuras

---

## 5. SEGURANCA

- Nunca commitar arquivos `.env` ou `.env.local`
- Usar variaveis de ambiente para credenciais
- Manter RLS ativo em todas as tabelas
- Validar dados no frontend E backend

---

## 6. QUALIDADE DE CODIGO

### Antes de Commitar
- [ ] Remover console.log de producao (ou proteger com DEV check)
- [ ] Verificar tipagem TypeScript
- [ ] Testar funcionalidade manualmente
- [ ] Atualizar documentacao se necessario

### Code Review
- Verificar tipagem
- Verificar seguranca (RLS, validacoes)
- Verificar performance
- Verificar acessibilidade

---

**Ultima atualizacao:** 13/01/2026
