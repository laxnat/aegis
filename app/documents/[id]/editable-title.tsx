'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type EditableTitleProps = {
  initialTitle: string
  documentId: string
}

export function EditableTitle({ initialTitle, documentId }: EditableTitleProps) {
  const [title, setTitle] = useState(initialTitle)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsEditing(false)

    await fetch(`/api/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })

    router.refresh()
  }

  if (isEditing) {
    return (
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
        className="text-4xl font-bold border-b-2 border-blue-500 outline-none w-full"
      />
    )
  }

  return (
    <h1
      onClick={() => setIsEditing(true)}
      className="text-4xl font-bold cursor-pointer hover:text-gray-700"
    >
      {title}
    </h1>
  )
}