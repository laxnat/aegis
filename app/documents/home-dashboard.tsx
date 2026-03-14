'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { FileText, Folder, FolderOpen } from 'lucide-react'
import { FolderCard } from './folder-card'
import { DocCard } from './doc-card'
import { CreateDocumentButton } from './create-document-button'
import { CreateFolderButton } from './create-folder-button'

type DocData = { id: string; title: string; updatedAt: string }
type SubFolderData = { id: string; name: string; docCount: number; updatedAt: string }
type FolderData = {
  id: string
  name: string
  updatedAt: string
  docCount: number
  documents: DocData[]
  subFolders: SubFolderData[]
}

type Props = {
  initialFolders: FolderData[]
  initialDocs: DocData[]
}

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
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [draggingItem, setDraggingItem] = useState<{ id: string; type: 'folder' | 'doc' } | null>(null)
  const [panelFolder, setPanelFolder] = useState<FolderData | null>(null)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const dragItem = useRef<{ id: string; type: 'folder' | 'doc' } | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDragging = useRef(false)

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

  type Item = { kind: 'folder' | 'doc'; id: string; updatedAt: string }
  const allItems: Item[] = [
    ...folders.map(f => ({ kind: 'folder' as const, id: f.id, updatedAt: f.updatedAt })),
    ...docs.map(d => ({ kind: 'doc' as const, id: d.id, updatedAt: d.updatedAt })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

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

  const isEmpty = allItems.length === 0

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-8xl text-white">Home</h1>
          <p className="font-ui text-base text-primary/60 mt-1 tracking-wide">
            {folders.length > 0 && (
              <span>{folders.length} {folders.length === 1 ? 'folder' : 'folders'}</span>
            )}
            {folders.length > 0 && docs.length > 0 && (
              <span className="mx-2 text-white/20">·</span>
            )}
            {docs.length > 0 && (
              <span>{docs.length} {docs.length === 1 ? 'document' : 'documents'}</span>
            )}
            {isEmpty && <span>Nothing here yet</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateFolderButton />
          <CreateDocumentButton />
        </div>
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="flex gap-4 text-primary/20">
            <Folder size={36} />
            <FileText size={36} />
          </div>
          <p className="font-ui text-primary/50 tracking-wide">Your workspace is empty</p>
          <p className="font-ui text-xs text-primary/30">Create a document or folder to get started</p>
        </div>
      ) : (
        <>
          <p className="font-ui text-sm text-white/20 tracking-widest uppercase mb-4">Last updated</p>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (dragOver === null) handleDrop(null) }}
          >
            {allItems.map(item => {
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
                    />
                  </div>
                )
              }
            })}
          </div>
        </>
      )}

      {/* Folder hover panel */}
      {panelFolder && typeof window !== 'undefined' && createPortal(
        <div
          style={{ top: panelPos.top, left: panelPos.left }}
          className="fixed w-56 bg-tertiary rounded-xl border border-white/10 shadow-xl z-9999 overflow-hidden"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <FolderOpen size={14} className="text-primary/60 shrink-0" />
            <span className="font-ui text-lg text-white/60 truncate">{panelFolder.name}</span>
          </div>

          {/* Contents */}
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
                      <span className="text-white/25 text-xs shrink-0">{pendingFolder.docCount}</span>
                    </div>
                  )}
                  {panelFolder.subFolders.map(sf => (
                    <Link
                      key={sf.id}
                      href={`/documents/folders/${sf.id}`}
                      className="flex items-center gap-2 px-3 py-1 font-ui text-lg text-white/70 hover:text-white hover:bg-white/5 rounded-lg mx-1 transition-colors"
                    >
                      <Folder size={13} className="text-primary/50 shrink-0" />
                      <span className="flex-1 truncate">{sf.name}</span>
                      <span className="text-white/25 text-xs shrink-0">{sf.docCount}</span>
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
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
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
