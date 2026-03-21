'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-headline italic font-bold text-primary">
            zyra
          </Link>
          <p className="mt-2 text-sm text-on-surface-variant font-body">
            Create your account — free forever on the starter plan
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5 font-body">
                  Your name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Laksh"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-primary placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all font-body text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5 font-body">
                  Organization
                </label>
                <input
                  type="text"
                  name="orgName"
                  value={form.orgName}
                  onChange={handleChange}
                  required
                  placeholder="Acme Inc"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-primary placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all font-body text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5 font-body">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
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
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface-container/30 text-primary placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all font-body text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-primary-container hover:bg-primary transition-all disabled:opacity-60 font-body text-sm cursor-pointer"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-center text-xs text-on-surface-variant font-body">
              By signing up you agree to our Terms of Service
            </p>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-on-surface-variant font-body">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-secondary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}