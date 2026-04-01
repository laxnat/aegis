import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import { EditableTitle } from './editable-title'
import { CollaborativeEditorClient } from './collaborative-editor-client'
import { RecentlyViewedTracker } from '@/app/components/recently-viewed-tracker'
import { SharePanel } from './share-panel'

const prisma = new PrismaClient()

// Convert legacy blocks to a single HTML string for initial editor content
function blocksToHtml(blocks: { type: string; content: string }[]): string {
  return blocks.map(b => {
    const c = b.content || ''
    switch (b.type) {
      case 'heading1': return `<h1>${c}</h1>`
      case 'heading2': return `<h2>${c}</h2>`
      case 'heading3': return `<h3>${c}</h3>`
      case 'heading4': return `<h4>${c}</h4>`
      case 'bulletList': return c || '<ul><li><p></p></li></ul>'
      case 'orderedList': return c || '<ol><li><p></p></li></ol>'
      case 'taskList': return c || '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p></p></li></ul>'
      case 'quote': return `<blockquote>${c}</blockquote>`
      case 'code':
      case 'codeBlock': return `<pre><code>${c}</code></pre>`
      case 'divider': return '<hr />'
      default: return c || '<p></p>'
    }
  }).join('')
}

export default async function DocumentPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { id } = await params

  const document = await prisma.document.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })

  if (!document) notFound()

  const isOwner = document.userId === user.id
  let canEdit = isOwner

  if (!isOwner) {
    const share = await prisma.documentShare.findUnique({
      where: { documentId_sharedEmail: { documentId: id, sharedEmail: user.email! } },
    })
    if (!share) notFound()
    canEdit = share.permission === 'edit'
  }

  // Determine initial content: prefer the stored content field, fall back to legacy blocks
  const initialContent = document.content
    ?? (document.blocks.length > 0 ? blocksToHtml(document.blocks) : null)

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <RecentlyViewedTracker id={document.id} title={document.title} type="doc" />
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <EditableTitle initialTitle={document.title} documentId={document.id} readOnly={!canEdit} />
          <div className="pt-1 shrink-0">
            <SharePanel
              documentId={document.id}
              isOwner={isOwner}
              knownOwnerEmail={isOwner ? user.email! : undefined}
            />
          </div>
        </div>

        <CollaborativeEditorClient
          documentId={document.id}
          initialContent={initialContent}
          readOnly={!canEdit}
        />
      </div>
    </div>
  )
}
