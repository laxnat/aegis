'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const supabase = createClient()

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setResetSent(true)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Strip any data URLs from user_metadata before redirecting.
    // Data URLs stored as avatar_url bloat the JWT cookie and cause 431 errors.
    const { data: { user } } = await supabase.auth.getUser()
    const meta = user?.user_metadata ?? {}
    const dirtyKeys = Object.keys(meta).filter(k => typeof meta[k] === 'string' && (meta[k] as string).startsWith('data:'))
    if (dirtyKeys.length > 0) {
      const nulled = Object.fromEntries(dirtyKeys.map(k => [k, null]))
      await supabase.auth.updateUser({ data: nulled })
      await supabase.auth.refreshSession()
    }

    window.location.href = '/documents'
  }

  return (
    <div className="relative min-h-screen bg-secondary overflow-hidden flex items-center justify-center">

      {/* Diagonal slashes */}
      {[
        { top: '8%',  left: '-5%',  w: '40%', h: '3px', bg: 'bg-primary',   delay: 0 },
        { top: '12%', left: '-5%',  w: '28%', h: '8px', bg: 'bg-highlight', delay: 1 },
        { top: '17%', left: '-5%',  w: '18%', h: '3px', bg: 'bg-primary',   delay: 2 },
        { top: '82%', right: '-5%', w: '40%', h: '3px', bg: 'bg-accent',    delay: 3 },
        { top: '87%', right: '-5%', w: '28%', h: '8px', bg: 'bg-highlight', delay: 4 },
        { top: '91%', right: '-5%', w: '18%', h: '3px', bg: 'bg-primary',   delay: 5 },
      ].map((s, i) => (
        <motion.div
          key={i}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, delay: s.delay * 0.08, ease: EASE }}
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            right: s.right,
            width: s.w,
            height: s.h,
            transform: 'rotate(-6deg)',
            transformOrigin: s.left ? 'left center' : 'right center',
          }}
          className={s.bg}
        />
      ))}

      {/* Corner accents */}
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.3, ease: EASE }} className="absolute top-6 left-6 w-4 h-4 bg-highlight" />
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.3, ease: EASE }} className="absolute bottom-6 right-6 w-4 h-4 bg-primary" />
      <motion.div initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.2, duration: 0.6, ease: EASE }} className="absolute top-0 left-16 w-0.5 h-32 bg-primary origin-top" />
      <motion.div initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.25, duration: 0.6, ease: EASE }} className="absolute bottom-0 right-16 w-0.5 h-32 bg-highlight origin-bottom" />

      {/* Form card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.55, ease: EASE }}
        className="relative z-10 w-full max-w-sm bg-tertiary border border-primary/20 px-10 py-10 rounded-2xl"
      >
        {/* Logo */}
        <Link href="/" className="block font-display text-5xl text-white hover:text-primary transition-colors text-center mb-2">
          aegis
        </Link>

        {/* Underline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASE }}
          className="h-1.5 w-16 bg-highlight origin-left mx-auto mb-8"
        />

        <h1 className="font-display text-4xl text-white tracking-widest text-center mb-8">
          {forgotMode ? 'RESET' : 'LOG IN'}
        </h1>

        {forgotMode ? (
          resetSent ? (
            <div className="space-y-5">
              <div className="border border-primary/30 bg-primary/10 text-primary px-4 py-3 font-ui text-sm tracking-wide rounded-xl text-center">
                Check your email for a password reset link.
              </div>
              <button
                onClick={() => { setForgotMode(false); setResetSent(false) }}
                className="w-full font-display text-xl text-secondary bg-highlight hover:bg-primary hover:text-white py-3 tracking-widest transition-colors duration-200 rounded-xl"
              >
                BACK TO LOGIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              {error && (
                <div className="border border-red-500/50 bg-red-500/10 text-red-400 px-4 py-3 font-ui text-sm tracking-wide rounded-xl">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <label htmlFor="email" className="font-ui text-xs text-primary tracking-[0.2em] uppercase">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-tertiary border border-primary/30 text-white font-ui px-4 py-3 focus:outline-none focus:border-primary transition-colors rounded-xl"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full font-display text-xl text-secondary bg-highlight hover:bg-primary hover:text-white py-3 tracking-widest transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
              >
                {loading ? 'SENDING...' : 'SEND RESET LINK'}
              </button>
              <button
                type="button"
                onClick={() => { setForgotMode(false); setError(null) }}
                className="w-full font-ui text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Back to login
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="border border-red-500/50 bg-red-500/10 text-red-400 px-4 py-3 font-ui text-sm tracking-wide rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="email" className="font-ui text-xs text-primary tracking-[0.2em] uppercase">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-tertiary border border-primary/30 text-white font-ui px-4 py-3 focus:outline-none focus:border-primary transition-colors rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="font-ui text-xs text-primary tracking-[0.2em] uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setError(null) }}
                  className="font-ui text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-tertiary border border-primary/30 text-white font-ui px-4 py-3 focus:outline-none focus:border-primary transition-colors rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-display text-xl text-secondary bg-highlight hover:bg-primary hover:text-white py-3 tracking-widest transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 rounded-xl"
            >
              {loading ? 'LOADING...' : 'LOG IN'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center font-ui text-sm text-accent/60">
          No account?{' '}
          <Link href="/signup" className="text-primary hover:text-highlight transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
