import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const folders = await prisma.folder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(folders)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, parentId } = await request.json()

  // Verify parentId belongs to user if provided
  if (parentId) {
    const parent = await prisma.folder.findUnique({ where: { id: parentId } })
    if (!parent || parent.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const folder = await prisma.folder.create({
    data: {
      name: name || 'New Folder',
      userId: user.id,
      parentId: parentId || null,
    },
  })

  return NextResponse.json(folder)
}
