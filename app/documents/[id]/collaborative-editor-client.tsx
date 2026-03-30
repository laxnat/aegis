'use client'

import dynamic from 'next/dynamic'

const CollaborativeEditor = dynamic(
  () => import('./collaborative-editor').then(m => m.CollaborativeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-3 px-2 py-1 mt-2">
        <div className="h-8 w-2/3 bg-white/5 rounded" />
        <div className="h-4 w-full bg-white/5 rounded" />
        <div className="h-4 w-5/6 bg-white/5 rounded" />
        <div className="h-4 w-4/6 bg-white/5 rounded" />
        <div className="h-4 w-full bg-white/5 rounded mt-6" />
        <div className="h-4 w-3/4 bg-white/5 rounded" />
      </div>
    ),
  }
)

type Props = {
  documentId: string
  initialContent: string | null
  readOnly?: boolean
}

export function CollaborativeEditorClient(props: Props) {
  return <CollaborativeEditor {...props} />
}
