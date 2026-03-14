'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Search, FileText, Folder, X } from 'lucide-react'

type FolderData = {
  id: string
  name: string
  parentId: string | null
}

type DocData = {
  id: string
  title: string
  folderId: string | null
  updatedAt: Date | string
}

type Result =
  | { kind: 'folder'; id: string; label: string }
  | { kind: 'doc'; id: string; label: string }

type Props = {
  folders: FolderData[]
  docs: DocData[]
  open: boolean
  onClose: () => void
}

function score(label: string, query: string): number {
  const l = label.toLowerCase()
  const q = query.toLowerCase()
  if (l === q) return 3
  if (l.startsWith(q)) return 2
  if (l.includes(q)) return 1
  return 0
}

export function SearchPalette({ folders, docs, open, onClose }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const results: Result[] = (() => {
    if (!query.trim()) {
      const recentDocs = [...docs]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6)
        .map(d => ({ kind: 'doc' as const, id: d.id, label: d.title }))
      const allFolders = folders
        .slice(0, 3)
        .map(f => ({ kind: 'folder' as const, id: f.id, label: f.name }))
      return [...recentDocs, ...allFolders].slice(0, 8)
    }

    const q = query.trim()
    const folderResults: Result[] = folders
      .map(f => ({ kind: 'folder' as const, id: f.id, label: f.name, s: score(f.name, q) }))
      .filter(r => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ kind, id, label }) => ({ kind, id, label }))

    const docResults: Result[] = docs
      .map(d => ({ kind: 'doc' as const, id: d.id, label: d.title, s: score(d.title, q) }))
      .filter(r => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ kind, id, label }) => ({ kind, id, label }))

    return [...folderResults, ...docResults].slice(0, 8)
  })()

  const navigate = useCallback((result: Result) => {
    onClose()
    router.push(result.kind === 'doc'
      ? `/documents/${result.id}`
      : `/documents/folders/${result.id}`
    )
  }, [router, onClose])

  useEffect(() => { setActiveIndex(0) }, [query])

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) navigate(results[activeIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open || typeof window === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[18vh]"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl bg-secondary border border-white/10 rounded-xl shadow-2xl overflow-hidden mx-4">

        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
          <Search size={17} className="text-white/30 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search folders and documents..."
            className="flex-1 bg-transparent font-ui text-xl text-white placeholder:text-white/25 outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-white/30 hover:text-white transition-colors">
              <X size={15} />
            </button>
          ) : (
            <kbd className="font-ui text-sm text-white/20 border border-white/10 rounded px-1.5 py-0.5">esc</kbd>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="py-1.5 max-h-72 overflow-y-auto">
          {!query.trim() && (
            <p className="px-4 pt-1 pb-1.5 font-ui text-base text-white/25 tracking-widest uppercase">
              Recent
            </p>
          )}
          {results.length === 0 ? (
            <p className="px-4 py-8 font-ui text-lg text-white/25 text-center">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((result, i) => (
              <button
                key={`${result.kind}-${result.id}`}
                onClick={() => navigate(result)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 font-ui text-xl text-left transition-colors ${
                  i === activeIndex ? 'bg-white/8 text-white' : 'text-white/55 hover:text-white'
                }`}
              >
                {result.kind === 'folder'
                  ? <Folder size={16} className={i === activeIndex ? 'text-primary/80 shrink-0' : 'text-primary/35 shrink-0'} />
                  : <FileText size={16} className={i === activeIndex ? 'text-primary/80 shrink-0' : 'text-primary/35 shrink-0'} />
                }
                <span className="truncate">{result.label}</span>
                <span className={`ml-auto font-ui text-base shrink-0 ${i === activeIndex ? 'text-white/35' : 'text-white/15'}`}>
                  {result.kind === 'folder' ? 'Folder' : 'Doc'}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-5">
          <span className="font-ui text-sm text-white/20">↑↓ navigate</span>
          <span className="font-ui text-sm text-white/20">↵ open</span>
          <span className="font-ui text-sm text-white/20 ml-auto">⌘K</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
