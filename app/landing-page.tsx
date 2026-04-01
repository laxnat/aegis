'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import { FileText, Folder, Search } from 'lucide-react'
import { AnimatedGroup } from './components/ui/animated-group'
import { InfiniteSlider } from './components/ui/infinite-slider'
import { MarketingNav } from './components/marketing-nav'

const EASE = [0.22, 1, 0.36, 1] as const

// ─── Network background canvas ────────────────────────────────────────────────

type NType = 'user' | 'doc' | 'folder'
type Node  = { x: number; y: number; vx: number; vy: number; type: NType; r: number; op: number }
type Spark = { fi: number; ti: number; t: number; speed: number }

const PATTERN: NType[] = ['user', 'doc', 'doc', 'folder', 'doc', 'user', 'doc', 'doc', 'folder', 'doc']

function nodeColor(type: NType, alpha: number) {
  if (type === 'user')   return `rgba(0,187,250,${alpha})`
  if (type === 'folder') return `rgba(255,197,74,${alpha})`
  return `rgba(0,187,250,${alpha * 0.55})`
}

function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const N = 26
    const nodes: Node[] = Array.from({ length: N }, (_, i) => {
      const type = PATTERN[i % PATTERN.length]
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        type,
        r: type === 'user' ? 6 : type === 'folder' ? 4.5 : 3.5,
        op: 0.45 + Math.random() * 0.35,
      }
    })

    const sparks: Spark[] = []
    let spawnT = 0
    let rafId: number

    const frame = () => {
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      const DIST = Math.hypot(w, h) * 0.21

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0)  { n.x = 0; n.vx *= -1 }
        if (n.x > w)  { n.x = w; n.vx *= -1 }
        if (n.y < 0)  { n.y = 0; n.vy *= -1 }
        if (n.y > h)  { n.y = h; n.vy *= -1 }
      }

      // Connection lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < DIST) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(0,187,250,${(1 - d / DIST) * 0.18})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Spawn sparks
      if (++spawnT > 38) {
        spawnT = 0
        const fi = Math.floor(Math.random() * nodes.length)
        const nearby = nodes.reduce<number[]>((acc, _, j) => {
          if (j === fi) return acc
          const dx = nodes[fi].x - nodes[j].x, dy = nodes[fi].y - nodes[j].y
          if (Math.sqrt(dx * dx + dy * dy) < DIST) acc.push(j)
          return acc
        }, [])
        if (nearby.length) sparks.push({ fi, ti: nearby[Math.floor(Math.random() * nearby.length)], t: 0, speed: 0.005 + Math.random() * 0.007 })
      }

      // Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.t += s.speed
        if (s.t >= 1) { sparks.splice(i, 1); continue }
        const fn = nodes[s.fi], tn = nodes[s.ti]
        const px = fn.x + (tn.x - fn.x) * s.t
        const py = fn.y + (tn.y - fn.y) * s.t
        const g = ctx.createRadialGradient(px, py, 0, px, py, 7)
        g.addColorStop(0, 'rgba(0,187,250,0.4)')
        g.addColorStop(1, 'rgba(0,187,250,0)')
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,187,250,0.95)'; ctx.fill()
      }

      // Nodes
      for (const n of nodes) {
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5)
        glow.addColorStop(0, nodeColor(n.type, n.op * 0.18))
        glow.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2)
        ctx.fillStyle = glow; ctx.fill()
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = nodeColor(n.type, n.op); ctx.fill()
        if (n.type === 'user') {
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 3.5, 0, Math.PI * 2)
          ctx.strokeStyle = nodeColor(n.type, n.op * 0.3); ctx.lineWidth = 0.8; ctx.stroke()
        }
      }

      rafId = requestAnimationFrame(frame)
    }
    frame()

    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />
}

const fadeUp: Variants = {
  hidden: { y: 24, opacity: 0, filter: 'blur(8px)' },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.6, delay: i * 0.1, ease: EASE },
  }),
}


const sliderItems = [
  'Rich Documents',
  'Real-time Collaboration',
  'Smart Folders',
  'Slash Commands',
  'Drag & Drop',
  'Instant Search',
  'Keyboard First',
  'Status Labels',
  'Pin Anything',
  'Nested Folders',
  'Live Updates',
  'Document Sharing',
  'Block Selection',
  'Tables',
  'To-do Lists',
  'View & Edit Permissions',
  'Code Blocks',
  'Recently Viewed',
]

// ─── Feature mockup components ────────────────────────────────────────────────

function EditorMockup({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="w-full rounded-2xl border border-white/8 overflow-hidden shadow-xl bg-tertiary">
      <div className="flex items-center gap-2 px-3 py-2 bg-tertiary border-b border-white/5">
        <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center"><span className="text-white/20 text-xs">‹</span></div>
        <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center"><span className="text-white/20 text-xs">›</span></div>
        <span className="mx-1 text-white/10 text-xs">|</span>
        <span className="font-ui text-sm text-white/70">Meeting Notes</span>
        <span className="ml-2 font-ui text-xs text-white/25">saved 1m ago</span>
      </div>
      <div className="p-6 space-y-4">
        <p className="font-display text-2xl text-white tracking-wide">Meeting Notes</p>
        <div className="space-y-2">
          <div className="h-2 bg-white/8 rounded-full w-full" />
          <div className="flex items-center">
            <div className="h-2 bg-white/8 rounded-full w-3/4" />
            <motion.div
              animate={{ opacity: isHovered ? [1, 0, 1] : 1 }}
              transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
              className="w-0.5 h-3 bg-white/50 ml-0.5 rounded-full"
            />
          </div>
          <div className="h-2 bg-white/8 rounded-full w-1/2" />
        </div>
        <div className="space-y-2 pt-1">
          {['Real-time sync', 'Block-based editing', 'Slash commands'].map(item => (
            <div key={item} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0" />
              <span className="font-ui text-sm text-white/40">{item}</span>
            </div>
          ))}
        </div>
        <motion.div
          animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          className="w-44 bg-tertiary rounded-xl border border-white/10 shadow-xl overflow-hidden"
        >
          <div className="px-3 py-1.5 border-b border-white/5">
            <span className="font-ui text-xs text-white/25 tracking-widest">INSERT</span>
          </div>
          {[{ label: 'Heading 1', active: true }, { label: 'Bullet List', active: false }, { label: 'Code Block', active: false }].map(item => (
            <div key={item.label} className={`flex items-center gap-2 px-3 py-1.5 font-ui text-sm ${item.active ? 'bg-primary/10 text-primary' : 'text-white/40'}`}>
              <div className="w-3.5 h-3.5 rounded bg-white/10" />
              {item.label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function CollabMockup({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="w-full rounded-2xl border border-white/8 overflow-hidden shadow-xl bg-tertiary">
      <div className="flex items-center gap-2 px-3 py-2 bg-tertiary border-b border-white/5">
        <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center"><span className="text-white/20 text-xs">‹</span></div>
        <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center"><span className="text-white/20 text-xs">›</span></div>
        <span className="mx-1 text-white/10 text-xs">|</span>
        <span className="font-ui text-sm text-white/70 flex-1">Design Brief</span>
        <div className="flex items-center">
          {([['A', 'bg-primary/70'], ['S', 'bg-highlight/70'], ['J', 'bg-green-500/70']] as const).map(([l, c]) => (
            <div key={l} className={`w-6 h-6 rounded-full ${c} flex items-center justify-center font-ui text-xs text-white font-bold border-2 border-secondary -ml-1 first:ml-0`}>{l}</div>
          ))}
        </div>
        <div className="ml-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          <span className="font-ui text-xs text-white/50">Share</span>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <p className="font-display text-2xl text-white tracking-wide">Design Brief</p>
        <div className="space-y-2">
          <div className="h-2 bg-white/8 rounded-full w-full" />
          <div className="relative h-5 flex items-center">
            <div className="h-2 bg-white/8 rounded-full w-4/5" />
            <motion.div
              animate={{ x: isHovered ? [0, 14, 6, 0] : 0 }}
              transition={{ duration: 4, repeat: isHovered ? Infinity : 0, ease: 'easeInOut' }}
              className="absolute left-[42%] flex flex-col items-start"
            >
              <div className="w-0.5 h-4 bg-primary rounded-full" />
              <div className="bg-primary px-1.5 py-0.5 rounded font-ui text-xs text-secondary -mt-0.5 whitespace-nowrap">Alex</div>
            </motion.div>
          </div>
          <div className="h-2 bg-white/8 rounded-full w-3/4" />
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-white/8 rounded-full w-full" />
          <div className="relative h-5 flex items-center">
            <div className="h-2 bg-white/8 rounded-full w-2/3" />
            <motion.div
              animate={{ x: isHovered ? [0, -10, -4, 0] : 0 }}
              transition={{ duration: 3.5, repeat: isHovered ? Infinity : 0, ease: 'easeInOut', delay: 0.8 }}
              className="absolute left-[52%] flex flex-col items-start"
            >
              <div className="w-0.5 h-4 bg-highlight rounded-full" />
              <div className="bg-highlight px-1.5 py-0.5 rounded font-ui text-xs text-secondary -mt-0.5 whitespace-nowrap">Sam</div>
            </motion.div>
          </div>
          <div className="h-2 bg-white/8 rounded-full w-5/6" />
        </div>
      </div>
    </div>
  )
}

function OrgMockup({ isHovered }: { isHovered: boolean }) {
  const items = [
    { type: 'folder', label: 'Design', count: '4 files' },
    { type: 'folder', label: 'Engineering', count: '7 files' },
    { type: 'folder', label: 'Research', count: '2 files' },
    { type: 'doc', label: 'Q1 Roadmap', pinned: true },
    { type: 'doc', label: 'Brief', pinned: false },
    { type: 'doc', label: 'Notes', pinned: false },
  ]
  return (
    <div className="w-full rounded-2xl border border-white/8 overflow-hidden shadow-xl bg-tertiary">
      <div className="flex items-end justify-between px-5 pt-5 pb-3 border-b border-white/5">
        <div>
          <p className="font-display text-3xl text-white">Home</p>
          <p className="font-ui text-xs text-primary/50 mt-0.5">3 folders · 5 documents</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 font-ui text-xs text-white/40">+ Folder</div>
          <div className="px-3 py-1 rounded-lg bg-highlight/20 border border-highlight/20 font-ui text-xs text-highlight">+ Document</div>
        </div>
      </div>
      <div className="p-4 grid grid-cols-3 gap-2">
        {items.map((item, i) => (
          <motion.div
            key={i}
            animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.95 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="bg-tertiary border border-white/8 rounded-lg p-3 flex flex-col gap-2"
          >
            <div className={item.type === 'folder' ? 'text-primary/50' : 'text-primary/30'}>
              {item.type === 'folder' ? <Folder size={16} /> : <FileText size={16} />}
            </div>
            <p className="font-ui text-xs text-white/70 truncate">{item.label}</p>
            <div className="flex items-center justify-between">
              <p className="font-ui text-xs text-white/25">{item.type === 'folder' ? (item as { count: string }).count : '2m ago'}</p>
              {'pinned' in item && item.pinned && (
                <motion.span
                  animate={{ scale: isHovered ? [1, 1.3, 1] : 1 }}
                  transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
                  className="text-highlight text-xs"
                >★</motion.span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const SEARCH_QUERIES = ['Q1 Roadmap', 'Design System', 'Meeting Notes', 'Project Brief']

function SearchMockup({ isHovered }: { isHovered: boolean }) {
  const results = [
    { type: 'doc', label: 'Q1 Roadmap', sub: 'Engineering' },
    { type: 'folder', label: 'Design System', sub: '4 files' },
    { type: 'doc', label: 'Meeting Notes', sub: 'Updated 2m ago' },
    { type: 'doc', label: 'Project Brief', sub: 'Updated 1h ago' },
  ]
  const [typed, setTyped] = useState('')
  const [queryIdx, setQueryIdx] = useState(0)
  const activeIdx = queryIdx % results.length

  useEffect(() => {
    if (!isHovered) { setTyped(''); setQueryIdx(0); return }
    const query = SEARCH_QUERIES[queryIdx % SEARCH_QUERIES.length]
    let charIdx = 0
    let pauseId: ReturnType<typeof setTimeout>
    const typeId = setInterval(() => {
      charIdx++
      setTyped(query.slice(0, charIdx))
      if (charIdx >= query.length) {
        clearInterval(typeId)
        pauseId = setTimeout(() => {
          setTyped('')
          setQueryIdx(q => (q + 1) % SEARCH_QUERIES.length)
        }, 1400)
      }
    }, 75)
    return () => { clearInterval(typeId); clearTimeout(pauseId) }
  }, [isHovered, queryIdx])

  return (
    <div className="flex-1 w-full rounded-2xl border border-white/8 overflow-hidden shadow-2xl bg-secondary relative">
      <div className="p-5 opacity-25 select-none pointer-events-none">
        <p className="font-display text-2xl text-white mb-3">Home</p>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-lg" />)}
        </div>
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-5 px-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="w-full max-w-sm bg-tertiary rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
            <Search size={14} className={`shrink-0 transition-colors duration-200 ${isHovered ? 'text-primary/60' : 'text-white/30'}`} />
            {typed ? (
              <span className="font-ui text-sm text-white/80 flex items-center gap-px flex-1">
                {typed}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="inline-block w-0.5 h-3.5 bg-white/60 ml-px rounded-full"
                />
              </span>
            ) : (
              <span className="font-ui text-sm text-white/30 flex-1">Search documents and folders...</span>
            )}
          </div>
          {results.map((r, i) => (
            <motion.div
              key={i}
              animate={{ backgroundColor: i === activeIdx ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0)' }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <div className={`shrink-0 transition-colors duration-200 ${i === activeIdx ? 'text-primary' : 'text-white/25'}`}>
                {r.type === 'folder' ? <Folder size={13} /> : <FileText size={13} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-ui text-sm truncate transition-colors duration-200 ${i === activeIdx ? 'text-white' : 'text-white/50'}`}>{r.label}</p>
                <p className="font-ui text-xs text-white/25 truncate">{r.sub}</p>
              </div>
              {i === activeIdx && <span className="font-ui text-xs text-white/20 shrink-0">↵</span>}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

const STATUS_CYCLE = [
  { label: 'Draft',       cls: 'text-white/40 bg-white/8 border-white/10' },
  { label: 'In Progress', cls: 'text-primary bg-primary/10 border-primary/20' },
  { label: 'Review',      cls: 'text-highlight bg-highlight/10 border-highlight/20' },
  { label: 'Done',        cls: 'text-green-400 bg-green-400/10 border-green-400/20' },
]

function PinMockup({ isHovered }: { isHovered: boolean }) {
  const items = [
    { label: 'Q1 Roadmap', pinned: true },
    { label: 'Design Brief', pinned: false },
    { label: 'Meeting Notes', pinned: false },
    { label: 'Sprint Review', pinned: false },
  ]
  return (
    <div className="w-full rounded-2xl border border-white/8 overflow-hidden bg-tertiary">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
          <FileText size={13} className="text-white/25 shrink-0" />
          <span className="font-ui text-sm text-white/60 flex-1 truncate">{item.label}</span>
          {item.pinned && (
            <motion.span
              animate={{ scale: isHovered ? [1, 1.4, 1] : 1, opacity: isHovered ? [0.7, 1, 0.7] : 0.7 }}
              transition={{ duration: 2, repeat: isHovered ? Infinity : 0, ease: 'easeInOut' }}
              className="text-highlight text-sm shrink-0"
            >★</motion.span>
          )}
        </div>
      ))}
    </div>
  )
}

function StatusMockup({ isHovered }: { isHovered: boolean }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (!isHovered) { setIdx(0); return }
    const id = setInterval(() => setIdx(i => (i + 1) % STATUS_CYCLE.length), 1800)
    return () => clearInterval(id)
  }, [isHovered])
  return (
    <div className="w-full rounded-2xl border border-white/8 overflow-hidden bg-tertiary p-4 space-y-2">
      {STATUS_CYCLE.map((status, i) => (
        <div key={status.label} className="flex items-center gap-3 bg-secondary rounded-lg px-3 py-2.5 border border-white/5">
          <FileText size={13} className="text-white/25 shrink-0" />
          <span className="font-ui text-xs text-white/50 flex-1 truncate">
            {['Q1 Roadmap', 'Design Brief', 'Sprint Review', 'API Docs'][i]}
          </span>
          <motion.span
            animate={{ opacity: i === idx ? 1 : 0.3 }}
            transition={{ duration: 0.3 }}
            className={`font-ui text-xs px-2 py-0.5 rounded-full border shrink-0 ${status.cls}`}
          >
            {status.label}
          </motion.span>
        </div>
      ))}
    </div>
  )
}

const PERM_CYCLE = ['Can view', 'Can edit'] as const

function ShareMockup({ isHovered }: { isHovered: boolean }) {
  const [permIdx, setPermIdx] = useState(0)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    if (!isHovered) { setPermIdx(0); setShowNew(false); return }
    const permId = setInterval(() => setPermIdx(i => (i + 1) % PERM_CYCLE.length), 1800)
    const newId = setTimeout(() => setShowNew(true), 1200)
    return () => { clearInterval(permId); clearTimeout(newId) }
  }, [isHovered])

  const collaborators = [
    { initial: 'A', color: 'bg-primary/70',     name: 'Alex Chen',    email: 'alex@company.com' },
    { initial: 'S', color: 'bg-highlight/70',   name: 'Sam Rivera',   email: 'sam@company.com' },
    { initial: 'J', color: 'bg-green-500/70',   name: 'Jordan Lee',   email: 'jordan@company.com' },
  ]

  return (
    <div className="w-full rounded-2xl border border-white/8 overflow-hidden bg-tertiary">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="font-ui text-sm text-white/60">Share "Q1 Roadmap"</span>
        <div className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 font-ui text-xs text-primary">Copy link</div>
      </div>
      <div className="p-4 space-y-2.5">
        {collaborators.map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full ${c.color} flex items-center justify-center font-ui text-xs text-white font-bold shrink-0`}>{c.initial}</div>
            <div className="flex-1 min-w-0">
              <p className="font-ui text-sm text-white/70 truncate">{c.name}</p>
              <p className="font-ui text-xs text-white/25 truncate">{c.email}</p>
            </div>
            <motion.div
              animate={i === 1
                ? { backgroundColor: permIdx === 1 ? 'rgba(0,187,250,0.12)' : 'rgba(255,255,255,0.05)', borderColor: permIdx === 1 ? 'rgba(0,187,250,0.25)' : 'rgba(255,255,255,0.08)' }
                : {}}
              transition={{ duration: 0.3 }}
              className="px-2 py-0.5 rounded-md border font-ui text-xs shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <motion.span
                key={i === 1 ? permIdx : 'static'}
                initial={i === 1 ? { opacity: 0, y: -4 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={i === 1 && permIdx === 1 ? 'text-primary' : 'text-white/40'}
              >
                {i === 1 ? PERM_CYCLE[permIdx] : 'Can view'}
              </motion.span>
            </motion.div>
          </div>
        ))}

        <motion.div
          animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ duration: 0.35, delay: showNew ? 0 : 0.5 }}
          className="flex items-center gap-3 pt-1"
        >
          <div className="w-7 h-7 rounded-full bg-white/8 border border-dashed border-white/15 flex items-center justify-center shrink-0">
            <span className="text-white/30 text-sm leading-none">+</span>
          </div>
          <div className="flex-1 bg-secondary rounded-lg px-3 py-1.5 border border-white/8">
            <span className="font-ui text-xs text-white/25">Add by email...</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-highlight/15 border border-highlight/20 font-ui text-xs text-highlight shrink-0">Invite</div>
        </motion.div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  return (
    <div className="min-h-screen bg-secondary text-white flex flex-col">

      <MarketingNav />

      {/* ── Hero ── */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-8 pt-16 pb-24 overflow-hidden min-h-screen">

        {/* Network canvas */}
        <NetworkCanvas />

        {/* Vignette — keeps centre text readable */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 65% 65% at 50% 50%, transparent 20%, rgba(25,25,25,0.75) 100%)' }}
        />

        {/* Subtle bottom glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 110%, rgba(0,187,250,0.07) 0%, transparent 65%)' }}
        />


        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: { staggerChildren: 0.1, delayChildren: 0.2 },
              },
            },
            item: {
              hidden: { y: 20, opacity: 0, filter: 'blur(10px)' },
              visible: {
                y: 0,
                opacity: 1,
                filter: 'blur(0px)',
                transition: { type: 'spring', bounce: 0.3, duration: 1.2 },
              },
            },
          }}
          className="flex flex-col items-center"
        >
          {/* Eyebrow */}
          <p className="font-ui text-sm text-primary tracking-[0.5em] uppercase mb-6">
            Your workspace. Personified.
          </p>

          {/* Title */}
          <h1 className="font-display text-[11rem] leading-none text-white mb-2">
            AEGIS
          </h1>

          {/* Highlight bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.55, duration: 0.45, ease: EASE }}
            className="h-1.5 w-40 bg-highlight origin-left mb-8"
          />

          {/* Subtitle */}
          <p className="font-ui text-xl text-accent/80 max-w-lg leading-relaxed mb-10">
            A bold new way to capture ideas, organize documents,
            and move through your work with intention.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4">
            <>
              <Link
                href="/signup"
                className="relative px-8 py-3 rounded-xl bg-highlight text-secondary font-display text-2xl tracking-widest overflow-hidden group"
              >
                <span className="relative z-10">GET STARTED</span>
                <span className="absolute inset-0 bg-primary translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-white translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-20 tracking-widest">GET STARTED</span>
              </Link>
              <Link
                href="/login"
                className="relative px-8 py-3 rounded-xl border-2 border-white/20 text-white/60 font-display text-2xl tracking-widest overflow-hidden group hover:border-white/50 hover:text-white transition-colors"
              >
                LOG IN
              </Link>
            </>
          </div>
        </AnimatedGroup>
      </section>

      {/* ── Infinite Slider ── */}
      <div className="border-t border-b border-white/5 bg-tertiary py-5 relative overflow-hidden">
        <InfiniteSlider gap={64} duration={30} speedOnHover={60}>
          {sliderItems.map(item => (
            <div key={item} className="flex items-center gap-3 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
              <span className="font-display text-xl tracking-widest text-white/30 uppercase">{item}</span>
            </div>
          ))}
        </InfiniteSlider>
      </div>

      {/* ── Features ── */}
      <section id="features" className="border-t border-white/5 bg-tertiary px-8 py-24">
        <div className="max-w-5xl mx-auto">

          <motion.p
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="font-ui text-sm text-white/50 tracking-[0.4em] uppercase mb-4 text-center"
          >
            Everything you need
          </motion.p>
          <motion.h2
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="font-display text-6xl text-white tracking-widest text-center mb-20"
          >
            BUILT FOR HOW YOU THINK
          </motion.h2>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Editor */}
            <motion.div
              variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="rounded-2xl border border-white/8 hover:border-primary/40 bg-secondary overflow-hidden flex flex-col transition-colors duration-300 md:col-span-2"
              onMouseEnter={() => setHoveredCard(0)} onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="px-5 pt-5 pb-4 flex flex-col gap-1.5">
                <span className="font-ui text-xs text-primary tracking-[0.4em] uppercase">Editor</span>
                <h3 className="font-display text-3xl text-white tracking-widest leading-tight">Write Without Limits</h3>
                <p className="font-ui text-base text-white/50 leading-relaxed">Slash commands, tables, code blocks, to-do lists — every block type you need.</p>
              </div>
              <div className="px-5 pb-5"><EditorMockup isHovered={hoveredCard === 0} /></div>
            </motion.div>

            {/* Collaboration */}
            <motion.div
              variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="rounded-2xl border border-white/8 hover:border-primary/40 bg-secondary overflow-hidden flex flex-col transition-colors duration-300"
              onMouseEnter={() => setHoveredCard(1)} onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="px-5 pt-5 pb-4 flex flex-col gap-1.5">
                <span className="font-ui text-xs text-primary tracking-[0.4em] uppercase">Collaboration</span>
                <h3 className="font-display text-3xl text-white tracking-widest leading-tight">Work Together, In Real Time</h3>
                <p className="font-ui text-base text-white/50 leading-relaxed">See your team cursors live. Share with view or edit permissions in one click.</p>
              </div>
              <div className="px-5 pb-5"><CollabMockup isHovered={hoveredCard === 1} /></div>
            </motion.div>

            {/* Search */}
            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="rounded-2xl border border-white/8 hover:border-primary/40 bg-secondary overflow-hidden flex flex-col transition-colors duration-300"
              onMouseEnter={() => setHoveredCard(2)} onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="px-5 pt-5 pb-4 flex flex-col gap-1.5">
                <span className="font-ui text-xs text-primary tracking-[0.4em] uppercase">Search</span>
                <h3 className="font-display text-3xl text-white tracking-widest leading-tight">Find Anything Instantly</h3>
                <p className="font-ui text-base text-white/50 leading-relaxed">⌘K opens a search palette across all your documents and folders.</p>
              </div>
              <div className="px-5 pb-5"><SearchMockup isHovered={hoveredCard === 2} /></div>
            </motion.div>

            {/* Organization */}
            <motion.div
              variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="rounded-2xl border border-white/8 hover:border-primary/40 bg-secondary overflow-hidden flex flex-col transition-colors duration-300 md:col-span-2"
              onMouseEnter={() => setHoveredCard(3)} onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="px-5 pt-5 pb-4 flex flex-col gap-1.5">
                <span className="font-ui text-xs text-primary tracking-[0.4em] uppercase">Organization</span>
                <h3 className="font-display text-3xl text-white tracking-widest leading-tight">Everything In Its Place</h3>
                <p className="font-ui text-base text-white/50 leading-relaxed">Nested folders, drag-and-drop, and folder previews on hover.</p>
              </div>
              <div className="px-5 pb-5"><OrgMockup isHovered={hoveredCard === 3} /></div>
            </motion.div>

            {/* Pinning */}
            <motion.div
              variants={fadeUp} custom={4} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="rounded-2xl border border-white/8 hover:border-primary/40 bg-secondary overflow-hidden flex flex-col transition-colors duration-300"
              onMouseEnter={() => setHoveredCard(4)} onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="px-5 pt-5 pb-4 flex flex-col gap-1.5">
                <span className="font-ui text-xs text-primary tracking-[0.4em] uppercase">Pinning</span>
                <h3 className="font-display text-3xl text-white tracking-widest leading-tight">Keep What Matters On Top</h3>
              </div>
              <div className="px-5 pb-5"><PinMockup isHovered={hoveredCard === 4} /></div>
            </motion.div>

            {/* Status Labels */}
            <motion.div
              variants={fadeUp} custom={5} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="rounded-2xl border border-white/8 hover:border-primary/40 bg-secondary overflow-hidden flex flex-col transition-colors duration-300"
              onMouseEnter={() => setHoveredCard(5)} onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="px-5 pt-5 pb-4 flex flex-col gap-1.5">
                <span className="font-ui text-xs text-primary tracking-[0.4em] uppercase">Status Labels</span>
                <h3 className="font-display text-3xl text-white tracking-widest leading-tight">Track Every Stage</h3>
              </div>
              <div className="px-5 pb-5"><StatusMockup isHovered={hoveredCard === 5} /></div>
            </motion.div>

            {/* Sharing */}
            <motion.div
              variants={fadeUp} custom={6} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ scale: 1.015 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="rounded-2xl border border-white/8 hover:border-primary/40 bg-secondary overflow-hidden flex flex-col transition-colors duration-300"
              onMouseEnter={() => setHoveredCard(6)} onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="px-5 pt-5 pb-4 flex flex-col gap-1.5">
                <span className="font-ui text-xs text-primary tracking-[0.4em] uppercase">Sharing</span>
                <h3 className="font-display text-3xl text-white tracking-widest leading-tight">Share With Anyone</h3>
                <p className="font-ui text-base text-white/50 leading-relaxed">Invite collaborators with view or edit access. One link, full control.</p>
              </div>
              <div className="px-5 pb-5"><ShareMockup isHovered={hoveredCard === 6} /></div>
            </motion.div>

          </div>


        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 px-8 py-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand + year */}
        <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Image
            src="/aegis-logo-transparent.png"
            alt="AEGIS logo"
            width={48}
            height={48}
          />

          <span className="font-display text-3xl text-white/60 tracking-widest">
            AEGIS
          </span>
        </div>
          <span className="text-white/20">·</span>
          <span className="font-ui text-base text-white/35 tracking-[0.25em] uppercase">2026</span>
        </div>

        {/* Credit + links */}
        <div className="flex items-center gap-5">
          <span className="font-ui text-base text-white/45">Built by Axl Allan Tan</span>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/laxnat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 hover:text-white transition-colors duration-200"
              aria-label="GitHub"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/axl-allan-tan/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 hover:text-white transition-colors duration-200"
              aria-label="LinkedIn"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
