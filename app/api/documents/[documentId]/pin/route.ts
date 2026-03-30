import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function canAccess(documentId: string, userId: string, email: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } })
  if (!doc) return false
  if (doc.userId === userId) return true
  const share = await prisma.documentShare.findUnique({
    where: { documentId_sharedEmail: { documentId, sharedEmail: email } },
  })
  return !!share
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await params
  if (!await canAccess(documentId, user.id, user.email!)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.documentPin.upsert({
    where: { userId_documentId: { userId: user.id, documentId } },
    create: { userId: user.id, documentId },
    update: {},
  })

  return NextResponse.json({ pinned: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await params

  await prisma.documentPin.deleteMany({
    where: { userId: user.id, documentId },
  })

  return NextResponse.json({ pinned: false })
}
