import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { HomeDashboard } from './home-dashboard'

const prisma = new PrismaClient()

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch own folders/docs, docs shared with this user, and the user's cross-workspace
  // pins all in parallel — the pin set is joined client-side via pinnedSharedIds
  const [folders, documents, sharedWithMe, sharedPins] = await Promise.all([
    prisma.folder.findMany({
      where: { userId: user.id, parentId: null },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { documents: true } },
        documents: {
          select: { id: true, title: true, updatedAt: true, createdAt: true, pinned: true, status: true },
          orderBy: { updatedAt: 'desc' },
        },
        children: {
          orderBy: { updatedAt: 'desc' },
          include: { _count: { select: { documents: true } } },
        },
      },
    }),
    prisma.document.findMany({
      where: { userId: user.id, folderId: null },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true, createdAt: true, pinned: true, status: true },
    }),
    prisma.documentShare.findMany({
      where: { sharedEmail: user.email! },
      orderBy: { createdAt: 'desc' },
      include: {
        document: { select: { id: true, title: true, updatedAt: true } },
      },
    }),
    prisma.documentPin.findMany({
      where: { userId: user.id },
      select: { documentId: true },
    }),
  ])

  const folderData = folders.map(f => ({
    id: f.id,
    name: f.name,
    updatedAt: f.updatedAt.toISOString(),
    createdAt: f.createdAt.toISOString(),
    pinned: f.pinned,
    docCount: f._count.documents,
    documents: f.documents.map(d => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updatedAt.toISOString(),
      createdAt: d.createdAt.toISOString(),
      pinned: d.pinned,
      status: d.status,
    })),
    subFolders: f.children.map(c => ({
      id: c.id,
      name: c.name,
      docCount: c._count.documents,
      updatedAt: c.updatedAt.toISOString(),
    })),
  }))

  const docData = documents.map(d => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt.toISOString(),
    createdAt: d.createdAt.toISOString(),
    pinned: d.pinned,
    status: d.status,
  }))

  const pinnedSharedIds = new Set(sharedPins.map((p: { documentId: string }) => p.documentId))

  const sharedDocData = sharedWithMe.map(s => ({
    id: s.document.id,
    title: s.document.title,
    updatedAt: s.document.updatedAt.toISOString(),
    pinned: pinnedSharedIds.has(s.document.id),
  }))

  return (
    <div className="p-4 sm:p-6 md:p-8 pt-4 sm:pt-6 pb-32 md:pb-64">
      <div className="max-w-4xl mx-auto">
        <HomeDashboard initialFolders={folderData} initialDocs={docData} sharedDocs={sharedDocData} />
      </div>
    </div>
  )
}
