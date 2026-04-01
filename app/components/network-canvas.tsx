'use client'

import { useEffect, useRef } from 'react'

type NType = 'user' | 'doc' | 'folder'
type Node  = { x: number; y: number; vx: number; vy: number; type: NType; r: number; op: number }
type Spark = { fi: number; ti: number; t: number; speed: number }

const PATTERN: NType[] = ['user', 'doc', 'doc', 'folder', 'doc', 'user', 'doc', 'doc', 'folder', 'doc']

function nodeColor(type: NType, alpha: number) {
  if (type === 'user')   return `rgba(0,187,250,${alpha})`
  if (type === 'folder') return `rgba(255,197,74,${alpha})`
  return `rgba(0,187,250,${alpha * 0.55})`
}

export function NetworkCanvas() {
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
