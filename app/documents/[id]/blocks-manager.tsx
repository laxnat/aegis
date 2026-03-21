'use client'

import { useState } from 'react'
import { BlockEditor } from './block-editor'

type Block = {
  id: string
  key: string   // stable React key — doesn't change when temp ID is swapped for real ID
  type: string
  content: string
  order: number
}

type ServerBlock = Omit<Block, 'key'>

type BlocksManagerProps = {
  documentId: string
  initialBlocks: ServerBlock[]
  readOnly?: boolean
}

export function BlocksManager({ documentId, initialBlocks, readOnly = false }: BlocksManagerProps) {
  const [blocks, setBlocks] = useState<Block[]>(() =>
    initialBlocks.map(b => ({ ...b, key: b.id }))
  )
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null)
  const [focusPosition, setFocusPosition] = useState<'start' | 'end'>('start')

  const createBlock = async (afterOrder: number, initialContent?: string) => {
    const tempId = `temp-${Date.now()}`
    const tempBlock: Block = { id: tempId, key: tempId, type: 'text', content: initialContent ?? '', order: afterOrder + 1 }
    setBlocks((prev) => {
      const updated = prev.map((b) => b.order > afterOrder ? { ...b, order: b.order + 1 } : b)
      return [...updated, tempBlock].sort((a, b) => a.order - b.order)
    })
    setFocusPosition('start')
    setFocusBlockId(tempId)

    const response = await fetch(`/api/documents/${documentId}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text', content: initialContent ?? '', order: afterOrder + 1 }),
    })
    const newBlock = await response.json()

    // Swap temp ID for real ID — keep `key` stable so the editor doesn't remount
    setBlocks((prev) => prev.map((b) =>
      b.key === tempId ? { ...b, id: newBlock.id } : b
    ))
    setFocusBlockId((id) => id === tempId ? newBlock.id : id)
  }

  const deleteBlock = async (blockId: string) => {
    if (blocks.length === 1) return

    const blockIndex = blocks.findIndex((b) => b.id === blockId)
    const prevBlock = blocks[blockIndex - 1]

    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    if (prevBlock) {
      setFocusPosition('end')
      setFocusBlockId(prevBlock.id)
    }

    fetch(`/api/documents/${documentId}/blocks/${blockId}`, { method: 'DELETE' })
  }

  const updateBlock = async (blockId: string, content: string) => {
    // Skip saving if this is still a temp block (API call not yet resolved)
    if (blockId.startsWith('temp-')) return

    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, content } : b))
    fetch(`/api/documents/${documentId}/blocks/${blockId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  }

  if (blocks.length === 0) {
    return <p className="text-gray-500">No blocks yet</p>
  }

  return (
    <div className="space-y-0.5">
      {blocks.map((block) => (
        <BlockEditor
          key={block.key}
          blockId={block.id}
          initialContent={block.content}
          blockType={block.type}
          onEnter={readOnly ? () => {} : (initialContent) => createBlock(block.order, initialContent)}
          onBackspace={readOnly ? () => {} : () => deleteBlock(block.id)}
          onUpdate={readOnly ? () => {} : (content) => updateBlock(block.id, content)}
          focusPosition={focusBlockId === block.id ? focusPosition : undefined}
          onFocused={() => setFocusBlockId(null)}
          readOnly={readOnly}
        />
      ))}
    </div>
  )
}
