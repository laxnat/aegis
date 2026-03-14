import { Fragment } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { CreateDocumentButton } from '../../create-document-button'
import { CreateFolderButton } from '../../create-folder-button'
import { FolderCard } from '../../folder-card'
import { DocCard } from '../../doc-card'
import { FileText, Folder } from 'lucide-react'
import { RecentlyViewedTracker } from '@/app/components/recently-viewed-tracker'

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

export default async function FolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>
}) {
  const { folderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  })

  if (!folder || folder.userId !== user.id) notFound()

  // Build breadcrumb ancestry
  const breadcrumb: { id: string; name: string }[] = []
  let current = folder.parentId
  while (current) {
    const ancestor = await prisma.folder.findUnique({ where: { id: current } })
    if (!ancestor || ancestor.userId !== user.id) break
    breadcrumb.unshift({ id: ancestor.id, name: ancestor.name })
    current = ancestor.parentId
  }

  const [subFolders, documents] = await Promise.all([
    prisma.folder.findMany({
      where: { parentId: folderId, userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { documents: true } } },
    }),
    prisma.document.findMany({
      where: { folderId, userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
    }),
  ])

  type Item =
    | { kind: 'folder'; id: string; name: string; updatedAt: Date; docCount: number }
    | { kind: 'doc'; id: string; title: string; updatedAt: Date }

  const allItems: Item[] = [
    ...subFolders.map(f => ({
      kind: 'folder' as const,
      id: f.id,
      name: f.name,
      updatedAt: f.updatedAt,
      docCount: f._count.documents,
    })),
    ...documents.map(d => ({
      kind: 'doc' as const,
      id: d.id,
      title: d.title,
      updatedAt: d.updatedAt,
    })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const isEmpty = allItems.length === 0

  return (
    <div className="min-h-screen bg-secondary p-8 pt-6">
      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 font-ui text-lg text-white/30 mb-6">
          <Link href="/documents" className="hover:text-white transition-colors">Home</Link>
          {breadcrumb.map(ancestor => (
            <Fragment key={ancestor.id}>
              <ChevronRight size={13} />
              <Link
                href={`/documents/folders/${ancestor.id}`}
                className="hover:text-white transition-colors"
              >
                {ancestor.name}
              </Link>
            </Fragment>
          ))}
          <ChevronRight size={13} />
          <span className="text-white/60">{folder.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <RecentlyViewedTracker id={folderId} title={folder.name} type="folder" />
        <h1 className="font-display text-8xl text-white">{folder.name}</h1>
            <p className="font-ui text-base text-primary/60 mt-1 tracking-wide">
              {subFolders.length > 0 && (
                <span>{subFolders.length} {subFolders.length === 1 ? 'folder' : 'folders'}</span>
              )}
              {subFolders.length > 0 && documents.length > 0 && (
                <span className="mx-2 text-white/20">·</span>
              )}
              {documents.length > 0 && (
                <span>{documents.length} {documents.length === 1 ? 'document' : 'documents'}</span>
              )}
              {isEmpty && <span>Nothing here yet</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CreateFolderButton parentId={folderId} />
            <CreateDocumentButton folderId={folderId} />
          </div>
        </div>

        {/* Empty state */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="flex gap-4 text-primary/20">
              <Folder size={36} />
              <FileText size={36} />
            </div>
            <p className="font-ui text-primary/50 tracking-wide">This folder is empty</p>
            <p className="font-ui text-sm text-primary/30">Add documents or sub-folders to get started</p>
          </div>
        ) : (
          <>
            <p className="font-ui text-base text-white/20 tracking-widest uppercase mb-4">
              Last updated
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {allItems.map(item =>
                item.kind === 'folder' ? (
                  <FolderCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    docCount={item.docCount}
                    relativeTime={relativeTime(item.updatedAt)}
                  />
                ) : (
                  <DocCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    relativeTime={relativeTime(item.updatedAt)}
                  />
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
