import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PrismaClient, Document } from '@prisma/client'
import Link from 'next/link'
import { CreateDocumentButton } from './create-document-button'
import { FileText } from 'lucide-react'

const prisma = new PrismaClient()

function relativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-secondary p-8 pt-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-8xl text-white">Documents</h1>
            <p className="font-ui text-base text-primary/60 mt-1 tracking-wide">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </p>
          </div>
          <CreateDocumentButton />
        </div>

        {/* Document list */}
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <FileText size={40} className="text-primary/30" />
            <p className="font-ui text-primary/50 tracking-wide">No documents yet</p>
            <p className="font-ui text-xs text-primary/30">Create your first document to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {documents.map((doc: Document) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between py-4 px-3 group hover:bg-white/5 transition-colors -mx-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} className="text-primary/40 shrink-0 group-hover:text-primary transition-colors" />
                  <span className="font-ui text-lg text-white truncate group-hover:text-primary transition-colors">
                    {doc.title}
                  </span>
                </div>
                <span className="font-ui text-sm text-white/30 shrink-0 ml-4 group-hover:text-primary/60 transition-colors">
                  {relativeTime(doc.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
