'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Supabase puts the session in the URL hash on redirect — exchange it
  useEffect(() => {
    supabase.auth.getSession()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="relative min-h-screen bg-secondary overflow-hidden flex items-center justify-center">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="relative z-10 w-full max-w-sm bg-tertiary border border-primary/20 px-10 py-10 rounded-2xl"
      >
        <h1 className="font-display text-4xl text-white tracking-widest text-center mb-8">
          NEW PASSWORD
        </h1>

        {done ? (
          <div className="border border-primary/30 bg-primary/10 text-primary px-4 py-3 font-ui text-sm tracking-wide rounded-xl text-center">
            Password updated. Redirecting to login…
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            {error && (
              <div className="border border-red-500/50 bg-red-500/10 text-red-400 px-4 py-3 font-ui text-sm tracking-wide rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-ui text-xs text-primary tracking-[0.2em] uppercase">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-tertiary border border-primary/30 text-white font-ui px-4 py-3 focus:outline-none focus:border-primary transition-colors rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-ui text-xs text-primary tracking-[0.2em] uppercase">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full bg-tertiary border border-primary/30 text-white font-ui px-4 py-3 focus:outline-none focus:border-primary transition-colors rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-display text-xl text-secondary bg-highlight hover:bg-primary hover:text-white py-3 tracking-widest transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {loading ? 'SAVING...' : 'SET PASSWORD'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
