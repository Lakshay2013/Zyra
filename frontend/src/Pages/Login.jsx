import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { setAuth } from '../lib/auth'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      setAuth(data.token, data.user, data.org)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>AI <span>Shield</span></h1>
        <p>Sign in to your monitoring dashboard</p>

        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" name="email" type="email"
            placeholder="you@company.com" value={form.email} onChange={handle} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" name="password" type="password"
            placeholder="••••••••" value={form.password} onChange={handle}
            onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>

        <button className="btn btn-primary" style={{width:'100%', marginTop:'8px', padding:'11px'}}
          onClick={submit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in →'}
        </button>

        <div className="auth-footer">
          No account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  )
}