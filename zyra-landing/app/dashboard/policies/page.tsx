'use client'

import { useState, useEffect } from "react"
import api from "@/lib/api"
import toast from "react-hot-toast"
import Link from "next/link"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [orgData, setOrgData] = useState<any>(null)
  const [profile, setProfile] = useState({ displayName: '', username: '', email: '', bio: '' })
  const [prefs, setPrefs] = useState({ autoDeployLogs: true, telemetryMode: false })
  const [loading, setLoading] = useState(true)

  // Team state
  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  // Billing state
  const [billing, setBilling] = useState<any>(null)
  const [billingLoading, setBillingLoading] = useState(false)

  // Security state
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await api.get('/api/org/settings')
        setOrgData(res.data)
        setProfile({
          displayName: res.data.name || '',
          username: res.data.slug || '',
          email: res.data.email || '',
          bio: res.data.bio || '',
        })
      } catch (err) {
        console.error('Failed to load settings', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrg()
  }, [])

  const handleSaveProfile = async () => {
    try {
      await toast.promise(
        api.put('/api/org/settings', {
          displayName: profile.displayName,
          email: profile.email,
          bio: profile.bio,
        }),
        { loading: 'Saving...', success: 'Profile updated!', error: 'Failed to save' }
      )
    } catch (err) {
      console.error('Save error:', err)
    }
  }

  const loadMembers = async () => {
    if (membersLoading) return
    setMembersLoading(true)
    try {
      const res = await api.get('/api/org/members')
      setMembers(res.data.members || [])
    } catch (err) {
      console.error('Failed to load members', err)
    } finally {
      setMembersLoading(false)
    }
  }

  const loadBilling = async () => {
    if (billingLoading) return
    setBillingLoading(true)
    try {
      const res = await api.get('/api/org/billing')
      setBilling(res.data.billing || {})
    } catch (err) {
      console.error('Failed to load billing', err)
    } finally {
      setBillingLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'team' && members.length === 0) loadMembers()
    if (tab === 'billing' && !billing) loadBilling()
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'security', label: 'Security', icon: 'shield' },
    { id: 'team', label: 'Team', icon: 'group' },
    { id: 'billing', label: 'Billing', icon: 'payments' },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#131314', border: '1px solid rgba(83,67,65,0.1)', outline: 'none',
    color: '#e5e2e3', fontSize: 14, padding: '12px 16px', borderRadius: 8, fontWeight: 500,
  }

  const cardStyle: React.CSSProperties = {
    background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)',
  }

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="pb-6" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
        <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#e5e2e3', lineHeight: 1 }}>
          CONFIGURATION
        </h1>
        <div className="mt-3">
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#ffa69e',
            background: 'rgba(255,166,158,0.1)', padding: '4px 12px', borderRadius: 6,
            border: '1px solid rgba(255,166,158,0.2)'
          }}>
            SYS_UID: {orgData?._id?.slice(0, 12) || 'LOADING...'}
          </span>
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div className="grid grid-cols-12 gap-8 mt-8">

        {/* ── LEFT: Section Nav ── */}
        <div className="col-span-3">
          <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Section_Nav</span>
          <div className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                style={{
                  borderRadius: 8,
                  background: activeTab === tab.id ? '#ffa69e' : 'transparent',
                  color: activeTab === tab.id ? '#3b0908' : '#71717a',
                  fontWeight: activeTab === tab.id ? 700 : 600,
                  fontSize: 13,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Content ── */}
        <div className="col-span-9">

          {/* ═══════════ PROFILE TAB ═══════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e2e3' }}>Public Identity</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>Configure how you appear across the infrastructure.</p>
              </div>

              {/* Avatar + Display Name */}
              <div className="flex items-center gap-6 p-6" style={cardStyle}>
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0" style={{ background: '#131314', border: '1px solid rgba(83,67,65,0.1)' }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#534341' }}>person</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Display Name</label>
                  <input
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    style={{ ...inputStyle, border: 'none' }}
                  />
                </div>
              </div>

              {/* Username + Email */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Username</label>
                  <div className="flex items-center gap-2" style={{ ...cardStyle, padding: '12px 16px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#534341' }}>alternate_email</span>
                    <input
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e5e2e3', fontSize: 14, flex: 1 }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Email Address</label>
                  <input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Bio / System_Manifesto</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Enter a brief architectural overview of your role..."
                  style={{
                    width: '100%', background: '#201f20', border: '1px solid rgba(83,67,65,0.05)', outline: 'none',
                    color: '#e5e2e3', fontSize: 14, padding: '16px', borderRadius: 8, minHeight: 120, resize: 'none',
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* System Preferences */}
              <div className="mt-8">
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e2e3' }}>System Preferences</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>Default behavior for terminal and logs.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Auto-Deploy Logs', desc: 'Stream logs immediately after build', key: 'autoDeployLogs' },
                  { label: 'Telemetry Mode', desc: 'Send anonymous performance metrics', key: 'telemetryMode' },
                ].map(pref => (
                  <div key={pref.key} className="p-5 flex items-center justify-between" style={cardStyle}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#e5e2e3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{pref.label}</p>
                      <p style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{pref.desc}</p>
                    </div>
                    <button
                      onClick={() => setPrefs({ ...prefs, [pref.key]: !(prefs as any)[pref.key] })}
                      style={{
                        width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
                        background: (prefs as any)[pref.key] ? '#ffa69e' : '#353436',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                        background: '#fff', transition: 'left 0.2s',
                        left: (prefs as any)[pref.key] ? 23 : 3,
                      }} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Performance Strip */}
              <div className="flex items-center gap-8 p-4 mt-4" style={{ background: '#1c1b1c', borderRadius: 12 }}>
                {[
                  { label: 'CPU_LOAD', value: '0.04ms' },
                  { label: 'UPTIME_STREAK', value: '99.998%' },
                  { label: 'NET_THROUGHPUT', value: '1.2GB/s' },
                  { label: 'SESSION_TOKEN', value: '#FF29..X0' },
                ].map((m, i) => (
                  <div key={i} className="flex flex-col">
                    <span style={{ fontSize: 9, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: '#e5e2e3' }}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Save / Discard */}
              <div className="flex items-center justify-between p-4 mt-4" style={cardStyle}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffb4ab' }}>warning</span>
                  <span style={{ fontSize: 12, color: '#71717a' }}>Modifying these parameters may affect system integrity across active deployments.</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => toast.success('Changes discarded')} style={{ fontSize: 11, fontWeight: 700, color: '#71717a', padding: '10px 20px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Discard</button>
                  <button onClick={handleSaveProfile} style={{
                    background: '#ffa69e', color: '#3b0908', padding: '10px 24px', borderRadius: 8,
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer'
                  }}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ SECURITY TAB ═══════════ */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e2e3' }}>Security Settings</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>Manage authentication and access controls.</p>
              </div>

              {/* Change Password */}
              <div className="p-6 space-y-5" style={cardStyle}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ffa69e' }}>lock</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e5e2e3' }}>Change Password</h3>
                </div>
                <div>
                  <label style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    placeholder="••••••••"
                    style={inputStyle}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>New Password</label>
                    <input
                      type="password"
                      value={passwords.newPass}
                      onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                      placeholder="Min 8 characters"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Confirm Password</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="Re-enter password"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (passwords.newPass !== passwords.confirm) {
                      toast.error('Passwords do not match')
                      return
                    }
                    if (passwords.newPass.length < 8) {
                      toast.error('Password must be at least 8 characters')
                      return
                    }
                    if (!passwords.current) {
                      toast.error('Current password is required')
                      return
                    }
                    try {
                      await toast.promise(
                        api.put('/api/auth/change-password', {
                          currentPassword: passwords.current,
                          newPassword: passwords.newPass,
                        }),
                        { loading: 'Updating password...', success: 'Password updated successfully', error: 'Failed to update password' }
                      )
                      setPasswords({ current: '', newPass: '', confirm: '' })
                    } catch (err: any) {
                      // toast.promise already handles the error display
                    }
                  }}
                  style={{
                    background: '#ffa69e', color: '#3b0908', padding: '10px 24px', borderRadius: 8,
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer'
                  }}
                >Update Password</button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="p-6" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ffa69e' }}>security</span>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e5e2e3' }}>Two-Factor Authentication</h3>
                      <p style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: '#71717a', background: '#353436', padding: '4px 10px', borderRadius: 6,
                    }}>Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="p-6 space-y-4" style={cardStyle}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ffa69e' }}>devices</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e5e2e3' }}>Active Sessions</h3>
                </div>
                <div className="p-4 flex items-center justify-between" style={{ background: '#131314', borderRadius: 8 }}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#9be8cb' }}>computer</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e2e3' }}>Current Session</div>
                      <div style={{ fontSize: 11, color: '#71717a', fontFamily: "'JetBrains Mono', monospace" }}>
                        Active now • {typeof window !== 'undefined' ? navigator.userAgent.split(' ').slice(-1)[0]?.split('/')[0] || 'Browser' : 'Browser'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#9be8cb', letterSpacing: '0.15em', textTransform: 'uppercase' }}>ACTIVE</span>
                </div>
                <button
                  onClick={() => toast('Session revocation is not yet available. JWT-based sessions cannot be individually revoked without a token blocklist.', { icon: 'ℹ️', duration: 4000 })}
                  className="w-full py-3 transition-colors hover:bg-[#2a2a2b]"
                  style={{
                    background: 'transparent', borderRadius: 8, border: '1px solid rgba(83,67,65,0.15)',
                    color: '#71717a', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >Revoke All Other Sessions <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 8 }}>COMING SOON</span></button>
              </div>

              {/* API Key Rotation */}
              <div className="p-6" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ffa69e' }}>vpn_key</span>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e5e2e3' }}>API Key Management</h3>
                      <p style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>Rotate or revoke your API keys</p>
                    </div>
                  </div>
                  <Link href="/dashboard/apikeys" style={{
                    background: '#2a2a2b', color: '#e5e2e3', padding: '8px 16px', borderRadius: 8,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    border: '1px solid rgba(83,67,65,0.15)', textDecoration: 'none',
                  }}>Manage Keys</Link>
                </div>
              </div>

              {/* Privacy Links */}
              <div className="flex gap-4">
                <Link href="/privacy" className="flex-1 p-4 flex items-center gap-3 transition-colors hover:bg-[#2a2a2b]" style={{ ...cardStyle, textDecoration: 'none' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#71717a' }}>description</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e2e3' }}>Privacy Policy</span>
                  <span className="material-symbols-outlined ml-auto" style={{ fontSize: 16, color: '#534341' }}>arrow_forward</span>
                </Link>
                <Link href="/terms" className="flex-1 p-4 flex items-center gap-3 transition-colors hover:bg-[#2a2a2b]" style={{ ...cardStyle, textDecoration: 'none' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#71717a' }}>gavel</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e2e3' }}>Terms of Service</span>
                  <span className="material-symbols-outlined ml-auto" style={{ fontSize: 16, color: '#534341' }}>arrow_forward</span>
                </Link>
              </div>
            </div>
          )}

          {/* ═══════════ TEAM TAB ═══════════ */}
          {activeTab === 'team' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e2e3' }}>Team Members</h2>
                  <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>Manage your organization members and roles.</p>
                </div>
                <button
                  onClick={() => toast('Team invitations coming in v2.5', { icon: '📧' })}
                  style={{
                    background: '#ffa69e', color: '#3b0908', padding: '10px 20px', borderRadius: 8,
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                    Invite Member
                  </span>
                </button>
              </div>

              {membersLoading ? (
                <div className="flex gap-3 items-center justify-center py-20" style={{ color: '#ffa69e' }}>
                  <span className="material-symbols-outlined animate-pulse">group</span>
                  <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>Loading team roster...</span>
                </div>
              ) : members.length > 0 ? (
                <div style={{ ...cardStyle, overflow: 'hidden' }}>
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-3" style={{ background: '#1c1b1c', borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
                    <span className="col-span-4" style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Member</span>
                    <span className="col-span-3" style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Role</span>
                    <span className="col-span-3" style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Joined</span>
                    <span className="col-span-2" style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Status</span>
                  </div>
                  {members.map((member: any, i: number) => (
                    <div key={member._id || i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-[#2a2a2b]" style={{ borderBottom: '1px solid rgba(83,67,65,0.03)' }}>
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #ffa69e, #904a45)' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{member.name?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e2e3' }}>{member.name}</div>
                          <div style={{ fontSize: 11, color: '#71717a', fontFamily: "'JetBrains Mono', monospace" }}>{member.email}</div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                          color: member.role === 'admin' ? '#ffa69e' : '#71717a',
                          background: member.role === 'admin' ? 'rgba(255,166,158,0.1)' : '#353436',
                          padding: '4px 10px', borderRadius: 6,
                        }}>{member.role}</span>
                      </div>
                      <div className="col-span-3">
                        <span style={{ fontSize: 12, color: '#71717a', fontFamily: "'JetBrains Mono', monospace" }}>
                          {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                          color: member.isActive ? '#9be8cb' : '#ffb4ab',
                        }}>{member.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20" style={cardStyle}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#353436' }}>group</span>
                  <p style={{ fontSize: 14, color: '#534341', marginTop: 12 }}>No team members found. You are the sole operator.</p>
                </div>
              )}

              {/* Roles Legend */}
              <div className="flex items-center gap-8 p-4" style={{ background: '#1c1b1c', borderRadius: 12 }}>
                {[
                  { role: 'Admin', desc: 'Full access', color: '#ffa69e' },
                  { role: 'Member', desc: 'Read + write', color: '#e5e2e3' },
                  { role: 'Viewer', desc: 'Read only', color: '#71717a' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#e5e2e3' }}>{r.role}</span>
                    <span style={{ fontSize: 10, color: '#71717a' }}>— {r.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ BILLING TAB ═══════════ */}
          {activeTab === 'billing' && (
            <div className="space-y-8">
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e2e3' }}>Billing & Usage</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>Manage your subscription and monitor usage limits.</p>
              </div>

              {billingLoading ? (
                <div className="flex gap-3 items-center justify-center py-20" style={{ color: '#ffa69e' }}>
                  <span className="material-symbols-outlined animate-pulse">payments</span>
                  <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>Loading billing data...</span>
                </div>
              ) : (
                <>
                  {/* Current Plan Card */}
                  <div className="p-6" style={{ ...cardStyle, border: '1px solid rgba(255,166,158,0.15)' }}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Current Plan</span>
                        <h3 style={{ fontSize: 32, fontWeight: 900, color: '#e5e2e3', marginTop: 4, textTransform: 'capitalize' }}>
                          {billing?.plan || 'Free'}
                        </h3>
                      </div>
                      <button
                        onClick={() => toast('Upgrade flow coming in v2.5', { icon: '⚡' })}
                        style={{
                          background: '#ffa69e', color: '#3b0908', padding: '10px 24px', borderRadius: 8,
                          fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
                        }}
                      >Upgrade Plan</button>
                    </div>

                    {/* Usage Bar */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span style={{ fontSize: 11, color: '#71717a', fontWeight: 600 }}>Monthly Request Usage</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#e5e2e3' }}>
                          {(billing?.currentMonthlyLogs || 0).toLocaleString()} / {(billing?.monthlyLogLimit || 5000).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full overflow-hidden" style={{ background: '#131314', height: 8, borderRadius: 99 }}>
                        <div style={{
                          background: 'linear-gradient(to right, #ffa69e, #ffcdc9)',
                          height: '100%',
                          width: `${Math.min(((billing?.currentMonthlyLogs || 0) / (billing?.monthlyLogLimit || 5000)) * 100, 100)}%`,
                          borderRadius: 99,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span style={{ fontSize: 10, color: '#534341', fontFamily: "'JetBrains Mono', monospace" }}>
                          {(((billing?.currentMonthlyLogs || 0) / (billing?.monthlyLogLimit || 5000)) * 100).toFixed(1)}% used
                        </span>
                        <span style={{ fontSize: 10, color: '#534341', fontFamily: "'JetBrains Mono', monospace" }}>
                          {((billing?.monthlyLogLimit || 5000) - (billing?.currentMonthlyLogs || 0)).toLocaleString()} remaining
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plan Comparison */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { name: 'Builder', price: 'Free', limit: '1,000 req/mo', current: billing?.plan === 'free' },
                      { name: 'Pro', price: '₹999/mo', limit: '50,000 req/mo', current: billing?.plan === 'pro' },
                      { name: 'Growth', price: '₹3,999/mo', limit: 'Unlimited', current: billing?.plan === 'growth' },
                    ].map((plan, i) => (
                      <div key={i} className="p-5" style={{
                        ...cardStyle,
                        border: plan.current ? '1px solid rgba(255,166,158,0.3)' : '1px solid rgba(83,67,65,0.05)',
                      }}>
                        <div className="flex items-center justify-between mb-3">
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e2e3' }}>{plan.name}</span>
                          {plan.current && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                              color: '#ffa69e', background: 'rgba(255,166,158,0.1)', padding: '3px 8px', borderRadius: 4,
                            }}>Current</span>
                          )}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: '#e5e2e3' }}>{plan.price}</div>
                        <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>{plan.limit}</div>
                      </div>
                    ))}
                  </div>

                  {/* Billing Disclaimer */}
                  <div className="flex items-center gap-3 p-4" style={{ background: '#1c1b1c', borderRadius: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#71717a' }}>info</span>
                    <span style={{ fontSize: 12, color: '#71717a' }}>
                      Provider API costs (OpenAI, Anthropic, etc.) are billed directly by each provider. Zyra only charges for platform access.
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
