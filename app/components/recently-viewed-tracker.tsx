'use client'

import { useEffect } from 'react'

export type RecentItem = {
  id: string
  title: string
  type: 'doc' | 'folder'
  viewedAt: number
}

export const RECENT_KEY = 'aegis_recently_viewed'
const MAX_RECENT = 10

export function RecentlyViewedTracker({ id, title, type }: { id: string; title: string; type: 'doc' | 'folder' }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      const items: RecentItem[] = raw ? JSON.parse(raw) : []
      const filtered = items.filter(i => !(i.id === id && i.type === type))
      const updated = [{ id, title, type, viewedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch {}
  }, [id, title, type])

  return null
}
