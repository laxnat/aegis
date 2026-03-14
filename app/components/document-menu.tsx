'use client'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, Trash2, Pencil, Copy, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STATUSES = [
  { value: null,          label: 'None',        dot: 'bg-white/20',   text: 'text-white/40' },
  { value: 'draft',       label: 'Draft',        dot: 'bg-white/50',   text: 'text-white/60' },
  { value: 'in-progress', label: 'In Progress',  dot: 'bg-primary',    text: 'text-primary' },
  { value: 'review',      label: 'Review',       dot: 'bg-highlight',  text: 'text-highlight' },
  { value: 'done',        label: 'Done',         dot: 'bg-green-400',  text: 'text-green-400' },
]

export function getStatusConfig(status: string | null | undefined) {
  return STATUSES.find(s => s.value === (status ?? null)) ?? STATUSES[0]
}

type DocumentMenuProps = {
  documentId: string
  title: string
  status?: string | null
  afterDelete?: () => void
  onOpenChange?: (open: boolean) => void
}

export function DocumentMenu({ documentId, title, status, afterDelete, onOpenChange }: DocumentMenuProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'menu' | 'rename' | 'status'>('menu')
  const [renameValue, setRenameValue] = useState(title)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const setOpenWithCallback = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
    if (!value) setMode('menu')
  }

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpenWithCallback(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (mode === 'rename') {
      setTimeout(() => renameInputRef.current?.select(), 0)
    }
  }, [mode])

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left })
    }
    setRenameValue(title)
    setOpenWithCallback(!open)
  }

  const handleRename = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === title) {
      setOpenWithCallback(false)
      return
    }
    setOpenWithCallback(false)
    await fetch(`/api/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    })
    router.refresh()
  }

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenWithCallback(false)
    await fetch(`/api/documents/${documentId}`, { method: 'POST' })
    router.refresh()
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenWithCallback(false)
    await fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
    if (afterDelete) {
      afterDelete()
    } else {
      router.push('/documents')
      router.refresh()
    }
  }

  const handleStatusChange = async (e: React.MouseEvent, newStatus: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenWithCallback(false)
    await fetch(`/api/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
  }

  const btnClass = 'w-full flex items-center gap-2 px-3 py-1 font-ui text-lg text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left'
  const currentStatus = getStatusConfig(status)

  return (
    <div className="relative" onClick={(e) => e.preventDefault()}>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="p-1 rounded text-white/30 hover:text-white hover:bg-white/10 transition-colors"
        title="More options"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          className="fixed w-60 bg-tertiary rounded-xl border border-white/10 shadow-xl z-9999 p-1.5"
        >
          {mode === 'rename' ? (
            <div className="px-2">
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                  if (e.key === 'Escape') setOpenWithCallback(false)
                }}
                onBlur={handleRename}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-ui text-lg text-white outline-none focus:border-white/25"
              />
            </div>
          ) : mode === 'status' ? (
            <>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMode('menu') }}
                className="w-full flex items-center gap-2 px-3 py-1 font-ui text-lg text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors text-left mb-1"
              >
                <ChevronLeft size={14} /> Status
              </button>
              <div className="border-t border-white/5 mb-1" />
              {STATUSES.map(s => (
                <button
                  key={String(s.value)}
                  onClick={(e) => handleStatusChange(e, s.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1 font-ui text-lg rounded-lg transition-colors text-left ${s.value === (status ?? null) ? 'text-white bg-white/8' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                  {s.label}
                </button>
              ))}
            </>
          ) : (
            <>
              <div className='w-full flex items-center gap-2 px-3 py-1 font-ui text-lg text-white/70 rounded-lg transition-colors text-left'>
                Panel
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMode('rename') }}
                className={btnClass}
              >
                <Pencil size={14} />
                Rename
              </button>
              <button onClick={handleDuplicate} className={btnClass}>
                <Copy size={14} />
                Duplicate
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMode('status') }}
                className={btnClass}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${currentStatus.dot}`} />
                Status
                <span className={`ml-auto font-ui text-base ${currentStatus.text}`}>{currentStatus.label}</span>
              </button>
              <div className="my-1 border-t border-white/5" />
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-1 font-ui text-lg text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
