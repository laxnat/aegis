'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { FileText, Folder, Zap } from 'lucide-react'
import { AnimatedGroup } from './components/ui/animated-group'
import { InfiniteSlider } from './components/ui/infinite-slider'
import { ProgressiveBlur } from './components/ui/progressive-blur'
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
  'Smart Folders',
  'Slash Commands',
  'Drag & Drop',
  'Instant Search',
  'Keyboard First',
  'Status Labels',
  'Pin Anything',
  'Nested Folders',
  'Live Updates',
]

export function LandingPage() {
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
        <ProgressiveBlur direction="left" blurIntensity={0.6} className="absolute left-0 top-0 h-full w-24" />
        <ProgressiveBlur direction="right" blurIntensity={0.6} className="absolute right-0 top-0 h-full w-24" />
      </div>

      {/* ── Features ── */}
      <section id="features" className="border-t border-white/5 bg-tertiary px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.p
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="font-ui text-xs text-white/25 tracking-[0.5em] uppercase mb-12 text-center"
          >
            Everything you need
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/5">
            {[
              {
                icon: <FileText size={22} />,
                title: 'Rich Documents',
                body: 'Write with slash commands, headings, lists, and more. Your ideas deserve structure.',
              },
              {
                icon: <Folder size={22} />,
                title: 'Smart Organization',
                body: 'Nest folders, drag-and-drop files, and keep everything exactly where you need it.',
              },
              {
                icon: <Zap size={22} />,
                title: 'Built to Move Fast',
                body: 'Keyboard-first design, instant search, and quick navigation so nothing slows you down.',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-secondary p-8 flex flex-col gap-4"
              >
                <span className="text-primary">{f.icon}</span>
                <h3 className="font-display text-2xl text-white tracking-widest">{f.title}</h3>
                <p className="font-ui text-lg text-white/40 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-8 py-6 flex items-center justify-between">
        <span className="font-display text-xl text-white/20 tracking-widest">AEGIS</span>
        <span className="font-ui text-xs text-white/20 tracking-[0.3em] uppercase">2026</span>
      </footer>

    </div>
  )
}
