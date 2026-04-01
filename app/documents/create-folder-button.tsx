'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FolderPlus } from 'lucide-react'
import { toast } from 'sonner'

export function CreateFolderButton({ parentId }: { parentId?: string } = {}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Folder', parentId: parentId ?? null }),
      })
      if (!response.ok) throw new Error()
      router.refresh()
    } catch {
      toast.error('Failed to create folder')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="flex items-center gap-2 font-display text-xl text-white/60 border border-white/10 px-5 py-2 rounded-xl tracking-widest hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FolderPlus size={16} />
      {loading ? 'CREATING...' : 'NEW FOLDER'}
    </button>
  )
}
