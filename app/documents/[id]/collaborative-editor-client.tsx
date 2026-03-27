'use client'

import dynamic from 'next/dynamic'

const CollaborativeEditor = dynamic(
  () => import('./collaborative-editor').then(m => m.CollaborativeEditor),
  { ssr: false, loading: () => <div className="animate-pulse h-8 w-32 bg-white/5 rounded mt-2" /> }
)

type Props = {
  documentId: string
  initialContent: string | null
  readOnly?: boolean
}

export function CollaborativeEditorClient(props: Props) {
  return <CollaborativeEditor {...props} />
}
