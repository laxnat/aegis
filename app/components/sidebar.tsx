'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import {
  ChevronDown, ChevronLeft, ChevronRight,
  FileText, Folder, FolderOpen, FolderPlus,
  House, LogOut, MoreHorizontal, Pencil, Search, Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DocumentMenu } from './document-menu'
import { SearchPalette } from './search-palette'
import { ProfilePanel } from './profile-panel'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'
import { useSidebarMobile } from './sidebar-context'

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

type SidebarProps = {
  folders: FolderData[]
  documents: DocData[]
  userEmail: string
}

// Prevents dropping a folder into one of its own descendants, which would create
// a cycle in the folder tree
function isDescendantOrSelf(folders: FolderData[], draggedId: string, targetId: string): boolean {
  if (draggedId === targetId) return true
  let current: string | null = targetId
  while (current) {
    const f = folders.find(x => x.id === current)
    if (!f) return false
    if (f.parentId === draggedId) return true
    current = f.parentId
  }
  return false
}

function FolderMenu({
  onRename,
  onDelete,
  onNewFolder,
  onOpenChange,
}: {
  onRename: () => void
  onDelete: () => void
  onNewFolder: () => void
  onOpenChange: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const setOpenCb = (v: boolean) => { setOpen(v); onOpenChange(v) }

  useEffect(() => {
    if (!open) return
    function handleOut(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpenCb(false)
    }
    document.addEventListener('mousedown', handleOut)
    return () => document.removeEventListener('mousedown', handleOut)
  }, [open])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpenCb(!open)
  }

  const btnCls = 'w-full flex items-center gap-2 px-3 py-1 font-ui text-lg text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left'

  return (
    <div className="relative" onClick={e => e.preventDefault()}>
      <button
        ref={btnRef}
        onClick={handleClick}
        className="p-1 rounded text-white/30 hover:text-white hover:bg-white/10 transition-colors"
        title="More options"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, left: pos.left }}
          className="fixed w-48 bg-tertiary rounded-xl border border-white/10 shadow-xl z-[9999] p-1.5"
        >
          <button onClick={e => { e.stopPropagation(); setOpenCb(false); onNewFolder() }} className={btnCls}>
            <FolderPlus size={14} /> New folder
          </button>
          <button onClick={e => { e.stopPropagation(); setOpenCb(false); onRename() }} className={btnCls}>
            <Pencil size={14} /> Rename
          </button>
          <div className="my-1 border-t border-white/5" />
          <button
            onClick={e => { e.stopPropagation(); setOpenCb(false); onDelete() }}
            className="w-full flex items-center gap-2 px-3 py-1 font-ui text-lg text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors text-left"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

export function Sidebar({ folders: initFolders, documents: initDocs, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { open: mobileOpen, close: closeMobile } = useSidebarMobile()

  // Close mobile drawer on navigation
  useEffect(() => { closeMobile() }, [pathname])

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const avatarBtnRef = useRef<HTMLButtonElement>(null)

  const [folders, setFolders] = useState(initFolders)
  const [docs, setDocs] = useState(initDocs)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const renameRef = useRef<HTMLInputElement>(null)

  const [dragOver, setDragOver] = useState<string | 'root' | null>(null)
  const dragItem = useRef<{ id: string; type: 'folder' | 'doc' } | null>(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const [profile, setProfile] = useState<{ fullName: string | null; avatarUrl: string | null } | null>(null)

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p) setProfile(p) })
      .catch(() => {})
  }, [])

  // Sync with server-refreshed props
  useEffect(() => { setFolders(initFolders) }, [initFolders])
  useEffect(() => { setDocs(initDocs) }, [initDocs])

  useEffect(() => {
    if (renamingId) setTimeout(() => renameRef.current?.select(), 0)
  }, [renamingId])

  useEffect(() => {
    if (!showDropdown) return
    function handleOut(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        avatarBtnRef.current && !avatarBtnRef.current.contains(e.target as Node)
      ) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleOut)
    return () => document.removeEventListener('mousedown', handleOut)
  }, [showDropdown])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const createFolder = async (parentId: string | null = null) => {
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Folder', parentId }),
      })
      if (!res.ok) throw new Error()
      const newFolder: FolderData = await res.json()
      setFolders(prev => [...prev, newFolder])
      if (parentId) setExpanded(prev => new Set([...prev, parentId]))
      setRenamingId(newFolder.id)
      setRenameVal('New Folder')
    } catch {
      toast.error('Failed to create folder')
    }
  }

  const saveRename = async (id: string) => {
    const trimmed = renameVal.trim()
    const folder = folders.find(f => f.id === id)
    setRenamingId(null)
    if (!trimmed || trimmed === folder?.name) return
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: trimmed } : f))
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name: folder?.name ?? f.name } : f))
      toast.error('Failed to rename folder')
    }
  }

  const deleteFolder = async (id: string) => {
    const snapshot = { folders: [...folders], docs: [...docs] }
    setFolders(prev => prev.filter(f => f.id !== id))
    setDocs(prev => prev.map(d => d.folderId === id ? { ...d, folderId: null } : d))
    try {
      const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setFolders(snapshot.folders)
      setDocs(snapshot.docs)
      toast.error('Failed to delete folder')
    }
  }

  // Drag & Drop
  const onDragStart = (e: React.DragEvent, id: string, type: 'folder' | 'doc') => {
    dragItem.current = { id, type }
    e.dataTransfer.effectAllowed = 'move'
    e.stopPropagation()
  }

  const onDragOver = (e: React.DragEvent, target: string | 'root') => {
    e.preventDefault()
    e.stopPropagation()
    const item = dragItem.current
    if (!item) return
    if (item.type === 'folder' && target !== 'root') {
      if (isDescendantOrSelf(folders, item.id, target as string)) return
    }
    e.dataTransfer.dropEffect = 'move'
    setDragOver(target)
  }

  const onDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(null)
    const item = dragItem.current
    if (!item) return
    dragItem.current = null

    if (item.type === 'folder' && targetFolderId !== null) {
      if (isDescendantOrSelf(folders, item.id, targetFolderId)) return
    }

    try {
      if (item.type === 'doc') {
        const doc = docs.find(d => d.id === item.id)
        if (doc?.folderId === targetFolderId) return
        setDocs(prev => prev.map(d => d.id === item.id ? { ...d, folderId: targetFolderId } : d))
        const res = await fetch(`/api/documents/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId: targetFolderId }),
        })
        if (!res.ok) throw new Error('doc')
      } else {
        const folder = folders.find(f => f.id === item.id)
        if (folder?.parentId === targetFolderId) return
        setFolders(prev => prev.map(f => f.id === item.id ? { ...f, parentId: targetFolderId } : f))
        if (targetFolderId) setExpanded(prev => new Set([...prev, targetFolderId]))
        const res = await fetch(`/api/folders/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentId: targetFolderId }),
        })
        if (!res.ok) throw new Error('folder')
      }
      router.refresh()
    } catch {
      toast.error('Failed to move item')
      router.refresh()
    }
  }

  const onDragEnd = () => {
    dragItem.current = null
    setDragOver(null)
  }

  const renderFolder = (folder: FolderData, depth: number): React.ReactNode => {
    const isExpanded = expanded.has(folder.id)
    const childFolders = folders.filter(f => f.parentId === folder.id)
    const childDocs = docs.filter(d => d.folderId === folder.id)
    const isDropTarget = dragOver === folder.id
    const isRenaming = renamingId === folder.id

    return (
      <div key={folder.id} onDragEnd={onDragEnd}>
        <div
          className={`relative group/folder flex items-center rounded transition-colors ${isDropTarget ? 'bg-primary/10 ring-1 ring-inset ring-primary/30' : ''}`}
          draggable
          onDragStart={e => onDragStart(e, folder.id, 'folder')}
          onDragOver={e => onDragOver(e, folder.id)}
          onDrop={e => onDrop(e, folder.id)}
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          <button
            onClick={() => !isRenaming && toggleExpand(folder.id)}
            className="flex items-center gap-2 flex-1 px-3 py-2 pr-8 font-ui text-xl text-white/50 hover:text-white transition-colors rounded text-left"
          >
            <span className="shrink-0 text-white/25">
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            {isExpanded
              ? <FolderOpen size={18} className="shrink-0 text-primary/70" />
              : <Folder size={18} className="shrink-0 text-primary/50" />
            }
            {isRenaming ? (
              <input
                ref={renameRef}
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onKeyDown={e => {
                  e.stopPropagation()
                  if (e.key === 'Enter') saveRename(folder.id)
                  if (e.key === 'Escape') { setRenamingId(null) }
                }}
                onBlur={() => saveRename(folder.id)}
                onClick={e => e.stopPropagation()}
                className="flex-1 bg-transparent outline-none border-b border-white/30 text-white min-w-0 font-ui text-xl"
              />
            ) : (
              <span className="truncate text-white/60 group-hover/folder:text-white">{folder.name}</span>
            )}
          </button>

          {!isRenaming && (
            <div className={`absolute right-1 top-1/2 -translate-y-1/2 transition-opacity ${openFolderMenuId === folder.id ? 'opacity-100' : 'opacity-0 group-hover/folder:opacity-100'}`}>
              <FolderMenu
                onRename={() => { setRenameVal(folder.name); setRenamingId(folder.id) }}
                onDelete={() => deleteFolder(folder.id)}
                onNewFolder={() => createFolder(folder.id)}
                onOpenChange={o => setOpenFolderMenuId(o ? folder.id : null)}
              />
            </div>
          )}
        </div>

        {isExpanded && (
          <div>
            {childFolders.map(cf => renderFolder(cf, depth + 1))}
            {childDocs.map(doc => renderDoc(doc, depth + 1))}
            {childFolders.length === 0 && childDocs.length === 0 && (
              <p
                className="font-ui text-sm text-white/20 py-1.5"
                style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
              >
                Empty
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderDoc = (doc: DocData, depth: number): React.ReactNode => {
    const isActive = pathname === `/documents/${doc.id}`
    return (
      <div
        key={doc.id}
        className="relative group/doc"
        draggable
        onDragStart={e => onDragStart(e, doc.id, 'doc')}
        onDragEnd={onDragEnd}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <Link
          href={`/documents/${doc.id}`}
          title={doc.title}
          className={`flex items-center gap-2.5 px-3 py-2 pr-8 font-ui text-xl rounded transition-colors ${
            isActive ? 'text-white bg-white/8' : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText size={18} className="shrink-0" />
          <span className="truncate">{doc.title}</span>
        </Link>
        <div className={`absolute right-1 top-1/2 -translate-y-1/2 transition-opacity ${openMenuId === doc.id ? 'opacity-100' : 'opacity-0 group-hover/doc:opacity-100'}`}>
          <DocumentMenu
            documentId={doc.id}
            title={doc.title}
            afterDelete={() => router.refresh()}
            onOpenChange={o => setOpenMenuId(o ? doc.id : null)}
          />
        </div>
      </div>
    )
  }

  const rootFolders = folders.filter(f => f.parentId === null)
  const rootDocs = docs.filter(d => d.folderId === null)
  const isRootDrop = dragOver === 'root'

  // Collapsed state renders an icon-only rail on desktop.
  // Mobile uses CSS translate to slide the full panel in/out; the rail is hidden on mobile.
  if (isCollapsed && !mobileOpen) {
    return (
      <div className="hidden md:flex w-14 bg-tertiary border-r border-white/5 flex-col items-center h-screen relative group/collapsed">
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-10 w-6 h-6 bg-tertiary border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white opacity-0 group-hover/collapsed:opacity-100 transition-all"
          title="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
        <Link href="/documents" className="p-5 text-white/40 hover:text-white transition-colors" title="Home">
          <House size={16} />
        </Link>
        <button
          onClick={() => setSearchOpen(true)}
          className="p-5 text-white/40 hover:text-white transition-colors"
          title="Search (⌘K)"
        >
          <Search size={16} />
        </button>
        <SearchPalette
          folders={folders}
          docs={docs}
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
      </div>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && typeof window !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={closeMobile} />,
        document.body
      )}
    <div className={`bg-tertiary border-r border-white/5 flex flex-col h-screen group/sidebar fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-200 md:relative md:z-auto md:w-64 md:translate-x-0 md:transition-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      {/* Collapse button */}
      <button
        onClick={() => setIsCollapsed(true)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-tertiary border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white opacity-0 group-hover/sidebar:opacity-100 transition-all"
        title="Collapse sidebar"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/5 flex items-center justify-between">
        <Link href="/" className="font-display text-6xl text-white hover:text-primary transition-colors">
          aegis
        </Link>
        <div className="relative">
          <button
            ref={avatarBtnRef}
            onClick={() => {
              if (!showDropdown && avatarBtnRef.current) {
                const r = avatarBtnRef.current.getBoundingClientRect()
                setDropdownPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 220) })
              }
              setShowDropdown(v => !v)
            }}
            className="flex items-center gap-1.5 group/avatar"
            title={userEmail}
          >
            <div className="w-10 h-10 bg-primary/20 border border-primary/40 group-hover/avatar:border-primary/70 group-hover/avatar:bg-primary/30 rounded-full overflow-hidden flex items-center justify-center text-primary font-display text-lg transition-colors">
              {profile?.avatarUrl
                ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                : (profile?.fullName || userEmail)[0].toUpperCase()
              }
            </div>
            <ChevronDown size={15} className={`text-white/30 group-hover/avatar:text-white/60 transition-all ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showDropdown && typeof window !== 'undefined' && createPortal(
            <div
              ref={dropdownRef}
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
              className="fixed w-52 bg-tertiary rounded-xl border border-white/10 shadow-xl z-9999 p-1.5"
            >
              <p className="px-3 py-1 font-ui text-base text-white/35 truncate">
                {profile?.fullName || userEmail}
              </p>
              <div className="my-1 border-t border-white/5" />
              <button
                onClick={() => { setShowProfilePanel(true); setShowDropdown(false) }}
                className="w-full flex items-center gap-2 px-3 py-1 font-ui text-lg text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                Update Profile
              </button>
              <div className="my-1 border-t border-white/5" />
              <button
                onClick={() => { handleLogout(); setShowDropdown(false) }}
                className="w-full flex items-center gap-2 px-3 py-1 font-ui text-lg text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>,
            document.body
          )}
          {showProfilePanel && (
            <ProfilePanel
              userEmail={userEmail}
              onClose={() => setShowProfilePanel(false)}
              onSaved={setProfile}
            />
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="px-2 py-3 gap-1">
        <Link
          href="/documents"
          className={`w-full flex items-center gap-2.5 px-3 py-2 font-ui text-xl rounded transition-colors ${
            pathname === '/documents'
              ? 'text-white bg-white/8'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <House size={20} />
          Home
        </Link>
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 font-ui text-xl text-white/50 hover:text-white hover:bg-white/5 rounded transition-colors"
        >
          <Search size={20} />
          Search
          <kbd className="ml-auto font-ui text-sm text-white/20 border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
        </button>
      </div>

      {/* Files tree */}
      <div
        className="flex-1 overflow-y-auto px-2 pb-4"
        onDragOver={e => {
          // Only act as root drop zone if not already over a folder
          if (dragOver === null || dragOver === 'root') onDragOver(e, 'root')
        }}
        onDrop={e => onDrop(e, null)}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <p className="font-ui text-lg text-white tracking-widest uppercase">Files</p>
          <button
            onClick={() => createFolder(null)}
            className="p-1 rounded text-white/30 hover:text-white hover:bg-white/10 transition-colors"
            title="New folder"
          >
            <FolderPlus size={15} />
          </button>
        </div>

        <div
          className={`space-y-0.5 min-h-8 rounded transition-colors ${isRootDrop ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
          onDragOver={e => onDragOver(e, 'root')}
          onDrop={e => onDrop(e, null)}
        >
          {rootFolders.length === 0 && rootDocs.length === 0 ? (
            <p className="px-3 py-2 font-ui text-xs text-white/25">No files yet</p>
          ) : (
            <>
              {rootFolders.map(f => renderFolder(f, 0))}
              {rootDocs.map(d => renderDoc(d, 0))}
            </>
          )}
        </div>
      </div>


      <SearchPalette
        folders={folders}
        docs={docs}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
    </>
  )
}
