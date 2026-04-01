'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="font-display text-6xl text-white tracking-widest">OOPS</h1>
        <div className="h-1 w-12 bg-highlight mx-auto" />
        <p className="font-ui text-white/50 text-lg">Something went wrong on our end.</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="font-display text-xl text-secondary bg-highlight px-5 py-2 rounded-xl tracking-widest hover:bg-primary hover:text-white transition-colors"
          >
            TRY AGAIN
          </button>
          <Link
            href="/documents"
            className="font-display text-xl text-white/60 border border-white/10 px-5 py-2 rounded-xl tracking-widest hover:text-white hover:border-white/30 transition-colors"
          >
            GO HOME
          </Link>
        </div>
      </div>
    </div>
  )
}
