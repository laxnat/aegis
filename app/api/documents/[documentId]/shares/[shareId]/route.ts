import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ documentId: string; shareId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId, shareId } = await params
  const { permission } = await request.json()

  if (permission !== 'view' && permission !== 'edit') {
    return NextResponse.json({ error: 'Invalid permission' }, { status: 400 })
  }

  const document = await prisma.document.findUnique({ where: { id: documentId } })
  if (!document || document.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const share = await prisma.documentShare.update({
    where: { id: shareId },
    data: { permission },
  })

  return NextResponse.json(share)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string; shareId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId, shareId } = await params

  const document = await prisma.document.findUnique({ where: { id: documentId } })
  if (!document || document.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.documentShare.delete({ where: { id: shareId } })

  return NextResponse.json({ success: true })
}
