'use client'

import Link from 'next/link'
import { FileText, Star } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentMenu, getStatusConfig } from '../components/document-menu'

type Props = {
  id: string
  title: string
  relativeTime: string
  pinned?: boolean
  onPin?: () => void
  view?: 'grid' | 'list'
  status?: string | null
}

export function DocCard({ id, title, relativeTime, pinned, onPin, view = 'grid', status }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const statusCfg = getStatusConfig(status)

  const statusBadge = status ? (
    <span className={`font-ui text-sm px-1.5 py-0.5 rounded ${statusCfg.text} bg-white/5`}>
      {statusCfg.label}
    </span>
  ) : null

  if (view === 'list') {
    return (
      <div className="relative group/card flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/4 transition-colors">
        {onPin && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onPin() }}
            className={`shrink-0 transition-colors ${pinned ? 'text-highlight' : 'text-white/15 hover:text-white/40 opacity-0 group-hover/card:opacity-100'}`}
            title={pinned ? 'Unpin' : 'Pin'}
          >
            <Star size={12} className={pinned ? 'fill-highlight' : ''} />
          </button>
        )}
        <FileText size={14} className="text-primary/40 shrink-0" />
        <Link href={`/documents/${id}`} className="flex-1 min-w-0 font-ui text-lg text-white truncate hover:text-primary transition-colors">
          {title}
        </Link>
        {statusBadge}
        <p className="font-ui text-sm text-white/20 shrink-0">{relativeTime}</p>
        <div className={`transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'}`}>
          <DocumentMenu
            documentId={id}
            title={title}
            status={status}
            afterDelete={() => router.refresh()}
            onOpenChange={setMenuOpen}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative group/card border border-white/8 bg-tertiary hover:border-white/15 transition-colors rounded-lg flex flex-col">
      <Link
        href={`/documents/${id}`}
        className="flex flex-col gap-3 p-4 flex-1 group"
      >
        <FileText size={28} className="text-primary/40 shrink-0 group-hover:text-primary/70 transition-colors" />
        <p className="font-ui text-xl text-white truncate group-hover:text-primary transition-colors">{title}</p>
        {statusBadge && <div>{statusBadge}</div>}
        <div className="mt-auto flex items-end justify-between gap-2">
          <p className="font-ui text-sm text-white/20">{relativeTime}</p>
          {onPin && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onPin() }}
              className={`shrink-0 transition-colors ${pinned ? 'text-highlight' : 'text-white/15 hover:text-white/40 opacity-0 group-hover/card:opacity-100'}`}
              title={pinned ? 'Unpin' : 'Pin'}
            >
              <Star size={12} className={pinned ? 'fill-highlight' : ''} />
            </button>
          )}
        </div>
      </Link>

      <div className={`absolute top-3 right-3 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'}`}>
        <DocumentMenu
          documentId={id}
          title={title}
          status={status}
          afterDelete={() => router.refresh()}
          onOpenChange={setMenuOpen}
        />
      </div>
    </div>
  )
}
