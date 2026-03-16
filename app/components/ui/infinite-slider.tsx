'use client'

import { cn } from '@/lib/utils'
import { useMotionValue, animate, motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import useMeasure from 'react-use-measure'

type InfiniteSliderProps = {
  children: React.ReactNode
  gap?: number
  duration?: number
  speedOnHover?: number
  reverse?: boolean
  className?: string
}

export function InfiniteSlider({
  children,
  gap = 16,
  duration = 25,
  speedOnHover,
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [currentDuration, setCurrentDuration] = useState(duration)
  const [ref, { width }] = useMeasure()
  const translation = useMotionValue(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    const contentSize = width + gap
    const from = reverse ? -contentSize / 2 : 0
    const to = reverse ? 0 : -contentSize / 2

    let controls: ReturnType<typeof animate>

    if (isTransitioning) {
      controls = animate(translation, [translation.get(), to], {
        ease: 'linear',
        duration: currentDuration * Math.abs((translation.get() - to) / contentSize),
        onComplete: () => {
          setIsTransitioning(false)
          setKey(k => k + 1)
        },
      })
    } else {
      controls = animate(translation, [from, to], {
        ease: 'linear',
        duration: currentDuration,
        repeat: Infinity,
        repeatType: 'loop',
        repeatDelay: 0,
        onRepeat: () => translation.set(from),
      })
    }

    return () => controls?.stop()
  }, [key, translation, currentDuration, width, gap, isTransitioning, reverse])

  const hoverProps = speedOnHover
    ? {
        onHoverStart: () => { setIsTransitioning(true); setCurrentDuration(speedOnHover) },
        onHoverEnd: () => { setIsTransitioning(true); setCurrentDuration(duration) },
      }
    : {}

  return (
    <div className={cn('overflow-hidden', className)}>
      <motion.div
        ref={ref}
        className="flex w-max"
        style={{ x: translation, gap: `${gap}px` }}
        {...hoverProps}
      >
        {children}
        {children}
      </motion.div>
    </div>
  )
}
