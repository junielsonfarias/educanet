import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroSlide } from '@/lib/mock-data'

interface HeroCarouselProps {
  slides: HeroSlide[]
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function HeroCarousel({ slides, autoPlay = true, autoPlayInterval = 5 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Memoizar slides ativos para evitar recálculos desnecessários
  const activeSlides = useMemo(() => {
    if (!Array.isArray(slides)) return []
    return slides.filter((s) => s && s.active).sort((a, b) => a.order - b.order)
  }, [slides])

  // Resetar índice quando slides mudarem
  useEffect(() => {
    if (currentIndex >= activeSlides.length && activeSlides.length > 0) {
      setCurrentIndex(0)
    }
  }, [activeSlides.length, currentIndex])

  useEffect(() => {
    if (!autoPlay || activeSlides.length <= 1 || isTransitioning) return

    const interval = setInterval(() => {
      setIsTransitioning(true)
      setCurrentIndex((prev) => {
        const next = (prev + 1) % activeSlides.length
        setTimeout(() => setIsTransitioning(false), 100)
        return next
      })
    }, (autoPlayInterval || 5) * 1000)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, activeSlides.length, isTransitioning])

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= activeSlides.length || isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 1000)
  }, [activeSlides.length, isTransitioning])

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => {
      const next = (prev - 1 + activeSlides.length) % activeSlides.length
      setTimeout(() => setIsTransitioning(false), 1000)
      return next
    })
  }, [activeSlides.length, isTransitioning])

  const goToNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => {
      const next = (prev + 1) % activeSlides.length
      setTimeout(() => setIsTransitioning(false), 1000)
      return next
    })
  }, [activeSlides.length, isTransitioning])

  if (activeSlides.length === 0) {
    return null
  }

  const safeIndex = Math.min(currentIndex, activeSlides.length - 1)
  const currentSlide = activeSlides[safeIndex]

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Slides */}
      <div className="relative h-full">
        {activeSlides.map((slide, index) => {
          if (!slide || !slide.imageUrl) return null
          
          const isActive = index === safeIndex
          
          return (
            <div
              key={`slide-${slide.id}-${index}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
              style={{
                willChange: isActive ? 'opacity' : 'auto',
              }}
            >
              <img
                src={slide.imageUrl}
                alt={slide.title || `Slide ${index + 1}`}
                className="w-full h-full object-cover"
                loading={isActive ? 'eager' : 'lazy'}
                onError={(e) => {
                  // Fallback para imagem quebrada
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-blue-600/80 to-primary/90" />
            </div>
          )
        })}
      </div>

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            onClick={goToPrevious}
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            onClick={goToNext}
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {activeSlides.map((slide, index) => (
            <button
              key={`dot-${slide.id}-${index}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === safeIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para slide ${index + 1}`}
              disabled={isTransitioning}
            />
          ))}
        </div>
      )}
    </div>
  )
}

