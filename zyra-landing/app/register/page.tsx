'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { setAuth } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', form)
      const { token, user, org } = res.data
      setAuth(token, user, org)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4 relative overflow-hidden py-12">
      {/* Background decorations */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

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
            Start monitoring your LLM traffic. Free forever on Starter.
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-300 mb-2 font-body">
                  Your name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Laksh"
                  className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-900/50 text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:border-stone-600 transition-all font-body text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-300 mb-2 font-body">
                  Organization
                </label>
                <input
                  type="text"
                  name="orgName"
                  value={form.orgName}
                  onChange={handleChange}
                  required
                  placeholder="Acme Inc"
                  className="w-full px-4 py-3 rounded-xl border border-stone-800 bg-stone-900/50 text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:border-stone-600 transition-all font-body text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-300 mb-2 font-body">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
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
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3.5 rounded-xl border border-stone-800 bg-stone-900/50 text-white placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:border-stone-600 transition-all font-body text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all disabled:opacity-50 font-body text-sm flex items-center justify-center space-x-2 shadow-lg shadow-black/20"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating account...' : 'Create account'}</span>
            </button>

            <p className="text-center text-xs text-stone-500 font-body mt-4">
              By signing up you agree to our Terms of Service
            </p>
          </form>
        </div>

        <p className="text-center mt-8 text-sm text-stone-500 font-body">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-stone-300 hover:text-white transition-colors hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}