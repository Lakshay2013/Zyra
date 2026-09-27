'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import api from '@/lib/api'
import { setAuth } from '@/lib/auth'
import { Logo } from '@/components/ui/logo'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/google', { idToken: credentialResponse.credential })
      const { token, user, org } = res.data
      setAuth(token, user, org)
      router.push('/dashboard')
    } catch {
      setError('Google authentication failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="text-accent transition-opacity hover:opacity-80">
            <Logo className="text-[32px]" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-8 shadow-[var(--shadow-sm)] md:p-10"
        >
          <h1 className="type-h1 text-text">Welcome back</h1>
          <p className="mb-8 mt-2 text-[14px] text-text-secondary">Sign in to your Zyra dashboard.</p>

          {error && (
            <div className="mb-5 rounded-[var(--radius-sm)] border border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)] px-4 py-3 text-[13px] text-danger">
              {error}
            </div>
          )}

          <div className="mb-6 flex w-full justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign in was cancelled or failed.')}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center">
              <span className="bg-bg-elevated px-2 text-[13px] font-medium text-text-tertiary">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </motion.div>

        <p className="mt-8 text-center text-[14px] text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-accent hover:underline">Create one free</Link>
        </p>
      </div>
    </div>
  )
}
