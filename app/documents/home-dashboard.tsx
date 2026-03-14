'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { FileText, Folder, FolderOpen, LayoutGrid, List } from 'lucide-react'
import { type RecentItem, RECENT_KEY } from '../components/recently-viewed-tracker'
import { FolderCard } from './folder-card'
import { DocCard } from './doc-card'
import { CreateDocumentButton } from './create-document-button'
import { CreateFolderButton } from './create-folder-button'

type DocData = { id: string; title: string; updatedAt: string; createdAt: string; pinned: boolean; status: string | null }
type SubFolderData = { id: string; name: string; docCount: number; updatedAt: string }
type FolderData = {
  id: string
  name: string
  updatedAt: string
  createdAt: string
  pinned: boolean
  docCount: number
  documents: DocData[]
  subFolders: SubFolderData[]
}

type Props = {
  initialFolders: FolderData[]
  initialDocs: DocData[]
}

type SortKey = 'updated' | 'name' | 'created'
type FilterKey = 'all' | 'folders' | 'docs'
type ViewKey = 'grid' | 'list'

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const PANEL_WIDTH = 224 // w-56

export function HomeDashboard({ initialFolders, initialDocs }: Props) {
  const router = useRouter()
  const [folders, setFolders] = useState(initialFolders)
  const [docs, setDocs] = useState(initialDocs)
  const [sort, setSort] = useState<SortKey>('updated')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [view, setView] = useState<ViewKey>('grid')
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [draggingItem, setDraggingItem] = useState<{ id: string; type: 'folder' | 'doc' } | null>(null)
  const [panelFolder, setPanelFolder] = useState<FolderData | null>(null)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const dragItem = useRef<{ id: string; type: 'folder' | 'doc' } | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDragging = useRef(false)
  const [recentlyViewed, setRecentlyViewed] = useState<RecentItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (raw) setRecentlyViewed(JSON.parse(raw))
    } catch {}
  }, [])

  const openPanel = (folder: FolderData, rect: DOMRect) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    const left = rect.right + 8 + PANEL_WIDTH > window.innerWidth
      ? rect.left - PANEL_WIDTH - 8
      : rect.right + 8
    setPanelPos({ top: rect.top, left })
    setPanelFolder(folder)
  }

  const scheduleClose = () => {
    if (isDragging.current) return
    closeTimer.current = setTimeout(() => setPanelFolder(null), 200)
  }

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  const handlePin = async (id: string, type: 'folder' | 'doc', currentlyPinned: boolean) => {
    const pinned = !currentlyPinned
    if (type === 'doc') {
      setDocs(prev => prev.map(d => d.id === id ? { ...d, pinned } : d))
      await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      })
    } else {
      setFolders(prev => prev.map(f => f.id === id ? { ...f, pinned } : f))
      await fetch(`/api/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      })
    }
  }

  type Item = { kind: 'folder' | 'doc'; id: string; updatedAt: string; createdAt: string; name: string; pinned: boolean }

  const allItems: Item[] = [
    ...folders.map(f => ({ kind: 'folder' as const, id: f.id, updatedAt: f.updatedAt, createdAt: f.createdAt, name: f.name, pinned: f.pinned })),
    ...docs.map(d => ({ kind: 'doc' as const, id: d.id, updatedAt: d.updatedAt, createdAt: d.createdAt, name: d.title, pinned: d.pinned })),
  ]

  const sortFn = (a: Item, b: Item) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  }

  const filtered = allItems
    .filter(item => filter === 'all' || (filter === 'folders' ? item.kind === 'folder' : item.kind === 'doc'))
    .sort(sortFn)

  const pinned = filtered.filter(i => i.pinned)
  const unpinned = filtered.filter(i => !i.pinned)
  const isEmpty = filtered.length === 0

  const handleDrop = async (targetFolderId: string | null) => {
    const item = dragItem.current
    if (!item) return
    dragItem.current = null
    setDraggingItem(null)
    setDragOver(null)
    if (item.type === 'folder' && item.id === targetFolderId) return

    if (item.type === 'doc') {
      if (targetFolderId) {
        const doc = docs.find(d => d.id === item.id)
        setDocs(prev => prev.filter(d => d.id !== item.id))
        if (doc && targetFolderId === panelFolder?.id) {
          setPanelFolder(prev => prev ? {
            ...prev,
            documents: [doc, ...prev.documents],
            docCount: prev.docCount + 1,
          } : null)
        }
      }
      await fetch(`/api/documents/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: targetFolderId }),
      })
    } else {
      if (targetFolderId) {
        const folder = folders.find(f => f.id === item.id)
        setFolders(prev => prev.filter(f => f.id !== item.id))
        if (folder && targetFolderId === panelFolder?.id) {
          setPanelFolder(prev => prev ? {
            ...prev,
            subFolders: [{ id: folder.id, name: folder.name, docCount: folder.docCount, updatedAt: folder.updatedAt }, ...prev.subFolders],
          } : null)
        }
      }
      await fetch(`/api/folders/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: targetFolderId }),
      })
    }
    router.refresh()
  }

  const renderItem = (item: Item) => {
    if (item.kind === 'folder') {
      const folder = folders.find(f => f.id === item.id)!
      return (
        <div
          key={item.id}
          draggable
          onDragStart={e => {
            dragItem.current = { id: item.id, type: 'folder' }
            setDraggingItem({ id: item.id, type: 'folder' })
            isDragging.current = true
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragEnd={() => { dragItem.current = null; setDraggingItem(null); isDragging.current = false; setDragOver(null) }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(item.id); if (panelFolder?.id !== item.id) openPanel(folder, e.currentTarget.getBoundingClientRect()) }}
          onDragLeave={e => { e.stopPropagation(); setDragOver(prev => prev === item.id ? null : prev) }}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); handleDrop(item.id) }}
          onMouseEnter={e => openPanel(folder, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={scheduleClose}
          className={`rounded-lg transition-all ${dragOver === item.id ? 'ring-2 ring-primary/40 scale-[1.02]' : ''}`}
        >
          <FolderCard
            id={folder.id}
            name={folder.name}
            docCount={folder.docCount}
            relativeTime={relativeTime(folder.updatedAt)}
            pinned={folder.pinned}
            onPin={() => handlePin(folder.id, 'folder', folder.pinned)}
            view={view}
          />
        </div>
      )
    } else {
      const doc = docs.find(d => d.id === item.id)!
      return (
        <div
          key={item.id}
          draggable
          onDragStart={e => {
            dragItem.current = { id: item.id, type: 'doc' }
            setDraggingItem({ id: item.id, type: 'doc' })
            isDragging.current = true
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragEnd={() => { dragItem.current = null; setDraggingItem(null); isDragging.current = false; setDragOver(null) }}
        >
          <DocCard
            id={doc.id}
            title={doc.title}
            relativeTime={relativeTime(doc.updatedAt)}
            pinned={doc.pinned}
            onPin={() => handlePin(doc.id, 'doc', doc.pinned)}
            view={view}
            status={doc.status}
          />
        </div>
      )
    }
  }

  const gridClass = view === 'grid'
    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
    : 'flex flex-col gap-0.5'

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSort(key)}
      className={`font-ui text-base px-2 py-0.5 rounded transition-colors ${sort === key ? 'text-white bg-white/10' : 'text-white/30 hover:text-white/60'}`}
    >
      {label}
    </button>
  )

  const filterBtn = (key: FilterKey, label: string) => (
    <button
      onClick={() => setFilter(key)}
      className={`font-ui text-base px-2 py-0.5 rounded transition-colors ${filter === key ? 'text-white bg-white/10' : 'text-white/30 hover:text-white/60'}`}
    >
      {label}
    </button>
  )

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-8xl text-white">Home</h1>
          <p className="font-ui text-base text-primary/60 mt-1 tracking-wide">
            {folders.length > 0 && <span>{folders.length} {folders.length === 1 ? 'folder' : 'folders'}</span>}
            {folders.length > 0 && docs.length > 0 && <span className="mx-2 text-white/20">·</span>}
            {docs.length > 0 && <span>{docs.length} {docs.length === 1 ? 'document' : 'documents'}</span>}
            {folders.length === 0 && docs.length === 0 && <span>Nothing here yet</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateFolderButton />
          <CreateDocumentButton />
        </div>
      </div>

      {/* Controls */}
      {!isEmpty && (
        <div className="flex items-center justify-between mb-6">
          {/* Sort */}
          <div className="flex items-center gap-1">
            <span className="font-ui text-sm text-white/20 tracking-widest uppercase mr-1">Sort</span>
            {sortBtn('updated', 'Updated')}
            {sortBtn('name', 'Name')}
            {sortBtn('created', 'Created')}
          </div>
          {/* Filter + View */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {filterBtn('all', 'All')}
              {filterBtn('folders', 'Folders')}
              {filterBtn('docs', 'Docs')}
            </div>
            <div className="flex items-center gap-1 border-l border-white/10 pl-3">
              <button
                onClick={() => setView('grid')}
                className={`p-1 rounded transition-colors ${view === 'grid' ? 'text-white bg-white/10' : 'text-white/30 hover:text-white/60'}`}
                title="Grid view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1 rounded transition-colors ${view === 'list' ? 'text-white bg-white/10' : 'text-white/30 hover:text-white/60'}`}
                title="List view"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="flex gap-4 text-primary/20">
            <Folder size={36} />
            <FileText size={36} />
          </div>
          <p className="font-ui text-primary/50 tracking-wide">Your workspace is empty</p>
          <p className="font-ui text-sm text-primary/30">Create a document or folder to get started</p>
        </div>
      ) : (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); if (dragOver === null) handleDrop(null) }}
        >
          {/* Recently viewed */}
          {recentlyViewed.length > 0 && (
            <>
              <p className="font-ui text-sm text-white/20 tracking-widest uppercase mb-3">Recently Viewed</p>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-8" style={{ scrollbarWidth: 'none' }}>
                {recentlyViewed.slice(0, 8).map(item => {
                  const liveTitle = item.type === 'doc'
                    ? (docs.find(d => d.id === item.id)?.title ?? item.title)
                    : (folders.find(f => f.id === item.id)?.name ?? item.title)
                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.type === 'doc' ? `/documents/${item.id}` : `/documents/folders/${item.id}`}
                      className="flex-none flex items-center gap-2 px-3 py-2 bg-tertiary border border-white/8 rounded-lg hover:border-white/15 transition-colors max-w-40"
                    >
                      {item.type === 'doc'
                        ? <FileText size={13} className="text-primary/40 shrink-0" />
                        : <Folder size={13} className="text-primary/40 shrink-0" />}
                      <span className="font-ui text-lg text-white truncate">{liveTitle}</span>
                    </Link>
                  )
                })}
              </div>
            </>
          )}

          {/* Pinned section */}
          {pinned.length > 0 && (
            <>
              <p className="font-ui text-sm text-white/20 tracking-widest uppercase mb-3">Pinned</p>
              <div className={`${gridClass} mb-8`}>
                {pinned.map(renderItem)}
              </div>
            </>
          )}

          {/* All / remaining items */}
          {unpinned.length > 0 && (
            <>
              <p className="font-ui text-sm text-white/20 tracking-widest uppercase mb-3">
                {pinned.length > 0 ? 'All' : 'Last updated'}
              </p>
              <div className={gridClass}>
                {unpinned.map(renderItem)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Folder hover panel */}
      {panelFolder && typeof window !== 'undefined' && createPortal(
        <div
          style={{ top: panelPos.top, left: panelPos.left }}
          className="fixed w-56 bg-tertiary rounded-xl border border-white/10 shadow-xl z-9999 overflow-hidden"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <FolderOpen size={14} className="text-primary/60 shrink-0" />
            <span className="font-ui text-lg text-white/60 truncate">{panelFolder.name}</span>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {(() => {
              const isDragTarget = draggingItem && dragOver === panelFolder.id
              const pendingDoc = isDragTarget && draggingItem.type === 'doc'
                ? docs.find(d => d.id === draggingItem.id) ?? null
                : null
              const pendingFolder = isDragTarget && draggingItem.type === 'folder'
                ? folders.find(f => f.id === draggingItem.id) ?? null
                : null
              const hasContent = panelFolder.subFolders.length > 0 || panelFolder.documents.length > 0 || pendingDoc || pendingFolder

              if (!hasContent) {
                return <p className="px-3 py-3 font-ui text-lg text-white/25 text-center">Empty</p>
              }

              return (
                <>
                  {pendingFolder && (
                    <div className="flex items-center gap-2 px-3 py-1 font-ui text-lg text-primary/60 rounded-lg mx-1 bg-white/5">
                      <Folder size={13} className="text-primary/50 shrink-0" />
                      <span className="flex-1 truncate">{pendingFolder.name}</span>
                      <span className="text-white/25 text-sm shrink-0">{pendingFolder.docCount}</span>
                    </div>
                  )}
                  {panelFolder.subFolders.map(sf => (
                    <Link key={sf.id} href={`/documents/folders/${sf.id}`}
                      className="flex items-center gap-2 px-3 py-1 font-ui text-lg text-white/70 hover:text-white hover:bg-white/5 rounded-lg mx-1 transition-colors"
                    >
                      <Folder size={13} className="text-primary/50 shrink-0" />
                      <span className="flex-1 truncate">{sf.name}</span>
                      <span className="text-white/25 text-sm shrink-0">{sf.docCount}</span>
                    </Link>
                  ))}
                  {(panelFolder.subFolders.length > 0 || pendingFolder) && (panelFolder.documents.length > 0 || pendingDoc) && (
                    <div className="my-1 border-t border-white/5" />
                  )}
                  {pendingDoc && (
                    <div className="flex items-center gap-2 px-3 py-1 font-ui text-lg text-primary/60 rounded-lg mx-1 bg-white/5">
                      <FileText size={13} className="text-primary/40 shrink-0" />
                      <span className="flex-1 truncate">{pendingDoc.title}</span>
                    </div>
                  )}
                  {panelFolder.documents.map(doc => (
                    <Link key={doc.id} href={`/documents/${doc.id}`}
                      className="flex items-center gap-2 px-3 py-1 font-ui text-lg text-white/70 hover:text-white hover:bg-white/5 rounded-lg mx-1 transition-colors"
                    >
                      <FileText size={13} className="text-primary/40 shrink-0" />
                      <span className="flex-1 truncate">{doc.title}</span>
                    </Link>
                  ))}
                </>
              )
            })()}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
