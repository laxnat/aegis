'use client'

import { createContext, useContext, useState } from 'react'

// Surfaces the active document's title and last-saved time into NavButtons,
// which lives outside the document route subtree
type DocHeaderCtx = {
  title: string | null
  lastSavedAt: Date | null
  setTitle: (t: string | null) => void
  setLastSavedAt: (d: Date | null) => void
}

const DocHeaderContext = createContext<DocHeaderCtx>({
  title: null,
  lastSavedAt: null,
  setTitle: () => {},
  setLastSavedAt: () => {},
})

export function useDocHeader() {
  return useContext(DocHeaderContext)
}

export function DocHeaderProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  return (
    <DocHeaderContext.Provider value={{ title, lastSavedAt, setTitle, setLastSavedAt }}>
      {children}
    </DocHeaderContext.Provider>
  )
}
