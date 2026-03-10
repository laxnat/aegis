import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { Sidebar } from '../components/sidebar'
import { NavButtons } from '../components/nav-buttons'

const prisma = new PrismaClient()

export default async function DocumentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [documents, folders] = await Promise.all([
    prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, folderId: true, updatedAt: true },
    }),
    prisma.folder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, parentId: true },
    }),
  ])

  return (
    <div className="flex h-screen">
      <Sidebar
        documents={documents}
        folders={folders}
        userEmail={user.email || ''}
      />
      <main className="flex-1 overflow-auto">
        <NavButtons />
        {children}
      </main>
    </div>
  )
}
