'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useState, useEffect, useRef } from 'react'

type BlockEditorProps = {
  blockId: string
  initialContent: string
  blockType: string
  onEnter: () => void
  onBackspace: () => void
  onUpdate: (content: string) => void
  shouldFocus?: boolean
  onFocused?: () => void
}

export function BlockEditor({
  blockId,
  initialContent,
  blockType,
  onEnter,
  onBackspace,
  onUpdate,
  shouldFocus = false,
  onFocused,
}: BlockEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [isUserFocused, setIsUserFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onUpdate(html)
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const hasSelection = from !== to
      setShowToolbar(hasSelection)
    },
    onBlur: () => {
      setShowToolbar(false)
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[1.5rem] px-2 py-1',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          onEnter()
          return true
        }
        
        if (event.key === 'Backspace' && editor?.isEmpty) {
          event.preventDefault()
          onBackspace()
          return true
        }
        
        return false
      },
    },
  })

  const isEmpty = editor?.isEmpty;

  // Focus editor when shouldFocus becomes true
  useEffect(() => {
    if (!editor) return;
  
    const handleFocus = () => {
      setIsUserFocused(true);
      onFocused?.();
    };
  
    const handleBlur = () => {
      setIsUserFocused(false);
    };
  
    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);
  
    if (shouldFocus) {
      editor.commands.focus();
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  
    return () => {
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
    };
  }, [editor, shouldFocus, onFocused]);
  
  return (
    <div ref={containerRef} className="block-editor relative">
      {showToolbar && (
        <div 
          className="absolute -top-12 left-0 bg-gray-800 text-white rounded-lg shadow-lg p-1 flex gap-1 z-50"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded hover:bg-gray-700 font-bold ${
              editor?.isActive('bold') ? 'bg-gray-700' : ''
            }`}
          >
            B
          </button>
          
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded hover:bg-gray-700 italic ${
              editor?.isActive('italic') ? 'bg-gray-700' : ''
            }`}
          >
            I
          </button>
          
          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1 rounded hover:bg-gray-700 underline ${
              editor?.isActive('underline') ? 'bg-gray-700' : ''
            }`}
          >
            U
          </button>

          <div className="w-px bg-gray-600 mx-1" />

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1 rounded hover:bg-gray-700 text-sm ${
              editor?.isActive('heading', { level: 1 }) ? 'bg-gray-700' : ''
            }`}
          >
            H1
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded hover:bg-gray-700 text-sm ${
              editor?.isActive('heading', { level: 2 }) ? 'bg-gray-700' : ''
            }`}
          >
            H2
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded hover:bg-gray-700 text-sm ${
              editor?.isActive('heading', { level: 3 }) ? 'bg-gray-700' : ''
            }`}
          >
            H3
          </button>
        </div>
      )}

      <div className="group relative rounded transition-colors">
        {/* Hover handle - positioned absolutely to the left */}
        <div className="absolute -left-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 h-full">
          <button className="text-gray-400 hover:text-gray-600 cursor-grab p-1">
            ⋮⋮
          </button>
          <button className="text-gray-400 hover:text-gray-600 p-1">
            +
          </button>
        </div>
        
        <EditorContent editor={editor} />
        {isEmpty && isUserFocused && (
          <div className="absolute left-2 top-1 text-gray-400 pointer-events-none">
            Type '/' for commands...
          </div>
        )}
      </div>
    </div>
  )
}