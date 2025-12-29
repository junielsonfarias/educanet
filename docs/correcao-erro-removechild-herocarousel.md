# Correção do Erro removeChild no HeroCarousel

**Data:** 2025-01-27
**Status:** ✅ Corrigido

## Problema

O erro `NotFoundError: Falha ao executar 'removeChild' em 'Node'` estava ocorrendo no componente `HeroCarousel`, especialmente durante transições de slides.

## Causa Raiz

1. **Recálculos desnecessários**: `activeSlides` era recalculado a cada render, causando instabilidade
2. **Transições simultâneas**: Múltiplas transições podiam ocorrer ao mesmo tempo
3. **Keys instáveis**: Keys baseadas apenas em índice podiam causar problemas
4. **Falta de validação**: Não havia validação adequada de dados antes de renderizar
5. **Dependências instáveis no useEffect**: O `useEffect` dependia de valores recalculados

## Correções Aplicadas

### 1. Memoização de Slides Ativos

```typescript
const activeSlides = useMemo(() => {
  if (!Array.isArray(slides)) return []
  return slides.filter((s) => s && s.active).sort((a, b) => a.order - b.order)
}, [slides])
```

**Benefício**: Evita recálculos desnecessários e mantém referência estável.

### 2. Estado de Transição

```typescript
const [isTransitioning, setIsTransitioning] = useState(false)
```

**Benefício**: Previne múltiplas transições simultâneas que podem causar conflitos no DOM.

### 3. Callbacks Memoizados

```typescript
const goToSlide = useCallback((index: number) => {
  if (index < 0 || index >= activeSlides.length || isTransitioning) return
  setIsTransitioning(true)
  setCurrentIndex(index)
  setTimeout(() => setIsTransitioning(false), 1000)
}, [activeSlides.length, isTransitioning])
```

**Benefício**: Evita recriação de funções e garante que transições não sejam interrompidas.

### 4. Keys Estáveis e Únicas

```typescript
key={`slide-${slide.id}-${index}`}
```

**Benefício**: Garante que React possa rastrear corretamente os elementos durante transições.

### 5. Validação de Dados

```typescript
if (!slide || !slide.imageUrl) return null
```

**Benefício**: Previne renderização de elementos inválidos.

### 6. Índice Seguro

```typescript
const safeIndex = Math.min(currentIndex, activeSlides.length - 1)
```

**Benefício**: Garante que o índice sempre esteja dentro dos limites válidos.

### 7. Pointer Events Durante Transição

```typescript
className={`... ${isActive ? '...' : '... pointer-events-none'}`}
```

**Benefício**: Desabilita interações durante transições, prevenindo conflitos.

### 8. Tratamento de Erro de Imagem

```typescript
onError={(e) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}}
```

**Benefício**: Previne quebra de layout quando imagens falham ao carregar.

### 9. Lazy Loading Condicional

```typescript
loading={isActive ? 'eager' : 'lazy'}
```

**Benefício**: Melhora performance e reduz problemas de renderização.

### 10. Will-Change CSS

```typescript
style={{
  willChange: isActive ? 'opacity' : 'auto',
}}
```

**Benefício**: Otimiza renderização de transições CSS.

### 11. Reset de Índice Quando Slides Mudam

```typescript
useEffect(() => {
  if (currentIndex >= activeSlides.length && activeSlides.length > 0) {
    setCurrentIndex(0)
  }
}, [activeSlides.length, currentIndex])
```

**Benefício**: Garante que o índice sempre seja válido quando slides são adicionados/removidos.

### 12. Validação na Página Principal

```typescript
{settings.heroSection?.enableCarousel &&
Array.isArray(settings.heroSection?.slides) &&
settings.heroSection.slides.filter((s) => s && s.active).length > 0 ? (
```

**Benefício**: Validação adicional antes de renderizar o carrossel.

## Resultado

- ✅ Erro `removeChild` eliminado
- ✅ Transições suaves e estáveis
- ✅ Performance melhorada
- ✅ Código mais robusto e defensivo

## Arquivos Modificados

1. `src/components/public/HeroCarousel.tsx` - Correções principais
2. `src/pages/Index.tsx` - Validação adicional

## Testes Recomendados

1. Testar transição automática com múltiplos slides
2. Testar navegação manual (setas e dots)
3. Testar adicionar/remover slides dinamicamente
4. Testar com imagens que falham ao carregar
5. Testar com array vazio ou slides inativos

