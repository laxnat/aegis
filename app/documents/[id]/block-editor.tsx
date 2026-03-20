'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { useState, useEffect, useRef } from 'react'
import {
  Type, Heading1, Heading2, Heading3, Heading4,
  List, ListOrdered, ListChecks,
  Quote, Code, Code2, Minus, Strikethrough, Highlighter, Table2,
} from 'lucide-react'

type BlockEditorProps = {
  blockId: string
  initialContent: string
  blockType: string
  onEnter: () => void
  onBackspace: () => void
  onUpdate: (content: string) => void
  focusPosition?: 'start' | 'end'
  onFocused?: () => void
  readOnly?: boolean
}

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
  // Headings
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 size={15} />,
    keywords: ['h1', 'heading1', 'heading 1', 'title'],
    group: 'Headings',
    action: e => e.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 size={15} />,
    keywords: ['h2', 'heading2', 'heading 2'],
    group: 'Headings',
    action: e => e.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 size={15} />,
    keywords: ['h3', 'heading3', 'heading 3'],
    group: 'Headings',
    action: e => e.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    id: 'h4',
    label: 'Heading 4',
    description: 'Subtle section heading',
    icon: <Heading4 size={15} />,
    keywords: ['h4', 'heading4', 'heading 4'],
    group: 'Headings',
    action: e => e.chain().focus().setHeading({ level: 4 }).run(),
  },
  // Lists
  {
    id: 'bullet',
    label: 'Bullet List',
    description: 'Unordered list',
    icon: <List size={15} />,
    keywords: ['bullet', 'list', 'unordered', 'ul'],
    group: 'Lists',
    action: e => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'numbered',
    label: 'Numbered List',
    description: 'Ordered list',
    icon: <ListOrdered size={15} />,
    keywords: ['numbered', 'ordered', 'ol', 'list', '1'],
    group: 'Lists',
    action: e => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'todo',
    label: 'To-do List',
    description: 'Checkbox list',
    icon: <ListChecks size={15} />,
    keywords: ['todo', 'task', 'checkbox', 'checklist', 'check'],
    group: 'Lists',
    action: e => e.chain().focus().toggleTaskList().run(),
  },
  // Blocks
  {
    id: 'text',
    label: 'Text',
    description: 'Plain paragraph',
    icon: <Type size={15} />,
    keywords: ['text', 'paragraph', 'plain'],
    group: 'Blocks',
    action: e => e.chain().focus().setParagraph().run(),
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Block quote',
    icon: <Quote size={15} />,
    keywords: ['quote', 'blockquote', 'callout'],
    group: 'Blocks',
    action: e => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'code',
    label: 'Code Block',
    description: 'Monospace code block',
    icon: <Code size={15} />,
    keywords: ['code', 'codeblock', 'snippet', 'pre', 'mono'],
    group: 'Blocks',
    action: e => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'table',
    label: 'Table',
    description: '3×3 table with header row',
    icon: <Table2 size={15} />,
    keywords: ['table', 'grid', 'rows', 'columns', 'spreadsheet'],
    group: 'Blocks',
    action: e => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Horizontal separator line',
    icon: <Minus size={15} />,
    keywords: ['divider', 'hr', 'rule', 'separator', 'line'],
    group: 'Blocks',
    action: e => e.chain().focus().setHorizontalRule().run(),
  },
  // Inline
  {
    id: 'inline-code',
    label: 'Inline Code',
    description: 'Monospace inline snippet',
    icon: <Code2 size={15} />,
    keywords: ['code', 'inline', 'mono', 'snippet'],
    group: 'Inline',
    action: e => e.chain().focus().toggleCode().run(),
  },
  {
    id: 'strikethrough',
    label: 'Strikethrough',
    description: 'Strike through text',
    icon: <Strikethrough size={15} />,
    keywords: ['strike', 'strikethrough', 'delete', 'cross'],
    group: 'Inline',
    action: e => e.chain().focus().toggleStrike().run(),
  },
  {
    id: 'highlight',
    label: 'Highlight',
    description: 'Highlight text in yellow',
    icon: <Highlighter size={15} />,
    keywords: ['highlight', 'mark', 'yellow', 'color'],
    group: 'Inline',
    action: e => e.chain().focus().toggleHighlight().run(),
  },
]

function filterCommands(query: string): SlashCommand[] {
  if (!query) return COMMANDS
  const q = query.toLowerCase()
  return COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(q) ||
    cmd.keywords.some(k => k.includes(q))
  )
}

export function BlockEditor({
  blockId,
  initialContent,
  blockType,
  onEnter,
  onBackspace,
  onUpdate,
  focusPosition,
  onFocused,
  readOnly = false,
}: BlockEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [isUserFocused, setIsUserFocused] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!initialContent || initialContent === '<p></p>')
  const [activeNodeType, setActiveNodeType] = useState<'paragraph' | 'h1' | 'h2' | 'h3'>('paragraph')
  const [showCommands, setShowCommands] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const commandListRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)

  // Refs for stable access inside Tiptap's handleKeyDown
  const showCommandsRef = useRef(false)
  const activeIndexRef = useRef(0)
  const filteredRef = useRef<SlashCommand[]>(COMMANDS)
  const isKeyboardNavRef = useRef(false)
  const suppressSlashRef = useRef(false)

  // Keep refs in sync
  useEffect(() => { showCommandsRef.current = showCommands }, [showCommands])
  useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])

  const applyCommand = (cmd: SlashCommand) => {
    const ed = editorRef.current
    if (!ed) return
    const { $head } = ed.state.selection
    const from = $head.pos - $head.parentOffset
    ed.chain().deleteRange({ from, to: $head.pos }).run()
    cmd.action(ed)
    setShowCommands(false)
    showCommandsRef.current = false
    setCommandQuery('')
  }

  // Scroll active item into view — only when navigating via keyboard
  useEffect(() => {
    if (!isKeyboardNavRef.current) return
    const el = commandListRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty)
      const html = editor.getHTML()
      onUpdate(html)
      const level = editor.isActive('heading', { level: 1 }) ? 'h1'
        : editor.isActive('heading', { level: 2 }) ? 'h2'
        : editor.isActive('heading', { level: 3 }) ? 'h3'
        : 'paragraph'
      setActiveNodeType(level as 'paragraph' | 'h1' | 'h2' | 'h3')

      // Detect slash command
      const { $head } = editor.state.selection
      const lineText = $head.parent.textContent.slice(0, $head.parentOffset)
      if (lineText.startsWith('/') && !lineText.includes(' ')) {
        if (suppressSlashRef.current) {
          // User escaped out of slash mode — keep panel closed
          setShowCommands(false)
          showCommandsRef.current = false
        } else {
          const query = lineText.slice(1)
          const filtered = filterCommands(query)
          filteredRef.current = filtered
          setCommandQuery(query)
          setShowCommands(true)
          setActiveIndex(0)
          activeIndexRef.current = 0
        }
      } else {
        // Left the slash context (space typed, backspaced past /, new line, etc.)
        suppressSlashRef.current = false
        setShowCommands(false)
        showCommandsRef.current = false
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      setShowToolbar(from !== to)
      const level = editor.isActive('heading', { level: 1 }) ? 'h1'
        : editor.isActive('heading', { level: 2 }) ? 'h2'
        : editor.isActive('heading', { level: 3 }) ? 'h3'
        : 'paragraph'
      setActiveNodeType(level as 'paragraph' | 'h1' | 'h2' | 'h3')
    },
    onBlur: () => {
      setShowToolbar(false)
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[1.5rem] px-2 py-1',
      },
      handleKeyDown: (_view, event) => {
        // Command menu navigation
        if (showCommandsRef.current) {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            isKeyboardNavRef.current = true
            const next = Math.min(activeIndexRef.current + 1, filteredRef.current.length - 1)
            activeIndexRef.current = next
            setActiveIndex(next)
            return true
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            isKeyboardNavRef.current = true
            const next = Math.max(activeIndexRef.current - 1, 0)
            activeIndexRef.current = next
            setActiveIndex(next)
            return true
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            const cmd = filteredRef.current[activeIndexRef.current]
            if (cmd) {
              const ed = editorRef.current!
              const { $head } = ed.state.selection
              const from = $head.pos - $head.parentOffset
              ed.chain().deleteRange({ from, to: $head.pos }).run()
              cmd.action(ed)
              setShowCommands(false)
              showCommandsRef.current = false
              setCommandQuery('')
            }
            return true
          }
          if (event.key === 'Escape') {
            setShowCommands(false)
            showCommandsRef.current = false
            suppressSlashRef.current = true
            return true
          }
        }

        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          onEnter()
          return true
        }
        if (event.key === 'Backspace' && editorRef.current?.isEmpty) {
          event.preventDefault()
          onBackspace()
          return true
        }
        return false
      },
    },
  })

  useEffect(() => { editorRef.current = editor }, [editor])

  useEffect(() => {
    if (!editor) return
    const handleFocus = () => { setIsUserFocused(true); onFocused?.() }
    const handleBlur = () => { setIsUserFocused(false) }
    editor.on('focus', handleFocus)
    editor.on('blur', handleBlur)
    if (focusPosition) {
      editor.commands.focus(focusPosition)
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    return () => {
      editor.off('focus', handleFocus)
      editor.off('blur', handleBlur)
    }
  }, [editor, focusPosition, onFocused])

  const filteredCommands = filterCommands(commandQuery)

  return (
    <div ref={containerRef} className="block-editor relative">
      {/* Formatting toolbar */}
      {showToolbar && (
        <div
          className="absolute -top-11 left-0 bg-tertiary border border-white/10 shadow-xl rounded-lg p-1 flex items-center gap-0.5 z-50"
          onMouseDown={e => e.preventDefault()}
        >
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`px-2.5 py-1 rounded font-ui text-base font-bold transition-colors ${editor?.isActive('bold') ? 'bg-primary/20 text-primary' : 'text-white/60 hover:text-white hover:bg-white/8'}`}
          >B</button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`px-2.5 py-1 rounded font-ui text-base italic transition-colors ${editor?.isActive('italic') ? 'bg-primary/20 text-primary' : 'text-white/60 hover:text-white hover:bg-white/8'}`}
          >I</button>
          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`px-2.5 py-1 rounded font-ui text-base underline transition-colors ${editor?.isActive('underline') ? 'bg-primary/20 text-primary' : 'text-white/60 hover:text-white hover:bg-white/8'}`}
          >U</button>
          <div className="w-px bg-white/10 mx-1 self-stretch" />
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2.5 py-1 rounded font-ui text-base transition-colors ${editor?.isActive('heading', { level: 1 }) ? 'bg-primary/20 text-primary' : 'text-white/60 hover:text-white hover:bg-white/8'}`}
          >H1</button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2.5 py-1 rounded font-ui text-base transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-primary/20 text-primary' : 'text-white/60 hover:text-white hover:bg-white/8'}`}
          >H2</button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2.5 py-1 rounded font-ui text-base transition-colors ${editor?.isActive('heading', { level: 3 }) ? 'bg-primary/20 text-primary' : 'text-white/60 hover:text-white hover:bg-white/8'}`}
          >H3</button>
        </div>
      )}

      <div className="group relative rounded transition-colors">
        {/* Drag handle */}
        <div className="absolute -left-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 h-full">
          <button className="text-white/20 hover:text-white/50 cursor-grab p-1 font-ui text-base">⋮⋮</button>
          <button className="text-white/20 hover:text-white/50 p-1 font-ui text-base">+</button>
        </div>

        <EditorContent editor={editor} />

        {/* Slash command placeholder */}
        {isEmpty && isUserFocused && activeNodeType === 'paragraph' && (
          <div className="absolute left-2 top-1 text-white/20 pointer-events-none font-ui text-base">
            Type &apos;/&apos; for commands...
          </div>
        )}

        {/* Slash command menu */}
        {showCommands && (
          <div
            className="absolute left-0 top-full mt-1 w-72 bg-secondary border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            onMouseDown={e => e.preventDefault()}
          >
            <div ref={commandListRef} className="py-1.5 max-h-72 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <p className="px-4 py-3 font-ui text-lg text-white/25">No commands match &ldquo;{commandQuery}&rdquo;</p>
              ) : (
                (() => {
                  const rendered: React.ReactNode[] = []
                  let lastGroup = ''
                  filteredCommands.forEach((cmd, i) => {
                    if (cmd.group !== lastGroup) {
                      lastGroup = cmd.group
                      rendered.push(
                        <p key={`group-${cmd.group}`} className="px-3 pt-2.5 pb-1 font-display text-xs tracking-widest text-white/25 uppercase">
                          {cmd.group}
                        </p>
                      )
                    }
                    rendered.push(
                      <button
                        key={cmd.id}
                        onMouseEnter={() => { isKeyboardNavRef.current = false; setActiveIndex(i) }}
                        onMouseDown={e => { e.preventDefault(); applyCommand(cmd) }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                          i === activeIndex ? 'bg-white/8' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          i === activeIndex ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-white/40'
                        }`}>
                          {cmd.icon}
                        </div>
                        <div>
                          <p className={`font-ui text-lg leading-tight transition-colors ${i === activeIndex ? 'text-white' : 'text-white/70'}`}>
                            {cmd.label}
                          </p>
                          <p className="font-ui text-base text-white/30 leading-tight">{cmd.description}</p>
                        </div>
                      </button>
                    )
                  })
                  return rendered
                })()
              )}
            </div>
            {commandQuery && (
              <div className="px-3 py-1.5 border-t border-white/5">
                <p className="font-ui text-sm text-white/20">↑↓ navigate · ↵ apply · esc dismiss</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
