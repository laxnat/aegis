'use client'

import { useEffect } from 'react'

export default function DocumentsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <h2 className="font-display text-4xl text-white tracking-widest">ERROR</h2>
        <div className="h-1 w-12 bg-highlight mx-auto" />
        <p className="font-ui text-white/50 text-lg">Something went wrong loading this page.</p>
        <button
          onClick={reset}
          className="font-display text-xl text-secondary bg-highlight px-5 py-2 rounded-xl tracking-widest hover:bg-primary hover:text-white transition-colors"
        >
          TRY AGAIN
        </button>
      </div>
    </div>
  )
}
