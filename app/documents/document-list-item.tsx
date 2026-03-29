'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DocumentMenu } from '../components/document-menu'

type Props = {
  id: string
  title: string
  relativeTime: string
}

export function DocumentListItem({ id, title, relativeTime }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative group/doc flex items-center -mx-3">
      <Link
        href={`/documents/${id}`}
        className="flex-1 flex items-center justify-between py-4 px-3 group hover:bg-white/5 transition-colors pr-10"
      >
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={18} className="text-primary/40 shrink-0 group-hover:text-primary transition-colors" />
          <span className="font-ui text-lg text-white truncate group-hover:text-primary transition-colors">
            {title}
          </span>
        </div>
        <span className="font-ui text-sm text-white/50 shrink-0 ml-4 group-hover:text-primary/60 transition-colors">
          {relativeTime}
        </span>
      </Link>
      <div className={`absolute right-3 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover/doc:opacity-100'}`}>
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
