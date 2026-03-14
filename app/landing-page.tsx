'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { FileText, Folder, Zap } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

const fadeUp: Variants = {
  hidden: { y: 24, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.55, delay: i * 0.08, ease: EASE },
  }),
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.4, delay: i * 0.08, ease: EASE },
  }),
}

type Props = {
  user: { email: string; avatarUrl: string | null } | null
}

export function LandingPage({ user }: Props) {
  return (
    <div className="min-h-screen bg-secondary text-white flex flex-col">

      {/* ── Nav ── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 h-16 bg-secondary/80 backdrop-blur-md border-b border-white/5"
      >
        <span className="font-display text-3xl text-white tracking-widest">AEGIS</span>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/documents"
              className="flex items-center gap-2.5 px-4 py-1.5 bg-highlight text-secondary font-display text-lg tracking-widest hover:bg-primary hover:text-white transition-colors"
            >
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                : <span className="w-5 h-5 rounded-full bg-secondary/30 flex items-center justify-center font-ui text-xs shrink-0">{user.email[0].toUpperCase()}</span>
              }
              <span className="font-ui text-base normal-case tracking-normal">{user.email}</span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="font-ui text-lg text-white/50 hover:text-white transition-colors px-2">
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-1.5 bg-highlight text-secondary font-display text-lg tracking-widest hover:bg-primary hover:text-white transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-8 pt-16 pb-24 overflow-hidden min-h-screen">

        {/* Diagonal accent lines */}
        {[
          { top: '14%', left: '-4%',  w: '42%', h: '3px',  bg: 'bg-primary',   rot: '-5deg', delay: 0.6 },
          { top: '18%', left: '-4%',  w: '28%', h: '7px',  bg: 'bg-highlight', rot: '-5deg', delay: 0.7 },
          { top: '78%', right: '-4%', w: '38%', h: '3px',  bg: 'bg-accent',    rot: '-5deg', delay: 0.8 },
          { top: '83%', right: '-4%', w: '24%', h: '7px',  bg: 'bg-highlight', rot: '-5deg', delay: 0.9 },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: s.delay, ease: EASE }}
            style={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              right: s.right,
              width: s.w,
              height: s.h,
              transform: `rotate(${s.rot})`,
              transformOrigin: s.left ? 'left center' : 'right center',
            }}
            className={s.bg}
          />
        ))}

        {/* Corner dots */}
        <motion.div variants={fadeIn} custom={2} initial="hidden" animate="visible"
          className="absolute top-24 left-8 w-3 h-3 bg-highlight" />
        <motion.div variants={fadeIn} custom={3} initial="hidden" animate="visible"
          className="absolute bottom-10 right-8 w-3 h-3 bg-primary" />

        {/* Eyebrow */}
        <motion.p
          variants={fadeUp} custom={1} initial="hidden" animate="visible"
          className="font-ui text-sm text-primary tracking-[0.5em] uppercase mb-6"
        >
          Your workspace. Personified.
        </motion.p>

        {/* Title */}
        <motion.h1
          variants={fadeUp} custom={2} initial="hidden" animate="visible"
          className="font-display text-[11rem] leading-none text-white mb-2"
        >
          AEGIS
        </motion.h1>

        {/* Highlight bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.45, ease: EASE }}
          className="h-1.5 w-40 bg-highlight origin-left mb-8"
        />

        {/* Subtitle */}
        <motion.p
          variants={fadeUp} custom={3} initial="hidden" animate="visible"
          className="font-ui text-xl text-accent/80 max-w-lg leading-relaxed mb-10"
        >
          A bold new way to capture ideas, organize documents,
          and move through your work with intention.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp} custom={4} initial="hidden" animate="visible"
          className="flex items-center gap-4"
        >
          {user ? (
            <Link
              href="/documents"
              className="relative flex items-center gap-3 px-8 py-3 bg-highlight text-secondary font-display text-2xl tracking-widest overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-3">
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                  : <span className="w-6 h-6 rounded-full bg-secondary/30 flex items-center justify-center font-ui text-sm shrink-0">{user.email[0].toUpperCase()}</span>
                }
                <span className="font-ui text-base normal-case tracking-normal">{user.email}</span>
              </span>
              <span className="absolute inset-0 bg-primary translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              <span className="absolute inset-0 flex items-center justify-center gap-3 translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-20">
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                  : <span className="w-6 h-6 rounded-full bg-highlight/30 flex items-center justify-center font-ui text-sm text-white shrink-0">{user.email[0].toUpperCase()}</span>
                }
                <span className="font-ui text-base normal-case tracking-normal text-white">{user.email}</span>
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="relative px-8 py-3 bg-highlight text-secondary font-display text-2xl tracking-widest overflow-hidden group"
              >
                <span className="relative z-10">GET STARTED</span>
                <span className="absolute inset-0 bg-primary translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-white translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-20 tracking-widest">GET STARTED</span>
              </Link>
              <Link
                href="/login"
                className="relative px-8 py-3 border-2 border-white/20 text-white/60 font-display text-2xl tracking-widest overflow-hidden group hover:border-white/50 hover:text-white transition-colors"
              >
                LOG IN
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-white/5 bg-tertiary px-8 py-20">
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
