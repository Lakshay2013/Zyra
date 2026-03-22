'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfaea] px-4 py-12">
      {/* Container */}
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-headline italic text-[#032416] tracking-tight hover:opacity-80 transition-opacity">
            zyra
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[16px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#f1eedf]">
          <h1 className="text-2xl font-bold font-body text-[#032416] mb-2">Create your account</h1>
          <p className="text-sm font-body text-[#424843] mb-8">Start monitoring your LLM traffic. Free forever on Starter.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-body">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#032416] mb-1.5 font-body">
                  Your name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Laksh"
                  className="w-full px-4 py-3 rounded-xl border border-[#c1c8c2] bg-white text-[#032416] placeholder-[#424843]/60 focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all font-body text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#032416] mb-1.5 font-body">
                  Organization
                </label>
                <input
                  type="text"
                  name="orgName"
                  value={form.orgName}
                  onChange={handleChange}
                  required
                  placeholder="Acme Inc"
                  className="w-full px-4 py-3 rounded-xl border border-[#c1c8c2] bg-white text-[#032416] placeholder-[#424843]/60 focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all font-body text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#032416] mb-1.5 font-body">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-[#c1c8c2] bg-white text-[#032416] placeholder-[#424843]/60 focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all font-body text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#032416] mb-1.5 font-body">
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
                className="w-full px-4 py-3 rounded-xl border border-[#c1c8c2] bg-white text-[#032416] placeholder-[#424843]/60 focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all font-body text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-4 rounded-[12px] font-bold text-white bg-[#1a3a2a] hover:bg-[#032416] transition-colors disabled:opacity-60 font-body text-sm flex items-center justify-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating account...' : 'Create account'}</span>
            </button>
            
            <p className="text-center mt-4 text-xs text-[#424843] font-body">
              By signing up you agree to our Terms of Service
            </p>
          </form>
        </div>

        <p className="text-center mt-8 text-sm text-[#424843] font-body">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#5e51ad] hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}