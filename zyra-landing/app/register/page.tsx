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

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' })
  const [requiresOtp, setRequiresOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', form)
      if (res.data.requiresOtp) {
        setRequiresOtp(true)
      } else {
        const { token, user, org } = res.data
        setAuth(token, user, org)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/verify-otp', { email: form.email, otp })
      const { token, user, org } = res.data
      setAuth(token, user, org)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.')
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-[460px]">
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
          {requiresOtp ? (
            <div>
              <h1 className="type-h1 text-text">Check your email</h1>
              <p className="mb-8 mt-2 text-[14px] text-text-secondary">
                We sent a 6-digit verification code to <strong className="text-text">{form.email}</strong>.
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {error && (
                  <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)] px-4 py-3 text-[13px] text-danger">
                    {error}
                  </div>
                )}
                <div>
                  <Label>Verification code</Label>
                  <Input
                    type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} placeholder="123456"
                    className="text-center text-2xl tracking-[0.5em]"
                  />
                </div>
                <Button type="submit" disabled={loading || otp.length !== 6} size="lg" className="mt-1 w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Verifying…' : 'Verify email'}
                </Button>
              </form>
            </div>
          ) : (
            <div>
              <h1 className="type-h1 text-text">Create your account</h1>
              <p className="mb-8 mt-2 text-[14px] font-medium text-text-secondary">Start monitoring your LLM traffic. Free forever on Builder.</p>

              {error && (
                <div className="mb-5 rounded-[var(--radius-sm)] border border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)] px-4 py-3 text-[13px] text-danger">
                  {error}
                </div>
              )}

              <div className="mb-6 flex w-full justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign in was cancelled or failed.')}
                  useOneTap theme="outline" shape="rectangular" size="large" text="signup_with" width="100%"
                />
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-bg-elevated px-2 text-[13px] font-medium text-text-tertiary">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your name</Label>
                    <Input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Jane Doe" />
                  </div>
                  <div>
                    <Label>Organization</Label>
                    <Input type="text" name="orgName" value={form.orgName} onChange={handleChange} required placeholder="Acme Inc" />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@company.com" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} placeholder="Min 8 characters" />
                </div>
                <Button type="submit" disabled={loading} size="lg" className="mt-1 w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Sending code…' : 'Continue with email'}
                </Button>
              </form>
            </div>
          )}
        </motion.div>

        <p className="mt-8 text-center text-[14px] text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
