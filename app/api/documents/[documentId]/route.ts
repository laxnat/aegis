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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { documentId: id } = await params
  const { title } = await request.json()

  // Check if document belongs to user
  const document = await prisma.document.findUnique({
    where: { id },
  })

  if (!document || document.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.document.update({
    where: { id },
    data: { title },
  })

  return NextResponse.json(updated)
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { documentId: id } = await params

  const source = await prisma.document.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })

  if (!source || source.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const newDoc = await prisma.document.create({
    data: { title: `Copy of ${source.title}`, userId: user.id },
  })

  // Copy blocks, remapping IDs (parents before children)
  const sorted = [...source.blocks].sort((a, b) => {
    if (!a.parentId && b.parentId) return -1
    if (a.parentId && !b.parentId) return 1
    return a.order - b.order
  })

  const idMap = new Map<string, string>()
  for (const block of sorted) {
    const { id: oldId, documentId: _d, parentId, createdAt: _c, updatedAt: _u, ...rest } = block
    const newBlock = await prisma.block.create({
      data: {
        ...rest,
        documentId: newDoc.id,
        parentId: parentId ? (idMap.get(parentId) ?? null) : null,
      },
    })
    idMap.set(oldId, newBlock.id)
  }

  return NextResponse.json(newDoc)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { documentId: id } = await params

  const document = await prisma.document.findUnique({ where: { id } })

  if (!document || document.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.document.delete({ where: { id } })

  return NextResponse.json({ success: true })
}