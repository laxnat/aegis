'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Camera } from 'lucide-react'

type Profile = {
  fullName: string | null
  avatarUrl: string | null
}

type ProfilePanelProps = {
  userEmail: string
  onClose: () => void
  onSaved: (profile: Profile) => void
}

function compressImage(file: File, size = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      const min = Math.min(img.width, img.height)
      const sx = (img.width - min) / 2
      const sy = (img.height - min) / 2
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export function ProfilePanel({ userEmail, onClose, onSaved }: ProfilePanelProps) {
  const [profile, setProfile] = useState<Profile>({ fullName: null, avatarUrl: null })
  const [fullName, setFullName] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [pendingDataUrl, setPendingDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : null)
      .then((p: Profile | null) => {
        if (!p) return
        setProfile(p)
        setFullName(p.fullName ?? '')
        setAvatarPreview(p.avatarUrl)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImage(file)
    setPendingDataUrl(dataUrl)
    setAvatarPreview(dataUrl)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          avatarUrl: pendingDataUrl ?? profile.avatarUrl,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save profile')
      }
      const saved: Profile = await res.json()
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const initials = (fullName.trim() || userEmail)[0].toUpperCase()

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm bg-secondary border border-white/10 rounded-xl shadow-xl mx-4 overflow-hidden max-h-[90svh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/8">
          <p className="font-display text-xl text-white">Profile</p>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors p-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center py-2">
              <button
                className="relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-2xl text-primary">{initials}</span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={15} className="text-white" />
                </div>
              </button>
              <p className="mt-1.5 font-ui text-base text-white/25">Click to change photo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Full name */}
            <div>
              <p className="font-ui text-base text-white/35 mb-1">Full name</p>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-ui text-lg text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <p className="font-ui text-base text-white/35 mb-1">Email</p>
              <input
                type="text"
                value={userEmail}
                readOnly
                className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 font-ui text-lg text-white/30 cursor-default outline-none"
              />
            </div>

            {error && <p className="font-ui text-base text-red-400">{error}</p>}

            {/* Footer */}
            <div className="pt-1 border-t border-white/5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-1.5 rounded-lg bg-highlight text-secondary font-display text-sm tracking-widest hover:bg-primary hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Update Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
