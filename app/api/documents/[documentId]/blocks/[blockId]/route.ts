import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ documentId: string; blockId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { documentId, blockId } = await params
  const { content } = await request.json()

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

  const block = await prisma.block.update({
    where: { id: blockId },
    data: { content },
  })

  return NextResponse.json(block)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ documentId: string; blockId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { documentId, blockId } = await params

  const document = await prisma.document.findUnique({ where: { id: documentId } })
  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwnerDel = document.userId === user.id
  if (!isOwnerDel) {
    const share = await prisma.documentShare.findUnique({
      where: { documentId_sharedEmail: { documentId, sharedEmail: user.email! } },
    })
    if (!share || share.permission !== 'edit') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  await prisma.block.delete({
    where: { id: blockId },
  })

  return NextResponse.json({ success: true })
}