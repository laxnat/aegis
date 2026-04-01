'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { useDocHeader } from './doc-header'
import { useEffect, useState } from 'react'
import { useSidebarMobile } from './sidebar-context'

function formatSaved(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (mins < 1) return 'saved just now'
  if (mins === 1) return 'saved 1 min ago'
  return `saved ${mins} mins ago`
}

export function NavButtons() {
  const router = useRouter()
  const { title, lastSavedAt } = useDocHeader()
  const { toggle } = useSidebarMobile()
  const [, tick] = useState(0)

  // Re-render every 30s so the relative time stays fresh
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-tertiary border-b border-white/5">
      <button
        onClick={toggle}
        className="md:hidden p-1.5 hover:bg-white/8 text-white/50 hover:text-white rounded transition-colors mr-1"
        title="Toggle sidebar"
      >
        <Menu size={16} />
      </button>
      <button
        onClick={() => { router.back(); router.refresh() }}
        className="p-1.5 hover:bg-white/8 text-white/50 hover:text-white rounded transition-colors"
        title="Go back"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => { router.forward(); router.refresh() }}
        className="p-1.5 hover:bg-white/8 text-white/50 hover:text-white rounded transition-colors"
        title="Go forward"
      >
        <ChevronRight size={16} />
      </button>

      {title && (
        <>
          <span className="mx-2 text-white/20 select-none">|</span>
          <span className="font-ui text-base text-white/80 truncate max-w-xs">{title}</span>
          {lastSavedAt && (
            <span className="ml-3 font-ui text-sm text-white/40 shrink-0">{formatSaved(lastSavedAt)}</span>
          )}
        </>
      )}
    </div>
  )
}
