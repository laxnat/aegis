'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="fixed top-0 inset-x-0 z-50 px-4 pt-3"
    >
      <nav
        className={cn(
          'mx-auto transition-all duration-300',
          scrolled
            ? 'max-w-3xl bg-secondary/80 backdrop-blur-lg border border-white/8 rounded-2xl px-5 py-3'
            : 'max-w-5xl px-4 py-3'
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="font-display text-3xl text-white tracking-widest hover:text-primary transition-colors">
            AEGIS
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/#features" className="font-ui text-lg text-white/40 hover:text-white transition-colors">Features</a>
            <Link href="/changelog" className="font-ui text-lg text-white/40 hover:text-white transition-colors">Changelog</Link>
            <div className="w-px h-4 bg-white/10" />
            <Link href="/login" className="font-ui text-lg text-white/50 hover:text-white transition-colors px-2">
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-1.5 rounded-lg bg-highlight text-secondary font-display text-lg tracking-widest hover:bg-primary hover:text-white transition-colors"
            >
              Get started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 text-white/50 hover:text-white transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pt-4 pb-2 flex flex-col gap-3 border-t border-white/8 mt-3">
            <a href="/#features" onClick={() => setMenuOpen(false)} className="font-ui text-lg text-white/50 hover:text-white px-1">Features</a>
            <Link href="/changelog" onClick={() => setMenuOpen(false)} className="font-ui text-lg text-white/50 hover:text-white px-1">Changelog</Link>
            <div className="border-t border-white/8" />
            <Link href="/login" onClick={() => setMenuOpen(false)} className="font-ui text-lg text-white/60 hover:text-white px-1">Log in</Link>
            <Link href="/signup" onClick={() => setMenuOpen(false)} className="px-5 py-2 rounded-lg bg-highlight text-secondary font-display text-lg tracking-widest text-center">Get started</Link>
          </div>
        )}
      </nav>
    </motion.header>
  )
}
