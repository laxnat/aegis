'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type EditableTitleProps = {
  initialTitle: string
  documentId: string
  readOnly?: boolean
}

export function EditableTitle({ initialTitle, documentId, readOnly = false }: EditableTitleProps) {
  const [title, setTitle] = useState(initialTitle)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  // Sync when the server delivers a new title (e.g. renamed from sidebar)
  useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

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
      onClick={() => !readOnly && setIsEditing(true)}
      className={`text-4xl font-bold ${readOnly ? 'cursor-default' : 'cursor-pointer hover:text-gray-700'}`}
    >
      {title}
    </h1>
  )
}