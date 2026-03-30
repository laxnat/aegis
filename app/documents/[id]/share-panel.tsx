'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { UserPlus, X, ChevronDown, Eye, Pencil } from 'lucide-react'

type Profile = { fullName: string | null; avatarUrl: string | null }

type Share = {
  id: string
  sharedEmail: string
  permission: string
  profile: Profile
}

type Props = {
  documentId: string
  isOwner?: boolean
  knownOwnerEmail?: string
}

function Avatar({ email, profile, size = 7 }: { email: string; profile: Profile; size?: number }) {
  const label = profile.fullName || email
  const initial = label[0].toUpperCase()
  const dim = `w-${size} h-${size}`
  return (
    <div className={`${dim} rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0`}>
      {profile.avatarUrl ? (
        <img src={profile.avatarUrl} alt={label} className="w-full h-full object-cover" />
      ) : (
        <span className="font-ui text-xs text-white/50">{initial}</span>
      )}
    </div>
  )
}

export function SharePanel({ documentId, isOwner = false, knownOwnerEmail }: Props) {
  const [open, setOpen] = useState(false)
  const [shares, setShares] = useState<Share[]>([])
  const [ownerEmail, setOwnerEmail] = useState<string | null>(knownOwnerEmail ?? null)
  const [ownerProfile, setOwnerProfile] = useState<Profile>({ fullName: null, avatarUrl: null })
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit'>('view')
  const [loading, setLoading] = useState(false)
  const [sharesLoading, setSharesLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSharesLoading(true)
    fetch(`/api/documents/${documentId}/shares`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        if (Array.isArray(data)) { setShares(data); return }
        if (data.shares) setShares(data.shares)
        if (data.ownerEmail) setOwnerEmail(data.ownerEmail)
        if (data.ownerProfile) setOwnerProfile(data.ownerProfile)
      })
      .catch(() => {})
      .finally(() => setSharesLoading(false))
  }, [documentId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('[data-share-dropdown]')) return
      if (panelRef.current && !panelRef.current.contains(target)) setOpen(false)
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
    if (!res.ok) { setError(data.error || 'Failed to share'); return }
    setShares(prev => {
      const filtered = prev.filter(s => s.id !== data.id)
      return [...filtered, { ...data, profile: { fullName: null, avatarUrl: null } }]
    })
    setEmail('')
  }

  async function updatePermission(shareId: string, newPermission: 'view' | 'edit') {
    const prev = shares.find(s => s.id === shareId)
    setShares(cur => cur.map(s => s.id === shareId ? { ...s, permission: newPermission } : s))
    const res = await fetch(`/api/documents/${documentId}/shares/${shareId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission: newPermission }),
    })
    if (!res.ok && prev) {
      setShares(cur => cur.map(s => s.id === shareId ? { ...s, permission: prev.permission } : s))
    }
  }

  async function removeShare(shareId: string) {
    setRemovingId(shareId)
    await fetch(`/api/documents/${documentId}/shares/${shareId}`, { method: 'DELETE' })
    setShares(prev => prev.filter(s => s.id !== shareId))
    setRemovingId(null)
  }

  const ownerDisplayName = ownerProfile.fullName || ownerEmail || 'Document Owner'

  const allParticipants = [
    { email: ownerEmail ?? '', profile: ownerProfile, label: 'owner' },
    ...shares.map(s => ({ email: s.sharedEmail, profile: s.profile, label: s.permission })),
  ].filter(p => p.email)

  const [tooltip, setTooltip] = useState<{ participant: typeof allParticipants[0]; x: number; y: number } | null>(null)

  return (
    <div className="relative flex items-center gap-2" ref={panelRef}>
      {/* Participant avatars */}
      {allParticipants.length > 0 && (
        <div className="flex items-center">
          {allParticipants.slice(0, 5).map((p, i) => {
            const displayName = p.profile.fullName || p.email
            return (
              <div
                key={p.email}
                style={{ marginLeft: i === 0 ? 0 : 4, position: 'relative' }}
                onMouseEnter={e => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setTooltip({ participant: p, x: rect.left + rect.width / 2, y: rect.top })
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border-2 border-secondary flex items-center justify-center cursor-default">
                  {p.profile.avatarUrl ? (
                    <img src={p.profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-ui text-xs text-white/60">{displayName[0].toUpperCase()}</span>
                  )}
                </div>
              </div>
            )
          })}
          {allParticipants.length > 5 && (
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-ui text-xs text-white/50" style={{ marginLeft: 4 }}>
              +{allParticipants.length - 5}
            </div>
          )}
        </div>
      )}

      {/* Avatar tooltip portal */}
      {tooltip && typeof window !== 'undefined' && createPortal(
        <div
          style={{ position: 'fixed', top: tooltip.y - 8, left: tooltip.x, transform: 'translate(-50%, -100%)', zIndex: 9999, pointerEvents: 'none' }}
          className="whitespace-nowrap"
        >
          <div className="bg-tertiary border border-white/10 rounded-lg px-2.5 py-1.5 shadow-xl">
            <p className="font-ui text-xs text-white">{tooltip.participant.profile.fullName || tooltip.participant.email}</p>
            {tooltip.participant.profile.fullName && (
              <p className="font-ui text-xs text-white/40">{tooltip.participant.email}</p>
            )}
          </div>
        </div>,
        document.body
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors font-ui text-sm"
      >
        <UserPlus size={14} />
        <span>Share</span>
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
            {/* Skeleton rows while loading */}
            {sharesLoading && (
              <div className="animate-pulse px-4 py-2 space-y-3">
                {[72, 56, 64].map(w => (
                  <div key={w} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/8 shrink-0" />
                    <div className={`h-3 bg-white/8 rounded`} style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            )}

            {/* Owner + share rows */}
            {!sharesLoading && (
              <>
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar email={ownerEmail ?? '?'} profile={ownerProfile} />
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-sm text-white/80 truncate">{ownerDisplayName}</p>
                    {ownerProfile.fullName && ownerEmail && (
                      <p className="font-ui text-xs text-white/30 truncate">{ownerEmail}</p>
                    )}
                  </div>
                  <span className="font-ui text-xs px-2 py-0.5 rounded-md border text-primary border-primary/20 bg-primary/10 shrink-0">
                    owner
                  </span>
                </div>

                {shares.length > 0 && <div className="mx-4 border-t border-white/5" />}

                {shares.map(share => {
                  const displayName = share.profile.fullName || share.sharedEmail
                  return (
                    <div key={share.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/3 group">
                      <Avatar email={share.sharedEmail} profile={share.profile} />
                      <div className="flex-1 min-w-0">
                        <p className="font-ui text-sm text-white/70 truncate">{displayName}</p>
                        {share.profile.fullName && (
                          <p className="font-ui text-xs text-white/30 truncate">{share.sharedEmail}</p>
                        )}
                      </div>
                      {isOwner ? (
                        <>
                          <PermissionToggle
                            value={share.permission as 'view' | 'edit'}
                            onChange={v => updatePermission(share.id, v)}
                          />
                          <button
                            onClick={() => removeShare(share.id)}
                            disabled={removingId === share.id}
                            className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-100"
                          >
                            {removingId === share.id
                              ? <div className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
                              : <X size={12} />}
                          </button>
                        </>
                      ) : (
                        <span className={`font-ui text-xs px-2 py-0.5 rounded-md border shrink-0 ${share.permission === 'edit' ? 'text-primary border-primary/20 bg-primary/10' : 'text-white/40 border-white/10 bg-white/5'}`}>
                          {share.permission}
                        </span>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PermissionToggle({
  value,
  onChange,
}: {
  value: 'view' | 'edit'
  onChange: (v: 'view' | 'edit') => void
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
        {value === 'view' ? <Eye size={12} className="text-white/50" /> : <Pencil size={12} className="text-primary" />}
        <span className="font-ui text-xs text-white/60 capitalize">{value}</span>
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
