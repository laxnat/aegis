import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { documentId } = await params
  const { type, content, order } = await request.json()

  const document = await prisma.document.findUnique({ where: { id: documentId } })
  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = document.userId === user.id
  if (!isOwner) {
    const share = await prisma.documentShare.findUnique({
      where: { documentId_sharedEmail: { documentId, sharedEmail: user.email! } },
    })
    if (!share || share.permission !== 'edit') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const block = await prisma.block.create({
    data: {
      type,
      content,
      order,
      documentId,
    },
  })

  return NextResponse.json(block)
}