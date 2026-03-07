'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, FileText, House, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Document = {
  id: string
  title: string
  updatedAt: Date
}

type SidebarProps = {
  documents: Document[]
  userEmail: string
}

export function Sidebar({ documents, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isCollapsed) {
    return (
      <div className="w-14 bg-tertiary border-r border-white/5 flex flex-col items-center h-screen relative group/collapsed">
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-10 w-6 h-6 bg-tertiary border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white opacity-0 group-hover/collapsed:opacity-100 transition-all"
          title="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
        <Link href="/documents" className="p-2 text-white/40 hover:text-white transition-colors" title="Home">
          <House size={16} />
        </Link>
      </div>
    )
  }

  return (
    <div
      className="w-56 bg-tertiary border-r border-white/5 flex flex-col h-screen relative group/sidebar"
    >
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
        <Link href="/" className="font-display text-4xl text-white hover:text-primary transition-colors">
          aegis
        </Link>

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-1.5"
            title={userEmail}
          >
            <div className="w-7 h-7 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center text-primary font-display text-sm">
              {userEmail[0].toUpperCase()}
            </div>
            <ChevronDown size={12} className={`text-white/30 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-secondary border border-white/10 shadow-xl z-50 py-1">
              <p className="px-3 py-2 font-ui text-xs text-white/40 truncate border-b border-white/5">
                {userEmail}
              </p>
              <button
                onClick={() => { handleLogout(); setShowDropdown(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 font-ui text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <LogOut size={13} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="px-2 py-3">
        <Link
          href="/documents"
          className={`flex items-center gap-2.5 px-3 py-2 font-ui text-base rounded transition-colors ${
            pathname === '/documents'
              ? 'text-white bg-white/8'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <House size={16} />
          Home
        </Link>
      </div>

      {/* Recents */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <p className="px-3 py-2 font-ui text-xs text-white/25 tracking-widest uppercase">
          Recents
        </p>
        <div className="space-y-0.5">
          {documents.length === 0 ? (
            <p className="px-3 py-2 font-ui text-xs text-white/25">No documents yet</p>
          ) : (
            documents.map((doc) => {
              const isActive = pathname === `/documents/${doc.id}`
              return (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  title={doc.title}
                  className={`flex items-center gap-2.5 px-3 py-2 font-ui text-base rounded transition-colors ${
                    isActive
                      ? 'text-white bg-white/8'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileText size={15} className="shrink-0" />
                  <span className="truncate">{doc.title}</span>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}