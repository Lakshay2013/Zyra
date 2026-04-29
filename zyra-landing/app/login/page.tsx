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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle traditional email/password login
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

  // Handle Google OAuth successful token reception
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/google', { idToken: credentialResponse.credential })
      const { token, user, org } = res.data
      setAuth(token, user, org)
      router.push('/dashboard')
    } catch (err: any) {
      setError('Google authentication failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 font-body text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8 flex justify-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo className="text-[40px] text-primary" />
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-surface-container-low rounded-[16px] p-8 md:p-10 shadow-2xl border border-outline-variant/20"
        >
          <h1 className="text-2xl font-bold font-headline text-on-surface mb-2">Welcome back</h1>
          <p className="text-sm font-body text-on-surface-variant mb-8">Sign in to your Zyra dashboard.</p>

          {error && (
            <div className="bg-error-container/20 border border-error/50 text-error rounded-xl px-4 py-3 text-sm font-body mb-5">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <div className="mb-6 flex justify-center w-full">
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
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-container-low text-outline font-body font-medium">or continue with email</span>
            </div>
          </div>

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5 font-body">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5 font-body">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body text-sm"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 mt-2 rounded-[12px] font-bold bg-gradient-to-br from-primary-container to-primary text-on-primary-container hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 font-body text-sm flex items-center justify-center space-x-2 shadow-lg shadow-primary/10"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>
        </motion.div>

        <p className="text-center mt-8 text-sm text-on-surface-variant font-body">
          Don't have an account?{' '}
          <Link href="/register" className="font-bold text-primary hover:underline transition-colors">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}