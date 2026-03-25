'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import api from '@/lib/api'
import { setAuth } from '@/lib/auth'

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfaea] px-4 py-12">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-headline italic text-[#032416] tracking-tight hover:opacity-80 transition-opacity">
            zyra
          </Link>
        </div>

        <div className="bg-white rounded-[16px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#f1eedf]">
          
          {/* OTP Input View */}
          {requiresOtp ? (
            <div>
              <h1 className="text-2xl font-bold font-body text-[#032416] mb-2">Check your email</h1>
              <p className="text-sm font-body text-[#424843] mb-8">
                We sent a 6-digit verification code to <strong>{form.email}</strong>.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-body">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-[#032416] mb-1.5 font-body">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] text-2xl px-4 py-3 rounded-xl border border-[#c1c8c2] bg-[#fdfaea] text-[#032416] focus:outline-none focus:border-[#5e51ad] transition-all font-body"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3.5 mt-4 rounded-[12px] font-bold text-white bg-[#1a3a2a] hover:bg-[#032416] transition-colors disabled:opacity-60 font-body text-sm flex items-center justify-center space-x-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Main Registration View */
            <div>
              <h1 className="text-2xl font-bold font-body text-[#032416] mb-2">Create your account</h1>
              <p className="text-sm font-body text-[#424843] mb-8">Start monitoring your LLM traffic. Free forever on Starter.</p>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-body mb-5">
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
                  <div className="w-full border-t border-[#f1eedf]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-[#8b918d] font-body bg-white">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#032416] mb-1.5 font-body">Your name</label>
                    <input
                      type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Laksh"
                      className="w-full px-4 py-3 rounded-xl border border-[#c1c8c2] bg-white text-[#032416] placeholder-[#c1c8c2] focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all font-body text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#032416] mb-1.5 font-body">Organization</label>
                    <input
                      type="text" name="orgName" value={form.orgName} onChange={handleChange} required placeholder="Acme Inc"
                      className="w-full px-4 py-3 rounded-xl border border-[#c1c8c2] bg-white text-[#032416] placeholder-[#c1c8c2] focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all font-body text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#032416] mb-1.5 font-body">Email</label>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl border border-[#c1c8c2] bg-white text-[#032416] placeholder-[#c1c8c2] focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all font-body text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#032416] mb-1.5 font-body">Password</label>
                  <input
                    type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="Min 6 characters"
                    className="w-full px-4 py-3 rounded-xl border border-[#c1c8c2] bg-white text-[#032416] placeholder-[#c1c8c2] focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all font-body text-sm"
                  />
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 mt-2 rounded-[12px] font-bold text-white bg-[#1a3a2a] hover:bg-[#032416] transition-colors disabled:opacity-60 font-body text-sm flex items-center justify-center space-x-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Sending code...' : 'Continue with email'}</span>
                </button>
              </form>
            </div>
          )}
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