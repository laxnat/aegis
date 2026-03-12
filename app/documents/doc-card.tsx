'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentMenu } from '../components/document-menu'

type Props = {
  id: string
  title: string
  relativeTime: string
}

export function DocCard({ id, title, relativeTime }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative group/card border border-white/8 bg-tertiary hover:border-white/15 transition-colors rounded-lg flex flex-col">
      <Link
        href={`/documents/${id}`}
        className="flex flex-col gap-3 p-4 flex-1 group"
      >
        <FileText size={28} className="text-primary/40 shrink-0 group-hover:text-primary/70 transition-colors" />
        <p className="font-ui text-xl text-white truncate group-hover:text-primary transition-colors">{title}</p>
        <div className="mt-auto flex items-end justify-between gap-2">
          <p className="font-ui text-xs text-white/20">{relativeTime}</p>
        </div>
      </Link>

      <div className={`absolute top-3 right-3 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'}`}>
        <DocumentMenu
          documentId={id}
          title={title}
          afterDelete={() => router.refresh()}
          onOpenChange={setMenuOpen}
        />
      </div>
    </div>
  )
}
