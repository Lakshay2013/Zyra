'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { setAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { email, password })
      const { token, user, org } = res.data
      setAuth(token, user, org)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="inline-flex items-center space-x-2 text-stone-400 hover:text-white transition-colors mb-8 group text-sm font-medium">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Logo */}
        <div className="mb-10">
          <Link href="/" className="text-4xl font-headline italic font-bold text-white tracking-wider">
            zyra
          </Link>
          <p className="mt-3 text-stone-400 font-body">
            Welcome back. Sign in to your dashboard.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0A0A0A]/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-stone-800/60">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm font-body"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-2 font-body">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3.5 rounded-xl border border-stone-800 bg-stone-900/50 text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:border-stone-600 transition-all font-body text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-2 font-body">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-xl border border-stone-800 bg-stone-900/50 text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:border-stone-600 transition-all font-body text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all disabled:opacity-50 font-body text-sm flex items-center justify-center space-x-2 shadow-lg shadow-black/20"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-sm text-stone-500 font-body">
          No account?{' '}
          <Link href="/register" className="font-bold text-stone-300 hover:text-white transition-colors hover:underline">
            Create one free
          </Link>
        </p>
      </motion.div>
    </div>
  )
}