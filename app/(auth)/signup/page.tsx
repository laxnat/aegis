'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { NetworkCanvas } from '@/app/components/network-canvas'
import { MarketingNav } from '@/app/components/marketing-nav'

const EASE = [0.22, 1, 0.36, 1] as const

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/documents')
    }
  }

  return (
    <div className="relative min-h-screen bg-secondary overflow-hidden flex items-center justify-center px-4">

      <MarketingNav />
      <NetworkCanvas />

      {/* Form card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.55, ease: EASE }}
        className="relative z-10 w-full max-w-sm bg-tertiary border border-primary/20 px-6 py-8 sm:px-10 sm:py-10 rounded-2xl"
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
          SIGN UP
        </h1>

        <form onSubmit={handleSignUp} className="space-y-5">
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
            <label htmlFor="password" className="font-ui text-xs text-primary tracking-[0.2em] uppercase">
              Password
            </label>
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
            {loading ? 'LOADING...' : 'SIGN UP'}
          </button>
        </form>

        <p className="mt-6 text-center font-ui text-sm text-accent/60">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-highlight transition-colors">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
