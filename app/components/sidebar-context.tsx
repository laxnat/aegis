'use client'

import { createContext, useContext, useState } from 'react'

// Mobile drawer open/close state — shared between the hamburger in NavButtons
// and the Sidebar so either can trigger it
const SidebarContext = createContext<{
  open: boolean
  toggle: () => void
  close: () => void
}>({ open: false, toggle: () => {}, close: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen(v => !v), close: () => setOpen(false) }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebarMobile = () => useContext(SidebarContext)
