'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { UserPlus, X, ChevronDown, Eye, Pencil } from 'lucide-react'

type Share = {
  id: string
  sharedEmail: string
  permission: string
}

type Props = {
  documentId: string
  isOwner?: boolean
  knownOwnerEmail?: string
}

export function SharePanel({ documentId, isOwner = false, knownOwnerEmail }: Props) {
  const [open, setOpen] = useState(false)
  const [shares, setShares] = useState<Share[]>([])
  const [ownerEmail, setOwnerEmail] = useState<string | null>(knownOwnerEmail ?? null)
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit'>('view')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    fetch(`/api/documents/${documentId}/shares`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        if (Array.isArray(data)) { setShares(data); return }
        if (data.shares) setShares(data.shares)
        if (data.ownerEmail) setOwnerEmail(data.ownerEmail)
      })
      .catch(() => {})
  }, [open, documentId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('[data-share-dropdown]')) return
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function addShare() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/documents/${documentId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), permission }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Failed to share')
      return
    }
    setShares(prev => {
      const filtered = prev.filter(s => s.id !== data.id)
      return [...filtered, data]
    })
    setEmail('')
  }

  async function updatePermission(shareId: string, newPermission: 'view' | 'edit') {
    const prev = shares.find(s => s.id === shareId)
    // Optimistic update
    setShares(current => current.map(s => s.id === shareId ? { ...s, permission: newPermission } : s))
    const res = await fetch(`/api/documents/${documentId}/shares/${shareId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission: newPermission }),
    })
    if (!res.ok && prev) {
      // Rollback on failure
      setShares(current => current.map(s => s.id === shareId ? { ...s, permission: prev.permission } : s))
    }
  }

  async function removeShare(shareId: string) {
    await fetch(`/api/documents/${documentId}/shares/${shareId}`, { method: 'DELETE' })
    setShares(prev => prev.filter(s => s.id !== shareId))
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors font-ui text-sm"
      >
        <UserPlus size={14} />
        <span>Share</span>
        {shares.length > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-ui">
            {shares.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-secondary border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="font-display text-base text-white tracking-widest">SHARE</span>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Add share — owner only */}
          {isOwner && (
            <div className="p-4 border-b border-white/8">
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && addShare()}
                  placeholder="Email address"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-ui text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-colors"
                />
                <PermissionToggle value={permission} onChange={setPermission} />
              </div>
              {error && <p className="font-ui text-xs text-red-400 mb-2">{error}</p>}
              <button
                onClick={addShare}
                disabled={loading || !email.trim()}
                className="w-full py-1.5 rounded-lg bg-highlight text-secondary font-display text-sm tracking-widest hover:bg-primary hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding…' : 'Add'}
              </button>
            </div>
          )}

          {/* Participants */}
          <div className="max-h-52 overflow-y-auto">
            {/* Owner row */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="font-ui text-xs text-primary">
                  {ownerEmail ? ownerEmail[0].toUpperCase() : '?'}
                </span>
              </div>
              <span className="flex-1 font-ui text-sm text-white/70 truncate">
                {ownerEmail ?? 'Document Owner'}
              </span>
              <span className="font-ui text-xs px-2 py-0.5 rounded-md border text-primary border-primary/20 bg-primary/10">
                owner
              </span>
            </div>

            {shares.length > 0 && <div className="mx-4 border-t border-white/5" />}

            {shares.map(share => (
                <div key={share.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/3 group">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <span className="font-ui text-xs text-white/50">
                      {share.sharedEmail[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="flex-1 font-ui text-sm text-white/70 truncate">{share.sharedEmail}</span>
                  {isOwner ? (
                    <>
                      <PermissionToggle
                        value={share.permission as 'view' | 'edit'}
                        onChange={v => updatePermission(share.id, v)}
                      />
                      <button
                        onClick={() => removeShare(share.id)}
                        className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <span className={`font-ui text-xs px-2 py-0.5 rounded-md border ${share.permission === 'edit' ? 'text-primary border-primary/20 bg-primary/10' : 'text-white/40 border-white/10 bg-white/5'}`}>
                      {share.permission}
                    </span>
                  )}
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PermissionToggle({
  value,
  onChange,
  compact = false,
}: {
  value: 'view' | 'edit'
  onChange: (v: 'view' | 'edit') => void
  compact?: boolean
}) {
  const [dropOpen, setDropOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setDropOpen(false)
    }
    if (dropOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropOpen])

  function openDrop() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.right - 112 })
    }
    setDropOpen(v => !v)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={openDrop}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        {value === 'view' ? (
          <Eye size={12} className="text-white/50" />
        ) : (
          <Pencil size={12} className="text-primary" />
        )}
        {!compact && (
          <span className="font-ui text-xs text-white/60 capitalize">{value}</span>
        )}
        <ChevronDown size={10} className="text-white/30" />
      </button>

      {dropOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropRef}
          style={{ top: pos.top, left: pos.left }}
          data-share-dropdown
          className="fixed w-28 bg-secondary border border-white/10 rounded-lg shadow-xl z-9999 overflow-hidden"
        >
          {(['view', 'edit'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setDropOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 font-ui text-sm hover:bg-white/5 transition-colors ${value === opt ? 'text-white' : 'text-white/50'}`}
            >
              {opt === 'view' ? <Eye size={12} /> : <Pencil size={12} />}
              <span className="capitalize">{opt}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
