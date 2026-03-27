import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await params
  const { content } = await request.json()

  const document = await prisma.document.findUnique({ where: { id: documentId } })
  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = document.userId === user.id
  if (!isOwner) {
    const share = await prisma.documentShare.findUnique({
      where: { documentId_sharedEmail: { documentId, sharedEmail: user.email! } },
    })
    if (!share || share.permission !== 'edit') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { content, updatedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
