import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await params

  const document = await prisma.document.findUnique({ where: { id: documentId } })
  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = document.userId === user.id

  // Allow shared users to fetch the list too
  if (!isOwner) {
    const share = await prisma.documentShare.findUnique({
      where: { documentId_sharedEmail: { documentId, sharedEmail: user.email! } },
    })
    if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const shares = await prisma.documentShare.findMany({
    where: { documentId },
    orderBy: { createdAt: 'asc' },
  })

  type Profile = { fullName: string | null; avatarUrl: string | null }
  type ParticipantRow = { id: string; email: string; fullName: string | null; avatarUrl: string | null }

  let ownerEmail: string | null = null
  let ownerProfile: Profile = { fullName: null, avatarUrl: null }
  const shareProfiles: Record<string, Profile> = {}

  try {
    const sharedEmails = shares.map(s => s.sharedEmail)

    // Join auth.users with UserProfile to get email + name + avatar in one query
    const rows = await prisma.$queryRaw<ParticipantRow[]>`
      SELECT u.id::text, u.email, p."fullName", p."avatarUrl"
      FROM auth.users u
      LEFT JOIN "UserProfile" p ON p.id = u.id::text
      WHERE u.id::text = ${document.userId}
         OR u.email = ANY(${sharedEmails}::text[])
    `

    for (const row of rows) {
      const profile: Profile = { fullName: row.fullName, avatarUrl: row.avatarUrl }
      if (row.id === document.userId) {
        ownerEmail = row.email
        ownerProfile = profile
      }
      shareProfiles[row.email] = profile
    }
  } catch {
    // Fall back to admin client for owner email only
    try {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const { data } = await admin.auth.admin.getUserById(document.userId)
      ownerEmail = data.user?.email ?? null
    } catch { /* leave null */ }
  }

  const enrichedShares = shares.map(s => ({
    ...s,
    profile: shareProfiles[s.sharedEmail] ?? { fullName: null, avatarUrl: null },
  }))

  return NextResponse.json({ shares: enrichedShares, ownerEmail, ownerProfile, ownerUserId: document.userId })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await params
  const { email, permission } = await request.json()

  if (!email || !permission) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (permission !== 'view' && permission !== 'edit') {
    return NextResponse.json({ error: 'Invalid permission' }, { status: 400 })
  }

  const document = await prisma.document.findUnique({ where: { id: documentId } })
  if (!document || document.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (email === user.email) {
    return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 })
  }

  const share = await prisma.documentShare.upsert({
    where: { documentId_sharedEmail: { documentId, sharedEmail: email } },
    update: { permission },
    create: { documentId, ownerUserId: user.id, sharedEmail: email, permission },
  })

  return NextResponse.json(share)
}
