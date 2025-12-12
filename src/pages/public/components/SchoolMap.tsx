import { useState, useRef } from 'react'
import { School, MapPin, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { School as SchoolType } from '@/lib/mock-data'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SchoolMapProps {
  schools: SchoolType[]
}

export function SchoolMap({ schools }: SchoolMapProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const mapRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3))
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5))
  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <CardContent className="p-0 relative h-[500px] bg-blue-50 overflow-hidden cursor-move">
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white/90 p-2 rounded-lg shadow-md backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={resetView}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        {/* Map Container */}
        <div
          ref={mapRef}
          className="w-full h-full flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
            className="relative w-[1000px] h-[600px] bg-[url('https://img.usecurling.com/p/1000/600?q=city%20map&dpr=2')] bg-cover bg-center rounded-lg shadow-inner"
          >
            {/* School Markers */}
            <TooltipProvider>
              {schools.map((school) => {
                // If coordinates exist use them, otherwise random positions for mock
                // In a real app with coordinates, we'd map lat/long to x/y percentages relative to map bounds
                const left = school.coordinates?.lng || Math.random() * 80 + 10
                const top = school.coordinates?.lat || Math.random() * 80 + 10

                return (
                  <Tooltip key={school.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute transform -translate-x-1/2 -translate-y-full hover:z-20 cursor-pointer group"
                        style={{ left: `${left}%`, top: `${top}%` }}
                      >
                        <div className="relative">
                          <MapPin className="h-8 w-8 text-red-600 drop-shadow-md fill-white group-hover:text-red-700 group-hover:scale-110 transition-transform" />
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-3/4">
                            <School className="h-3 w-3 text-red-600" />
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="font-bold">{school.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {school.address}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
