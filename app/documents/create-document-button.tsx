'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export function CreateDocumentButton({ folderId }: { folderId?: string } = {}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled', folderId: folderId ?? null }),
      })
      if (!response.ok) throw new Error()
      const document = await response.json()
      router.push(`/documents/${document.id}`)
    } catch {
      toast.error('Failed to create document')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="flex items-center gap-2 font-display text-xl text-secondary bg-highlight px-5 py-2 rounded-xl tracking-widest hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Plus size={16} strokeWidth={3} />
      {loading ? 'CREATING...' : 'NEW'}
    </button>
  )
}
