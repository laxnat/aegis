import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import { EditableTitle } from './editable-title'
import { BlocksManager } from './blocks-manager'
import { RecentlyViewedTracker } from '@/app/components/recently-viewed-tracker'
import { SharePanel } from './share-panel'

const prisma = new PrismaClient()

export default async function DocumentPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      blocks: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!document) {
    notFound()
  }

  const isOwner = document.userId === user.id
  let canEdit = isOwner

  if (!isOwner) {
    const share = await prisma.documentShare.findUnique({
      where: { documentId_sharedEmail: { documentId: id, sharedEmail: user.email! } },
    })
    if (!share) notFound()
    canEdit = share.permission === 'edit'
  }

  return (
    <div className="p-8">
      <RecentlyViewedTracker id={document.id} title={document.title} type="doc" />
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <EditableTitle initialTitle={document.title} documentId={document.id} readOnly={!canEdit} />
          <div className="pt-1 shrink-0">
            <SharePanel
              documentId={document.id}
              isOwner={isOwner}
              knownOwnerEmail={isOwner ? user.email! : undefined}
            />
          </div>
        </div>

        <div className="mt-8">
          <BlocksManager
            documentId={document.id}
            initialBlocks={document.blocks}
            readOnly={!canEdit}
          />
        </div>
      </div>
    </div>
  )
}
