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

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' })
  
  // OTP State
  const [requiresOtp, setRequiresOtp] = useState(false)
  const [otp, setOtp] = useState('')
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  // Handle standard email registration
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', form)
      if (res.data.requiresOtp) {
        setRequiresOtp(true)
      } else {
        // Fallback for immediate login
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

  // Handle OTP submission
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

  // Handle Google OAuth
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 font-body text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <div className="w-full max-w-[480px]">
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
          
          {/* OTP Input View */}
          {requiresOtp ? (
            <div>
              <h1 className="text-2xl font-bold font-headline text-on-surface mb-2">Check your email</h1>
              <p className="text-sm font-body text-on-surface-variant mb-8">
                We sent a 6-digit verification code to <strong className="text-on-surface">{form.email}</strong>.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {error && (
                  <div className="bg-error-container/20 border border-error/50 text-error rounded-xl px-4 py-3 text-sm font-body">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5 font-body">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] text-2xl px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary transition-all font-body placeholder-outline-variant"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3.5 mt-4 rounded-[12px] font-bold bg-gradient-to-br from-primary-container to-primary text-on-primary-container hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 font-body text-sm flex items-center justify-center space-x-2 shadow-lg shadow-primary/10"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Main Registration View */
            <div>
              <h1 className="text-2xl font-bold font-headline text-on-surface mb-2">Create your account</h1>
              <p className="text-sm font-body text-on-surface-variant mb-8 font-medium">Start monitoring your LLM traffic. Free forever on Builder.</p>

              {error && (
                <div className="bg-error-container/20 border border-error/50 text-error rounded-xl px-4 py-3 text-sm font-body mb-5">
                  {error}
                </div>
              )}

              <div className="mb-6 flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign in was cancelled or failed.')}
                  useOneTap
                  theme="outline"
                  shape="rectangular"
                  size="large"
                  text="signup_with"
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5 font-body">Your name</label>
                    <input
                      type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Jane Doe"
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1.5 font-body">Organization</label>
                    <input
                      type="text" name="orgName" value={form.orgName} onChange={handleChange} required placeholder="Acme Inc"
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5 font-body">Email</label>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5 font-body">Password</label>
                  <input
                    type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} placeholder="Min 8 characters"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body text-sm"
                  />
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 mt-2 rounded-[12px] font-bold bg-gradient-to-br from-primary-container to-primary text-on-primary-container hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 font-body text-sm flex items-center justify-center space-x-2 shadow-lg shadow-primary/10"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Sending code...' : 'Continue with email'}</span>
                </button>
              </form>
            </div>
          )}
        </motion.div>

        <p className="text-center mt-8 text-sm text-on-surface-variant font-body">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}