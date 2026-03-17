'use client'

import { useState } from 'react'
import { BlockEditor } from './block-editor'

type Block = {
  id: string
  type: string
  content: string
  order: number
}

type BlocksManagerProps = {
  documentId: string
  initialBlocks: Block[]
  readOnly?: boolean
}

export function BlocksManager({ documentId, initialBlocks, readOnly = false }: BlocksManagerProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null)
  const [focusPosition, setFocusPosition] = useState<'start' | 'end'>('start')

  const createBlock = async (afterOrder: number) => {
    const response = await fetch(`/api/documents/${documentId}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'text',
        content: '',
        order: afterOrder + 1,
      }),
    })

    const newBlock = await response.json()
    
    // Insert new block and reorder
    setBlocks((prev) => {
      const updated = prev.map((b) =>
        b.order > afterOrder ? { ...b, order: b.order + 1 } : b
      )
      return [...updated, newBlock].sort((a, b) => a.order - b.order)
    })

    // Focus the new block at start
    setFocusPosition('start')
    setFocusBlockId(newBlock.id)
  }

  const deleteBlock = async (blockId: string) => {
    if (blocks.length === 1) return // Don't delete last block

    const blockIndex = blocks.findIndex((b) => b.id === blockId)
    const prevBlock = blocks[blockIndex - 1]

    await fetch(`/api/documents/${documentId}/blocks/${blockId}`, {
      method: 'DELETE',
    })

    setBlocks((prev) => prev.filter((b) => b.id !== blockId))

    if (prevBlock) {
      setFocusPosition('end')
      setFocusBlockId(prevBlock.id)
    }
  }

  const updateBlock = async (blockId: string, content: string) => {
    await fetch(`/api/documents/${documentId}/blocks/${blockId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, content } : b))
    )
  }

  if (blocks.length === 0) {
    return <p className="text-gray-500">No blocks yet</p>
  }

  return (
    <div className="space-y-1">
      {blocks.map((block) => (
        <BlockEditor
          key={block.id}
          blockId={block.id}
          initialContent={block.content}
          blockType={block.type}
          onEnter={readOnly ? () => {} : () => createBlock(block.order)}
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