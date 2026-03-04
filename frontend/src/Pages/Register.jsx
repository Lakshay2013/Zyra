import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { setAuth } from '../lib/auth'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/register', form)
      setAuth(data.token, data.user, data.org)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>AI <span>Shield</span></h1>
        <p>Create your organization and start monitoring</p>

        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label className="form-label">Your Name</label>
          <input className="form-input" name="name" placeholder="John Doe"
            value={form.name} onChange={handle} />
        </div>
        <div className="form-group">
          <label className="form-label">Organization Name</label>
          <input className="form-input" name="orgName" placeholder="Acme AI"
            value={form.orgName} onChange={handle} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" name="email" type="email" placeholder="you@company.com"
            value={form.email} onChange={handle} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" name="password" type="password" placeholder="••••••••"
            value={form.password} onChange={handle} />
        </div>

        <button className="btn btn-primary" style={{width:'100%', marginTop:'8px', padding:'11px'}}
          onClick={submit} disabled={loading}>
          {loading ? 'Creating...' : 'Create account →'}
        </button>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}