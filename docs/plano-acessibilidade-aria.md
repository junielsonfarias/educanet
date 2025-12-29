# Plano de Implementação - Acessibilidade (ARIA)

**Data de Criação:** 2025-01-27  
**Status:** 📋 Planejamento  
**Prioridade:** 🟡 Média  
**Estimativa:** 2 semanas

## 📋 Objetivo

Melhorar acessibilidade da aplicação através de atributos ARIA, navegação por teclado, suporte a leitores de tela e conformidade com WCAG 2.1 nível AA.

---

## 🎯 Escopo

### Melhorias a Implementar

#### 1. Atributos ARIA
- [ ] Adicionar roles apropriados
- [ ] Adicionar aria-labels
- [ ] Adicionar aria-describedby
- [ ] Adicionar aria-labelledby
- [ ] Adicionar aria-live regions
- [ ] Adicionar aria-expanded
- [ ] Adicionar aria-hidden
- [ ] Adicionar aria-current

#### 2. Navegação por Teclado
- [ ] Navegação completa por teclado
- [ ] Indicadores de foco visíveis
- [ ] Ordem de tabulação lógica
- [ ] Atalhos de teclado
- [ ] Escape para fechar modais
- [ ] Enter/Space para ativar

#### 3. Leitores de Tela
- [ ] Textos alternativos em imagens
- [ ] Descrições de formulários
- [ ] Anúncios de mudanças
- [ ] Estrutura semântica
- [ ] Landmarks ARIA

#### 4. Contraste e Visual
- [ ] Contraste de cores adequado (WCAG AA)
- [ ] Tamanho de fonte ajustável
- [ ] Não depender apenas de cor
- [ ] Estados visuais claros

---

## 🏗️ Arquitetura

### Estrutura de Componentes Acessíveis

```typescript
// Exemplo: Button acessível
<button
  type="button"
  aria-label="Adicionar novo aluno"
  aria-describedby="button-help"
  className="..."
>
  <PlusIcon aria-hidden="true" />
  Adicionar
</button>
<span id="button-help" className="sr-only">
  Abre formulário para cadastrar novo aluno
</span>
```

### Componentes Base Acessíveis

```typescript
// src/components/accessible/
├── AccessibleButton.tsx
├── AccessibleInput.tsx
├── AccessibleSelect.tsx
├── AccessibleDialog.tsx
├── AccessibleTable.tsx
└── ScreenReaderOnly.tsx
```

---

## 📝 Fases de Implementação

### Fase 1: Audit e Baseline (2 dias)
- [ ] Executar audit de acessibilidade
- [ ] Testar com leitores de tela
- [ ] Testar navegação por teclado
- [ ] Identificar problemas
- [ ] Criar lista de prioridades

### Fase 2: Componentes Base (3-4 dias)
- [ ] Criar componentes acessíveis base
- [ ] Adicionar atributos ARIA básicos
- [ ] Implementar navegação por teclado
- [ ] Adicionar textos alternativos
- [ ] Testar com leitores de tela

### Fase 3: Formulários (2-3 dias)
- [ ] Adicionar labels em todos os inputs
- [ ] Adicionar aria-describedby para ajuda
- [ ] Adicionar aria-invalid para erros
- [ ] Adicionar aria-required
- [ ] Melhorar feedback de validação
- [ ] Testar navegação por teclado

### Fase 4: Navegação e Modais (2 dias)
- [ ] Adicionar landmarks ARIA
- [ ] Melhorar navegação por teclado
- [ ] Adicionar skip links
- [ ] Melhorar modais (foco, escape)
- [ ] Adicionar aria-live para anúncios
- [ ] Testar com leitores de tela

### Fase 5: Tabelas e Dados (1-2 dias)
- [ ] Adicionar headers em tabelas
- [ ] Adicionar captions
- [ ] Adicionar aria-sort
- [ ] Melhorar navegação em tabelas
- [ ] Testar com leitores de tela

### Fase 6: Visual e Contraste (1 dia)
- [ ] Verificar contraste de cores
- [ ] Adicionar estados visuais
- [ ] Melhorar indicadores de foco
- [ ] Testar com diferentes temas

---

## 🔧 Ferramentas e Bibliotecas

### Ferramentas de Teste

#### Audit Automático
```bash
# axe DevTools (extensão Chrome)
# WAVE (extensão Chrome)
# Lighthouse (Chrome DevTools)
```

#### Leitores de Tela
- NVDA (Windows, gratuito)
- JAWS (Windows, pago)
- VoiceOver (macOS/iOS, incluído)
- TalkBack (Android, incluído)

### Bibliotecas Úteis

```bash
# Já temos Shadcn UI que é acessível
# Adicionar focus-visible para melhor foco
npm install focus-visible
```

---

## 📋 Checklist de Acessibilidade

### Navegação
- [ ] Todas as funcionalidades acessíveis por teclado
- [ ] Ordem de tabulação lógica
- [ ] Indicadores de foco visíveis
- [ ] Skip links para conteúdo principal
- [ ] Atalhos de teclado documentados

### Formulários
- [ ] Todos os inputs têm labels
- [ ] Labels associados corretamente
- [ ] Mensagens de erro acessíveis
- [ ] Instruções de ajuda disponíveis
- [ ] Validação anunciada

### Conteúdo
- [ ] Textos alternativos em imagens
- [ ] Estrutura semântica (headings, lists)
- [ ] Contraste de cores adequado (4.5:1)
- [ ] Tamanho de fonte ajustável
- [ ] Não depender apenas de cor

### Interatividade
- [ ] Botões têm labels descritivos
- [ ] Links têm texto descritivo
- [ ] Modais gerenciam foco corretamente
- [ ] Anúncios de mudanças (aria-live)
- [ ] Estados anunciados (expanded, selected)

---

## ✅ Critérios de Sucesso

### Conformidade
- ✅ WCAG 2.1 nível AA
- ✅ 0 erros críticos de acessibilidade
- ✅ 0 avisos de acessibilidade
- ✅ Score Lighthouse acessibilidade > 90

### Funcionalidade
- ✅ Navegação completa por teclado
- ✅ Funciona com leitores de tela
- ✅ Contraste adequado
- ✅ Textos alternativos em imagens

### Testes
- ✅ Testado com NVDA
- ✅ Testado com VoiceOver
- ✅ Testado navegação por teclado
- ✅ Audit automático sem erros

---

## 🧪 Estratégia de Testes

### Testes Automáticos
- [ ] Executar axe DevTools
- [ ] Executar WAVE
- [ ] Executar Lighthouse
- [ ] Verificar contraste de cores
- [ ] Verificar estrutura semântica

### Testes Manuais
- [ ] Testar com NVDA
- [ ] Testar com VoiceOver
- [ ] Testar navegação por teclado
- [ ] Testar com usuários reais
- [ ] Testar em diferentes navegadores

---

## 🚀 Próximos Passos Imediatos

1. **Executar audit** (2 horas)
   - Instalar extensões
   - Executar audit completo
   - Documentar problemas

2. **Criar componentes base** (1 dia)
   - ScreenReaderOnly
   - AccessibleButton
   - AccessibleInput
   - Testar com leitores

3. **Melhorar formulários** (1 dia)
   - Adicionar labels
   - Adicionar aria-describedby
   - Adicionar aria-invalid
   - Testar navegação

4. **Melhorar navegação** (1 dia)
   - Adicionar landmarks
   - Melhorar foco
   - Adicionar skip links
   - Testar teclado

---

## ⚠️ Pontos de Atenção

1. **ARIA**: Não usar ARIA quando HTML semântico é suficiente
2. **Foco**: Sempre gerenciar foco em modais
3. **Anúncios**: Usar aria-live com moderação
4. **Contraste**: Verificar em todos os temas
5. **Testes**: Testar com usuários reais
6. **Performance**: ARIA não deve impactar performance

---

## 📚 Documentação

### Documentação Técnica
- [ ] Documentar padrões de acessibilidade
- [ ] Documentar componentes acessíveis
- [ ] Documentar como adicionar ARIA
- [ ] Guia de boas práticas

### Documentação de Usuário
- [ ] Guia de navegação por teclado
- [ ] Guia de atalhos
- [ ] Informações de acessibilidade

---

## 🔗 Referências

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

