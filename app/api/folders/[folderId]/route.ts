import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { folderId: id } = await params
  const body = await request.json()

  const folder = await prisma.folder.findUnique({ where: { id } })
  if (!folder || folder.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const data: { name?: string; parentId?: string | null } = {}
  if (body.name !== undefined) data.name = body.name
  if ('parentId' in body) data.parentId = body.parentId

  const updated = await prisma.folder.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { folderId: id } = await params

  const folder = await prisma.folder.findUnique({ where: { id } })
  if (!folder || folder.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.folder.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
