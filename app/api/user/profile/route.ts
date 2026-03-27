import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Strip any large values that may have been previously stored in user_metadata.
  // avatar_url as a data URL bloats the JWT cookie and causes 431 errors.
  const meta = user.user_metadata ?? {}
  const dirtyKeys = Object.keys(meta).filter(k => {
    const v = meta[k]
    return typeof v === 'string' && v.startsWith('data:')
  })
  if (dirtyKeys.length > 0) {
    const nulled = Object.fromEntries(dirtyKeys.map(k => [k, null]))
    await supabase.auth.updateUser({ data: nulled })
  }

  const profile = await prisma.userProfile.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id },
  })

  return NextResponse.json({
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
  })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fullName, avatarUrl } = await request.json()

  const profile = await prisma.userProfile.upsert({
    where: { id: user.id },
    update: {
      ...(fullName !== undefined && { fullName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    create: {
      id: user.id,
      fullName: fullName ?? null,
      avatarUrl: avatarUrl ?? null,
    },
  })

  // Keep full_name in user_metadata for small display-name use (never avatar)
  if (fullName !== undefined) {
    await supabase.auth.updateUser({ data: { full_name: fullName } })
  }

  return NextResponse.json({
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
  })
}
