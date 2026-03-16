'use client'

import { cn } from '@/lib/utils'

type ProgressiveBlurProps = {
  direction?: 'left' | 'right'
  blurIntensity?: number
  blurLayers?: number
  className?: string
}

export function ProgressiveBlur({
  direction = 'left',
  blurIntensity = 0.25,
  blurLayers = 8,
  className,
}: ProgressiveBlurProps) {
  const angle = direction === 'left' ? 90 : 270
  const layers = Math.max(blurLayers, 2)
  const segmentSize = 1 / (layers + 1)

  return (
    <div className={cn('relative pointer-events-none', className)}>
      {Array.from({ length: layers }).map((_, index) => {
        const stops = [
          index * segmentSize,
          (index + 1) * segmentSize,
          (index + 2) * segmentSize,
          (index + 3) * segmentSize,
        ].map((pos, pi) =>
          `rgba(255,255,255,${pi === 1 || pi === 2 ? 1 : 0}) ${pos * 100}%`
        )

        const gradient = `linear-gradient(${angle}deg, ${stops.join(', ')})`

        return (
          <div
            key={index}
            className="absolute inset-0"
            style={{
              maskImage: gradient,
              WebkitMaskImage: gradient,
              backdropFilter: `blur(${index * blurIntensity}px)`,
            }}
          />
        )
      })}
    </div>
  )
}
