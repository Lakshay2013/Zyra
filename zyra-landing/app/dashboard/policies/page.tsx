'use client'

import { useState, useEffect } from "react"
import api from "@/lib/api"
import toast from "react-hot-toast"
import Link from "next/link"

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer', background: on ? '#ffa69e' : '#353436', transition: 'background 0.2s', flexShrink: 0 }}
    >
      <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: on ? 23 : 3 }} />
    </button>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [orgData, setOrgData] = useState<any>(null)
  const [profile, setProfile] = useState({ displayName: '', username: '', email: '', bio: '' })
  const [loading, setLoading] = useState(true)

  // ── Policies / Optimizer / Reliability ──
  const [policies, setPolicies] = useState<any>(null)
  const [optimizer, setOptimizer] = useState<any>(null)
  const [reliability, setReliability] = useState<any>(null)
  const [savingSection, setSavingSection] = useState<string | null>(null)

  const loadPolicies = async () => {
    try { const r = await api.get('/api/org/policies'); setPolicies(r.data.policies) } catch (e) { console.error(e) }
  }
  const loadOptimizer = async () => {
    try { const r = await api.get('/api/org/optimizer'); setOptimizer(r.data.optimizer) } catch (e) { console.error(e) }
  }
  const loadReliability = async () => {
    try { const r = await api.get('/api/org/reliability'); setReliability(r.data.reliability) } catch (e) { console.error(e) }
  }

  const savePolicies = async () => {
    setSavingSection('policies')
    try {
      const r = await api.put('/api/org/policies', {
        blockPII: policies.blockPII,
        blockInjection: policies.blockInjection,
        blockJailbreak: policies.blockJailbreak,
        maxTokensPerRequest: Number(policies.maxTokensPerRequest),
        sensitiveKeywords: (policies.sensitiveKeywords || []),
      })
      setPolicies(r.data.policies)
      toast.success('Security policies saved')
    } catch { toast.error('Failed to save policies') } finally { setSavingSection(null) }
  }
  const saveOptimizer = async () => {
    setSavingSection('optimizer')
    try {
      const r = await api.put('/api/org/optimizer', {
        autoOptimize: optimizer.autoOptimize,
        qualityTier: optimizer.qualityTier,
      })
      setOptimizer(r.data.optimizer)
      toast.success('Optimization settings saved')
    } catch { toast.error('Failed to save optimizer') } finally { setSavingSection(null) }
  }
  const saveReliability = async () => {
    setSavingSection('reliability')
    try {
      const r = await api.put('/api/org/reliability', {
        enableRetry: reliability.enableRetry,
        maxRetries: Number(reliability.maxRetries),
      })
      setReliability(r.data.reliability)
      toast.success('Reliability settings saved')
    } catch { toast.error('Failed to save reliability') } finally { setSavingSection(null) }
  }

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
    if (tab === 'policies' && !policies) loadPolicies()
    if (tab === 'optimization' && !optimizer) loadOptimizer()
    if (tab === 'reliability' && !reliability) loadReliability()
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'optimization', label: 'Cost Optimization', icon: 'savings' },
    { id: 'reliability', label: 'Reliability', icon: 'shield_with_heart' },
    { id: 'policies', label: 'Policies', icon: 'policy' },
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

              {/* Save */}
              <div className="flex items-center justify-end p-4 mt-4" style={cardStyle}>
                <button onClick={handleSaveProfile} style={{
                  background: '#ffa69e', color: '#3b0908', padding: '10px 24px', borderRadius: 8,
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer'
                }}>Save Changes</button>
              </div>
            </div>
          )}

          {/* ═══════════ COST OPTIMIZATION TAB ═══════════ */}
          {activeTab === 'optimization' && (
            <div className="space-y-6">
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e2e3' }}>Cost Optimization</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>
                  When enabled, Zyra classifies each request's complexity and routes it to the cheapest capable model
                  among the providers you've configured. It never routes above the quality tier you set here.
                </p>
              </div>

              {!optimizer ? (
                <div style={{ ...cardStyle, padding: 24, color: '#71717a', fontSize: 13 }}>Loading…</div>
              ) : (
                <>
                  <div className="p-5 flex items-center justify-between" style={cardStyle}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Auto Optimization</p>
                      <p style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>
                        {optimizer.autoOptimize ? 'Active — requests are routed to cheaper capable models.' : 'Off — requests go to exactly the model you specify.'}
                      </p>
                    </div>
                    <Toggle on={!!optimizer.autoOptimize} onClick={() => setOptimizer({ ...optimizer, autoOptimize: !optimizer.autoOptimize })} />
                  </div>

                  <div className="p-5 space-y-3" style={cardStyle}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Quality Tier Floor</p>
                    <p style={{ fontSize: 12, color: '#71717a' }}>The lowest tier Zyra is allowed to route to. Downgrades never go below this.</p>
                    {[
                      { id: 'economy', label: 'Economy', desc: 'Cheapest models (e.g. GPT-3.5, Claude Haiku, Llama 8B). Best for classification, extraction, short answers.' },
                      { id: 'standard', label: 'Standard', desc: 'Balanced models (e.g. GPT-4o-mini, Claude Sonnet, Llama 70B). Good default for most workloads.' },
                      { id: 'premium', label: 'Premium', desc: 'Most capable models (e.g. GPT-4o, Claude Opus, Gemini Pro). Optimizer only saves within this tier.' },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() => setOptimizer({ ...optimizer, qualityTier: tier.id })}
                        className="w-full text-left p-4 flex items-start gap-3"
                        style={{
                          borderRadius: 8, background: '#131314',
                          border: optimizer.qualityTier === tier.id ? '1px solid #ffa69e' : '1px solid rgba(83,67,65,0.15)',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: optimizer.qualityTier === tier.id ? '#ffa69e' : '#534341' }}>
                          {optimizer.qualityTier === tier.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <span>
                          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>{tier.label}</span>
                          <span style={{ display: 'block', fontSize: 11, color: '#71717a', marginTop: 2 }}>{tier.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 p-4" style={{ background: '#1c1b1c', borderRadius: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#71717a' }}>info</span>
                    <span style={{ fontSize: 12, color: '#71717a' }}>
                      Complexity classification is heuristic (length + keyword based), not an ML model. Savings depend on your
                      workload mix — Zyra routes toward lower-cost capable models, it doesn't guarantee a fixed percentage.
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={saveOptimizer} disabled={savingSection === 'optimizer'} style={{
                      background: '#ffa69e', color: '#3b0908', padding: '10px 24px', borderRadius: 8,
                      fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', opacity: savingSection === 'optimizer' ? 0.6 : 1,
                    }}>{savingSection === 'optimizer' ? 'Saving…' : 'Save Optimization Settings'}</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══════════ RELIABILITY TAB ═══════════ */}
          {activeTab === 'reliability' && (
            <div className="space-y-6">
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e2e3' }}>Reliability</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>
                  Control retry and fallback behaviour. Retries use bounded exponential backoff and only apply to transient
                  errors (429, 5xx, timeouts). The provider fallback order is configured on the Providers page.
                </p>
              </div>

              {!reliability ? (
                <div style={{ ...cardStyle, padding: 24, color: '#71717a', fontSize: 13 }}>Loading…</div>
              ) : (
                <>
                  <div className="p-5 flex items-center justify-between" style={cardStyle}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Automatic Retries</p>
                      <p style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>Retry transient provider failures before falling back.</p>
                    </div>
                    <Toggle on={reliability.enableRetry !== false} onClick={() => setReliability({ ...reliability, enableRetry: !(reliability.enableRetry !== false) })} />
                  </div>

                  <div className="p-5 space-y-3" style={cardStyle}>
                    <div className="flex items-center justify-between">
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Max Retries</p>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: '#ffa69e' }}>{reliability.maxRetries ?? 2}</span>
                    </div>
                    <input
                      type="range" min={0} max={5} step={1}
                      value={reliability.maxRetries ?? 2}
                      onChange={(e) => setReliability({ ...reliability, maxRetries: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: '#ffa69e' }}
                    />
                    <p style={{ fontSize: 11, color: '#71717a' }}>Per-provider retry attempts (0–5) before Zyra moves to the next provider in the fallback order.</p>
                  </div>

                  <a href="/dashboard/providers" className="flex items-center gap-3 p-4" style={{ ...cardStyle, textDecoration: 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffa69e' }}>dns</span>
                    <span style={{ fontSize: 12, color: '#e5e2e3' }}>Configure provider fallback order →</span>
                  </a>

                  <div className="flex justify-end">
                    <button onClick={saveReliability} disabled={savingSection === 'reliability'} style={{
                      background: '#ffa69e', color: '#3b0908', padding: '10px 24px', borderRadius: 8,
                      fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', opacity: savingSection === 'reliability' ? 0.6 : 1,
                    }}>{savingSection === 'reliability' ? 'Saving…' : 'Save Reliability Settings'}</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══════════ POLICIES TAB ═══════════ */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e2e3' }}>Security Policies</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>
                  Pre-flight checks that run before a request is sent to any provider. Blocked requests never reach the provider.
                </p>
              </div>

              {orgData && (
                <div className="p-5 flex items-center justify-between" style={{ ...cardStyle, border: '1px solid rgba(255,166,158,0.25)' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#ffa69e' }}>Demo Mode</p>
                    <p style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>
                      Serve every LLM call from Zyra&apos;s built-in simulator — no provider API key required. Routing, cost, risk analysis and logging all still run for real; responses are templated and clearly flagged as simulated.
                    </p>
                  </div>
                  <Toggle on={!!orgData.demoMode} onClick={async () => {
                    const next = !orgData.demoMode
                    setOrgData({ ...orgData, demoMode: next })
                    try { await api.put('/api/org/settings', { demoMode: next }); toast.success(`Demo mode ${next ? 'on' : 'off'}`) }
                    catch { toast.error('Failed'); setOrgData({ ...orgData, demoMode: !next }) }
                  }} />
                </div>
              )}

              {!policies ? (
                <div style={{ ...cardStyle, padding: 24, color: '#71717a', fontSize: 13 }}>Loading…</div>
              ) : (
                <>
                  <div className="p-5 flex items-center justify-between" style={cardStyle}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Block PII</p>
                      <p style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>
                        Reject prompts containing email, phone, Aadhaar, PAN, credit card, SSN, API keys, passwords or JWT tokens. Regex detection; matched values are never logged.
                      </p>
                    </div>
                    <Toggle on={!!policies.blockPII} onClick={() => setPolicies({ ...policies, blockPII: !policies.blockPII })} />
                  </div>

                  <div className="p-5 flex items-center justify-between" style={cardStyle}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Block Prompt Injection</p>
                      <p style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>
                        Reject prompts that try to override or exfiltrate the system prompt ("ignore previous instructions", "reveal system prompt"). Rule-based, not an ML classifier.
                      </p>
                    </div>
                    <Toggle on={!!policies.blockInjection} onClick={() => setPolicies({ ...policies, blockInjection: !policies.blockInjection })} />
                  </div>

                  <div className="p-5 flex items-center justify-between" style={cardStyle}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Block Jailbreak</p>
                      <p style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>
                        Reject role-play / persona-hijack / "DAN"-style prompts that try to escape the safety policy. Off by default — when off, jailbreaks still flow through and raise the risk score.
                      </p>
                    </div>
                    <Toggle on={!!policies.blockJailbreak} onClick={() => setPolicies({ ...policies, blockJailbreak: !policies.blockJailbreak })} />
                  </div>

                  <div className="p-5 space-y-3" style={cardStyle}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Sensitive Keywords</p>
                    <p style={{ fontSize: 12, color: '#71717a' }}>
                      Comma-separated watch-words. Flagged (not blocked) in the risk report, on top of the built-in list (confidential, credentials, private key…).
                    </p>
                    <input
                      type="text"
                      placeholder="project titan, acquisition, internal-only"
                      value={(policies.sensitiveKeywords || []).join(', ')}
                      onChange={(e) => setPolicies({ ...policies, sensitiveKeywords: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
                      style={inputStyle}
                    />
                  </div>

                  <div className="p-5 space-y-3" style={cardStyle}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e2e3' }}>Max Tokens Per Request</p>
                    <p style={{ fontSize: 12, color: '#71717a' }}>Zyra clamps <code>max_tokens</code> on every forwarded request to this ceiling.</p>
                    <input
                      type="number" min={1} max={32000}
                      value={policies.maxTokensPerRequest ?? 2000}
                      onChange={(e) => setPolicies({ ...policies, maxTokensPerRequest: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4" style={{ background: '#1c1b1c', borderRadius: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#71717a' }}>info</span>
                    <span style={{ fontSize: 12, color: '#71717a' }}>
                      The composite risk score R = 0.35·I + 0.30·J + 0.20·P + 0.15·A is computed asynchronously after every request
                      (see Security &amp; Risk). The toggles above are the only checks that block a request before it leaves Zyra.
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={savePolicies} disabled={savingSection === 'policies'} style={{
                      background: '#ffa69e', color: '#3b0908', padding: '10px 24px', borderRadius: 8,
                      fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', opacity: savingSection === 'policies' ? 0.6 : 1,
                    }}>{savingSection === 'policies' ? 'Saving…' : 'Save Policies'}</button>
                  </div>
                </>
              )}
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
