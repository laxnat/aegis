'use client'

import { createContext, useContext, useCallback, useRef, useState } from 'react'

type Ctx = { start: () => void; done: () => void }
const LoadingBarContext = createContext<Ctx>({ start: () => {}, done: () => {} })

export function useLoadingBar() {
  return useContext(LoadingBarContext)
}

export function LoadingBarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const [opacity, setOpacity] = useState(1)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const start = useCallback(() => {
    clearTimers()
    setOpacity(1)
    setWidth(0)
    setVisible(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setWidth(80))
    })
  }, [])

  const done = useCallback(() => {
    clearTimers()
    setWidth(100)
    const t1 = setTimeout(() => setOpacity(0), 200)
    const t2 = setTimeout(() => { setVisible(false); setWidth(0); setOpacity(1) }, 500)
    timers.current = [t1, t2]
  }, [])

  return (
    <LoadingBarContext.Provider value={{ start, done }}>
      {visible && (
        <div
          className="fixed top-0 left-0 right-0 z-[9999] h-0.5 pointer-events-none"
          style={{ opacity, transition: 'opacity 300ms ease' }}
        >
          <div
            className="h-full bg-highlight"
            style={{
              width: `${width}%`,
              transition: width === 0
                ? 'none'
                : width === 100
                ? 'width 200ms ease-out'
                : 'width 1000ms cubic-bezier(0.1, 0.5, 0.5, 1)',
            }}
          />
        </div>
      )}
      {children}
    </LoadingBarContext.Provider>
  )
}
