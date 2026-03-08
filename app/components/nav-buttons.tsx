'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function NavButtons() {
  const router = useRouter()

  return (
    <div className="flex items-center gap-1 p-2 bg-tertiary">
      <button
        onClick={() => router.back()}
        className="p-2 hover:bg-white/8 text-white/50 hover:text-white rounded transition-colors"
        title="Go back"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => router.forward()}
        className="p-2 hover:bg-white/8 text-white/50 hover:text-white rounded transition-colors"
        title="Go forward"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
