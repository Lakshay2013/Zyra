'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-headline italic font-bold text-primary">
            zyra
          </Link>
          <p className="mt-2 text-sm text-on-surface-variant font-body">
            Sign in to your dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-outline-variant/20">
          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-body">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5 font-body">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-primary placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all font-body text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5 font-body">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-primary placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all font-body text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-primary-container hover:bg-primary transition-all disabled:opacity-60 font-body text-sm cursor-pointer"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-on-surface-variant font-body">
          No account?{' '}
          <Link href="/register" className="font-bold text-secondary hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}