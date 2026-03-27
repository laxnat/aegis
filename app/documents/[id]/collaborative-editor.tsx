'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Extension } from '@tiptap/core'
import Collaboration from '@tiptap/extension-collaboration'
import { yCursorPlugin } from '@tiptap/y-tiptap'
import * as Y from 'yjs'
import { LiveblocksYjsProvider } from '@liveblocks/yjs'
import { RoomProvider, useRoom, useSelf } from '@/lib/liveblocks'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Type, Heading1, Heading2, Heading3, Heading4,
  List, ListOrdered, ListChecks,
  Quote, Code, Code2, Minus, Strikethrough, Highlighter, Table2,
} from 'lucide-react'

// ─── Slash commands ───────────────────────────────────────────────────────────

type SlashCommand = {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  keywords: string[]
  group: string
  action: (editor: Editor) => void
}

const COMMANDS: SlashCommand[] = [
  { id: 'h1', label: 'Heading 1', description: 'Large section heading', icon: <Heading1 size={15} />, keywords: ['h1', 'heading1', 'title'], group: 'Headings', action: e => e.chain().focus().setHeading({ level: 1 }).run() },
  { id: 'h2', label: 'Heading 2', description: 'Medium section heading', icon: <Heading2 size={15} />, keywords: ['h2', 'heading2'], group: 'Headings', action: e => e.chain().focus().setHeading({ level: 2 }).run() },
  { id: 'h3', label: 'Heading 3', description: 'Small section heading', icon: <Heading3 size={15} />, keywords: ['h3', 'heading3'], group: 'Headings', action: e => e.chain().focus().setHeading({ level: 3 }).run() },
  { id: 'h4', label: 'Heading 4', description: 'Subtle section heading', icon: <Heading4 size={15} />, keywords: ['h4', 'heading4'], group: 'Headings', action: e => e.chain().focus().setHeading({ level: 4 }).run() },
  { id: 'bullet', label: 'Bullet List', description: 'Unordered list', icon: <List size={15} />, keywords: ['bullet', 'list', 'ul'], group: 'Lists', action: e => e.chain().focus().toggleBulletList().run() },
  { id: 'numbered', label: 'Numbered List', description: 'Ordered list', icon: <ListOrdered size={15} />, keywords: ['numbered', 'ordered', 'ol'], group: 'Lists', action: e => e.chain().focus().toggleOrderedList().run() },
  { id: 'todo', label: 'To-do List', description: 'Checkbox list', icon: <ListChecks size={15} />, keywords: ['todo', 'task', 'checkbox'], group: 'Lists', action: e => e.chain().focus().toggleTaskList().run() },
  { id: 'text', label: 'Text', description: 'Plain paragraph', icon: <Type size={15} />, keywords: ['text', 'paragraph'], group: 'Blocks', action: e => e.chain().focus().setParagraph().run() },
  { id: 'quote', label: 'Quote', description: 'Block quote', icon: <Quote size={15} />, keywords: ['quote', 'blockquote'], group: 'Blocks', action: e => e.chain().focus().toggleBlockquote().run() },
  { id: 'code', label: 'Code Block', description: 'Monospace code block', icon: <Code size={15} />, keywords: ['code', 'codeblock', 'snippet'], group: 'Blocks', action: e => e.chain().focus().toggleCodeBlock().run() },
  { id: 'table', label: 'Table', description: 'Pick rows and columns', icon: <Table2 size={15} />, keywords: ['table', 'grid'], group: 'Blocks', action: () => {} },
  { id: 'divider', label: 'Divider', description: 'Horizontal separator line', icon: <Minus size={15} />, keywords: ['divider', 'hr', 'separator'], group: 'Blocks', action: e => e.chain().focus().setHorizontalRule().run() },
  { id: 'inline-code', label: 'Inline Code', description: 'Monospace inline snippet', icon: <Code2 size={15} />, keywords: ['code', 'inline'], group: 'Inline', action: e => e.chain().focus().toggleCode().run() },
  { id: 'strikethrough', label: 'Strikethrough', description: 'Strike through text', icon: <Strikethrough size={15} />, keywords: ['strike', 'strikethrough'], group: 'Inline', action: e => e.chain().focus().toggleStrike().run() },
  { id: 'highlight', label: 'Highlight', description: 'Highlight text in yellow', icon: <Highlighter size={15} />, keywords: ['highlight', 'mark'], group: 'Inline', action: e => e.chain().focus().toggleHighlight().run() },
]

function filterCommands(query: string) {
  if (!query) return COMMANDS
  const q = query.toLowerCase()
  return COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.keywords.some(k => k.includes(q)))
}

// ─── Cursor styles ────────────────────────────────────────────────────────────

function CursorStyles() {
  return (
    <style>{`
      .collaboration-cursor__caret { border-left: 2px solid; border-right: 2px solid; margin-left: -1px; margin-right: -1px; pointer-events: none; position: relative; word-break: normal; }
      .collaboration-cursor__label { border-radius: 3px 3px 3px 0; color: #fff; font-size: 11px; font-weight: 600; left: -1px; line-height: normal; padding: 0.1rem 0.3rem; position: absolute; top: -1.4em; user-select: none; white-space: nowrap; pointer-events: none; }
    `}</style>
  )
}

// ─── Public entry — provides the room ────────────────────────────────────────

type Props = { documentId: string; initialContent: string | null; readOnly?: boolean }

export function CollaborativeEditor({ documentId, initialContent, readOnly = false }: Props) {
  return (
    <RoomProvider id={documentId} initialPresence={{}}>
      <CursorStyles />
      <RoomEditor documentId={documentId} initialContent={initialContent} readOnly={readOnly} />
    </RoomProvider>
  )
}

// ─── Sets up Yjs doc + provider, then renders editor ─────────────────────────

function RoomEditor({ documentId, initialContent, readOnly }: Props) {
  const room = useRoom()
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null)

  useEffect(() => {
    const yDoc = new Y.Doc()
    const yProvider = new LiveblocksYjsProvider(room, yDoc)
    setDoc(yDoc)
    setProvider(yProvider)
    return () => {
      yDoc.destroy()
      yProvider.destroy()
    }
  }, [room])

  if (!doc || !provider) {
    return <div className="animate-pulse h-6 w-48 bg-white/5 rounded mt-2" />
  }

  return (
    <TipTapEditor
      documentId={documentId}
      initialContent={initialContent}
      readOnly={readOnly ?? false}
      doc={doc}
      provider={provider}
    />
  )
}

// ─── TipTap editor — only mounts after doc + provider are ready ───────────────

type EditorProps = {
  documentId: string
  initialContent: string | null
  readOnly: boolean
  doc: Y.Doc
  provider: LiveblocksYjsProvider
}

function TipTapEditor({ documentId, initialContent, readOnly, doc, provider }: EditorProps) {
  const self = useSelf()

  const [synced, setSynced] = useState(false)
  const [showCommands, setShowCommands] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [commandPos, setCommandPos] = useState({ top: 0, left: 0 })
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [pickerHover, setPickerHover] = useState({ rows: 3, cols: 3 })
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const commandListRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const showCommandsRef = useRef(false)
  const activeIndexRef = useRef(0)
  const filteredRef = useRef<SlashCommand[]>(COMMANDS)
  const isKeyboardNavRef = useRef(false)
  const suppressSlashRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { showCommandsRef.current = showCommands }, [showCommands])
  useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])

  useEffect(() => {
    const onSync = (s: boolean) => { if (s) setSynced(true) }
    provider.on('sync', onSync)
    return () => { provider.off('sync', onSync) }
  }, [provider])

  const saveContent = useCallback((html: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/documents/${documentId}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: html }),
      })
    }, 2000)
  }, [documentId])

  const applyCommand = useCallback((cmd: SlashCommand) => {
    const ed = editorRef.current
    if (!ed) return
    const { $head } = ed.state.selection
    const from = $head.pos - $head.parentOffset
    ed.chain().deleteRange({ from, to: $head.pos }).run()
    setShowCommands(false); showCommandsRef.current = false; setCommandQuery('')
    if (cmd.id === 'table') { setPickerHover({ rows: 3, cols: 3 }); setShowTablePicker(true); return }
    cmd.action(ed)
  }, [])

  const insertTable = (rows: number, cols: number) => {
    editorRef.current?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setShowTablePicker(false)
  }

  useEffect(() => {
    if (!showTablePicker) return
    const onClick = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowTablePicker(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowTablePicker(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [showTablePicker])

  useEffect(() => {
    if (!isKeyboardNavRef.current) return
    const el = commandListRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Collaboration.configure({ document: doc }),
      Extension.create({
        name: 'collaborationCursor',
        addProseMirrorPlugins() {
          const user = { name: self?.info?.name ?? 'Anonymous', color: self?.info?.color ?? '#888' }
          provider.awareness.setLocalStateField('user', user)
          return [yCursorPlugin(provider.awareness as any)]
        },
      }),
    ],
    onUpdate: ({ editor }) => {
      saveContent(editor.getHTML())
      const { $head } = editor.state.selection
      const lineText = $head.parent.textContent.slice(0, $head.parentOffset)
      if (lineText.startsWith('/') && !lineText.includes(' ')) {
        if (suppressSlashRef.current) { setShowCommands(false); showCommandsRef.current = false }
        else {
          const query = lineText.slice(1)
          filteredRef.current = filterCommands(query)
          // Compute cursor pixel position relative to container
          const sel = window.getSelection()
          if (sel && sel.rangeCount > 0) {
            const rect = sel.getRangeAt(0).getBoundingClientRect()
            const cRect = containerRef.current?.getBoundingClientRect()
            if (cRect) setCommandPos({ top: rect.bottom - cRect.top + 4, left: rect.left - cRect.left })
          }
          setCommandQuery(query); setShowCommands(true); setActiveIndex(0); activeIndexRef.current = 0
        }
      } else {
        suppressSlashRef.current = false; setShowCommands(false); showCommandsRef.current = false
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from !== to) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const rect = sel.getRangeAt(0).getBoundingClientRect()
          const cRect = containerRef.current?.getBoundingClientRect()
          if (cRect) setToolbarPos({ top: rect.top - cRect.top - 44, left: rect.left - cRect.left + rect.width / 2 })
        }
        setShowToolbar(true)
      } else {
        setShowToolbar(false)
      }
    },
    onBlur: () => setShowToolbar(false),
    editorProps: {
      attributes: { class: 'prose max-w-none focus:outline-none min-h-[calc(100vh-16rem)] px-2 py-1' },
      handleKeyDown: (_view, event) => {
        if (showCommandsRef.current) {
          if (event.key === 'ArrowDown') { event.preventDefault(); isKeyboardNavRef.current = true; const n = Math.min(activeIndexRef.current + 1, filteredRef.current.length - 1); activeIndexRef.current = n; setActiveIndex(n); return true }
          if (event.key === 'ArrowUp') { event.preventDefault(); isKeyboardNavRef.current = true; const n = Math.max(activeIndexRef.current - 1, 0); activeIndexRef.current = n; setActiveIndex(n); return true }
          if (event.key === 'Enter') { event.preventDefault(); const cmd = filteredRef.current[activeIndexRef.current]; if (cmd) applyCommand(cmd); return true }
          if (event.key === 'Escape') { setShowCommands(false); showCommandsRef.current = false; suppressSlashRef.current = true; return true }
        }
        return false
      },
    },
  })

  useEffect(() => { editorRef.current = editor }, [editor])

  // Set initial content once Yjs syncs, if the doc is empty
  useEffect(() => {
    if (!synced || !editor || !initialContent) return
    const fragment = doc.getXmlFragment('default')
    if (fragment.length === 0) editor.commands.setContent(initialContent)
  }, [synced, editor, initialContent, doc])

  const filteredCommands = filterCommands(commandQuery)
  const grouped = filteredCommands.reduce<Record<string, SlashCommand[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  return (
    <div ref={containerRef} className="relative">
      {/* Floating toolbar */}
      {showToolbar && editor && (
        <div style={{ top: toolbarPos.top, left: toolbarPos.left, transform: 'translateX(-50%)' }}
          className="absolute z-50 flex items-center gap-0.5 bg-tertiary border border-white/10 rounded-lg shadow-xl px-1 py-1"
          onMouseDown={e => e.preventDefault()}
        >
          {[
            { label: 'B', title: 'Bold', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), cls: 'font-bold' },
            { label: 'I', title: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), cls: 'italic' },
            { label: 'S', title: 'Strike', action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), cls: 'line-through' },
            { label: '<>', title: 'Code', action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code'), cls: 'font-mono text-xs' },
          ].map(b => (
            <button key={b.label} title={b.title} onClick={b.action}
              className={`w-7 h-7 flex items-center justify-center rounded font-ui text-sm transition-colors ${b.active ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'} ${b.cls}`}
            >{b.label}</button>
          ))}
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          {[
            { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
            { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
            { label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
          ].map(b => (
            <button key={b.label} onClick={b.action}
              className={`w-7 h-7 flex items-center justify-center rounded font-ui text-xs font-bold transition-colors ${b.active ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            >{b.label}</button>
          ))}
        </div>
      )}

      {/* Slash command menu */}
      {showCommands && filteredCommands.length > 0 && (
        <div ref={commandListRef} style={{ top: commandPos.top, left: commandPos.left }} className="absolute w-72 bg-secondary border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {Object.entries(grouped).map(([group, cmds]) => (
            <div key={group}>
              <p className="px-3 pt-2 pb-1 font-ui text-xs text-white/30 tracking-widest uppercase">{group}</p>
              {cmds.map(cmd => {
                const idx = filteredCommands.indexOf(cmd)
                return (
                  <button key={cmd.id}
                    onMouseDown={e => { e.preventDefault(); applyCommand(cmd) }}
                    onMouseEnter={() => { isKeyboardNavRef.current = false; setActiveIndex(idx) }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${activeIndex === idx ? 'bg-white/8 text-white' : 'text-white/60 hover:bg-white/5'}`}
                  >
                    <span className="text-white/40">{cmd.icon}</span>
                    <div>
                      <p className="font-ui text-sm text-white">{cmd.label}</p>
                      <p className="font-ui text-xs text-white/40">{cmd.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Table picker */}
      {showTablePicker && (
        <div ref={pickerRef} style={{ top: commandPos.top, left: commandPos.left }} className="absolute bg-secondary border border-white/10 rounded-xl shadow-2xl z-50 p-3">
          <p className="font-ui text-xs text-white/40 mb-2 text-center">{pickerHover.rows} × {pickerHover.cols}</p>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 1.25rem)' }}>
            {Array.from({ length: 36 }).map((_, i) => {
              const r = Math.floor(i / 6) + 1; const c = (i % 6) + 1
              return (
                <div key={i} onMouseEnter={() => setPickerHover({ rows: r, cols: c })} onClick={() => insertTable(r, c)}
                  className={`w-5 h-5 rounded-sm border cursor-pointer transition-colors ${r <= pickerHover.rows && c <= pickerHover.cols ? 'bg-primary/40 border-primary/60' : 'bg-white/5 border-white/10'}`}
                />
              )
            })}
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
