'use client'

import { useState, useEffect } from "react"
import api from "@/lib/api"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [orgData, setOrgData] = useState<any>(null)
  const [profile, setProfile] = useState({ displayName: '', username: '', email: '', bio: '' })
  const [prefs, setPrefs] = useState({ autoDeployLogs: true, telemetryMode: false })
  const [loading, setLoading] = useState(true)

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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'security', label: 'Security', icon: 'shield' },
    { id: 'team', label: 'Team', icon: 'group' },
    { id: 'billing', label: 'Billing', icon: 'payments' },
  ]

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
                onClick={() => setActiveTab(tab.id)}
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
          {activeTab === 'profile' && (
            <div className="space-y-8">
              {/* Public Identity */}
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e2e3' }}>Public Identity</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>Configure how you appear across the infrastructure.</p>
              </div>

              {/* Avatar + Display Name */}
              <div className="flex items-center gap-6 p-6" style={{ background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
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
                    style={{
                      width: '100%', background: '#131314', border: 'none', outline: 'none',
                      color: '#e5e2e3', fontSize: 15, padding: '12px 16px', borderRadius: 8, fontWeight: 500,
                    }}
                  />
                </div>
              </div>

              {/* Username + Email */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Username</label>
                  <div className="flex items-center gap-2" style={{ background: '#201f20', borderRadius: 8, padding: '12px 16px', border: '1px solid rgba(83,67,65,0.05)' }}>
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
                    style={{
                      width: '100%', background: '#201f20', border: '1px solid rgba(83,67,65,0.05)', outline: 'none',
                      color: '#e5e2e3', fontSize: 14, padding: '12px 16px', borderRadius: 8,
                    }}
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
                  <div key={pref.key} className="p-5 flex items-center justify-between" style={{ background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
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
              <div className="flex items-center justify-between p-4 mt-4" style={{ background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffb4ab' }}>warning</span>
                  <span style={{ fontSize: 12, color: '#71717a' }}>Modifying these parameters may affect system integrity across active deployments.</span>
                </div>
                <div className="flex gap-3">
                  <button style={{ fontSize: 11, fontWeight: 700, color: '#71717a', padding: '10px 20px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Discard</button>
                  <button style={{
                    background: '#ffa69e', color: '#3b0908', padding: '10px 24px', borderRadius: 8,
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase'
                  }}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#353436' }}>shield</span>
              <p style={{ fontSize: 14, color: '#534341', marginTop: 12 }}>Security settings coming soon</p>
            </div>
          )}
          {activeTab === 'team' && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#353436' }}>group</span>
              <p style={{ fontSize: 14, color: '#534341', marginTop: 12 }}>Team management coming soon</p>
            </div>
          )}
          {activeTab === 'billing' && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#353436' }}>payments</span>
              <p style={{ fontSize: 14, color: '#534341', marginTop: 12 }}>Billing dashboard coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
