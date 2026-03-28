import { Liveblocks } from '@liveblocks/node'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY!,
    })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { room } = await request.json()

    const document = await prisma.document.findUnique({ where: { id: room } })
    if (!document) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const isOwner = document.userId === user.id
    let canEdit = isOwner

    if (!isOwner) {
      const share = await prisma.documentShare.findUnique({
        where: { documentId_sharedEmail: { documentId: room, sharedEmail: user.email! } },
      })
      if (!share) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      canEdit = share.permission === 'edit'
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { fullName: true, avatarUrl: true },
    })

    // Derive a stable color from user ID
    const hue = Math.abs(
      user.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % 360

    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: profile?.fullName || user.email || 'Anonymous',
        color: `hsl(${hue}, 70%, 60%)`,
        avatar: profile?.avatarUrl?.startsWith('data:') ? undefined : (profile?.avatarUrl ?? undefined),
      },
    })

    session.allow(room, canEdit ? session.FULL_ACCESS : session.READ_ACCESS)

    const { body, status } = await session.authorize()
    return new NextResponse(body, { status, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('[liveblocks-auth] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
