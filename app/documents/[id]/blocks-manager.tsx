'use client'

import { useState, useRef, useEffect } from 'react'
import { Editor } from '@tiptap/react'
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const lastSelectedIdxRef = useRef<number>(-1)

  // Refs so the keydown handler always sees latest state
  const blocksRef = useRef(blocks)
  const selectedIdsRef = useRef(selectedIds)
  useEffect(() => { blocksRef.current = blocks }, [blocks])
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])

  // Map of blockId → TipTap editor instance, used for cross-block text deletion
  const editorsRef = useRef<Map<string, Editor>>(new Map())

  const selectBlock = (blockId: string, shiftKey: boolean) => {
    const idx = blocks.findIndex(b => b.id === blockId)
    if (idx === -1) return
    if (shiftKey && lastSelectedIdxRef.current >= 0) {
      const min = Math.min(lastSelectedIdxRef.current, idx)
      const max = Math.max(lastSelectedIdxRef.current, idx)
      setSelectedIds(new Set(blocks.slice(min, max + 1).map(b => b.id)))
    } else {
      setSelectedIds(new Set([blockId]))
      lastSelectedIdxRef.current = idx
    }
  }

  // Delete/Backspace handler — block-level selection takes priority,
  // then falls through to cross-block text selection handling.
  useEffect(() => {
    if (readOnly) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return

      const currentSelected = selectedIdsRef.current
      const currentBlocks = blocksRef.current

      // --- Block-level deletion ---
      if (currentSelected.size > 0) {
        e.preventDefault()
        const remaining = currentBlocks.filter(b => !currentSelected.has(b.id))
        if (remaining.length === 0) {
          // Always keep at least one block; just clear the last one's content
          const last = currentBlocks[currentBlocks.length - 1]
          const ed = editorsRef.current.get(last.id)
          ed?.commands.clearContent()
          setSelectedIds(new Set())
          return
        }
        setSelectedIds(new Set())
        setBlocks(remaining)
        currentBlocks
          .filter(b => currentSelected.has(b.id))
          .forEach(b => fetch(`/api/documents/${documentId}/blocks/${b.id}`, { method: 'DELETE' }))
        return
      }

      // --- Cross-block text deletion ---
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      const getBlockEl = (node: Node) =>
        (node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement)
          ?.closest('[data-block-id]') as HTMLElement | null
      const startBlockEl = getBlockEl(range.startContainer)
      const endBlockEl = getBlockEl(range.endContainer)
      if (!startBlockEl || !endBlockEl || startBlockEl === endBlockEl) return

      e.preventDefault()
      sel.removeAllRanges()

      const startId = startBlockEl.dataset.blockId!
      const endId = endBlockEl.dataset.blockId!
      const startIdx = currentBlocks.findIndex(b => b.id === startId)
      const endIdx = currentBlocks.findIndex(b => b.id === endId)
      if (startIdx === -1 || endIdx === -1) return

      const firstEditor = editorsRef.current.get(startId)
      if (firstEditor) {
        try {
          const pmPos = firstEditor.view.posAtDOM(range.startContainer, range.startOffset)
          firstEditor.chain()
            .setTextSelection({ from: pmPos, to: firstEditor.state.doc.content.size })
            .deleteSelection()
            .run()
        } catch { firstEditor.commands.clearContent() }
      }

      const lastEditor = editorsRef.current.get(endId)
      if (lastEditor) {
        try {
          const pmPos = lastEditor.view.posAtDOM(range.endContainer, range.endOffset)
          lastEditor.chain()
            .setTextSelection({ from: 1, to: pmPos })
            .deleteSelection()
            .run()
        } catch { /* leave untouched */ }
      }

      const toDelete = currentBlocks.slice(startIdx + 1, endIdx)
      if (toDelete.length > 0) {
        const ids = new Set(toDelete.map(b => b.id))
        setBlocks(prev => prev.filter(b => !ids.has(b.id)))
        toDelete.forEach(b =>
          fetch(`/api/documents/${documentId}/blocks/${b.id}`, { method: 'DELETE' })
        )
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [readOnly, documentId])

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
        <div key={block.key} data-block-id={block.id}>
          <BlockEditor
            initialContent={block.content}
            blockType={block.type}
            onEnter={readOnly ? () => {} : (initialContent) => createBlock(block.order, initialContent)}
            onBackspace={readOnly ? () => {} : () => deleteBlock(block.id)}
            onUpdate={readOnly ? () => {} : (content) => updateBlock(block.id, content)}
            focusPosition={focusBlockId === block.id ? focusPosition : undefined}
            onFocused={() => { setFocusBlockId(null); setSelectedIds(new Set()) }}
            onEditorReady={(ed) => editorsRef.current.set(block.id, ed)}
            isSelected={selectedIds.has(block.id)}
            onSelect={(shiftKey) => selectBlock(block.id, shiftKey)}
            readOnly={readOnly}
          />
        </div>
      ))}
    </div>
  )
}
